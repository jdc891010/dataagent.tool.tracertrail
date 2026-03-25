# TraceTrail Error Codes

This document provides a complete reference for all error responses from the TraceTrail API.

---

## Error Response Format

All errors follow a consistent JSON format:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": []  // optional, field-level validation errors
}
```

---

## HTTP Status Code Reference

| Status | Meaning | Agent Action |
|--------|---------|--------------|
| 200 | Success | Continue processing |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Fix request and retry |
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Handle conflict |
| 422 | Unprocessable | Fix validation errors |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Report to user |

---

## Error Codes

### 400 — Bad Request

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| validation_error | Invalid request parameters | Missing or invalid fields | Check `details[]` array, fix fields, retry |
| invalid_json | Invalid JSON body | Malformed JSON | Fix JSON syntax |
| missing_field | Required field missing | Required field not provided | Add missing field |

**Example Response**
```json
{
  "error": "validation_error",
  "message": "Invalid request parameters",
  "details": [
    {
      "field": "name",
      "message": "Field is required"
    }
  ]
}
```

**Agent Handling**
1. Read the `details[]` array
2. Identify which fields are invalid
3. Fix the request with corrected values
4. Retry once
5. If still failing, report to user with details

---

### 401 — Unauthorized

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| unauthorized | Authentication required | No credentials provided | Prompt for API key |
| invalid_token | Invalid or expired token | Token is invalid or expired | Re-authenticate |
| invalid_api_key | Invalid API key | API key is wrong | Ask user for valid key |

**Example Response**
```json
{
  "error": "invalid_token",
  "message": "Token is invalid or expired"
}
```

**Agent Handling**
1. **Do NOT retry automatically** with same credentials
2. Attempt token refresh (`POST /auth/token/refresh`)
3. If refresh fails, prompt user for new API key
4. Re-authenticate with new credentials

---

### 403 — Forbidden

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| forbidden | Access denied | Insufficient permissions | Report to user |
| rate_limit_exceeded | Rate limit exceeded | Too many requests | Wait and retry |

**Example Response**
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions to delete this resource"
}
```

**Agent Handling**
1. Do NOT retry
2. Report clearly: "Your account does not have permission to [action]"
3. Explain what permissions are needed

---

### 404 — Not Found

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| not_found | Resource not found | ID doesn't exist | Confirm with user |

**Example Response**
```json
{
  "error": "not_found",
  "message": "Project with ID 'proj_xyz' not found"
}
```

**Agent Handling**
1. Do NOT assume the resource should exist
2. Confirm with user: "The project [name/ID] no longer exists. Would you like to list available projects?"
3. If user confirms it should exist, check if the ID is correct

---

### 409 — Conflict

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| duplicate_name | Resource with this name already exists | Name conflict | Use different name |
| conflict | Resource state conflict | Concurrent modification | Fetch fresh state, retry |

**Example Response**
```json
{
  "error": "duplicate_name",
  "message": "A project with name 'Customer Analytics' already exists"
}
```

**Agent Handling**
1. Show message to user
2. Suggest alternatives (e.g., different name, archive existing first)
3. Wait for user guidance

---

### 422 — Unprocessable Entity

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| unprocessable | Entity cannot be processed | Semantic validation failure | Check details |
| invalid_field | Invalid field value | Field value invalid | Check details |

**Example Response**
```json
{
  "error": "unprocessable",
  "message": "Cannot create dataset: source system does not exist",
  "details": [
    {
      "field": "source_system",
      "message": "Invalid source system 'InvalidSystem'"
    }
  ]
}
```

**Agent Handling**
1. Read `details[]` for specific errors
2. Fix the invalid fields
3. Retry once
4. If still failing, report details to user

---

### 429 — Rate Limited

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| rate_limited | Too many requests | Rate limit exceeded | Wait and retry |

**Example Response**
```json
{
  "error": "rate_limited",
  "message": "Rate limit exceeded. Please wait before making more requests."
}
```

**Headers**
| Header | Description |
|--------|-------------|
| Retry-After | Seconds to wait before retry |

**Agent Handling**
1. Read `Retry-After` header (or `expires_in` in body)
2. Wait that many seconds
3. Retry once
4. If rate limited again, stop and inform user
5. Consider adding delays between requests for bulk operations

---

### 500 — Server Error

| Error Code | Message | Cause | Agent Action |
|------------|---------|-------|--------------|
| server_error | Internal server error | Unexpected server issue | Do NOT retry |
| database_error | Database error | Database connection/problem | Do NOT retry |

**Example Response**
```json
{
  "error": "server_error",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Agent Handling**
1. **Do NOT retry automatically**
2. Report to user: "The TraceTrail API returned a server error"
3. Suggest checking the TraceTrail status page
4. Offer to try again later

---

## Error Decision Tree

```
API call returns non-2xx
    │
    ├─ 400 (validation_error)
    │      → Read error.details[], identify bad field(s)
    │      → Fix request and retry once
    │      → If still failing, report to user
    │
    ├─ 401 (unauthorized)
    │      → Credential issue — do NOT retry with same creds
    │      → Attempt token refresh
    │      → If refresh fails, ask user for new API key
    │
    ├─ 403 (forbidden)
    │      → User's account lacks permission
    │      → Report clearly: "Your account does not have access to X"
    │
    ├─ 404 (not_found)
    │      → Resource doesn't exist
    │      → Confirm with user: should it exist?
    │
    ├─ 409 (conflict)
    │      → Duplicate or state conflict
    │      → Show message to user, suggest alternatives
    │
    ├─ 422 (unprocessable)
    │      → Semantic validation failure
    │      → Read details, fix, retry once
    │
    ├─ 429 (rate_limited)
    │      → Read Retry-After header
    │      → Wait, then retry once
    │      → If rate limited again, stop and inform user
    │
    └─ 500+ (server_error)
           → Do NOT retry
           → Report to user
           → Suggest checking status page
```

---

## Common Error Scenarios

### Scenario 1: Creating a Project with Duplicate Name

**Request**
```
POST /projects
{"name": "Existing Project"}
```

**Response** `409 Conflict`
```json
{
  "error": "duplicate_name",
  "message": "A project with name 'Existing Project' already exists"
}
```

**Agent Action**
1. Inform user about the conflict
2. Suggest: use a different name, or list existing project first

---

### Scenario 2: Deleting Non-Existent Resource

**Request**
```
DELETE /projects/proj_nonexistent
```

**Response** `404 Not Found`
```json
{
  "error": "not_found",
  "message": "Project 'proj_nonexistent' not found"
}
```

**Agent Action**
1. Confirm with user: "This project may have already been deleted"
2. Offer to list available projects

---

### Scenario 3: Invalid Token

**Request** (with expired token)
```
GET /projects
Authorization: Bearer eyJhbGci...
```

**Response** `401 Unauthorized`
```json
{
  "error": "invalid_token",
  "message": "Token is invalid or expired"
}
```

**Agent Action**
1. Attempt to refresh token
2. If refresh fails, ask user for new API key

---

### Scenario 4: Rate Limiting

**Request**
```
GET /projects
```

**Response** `429 Too Many Requests`
```json
{
  "error": "rate_limited",
  "message": "Rate limit exceeded"
}
```

**Headers**
```
Retry-After: 60
```

**Agent Action**
1. Wait 60 seconds
2. Retry request
3. If still rate limited, report to user

---

## Testing Error Handling

When testing the skill, verify the agent:
1. Reads error messages correctly
2. Makes appropriate retry decisions
3. Prompts user when credentials are invalid
4. Reports errors clearly without exposing sensitive data

---

*Last Updated: 2026-03-25*
