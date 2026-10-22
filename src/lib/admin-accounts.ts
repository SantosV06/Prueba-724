import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9._-]{2,49}$/,
    "El usuario debe tener de 3 a 50 caracteres: letras, números, punto, guion o guion bajo.",
  );
export const accountPasswordSchema = z
  .string()
  .min(14, "Usa una contraseña de al menos 14 caracteres.")
  .max(256);
export const createAccountSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(100),
  password: accountPasswordSchema,
});
export type AdminIdentity = {
  id: string;
  username: string;
  displayName: string;
  role: "owner" | "admin";
  requiresEnrollment?: boolean;
};
export type AdminAccount = AdminIdentity & { enabled: boolean; twoFactorEnabled: boolean };
