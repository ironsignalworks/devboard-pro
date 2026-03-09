## Security Policy

### Supported versions

This is an actively developed project. The `main` branch is the primary supported version; older snapshots or forks may not receive fixes.

---

### Reporting a vulnerability

If you discover a security issue in Devboard Pro or its backend API, please **do not** open a public GitHub issue.

Instead:

1. Prepare a brief description including:
   - Affected area (frontend, backend, auth, data export/import, etc.)
   - Impact (e.g. data exposure, privilege escalation, account takeover)
   - Clear steps to reproduce
2. Contact the maintainers privately (for example via the email listed in the repo or project homepage).

We will:

- Acknowledge receipt as soon as possible.
- Investigate and confirm the issue.
- Work on a fix and coordinate a responsible disclosure timeline with you.

---

### Security notes (implementation overview)

- **Authentication**
  - Cookie-based session with httpOnly cookies (`accessToken`, `refreshToken`).
  - JWTs signed with `JWT_SECRET`; startup fails in production for weak/missing secrets.
  - Refresh tokens stored as hashes in MongoDB and rotated on `/api/auth/refresh`.

- **CSRF**
  - State-changing routes require a CSRF token header:
    - Backend sets a `csrfToken` cookie alongside auth cookies.
    - Frontend sends `x-csrf-token` for non-GET requests via the shared API client.

- **Password handling**
  - Passwords are hashed using bcrypt on the server.
  - Password reset and email verification use time-limited tokens stored as hashes.

- **Input & query handling**
  - Backend routes validate required fields.
  - Search and filter queries limit pagination and escape regex input to reduce abuse.

If you notice gaps or have suggestions for improving the security model (e.g. additional rate limits, content security, or sandboxing), please reach out via the private disclosure process above.

