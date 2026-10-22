import { requestNonce } from "@/lib/csp-nonce";
import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    ssr: { nonce: requestNonce() },
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
  });
}
