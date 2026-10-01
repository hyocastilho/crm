import { useEffect, useState } from "react";
import { api, mensagemDeErro } from "../lib/api";
import { ETAPAS, rotuloCanal } from "../lib/labels";

type Item = { id: string; name: string; channel: string };
type Quadro = { counts: Record<string, number>; byStage: Record<string, Item[]> };

const TINTA: Record<string, string> = {
  novo: "bg-mist text-ink",
  em_atendimento: "bg-line text-ink",
  orcamento: "bg-pine/30 text-ink",
  pedido: "bg-graphite text-on-graphite",
  pago: "bg-pine text-ink",
  perdido: "bg-input text-mute",
};

export function Pipeline() {
  const [dados, setDados] = useState<Quadro | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get<Quadro>("/pipeline").then((response) => setDados(response.data));
  }, []);

  function moverNoQuadro(id: string, destino: string) {
    setDados((atual) => {
      if (!atual) return atual;
      let card: Item | undefined;
      const byStage: Record<string, Item[]> = {};
      for (const etapa of ETAPAS) {
        byStage[etapa.value] = atual.byStage[etapa.value].filter((item) => {
          if (item.id === id) card = item;
          return item.id !== id;
        });
      }
      if (!card) return atual;
      byStage[destino] = [card, ...byStage[destino]];
      const counts = Object.fromEntries(
        ETAPAS.map((etapa) => [etapa.value, byStage[etapa.value].length]),
      );
      return { counts, byStage };
    });
  }

  async function soltar(destino: string) {
    const id = arrastando;
    setArrastando(null);
    setSobre(null);
    if (!id || !dados) return;
    const origem = ETAPAS.find((etapa) => dados.byStage[etapa.value]?.some((item) => item.id === id))?.value;
    if (!origem || origem === destino) return;
    moverNoQuadro(id, destino);
    setErro("");
    try {
      await api.patch(`/conversations/${id}`, { stage: destino });
    } catch (error) {
      moverNoQuadro(id, origem);
      setErro(mensagemDeErro(error, "Não foi possível mover o card."));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Funil</h1>
          <p className="mt-1 text-sm text-mute">Arraste o card para a próxima etapa da venda.</p>
        </div>
      </div>
      {erro && <p className="mt-3 text-sm text-error">{erro}</p>}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ETAPAS.map((etapa) => (
          <section
            key={etapa.value}
            onDragOver={(event) => {
              event.preventDefault();
              setSobre(etapa.value);
            }}
            onDragLeave={() => setSobre((atual) => (atual === etapa.value ? null : atual))}
            onDrop={(event) => {
              event.preventDefault();
              void soltar(etapa.value);
            }}
             className={`flex min-h-56 flex-col rounded-md border bg-card p-2 shadow-card transition-colors ${
               sobre === etapa.value ? "border-pine bg-mist" : "border-line"
            }`}
          >
            <header
              className="flex items-center justify-between gap-2 px-2 py-2"
              onDragOver={(event) => {
                event.preventDefault();
                setSobre(etapa.value);
              }}
              onDrop={(event) => {
                event.preventDefault();
                void soltar(etapa.value);
              }}
            >
               <h2 className={`rounded-sm px-2.5 py-1 text-xs font-semibold ${TINTA[etapa.value]}`}>
                {etapa.label}
              </h2>
              <span className="text-xs font-medium text-mute">{dados?.counts[etapa.value] ?? 0}</span>
            </header>
            <ul
              className="flex min-h-40 flex-1 flex-col gap-2 px-1 pb-2"
              onDragOver={(event) => {
                event.preventDefault();
                setSobre(etapa.value);
              }}
              onDrop={(event) => {
                event.preventDefault();
                void soltar(etapa.value);
              }}
            >
              {(dados?.byStage[etapa.value] ?? []).map((item) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => setArrastando(item.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setSobre(etapa.value);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void soltar(etapa.value);
                  }}
                  onDragEnd={() => {
                    setArrastando(null);
                    setSobre(null);
                  }}
                   className={`cursor-grab rounded-md border border-line bg-card px-3 py-3 shadow-card active:cursor-grabbing ${
                    arrastando === item.id ? "opacity-50" : ""
                  }`}
                >
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-mute">{rotuloCanal(item.channel)}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
