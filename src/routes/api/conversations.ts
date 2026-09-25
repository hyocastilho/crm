import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { guard, json } from "@/lib/server/crm.server";

const querySchema = z.object({
  channel: z.enum(["whatsapp", "instagram"]).optional(),
  stage: z
    .enum(["novo", "em_atendimento", "orcamento", "pedido", "pago", "perdido"])
    .optional(),
  q: z.string().max(80).optional(),
});

export const Route = createFileRoute("/api/conversations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { error, session } = await guard(request, false);
        if (error) return error;

        const url = new URL(request.url);
        const parsed = querySchema.safeParse({
          channel: url.searchParams.get("channel") || undefined,
          stage: url.searchParams.get("stage") || undefined,
          q: url.searchParams.get("q") || undefined,
        });
        if (!parsed.success) return json({ error: "Filtro inválido" }, 400, request);

        let query = session!.db
          .from("conversations")
          .select(
            "id, channel, stage, status, handler, last_message_at, contacts!inner(id, name, phone, instagram_username)",
          )
          .eq("business_id", session!.businessId)
          .order("last_message_at", { ascending: false })
          .limit(100);

        if (parsed.data.channel) query = query.eq("channel", parsed.data.channel);
        if (parsed.data.stage) query = query.eq("stage", parsed.data.stage);
        if (parsed.data.q) query = query.ilike("contacts.name", `%${parsed.data.q}%`);

        const { data, error: dbError } = await query;
        if (dbError) return json({ error: "Não foi possível carregar" }, 500, request);

        const ids = (data ?? []).map((c) => c.id);
        const previews = new Map<string, string>();
        if (ids.length) {
          const { data: msgs } = await session!.db
            .from("messages")
            .select("conversation_id, body, created_at")
            .in("conversation_id", ids)
            .order("created_at", { ascending: false });
          for (const m of msgs ?? []) {
            if (!previews.has(m.conversation_id)) previews.set(m.conversation_id, m.body);
          }
        }

        return json(
          {
            conversations: (data ?? []).map((c) => ({
              id: c.id,
              channel: c.channel,
              stage: c.stage,
              status: c.status,
              handler: c.handler,
              lastMessageAt: c.last_message_at,
              contact: c.contacts,
              preview: previews.get(c.id) ?? "",
            })),
          },
          200,
          request,
        );
      },
    },
  },
});
