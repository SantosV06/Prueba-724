import { createServerFn } from "@tanstack/react-start";
import { isLanguage, type Language } from "./translate";

export const getDefaultLanguage = createServerFn({ method: "GET" }).handler(
  async (): Promise<Language> => {
    try {
      const { database } = await import("../volunteer-service.server");
      const sql = await database();
      const [row] = await sql.query<{ language: unknown }>(
        "SELECT language FROM site_language WHERE id=1",
      );
      return isLanguage(row?.language) ? row.language : "es";
    } catch {
      console.warn(JSON.stringify({ event: "site-language:unavailable" }));
      return "es";
    }
  },
);
