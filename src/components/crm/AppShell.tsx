import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Inbox, Users, KanbanSquare, Settings, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export type Sessao = {
  email: string;
  fullName: string;
  role: "admin" | "atendente";
  businessName: string;
};

export function useSessao() {
  return useQuery({
    queryKey: ["sessao"],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<{ user: Sessao }>("/auth/me");
      return data.user;
    },
  });
}

const LINKS = [
  { to: "/", label: "Caixa de entrada", icon: Inbox },
  { to: "/contatos", label: "Contatos", icon: Users },
  { to: "/funil", label: "Funil", icon: KanbanSquare },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sessao, isLoading, isError } = useSessao();

  useEffect(() => {
    if (isError) navigate({ to: "/login", replace: true });
  }, [isError, navigate]);

  async function sair() {
    try {
      await api.post("/auth/logout");
    } finally {
      queryClient.clear();
      navigate({ to: "/login", replace: true });
    }
  }

  if (isLoading || !sessao) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            {sessao.businessName || "CRM"}
          </span>
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground font-medium" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {sessao.fullName || sessao.email} · {sessao.role}
            </span>
            <Button variant="outline" size="sm" onClick={sair}>
              <LogOut className="size-4" /> Sair
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground"
              activeProps={{ className: "bg-secondary text-foreground font-medium" }}
            >
              <l.icon className="size-4" />
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

export const ETAPAS = [
  { value: "novo", label: "Novo" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "orcamento", label: "Orçamento" },
  { value: "pedido", label: "Pedido" },
  { value: "pago", label: "Pago" },
  { value: "perdido", label: "Perdido" },
] as const;

export function rotuloEtapa(valor: string) {
  return ETAPAS.find((e) => e.value === valor)?.label ?? valor;
}

export function rotuloCanal(valor: string) {
  return valor === "whatsapp" ? "WhatsApp" : "Instagram";
}

export function horaCurta(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
