import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { guard, json } from "@/lib/server/crm.server";

const bodySchema = z.object({ body: z.string().trim().min(1).max(4000) });

export const Route = createFileRoute("/api/conversations/$id/messages")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { error, session } = await guard(request, true);
        if (error) return error;
        const id = z.string().uuid().safeParse(params.id);
        if (!id.success) return json({ error: "Identificador inválido" }, 400, request);

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Requisição inválida" }, 400, request);
        }
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) return json({ error: "Mensagem inválida" }, 400, request);

        const { data: conversation } = await session!.db
          .from("conversations")
          .select("id")
          .eq("id", id.data)
          .eq("business_id", session!.businessId)
          .maybeSingle();
        if (!conversation) return json({ error: "Conversa não encontrada" }, 404, request);

        // Apenas grava no banco. Nenhuma API externa é chamada nesta etapa.
        const { data: message, error: dbError } = await session!.db
          .from("messages")
          .insert({
            business_id: session!.businessId,
            conversation_id: id.data,
            direction: "out",
            author: "human",
            body: parsed.data.body,
          })
          .select("id, direction, author, body, created_at")
          .single();
        if (dbError) return json({ error: "Não foi possível enviar" }, 500, request);

        await session!.db
          .from("conversations")
          .update({ last_message_at: new Date().toISOString(), handler: "humano" })
          .eq("id", id.data)
          .eq("business_id", session!.businessId);

        return json({ message }, 201, request);
      },
    },
  },
});
