import { createFileRoute } from "@tanstack/react-router";
import { ensureCsrfCookie, json } from "@/lib/server/crm.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        ensureCsrfCookie();
        return json({ status: "ok" }, 200, request);
      },
    },
  },
});
