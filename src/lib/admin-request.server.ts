import { getRequest } from "@tanstack/react-start/server";
import { isTrustedRequest } from "./request-security.ts";

export function assertTrustedRequest() {
  const request = getRequest();
  if (request && !isTrustedRequest(request, process.env.SITE_URL)) {
    const error = new Error("Forbidden: cross-site request blocked");
    Object.assign(error, { status: 403 });
    throw error;
  }
}
