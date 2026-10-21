import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const formSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  correo: z.string().trim().email().max(254),
  telefono: z.string().trim().regex(/^\+[0-9][0-9 ()-]{6,39}$/, "Incluye el código de país, por ejemplo +507 6000 0000."),
  mensaje: z.string().trim().max(2000),
  website: z.string().max(200).optional(),
});
export const submitVolunteer = createServerFn({ method: "POST" })
  .inputValidator(formSchema)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true };
    const { saveVolunteerRequest } = await import("./volunteer-service.server");
    return saveVolunteerRequest(data);
  });
export const getAdminStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const { isAdminAuthenticated } = await import("./volunteer-service.server");
    return { authenticated: isAdminAuthenticated() };
  });
export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1).max(256) }))
  .handler(async ({ data }) => {
    const { loginAdministrator } = await import("./volunteer-service.server");
    return loginAdministrator(data.password);
  });
export const logoutAdmin = createServerFn({ method: "POST" })
  .handler(async () => {
    const { logoutAdministrator } = await import("./volunteer-service.server");
    return logoutAdministrator();
  });
export const listVolunteerRequests = createServerFn({ method: "GET" })
  .handler(async () => {
    const { listVolunteerRequests } = await import("./volunteer-service.server");
    return listVolunteerRequests();
  });
export const removeVolunteerRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { deleteVolunteerRequest } = await import("./volunteer-service.server");
    return deleteVolunteerRequest(data.id);
  });
