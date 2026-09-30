# Toyamas Cloud Security Model

## 1. Authentication & Session Management
- **Password Hashing**: Strong bcrypt salt work factor (12 rounds).
- **Session Tokens**: Cryptographically signed JSON Web Tokens (HS256) stored in `httpOnly`, `SameSite=Lax`, `Secure` cookies.
- **Middleware Enforcement**: Next.js Edge-compatible middleware intercepting all private routes and API endpoints.

## 2. Secrets Management & Encryption at Rest
- Environment variables and credentials are encrypted at rest using **AES-256-GCM** with unique 96-bit initialization vectors (IVs) and 128-bit authentication tags.
- Secrets are never logged or returned in plain text in public API responses.

## 3. Docker Socket Security
- Docker API interaction is restricted entirely to server-side backend services.
- The Docker socket (`/var/run/docker.sock`) is never exposed to browser clients or public networks.
- Strict input validation prevents arbitrary command injection and path traversal attacks.

## 4. Audit Logging
- Every administrative action, login attempt, failure, and state change is immutably recorded in the `audit_logs` table.
