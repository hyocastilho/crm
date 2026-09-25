import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { guard, json } from "@/lib/server/crm.server";

const idSchema = z.string().uuid();

const patchSchema = z
  .object({
    stage: z
      .enum(["novo", "em_atendimento", "orcamento", "pedido", "pago", "perdido"])
      .optional(),
    status: z.enum(["aberta", "aguardando", "encerrada"]).optional(),
    handler: z.enum(["bot", "humano"]).optional(),
    assignee_id: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nada para atualizar" });

export const Route = createFileRoute("/api/conversations/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { error, session } = await guard(request, false);
        if (error) return error;
        const id = idSchema.safeParse(params.id);
        if (!id.success) return json({ error: "Identificador inválido" }, 400, request);

        const { data: conversation } = await session!.db
          .from("conversations")
          .select(
            "id, channel, stage, status, handler, assignee_id, last_message_at, contacts(id, name, phone, instagram_username, source)",
          )
          .eq("id", id.data)
          .eq("business_id", session!.businessId)
          .maybeSingle();
        if (!conversation) return json({ error: "Conversa não encontrada" }, 404, request);

        const { data: messages } = await session!.db
          .from("messages")
          .select("id, direction, author, body, created_at")
          .eq("conversation_id", id.data)
          .order("created_at", { ascending: true })
          .limit(300);

        return json(
          {
            conversation: {
              id: conversation.id,
              channel: conversation.channel,
              stage: conversation.stage,
              status: conversation.status,
              handler: conversation.handler,
              assigneeId: conversation.assignee_id,
              lastMessageAt: conversation.last_message_at,
            },
            contact: conversation.contacts,
            messages: messages ?? [],
          },
          200,
          request,
        );
      },
      PATCH: async ({ request, params }) => {
        const { error, session } = await guard(request, true);
        if (error) return error;
        const id = idSchema.safeParse(params.id);
        if (!id.success) return json({ error: "Identificador inválido" }, 400, request);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Requisição inválida" }, 400, request);
        }
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) return json({ error: "Dados inválidos" }, 400, request);

        const { error: dbError } = await session!.db
          .from("conversations")
          .update(parsed.data)
          .eq("id", id.data)
          .eq("business_id", session!.businessId);
        if (dbError) return json({ error: "Não foi possível salvar" }, 500, request);
        return json({ ok: true }, 200, request);
      },
    },
  },
});
