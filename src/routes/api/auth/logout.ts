import { createFileRoute } from "@tanstack/react-router";
import { checkCsrf, clearSessionCookies, fail, json } from "@/lib/server/crm.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkCsrf(request)) {
          return fail(403, "Falha na verificação de segurança (CSRF)", request);
        }
        clearSessionCookies();
        return json({ ok: true }, 200, request);
      },
    },
  },
});
