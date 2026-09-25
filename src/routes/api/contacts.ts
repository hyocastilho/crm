import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { guard, json } from "@/lib/server/crm.server";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).nullable().optional(),
  instagram_username: z.string().trim().max(60).nullable().optional(),
  source: z.enum(["whatsapp", "instagram", "manual"]).default("manual"),
});

export const Route = createFileRoute("/api/contacts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { error, session } = await guard(request, false);
        if (error) return error;
        const { data } = await session!.db
          .from("contacts")
          .select("id, name, phone, instagram_username, source, created_at")
          .eq("business_id", session!.businessId)
          .order("name", { ascending: true })
          .limit(500);
        return json({ contacts: data ?? [] }, 200, request);
      },
      POST: async ({ request }) => {
        const { error, session } = await guard(request, true);
        if (error) return error;
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Requisição inválida" }, 400, request);
        }
        const parsed = createSchema.safeParse(raw);
        if (!parsed.success) return json({ error: "Dados inválidos" }, 400, request);

        const { data, error: dbError } = await session!.db
          .from("contacts")
          .insert({
            business_id: session!.businessId,
            name: parsed.data.name,
            phone: parsed.data.phone || null,
            instagram_username: parsed.data.instagram_username || null,
            source: parsed.data.source,
          })
          .select("id, name, phone, instagram_username, source, created_at")
          .single();
        if (dbError) return json({ error: "Não foi possível salvar" }, 500, request);
        return json({ contact: data }, 201, request);
      },
    },
  },
});
