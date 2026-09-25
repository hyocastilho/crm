import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  authClient,
  checkCsrf,
  fail,
  json,
  rotateCsrfCookie,
  setSessionCookies,
  systemClient,
} from "@/lib/server/crm.server";

const DEMO_BUSINESS = "11111111-1111-1111-1111-111111111111";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(10).max(200),
});

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimited(email: string) {
  const now = Date.now();
  const entry = attempts.get(email);
  if (!entry || now - entry.first > WINDOW) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function registerFailure(email: string) {
  const now = Date.now();
  const entry = attempts.get(email);
  if (!entry || now - entry.first > WINDOW) attempts.set(email, { count: 1, first: now });
  else entry.count += 1;
}

/** Cria o primeiro admin a partir das variáveis de ambiente do servidor. */
async function ensureSeedAdmin() {
  const email = process.env["SEED_ADMIN_EMAIL"];
  const password = process.env["SEED_ADMIN_PASSWORD"];
  if (!email || !password) return;
  const admin = await systemClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !created.user) return;
  await admin.from("profiles").insert({
    id: created.user.id,
    business_id: DEMO_BUSINESS,
    full_name: "Administrador",
    role: "admin",
  });
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!checkCsrf(request)) {
          return fail(403, "Falha na verificação de segurança (CSRF)", request);
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return fail(400, "Requisição inválida", request);
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) return fail(400, "E-mail ou senha inválidos", request);

        const email = parsed.data.email.toLowerCase();
        if (rateLimited(email)) {
          return fail(429, "Muitas tentativas. Tente de novo em 15 minutos.", request);
        }

        await ensureSeedAdmin();

        const { data, error } = await authClient().auth.signInWithPassword({
          email,
          password: parsed.data.password,
        });
        if (error || !data.session) {
          registerFailure(email);
          return fail(401, "E-mail ou senha inválidos", request);
        }

        attempts.delete(email);
        setSessionCookies(data.session.access_token, data.session.refresh_token);
        rotateCsrfCookie();
        return json({ ok: true }, 200, request);
      },
    },
  },
});
