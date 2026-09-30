# Toyamas Cloud — Installation & VPS Setup Guide

This guide details the end-to-end setup process on a fresh **Ubuntu 22.04 / 24.04 LTS VPS** (4 vCPU, 8 GB RAM, targeted for `wildanstore.my.id`).

---

## 1. Domain & DNS Configuration

Before starting, configure your DNS provider (e.g. Cloudflare, Namecheap) with the following records pointing to your VPS Public IPv4:

| Type | Host | Target | Proxy Status |
|---|---|---|---|
| **A** | `@` | `<VPS_PUBLIC_IPV4>` | DNS Only (Gray Cloud) |
| **A** | `*` (Wildcard) | `<VPS_PUBLIC_IPV4>` | DNS Only (Gray Cloud) |

> **Important**: Set Proxy Status to **DNS Only** (disable Cloudflare proxy orange cloud) so that Caddy can directly complete the ACME HTTP/TLS-ALPN challenge for automated SSL issuance.

---

## 2. Server Preparation & Firewall

SSH into your VPS as `root` or a `sudo` user:

```bash
# 1. Update packages
sudo apt update && sudo apt upgrade -y

# 2. Configure Firewall (Only allow SSH, HTTP, and HTTPS)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw --force enable
```

---

## 3. Install Docker Engine & Network

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo rm get-docker.sh

# Enable Docker on boot
sudo systemctl enable docker
sudo systemctl start docker

# Create internal bridge network
docker network create toyamas-network
```

---

## 4. Deploy Toyamas Cloud

```bash
# Clone the repository
git clone https://github.com/Wildanel321/Toyamas-Cloud.git /opt/toyamas-cloud
cd /opt/toyamas-cloud

# Create environment configuration
cp .env.example .env
nano .env
```

Generate secure secrets for `JWT_SECRET` and `ENCRYPTION_KEY`:

```bash
openssl rand -base64 32
openssl rand -hex 32
```

Launch the cluster stack:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 5. Initial Administrator Onboarding

Open your browser and navigate to:

```text
https://wildanstore.my.id
```

You will be greeted by the **First-Time Setup Wizard**. Fill in your administrator name, email, and master password. Once submitted, your administrator account is locked as the primary `ADMIN` role.
