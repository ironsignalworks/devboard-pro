## Devboard Pro

Devboard Pro is a personal developer workspace for managing snippets, notes, and projects in one place, with tagging, search, dashboards, and a polished UI.

The app is split into:
- **Frontend**: Vite + React + TypeScript + Tailwind + shadcn/ui (`src/`)
- **Backend API**: Express + MongoDB + JWT auth (`server/`)

GitHub Pages hosts the static frontend, and the backend runs separately (e.g. Render, Railway, or your own Node host) behind `VITE_API_URL`.

---

### Features

- **Auth & accounts**
  - Email/password login, registration, email verification
  - Guest/demo accounts with automatic expiry
  - Forgot/reset password flow
  - Cookie-based session with refresh tokens, CSRF protection, and `/api/auth/me`

- **Snippets, notes, and projects**
  - CRUD for code snippets and rich-text notes
  - Tagging and tag management (rename, delete, usage counts)
  - Project organization with drag-and-drop assignment of snippets/notes

- **Dashboard & productivity**
  - Overview cards (totals by type)
  - Recent activity / notifications
  - 7-day productivity chart (snippets/notes/projects)

- **Search & navigation**
  - Global search across snippets, notes, and projects
  - Sidebar navigation + configurable “quick actions”
  - Keyboard-friendly (e.g. search dialog)

---

### Tech stack

- **Frontend**
  - [Vite](https://vitejs.dev/) + React 18 + TypeScript
  - [React Router](https://reactrouter.com/) (client-side routing)
  - [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
  - [@tanstack/react-query](https://tanstack.com/query/latest) for data fetching
  - [Tiptap](https://tiptap.dev/) rich text editor

- **Backend**
  - [Express](https://expressjs.com/)
  - [MongoDB](https://www.mongodb.com/) via Mongoose
  - JWT auth with refresh tokens in httpOnly cookies
  - Email via SMTP or Resend (for verify/reset flows)
  - Rate limiting on auth endpoints

- **Tooling**
  - [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest) for tests
  - ESLint (TypeScript, React hooks, React Refresh)
  - GitHub Actions for CI + GitHub Pages deploy

---
