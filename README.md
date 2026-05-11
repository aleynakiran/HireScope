# HireScope

HireScope is a SaaS-style technical interview practice platform: AI-generated question sets, rubric-style scoring, charts for progress, JWT auth, multi-provider social login, multi-method 2FA, rate limiting/security headers, and an admin dashboard with audit logs.

## Tech stack

- **Backend**: FastAPI + SQLModel (SQLite locally, Postgres-ready via `DATABASE_URL`)
- **Frontend**: React + Vite + React Router + Axios + Recharts
- **Tests**: `pytest` (+ coverage gate) and Playwright E2E
- **Deploy**: Railway (PostgreSQL + backend API + static frontend)

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
- OAuth providers supported in backend router: Google, GitHub, LinkedIn, Discord.
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
pytest --cov=. --cov-config=.coveragerc --cov-fail-under=90
```

### Playwright (starts backend + frontend automatically)

```bash
cd frontend
npm ci
npx playwright install chromium
npm run test:e2e
```

## Production demo (Railway)

Production uses **three Railway services**: PostgreSQL, backend API, and static frontend. After any deploy, confirm URLs under each service → **Settings → Networking → Public domain** (domains may change if regenerated).

**Live links** (replace with your current Railway domains if different):

| What | URL |
|------|-----|
| **Frontend (SPA)** | https://frontend-service-production-551d.up.railway.app |
| **Backend health** | https://hirescope-production-1130.up.railway.app/health |
| **API docs (Swagger)** | https://hirescope-production-1130.up.railway.app/docs |
| **OpenAPI JSON** | https://hirescope-production-1130.up.railway.app/openapi.json |

**Notes**

- A `GET` on the backend **root `/`** returns a small JSON landing payload with links to `/health`, `/docs`, and `/openapi.json`.
- In production, set backend **`FRONTEND_URL`** to the exact frontend origin (HTTPS, no trailing slash unless you intend it). Use comma-separated values if you have multiple origins.
- OAuth (Google, GitHub, LinkedIn, Discord): each provider’s **authorized redirect URI** must match backend env `*_REDIRECT_URI`, e.g. `https://<backend-host>/oauth/google/callback`.
- Frontend build-time API base: set **`VITE_API_URL`** and **`VITE_BACKEND_ORIGIN`** to the backend HTTPS origin, then redeploy the frontend so Vite embeds them.
- Container builds remain available via `docker/Dockerfile.backend` and `docker/Dockerfile.frontend` if you want to reuse them outside Railway.

### Hocaya / değerlendirme teslimi (kısa metin)

Aşağıdakileri e-posta veya rapora yapıştırabilirsin (linkleri kendi güncel Railway domain’lerinle değiştir):

> **Canlı demo:** Uygulama Railway üzerinde yayında.  
> **Arayüz:** https://frontend-service-production-551d.up.railway.app  
> **API sağlık kontrolü:** https://hirescope-production-1130.up.railway.app/health  
> **API dokümantasyonu:** https://hirescope-production-1130.up.railway.app/docs  
> **Kaynak kod:** Bu GitHub deposu (`main` branch).  
> **Deneme akışı:** Kayıt → giriş → yeni mülakat → soruları cevapla → sonuçlar.  
> **Not:** Backend kök (`/`) API özet JSON’u döner; ayrıca `/health` ve `/docs` kullanılabilir. OAuth için sağlayıcı panellerinde callback URL’lerinin prod backend ile eşleşmesi gerekir.

## CI

GitHub Actions runs backend tests with coverage gating, builds the frontend, then runs Playwright against local servers.

## Screenshots

Running app (files in [`screenshots/`](./screenshots/)):

**Login — email, password, and social OAuth**

![Login](./screenshots/login.png)

**Dashboard overview**

![Dashboard](./screenshots/dashboard.png)

**Dashboard — session list / interview history**

![Dashboard sessions](./screenshots/dashboard_sessions.png)

**New interview session**

![New interview session](./screenshots/newinterview_session.png)

**Per-question feedback / answer evolution**

![Question feedback](./screenshots/evolution_answers.png)

**Model answer (“how would AI answer this?”)**

![AI model answer](./screenshots/how_would_answer_ai.png)

**Results summary**

![Results](./screenshots/results.png)

**Rate limiting — `POST /auth/login` → HTTP 429 (DevTools Network)**

![Rate limit 429](./screenshots/429.png)

**Railway — HireScope service variables (masked values)**

![Railway variables](./screenshots/railway_hireScope_Variables.png)
