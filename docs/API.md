# API Endpoints

## Authentication

### POST /auth/register

Register new user (pending approval).

### POST /auth/login

Returns JWT access token.

---

## Channels

### GET /channels

List all channels.

### POST /channels (ADMIN)

Create channel.

### PATCH /channels/:id (ADMIN)

Update channel.

### DELETE /channels/:id (ADMIN)

Delete channel.

---

## Messages

### GET /channels/:id/messages

Retrieve message history.

### POST /channels/:id/messages

Send message to text channel.

---

## Admin — Approvals

### GET /admin/approvals/pending

List users awaiting approval.

### PATCH /admin/approvals

Bulk approve/reject.

---

## Admin — Users

### GET /admin/users

List all non-pending users.

### PATCH /admin/users/:id/role

Change user role.

### PATCH /admin/users/:id/status

Change account status.

### DELETE /admin/users/:id

Delete user.
