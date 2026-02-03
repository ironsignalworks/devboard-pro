# DevBoard — Auth & CORS Bug Fix (summary)

This document summarizes the recent fixes made to authentication, CORS, and related client/server improvements so you can reproduce, test, or roll back if needed.

## Symptoms
- Frontend could not reach the backend (CORS/network errors) when signing in.
- Login appeared to do nothing in the UI (no navigation), or dashboard showed placeholders because old token/user persisted.
- bcrypt `Illegal arguments: string, undefined` when comparing password due to mixed `password` vs `passwordHash` fields.

## Root causes
1. Incomplete CORS handling + preflight response which caused browser to block requests.
2. Some user documents used a legacy `password` field instead of `passwordHash` so bcrypt.compare received `undefined`.
3. Client auth state and routing not synchronizing reliably after login (race between saving token and route render).

## What was changed (high level)
### Server-side
- Improved CORS handling and preflight responses in `server/src/index.js`.
  - Use `cors({ origin: true, credentials: true })` and explicit preflight short-circuit.
  - Added request logging for debugging: `[req] METHOD PATH origin=...`.
- Added `GET /api/auth/me` to validate JWT and return the current user in `server/src/routes/auth.js`.
- Strengthened `/api/auth/login` to support `passwordHash` and legacy `password` fields and added success logging.
- Added a one-off script `server/src/scripts/fixDemoUser.js` to update the demo user's record to include `passwordHash`.

### Client-side
- `src/api/client.ts`: added logging and consistent error return shape for network errors.
- `src/context/AuthContext.tsx`: validates stored token by calling `/api/auth/me` on mount, exposes `loading` state and clears invalid tokens. Updated so manual `login()` updates state immediately (no full-page reload required).
- `src/components/ProtectedRoute.tsx`: waits for `loading` and only redirects to `/login` after validation completes.
- `src/pages/LoginPage.tsx`: improved submit flow — shows loading/error states and persists token+user via `AuthContext` (no forced reload now).

## Files added/modified (non-exhaustive)
- Modified: `server/src/index.js` (CORS, request logging, preflight)
- Modified: `server/src/routes/auth.js` (login, /me endpoint)
- Added: `server/src/scripts/fixDemoUser.js` (one-off migration script)
- Modified: `src/api/client.ts` (logging, error handling)
- Modified: `src/context/AuthContext.tsx` (token validation on mount)
- Modified: `src/components/ProtectedRoute.tsx` (use loading state)
- Modified: `src/pages/LoginPage.tsx` (loading/error, reload on success)

## How to test locally
1. Start backend
   - cd `server`
   - npm install
   - npm run dev
   - Confirm server logs: `MongoDB connected` and `Server on port 4000`.
2. Fix demo user (only if needed)
   - node `server/src/scripts/fixDemoUser.js` (sets demo password to `password123` if missing)
3. Start frontend (repo root)
   - npm install
   - Ensure `VITE_API_URL=http://localhost:4000` in frontend env (create `.env` at repo root if needed)
   - npm run dev (open the Local URL printed by Vite)
4. Login with demo user
   - email: `demo@devboard.local`
   - password: `password123`
   - Or curl: `curl --% -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo@devboard.local","password":"password123"}'`
5. Verify
   - Network tab shows POST /api/auth/login returning `{ token, user }`.
   - AuthContext `/api/auth/me` call should return `user`.
   - Protected routes render after login.

## New scripts and production notes
- `server/package.json` now includes:
  - `npm run fix:demo` — run the one-off script to update the demo user if needed.
  - `npm run migrate:passwords` — scans users and migrates legacy `password` fields to `passwordHash` (uses bcrypt).

- CORS handling:
  - In development the server allows all origins. In production set the `CORS_ORIGIN` environment variable to your frontend origin (e.g. `https://app.example.com`) before starting the server. The server will use that origin when `NODE_ENV=production`.

## Follow-ups
- The client no longer forces a full reload after login; state updates are handled in `AuthContext`.
- Consider running the migration script once on production data (backup first) to fully remove legacy password fields.


