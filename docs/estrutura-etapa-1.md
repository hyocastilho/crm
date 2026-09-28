# Arquitetura

```
Navegador
  http://127.0.0.1:5175
        |
web (Vite)  encaminha /api
        |
back (Django)  cookie HttpOnly, CSRF, ORM
        |
db (PostgreSQL 16)
```

`docker compose up` sobe os três. O `.env` fica só na raiz.

O Lovable e o Supabase não fazem parte deste sistema. A pasta `lovable` foi removida. A pasta `.vscode` também: ela só ajustava o editor e não entra na arquitetura.
