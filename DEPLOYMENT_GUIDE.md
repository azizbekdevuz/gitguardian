# 🚀 GitGuard Complete Deployment Guide

**From Zero to Production** - Deploy GitGuard to your VPS with your Hostinger domain.

---

## 📋 Prerequisites

- ✅ VPS with Ubuntu/Debian (Hostinger KVM2 or any Linux VPS)
- ✅ Domain name from Hostinger
- ✅ SSH access to your VPS
- ✅ Basic terminal knowledge

---

## 🎯 Overview

You'll deploy:
1. **Next.js Web App** (port 3000) - Node.js/PM2
2. **Python Agent Service** (port 8000) - FastAPI/Systemd
3. **Nginx Reverse Proxy** (port 80/443) - Public access
4. **Database** - SQLite (or PostgreSQL)

**All services will auto-start on boot and stay running even when terminal is closed!**

---

## 📝 Step 1: Domain DNS Configuration (Hostinger)

### 1.1 Get Your VPS IP Address

```bash
# On your VPS, run:
curl ifconfig.me
# Or check in Hostinger VPS panel
```

**Note your VPS IP address** (e.g., `123.45.67.89`)

### 1.2 Configure DNS in Hostinger

1. **Login to Hostinger** → Go to **Domains** → Select your domain
2. **Go to DNS Zone Editor** or **DNS Management**
3. **Add/Edit DNS Records:**

   **For main domain:**
   ```
   Type: A
   Name: @ (or leave blank)
   Points to: YOUR_VPS_IP (e.g., 123.45.67.89)
   TTL: 3600 (or default)
   ```

   **For www subdomain:**
   ```
   Type: A
   Name: www
   Points to: YOUR_VPS_IP (e.g., 123.45.67.89)
   TTL: 3600 (or default)
   ```

4. **Save** and wait 5-30 minutes for DNS propagation

### 1.3 Verify DNS (Optional)

```bash
# On your local machine, check:
nslookup yourdomain.com
# Should return your VPS IP

# Or use online tool:
# https://dnschecker.org
```

---

## 🖥️ Step 2: Initial VPS Setup

### 2.1 Connect to VPS

```bash
# From your local machine:
ssh root@YOUR_VPS_IP
# Or if you have a user:
ssh username@YOUR_VPS_IP

# If first time, you may need to accept the host key
```

### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Required Software

```bash
# Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.11+
sudo apt install -y python3 python3-pip python3-venv python3-dev

# Nginx (web server/reverse proxy)
sudo apt install -y nginx

# Git (to clone repository)
sudo apt install -y git

# Build tools (for native modules)
sudo apt install -y build-essential

# PM2 (process manager for Node.js)
sudo npm install -g pnpm pm2

# Verify installations
node --version    # Should be v20.x.x
python3 --version # Should be 3.11+
nginx -v
pm2 --version
pnpm --version
```

### 2.4 Create Application Directory

```bash
sudo mkdir -p /var/www/gitguardian
sudo chown -R $USER:$USER /var/www/gitguardian
```

---

## 📥 Step 3: Deploy Your Code

### 3.1 Upload Code to VPS

**Option A: Clone from Git (Recommended)**

```bash
cd /var/www/gitguardian
git clone https://github.com/YOUR_USERNAME/gitguardian.git .
# Or if private repo, use SSH:
# git clone git@github.com:YOUR_USERNAME/gitguardian.git .
```

**Option B: Upload via SCP (from local machine)**

```bash
# From your local machine (in project root):
scp -r . root@YOUR_VPS_IP:/var/www/gitguardian/
```

**Option C: Use rsync (from local machine)**

```bash
# From your local machine (in project root):
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'venv' \
  . root@YOUR_VPS_IP:/var/www/gitguardian/
```

### 3.2 Install Dependencies

```bash
cd /var/www/gitguardian

# Install all dependencies
pnpm install

# Build all packages
pnpm build
```

**This may take 5-10 minutes depending on your VPS specs.**

---

## 🐍 Step 4: Setup Python Agent Service

### 4.1 Create Virtual Environment

```bash
cd /var/www/gitguardian/apps/agent
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### 4.2 Create Environment File

```bash
cd /var/www/gitguardian/apps/agent
nano .env
```

**Add the following (replace with your actual values):**

```bash
# Anthropic API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Model Configuration
MODEL_NAME=claude-sonnet-4-20250514

# Server Configuration
PORT=8000
HOST=0.0.0.0

# Logging
LOG_LEVEL=INFO
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.3 Test Python Agent

```bash
cd /var/www/gitguardian/apps/agent
source venv/bin/activate
python main.py
```

**You should see:**
```
🚀 GitGuard Agent Service Starting
   Host: 0.0.0.0
   Port: 8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Press `Ctrl+C` to stop** (we'll set it up as a service next)

### 4.4 Create Systemd Service

```bash
sudo nano /etc/systemd/system/gitguard-agent.service
```

**Paste this (adjust paths if needed):**

```ini
[Unit]
Description=GitGuard Agent Service (SpoonOS AI Pipeline)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/gitguardian/apps/agent
Environment="PATH=/var/www/gitguardian/apps/agent/venv/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=/var/www/gitguardian/apps/agent/.env
ExecStart=/var/www/gitguardian/apps/agent/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=gitguard-agent

[Install]
WantedBy=multi-user.target
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.5 Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto-start on boot)
sudo systemctl enable gitguard-agent

# Start service
sudo systemctl start gitguard-agent

# Check status
sudo systemctl status gitguard-agent
```

**You should see:** `Active: active (running)`

**View logs:**
```bash
sudo journalctl -u gitguard-agent -f
```

**Press `Ctrl+C` to exit logs**

---

## 🌐 Step 5: Setup Next.js Web App

### 5.1 Create Environment File

```bash
cd /var/www/gitguardian/apps/web
nano .env.local
```

**Add the following (replace with your actual values):**

```bash
# Database (SQLite - simple, or use PostgreSQL for production)
DATABASE_URL="file:./gitguard.db"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="GENERATE_RANDOM_SECRET_HERE"

# Python Agent Service
AGENT_URL="http://localhost:8000"

# Optional: Anthropic API Key (for fallback)
ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Node Environment
NODE_ENV="production"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
# Copy the output and paste it as NEXTAUTH_SECRET
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 5.2 Setup Database

```bash
cd /var/www/gitguardian/apps/web

# Generate Prisma client
pnpm exec prisma generate

# Run database migrations
pnpm exec prisma migrate deploy

# Or if first time:
# pnpm exec prisma db push
```

### 5.3 Update PM2 Configuration

```bash
cd /var/www/gitguardian
nano ecosystem.config.js
```

**Update with your actual values:**

```javascript
module.exports = {
  apps: [
    {
      name: 'gitguard-web',
      script: 'apps/web/node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/gitguardian/apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        AGENT_URL: 'http://localhost:8000',
        NEXTAUTH_URL: 'https://yourdomain.com',  // ← Change this
        NEXTAUTH_SECRET: 'your-generated-secret-here',  // ← Change this
        DATABASE_URL: 'file:./gitguard.db',
      },
      error_file: '/var/log/gitguard/web-error.log',
      out_file: '/var/log/gitguard/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    }
  ]
};
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 5.4 Create Log Directory

```bash
sudo mkdir -p /var/log/gitguard
sudo chown -R $USER:$USER /var/log/gitguard
```

### 5.5 Start Web App with PM2

```bash
cd /var/www/gitguardian

# Start the app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it prints (usually run a sudo command)
```

**Check status:**
```bash
pm2 status
pm2 logs gitguard-web
```

**Press `Ctrl+C` to exit logs**

---

## 🔒 Step 6: Setup Nginx Reverse Proxy

### 6.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/gitguard
```

**Paste this (replace `yourdomain.com` with your actual domain):**

```nginx
# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # For Let's Encrypt verification (before SSL)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    # Temporary: Allow HTTP (comment out after SSL setup)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# HTTPS Server (uncomment after SSL setup)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name yourdomain.com www.yourdomain.com;
#     
#     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#     
#     # SSL Configuration
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#     
#     location / {
#         proxy_pass http://localhost:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 300s;
#         proxy_connect_timeout 75s;
#     }
# }
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Replace `yourdomain.com` with your actual domain!**

### 6.2 Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/gitguard /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

**Should see:** `syntax is ok` and `test is successful`

### 6.3 Start Nginx

```bash
# Enable Nginx on boot
sudo systemctl enable nginx

# Start Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## 🔐 Step 7: Setup SSL Certificate (HTTPS)

### 7.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Get SSL Certificate

```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts:**
- Enter your email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 7.3 Update Nginx Config for HTTPS

After Certbot runs, it will automatically update your Nginx config. You can also manually uncomment the HTTPS server block in `/etc/nginx/sites-available/gitguard`.

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 7.4 Auto-Renewal (Already Configured)

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

---

## 🔥 Step 8: Configure Firewall

### 8.1 Setup UFW (Ubuntu Firewall)

```bash
# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Note:** Ports 3000 and 8000 should NOT be exposed - only access via Nginx (port 80/443)

---

## ✅ Step 9: Verify Everything Works

### 9.1 Check All Services

```bash
# Python Agent
sudo systemctl status gitguard-agent
curl http://localhost:8000/health  # Should return response

# Web App
pm2 status
curl http://localhost:3000  # Should return HTML

# Nginx
sudo systemctl status nginx
```

### 9.2 Test from Browser

1. **Open your browser**
2. **Visit:** `http://yourdomain.com` (or `https://yourdomain.com` if SSL is set up)
3. **You should see the GitGuard web interface!**

### 9.3 Test API Endpoints

```bash
# Test Python agent directly
curl http://localhost:8000/health

# Test web app API
curl http://localhost:3000/api/auth/session
```

---

## 🔄 Step 10: Verify Auto-Start on Boot

### 10.1 Test Reboot

```bash
# Reboot the server
sudo reboot
```

**Wait 2-3 minutes, then SSH back in and check:**

```bash
# Check all services
sudo systemctl status gitguard-agent
pm2 status
sudo systemctl status nginx

# All should show as "active" or "online"
```

### 10.2 Verify Services are Enabled

```bash
# Python Agent
sudo systemctl is-enabled gitguard-agent  # Should return "enabled"

# Nginx
sudo systemctl is-enabled nginx  # Should return "enabled"

# PM2 (check if startup script exists)
pm2 startup
```

---

## 🛠️ Maintenance Commands

### View Logs

```bash
# Python Agent logs
sudo journalctl -u gitguard-agent -f

# Web App logs
pm2 logs gitguard-web

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart Python Agent
sudo systemctl restart gitguard-agent

# Restart Web App
pm2 restart gitguard-web

# Restart Nginx
sudo systemctl restart nginx

# Restart everything
sudo systemctl restart gitguard-agent && pm2 restart gitguard-web && sudo systemctl restart nginx
```

### Update Code

```bash
cd /var/www/gitguardian

# Pull latest code
git pull

# Install new dependencies
pnpm install

# Rebuild
pnpm build

# Restart services
pm2 restart gitguard-web
sudo systemctl restart gitguard-agent
```

---

## 🚨 Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u gitguard-agent -n 50
pm2 logs gitguard-web --err

# Check permissions
ls -la /var/www/gitguardian
sudo chown -R www-data:www-data /var/www/gitguardian
```

### Port Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Find what's using port 8000
sudo lsof -i :8000

# Kill process if needed
sudo kill -9 <PID>
```

### Nginx 502 Bad Gateway

```bash
# Check if services are running
pm2 status
sudo systemctl status gitguard-agent

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Database Issues

```bash
# SQLite permissions
sudo chmod 666 /var/www/gitguardian/apps/web/gitguard.db
sudo chown www-data:www-data /var/www/gitguardian/apps/web/gitguard.db

# Regenerate Prisma client
cd /var/www/gitguardian/apps/web
pnpm exec prisma generate
```

### DNS Not Working

```bash
# Check DNS propagation
nslookup yourdomain.com

# Check if domain points to your VPS IP
dig yourdomain.com +short

# Wait longer (DNS can take up to 48 hours, usually 5-30 minutes)
```

---

## 📊 Quick Reference

### Service Management

| Service | Start | Stop | Restart | Status | Logs |
|---------|-------|------|---------|--------|------|
| Python Agent | `sudo systemctl start gitguard-agent` | `sudo systemctl stop gitguard-agent` | `sudo systemctl restart gitguard-agent` | `sudo systemctl status gitguard-agent` | `sudo journalctl -u gitguard-agent -f` |
| Web App | `pm2 start gitguard-web` | `pm2 stop gitguard-web` | `pm2 restart gitguard-web` | `pm2 status` | `pm2 logs gitguard-web` |
| Nginx | `sudo systemctl start nginx` | `sudo systemctl stop nginx` | `sudo systemctl restart nginx` | `sudo systemctl status nginx` | `sudo tail -f /var/log/nginx/error.log` |

### File Locations

- **Code:** `/var/www/gitguardian`
- **Python Agent:** `/var/www/gitguardian/apps/agent`
- **Web App:** `/var/www/gitguardian/apps/web`
- **Logs:** `/var/log/gitguard/`
- **Systemd Service:** `/etc/systemd/system/gitguard-agent.service`
- **Nginx Config:** `/etc/nginx/sites-available/gitguard`
- **Environment Files:** 
  - `/var/www/gitguardian/apps/agent/.env`
  - `/var/www/gitguardian/apps/web/.env.local`

---

## ✅ Final Checklist

- [ ] Domain DNS configured (A record pointing to VPS IP)
- [ ] All software installed (Node.js, Python, Nginx, PM2)
- [ ] Code deployed to `/var/www/gitguardian`
- [ ] Python agent environment file created (`.env`)
- [ ] Python agent running (systemd service)
- [ ] Web app environment file created (`.env.local`)
- [ ] Database initialized (Prisma migrations)
- [ ] Web app running (PM2)
- [ ] Nginx configured and running
- [ ] SSL certificate installed (optional but recommended)
- [ ] Firewall configured (UFW)
- [ ] All services tested
- [ ] Auto-start on boot verified
- [ ] Website accessible from browser

---

## 🎉 You're Done!

Your GitGuard application is now:
- ✅ **Publicly accessible** at `https://yourdomain.com`
- ✅ **Running 24/7** - services auto-start on boot
- ✅ **Survives terminal closure** - all services run in background
- ✅ **Secure** - HTTPS enabled (if SSL configured)
- ✅ **Monitored** - logs available for debugging

**Access your app:**
- 🌐 **Website:** `https://yourdomain.com`
- 📊 **Monitor:** `pm2 monit` (web app) or `sudo journalctl -u gitguard-agent -f` (agent)

**Need help?** Check the troubleshooting section above or view the logs!

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Systemd Service Guide](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)
- [Hostinger DNS Guide](https://www.hostinger.com/tutorials/how-to-update-dns-nameservers)
