import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, mensagemDeErro } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — CRM de vendas" },
      {
        name: "description",
        content: "Acesso da equipe ao CRM de vendas da loja pelo WhatsApp e Instagram.",
      },
      { property: "og:title", content: "Entrar — CRM de vendas" },
      {
        property: "og:description",
        content: "Acesso da equipe ao CRM de vendas da loja.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Garante o cookie de CSRF antes do primeiro POST.
    api.get("/health").catch(() => undefined);
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 10) {
      setErro("A senha precisa ter pelo menos 10 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      await api.post("/auth/login", { email, password: senha });
      navigate({ to: "/", replace: true });
    } catch (error) {
      setErro(mensagemDeErro(error, "E-mail ou senha inválidos"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">Entrar no CRM</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acesso restrito à equipe da loja.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={entrar}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
