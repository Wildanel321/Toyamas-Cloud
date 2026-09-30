# Toyamas Cloud — Application Deployment Workflow

This guide details how applications are built, isolated, and deployed on Toyamas Cloud.

---

## 1. Supported Application Runtimes

Toyamas Cloud includes native buildpacks and Dockerfile generation for:

- **Next.js**: Automatically detects `package.json`, detects pnpm/yarn/npm, executes standalone or standard build, exposes internal port 3000.
- **Node.js**: Generic Node.js microservices / Express / NestJS / Fastify applications.
- **Python**: FastAPI, Flask, and WSGI applications using `requirements.txt` and Python 3.11/3.12 slim.
- **Laravel**: PHP 8.2 / 8.3 CLI + Composer autoloader + Artisan server.
- **Custom Dockerfile**: If your repository contains a `Dockerfile` in the root, Toyamas Cloud uses it directly.

---

## 2. Resource Sandboxing

Every container is sandboxed to prevent resource starvation on the VPS:

| Preset | CPU Allocation | Memory Allocation | PIDs Limit |
|---|---|---|---|
| **Small** | 0.25 vCPU | 256 MB RAM | 200 |
| **Normal** | 0.50 vCPU | 512 MB RAM | 200 |
| **Large** | 1.00 vCPU | 1024 MB RAM | 200 |
| **Custom** | 0.1 – 4.0 vCPU | 64 – 8192 MB | Configurable |

---

## 3. Zero-Downtime Rollout Strategy

When a new deployment is triggered:

1. **Clone & Build**: Repository is cloned to a temporary build directory; Docker image is compiled.
2. **Launch & Isolate**: New container starts alongside the old container on `toyamas-network`.
3. **Health Check**: Probes the HTTP endpoint up to 10 times to verify response status `< 500`.
4. **Proxy Cutover**: Updates Caddy upstream routing to point to the new container.
5. **Teardown**: Gracefully stops and deletes the old container instance.
6. **Failure Safeguard**: If the new container fails health checks, it is destroyed immediately and the existing running container continues serving traffic without interruption.
