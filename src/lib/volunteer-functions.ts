import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { volunteerSchema, requestFiltersSchema, requestStatusSchema } from "./volunteer-schema";

export const submitVolunteer = createServerFn({ method: "POST" })
  .inputValidator(volunteerSchema)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true };
    const { saveVolunteerRequest } = await import("./volunteer-service.server");
    return saveVolunteerRequest(data);
  });
export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isAdminAuthenticated } = await import("./volunteer-service.server");
  return { authenticated: await isAdminAuthenticated() };
});
export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1).max(256) }))
  .handler(async ({ data }) => {
    const { loginAdministrator } = await import("./volunteer-service.server");
    return loginAdministrator(data.password);
  });
export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutAdministrator } = await import("./volunteer-service.server");
  return logoutAdministrator();
});
export const listVolunteerRequests = createServerFn({ method: "GET" })
  .inputValidator(requestFiltersSchema)
  .handler(async ({ data }) => {
    const { listVolunteerRequests } = await import("./volunteer-service.server");
    return listVolunteerRequests(data);
  });
export const exportVolunteerRequests = createServerFn({ method: "GET" })
  .inputValidator(
    requestFiltersSchema.omit({ page: true }).extend({
      cursor: z
        .object({ fecha: z.string().datetime({ offset: true }), id: z.string().uuid() })
        .optional(),
      snapshot: z.string().datetime({ offset: true }).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { exportVolunteerRequests } = await import("./volunteer-service.server");
    return exportVolunteerRequests(data, data.cursor, data.snapshot);
  });
export const removeVolunteerRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { changeVolunteerRequest } = await import("./volunteer-service.server");
    return changeVolunteerRequest(data.id, "trash");
  });
export const restoreVolunteerRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { changeVolunteerRequest } = await import("./volunteer-service.server");
    return changeVolunteerRequest(data.id, "restore");
  });
export const updateVolunteerStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), status: requestStatusSchema }))
  .handler(async ({ data }) => {
    const { changeVolunteerRequest } = await import("./volunteer-service.server");
    return changeVolunteerRequest(data.id, "status", data.status);
  });
