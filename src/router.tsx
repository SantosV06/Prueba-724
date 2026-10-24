import { requestNonce } from "@/lib/csp-nonce";
import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    ssr: { nonce: requestNonce() },
    defaultErrorComponent: AppErrorComponent,
  });
}
