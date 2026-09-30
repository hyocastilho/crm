import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, mensagemDeErro } from "../lib/api";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get("/health").catch(() => undefined);
  }, []);

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setErro("");
    if (senha.length < 10) {
      setErro("A senha precisa ter pelo menos 10 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      await api.post("/auth/login", { email, password: senha });
      navigate("/", { replace: true });
    } catch (error) {
      setErro(mensagemDeErro(error, "E-mail ou senha inválidos"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pattern-surface flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
      <form onSubmit={entrar} className="w-full max-w-[440px] rounded-lg border border-line bg-card p-7 shadow-panel sm:p-10">
        <div className="mb-9 flex items-center gap-3">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-md bg-graphite text-pine">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 10h8M8 13h5"/></svg>
          </span>
          <span className="font-display text-lg font-semibold">CRM de vendas</span>
        </div>
        <h1 className="text-[30px] leading-tight font-semibold">Bem-vindo de volta.</h1>
        <p className="mt-2 text-sm text-mute">Acesso restrito à equipe da loja.</p>
        <label className="mt-8 block text-sm font-semibold" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-input px-4 py-3 outline-none focus:border-pine-dark"
        />
        <label className="mt-5 block text-sm font-semibold" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-input px-4 py-3 outline-none focus:border-pine-dark"
        />
        {erro && <p role="alert" className="mt-3 text-sm text-error">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="mt-7 w-full rounded-md bg-pine px-4 py-3 font-semibold text-ink transition-colors hover:bg-pine-dark disabled:opacity-60"
        >
          {enviando ? "Entrando…" : "Acessar painel"}
        </button>
        <p className="mt-8 border-t border-line pt-5 text-center text-xs text-mute">Ambiente de trabalho da equipe</p>
      </form>
    </div>
  );
}
