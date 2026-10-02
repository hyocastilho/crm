# Instruções para o Lovable (e qualquer agente no repositório)

## Arquitetura fixa — não alterar

- **Frontend:** só a pasta `web/` (React + Vite + Tailwind). Porta publicada no host: **5175** (container 5173).
- **Backend:** só a pasta `back/` (Django + PostgreSQL). API em `/api` via proxy do Vite; sessão HttpOnly no cookie `crm_session`.
- **Banco:** PostgreSQL no `docker-compose.yml` (`db`). **Não usar Supabase** — não criar `supabase/`, `src/integrations/supabase/`, client Supabase, nem pasta `src/` na raiz.
- **Raiz:** pode existir só `package.json` vazio de dependências (shim para o `bun install` / publicação do Lovable), `lovable.toml` e `.lovable/dev`. Esse `package.json` só delega para `web/` — sem Supabase, sem app React na raiz.
- **Ambiente:** um único `.env` na **raiz** do repositório (modelo: `.env.example`). Nada de `.env` dentro de `web/` ou `back/`.

## O que você pode fazer

- Melhorar **UI/UX** em `web/src/` (páginas, componentes, `web/src/styles.css`, assets em `web/public/`).
- Ajustar tipografia e cores via tokens em `web/src/styles.css` (`@theme`).
- Fundo com `workspace-pattern.svg` e tokens em `web/src/styles.css`, no estilo aprovado do Lovable (`.pattern-surface`).

## O que não fazer

- Não adicionar Supabase, Lovable Cloud DB, TanStack Start server, Express separado, nem rotas `/api` fora do Django.
- Não mover o app para `src/` na raiz; o código React vive em `web/src/`.
- Não mudar fluxo de login, axios (`web/src/lib/api.ts`), CSRF, nem contratos da API Django sem pedido explícito.
- Não adicionar dependências de app no `package.json` da raiz nem substituir o shim por um projeto TanStack/Supabase na raiz.

## Sincronização com o Cursor

Este repo é editado também no Cursor. Commits no `main` podem remover arquivos Supabase que o Lovable gerar de novo. **Siga sempre as regras acima** para evitar conflitos e “sumir” autenticação ou API.

## Comandos locais (referência)

```sh
docker compose up -d --build
```

Site: http://127.0.0.1:5175 — API: http://127.0.0.1:8010/api/health
