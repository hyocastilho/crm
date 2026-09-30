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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-card/85 shadow-panel backdrop-blur-md">
        <div className="mx-auto flex max-w-[96rem] items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
          <strong className="truncate font-display text-lg tracking-tight">{sessao.businessName || "CRM"}</strong>
          <nav className="hidden flex-1 gap-1 md:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-pine text-white shadow-card" : "text-mute hover:bg-mist"}`
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
              className="rounded-lg border border-line bg-card px-3 py-2 text-sm shadow-card transition hover:bg-mist"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-2 py-2 md:hidden">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${isActive ? "bg-pine text-white shadow-card" : "text-mute"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[96rem] px-3 py-4 sm:px-4 sm:py-6">
        <Outlet context={sessao} />
      </main>
    </div>
  );
}
