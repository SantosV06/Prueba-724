import { z } from "zod";
import { isInternationalPhone, normalizePhone } from "./phone.ts";

export const volunteerSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre.").max(100),
  apellido: z.string().trim().min(1, "Escribe tu apellido.").max(100),
  correo: z.string().trim().email("Escribe un correo válido.").max(254),
  telefono: z
    .string()
    .trim()
    .max(40)
    .refine(
      isInternationalPhone,
      "Incluye el código de país y entre 8 y 15 dígitos, por ejemplo +507 6000 0000.",
    )
    .transform(normalizePhone),
  mensaje: z.string().trim().max(2000, "El mensaje admite hasta 2000 caracteres."),
  requestKey: z.string().uuid(),
  website: z.string().max(200).optional(),
});
export const requestStatusSchema = z.enum(["pendiente", "contactada", "aceptada", "descartada"]);
export const requestFiltersSchema = z.object({
  page: z.number().int().min(1).max(100000).default(1),
  search: z.string().trim().max(100).default(""),
  status: z.union([requestStatusSchema, z.literal("")]).default(""),
  trash: z.boolean().default(false),
});
export type VolunteerInput = z.infer<typeof volunteerSchema>;
export type RequestFilters = z.infer<typeof requestFiltersSchema>;
export type RequestStatus = z.infer<typeof requestStatusSchema>;
export type VolunteerRequest = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  mensaje: string;
  fecha: string;
  status: RequestStatus;
};
