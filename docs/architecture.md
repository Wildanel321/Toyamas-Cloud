# Toyamas Cloud Architecture

## 1. Overview

Toyamas Cloud is structured as a modular monolithic Platform-as-a-Service (PaaS) built for single-node Ubuntu VPS instances.

```text
                    INTERNET
                       │
                       ▼
                 Caddy / Proxy (:80, :443)
                       │
                       ▼
              Toyamas Cloud Control Plane (:3000)
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      PostgreSQL      Redis      Docker Engine (unix:///var/run/docker.sock)
      (Data & State) (Queues)         │
                    ┌─────────────────┼───────────────┐
                    ▼                 ▼               ▼
                 App A             App B           App C
```

---

## 2. Core Components

### 2.1 Control Plane
- **Framework**: Next.js 15 (App Router, Server Components + Route Handlers).
- **Authentication**: Bcrypt password hashing (12 rounds), JOSE JWT token storage in secure `httpOnly` cookies, role-based access control (`ADMIN`, `USER`).
- **Telemetry**: Real-time OS introspection via Node.js subsystem metrics (CPU load, memory distribution, uptime, host details).

### 2.2 Data Layer
- **PostgreSQL 16**: Primary source of truth for users, projects, deployment metadata, domains, and audit trails.
- **Prisma ORM**: Strict TypeScript schemas, automated migrations, and connection pooling.
- **Redis 7**: Background task queue, asynchronous deployment jobs, and system rate limiting.

### 2.3 Container Runtime
- **Docker Engine API**: Direct communication via Unix domain socket `/var/run/docker.sock`.
- **Resource Sandboxing**: CPU quota limits (`CpuQuota`/`CpuPeriod`), Memory max limits (`Memory`), and process constraints (`PidsLimit`).

### 2.4 Reverse Proxy & SSL
- **Caddy Web Server**: Dynamic upstream routing to internal Docker container ports and automatic TLS certificate provisioning.
