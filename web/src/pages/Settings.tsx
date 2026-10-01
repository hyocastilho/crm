import { useOutletContext } from "react-router-dom";
import type { Sessao } from "../lib/labels";

export function Settings() {
  const sessao = useOutletContext<Sessao>();

  if (sessao.role !== "admin") {
    return <p className="text-sm text-mute">Só o administrador altera os canais.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        A conexão oficial com a Meta entra na próxima etapa. Nesta versão o CRM só guarda as conversas de
        demonstração.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Canal nome="WhatsApp" />
        <Canal nome="Instagram" />
      </div>
    </div>
  );
}

function Canal({ nome }: { nome: string }) {
  return (
     <article className="rounded-md border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{nome}</h2>
         <span className="rounded-sm border border-line bg-input px-2 py-0.5 text-xs text-mute">Desconectado</span>
      </div>
      <p className="mt-3 text-sm text-mute">
        Sem QR code e sem campo de token. O número e a conta entram pelo login oficial da Meta, quando essa etapa
        começar.
      </p>
    </article>
  );
}
