/** Local QA only. Run against an explicitly started local dev or built preview. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import { TOTP } from "otpauth";
import { catalog } from "../src/lib/i18n/catalog.ts";


const base = process.argv[2] || "http://127.0.0.1:8080";
const parsedBase = new URL(base);
if (
  !["http:", "https:"].includes(parsedBase.protocol) ||
  (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(parsedBase.hostname) &&
    process.env.BROWSER_ALLOW_EXTERNAL_HOST !== "1")
) {
  throw new Error("E2E only targets a local HTTP(S) server unless BROWSER_ALLOW_EXTERNAL_HOST=1.");
}
const built = process.argv.includes("--built");
// GitHub runners do not have write access to /workspace. Keep local QA captures there.
const screenshots = process.env.GITHUB_WORKSPACE
  ? `${process.env.GITHUB_WORKSPACE}/screenshots`
  : "/workspace/screenshots";
mkdirSync(screenshots, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const excludedExternalHosts = new Set();
const errors = [];
try {
  const context = await browser.newContext();
  // Turnstile is an external anti-bot service. In E2E only, replace its browser
  // SDK with a deterministic test double; server-side verification still runs
  // against the official test secret configured in CI.
  await context.route(
    /^https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js(?:\?.*)?$/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: `(() => {
          const token = "XXXX.DUMMY.TOKEN.XXXX";
          window.turnstile = {
            render(container, options = {}) {
              const id = "e2e-turnstile-widget";
              queueMicrotask(() => options.callback?.(token));
              return id;
            },
            reset(widgetId) {},
            remove(widgetId) {},
            getResponse(widgetId) { return token; },
            isExpired(widgetId) { return false; },
          };
          const callbackName = new URL(document.currentScript.src).searchParams.get("onload");
          if (callbackName && typeof window[callbackName] === "function") {
            window[callbackName]();
          }
        })();`,
      });
    },
  );
  // External maps/chrome are outside the local application boundary. Avoid
  // network-dependent failures; no application API or DB call is intercepted.
  await context.route(
    /^https:\/\/(?:www\.google\.com|va\.vercel-scripts\.com)\//,
    async (route) => {
      excludedExternalHosts.add(new URL(route.request().url()).host);
      const script = route.request().resourceType() === "script";
      await route.fulfill({
        status: 200,
        contentType: script ? "application/javascript" : "text/html",
        body: script ? "" : "<p>Mapa externo omitido en QA local.</p>",
      });
    },
  );
  await context.route(/\/_vercel\/(?:insights|speed-insights)\//, (route) => {
    excludedExternalHosts.add("Vercel managed analytics (local preview)");
    return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  if (built) {
    // Exercise the actual deployment CSP against the built HTML, not just its syntax.
    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    const policy = config.headers[0].headers.find(
      (header) => header.key === "Content-Security-Policy",
    ).value;
    await context.route(`${base}/**`, async (route) => {
      if (route.request().resourceType() !== "document") return route.fallback();
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          "content-security-policy": response.headers()["content-security-policy"] ?? policy,
        },
      });
    });
  }
  for (const [language, expected] of [
    ["en", "We are Fundación VNE, Venezuela Nueva Esperanza."],
    ["pt", "Somos a Fundación VNE, Venezuela Nueva Esperanza."],
  ]) {
    const response = await fetch(`${base}/?lang=${language}`);
    const html = await response.text();
    if (built) {
      const policy = response.headers.get("content-security-policy") ?? "";
      assert.ok(policy.includes("'nonce-"), "built HTML uses a response nonce");
      assert.ok(
        !policy.split("script-src ")[1].split(";")[0].includes("unsafe-inline"),
        "inline scripts require a nonce",
      );
    }
    assert.ok(html.includes(`lang="${language}"`), "locale is rendered on the server");
    if (language === "en")
      assert.ok(html.includes(expected), "translated content exists before JavaScript");
  }
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) =>
    errors.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const [name, width, height] of [
    ["desktop", 1280, 800],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      Object.keys(document.querySelector("button[aria-controls=menu-movil]") ?? {}).some((key) =>
        key.startsWith("__reactProps"),
      ),
    );
    assert.ok((await page.locator("body").innerText()).length > 1000);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `${screenshots}/vne-${built ? "built" : "dev"}-${name}.png` });
    const video = page.locator("video").first();
    assert.equal(await video.getAttribute("preload"), "none");
    assert.ok(await video.getAttribute("poster"));
    if (name === "desktop") {
      await video.scrollIntoViewIfNeeded();
      await video.evaluate((node) => node.play());
      await video.evaluate(
        (node) =>
          new Promise((resolve) => {
            node.addEventListener("pause", resolve, { once: true });
            node.pause();
          }),
      );
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      await page.waitForTimeout(150);
      assert.equal(
        await video.evaluate((node) => node.paused),
        true,
        "manual pause survives visibility changes",
      );
    }
    if (name === "mobile") {
      const menu = page.getByRole("button", { name: "Menú", exact: true });
      await menu.click();
      await page.getByRole("navigation", { name: "Móvil" }).getByRole("link").first().waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("navigation", { name: "Móvil" }).count(), 0);
      assert.ok(await menu.evaluate((node) => node === document.activeElement));
      await menu.click();
      await page
        .getByRole("navigation", { name: "Móvil" })
        .getByRole("link", { name: "Casas VNE" })
        .click();
      await page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(await page.getByRole("navigation", { name: "Móvil" }).count(), 0);
    }
  }
  async function chooseLanguage(label) {
    await page.getByRole("combobox", { name: /^(Idioma|Language)$/ }).selectOption({
      label: `${label === "Español" ? "ES" : label === "English" ? "EN" : "PT"} · ${label}`,
    });
  }
  await chooseLanguage("English");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.equal(
    await page.getByRole("heading", { level: 1 }).innerText(),
    "An integrated system for social and economic development.",
  );
  assert.ok((await page.title()).includes("Self-sustaining"));
  const paths = [
    "/",
    "/casas",
    "/genesis",
    "/liderazgo",
    "/soporte",
    "/donaciones",
    "/voluntariado",
    "/legal/privacidad",
    "/legal/terminos",
    "/legal/conflicto",
    "/legal/no-discriminacion",
  ];
  for (const [language, label] of [
    ["en", "English"],
    ["pt", "Português"],
  ]) {
    await chooseLanguage(label);
    for (const path of paths) {
      await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction((lang) => document.documentElement.lang === lang, language);
      const untranslated = await page.locator("main").evaluate(
        (root, translations) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const missing = [];
          while (walker.nextNode()) {
            const text = walker.currentNode.textContent.replace(/\s+/g, " ").trim();
            if (translations[text] && translations[text] !== text) missing.push(text);
          }
          return missing;
        },
        Object.fromEntries(
          Object.entries(catalog).map(([key, values]) => [key, values[language === "en" ? 0 : 1]]),
        ),
      );
      assert.deepEqual(untranslated, [], `Untranslated content on ${path} in ${language}`);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        `Overflow on ${path} in ${language}`,
      );
    }
  }
  await page.goto(`${base}/voluntariado`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.lang === "pt");
  await page.getByLabel("Nome", { exact: true }).fill("Nombre sin traducir");
  await chooseLanguage("English");
  assert.equal(
    await page.getByLabel("First name", { exact: true }).inputValue(),
    "Nombre sin traducir",
  );
  await page.getByRole("button", { name: "Register application", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Complete your first name" }).waitFor();
  await chooseLanguage("Español");
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await chooseLanguage("English");
  await page.screenshot({ path: `${screenshots}/vne-${built ? "built" : "dev"}-english.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await chooseLanguage("Português");
  await page.screenshot({
    path: `${screenshots}/vne-${built ? "built" : "dev"}-portuguese-mobile.png`,
  });
  await page.setViewportSize({ width: 320, height: 740 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
  );
  await chooseLanguage("Español");
  // A blocked preference store must not break language switching or hydration.
  const blocked = await browser.newContext();
  await blocked.route(
    /^https:\/\/(?:www\.google\.com|va\.vercel-scripts\.com)\//,
    (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
  await blocked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(base, { waitUntil: "domcontentloaded" });
  await blockedPage.getByRole("combobox", { name: "Idioma", exact: true }).selectOption("en");
  await blockedPage.waitForFunction(() => document.documentElement.lang === "en");
  await blocked.close();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Usar tema oscuro" }).click();
  assert.equal(await page.locator("html").getAttribute("class"), "dark");
  await page.getByRole("button", { name: "Usar tema claro" }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}/voluntariado`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Registrar solicitud" }).click();
  await page.getByRole("alert").filter({ hasText: "Completa nombre" }).waitFor();
  {
    assert.ok(
      process.env.E2E_ADMIN_PASSWORD,
      "Supply a local test password; never use production credentials here.",
    );
    const suffix = Date.now();
    await page.getByLabel("Nombre", { exact: true }).fill(`Prueba ${suffix}`);
    await page.getByLabel("Apellido", { exact: true }).fill("Automatizada");
    await page.getByLabel("Correo", { exact: true }).fill(`qa-${suffix}@example.com`);
    await page.getByLabel("Teléfono", { exact: false }).fill("+507 6000 0000");
    await page
      .getByLabel("Cómo puedes aportar")
      .fill("Solicitud local desechable para comprobar el flujo completo.");
    await page.getByRole("button", { name: "Registrar solicitud" }).click();
    // If the server rejects the submission, report the visible form error instead
    // of hiding the actionable cause behind a generic 30-second heading timeout.
    const successHeading = page.getByRole("heading", { name: "Solicitud registrada" });
    const formAlert = page.getByRole("alert");
    const submissionResult = await Promise.race([
      successHeading.waitFor({ state: "visible", timeout: 30_000 }).then(() => "success"),
      formAlert.waitFor({ state: "visible", timeout: 30_000 }).then(() => "error"),
    ]);
    if (submissionResult === "error") {
      throw new Error(`Volunteer submission rejected: ${(await formAlert.innerText()).trim()}`);
    }
    await page.goto(`${base}/solicitudes`, { waitUntil: "domcontentloaded" });
    await chooseLanguage("English");
    await page.getByRole("heading", { name: "Volunteer applications", exact: true }).waitFor();
    await page.getByLabel("Administrator password", { exact: true }).waitFor();
    await chooseLanguage("Português");
    await page.getByRole("heading", { name: "Inscrições de voluntariado", exact: true }).waitFor();
    await page.getByLabel("Senha administrativa", { exact: true }).waitFor();
    await chooseLanguage("Español");
    await page.getByLabel("Usuario", { exact: true }).fill("admin");
    await page.getByLabel("Contraseña administrativa").fill(process.env.E2E_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    const row = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: `Prueba ${suffix} Automatizada` }) });
    await row.waitFor();
    await page.getByRole("button", { name: "Herramientas del propietario", exact: true }).click();
    await page.getByText("Cuentas activas con 2FA", { exact: false }).waitFor();
    const securityTool = page.getByRole("button", { name: "Seguridad del equipo", exact: true });
    await securityTool.click();
    assert.equal(await securityTool.getAttribute("aria-expanded"), "false");
    assert.equal(await page.getByText("Cuentas activas con 2FA", { exact: false }).count(), 0);
    await securityTool.click();
    await page.getByText("Cuentas activas con 2FA", { exact: false }).waitFor();
    const languageTool = page.getByRole("button", { name: "Idioma predeterminado", exact: true });
    await languageTool.click();
    const defaultLanguage = page.getByLabel("Idioma predeterminado", { exact: true });
    await defaultLanguage.waitFor({ state: "visible" });
    await page.waitForFunction(
      () => !document.querySelector("#owner-tool-language select")?.disabled,
    );
    for (const language of ["en", "pt", "es"]) {
      await defaultLanguage.selectOption(language);
      await page
        .getByRole("button", { name: "Guardar idioma predeterminado", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Idioma predeterminado guardado." })
        .waitFor();
      const fresh = await fetch(base);
      const html = await fresh.text();
      assert.ok(html.includes(`lang="${language}"`), "default locale is rendered on a fresh visit");
      const explicit = await fetch(`${base}/?lang=es`);
      assert.ok((await explicit.text()).includes('lang="es"'), "explicit locale overrides default");
      const preference = await fetch(base, { headers: { cookie: "vne-language=es" } });
      assert.ok(
        (await preference.text()).includes('lang="es"'),
        "saved preference overrides default",
      );
    }
    await languageTool.click();
    assert.equal(await defaultLanguage.count(), 0);
    await page.getByRole("button", { name: "Historial de actividad", exact: true }).click();
    await page.getByLabel("Acción exacta", { exact: true }).fill("login:success");
    const tools = page.getByRole("region", { name: "Herramientas del propietario", exact: true });
    await tools.getByRole("button", { name: "Buscar", exact: true }).click();
    await tools.locator("strong").filter({ hasText: "login:success" }).first().waitFor();
    await page.getByRole("button", { name: "Editar portada", exact: true }).click();
    const homepageTitle = page.getByLabel("Título de portada (es)", { exact: true });
    await homepageTitle.waitFor();
    await page.waitForFunction(
      () =>
        ![...document.querySelectorAll("input")].find(
          (x) => x.value === "Somos Fundación VNE, Venezuela Nueva Esperanza.",
        )?.disabled,
    );
    const originalTitle = await homepageTitle.inputValue();
    await homepageTitle.fill(`Portada QA ${suffix}`);
    await page.getByRole("button", { name: "Guardar portada", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Portada guardada" }).waitFor();
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: `Portada QA ${suffix}` }).waitFor();
    await page.goto(`${base}/solicitudes`, { waitUntil: "domcontentloaded" });
    await row.waitFor();
    await page.getByRole("button", { name: "Herramientas del propietario", exact: true }).click();
    await page.getByRole("button", { name: "Editar portada", exact: true }).click();
    await homepageTitle.waitFor();
    await homepageTitle.fill(originalTitle);
    await page.getByRole("button", { name: "Guardar portada", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Portada guardada" }).waitFor();
    await page.getByRole("button", { name: "Ocultar herramientas", exact: true }).click();
    await row.getByRole("combobox").selectOption("contactada");
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")]
        .filter((x) => x.textContent === "Mover a papelera")
        .every((x) => !x.disabled),
    );
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar resultados CSV" }).click();
    const csv = await download;
    assert.equal(csv.suggestedFilename(), "voluntarios-vne.csv");
    await page.screenshot({ path: `${screenshots}/vne-admin.png`, fullPage: true });
    await page.getByRole("button", { name: "Administrar usuarios", exact: true }).click();
    await page.getByLabel("Nombre de la persona", { exact: true }).fill("Equipo de prueba");
    await page.getByLabel("Nuevo usuario", { exact: true }).fill(`equipo-${suffix}`);
    await page
      .getByLabel("Contraseña del nuevo usuario", { exact: true })
      .fill("test-team-password-1234");
    await page.getByRole("button", { name: "Crear usuario", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Usuario creado" }).waitFor();
    await page.screenshot({ path: `${screenshots}/vne-accounts.png`, fullPage: true });
    await page
      .getByRole("button", { name: `Cambiar contraseña de equipo-${suffix}`, exact: true })
      .click();
    await page
      .getByLabel(`Nueva contraseña de equipo-${suffix}`, { exact: true })
      .fill("test-replacement-password-1234");
    await page.getByRole("button", { name: "Guardar contraseña", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Contraseña actualizada" }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Desactivar equipo-${suffix}`, exact: true }).click();
    await page.getByRole("button", { name: `Activar equipo-${suffix}`, exact: true }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Activar equipo-${suffix}`, exact: true }).click();
    await page.getByRole("button", { name: `Desactivar equipo-${suffix}`, exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `${screenshots}/vne-accounts-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("button", { name: "Ocultar usuarios", exact: true }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Mover a papelera" }).click();
    await page.getByRole("button", { name: "Ver papelera" }).click();
    await row.getByRole("button", { name: "Restaurar" }).click();
    await page.getByRole("button", { name: "Ver solicitudes activas" }).click();
    await row.waitFor();
    if (process.env.E2E_TOTP_ENABLED === "true") {
      await page.locator("summary").filter({ hasText: "Seguridad de mi cuenta" }).click();
      await page
        .locator("details")
        .filter({ has: page.locator("summary").filter({ hasText: "Seguridad de mi cuenta" }) })
        .getByLabel("Contraseña actual", { exact: true })
        .fill(process.env.E2E_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Configurar autenticador", exact: true }).click();
      const qr = page.getByRole("img", {
        name: "Código QR para configurar tu autenticador de Fundación VNE",
      });
      await qr.waitFor();
      assert.ok(await qr.evaluate((image) => image.complete && image.naturalWidth > 0));
      const secret = await page.locator("details code").innerText();
      const otp = new TOTP({ secret, algorithm: "SHA1", digits: 6, period: 30 });
      for (const [name, width, height] of [
        ["desktop", 1280, 900],
        ["mobile", 390, 844],
      ]) {
        await page.setViewportSize({ width, height });
        await qr.scrollIntoViewIfNeeded();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: `${screenshots}/vne-totp-${built ? "built" : "dev"}-${name}.png`,
        });
      }
      await page.getByLabel("Código del autenticador", { exact: true }).fill(otp.generate());
      await page.getByRole("button", { name: "Confirmar y activar 2FA", exact: true }).click();
      await page
        .getByRole("heading", {
          name: "2FA activado: guarda tus códigos de recuperación",
          exact: true,
        })
        .waitFor();
      const codes = (await page.locator("pre").innerText()).trim().split("\n");
      assert.equal(codes.length, 10);
      assert.equal(await row.count(), 0, "enrollment revokes access and clears volunteer data");
      await page.getByLabel("He guardado mis códigos de recuperación", { exact: true }).check();
      await page.getByRole("button", { name: "Volver al inicio de sesión", exact: true }).click();
      await page
        .getByLabel("Contraseña administrativa", { exact: true })
        .fill(process.env.E2E_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
      await page
        .getByLabel("Código del autenticador o de recuperación", { exact: false })
        .fill(otp.generate({ timestamp: Date.now() + 30000 }));
      assert.equal(await row.count(), 0, "password alone never opens the panel");
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
      await row.waitFor();
      await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
      await page
        .getByLabel("Contraseña administrativa", { exact: true })
        .fill(process.env.E2E_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
      await page
        .getByLabel("Código del autenticador o de recuperación", { exact: false })
        .fill(codes[0]);
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
      await row.waitFor();
      await page.locator("summary").filter({ hasText: "Seguridad de mi cuenta" }).click();
      await page
        .getByText("2FA activo. Códigos de recuperación restantes: 9.", { exact: true })
        .waitFor();
      await page
        .locator("details")
        .filter({ has: page.locator("summary").filter({ hasText: "Seguridad de mi cuenta" }) })
        .getByLabel("Contraseña actual", { exact: true })
        .fill(process.env.E2E_ADMIN_PASSWORD);
      await page
        .getByLabel("Código del autenticador o de recuperación", { exact: true })
        .fill(codes[1]);
      await page
        .getByRole("button", { name: "Desactivar 2FA y cerrar sesiones", exact: true })
        .click();
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).waitFor();
      await page
        .getByLabel("Contraseña administrativa", { exact: true })
        .fill(process.env.E2E_ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
      await row.waitFor();
      await page.setViewportSize({ width: 1280, height: 900 });
    }
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.getByRole("button", { name: "Iniciar sesión" }).waitFor();
    await page.getByLabel("Usuario", { exact: true }).fill(`equipo-${suffix}`);
    await page.getByLabel("Contraseña administrativa").fill("test-replacement-password-1234");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await row.waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Administrar usuarios", exact: true }).count(),
      0,
    );
    await page.locator("summary").filter({ hasText: "Cambiar mi contraseña" }).click();
    const passwordForm = page
      .locator("details")
      .filter({ has: page.locator("summary").filter({ hasText: "Cambiar mi contraseña" }) });
    await passwordForm
      .getByLabel("Contraseña actual", { exact: true })
      .fill("test-replacement-password-1234");
    await passwordForm
      .getByLabel("Nueva contraseña", { exact: true })
      .fill("test-self-password-12345");
    await passwordForm
      .getByLabel("Repetir nueva contraseña", { exact: true })
      .fill("test-self-password-12345");
    await page.getByRole("button", { name: "Guardar mi contraseña", exact: true }).click();
    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).waitFor();
    await page
      .getByLabel("Contraseña administrativa", { exact: true })
      .fill("test-self-password-12345");
    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
    await row.waitFor();
    await context.clearCookies();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).waitFor();
    assert.equal(await row.count(), 0, "session expiry clears personal data from the screen");
  }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: built ? "built" : "dev",
        errors,
        excludedExternalHosts: [...excludedExternalHosts],
        checked: [
          "desktop/mobile render",
          "mobile menu",
          "themes",
          "validation",
          "all public pages in English and Portuguese",
          "language persistence and translated metadata",
          "form values survive language changes",
          "language switching with blocked storage",
          "owner audit viewer and role restrictions",
          "homepage editor publishes and restores content",
          "server-rendered language URLs",
          "own password change revokes sessions",
          "owner creates accounts",
          "password reset",
          ...(process.env.E2E_TOTP_ENABLED === "true"
            ? [
                "TOTP enrollment and QR on desktop/mobile",
                "password alone cannot open 2FA panel",
                "TOTP login",
                "one-use recovery login",
                "disable 2FA with a different recovery code",
              ]
            : []),
          "disable and reactivate account",
          "new account login and role restrictions",
          ...[
            "form to PostgreSQL",
            "admin login",
            "administration translated into English and Portuguese",
            "expired session clears personal data",
            "status update",
            "CSV download",
            "trash and restore",
            "logout",
          ],
        ],
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(JSON.stringify({ errors }, null, 2));
  throw error;
} finally {
  await browser.close();
}
