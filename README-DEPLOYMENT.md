# Quick Deployment Reference

Production deployment of Manuscript Workbench to `manuscript-workbench.codebnb.me`

## Quick Start

```bash
# 1. Clone and setup
cd /var/www/apps
git clone <repo-url> manuscript-workbench
cd manuscript-workbench

# 2. Configure environment
cp backend/.env.production backend/.env.production.local
# Edit with: SECRET_KEY, POSTGRES_PASSWORD, CORS_ORIGINS

# 3. Build frontend
cd frontend && npm install && npm run build && cd ..

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# 6. Setup Nginx
sudo cp nginx/manuscript-workbench.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/manuscript-workbench.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. Get SSL certificate
sudo certbot --nginx -d manuscript-workbench.codebnb.me

# 8. Setup monitoring
chmod +x scripts/*.sh
crontab -e
# Add: 0 2 * * * /var/www/apps/manuscript-workbench/scripts/backup.sh
# Add: */5 * * * * /var/www/apps/manuscript-workbench/scripts/health-check.sh
```

## Critical Configuration

**Environment Variables** (`backend/.env.production`):
```env
SECRET_KEY=<openssl rand -hex 32>
POSTGRES_PASSWORD=<openssl rand -base64 24>
CORS_ORIGINS=https://manuscript-workbench.codebnb.me
```

**Ports**:
- Backend: `127.0.0.1:18100`
- Database: `127.0.0.1:18101`
- Nginx: `80, 443` (public)

## Critical Tests

1. **Backend Health**: `curl https://manuscript-workbench.codebnb.me/health`
2. **Frontend**: `curl -I https://manuscript-workbench.codebnb.me`
3. **WebSocket** (MOST IMPORTANT):
   - Open browser DevTools → Network → WS
   - Navigate to workspace → AI chat
   - Send message
   - Verify streaming response

## Common Issues

**WebSocket fails**: Check Nginx `/api/chat/ws` location has WebSocket headers
**CORS errors**: Verify `CORS_ORIGINS` in `.env.production` matches domain
**502 Gateway**: Check backend running on `127.0.0.1:18100`
**File upload fails**: Check `client_max_body_size 100M` in Nginx

## Documentation

Full guide: [deployment-notes.md](deployment-notes.md)

## Default Credentials

After deployment (if using seed data):
- Email: `admin@manuscript.local`
- Password: `admin123`

**Change immediately!**
