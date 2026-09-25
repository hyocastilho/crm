import { createFileRoute } from "@tanstack/react-router";
import { ensureCsrfCookie, fail, getSession, json } from "@/lib/server/crm.server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        ensureCsrfCookie();
        const session = await getSession();
        if (!session) return fail(401, "Sem sessão", request);
        const { data: business } = await session.db
          .from("businesses")
          .select("name")
          .eq("id", session.businessId)
          .maybeSingle();
        return json(
          {
            user: {
              email: session.email,
              fullName: session.fullName,
              role: session.role,
              businessName: business?.name ?? "",
            },
          },
          200,
          request,
        );
      },
    },
  },
});
