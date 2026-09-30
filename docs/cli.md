# Toyamas Cloud CLI Reference

The `toyamas` CLI allows developers and administrators to manage applications, deployments, and cluster health directly from the terminal.

---

## 1. Installation

```bash
npm install -g .
# Or run with npx
npx toyamas --help
```

---

## 2. Authentication

```bash
# Login to your Toyamas Cloud control plane
toyamas login admin@wildanstore.my.id MyPassword123! --url https://wildanstore.my.id
```

Credentials and tokens are stored in `~/.toyamas/config.json`.

---

## 3. Commands

### List Projects
```bash
toyamas projects
```

### Trigger Deployment
```bash
toyamas deploy dagangku
```

### View Live Container Runtime Logs
```bash
toyamas logs dagangku --tail 100
```

### Restart Application Container
```bash
toyamas restart dagangku
```

### Inspect Cluster & Host Telemetry
```bash
toyamas status
```
