import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Sessao } from "../lib/labels";

const LINKS = [
  { to: "/", label: "Caixa de entrada" },
  { to: "/contatos", label: "Contatos" },
  { to: "/funil", label: "Funil" },
  { to: "/ajustes", label: "Ajustes" },
];

export function AppShell() {
  const navigate = useNavigate();
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .get<{ user: Sessao }>("/auth/me")
      .then((response) => {
        if (ativo) setSessao(response.data.user);
      })
      .catch(() => {
        if (ativo) navigate("/login", { replace: true });
      });
    return () => {
      ativo = false;
    };
  }, [navigate]);

  async function sair() {
    try {
      await api.post("/auth/logout");
    } finally {
      navigate("/login", { replace: true });
    }
  }

  if (!sessao) {
    return <p className="grid min-h-screen place-items-center text-mute">Carregando…</p>;
  }

  return (
    <div className="pattern-surface min-h-screen p-0 sm:p-4 lg:p-6">
      <div className="relative mx-auto flex min-h-screen max-w-[96rem] flex-col overflow-hidden border border-line bg-card shadow-panel sm:min-h-[calc(100dvh-2rem)] sm:rounded-lg lg:min-h-[calc(100dvh-3rem)]">
      <header className="z-10 border-b border-line bg-card">
        <div className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-md bg-graphite text-pine"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 10h8M8 13h5"/></svg></span>
          <strong className="min-w-0 truncate font-display text-lg font-semibold">{sessao.businessName || "CRM"}</strong>
          <nav className="hidden flex-1 gap-1 md:flex md:pl-6">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-graphite text-on-graphite" : "text-mute hover:bg-mist hover:text-ink"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <button
              type="button"
              onClick={sair}
              className="rounded-md border border-line bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-mist"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${isActive ? "bg-graphite text-on-graphite" : "text-mute"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="min-h-0 flex-1 bg-paper/60 px-3 py-4 sm:px-5 sm:py-5">
        <Outlet context={sessao} />
      </main>
      </div>
    </div>
  );
}
