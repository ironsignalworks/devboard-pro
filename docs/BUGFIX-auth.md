# DevBoard Pro — Auth & CORS Bug Fix (summary)

## Symptoms
- Auth login failed across environments when refresh tokens or legacy password fields were present.
- CORS preflight failed for deployed frontend origins.

## Root Causes
1. Some user documents used a legacy `password` field instead of `passwordHash` so `bcrypt.compare` received `undefined`.
2. CORS was configured for a single origin and blocked the deployed frontend.

## Fixes
- Strengthened `/api/auth/login` to support `passwordHash` and legacy `password` fields and added success logging.
- Added a one-off script `server/src/scripts/fixDemoUser.js` to update the demo user's record to include `passwordHash`.
- Added multi-origin support via `CORS_ORIGIN`.

## Recovery steps
1. Run the migration script once if needed:
   - `npm run migrate:passwords` — scans users and migrates legacy `password` fields to `passwordHash` (uses bcrypt).
2. Validate the demo user:
   - `node server/src/scripts/fixDemoUser.js` (sets demo password to `password123` if missing)
   - test login via UI or curl:
     - email: `demo@devboard.local`
     - password: `password123`
     - curl: `curl --% -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo@devboard.local","password":"password123"}'`

## Notes
- Consider running the migration script once on production data (backup first) to fully remove legacy password fields.
