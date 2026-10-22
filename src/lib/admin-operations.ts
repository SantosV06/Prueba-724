import { z } from "zod";

export const auditFiltersSchema = z.object({
  page: z.number().int().min(1).max(100000).default(1),
  actor: z.string().trim().max(50).default(""),
  action: z.string().trim().max(60).default(""),
});
export type AuditFilters = z.infer<typeof auditFiltersSchema>;
export type AuditEvent = {
  id: string;
  action: string;
  actor: string | null;
  requestId: string | null;
  date: string;
};
const localizedText = (max: number) =>
  z.object({
    es: z.string().trim().min(1).max(max),
    en: z.string().trim().min(1).max(max),
    pt: z.string().trim().min(1).max(max),
  });
export const homeContentSchema = z.object({
  title: localizedText(160),
  description: localizedText(700),
});
export type HomeContent = z.infer<typeof homeContentSchema>;
