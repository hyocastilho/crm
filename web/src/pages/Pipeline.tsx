import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ETAPAS, rotuloCanal } from "../lib/labels";

type Item = { id: string; name: string; channel: string };

export function Pipeline() {
  const [dados, setDados] = useState<{ counts: Record<string, number>; byStage: Record<string, Item[]> } | null>(
    null,
  );

  useEffect(() => {
    api
      .get<{ counts: Record<string, number>; byStage: Record<string, Item[]> }>("/pipeline")
      .then((response) => setDados(response.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Funil</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {ETAPAS.map((etapa) => (
          <section key={etapa.value} className="rounded-xl border border-line bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">{etapa.label}</h2>
              <span className="rounded-full bg-mist px-2 py-0.5 text-xs">{dados?.counts[etapa.value] ?? 0}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {(dados?.byStage[etapa.value] ?? []).map((item) => (
                <li key={item.id} className="rounded-lg bg-mist px-3 py-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-mute">{rotuloCanal(item.channel)}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
