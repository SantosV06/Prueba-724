import { createFileRoute } from "@tanstack/react-router";
import { database } from "@/lib/volunteer-service.server";
let checked: { until: number; healthy: boolean } | undefined;
let checking: Promise<boolean> | undefined;
async function healthy() {
  if (checked && checked.until > Date.now()) return checked.healthy;
  checking ??= (async () => {
    try {
      const sql = await database();
      await sql.query("SELECT require_two_factor FROM admin_policy WHERE id=1");
      return true;
    } catch {
      console.error(JSON.stringify({ event: "health:database-unavailable" }));
      return false;
    }
  })();
  const ok = await checking;
  checked = { until: Date.now() + 15000, healthy: ok };
  checking = undefined;
  return ok;
}
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const ok = await healthy();
        return Response.json(
          { status: ok ? "ok" : "unavailable" },
          {
            status: ok ? 200 : 503,
            headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
          },
        );
      },
    },
  },
});
