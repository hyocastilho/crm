import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getCookie,
  getRequestUrl,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

export const SESSION_COOKIE = "crm_session";
export const REFRESH_COOKIE = "crm_refresh";
export const CSRF_COOKIE = "crm_csrf";

const SESSION_MAX_AGE = 60 * 60; // 1 hora
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export function isSecureRequest() {
  try {
    return getRequestUrl().protocol === "https:";
  } catch {
    return true;
  }
}

/**
 * Cabeçalhos de segurança aplicados a toda resposta de /api.
 * Observação de desenvolvimento local: sem HTTPS o atributo Secure dos cookies
 * fica desligado; em qualquer ambiente com HTTPS ele é ligado automaticamente.
 */
export function securityHeaders(origin?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  };
  if (isSecureRequest()) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  // CORS: reflete apenas a própria origem.
  const self = safeOrigin();
  if (origin && self && origin === self) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Vary"] = "Origin";
  }
  return headers;
}

function safeOrigin() {
  try {
    return getRequestUrl().origin;
  } catch {
    return null;
  }
}

export function json(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: securityHeaders(request?.headers.get("origin")),
  });
}

export function fail(status: number, message: string, request?: Request) {
  return json({ error: message }, status, request);
}

/* ---------------- cookies de sessão ---------------- */

export function setSessionCookies(accessToken: string, refreshToken: string) {
  const secure = isSecureRequest();
  setCookie(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  setCookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearSessionCookies() {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  deleteCookie(REFRESH_COOKIE, { path: "/api/auth" });
  deleteCookie(CSRF_COOKIE, { path: "/" });
}

export function ensureCsrfCookie() {
  const existing = getCookie(CSRF_COOKIE);
  if (existing) return existing;
  const token = crypto.randomUUID().replace(/-/g, "");
  setCookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isSecureRequest(),
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
  return token;
}

export function rotateCsrfCookie() {
  deleteCookie(CSRF_COOKIE, { path: "/" });
  const token = crypto.randomUUID().replace(/-/g, "");
  setCookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isSecureRequest(),
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
  return token;
}

export function checkCsrf(request: Request) {
  const cookie = getCookie(CSRF_COOKIE);
  const header = request.headers.get("x-csrf-token");
  return Boolean(cookie && header && cookie === header);
}

/* ---------------- clientes supabase (somente servidor) ---------------- */

function url() {
  return process.env["SUPABASE_URL"]!;
}
function publishableKey() {
  return process.env["SUPABASE_PUBLISHABLE_KEY"]!;
}

function headerFetch(key: string): typeof fetch {
  return (input, init) => {
    const h = new Headers(init?.headers);
    if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
      h.delete("Authorization");
    }
    h.set("apikey", key);
    return fetch(input, { ...init, headers: h });
  };
}

export function authClient() {
  const key = publishableKey();
  return createClient<Database>(url(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: headerFetch(key) },
  });
}

/** Cliente com o JWT do usuário — o RLS continua valendo. */
export function userClient(accessToken: string) {
  const key = publishableKey();
  return createClient<Database>(url(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${accessToken}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Somente rotas de sistema (seed). Nunca exposto ao navegador. */
export async function systemClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient<Database>;
}

/* ---------------- sessão ---------------- */

export type Session = {
  token: string;
  userId: string;
  email: string;
  businessId: string;
  role: "admin" | "atendente";
  fullName: string;
  db: SupabaseClient<Database>;
};

export async function getSession(): Promise<Session | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const db = userClient(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await db
    .from("profiles")
    .select("business_id, role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) return null;
  return {
    token,
    userId: data.user.id,
    email: data.user.email ?? "",
    businessId: profile.business_id,
    role: profile.role,
    fullName: profile.full_name,
    db,
  };
}

/** Sessão + CSRF para rotas que alteram dados. */
export async function guard(request: Request, mutating: boolean) {
  if (mutating && !checkCsrf(request)) {
    return { error: fail(403, "Falha na verificação de segurança (CSRF)", request) };
  }
  const session = await getSession();
  if (!session) return { error: fail(401, "Sessão inválida", request) };
  return { session };
}
