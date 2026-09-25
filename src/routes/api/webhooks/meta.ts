import { createFileRoute } from "@tanstack/react-router";
import { fail } from "@/lib/server/crm.server";

/**
 * Preparado para a próxima etapa. Enquanto não houver verificação de
 * assinatura configurada, recusa tudo com 401.
 */
export const Route = createFileRoute("/api/webhooks/meta")({
  server: {
    handlers: {
      POST: async ({ request }) => fail(401, "Não autorizado", request),
      GET: async ({ request }) => fail(401, "Não autorizado", request),
    },
  },
});
