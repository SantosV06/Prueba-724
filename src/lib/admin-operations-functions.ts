import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { auditFiltersSchema, homeContentSchema, siteLanguageSchema } from "./admin-operations";
import { accountPasswordSchema } from "./admin-accounts";

export const getAuditEvents = createServerFn({ method: "GET" })
  .validator(auditFiltersSchema)
  .handler(async ({ data }) => {
    const service = await import("./admin-operations.server");
    return service.listAuditEvents(data);
  });
export const getOperationsStatus = createServerFn({ method: "GET" }).handler(async () => {
  const service = await import("./admin-operations.server");
  return service.operationsStatus();
});
export const setTwoFactorPolicy = createServerFn({ method: "POST" })
  .validator(z.object({ required: z.boolean(), password: z.string().min(1).max(256) }))
  .handler(async ({ data }) => {
    const service = await import("./admin-operations.server");
    return service.updateTwoFactorPolicy(data.required, data.password);
  });
export const changeMyPassword = createServerFn({ method: "POST" })
  .validator(
    z.object({ currentPassword: z.string().min(1).max(256), password: accountPasswordSchema }),
  )
  .handler(async ({ data }) => {
    const service = await import("./admin-operations.server");
    return service.changeOwnPassword(data.currentPassword, data.password);
  });
export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  const service = await import("./admin-operations.server");
  return service.readHomeContent();
});
export const updateHomeContent = createServerFn({ method: "POST" })
  .validator(z.object({ content: homeContentSchema, revision: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    const service = await import("./admin-operations.server");
    return service.saveHomeContent(data.content, data.revision);
  });

export const getSiteLanguage = createServerFn({ method: "GET" }).handler(async () => {
  const service = await import("./admin-operations.server");
  return service.readSiteLanguage();
});
export const updateSiteLanguage = createServerFn({ method: "POST" })
  .validator(siteLanguageSchema)
  .handler(async ({ data }) => {
    const service = await import("./admin-operations.server");
    return service.saveSiteLanguage(data.language, data.revision);
  });
