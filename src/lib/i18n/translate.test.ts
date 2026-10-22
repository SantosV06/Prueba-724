import { readFile } from "node:fs/promises";
import { adminCatalog } from "./admin-catalog.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { translate, isLanguage } from "./translate.ts";
import { catalog } from "./catalog.ts";
import { legalPages } from "../../data/site.ts";

test("language validation and source fallback never alter unknown or original Spanish text", () => {
  assert.ok(isLanguage("es") && isLanguage("en") && isLanguage("pt"));
  for (const value of ["EN", "fr", null, "<script>"]) assert.equal(isLanguage(value), false);
  assert.equal(translate("  Inicio ", "es"), "  Inicio ");
  assert.equal(translate("  Inicio ", "en"), "  Home ");
  assert.equal(translate("Inicio", "pt"), "Início");
  assert.equal(translate("info@foundationvne.com", "en"), "info@foundationvne.com");
  assert.equal(translate("Fundación VNE", "pt"), "Fundación VNE");
  assert.equal(translate("Texto nuevo sin traducción", "en"), "Texto nuevo sin traducción");
});
test("both translations cover every published legal title, description, paragraph and list", () => {
  for (const page of Object.values(legalPages)) {
    const texts = [
      page.title,
      page.description,
      ...page.blocks.flatMap((block) => [
        block.heading,
        ...block.paragraphs,
        ...(block.list ?? []),
      ]),
    ].filter((text): text is string => !!text);
    for (const text of texts) {
      assert.ok(catalog[text], `Missing legal translation: ${text}`);
      assert.ok(catalog[text][0].trim());
      assert.ok(catalog[text][1].trim());
    }
  }
});

test("administrative labels have both translations without translating personal data", async () => {
  for (const filename of [
    "../../routes/solicitudes.tsx",
    "../../components/admin-accounts.tsx",
    "../../components/admin-two-factor.tsx",
    "../../components/admin-operations.tsx",
  ]) {
    const source = await readFile(new URL(filename, import.meta.url), "utf8");
    for (const match of source.matchAll(/\bt\(("(?:[^"\\]|\\.)*")\)/g)) {
      const text = JSON.parse(match[1]);
      const entry = adminCatalog[text.trim()] ?? catalog[text.trim()];
      assert.ok(entry, `Missing panel translation: ${text}`);
      assert.ok(entry[0].trim() && entry[1].trim());
    }
  }
});
