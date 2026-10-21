/** Local QA only. Run against an explicitly started local dev or built preview. */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { checkedUrl } from "./browser-guard.mjs";

const base = checkedUrl(process.argv[2] || "http://127.0.0.1:8080");
const built = process.argv.includes("--built");
const screenshots = "/workspace/screenshots";
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
  // External maps/chrome are outside the local application boundary. Avoid
  // network-dependent failures; no application API or DB call is intercepted.
  await context.route(/^https:\/\/(?:www\.google\.com|grok\.com)\//, async (route) => {
    excludedExternalHosts.add(new URL(route.request().url()).host);
    const script = route.request().resourceType() === "script";
    await route.fulfill({
      status: 200,
      contentType: script ? "application/javascript" : "text/html",
      body: script ? "" : "<p>Mapa externo omitido en QA local.</p>",
    });
  });
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
    if (name === "mobile") {
      await page.getByRole("button", { name: "Menú", exact: true }).click();
      await page
        .getByRole("navigation", { name: "Móvil" })
        .getByRole("link", { name: "Casas VNE" })
        .click();
      await page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(await page.getByRole("navigation", { name: "Móvil" }).count(), 0);
    }
  }
  await page.getByRole("button", { name: "Usar tema oscuro" }).click();
  assert.equal(await page.locator("html").getAttribute("class"), "dark");
  await page.getByRole("button", { name: "Usar tema claro" }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}/voluntariado`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Registrar solicitud" }).click();
  await page.getByRole("alert").filter({ hasText: "Completa nombre" }).waitFor();
  if (!built) {
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
    await page.getByRole("heading", { name: "Solicitud registrada" }).waitFor();
    await page.goto(`${base}/solicitudes`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Contraseña administrativa").fill(process.env.E2E_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    const row = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: `Prueba ${suffix} Automatizada` }) });
    await row.waitFor();
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
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Mover a papelera" }).click();
    await page.getByRole("button", { name: "Ver papelera" }).click();
    await row.getByRole("button", { name: "Restaurar" }).click();
    await page.getByRole("button", { name: "Ver solicitudes activas" }).click();
    await row.waitFor();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.getByRole("button", { name: "Iniciar sesión" }).waitFor();
  } else {
    await page.goto(`${base}/solicitudes`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Iniciar sesión" }).waitFor();
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
          ...(built
            ? ["admin login screen"]
            : [
                "form to PostgreSQL",
                "admin login",
                "status update",
                "CSV download",
                "trash and restore",
                "logout",
              ]),
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
