import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import {
  REFRESH_COOKIE,
  authClient,
  checkCsrf,
  clearSessionCookies,
  fail,
  json,
  setSessionCookies,
} from "@/lib/server/crm.server";

export const Route = createFileRoute("/api/auth/refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkCsrf(request)) {
          return fail(403, "Falha na verificação de segurança (CSRF)", request);
        }
        const refreshToken = getCookie(REFRESH_COOKIE);
        if (!refreshToken) return fail(401, "Sessão expirada", request);
        const { data, error } = await authClient().auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (error || !data.session) {
          clearSessionCookies();
          return fail(401, "Sessão expirada", request);
        }
        setSessionCookies(data.session.access_token, data.session.refresh_token);
        return json({ ok: true }, 200, request);
      },
    },
  },
});
