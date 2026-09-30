# Toyamas Cloud — Troubleshooting Guide

Common issues, diagnostics, and recovery procedures for single-VPS installations.

---

## 1. Docker Socket Access Issues

**Symptom**: `Failed to connect to Docker daemon: connect EACCES /var/run/docker.sock`

**Resolution**:
Ensure the user running Toyamas Cloud has permissions to access the Docker socket, or add the user to the `docker` group:

```bash
sudo usermod -aG docker $USER
sudo chmod 660 /var/run/docker.sock
```

When running in Docker Compose, ensure the volume mount is active:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

---

## 2. Caddy SSL Certificate Generation Failures

**Symptom**: `acme: error presenting token: could not reach domain`

**Resolution**:
1. Check that your DNS A record is pointed to your VPS Public IPv4.
2. In Cloudflare, make sure Proxy Status is set to **DNS Only** (Gray Cloud) for the initial certificate issuance.
3. Verify ports 80 and 443 are open in your VPS firewall:
   ```bash
   sudo ufw status
   ```

---

## 3. Container Out of Memory (OOM)

**Symptom**: `Container terminated with exit code 137 (OOMKilled)`

**Resolution**:
The application exceeded its memory limit. Go to **Project > Settings** in the dashboard and increase the Memory Allocation limit (e.g. from 256 MB to 512 MB or 1024 MB).

---

## 4. Resetting Administrator Password

If locked out, generate a new bcrypt hash and update PostgreSQL:

```bash
docker exec -it toyamas-postgres psql -U toyamas -d toyamas_cloud -c "UPDATE users SET \"passwordHash\" = 'NEW_BCRYPT_HASH' WHERE email = 'admin@wildanstore.my.id';"
```
