# 🌐 Domaines et Infrastructure DNS

Guide complet des domaines nécessaires pour déployer ClaudeNest en production.

---

## 📋 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE DOMAINES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🌐 DOMAINES PRINCIPAUX                                                      │
│  ─────────────────────                                                       │
│                                                                              │
│  claudenest.io              → Site marketing + Landing page                 │
│  www.claudenest.io          → Redirect vers claudenest.io                   │
│                                                                              │
│  🔧 SOUS-DOMAINES TECHNIQUES                                                 │
│  ───────────────────────────                                                 │
│                                                                              │
│  app.claudenest.io          → Web Dashboard (Vue.js SPA)                    │
│  api.claudenest.io          → API REST + WebSocket (Laravel)                │
│  ws.claudenest.io           → WebSocket dédié (Reverb) - Optionnel          │
│                                                                              │
│  📚 DOCUMENTATION & SUPPORT                                                  │
│  ──────────────────────────                                                  │
│                                                                              │
│  docs.claudenest.io         → Documentation (ReadMe/Docusaurus)             │
│  status.claudenest.io       → Status page (UptimeRobot/StatusPage)          │
│  help.claudenest.io         → Support/FAQ (Zendesk/Help Scout)              │
│  blog.claudenest.io         → Blog technique (Ghost/WordPress)              │
│                                                                              │
│  📦 ASSETS & CDN                                                             │
│  ────────────────                                                            │
│                                                                              │
│  cdn.claudenest.io          → CDN pour assets statiques                     │
│  assets.claudenest.io       → Images, logos, branding                       │
│                                                                              │
│  🔐 SÉCURITÉ & MONITORING                                                    │
│  ────────────────────────                                                    │
│                                                                              │
│  admin.claudenest.io        → Panel admin (si séparé du dashboard)          │
│  monitor.claudenest.io      → Monitoring interne (Grafana)                  │
│                                                                              │
│  🧪 ENVIRONNEMENTS                                                           │
│  ───────────────────                                                         │
│                                                                              │
│  staging.claudenest.io      → Environnement de test                         │
│  dev.claudenest.io          → Environnement développement                   │
│  beta.claudenest.io         → Beta/Early access                             │
│                                                                              │
│  📱 MOBILE & DEEP LINKS                                                      │
│  ──────────────────────                                                      │
│                                                                              │
│  claudenest.io/.well-known/ → Apple App Site Association                    │
│  claudenest.io/.well-known/ → Android Asset Links                           │
│  go.claudenest.io           → URL shortener pour deep links                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Domaines Obligatoires (MVP)

### 1. `claudenest.io` (Principal)
**Usage:** Site marketing, landing page, redirection vers app

**Configuration DNS:**
```dns
Type    Name              Value                           TTL
A       @                 185.199.108.153                 3600
A       @                 185.199.109.153                 3600
A       @                 185.199.110.153                 3600
A       @                 185.199.111.153                 3600
CNAME   www               claudenest.github.io.           3600
```

**Nginx Config:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name claudenest.io www.claudenest.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.claudenest.io;
    return 301 https://claudenest.io$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name claudenest.io;
    
    root /var/www/landing;
    index index.html;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/claudenest.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudenest.io/privkey.pem;
}
```

---

### 2. `app.claudenest.io` (Dashboard)
**Usage:** Application web Vue.js, tableau de bord utilisateur

**Configuration DNS:**
```dns
Type    Name              Value                           TTL
A       app               <SERVER_IP>                     3600
```

**Nginx Config:**
```nginx
server {
    listen 443 ssl http2;
    server_name app.claudenest.io;
    
    root /opt/claudenest/packages/server/public;
    index index.php;
    
    # API routes
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # Web Dashboard SPA
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    ssl_certificate /etc/letsencrypt/live/claudenest.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudenest.io/privkey.pem;
}
```

---

### 3. `api.claudenest.io` (API + WebSocket)
**Usage:** API REST Laravel + WebSocket Reverb

**Configuration DNS:**
```dns
Type    Name              Value                           TTL
A       api               <SERVER_IP>                     3600
```

**Nginx Config:**
```nginx
upstream reverb {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl http2;
    server_name api.claudenest.io;
    
    root /opt/claudenest/packages/server/public;
    index index.php;
    
    # CORS headers pour l'API
    add_header 'Access-Control-Allow-Origin' 'https://app.claudenest.io' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    
    # WebSocket Reverb
    location /app {
        proxy_pass http://reverb;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
    
    # API routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    ssl_certificate /etc/letsencrypt/live/claudenest.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/claudenest.io/privkey.pem;
}
```

---

## 📚 Domaines Recommandés (Post-MVP)

### 4. `docs.claudenest.io`
**Usage:** Documentation technique, API reference

**Hébergement:**
- [ReadMe](https://readme.com) - Documentation moderne
- [Docusaurus](https://docusaurus.io) - Open source
- [GitBook](https://gitbook.com) - Simple et rapide
- [MkDocs](https://www.mkdocs.org) - Static site

**Configuration DNS:**
```dns
CNAME   docs    <readme-custom-domain>.readme.io.    3600
```

---

### 5. `status.claudenest.io`
**Usage:** Page de statut des services

**Outils recommandés:**
- [UptimeRobot](https://uptimerobot.com) - Gratuit
- [StatusPage](https://www.atlassian.com/software/statuspage) - Atlassian
- [Cachet](https://cachethq.io) - Open source
- [Upptime](https://upptime.js.org) - GitHub Actions

**Configuration DNS:**
```dns
CNAME   status    <statuspage-id}.statuspage.io.    3600
```

---

### 6. `staging.claudenest.io`
**Usage:** Environnement de test pré-production

**Configuration DNS:**
```dns
A       staging    <STAGING_SERVER_IP>    3600
```

**Nginx Config:**
```nginx
server {
    listen 443 ssl http2;
    server_name staging.claudenest.io;
    
    # Basic auth pour protéger le staging
    auth_basic "Staging Environment";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    # Same config as production
    root /opt/claudenest-staging/packages/server/public;
    ...
}
```

---

## 📱 Configuration Mobile (Deep Links)

### Universal Links (iOS) + App Links (Android)

**Fichier:** `claudenest.io/.well-known/apple-app-site-association`
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.claudenest.app",
        "paths": [
          "/session/*",
          "/machine/*",
          "/approve/*",
          "/NOT /api/*"
        ]
      }
    ]
  }
}
```

**Fichier:** `claudenest.io/.well-known/assetlinks.json`
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.claudenest.app",
    "sha256_cert_fingerprints": [
      "AA:BB:CC:DD:EE:FF:..."
    ]
  }
}]
```

---

## 📧 Configuration Email

### MX Records
```dns
Type    Priority    Name    Value                           TTL
MX      10          @       mx1.mailgun.org.                3600
MX      10          @       mx2.mailgun.org.                3600
TXT             @       v=spf1 include:mailgun.org ~all   3600
TXT             @       v=DMARC1; p=quarantine; rua=mailto:dmarc@claudenest.io  3600
```

### Emails utilisés
```
noreply@claudenest.io       → Notifications système
support@claudenest.io       → Support client
contact@claudenest.io       → Contact général
security@claudenest.io      → Signalement sécurité
admin@claudenest.io         → Administration
```

---

## 🔒 Configuration SSL/TLS

### Let's Encrypt (Recommandé)
```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat wildcard
sudo certbot certonly --manual --preferred-challenges=dns \
  -d claudenest.io \
  -d *.claudenest.io \
  --email admin@claudenest.io \
  --agree-tos

# Ou certificat standard
sudo certbot --nginx \
  -d claudenest.io \
  -d www.claudenest.io \
  -d app.claudenest.io \
  -d api.claudenest.io
```

### Renew automatique
```bash
# Test renew
sudo certbot renew --dry-run

# Cron (déjà configuré par certbot)
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🌍 CDN & Performance

### Cloudflare (Recommandé)

**Avantages:**
- DDoS protection
- SSL gratuit
- Cache global
- Compression

**Configuration:**
1. Changer les NS du domaine vers Cloudflare
2. Configurer les records DNS dans Cloudflare
3. Activer "Always Use HTTPS"
4. Configurer Page Rules pour le cache

**Page Rules:**
```
# Cache assets statiques
claudenest.io/static/*
Cache Level: Cache Everything
Browser Cache TTL: 1 month

# API jamais en cache
api.claudenest.io/api/*
Cache Level: Bypass
```

---

## 🗂️ Récapitulatif DNS Complet

```dns
; Domaine principal
claudenest.io.        3600  IN  A     <SERVER_IP>
www.claudenest.io.    3600  IN  CNAME claudenest.io.

; Application
app.claudenest.io.    3600  IN  A     <SERVER_IP>
api.claudenest.io.    3600  IN  A     <SERVER_IP>
ws.claudenest.io.     3600  IN  A     <SERVER_IP>  ; Optionnel

; Documentation & Support
docs.claudenest.io.   3600  IN  CNAME <docs-provider>.
status.claudenest.io. 3600  IN  CNAME <status-provider>.
help.claudenest.io.   3600  IN  CNAME <help-provider>.
blog.claudenest.io.   3600  IN  CNAME <blog-provider>.

; Assets
cdn.claudenest.io.    3600  IN  CNAME <cdn-provider>.

; Environnements
staging.claudenest.io. 3600 IN  A     <STAGING_IP>
dev.claudenest.io.    3600  IN  A     <DEV_IP>
beta.claudenest.io.   3600  IN  A     <BETA_IP>

; Email
claudenest.io.        3600  IN  MX    10 mx1.mailgun.org.
claudenest.io.        3600  IN  MX    10 mx2.mailgun.org.
claudenest.io.        3600  IN  TXT   "v=spf1 include:mailgun.org ~all"
_dmarc.claudenest.io. 3600  IN  TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@claudenest.io"

; Vérification domaine (exemples)
claudenest.io.        3600  IN  TXT   "google-site-verification=xxx"
claudenest.io.        3600  IN  TXT   "github-verification=xxx"
```

---

## 💰 Coûts Estimés

| Service | Coût annuel | Notes |
|---------|-------------|-------|
| Domaine `.io` | ~50€ | Gandi/Namecheap/Cloudflare |
| SSL Let's Encrypt | 0€ | Gratuit |
| Cloudflare Pro | 240€ | Optionnel (features avancées) |
| Mailgun | 0-300€ | Gratuit jusqu'à 10k emails/mois |
| StatusPage | 0-348€ | UptimeRobot gratuit |
| **Total** | **50-900€** | Selon options choisies |

---

## ✅ Checklist Mise en Place

### Phase 1: MVP (Obligatoire)
- [ ] Acheter `claudenest.io`
- [ ] Configurer DNS de base (A/CNAME)
- [ ] SSL Let's Encrypt
- [ ] `app.claudenest.io` → Dashboard
- [ ] `api.claudenest.io` → API + WebSocket
- [ ] Email `noreply@claudenest.io`

### Phase 2: Post-Launch
- [ ] `docs.claudenest.io` → Documentation
- [ ] `status.claudenest.io` → Status page
- [ ] `staging.claudenest.io` → Environnement test
- [ ] Deep links mobile (.well-known)
- [ ] CDN pour assets

### Phase 3: Scale
- [ ] Cloudflare Pro
- [ ] Multi-region DNS
- [ ] Domaines localisés (claudenest.fr, etc.)

---

## 📖 Références

- [Let's Encrypt](https://letsencrypt.org)
- [Cloudflare DNS](https://www.cloudflare.com/dns/)
- [Apple Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Mailgun](https://www.mailgun.com)
