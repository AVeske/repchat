# Deployment Guide

## Requirements

* Linux server
* Docker
* Domain name
* Ports 80 and 443 open

---

## 1. Clone repository

```bash
git clone <repo-url>
cd repchat
```

---

## 2. Configure environment files

Edit:

apps/backend_logic/.env
apps/frontend/.env.production

Set:

* Database credentials
* JWT secret
* Domain URLs
* TURN credentials

---

## 3. Configure TURN server

Edit:

infra/coturn/turnserver.conf

Set strong username/password and public IP.

---

## 4. Build frontend

```bash
cd apps/frontend
npm install
npm run build
```

---

## 5. Start all services

```bash
docker compose up -d --build
```

---

## 6. Access application

Open:

https://chat.yourdomain.com

---

## Notes

* HTTPS is required for WebRTC microphone access
* TURN server is needed for restrictive networks
* Ensure firewall allows required ports
