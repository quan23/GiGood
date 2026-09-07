# 12 — Web Vite Admin (display-only) + Landing Stub

**Goal:** EXE201 web channel: throwaway landing page + display-only admin dashboard mirroring every entity (users/jobs/escrows/stats). Read-only over existing API — never blocks mobile path.

**Depends:** 01 (auth/JWT), 02 (jobs), 06 (escrow/admin release-refund tx). **Branch:** `feat/12-web-admin` off `master`.

**Out-of-scope:** Job posting/accept/chat flows on web (mobile owns them), SEO polish, FCM, role switch UI. Landing copy is placeholder BS — one hero + CTA + 3 feature cards, done.

**API contract (all exist by deps; F19 in `BACKEND_FEATURES_API.md`):**
- `POST /api/auth/login` → `{accessToken}` (admin = seeded `IsAdmin` user) → store in `localStorage`, `Authorization: Bearer` header.
- `GET /api/admin/stats` → dashboard cards `{users, jobsByStatus, escrowHeld, volumeToday}`.
- `GET /api/admin/users?query&cursor&limit` + `POST /api/admin/users/{id}/ban {banned}`.
- `GET /api/admin/jobs?status&cursor&limit` + `POST /api/admin/jobs/{id}/hide {hidden}`.
- `GET /api/admin/escrows?status` + `POST /api/admin/escrows/{id}/release|refund`.
- Public (no auth): `GET /api/meta/categories` for landing category chips.

**Web stack:** Vite + React + TS + React Router + axios (or fetch). No UI kit — plain CSS with GiGood tokens (`orange #ea580c / teal #0f766e / rounded-2xl`). Env: `VITE_API_BASE_URL` (dev `http://localhost:5000`, prod Render URL). No extra deps without ask.

**Files to touch:**
- `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`, `web/index.html`, `web/.env.example`
- `web/src/{main.tsx, App.tsx, api/client.ts, pages/Landing.tsx, pages/Login.tsx, pages/admin/{Dashboard.tsx, Users.tsx, Jobs.tsx, Escrows.tsx}, components/DataTable.tsx}`

**Steps:**
1. `npm create vite@latest web -- --template react-ts` (or hand-write minimal scaffold); set `server.port 5173`, `preview.port 4173`.
2. `api/client.ts`: axios instance with `baseURL = import.meta.env.VITE_API_BASE_URL`, request interceptor attaches `localStorage accessToken`, response interceptor on 401 → `localStorage.clear()` + redirect `/login`.
3. `Landing.tsx` (`/`): hero (GiGood name + tagline + CTA buttons → `/login`, APK link placeholder), 3 feature cards (Post job / Escrow safe / Chat), category chips from `GET /api/meta/categories`. Static, no auth.
4. `Login.tsx` (`/login`): phone+password → `POST /api/auth/login`; if user not admin → show "admin only" error; else save token → redirect `/admin`.
5. `admin/Dashboard.tsx` (`/admin`): 4 stat cards from `GET /api/admin/stats` + nav links.
6. `admin/Users.tsx` (`/admin/users`): table (name, phone, role, rating, banned) + search query + ban/unban button.
7. `admin/Jobs.tsx` (`/admin/jobs`): table (title, category, price, status, owner) + status filter + hide/unhide button.
8. `admin/Escrows.tsx` (`/admin/escrows`): table (job, payer→payee, amount, status) + status filter + release/refund buttons for Held rows (confirm dialog).
9. Guard: all `/admin/*` redirect `/login` when no token. `npm run build` outputs `web/dist` (Render static, see task 11).

**Acceptance:**
- `npm run dev` → `/` shows landing, `/login` admin login works against local API, `/admin` cards match `curl GET /api/admin/stats`.
- Users/Jobs/Escrows tables render real data; ban/hide/release/refund buttons return 204 and refresh row.
- `npm run build` green, `dist/` preview serves with prod `VITE_API_BASE_URL`.

**Verification:**
```bash
cd web && npm ci && npm run build
curl -s http://localhost:5000/api/admin/stats -H "Authorization: Bearer $ADMIN" | jq .
# browser: / -> /login (admin seed) -> /admin -> users/jobs/escrows tables
```

**Commit:** `feat(web): vite landing + display-only admin (#12)` — push to `master`.
