# El Dera's Writes

Blog platform: a **FastAPI** backend (`backend/`) and a React + Vite frontend (`frontend/`).

## Site sections

Categories form a two-level tree. These sections are created automatically at startup:

| Section | Sub-sections |
| --- | --- |
| Books | Christian Non-Fiction Books · Children's Bible Stories |
| Every Word Series | Teaching Series · Questions Young People Ask! |
| Health and Healing | Health Education · Health and Fitness Equipment |

Every article belongs to one category. Filtering by a section (`GET /articles/?category=books`)
includes its sub-sections, and `GET /categories/tree/` returns the whole tree with article counts.
Admins can add or rearrange sections through `/categories/`.

## Backend

Layered like the Banwee API, each layer split by domain (`accounts`, `content`, `system`, `analytics`):

```text
backend/
├── api/         HTTP routers: routing, auth dependencies, response models
├── services/    business logic and database access (never returns schemas)
├── models/      SQLAlchemy ORM models
├── schemas/     Pydantic request/response contracts
├── core/        config, async DB, security, dependencies, errors, pagination
├── alembic/     migrations
├── scripts/     ops scripts (superadmin)
├── tests/       mirrors the layers above
└── main.py
```

Async SQLAlchemy 2 (asyncpg / aiosqlite), Pydantic v2, JWT auth. Routes are served under `/v1` and,
for the deployed frontend, also unprefixed. It uses the same tables and password-hash format as the
previous Django backend, so it runs against the existing PostgreSQL (Neon) database.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # SQLite is used when DATABASE_URL is unset
alembic upgrade head          # PostgreSQL; SQLite dev databases are created automatically
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me python -m scripts.superadmin
uvicorn main:app --reload     # docs at http://localhost:8000/docs (not in production)
pytest                        # in-memory SQLite
ruff check .
```

| Env var | Purpose |
| --- | --- |
| `ENVIRONMENT` | `dev`, `test` or `production` (production requires a real `SECRET_KEY` and PostgreSQL). |
| `SECRET_KEY` | JWT signing key, 32+ characters in production. |
| `DATABASE_URL` | PostgreSQL URL; defaults to local SQLite. |
| `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL` | Allowed frontend origins (comma-separated). |
| `CORS_ALLOWED_ORIGIN_REGEX` | Optional, e.g. for Cloudflare Pages preview URLs. |
| `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `SUPPORT_EMAIL` | Email through Brevo; unset key means no email is sent. `SUPPORT_EMAIL` receives admin notifications. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Owner account ensured at startup (12+ chars in production). |

### Emails

Branded with the site logo (loaded from `FRONTEND_URL/brand/mark-black.png`), sent in the background so a
mail failure never fails a request: new feedback (to `SUPPORT_EMAIL`, reply-to the sender), a
confirmation to the person who sent feedback, a new-comment notice (to `SUPPORT_EMAIL`, skipped for
admins' own comments), and a welcome when an admin creates a user. Templates live in
`backend/core/utils/messages/templates/`.

### Existing database

`alembic upgrade head` is safe on the database the Django backend created: revision `0001` only creates
missing tables, and `0002` adds `slug`, `parent_id`, `sort_order` and `is_active` to `categories`
(slugs are derived from existing names). Render runs it before each deploy.

### Behaviour changes from the Django backend

- `POST /auth/create-user/` (and `/create-superuser/`) used to let anyone create an admin. It now works
  only when no users exist yet, or for a logged-in admin.
- No default `admin@gmail.com` / `admin` account; set `ADMIN_EMAIL` / `ADMIN_PASSWORD` instead.
- Refresh tokens are stateless (rotated on use, but old ones are not blacklisted).
- Article create/update take `category` (name, slug or id) and `tags` (names; created if missing).
- Replaced `DEBUG` with `ENVIRONMENT`.

## CI

`.github/workflows/backend-ci.yml` runs ruff, the tests (SQLite and PostgreSQL, Python 3.11/3.12), then
migrates a fresh PostgreSQL database, checks the models and migrations agree (`alembic check`), and boots
the server in production mode for a smoke test.

## Deployment

Backend: Render (`render.yaml`). Frontend: set `VITE_API_URL` to the backend URL and host the
`frontend/` build anywhere static (Netlify today; Cloudflare Pages planned).
