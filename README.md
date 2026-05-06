# HireScope

HireScope is a SaaS-style technical interview practice platform: AI-generated question sets, rubric-style scoring, charts for progress, JWT auth, multi-provider social login, multi-method 2FA, rate limiting/security headers, and an admin dashboard with audit logs.

## Tech stack

- **Backend**: FastAPI + SQLModel (SQLite locally, Postgres-ready via `DATABASE_URL`)
- **Frontend**: React + Vite + React Router + Axios + Recharts
- **Tests**: `pytest` (+ coverage gate) and Playwright E2E
- **Deploy**: Docker Compose + Nginx + GitHub Actions deploy workflow (`.github/workflows/deploy.yml`)

## Local development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Notes:

- Password hashing uses **`pbkdf2_sha256`** via Passlib (stable across Python/bcrypt versions).
- OAuth providers supported in backend router: Google, GitHub, LinkedIn, Microsoft.
- 2FA methods supported: TOTP, email OTP, SMS OTP (Twilio), backup codes.
- Optional **admin bootstrap**: register a user, set `BOOTSTRAP_ADMIN_EMAIL` in `.env` to that email, restart API → user becomes `admin`.

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

Local API calls use the **Vite proxy**: the SPA requests `/api/...` which forwards to FastAPI on port **8000**. Set `VITE_BACKEND_ORIGIN=http://127.0.0.1:8000` in `frontend/.env` for OAuth redirect links.

Optional: set `VITE_API_URL=http://127.0.0.1:8000` to bypass the proxy and call the API directly (same port as uvicorn).

Backend CORS: if `FRONTEND_URL` is unset, both `http://localhost:5173` and `http://127.0.0.1:5173` are allowed. In production, set `FRONTEND_URL` to your deployed SPA origin (comma-separated for multiple).

## Testing

### Backend unit/integration tests + coverage

```bash
cd backend
pytest --cov=. --cov-config=.coveragerc --cov-fail-under=85
```

### Playwright (starts backend + frontend automatically)

```bash
cd frontend
npm ci
npx playwright install chromium
npm run test:e2e
```

## Deployment sketch (VPS)

Docker assets are under `docker/`:

- `docker/Dockerfile.backend`
- `docker/Dockerfile.frontend`
- `docker/docker-compose.yml`
- `docker/nginx.conf`

Example:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Use `deploy.yml` with repository secrets (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`) for automatic SSH deploy after CI succeeds on `main`.

## CI

GitHub Actions runs backend tests with coverage gating, builds the frontend, then runs Playwright against local servers.
