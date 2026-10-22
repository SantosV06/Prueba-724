import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
const passwordInput = z.object({ password: z.string().min(1).max(256) });
const proofInput = passwordInput.extend({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Introduce seis dígitos."),
});
export const getTwoFactorStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { twoFactorStatus } = await import("./admin-totp.server");
  return twoFactorStatus();
});
export const beginTwoFactor = createServerFn({ method: "POST" })
  .validator(passwordInput)
  .handler(async ({ data }) => {
    const { beginTwoFactor } = await import("./admin-totp.server");
    return beginTwoFactor(data.password);
  });
export const confirmTwoFactor = createServerFn({ method: "POST" })
  .validator(proofInput)
  .handler(async ({ data }) => {
    const { confirmTwoFactor } = await import("./admin-totp.server");
    return confirmTwoFactor(data.password, data.code);
  });
export const disableTwoFactor = createServerFn({ method: "POST" })
  .validator(passwordInput.extend({ code: z.string().trim().min(1).max(100) }))
  .handler(async ({ data }) => {
    const { disableTwoFactor } = await import("./admin-totp.server");
    return disableTwoFactor(data.password, data.code);
  });
