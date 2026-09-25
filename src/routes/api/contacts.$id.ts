import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { guard, json } from "@/lib/server/crm.server";

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    instagram_username: z.string().trim().max(60).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nada para atualizar" });

export const Route = createFileRoute("/api/contacts/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
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
        const parsed = patchSchema.safeParse(raw);
        if (!parsed.success) return json({ error: "Dados inválidos" }, 400, request);

        const patch: Record<string, string | null> = {};
        if (parsed.data.name !== undefined) patch["name"] = parsed.data.name;
        if (parsed.data.phone !== undefined) patch["phone"] = parsed.data.phone || null;
        if (parsed.data.instagram_username !== undefined)
          patch["instagram_username"] = parsed.data.instagram_username || null;

        const { data, error: dbError } = await session!.db
          .from("contacts")
          .update(patch)
          .eq("id", id.data)
          .eq("business_id", session!.businessId)
          .select("id, name, phone, instagram_username, source, created_at")
          .maybeSingle();
        if (dbError) return json({ error: "Não foi possível salvar" }, 500, request);
        if (!data) return json({ error: "Contato não encontrado" }, 404, request);
        return json({ contact: data }, 200, request);
      },
    },
  },
});
