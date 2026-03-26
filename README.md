# RepChat — Real-Time Voice & Text Chat Platform

RepChat is a self-hostable real-time chat application with text channels, voice channels, presence tracking, and an administrative approval system.

It is designed as a modern full-stack project demonstrating:

* Real-time communication
* WebRTC voice chat
* Secure authentication
* Role-based access control
* Containerized deployment
* Reverse proxy + TLS setup
* Production-ready architecture

---

## Features

### Core Chat

* Text channels
* Real-time messaging (WebSockets)
* Message history stored in PostgreSQL
* Presence indicators (online/offline)
* Channel creation (Admin only)

### Voice Chat

* WebRTC peer-to-peer audio
* Signaling via WebSockets
* STUN + TURN support for NAT traversal
* Microphone controls
* Automatic switching between channels

### Authentication & Users

* JWT (JSON Web Token) authentication
* Registration with admin approval
* Role-based permissions:

  * USER
  * ADMIN
  * SUPER_ADMIN
* Account status control:

  * Pending
  * Approved
  * Disabled
  * Rejected

### Admin Panel

* Approve/reject new users
* Change roles
* Enable/disable accounts
* Delete users

### Deployment & Infrastructure

* Docker Compose orchestration
* PostgreSQL database
* Caddy reverse proxy with automatic TLS
* Coturn TURN server for WebRTC
* Self-hostable on Linux server

---

## Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* Socket.IO client
* WebRTC APIs

### Backend

* NestJS (Node.js framework)
* Prisma ORM
* PostgreSQL
* Socket.IO server
* JWT authentication

### Infrastructure

* Docker & Docker Compose
* Caddy (reverse proxy + HTTPS)
* Coturn (TURN server)

---

## Screenshots

![Login](docs/images/login.png)
![Register](docs/images/register.png)
![Main App](docs/images/app.png)
![Admin Panel](docs/images/admin.png)

---

## Running Locally

### Requirements

* Node.js 20+
* Docker
* npm

### 1. Clone repository

```bash
git clone <repo-url>
cd repchat
```

### 2. Configure environment

Copy example files:

```bash
cp apps/backend_logic/.env.example apps/backend_logic/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Fill required values.

### 3. Install dependencies

Frontend:

```bash
cd apps/frontend
npm install
```

Backend:

```bash
cd apps/backend_logic
npm install
```

### 4. Run database and services

```bash
docker compose up -d
```

### 5. Seed first SUPER_ADMIN

Use provided script or manual seeding instructions in docs.

---

## Production Deployment

See:

➡ docs/DEPLOYMENT.md

Includes:

* Domain configuration
* TLS setup
* TURN server configuration
* Docker deployment steps

---

## API Documentation

See:

➡ docs/API.md

---

## Architecture Overview

See:

➡ docs/ARCHITECTURE.md

---

## Security Notes

* JWT authentication
* Role-based guards
* Input validation
* CORS configuration
* HTTPS required for WebRTC

---

## License

MIT License
