# Architecture

## Overview

RepChat follows a modern full-stack architecture with separate frontend, backend, and infrastructure layers.

```
Browser
   │
   ▼
Caddy Reverse Proxy (TLS)
   │
   ├── Static frontend (React)
   └── Backend API + WebSocket (NestJS)
           │
           ├── PostgreSQL (data)
           └── Coturn TURN server (WebRTC relay)
```

---

## Frontend Architecture

### Responsibilities

* User interface
* State management
* WebSocket communication
* WebRTC media handling

### Key Components

* AuthContext — authentication state
* Sidebar — channel list
* ChatWindow — messages
* Presence panel — online users
* Voice hooks — WebRTC logic

---

## Backend Architecture

Built with NestJS using modular design.

### Modules

* Auth — login, registration, JWT
* Users — user management
* Channels — channel operations
* Messages — message storage
* Admin — approvals and management
* WebSocket Gateway — real-time communication

---

## Real-Time Communication

### Text Messaging

* Socket.IO used for bidirectional communication
* Messages persisted in database
* Broadcast to channel participants

### Voice Chat

* Peer-to-peer WebRTC audio
* Signaling via WebSockets
* TURN server fallback for restrictive networks

---

## Data Storage

### PostgreSQL Tables

* User
* Channel
* Message
* VoiceSession
* AuditLog

Prisma ORM handles database access.

---

## Security Model

* JWT authentication
* Role guards
* Input validation
* CORS restrictions
* TLS enforced in production

---

## Deployment Architecture

Docker Compose runs:

* Backend container
* PostgreSQL container
* Caddy reverse proxy
* Coturn TURN server

All services run behind HTTPS.
