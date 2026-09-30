# Toyamas Cloud

> **Simple deployment. Your infrastructure.**

Toyamas Cloud is a lightweight, self-hosted Platform-as-a-Service (PaaS) designed to deploy and manage web applications and container workloads seamlessly on a single Ubuntu VPS (targeted for `wildanstore.my.id`).

---

## Key Features

- **Developer-Centric Dashboard**: Real-time overview of projects, deployments, resources, and cluster metrics without fake mockups.
- **Git-Integrated Workflow**: Connect GitHub/Git repositories and branch tracking.
- **Automated Container Builds**: Docker build orchestration for Node.js, Next.js, Python, Laravel, and custom Dockerfiles.
- **Dynamic Reverse Proxy**: Integrated Caddy reverse proxy with automated TLS/SSL certificate provisioning.
- **Resource Limiting**: Strict CPU, memory, and process sandboxing per container to protect host stability.
- **Security by Default**: Bcrypt password hashing, AES-256-GCM encryption for environment secrets at rest, secure httpOnly session cookies, and comprehensive audit trails.

---

## Quick Start (Development)

### 1. Prerequisites
- Node.js >= 20
- Docker & Docker Compose
- Git

### 2. Setup Local Environment

```bash
# Clone the repository
git clone <repo-url> toyamas-cloud
cd toyamas-cloud

# Copy environment template
cp .env.example .env

# Start local PostgreSQL & Redis development services
docker compose up -d

# Install dependencies
npm install

# Generate Prisma Client & push schema
npx prisma db push

# Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to initialize your administrator account via the first-time setup wizard.

---

## Testing

```bash
# Run unit & integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Architecture

```text
                    INTERNET
                       │
                       ▼
                 Caddy / Proxy
                       │
                       ▼
              Toyamas Cloud API
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      PostgreSQL      Redis      Docker Engine
                                      │
                    ┌─────────────────┼───────────────┐
                    ▼                 ▼               ▼
                 App A             App B           App C
```

---

## Documentation

- [Architecture Guide](docs/architecture.md)
- [Development Workflow](docs/development.md)
- [API Reference](docs/api.md)
- [Security Model](docs/security.md)
- [Roadmap](docs/roadmap.md)
