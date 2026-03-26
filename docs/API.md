# API Documentation

This document describes the HTTP and WebSocket interfaces of the RepChat application.

RepChat uses:

- REST API for standard operations (authentication, management, history)
- WebSockets for realtime communication (chat, presence, voice signaling)

---

# WebSocket API (Realtime)

RepChat uses WebSockets (Socket.IO) for realtime features including:

- Live chat messaging
- Online presence updates
- Voice channel coordination
- WebRTC signaling
- Join/leave notifications

A valid JWT access token is required to establish a connection.

## Connection

WS URL: wss://chat-api.forgebase.ee  
Query parameter: ?token=<JWT access token>  
Transport: websocket  

---

## Presence

### presence:update

Direction: Server → Client  

Sent whenever the set of online users changes.

Payload:

{
  "userIds": ["string"]
}

---

## Chat Messaging

### message:create

Direction: Client → Server  

Send a new message to a text channel.

Payload:

{
  "channelId": "string",
  "content": "string"
}

---

### message:created

Direction: Server → Clients in that channel  

Broadcasts a newly created message.

Payload:

{
  "id": "string",
  "channelId": "string",
  "content": "string",
  "createdAt": "ISO timestamp",
  "user": {
    "id": "string",
    "username": "string"
  }
}

---

## Voice Channel Control

### voice:join

Direction: Client → Server  

Join a voice channel.

Payload:

{
  "channelId": "string"
}

---

### voice:joined

Direction: Server → Clients in that channel  

Notifies participants that a user joined.

Payload:

{
  "userId": "string",
  "channelId": "string"
}

---

### voice:leave

Direction: Client → Server  

Leave current voice channel.

Payload:

{
  "channelId": "string"
}

---

### voice:left

Direction: Server → Clients in that channel  

Notifies participants that a user left.

Payload:

{
  "userId": "string",
  "channelId": "string"
}

---

## WebRTC Signaling (Voice Audio)

Used to establish peer-to-peer audio connections between users.

### webrtc:offer

Direction: Client → Server  

Payload:

{
  "toUserId": "string",
  "channelId": "string",
  "offer": "RTCSessionDescription"
}

---

### webrtc:answer

Direction: Client → Server  

Payload:

{
  "toUserId": "string",
  "channelId": "string",
  "answer": "RTCSessionDescription"
}

---

### webrtc:ice

Direction: Client → Server  

Exchange ICE candidates for NAT traversal.

Payload:

{
  "toUserId": "string",
  "channelId": "string",
  "candidate": "RTCIceCandidate"
}

---

# HTTP REST API

## Authentication

### POST /auth/register

Register a new user account.  
New accounts require administrative approval before login.

---

### POST /auth/login

Authenticate user and return a JWT access token.

---

## Channels

### GET /channels

Retrieve list of all available channels.

---

### POST /channels (ADMIN)

Create a new channel.

---

### PATCH /channels/:id (ADMIN)

Update channel properties.

---

### DELETE /channels/:id (ADMIN)

Delete a channel and associated messages.

---

## Messages

### GET /channels/:id/messages

Retrieve message history for a text channel.

---

### POST /channels/:id/messages

Send a message to a text channel.

---

## Admin — Approvals

### GET /admin/approvals/pending

Retrieve users awaiting approval.

---

### PATCH /admin/approvals

Bulk approve or reject pending users.

---

## Admin — Users

### GET /admin/users

Retrieve all non-pending users.

---

### PATCH /admin/users/:id/role

Change a user's role.

---

### PATCH /admin/users/:id/status

Change account status (e.g., approved, disabled).

---

### DELETE /admin/users/:id

Delete a user account.
