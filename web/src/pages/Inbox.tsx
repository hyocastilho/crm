import { useEffect, useState, type FormEvent } from "react";
import { api, mensagemDeErro } from "../lib/api";
import { ETAPAS, horaCurta, rotuloCanal, rotuloEtapa, type ConversaResumo, type Mensagem } from "../lib/labels";

type Detalhe = {
  conversation: {
    id: string;
    channel: "whatsapp" | "instagram";
    stage: string;
    handler: "bot" | "humano";
  };
  contact: ConversaResumo["contact"];
  messages: Mensagem[];
};

export function Inbox() {
  const [canal, setCanal] = useState<"todos" | "whatsapp" | "instagram">("todos");
  const [busca, setBusca] = useState("");
  const [lista, setLista] = useState<ConversaResumo[]>([]);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estreito, setEstreito] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 767px)");
    const aplicar = () => setEstreito(consulta.matches);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api
        .get<{ conversations: ConversaResumo[] }>("/conversations", {
          params: { channel: canal === "todos" ? undefined : canal, q: busca.trim() || undefined },
        })
        .then((response) => {
          setLista(response.data.conversations);
          const estreita = window.matchMedia("(max-width: 767px)").matches;
          setSelecionada((atual) => {
            if (atual && response.data.conversations.some((item) => item.id === atual)) return atual;
            if (estreita) return null;
            return response.data.conversations[0]?.id ?? null;
          });
        })
        .catch(() => setLista([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [canal, busca]);

  useEffect(() => {
    if (!selecionada) {
      setDetalhe(null);
      return;
    }
    api.get<Detalhe>(`/conversations/${selecionada}`).then((response) => setDetalhe(response.data));
  }, [selecionada]);

  async function atualizar(patch: { handler?: "humano"; stage?: string }) {
    if (!selecionada) return;
    await api.patch(`/conversations/${selecionada}`, patch);
    const response = await api.get<Detalhe>(`/conversations/${selecionada}`);
    setDetalhe(response.data);
    setLista((atual) =>
      atual.map((item) =>
        item.id === selecionada
          ? { ...item, stage: response.data.conversation.stage, handler: response.data.conversation.handler }
          : item,
      ),
    );
  }

  async function responder(event: FormEvent) {
    event.preventDefault();
    const body = texto.trim();
    if (!selecionada || !body) return;
    setEnviando(true);
    setErro("");
    try {
      await api.post(`/conversations/${selecionada}/messages`, { body });
      setTexto("");
      const response = await api.get<Detalhe>(`/conversations/${selecionada}`);
      setDetalhe(response.data);
    } catch (error) {
      setErro(mensagemDeErro(error, "Não foi possível guardar a resposta."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 max-md:h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-8rem)] md:grid-cols-[17rem_minmax(0,1fr)] md:grid-rows-[minmax(0,1.3fr)_minmax(12rem,0.7fr)] xl:grid-cols-[17rem_minmax(0,1fr)_18rem] xl:grid-rows-1">
      <section
        className={`min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-panel md:row-span-2 xl:row-span-1 ${
          estreito && selecionada ? "hidden" : "flex"
        }`}
      >
        <div className="space-y-2 border-b border-line p-3">
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-card outline-none focus:border-pine"
          />
          <div className="flex gap-1">
            {(
              [
                ["todos", "Todos"],
                ["whatsapp", "WhatsApp"],
                ["instagram", "Instagram"],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setCanal(valor)}
                className={`rounded-lg px-2.5 py-1 text-xs transition ${canal === valor ? "bg-pine text-white shadow-card" : "border border-line bg-white"}`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {lista.map((conversa) => (
            <li key={conversa.id}>
              <button
                type="button"
                onClick={() => setSelecionada(conversa.id)}
                className={`w-full border-b border-line px-3 py-3 text-left ${
                  conversa.id === selecionada ? "bg-mist" : ""
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <strong className="truncate text-sm">{conversa.contact.name}</strong>
                  <span className="text-xs text-mute">{horaCurta(conversa.lastMessageAt)}</span>
                </span>
                <span className="mt-1 block truncate text-xs text-mute">{conversa.preview}</span>
              </button>
            </li>
          ))}
          {lista.length === 0 && <li className="p-4 text-sm text-mute">Nenhuma conversa encontrada.</li>}
        </ul>
      </section>

      <section
        className={`min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-panel ${
          estreito && !selecionada ? "hidden" : "flex"
        }`}
      >
        <header className="border-b border-line px-4 py-3">
          {estreito && (
            <button type="button" onClick={() => setSelecionada(null)} className="mb-2 text-sm text-pine">
              Voltar à lista
            </button>
          )}
          <h1 className="text-lg">{detalhe?.contact.name ?? "Conversa"}</h1>
          {detalhe && <p className="text-sm text-mute">{rotuloCanal(detalhe.conversation.channel)}</p>}
        </header>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {(detalhe?.messages ?? []).map((mensagem) => (
            <div
              key={mensagem.id}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                mensagem.direction === "out" ? "ml-auto bg-pine text-white shadow-card" : "bg-mist shadow-card"
              }`}
            >
              <p className="whitespace-pre-wrap">{mensagem.body}</p>
              <p className="mt-1 text-[11px] opacity-70">{horaCurta(mensagem.created_at)}</p>
            </div>
          ))}
        </div>
        <form onSubmit={responder} className="space-y-2 border-t border-line p-3">
          <textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            maxLength={4000}
            placeholder="Escreva a resposta. Ela fica só no CRM nesta etapa."
            className="min-h-20 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-card outline-none focus:border-pine"
          />
          {erro && <p className="text-sm text-red-700">{erro}</p>}
          <button
            type="submit"
            disabled={!selecionada || enviando || texto.trim().length === 0}
            className="rounded-xl bg-pine px-4 py-2 text-sm font-medium text-white shadow-card transition hover:bg-pine-dark disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "Responder"}
          </button>
        </form>
      </section>

      <aside
        className={`min-h-0 space-y-4 overflow-y-auto rounded-2xl border border-line bg-card p-4 shadow-panel ${
          estreito && !selecionada ? "hidden" : "block"
        }`}
      >
        <div>
          <h2 className="text-sm font-medium">Contato</h2>
          <p className="mt-2 text-sm">{detalhe?.contact.name ?? "—"}</p>
          <p className="text-sm text-mute">{detalhe?.contact.phone ?? "Sem telefone"}</p>
          <p className="text-sm text-mute">
            {detalhe?.contact.instagram_username ? `@${detalhe.contact.instagram_username}` : "Sem Instagram"}
          </p>
        </div>
        <label className="block text-sm font-medium" htmlFor="etapa">
          Etapa
          <select
            id="etapa"
            value={detalhe?.conversation.stage ?? ""}
            disabled={!detalhe}
            onChange={(event) => atualizar({ stage: event.target.value })}
            className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 shadow-card outline-none focus:border-pine"
          >
            {ETAPAS.map((etapa) => (
              <option key={etapa.value} value={etapa.value}>
                {etapa.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <h2 className="text-sm font-medium">Atendimento</h2>
          <p className="mt-2 text-sm text-mute">
            {detalhe?.conversation.handler === "humano"
              ? "Com uma pessoa. O robô está desligado nesta conversa."
              : "Com o robô. Ele ainda não responde nesta etapa."}
          </p>
          <p className="mt-1 text-xs text-mute">{detalhe ? rotuloEtapa(detalhe.conversation.stage) : ""}</p>
          <button
            type="button"
            disabled={!detalhe || detalhe.conversation.handler === "humano"}
            onClick={() => atualizar({ handler: "humano" })}
            className="mt-3 rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-card transition hover:bg-mist disabled:opacity-50"
          >
            Assumir atendimento
          </button>
        </div>
      </aside>
    </div>
  );
}
