import type { HomeContent } from "./admin-operations";
import { translate } from "./i18n/translate";
const title = "Somos Fundación VNE, Venezuela Nueva Esperanza.";
const description =
  "Empresa con propósito social. Diseñamos e implementamos proyectos de desarrollo sostenible mediante actividad productiva, alianzas y programas de servicio — no asistencia de corto plazo.";
export const defaultHomeContent: HomeContent = {
  title: { es: title, en: translate(title, "en"), pt: translate(title, "pt") },
  description: {
    es: description,
    en: translate(description, "en"),
    pt: translate(description, "pt"),
  },
};
