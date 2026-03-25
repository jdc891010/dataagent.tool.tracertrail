# Authentication

## Method

Bearer token authentication via the `Authorization` header.

## Obtaining Credentials

The agent should expect the API key to be available in one of these sources (in order of priority):

1. **Environment variable** — `TRACERTRAIL_API_KEY` (preferred for automated use)
2. **User-provided in conversation** — if the user has pasted an API key in the current session
3. **Prompt the user** — as a last resort, ask: *"To proceed, I need your TraceTrail API key. You can find or create one in Settings → API Keys."*

## Token Acquisition Flow

### Step 1: Exchange API Key for Access Token

```bash
# Request access token using API key
curl -X POST "http://localhost:8081/api/auth/token/issue" \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-api-key-here"}'
```

**Success Response** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "2026-03-26T12:00:00.000Z"
}
```

### Step 2: Use Access Token for API Requests

Include the token in the `Authorization` header:

```bash
# Example authenticated request
curl -X GET "http://localhost:8081/api/projects" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

## Token Lifetime

- **Default expiration**: 86400 seconds (24 hours)
- **Refresh available**: Yes, via `POST /auth/token/refresh`

## Validating Credentials

Always validate credentials before substantive work:

```bash
# Validate token
curl -X POST "http://localhost:8081/api/auth/token/verify" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Success Response** `200 OK`
```json
{
  "valid": true,
  "user_id": "user_123",
  "expires_at": "2026-03-26T12:00:00.000Z"
}
```

**Failure Response** `401 Unauthorized`
```json
{
  "error": "invalid_token",
  "message": "Token is invalid or expired"
}
```

## Refreshing the Token

When the token is about to expire, refresh it:

```bash
# Refresh access token
curl -X POST "http://localhost:8081/api/auth/token/refresh" \
  -H "Content-Type: application/json" \
  -d '{"token": "your-current-access-token"}'
```

**Success Response** `200 OK`
```json
{
  "access_token": "new-access-token...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "2026-03-27T12:00:00.000Z"
}
```

## Security Rules

1. **Never hardcode credentials** in any code or documentation
2. **Never log or echo credentials** in full — use masking
3. **Store tokens securely** — prefer environment variables
4. **Mask in output** — when showing curl commands, always mask the token:

```bash
# Correct — masked
Authorization: Bearer ****...****

# Wrong — exposed
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Finding API Keys

Users can create API keys in the TraceTrail UI:
1. Navigate to **Settings** → **API Keys**
2. Click **Create New API Key**
3. Name the key and set expiration (default: 30 days)
4. Copy the key immediately (it will not be shown again)

## Environment Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `TRACERTRAIL_API_KEY` | API key for authentication | Yes |
| `TRACERTRAIL_API_URL` | Base URL (default: `http://localhost:8081/api`) | No |
