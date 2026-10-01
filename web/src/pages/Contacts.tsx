import { useEffect, useState, type FormEvent } from "react";
import { api, mensagemDeErro } from "../lib/api";
import type { Contato } from "../lib/labels";

export function Contacts() {
  const [lista, setLista] = useState<Contato[]>([]);
  const [editando, setEditando] = useState<Contato | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");

  function carregar() {
    api.get<{ contacts: Contato[] }>("/contacts").then((response) => setLista(response.data.contacts));
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!editando) return;
    setErro("");
    try {
      await api.patch(`/contacts/${editando.id}`, { name: nome.trim(), phone: telefone.trim() || null });
      setEditando(null);
      carregar();
    } catch (error) {
      setErro(mensagemDeErro(error, "Não foi possível salvar."));
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section>
        <h1 className="text-2xl font-semibold">Contatos</h1>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-md border border-line bg-card shadow-card">
          {lista.map((contato) => (
            <li key={contato.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{contato.name}</p>
                <p className="text-xs text-mute">
                  {contato.phone ?? "Sem telefone"}
                  {contato.instagram_username ? ` · @${contato.instagram_username}` : ""}
                </p>
              </div>
              <button
                type="button"
                 className="rounded-md border border-line bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-mist"
                onClick={() => {
                  setEditando(contato);
                  setNome(contato.name);
                  setTelefone(contato.phone ?? "");
                  setErro("");
                }}
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      </section>
      <aside
         className={`h-fit rounded-md border border-line bg-card p-5 shadow-card ${
          editando ? "" : "max-lg:hidden"
        }`}
      >
        <h2 className="text-sm font-medium">{editando ? "Editar contato" : "Selecione um contato"}</h2>
        {editando && (
          <form onSubmit={salvar} className="mt-4 space-y-3">
            <label className="block text-sm" htmlFor="nome">
              Nome
              <input
                id="nome"
                required
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                 className="mt-1 w-full rounded-md border border-line bg-input px-3 py-2 outline-none focus:border-pine-dark"
              />
            </label>
            <label className="block text-sm" htmlFor="telefone">
              Telefone
              <input
                id="telefone"
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
                 className="mt-1 w-full rounded-md border border-line bg-input px-3 py-2 outline-none focus:border-pine-dark"
              />
            </label>
             {erro && <p className="text-sm text-error">{erro}</p>}
             <button type="submit" className="rounded-md bg-pine px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-pine-dark">
              Salvar
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
