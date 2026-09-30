# Toyamas Cloud API Documentation

## Authentication Endpoints

### `POST /api/auth/setup`
Initialize the first administrator account (only accessible when 0 users exist).

**Request Body:**
```json
{
  "name": "Administrator",
  "email": "admin@wildanstore.my.id",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

### `POST /api/auth/login`
Authenticate with email and password. Sets an `httpOnly` session cookie.

**Request Body:**
```json
{
  "email": "admin@wildanstore.my.id",
  "password": "SecurePassword123!"
}
```

### `POST /api/auth/logout`
Terminates the session and invalidates the session cookie.

### `GET /api/auth/me`
Retrieves the currently authenticated user profile and setup requirement status.

---

## System Endpoints

### `GET /api/system/health`
Health check endpoint reporting PostgreSQL connection status, Redis status, uptime, and host hardware metrics.
