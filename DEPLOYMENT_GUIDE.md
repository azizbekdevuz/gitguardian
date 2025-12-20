# GitGuard Deployment Guide - VPS (Hostinger KVM2)

Complete guide to deploy GitGuard Agent to a VPS and keep all services running permanently.

---

## 📋 Overview

You need to run:
1. **Next.js Web App** (port 3000) - Node.js
2. **Python Agent Service** (port 8000) - FastAPI
3. **Database** - Prisma (SQLite or PostgreSQL)
4. **Reverse Proxy** - Nginx (port 80/443)

---

## 🚀 Quick Start Checklist

- [ ] VPS with Ubuntu/Debian (Hostinger KVM2)
- [ ] Domain name (optional but recommended)
- [ ] SSH access to VPS
- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed
- [ ] Nginx installed
- [ ] PM2 installed (for Node.js)
- [ ] Systemd or Supervisor (for Python)

---

## 📦 Step 1: Initial VPS Setup

### Connect to VPS

```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Required Software

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.8+
sudo apt install -y python3 python3-pip python3-venv

# Nginx
sudo apt install -y nginx

# Git
sudo apt install -y git

# Build tools (for native modules)
sudo apt install -y build-essential

# PM2 (process manager for Node.js)
sudo npm install -g pm2

# Verify installations
node --version  # Should be 18+
python3 --version  # Should be 3.8+
nginx -v
pm2 --version
```

---

## 📥 Step 2: Deploy Your Code

### Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/your-username/gitguardian.git
sudo chown -R $USER:$USER gitguardian
cd gitguardian
```

**OR upload via SCP:**

```bash
# From your local machine
scp -r . user@your-vps-ip:/var/www/gitguardian
```

### Install Dependencies

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install web app dependencies
cd /var/www/gitguardian
pnpm install

# Build packages
pnpm build
```

---

## 🐍 Step 3: Setup Python Agent Service

### Create Virtual Environment

```bash
cd /var/www/gitguardian/apps/agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Create Environment File

```bash
nano /var/www/gitguardian/apps/agent/.env
```

Add:
```bash
ANTHROPIC_API_KEY=your_key_here
MODEL_NAME=claude-sonnet-4-20250514
PORT=8000
HOST=0.0.0.0
```

### Test Agent Service

```bash
cd /var/www/gitguardian/apps/agent
source venv/bin/activate
python main.py
# Should start on port 8000
# Press Ctrl+C to stop
```

---

## 🔄 Step 4: Keep Services Running (Background)

### Option A: Systemd (Recommended for Python Agent)

#### Create Systemd Service for Python Agent

```bash
sudo nano /etc/systemd/system/gitguard-agent.service
```

Add:
```ini
[Unit]
Description=GitGuard Agent Service (SpoonOS)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/gitguardian/apps/agent
Environment="PATH=/var/www/gitguardian/apps/agent/venv/bin"
ExecStart=/var/www/gitguardian/apps/agent/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gitguard-agent

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable gitguard-agent
sudo systemctl start gitguard-agent
sudo systemctl status gitguard-agent
```

**Useful Commands:**

```bash
# Check status
sudo systemctl status gitguard-agent

# View logs
sudo journalctl -u gitguard-agent -f

# Restart
sudo systemctl restart gitguard-agent

# Stop
sudo systemctl stop gitguard-agent
```

### Option B: PM2 (Alternative for Python)

If you prefer PM2 for Python too:

```bash
# Install pm2-logrotate to manage logs
pm2 install pm2-logrotate

# Start Python agent with PM2
cd /var/www/gitguardian/apps/agent
source venv/bin/activate
pm2 start main.py --name gitguard-agent --interpreter python3
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

---

## 🌐 Step 5: Setup Next.js Web App with PM2

### Create PM2 Ecosystem File

```bash
cd /var/www/gitguardian
nano ecosystem.config.js
```

Add:
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
        NEXTAUTH_URL: 'https://yourdomain.com',
        NEXTAUTH_SECRET: 'your-secret-key-here',
        DATABASE_URL: 'file:./gitguard.db', // or PostgreSQL URL
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

### Create Log Directory

```bash
sudo mkdir -p /var/log/gitguard
sudo chown -R $USER:$USER /var/log/gitguard
```

### Start Web App

```bash
cd /var/www/gitguardian
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

**Useful Commands:**

```bash
# Check status
pm2 status

# View logs
pm2 logs gitguard-web

# Restart
pm2 restart gitguard-web

# Stop
pm2 stop gitguard-web

# Monitor
pm2 monit
```

---

## 🔒 Step 6: Setup Nginx Reverse Proxy

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/gitguard
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS (if you have SSL)
    # return 301 https://$server_name$request_uri;

    # For HTTP only (development/testing)
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
    }

    # Proxy agent service (if needed externally)
    location /api/agent/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/gitguard /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Enable Nginx on Boot

```bash
sudo systemctl enable nginx
```

---

## 🔐 Step 7: Setup SSL (Optional but Recommended)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-Renewal

```bash
sudo certbot renew --dry-run  # Test
# Auto-renewal is already set up by certbot
```

---

## 🗄️ Step 8: Database Setup

### Option A: SQLite (Simple, Default)

Already configured! Just ensure write permissions:

```bash
cd /var/www/gitguardian/apps/web
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

### Option B: PostgreSQL (Production)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE gitguard;
CREATE USER gitguard_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gitguard TO gitguard_user;
\q

# Update .env
DATABASE_URL="postgresql://gitguard_user:your_password@localhost:5432/gitguard"

# Run migrations
cd /var/www/gitguardian/apps/web
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

---

## 🔧 Step 9: Environment Variables

### Web App Environment

```bash
cd /var/www/gitguardian/apps/web
nano .env.local
```

Add:
```bash
# Database
DATABASE_URL="file:./gitguard.db"
# or for PostgreSQL:
# DATABASE_URL="postgresql://user:pass@localhost:5432/gitguard"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-random-secret-here"

# Agent Service
AGENT_URL="http://localhost:8000"

# Anthropic (for fallback)
ANTHROPIC_API_KEY="your_key_here"
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### Update PM2 Config

Update `ecosystem.config.js` with your actual values.

---

## ✅ Step 10: Verify Everything Works

### Check All Services

```bash
# Check Python agent
sudo systemctl status gitguard-agent
curl http://localhost:8000/health

# Check Next.js web app
pm2 status
curl http://localhost:3000

# Check Nginx
sudo systemctl status nginx
curl http://yourdomain.com
```

### View Logs

```bash
# Python agent logs
sudo journalctl -u gitguard-agent -f

# Web app logs
pm2 logs gitguard-web

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Step 11: Auto-Start on Boot

### Verify Auto-Start

```bash
# Systemd (Python agent)
sudo systemctl is-enabled gitguard-agent  # Should return "enabled"

# PM2 (Web app)
pm2 startup  # Run and follow instructions

# Nginx
sudo systemctl is-enabled nginx  # Should return "enabled"
```

### Test Reboot

```bash
sudo reboot
# After reboot, check:
sudo systemctl status gitguard-agent
pm2 status
sudo systemctl status nginx
```

---

## 🛠️ Maintenance Commands

### Update Code

```bash
cd /var/www/gitguardian
git pull
pnpm install
pnpm build
pm2 restart gitguard-web
sudo systemctl restart gitguard-agent
```

### View All Services

```bash
# All services status
sudo systemctl status gitguard-agent nginx
pm2 status

# All logs
sudo journalctl -u gitguard-agent --since "1 hour ago"
pm2 logs gitguard-web --lines 100
```

### Restart Everything

```bash
sudo systemctl restart gitguard-agent
pm2 restart gitguard-web
sudo systemctl restart nginx
```

---

## 🔥 Firewall Setup

### UFW (Ubuntu Firewall)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

**Note:** Don't expose ports 3000 or 8000 directly - use Nginx reverse proxy.

---

## 📊 Monitoring

### PM2 Monitoring

```bash
pm2 monit  # Real-time monitoring
pm2 list   # List all processes
```

### System Resources

```bash
htop  # Install: sudo apt install htop
df -h  # Disk usage
free -h  # Memory usage
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

# Kill process
sudo kill -9 <PID>
```

### Database Issues

```bash
# SQLite permissions
sudo chmod 666 /var/www/gitguardian/apps/web/gitguard.db
sudo chown www-data:www-data /var/www/gitguardian/apps/web/gitguard.db

# PostgreSQL connection
sudo -u postgres psql -d gitguard
```

### Nginx 502 Bad Gateway

```bash
# Check if services are running
pm2 status
sudo systemctl status gitguard-agent

# Check Nginx config
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📝 Complete Deployment Script

Save as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting GitGuard Deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nodejs python3 python3-pip python3-venv nginx git build-essential
sudo npm install -g pnpm pm2

# Setup project
cd /var/www/gitguardian
pnpm install
pnpm build

# Setup Python agent
cd apps/agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service
sudo cp /var/www/gitguardian/deploy/gitguard-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gitguard-agent
sudo systemctl start gitguard-agent

# Start web app
cd /var/www/gitguardian
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx
sudo cp /var/www/gitguardian/deploy/nginx.conf /etc/nginx/sites-available/gitguard
sudo ln -s /etc/nginx/sites-available/gitguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment complete!"
echo "Check status:"
echo "  sudo systemctl status gitguard-agent"
echo "  pm2 status"
echo "  sudo systemctl status nginx"
```

---

## 🎯 Quick Reference

### Service Management

| Service | Start | Stop | Restart | Status | Logs |
|---------|-------|------|---------|--------|------|
| Python Agent | `sudo systemctl start gitguard-agent` | `sudo systemctl stop gitguard-agent` | `sudo systemctl restart gitguard-agent` | `sudo systemctl status gitguard-agent` | `sudo journalctl -u gitguard-agent -f` |
| Web App | `pm2 start gitguard-web` | `pm2 stop gitguard-web` | `pm2 restart gitguard-web` | `pm2 status` | `pm2 logs gitguard-web` |
| Nginx | `sudo systemctl start nginx` | `sudo systemctl stop nginx` | `sudo systemctl restart nginx` | `sudo systemctl status nginx` | `sudo tail -f /var/log/nginx/error.log` |

### File Locations

- **Code**: `/var/www/gitguardian`
- **Python Agent**: `/var/www/gitguardian/apps/agent`
- **Web App**: `/var/www/gitguardian/apps/web`
- **Logs**: `/var/log/gitguard/`
- **Systemd Service**: `/etc/systemd/system/gitguard-agent.service`
- **Nginx Config**: `/etc/nginx/sites-available/gitguard`

---

## ✅ Final Checklist

- [ ] All services installed
- [ ] Code deployed to `/var/www/gitguardian`
- [ ] Python agent running (systemd)
- [ ] Web app running (PM2)
- [ ] Nginx configured and running
- [ ] SSL certificate installed (optional)
- [ ] Firewall configured
- [ ] Auto-start on boot enabled
- [ ] Environment variables set
- [ ] Database configured
- [ ] All services tested
- [ ] Monitoring setup

---

## 🎉 You're Done!

Your GitGuard Agent is now running on your VPS and will stay up even when you close the terminal!

**Access your app:**
- HTTP: `http://yourdomain.com`
- HTTPS: `https://yourdomain.com` (if SSL configured)

**Monitor:**
- `pm2 monit` - Web app monitoring
- `sudo journalctl -u gitguard-agent -f` - Agent logs
- `sudo tail -f /var/log/nginx/access.log` - Web traffic

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Systemd Service Guide](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)

