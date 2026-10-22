import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
/** The middleware overwrites the incoming header; never trust a caller's nonce. */
export const requestNonce = createIsomorphicFn()
  .server(() => getRequestHeader("x-vne-csp-nonce"))
  .client(() => document.querySelector<HTMLMetaElement>('meta[name="vne-csp-nonce"]')?.content);
