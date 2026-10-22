import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { usernameSchema, createAccountSchema, accountPasswordSchema } from "./admin-accounts";
import { volunteerSchema, requestFiltersSchema, requestStatusSchema } from "./volunteer-schema";

export const submitVolunteer = createServerFn({ method: "POST" })
  .validator(volunteerSchema)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true };
    const { saveVolunteerRequest } = await import("./volunteer-service.server");
    return saveVolunteerRequest(data);
  });
export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { currentAdministrator } = await import("./volunteer-service.server");
  const user = await currentAdministrator();
  return { authenticated: !!user, user };
});
export const loginAdmin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      username: usernameSchema.default("admin"),
      password: z.string().min(1).max(256),
      code: z.string().trim().max(100).default(""),
    }),
  )
  .handler(async ({ data }) => {
    const { loginAdministrator } = await import("./volunteer-service.server");
    return loginAdministrator(data.password, data.username, data.code);
  });
export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutAdministrator } = await import("./volunteer-service.server");
  return logoutAdministrator();
});
export const listVolunteerRequests = createServerFn({ method: "GET" })
  .validator(requestFiltersSchema)
  .handler(async ({ data }) => {
    const { listVolunteerRequests } = await import("./volunteer-service.server");
    return listVolunteerRequests(data);
  });
// Export writes an audit event and must pass the same origin checks as mutations.
export const exportVolunteerRequests = createServerFn({ method: "POST" })
  .validator(
    requestFiltersSchema.omit({ page: true }).extend({
      exportId: z.string().uuid().optional(),
      cursor: z
        .object({ fecha: z.string().datetime({ offset: true }), id: z.string().uuid() })
        .optional(),
      snapshot: z.string().datetime({ offset: true }).optional(),
      revision: z
        .string()
        .regex(/^\d{1,20}$/)
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { exportVolunteerRequests } = await import("./volunteer-service.server");
    return exportVolunteerRequests(data, data.cursor, data.snapshot, data.revision, data.exportId);
  });
export const removeVolunteerRequest = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { changeVolunteerRequest } = await import("./volunteer-service.server");
    return changeVolunteerRequest(data.id, "trash");
  });
export const restoreVolunteerRequest = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { changeVolunteerRequest } = await import("./volunteer-service.server");
    return changeVolunteerRequest(data.id, "restore");
  });
export const updateVolunteerStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), status: requestStatusSchema }))
  .handler(async ({ data }) => {
    const { changeVolunteerRequest } = await import("./volunteer-service.server");
    return changeVolunteerRequest(data.id, "status", data.status);
  });

export const getAdminAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const { listAdminAccounts } = await import("./volunteer-service.server");
  return listAdminAccounts();
});
export const createAdminAccount = createServerFn({ method: "POST" })
  .validator(createAccountSchema)
  .handler(async ({ data }) => {
    const { createAdminAccount } = await import("./volunteer-service.server");
    return createAdminAccount(data);
  });
export const updateAdminAccount = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        id: z.string().uuid(),
        enabled: z.boolean().optional(),
        password: accountPasswordSchema.optional(),
      })
      .refine((data) => (data.enabled !== undefined) !== (data.password !== undefined)),
  )
  .handler(async ({ data }) => {
    const { updateAdminAccount } = await import("./volunteer-service.server");
    return updateAdminAccount(data);
  });
export const purgeVolunteerRequest = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { changeVolunteerRequest } = await import("./volunteer-service.server");
    return changeVolunteerRequest(data.id, "purge");
  });
