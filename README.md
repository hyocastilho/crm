# CRM de vendas

O site fica em `web/`. O sistema fica em `back/` (Django). O banco é PostgreSQL, subido pelo Docker.

```
CRM/
  .env                 segredos locais. Não vai para o Git.
  .env.example         modelo, sem senha.
  docker-compose.yml   banco, backend e site.
  back/                Django: modelos, API, sessão, admin.
  web/                 React. O navegador só chama /api.
```

Não existe pasta `server`, `lovable` nem `.vscode`. O editor não faz parte do sistema.

## Onde fica o ambiente

Um arquivo só: **`.env` na raiz** deste repositório, ao lado do `docker-compose.yml`.

O modelo para copiar é **`.env.example`**, também na raiz. `back/` e `web/` não têm `.env`.

Dentro dos containers, o Compose troca `POSTGRES_HOST` para `db`. No arquivo, `127.0.0.1` e a porta `5433` servem se um dia o Django rodar fora do container, contra o banco publicado.

## Subir

Docker Desktop ligado. Na raiz:

```sh
copy .env.example .env
docker compose up --build
```

Preencha `.env` antes, se ainda estiver vazio. O container `back` aplica as migrações e cria a loja de demonstração.

| Serviço | No computador | Dentro da rede Docker |
| --- | --- | --- |
| Site | http://127.0.0.1:5175 | `web:5173` |
| API | http://127.0.0.1:8010/api/health | `back:8000` |
| PostgreSQL | 127.0.0.1:5433 | `db:5432` |

As portas 8000 e 5173 não são usadas de propósito: outros projetos desta máquina já as ocupam.

O login inicial é só de demonstração (`SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`). A loja, esse usuário e as conversas fictícias ficam em `back/crm/demo`. Para apagar tudo isso de uma vez:

```sh
docker compose exec back python manage.py clear_demo
```

## Segurança desta etapa

- Sessão no cookie `crm_session`, HttpOnly.
- CSRF no cookie `crm_csrf`; o axios envia `X-CSRF-Token`.
- Cada consulta fica presa à loja do usuário.
- `/api/webhooks/meta` responde 401 até existir verificação de assinatura.

A Cloud API e o Instagram entram depois. Sem QR code.
