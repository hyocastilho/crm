import { createFileRoute } from "@tanstack/react-router";
import { guard, json } from "@/lib/server/crm.server";

const STAGES = ["novo", "em_atendimento", "orcamento", "pedido", "pago", "perdido"] as const;

export const Route = createFileRoute("/api/pipeline")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { error, session } = await guard(request, false);
        if (error) return error;

        const { data } = await session!.db
          .from("conversations")
          .select("id, stage, channel, last_message_at, contacts(name)")
          .eq("business_id", session!.businessId)
          .order("last_message_at", { ascending: false })
          .limit(300);

        const counts = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
          (typeof STAGES)[number],
          number
        >;
        const byStage = Object.fromEntries(STAGES.map((s) => [s, [] as unknown[]])) as Record<
          (typeof STAGES)[number],
          { id: string; name: string; channel: string }[]
        >;

        for (const row of data ?? []) {
          const stage = row.stage as (typeof STAGES)[number];
          counts[stage] += 1;
          byStage[stage].push({
            id: row.id,
            name: (row.contacts as { name: string } | null)?.name ?? "Sem nome",
            channel: row.channel,
          });
        }

        return json({ counts, byStage }, 200, request);
      },
    },
  },
});
