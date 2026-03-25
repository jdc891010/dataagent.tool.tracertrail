---
name: tracertrail-api
description: >
  Use this skill whenever the agent needs to interact with the TraceTrail data governance platform.
  Triggers include: any request to manage, create, read, update, or delete projects, datasets, data sources,
  issues, vault solutions, or processing runs in TraceTrail; references to TraceTrail entities like
  "project", "dataset", "data source", "data quality", "data governance", "lineage", "issues",
  "vault solutions", or "code snippets"; phrases like "TraceTrail", "manage data in TraceTrail",
  "create a dataset", "list projects", "data quality issues", "add to vault", "run processing",
  "check data source status", "update issue", or "search vault".
  Also triggers for requests to check system health, statistics, or manage API keys.
  Do NOT use for tasks that involve other data platforms, local file operations with no API calls,
  or completely unrelated data management systems.
compatibility: "Claude.ai, Claude Desktop, Claude Code, Cowork"
---

# TraceTrail API Skill

This skill enables interaction with the TraceTrail data governance platform via its REST API.
Use it to manage projects, datasets, data sources, issues, vault solutions, and processing runs;
check system health and statistics; and administer API keys.

---

## ⚠️ Always Do First

Before any API call:

1. **Load the endpoint reference**: Read `references/endpoints.md` — do this before
   constructing any request.
2. **Confirm credentials**: Check for `TRACERTRAIL_API_KEY` environment variable.
   If absent, ask the user. Validate by calling `POST /api/auth/token/issue` with the API key.
3. **Identify the correct endpoint**: Do not guess. Match the user's intent to the
   endpoint table in `references/endpoints.md`.

---

## Base Configuration

| Property | Value |
|---|---|
| Base URL (production) | `http://localhost:8081/api` |
| Base URL (environment variable) | `TRACERTRAIL_API_URL` |
| Auth header | `Authorization: Bearer <token>` |
| Content-Type | `application/json` |
| API prefix | `/api` |

---

## Authentication Flow

### Step 1: Get API Key
Ask user for API key if not available in `TRACERTRAIL_API_KEY` environment variable.

### Step 2: Exchange for Access Token
```bash
curl -X POST "http://localhost:8081/api/auth/token/issue" \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-api-key"}'
```

### Step 3: Use Token for Requests
```bash
curl -X GET "http://localhost:8081/api/projects" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json"
```

### Step 4: Refresh Token When Needed
```bash
curl -X POST "http://localhost:8081/api/auth/token/refresh" \
  -H "Content-Type: application/json" \
  -d '{"token": "<current_access_token>"}'
```

> ⚠️ **Security**: Never hardcode credentials. Always use environment variables.
> Mask tokens in any output: `Authorization: Bearer ****...****`

---

## Agent Scope & Guardrails

**Permitted operations:**
- Read any resource the user's account has access to
- Create projects, datasets, data sources, issues, vault solutions, processing runs
- Update any of the above entities
- Delete any of the above entities (with confirmation)
- Manage API keys (create, list, delete)
- Check system health and statistics

**Requires user confirmation before executing:**
- Any `DELETE` operation — always confirm before executing
- Any bulk operation affecting more than 10 records
- Creating API keys (show the key once, warn it's not recoverable)

**Not permitted (even if asked):**
- Modifying system settings outside of API keys
- Accessing other users' private data without authorization
- Bypassing rate limits

---

## Step-by-Step: Making an API Call

1. **Identify the target endpoint** in `references/endpoints.md`.
2. **Build the request**:
   - Set `Authorization: Bearer <token>` header.
   - Set `Content-Type: application/json` for POST/PUT/PATCH.
   - Validate required fields against the schema in `references/data-model.md`.
3. **Execute the call** using curl or HTTP tool.
4. **Check the response status**:
   - `2xx` → success. Extract relevant data.
   - `4xx/5xx` → handle per error decision tree in `references/error-codes.md`.
5. **Report outcome** to user clearly.

---

## Common Workflows

### Fetch Project List
1. Call `GET /api/projects`
2. Present results as formatted list (name, status, ID)

### Create a New Project
1. Gather required fields: `name` (required), `description`, `client`, etc.
2. Validate against schema in `references/data-model.md` → Project.
3. Call `POST /api/projects`
4. Report back the new project ID and confirm creation.

### Get Dataset Details
1. Call `GET /api/datasets/{dataset_id}`
2. Present all relevant fields to user.

### Update a Data Source
1. Fetch current state: `GET /api/datasources/{datasource_id}`
2. Show user: current value → proposed value
3. Ask for confirmation
4. On confirmation: call `PUT /api/datasources/{datasource_id}` with changed fields
5. Confirm the update.

### List Issues by Severity
1. Call `GET /api/issues?severity=critical`
2. Present as formatted list with title, status, data source

### Resolve an Issue
1. Call `GET /api/issues/{issue_id}` to confirm issue exists
2. Show issue details to user
3. Ask for confirmation
4. On confirmation: call `PUT /api/issues/{issue_id}/resolve` with optional resolution
5. Confirm the resolution.

### Search Vault Solutions
1. Call `GET /api/vault?q=<search_term>`
2. Present matching solutions with title, language, code snippet preview

### Create a Vault Solution
1. Gather: `title`, `code_snippet` (required), `language`, `description`, `category`
2. Call `POST /api/vault`
3. Report new solution ID.

### Start a Processing Run
1. Confirm data source exists: `GET /api/datasources/{datasource_id}`
2. Call `POST /api/processing-runs` with `data_source_id`
3. Report new run ID and status.

### Delete a Resource (Project/Dataset/DataSource/Issue/Vault)

> ⚠️ **Never skip this sequence.**

1. Fetch the resource: `GET /api/{resource}/{id}`
2. Show user: "About to delete [Resource Name] (ID: {id}). This includes all related [children]. This cannot be undone. Confirm?"
3. Wait for explicit confirmation.
4. On confirmation only: call `DELETE /api/{resource}/{id}`
5. Report the outcome.

### Check System Health
1. Call `GET /api/health`
2. Report status, database connection, and timestamp.

### Get System Statistics
1. Call `GET /api/stats`
2. Present as formatted statistics (projects, datasets, data sources, issues, etc.)

### Create an API Key
1. Gather: `name` (required), `expires_in` (optional, default 30 days), `rate_limit` (optional)
2. Call `POST /api/auth/keys`
3. ⚠️ **Critical**: Show the key ONLY ONCE. Warn user to copy it immediately.
4. Store key securely if needed for future operations.

---

## Pagination

Currently, the API uses simple `limit` query parameter for pagination.

```
GET /projects?limit=50
GET /projects?limit=50&offset=0  # if offset supported
```

When a user asks for "all" records, fetch with a high limit or paginate until all are retrieved.

---

## Rate Limiting

- **Default rate limit**: 100 requests per minute (varies by API key)
- On `429` response: read `Retry-After` header, wait that many seconds, retry once
- For bulk operations: add a 1-second delay between calls

---

## Reference Files

| File | When to Read |
|------|--------------|
| `references/endpoints.md` | Before constructing any API request |
| `references/auth.md` | If credentials are unclear or validation fails |
| `references/data-model.md` | When building request bodies or interpreting responses |
| `references/error-codes.md` | When a non-2xx response is received |

---

## Error Handling Summary

| Status | Action |
|--------|--------|
| 400 | Fix request, retry once |
| 401 | Re-authenticate, do not retry with same creds |
| 403 | Report permission issue to user |
| 404 | Confirm with user if resource should exist |
| 409 | Show conflict message, suggest alternatives |
| 429 | Wait and retry once |
| 500 | Do not retry, report to user |

See `references/error-codes.md` for detailed handling.

---

## Entity Quick Reference

| Entity | CRUD Endpoints |
|--------|----------------|
| Project | `GET/POST /projects`, `GET/PUT/DELETE /projects/{id}` |
| Dataset | `GET/POST /datasets`, `GET/PUT/DELETE /datasets/{id}` |
| DataSource | `GET/POST /datasources`, `GET/PUT/DELETE /datasources/{id}` |
| Issue | `GET/POST /issues`, `GET/PUT/DELETE /issues/{id}`, `PUT /issues/{id}/resolve` |
| Vault | `GET/POST /vault`, `GET/PUT/DELETE /vault/{id}` |
| ProcessingRun | `GET/POST /processing-runs`, `GET/PUT /processing-runs/{id}` |
| ApiKey | `GET/POST /auth/keys`, `DELETE /auth/keys/{id}` |
| Health/Stats | `GET /health`, `GET /stats` |

---

## Changelog

- v1.0 — Initial release. Covers CRUD for all entities, authentication, error handling.
