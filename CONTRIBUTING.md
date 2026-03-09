## Contributing to Devboard Pro

Thanks for your interest in improving Devboard Pro. This document describes how to work with the repo and what we expect from contributions.

---

### How the project is structured

- **Frontend** (React + Vite + TypeScript): `src/`
- **Backend API** (Express + MongoDB): `server/`
- **Shared configs**: `package.json`, `eslint.config.js`, `tailwind.config.ts`, `components.json`
- **CI & deploy**:
  - GitHub Actions CI: `.github/workflows/ci.yml`
  - GitHub Pages deploy: `.github/workflows/pages.yml`

The frontend talks to the backend via `VITE_API_URL` (see the `README.md` for environment setup).

---

### Getting set up for development

1. **Install dependencies**

```bash
npm install
cd server && npm install && cd ..
```

2. **Create env files**

- Copy `server/.env.example` to `server/.env` and adjust values.
- Optionally add a root `.env` with `VITE_API_URL` for local dev.

3. **Run the app**

```bash
cd server
npm run dev        # start API on http://localhost:4000

cd ..
npm run dev        # start frontend on http://localhost:8080
```

---

### Pull request guidelines

Before opening a PR:

- **Keep changes focused**: preferably one feature/fix per PR.
- **Run checks locally**:

```bash
npm run lint
npm test -- --run
npm run build

cd server
npm test -- --run
cd ..
```

- **Avoid committing secrets**:
  - Do not commit `.env` or `server/.env`.
  - Use the `*.example` files to document configuration.

PRs should:

- Include a short description of **what** and **why**.
- Mention any breaking changes or migrations.
- Include tests where it makes sense (especially for backend routes and auth).

---

### Coding style

- **TypeScript / React**
  - Prefer explicit types instead of `any`.
  - Keep hooks dependency arrays correct (no missing deps).
  - Use existing UI primitives (shadcn/ui components under `src/components/ui`) for consistency.

- **Backend**
  - Keep routes small and focused under `server/src/routes/**`.
  - Reuse shared helpers from `server/src/config/**` when adding new security or logging logic.
  - Validate and sanitize user input; return consistent JSON error shapes.

---

### Reporting bugs and requesting features

If you’re not ready to open a PR:

- **Bugs**: include steps to reproduce, expected vs actual behavior, and environment (browser, Node version, etc.).
- **Features**: describe the problem you’re solving and how it fits the existing UX (dashboard, snippets/notes/projects, tags, auth, etc.).

---

### Security and responsible disclosure

Please **do not** open public issues for vulnerabilities. Instead, see `SECURITY.md` for how to report security concerns privately so we can address them quickly and safely.

