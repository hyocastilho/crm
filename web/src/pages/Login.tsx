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
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-2xl border border-line bg-card p-6">
        <h1 className="text-xl font-semibold">Entrar no CRM</h1>
        <p className="mt-1 text-sm text-mute">Acesso restrito à equipe da loja.</p>
        <label className="mt-5 block text-sm" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
        />
        <label className="mt-4 block text-sm" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2"
        />
        {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="mt-5 w-full rounded-md bg-pine px-3 py-2 text-white disabled:opacity-60"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
