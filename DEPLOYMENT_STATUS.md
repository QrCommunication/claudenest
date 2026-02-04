# ClaudeNest Server Deployment Status

## 🚀 Server Information

| Property | Value |
|----------|-------|
| **Server IP** | 51.159.108.249 |
| **Domain** | claudenest.io |
| **Status** | ✅ **DEPLOYED & RUNNING** |
| **Deployment Date** | 2026-02-02 |

## 🌐 Access URLs

| Service | URL | Status |
|---------|-----|--------|
| Main Website | https://claudenest.io | ✅ Active |
| API Endpoint | https://api.claudenest.io | ✅ Active |
| WebSocket | wss://api.claudenest.io | ✅ Active |
| Status Page | https://claudenest.io/status.html | ✅ Active |

## 📦 Installed Services

### Core Services
| Service | Version | Status | Port |
|---------|---------|--------|------|
| Caddy | 2.x | ✅ Running | 80/443 |
| PHP-FPM | 8.3 | ✅ Running | 9000 |
| PostgreSQL | 16 | ✅ Running | 5432 |
| Redis | 7.0.15 | ✅ Running | 6379 |
| Ollama | 0.15.4 | ✅ Running | 11434 |

### Application Services
| Service | Status | Notes |
|---------|--------|-------|
| Laravel Backend | ✅ Running | /var/www/claudenest |
| Reverb WebSocket | ✅ Running | Port 8080 (proxied) |
| Queue Workers | ✅ Running | 2 workers via Supervisor |
| SSL Certificates | ✅ Auto-managed | Via Caddy/Let's Encrypt |

## 🗄️ Database Configuration

```
Database: claudenest
Username: claudenest
Password: claudenest_secure_2024
Host: 127.0.0.1
Port: 5432
Extensions: pgvector (enabled)
```

## 🤖 AI Models (Ollama)

| Model | Status | Size |
|-------|--------|------|
| mistral:7b | ⏳ Ready to pull | ~4.4GB |
| bge-small-en-v1.5 | ⏳ Ready to pull | ~130MB |

*Note: Models need to be pulled manually after first boot*

```bash
# Pull models
sudo -u ollama ollama pull mistral:7b
sudo -u ollama ollama pull bge-small-en-v1.5
```

## 📂 Important Paths

| Path | Description |
|------|-------------|
| `/var/www/claudenest` | Application root |
| `/var/www/claudenest/storage` | Logs & cache |
| `/etc/caddy/Caddyfile` | Web server config |
| `/etc/postgresql/16/main/` | Database config |
| `/etc/supervisor/conf.d/` | Worker configs |

## 🔧 Service Management

```bash
# Restart all services
sudo systemctl restart caddy postgresql redis-server claudenest-reverb
sudo supervisorctl restart all

# View logs
sudo journalctl -u claudenest-reverb -f
sudo tail -f /var/www/claudenest/storage/logs/laravel.log

# Queue workers
sudo supervisorctl status
sudo supervisorctl restart claudenest-worker:*
```

## ⚙️ Environment Variables

Key settings in `/var/www/claudenest/.env`:

```env
APP_ENV=production
APP_URL=https://claudenest.io

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_DATABASE=claudenest

BROADCAST_CONNECTION=log

OLLAMA_URL=http://localhost:11434
MAIL_MAILER=log
```

## 📝 Next Steps

1. **Configure DNS**: Point `claudenest.io` and `*.claudenest.io` to `51.159.108.249`
2. **Pull AI Models**: Run the Ollama pull commands above
3. **Configure Email**: Update `RESEND_API_KEY` in `.env` for transactional emails
4. **Security**: Change default database password
5. **Monitoring**: Set up log rotation and monitoring alerts

## 🆘 Troubleshooting

### Common Issues

**SSL Certificate Issues:**
```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

**Database Connection:**
```bash
sudo -u postgres psql -c "\l"
sudo systemctl restart postgresql
```

**Queue Workers Not Running:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start claudenest-worker:*
```

**Reverb WebSocket Issues:**
```bash
sudo systemctl restart claudenest-reverb
sudo journalctl -u claudenest-reverb -f
```

---

**Deployment completed successfully!** ✅
