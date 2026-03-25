# IMPLEMENTATION.md — Web App API Interaction Skill

A complete guide to building, testing, packaging, and deploying a skill that enables a Claude agent to interact with a custom web application via its API.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites & Information to Gather First](#2-prerequisites--information-to-gather-first)
3. [Skill Directory Structure](#3-skill-directory-structure)
4. [Writing SKILL.md](#4-writing-skillmd)
5. [Reference Files](#5-reference-files)
6. [Authentication Handling](#6-authentication-handling)
7. [Error Handling Patterns](#7-error-handling-patterns)
8. [Writing Evals](#8-writing-evals)
9. [Testing the Skill (Claude.ai / Claude Desktop)](#9-testing-the-skill-claudeai--claude-desktop)
10. [Iterating and Improving](#10-iterating-and-improving)
11. [Packaging and Installing the Skill](#11-packaging-and-installing-the-skill)
12. [Triggering Checklist](#12-triggering-checklist)
13. [Complete Annotated SKILL.md Template](#13-complete-annotated-skillmd-template)

---

## 1. Overview

A **skill** is a structured Markdown document (`SKILL.md`) that is loaded into Claude's context when a relevant task is detected. It tells Claude *exactly how* to interact with your system — what API endpoints exist, how to authenticate, what request/response shapes to expect, how to handle errors, and what the agent should do in common scenarios.

This is different from a simple system prompt. A skill is:
- **Loaded on demand** — only injected when the agent determines it's needed, keeping context lean.
- **Self-contained** — bundles reference files, scripts, and assets alongside instructions.
- **Testable** — comes with an eval harness so you can measure whether it actually works.

For a web app with an API, the skill acts as an **internal SDK reference + operating manual** for the agent. The agent reads it once, then knows how to drive your app.

---

## 2. Prerequisites & Information to Gather First

Before writing a single line of the skill, answer these questions. The more precisely you answer them, the better your skill will be.

### 2.1 API Surface

- [ ] **Base URL(s)**: What is the root URL of the API? Are there separate staging/production URLs?
- [ ] **Protocol**: REST? GraphQL? WebSocket? (This guide focuses on REST/JSON.)
- [ ] **API version prefix**: e.g. `/api/v1/`, `/v2/`
- [ ] **Complete endpoint list**: For each endpoint, document:
  - HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
  - Path with path parameters (e.g. `/users/{id}/orders`)
  - Required vs optional query parameters
  - Request body schema (with field names, types, whether required)
  - Success response shape (status code + body schema)
  - Known error responses (status codes + body shapes)
- [ ] **Pagination pattern**: Cursor-based? Offset/limit? Page number? None?
- [ ] **Rate limits**: Requests per second/minute? Any burst allowance?

### 2.2 Authentication

- [ ] **Method**: API key? OAuth 2.0 Bearer token? Session cookie? Basic auth? HMAC signature?
- [ ] **Where does the credential go**: Header? Query param? Cookie?
- [ ] **Header/param name**: e.g. `Authorization: Bearer <token>`, `X-API-Key: <key>`
- [ ] **Token lifetime**: Does it expire? How do you refresh?
- [ ] **How will the agent get the credential at runtime**: Environment variable? User input? Stored secret?

### 2.3 Agent Capabilities & Scope

- [ ] **What tasks should the agent be able to do?** (e.g. "create a new campaign", "fetch the last 7 days of analytics", "update a user's profile", "submit an order")
- [ ] **What should it *not* be able to do?** (e.g. delete records, access billing, modify permissions)
- [ ] **Are there multi-step workflows?** (e.g. create a draft → attach assets → publish)
- [ ] **What confirmations are required before destructive actions?**

### 2.4 Data & Domain

- [ ] **Key entities**: What are the main nouns in your domain? (e.g. `Campaign`, `User`, `Order`, `Report`)
- [ ] **Relationships**: How do entities relate? (e.g. a `Campaign` has many `Posts`)
- [ ] **ID formats**: UUIDs? Integer auto-increment? Slugs?
- [ ] **Enum values**: Any fields with a fixed set of valid values? Document them all.
- [ ] **Date/time format**: ISO 8601? Unix timestamp? Timezone handling?

### 2.5 Environment

- [ ] **Is a live API available for testing?** Or do you need a mock/sandbox?
- [ ] **Are there side effects to worry about in testing?** (e.g. sending real emails, charging cards)
- [ ] **Will the agent run in Claude.ai, Claude Desktop, Cowork, or Claude Code?**

---

## 3. Skill Directory Structure

Create this directory layout. Every item marked `(required)` must exist.

```
your-app-api/
├── SKILL.md                  (required) — main skill document
├── references/
│   ├── endpoints.md          (required) — full endpoint reference
│   ├── auth.md               (required) — authentication details
│   ├── data-model.md         (recommended) — entity schemas & enums
│   └── error-codes.md        (recommended) — error taxonomy
├── scripts/
│   ├── test_connection.sh    (recommended) — quick connectivity check
│   └── validate_response.py  (optional) — response schema validator
├── evals/
│   ├── evals.json            (required for testing)
│   └── fixtures/             (optional) — sample payloads / mock responses
└── assets/
    └── (optional static files used in outputs)
```

**Rule of thumb for what goes where:**

| Content | Goes in |
|---|---|
| When to use the skill, step-by-step instructions, decision trees | `SKILL.md` |
| Full list of every endpoint with all params | `references/endpoints.md` |
| Auth flow, credential acquisition, token refresh | `references/auth.md` |
| Field-level schema for each entity | `references/data-model.md` |
| HTTP status codes your API returns and what they mean | `references/error-codes.md` |
| Bash/Python helper scripts for the agent to execute | `scripts/` |
| Test cases with expected outcomes | `evals/evals.json` |

---

## 4. Writing SKILL.md

`SKILL.md` has two parts: a YAML frontmatter block, and a Markdown body.

### 4.1 YAML Frontmatter

```yaml
---
name: your-app-api
description: >
  Use this skill whenever the agent needs to interact with the YourApp web application.
  Triggers include: any request to fetch, create, update, or delete data in YourApp;
  references to YourApp entities like [Campaign / Order / User / etc.]; requests to
  "pull data from the app", "push changes to the app", "check the dashboard", 
  "run a report", or "automate a workflow" in YourApp. Also use when the user says
  things like "via the API", "using the API", or mentions the app by name.
  Do NOT use for tasks that are purely local file operations with no API calls.
compatibility: "Claude.ai, Claude Desktop, Claude Code, Cowork"
---
```

**Critical note on `description`:** This is the *primary* trigger. Claude sees only the `name` and `description` when deciding whether to load this skill. Make it:
- Explicitly name the app
- List the kinds of requests that should trigger it
- Include synonyms and paraphrases users might say
- Slightly "pushy" — lean toward including edge cases rather than excluding them

### 4.2 SKILL.md Body Structure

The body should cover these sections in order:

```
# [App Name] API Skill

## Purpose
## Quick Reference (Base URL, auth header, common patterns)
## Agent Operating Principles (guardrails, confirmation rules, scope limits)
## Step-by-Step: How to make an API call
## Common Workflows (the top 5–10 things the agent will actually do)
## Reference File Map (where to find endpoint/schema detail)
## Error Handling
## Rate Limiting & Pagination
## Testing & Debugging
```

Keep the body **under 500 lines**. Detailed endpoint schemas go in `references/endpoints.md` — link to them clearly.

---

## 5. Reference Files

### 5.1 `references/endpoints.md`

Document every endpoint the agent may call. Use this template per endpoint:

````markdown
### POST /campaigns

Creates a new campaign.

**Request**
```json
{
  "name": "string (required, max 100 chars)",
  "type": "email | sms | push (required)",
  "scheduled_at": "ISO 8601 datetime (optional, null = draft)",
  "audience_id": "UUID (required)",
  "template_id": "UUID (optional)"
}
```

**Success Response** `201 Created`
```json
{
  "id": "uuid",
  "name": "string",
  "status": "draft | scheduled | sent",
  "created_at": "ISO 8601"
}
```

**Error Responses**
| Status | Body `error` field | Meaning |
|--------|--------------------|---------|
| 400 | `validation_error` | Missing/invalid fields — check `details[]` |
| 409 | `duplicate_name` | A campaign with this name already exists |
| 422 | `audience_not_found` | The `audience_id` does not exist |
````

### 5.2 `references/auth.md`

````markdown
# Authentication

## Method
Bearer token via `Authorization` header.

## Obtaining a Token
The agent should expect the API key to be available as the environment variable
`YOURAPP_API_KEY`. If not set, ask the user to provide it.

## Header Format
```
Authorization: Bearer <token>
```

## Token Lifetime
Tokens do not expire unless revoked. No refresh required.

## Checking Validity
`GET /auth/me` returns `200` with user info if valid, `401` if not.
Always call this first in any new session to confirm credentials work.
````

### 5.3 `references/data-model.md`

Document each entity's complete field list, types, constraints, and relationships. Include enum values in full — the agent should never have to guess valid values.

### 5.4 `references/error-codes.md`

```markdown
# Error Codes

All errors follow the shape:
{
  "error": "snake_case_code",
  "message": "Human readable string",
  "details": [...] // optional, field-level errors
}

| HTTP Status | error field          | Meaning & Agent Action |
|-------------|----------------------|------------------------|
| 400         | validation_error     | Re-read `details[]` and fix the request |
| 401         | unauthorized         | Credential invalid — ask user to check API key |
| 403         | forbidden            | Credential valid but lacks permission for this resource |
| 404         | not_found            | ID does not exist — confirm with user before proceeding |
| 409         | conflict             | Duplicate or state conflict — show message to user |
| 422         | unprocessable        | Semantically invalid input — show details to user |
| 429         | rate_limited         | Back off for `retry_after` seconds from response header |
| 500         | server_error         | Unexpected server error — do not retry automatically |
```

---

## 6. Authentication Handling

This section covers how the agent should actually handle credentials at runtime. Include these rules explicitly in your `SKILL.md` or `references/auth.md`.

### 6.1 Credential Acquisition Hierarchy

Tell the agent to look for credentials in this order:

1. **Environment variable** — preferred for automated/headless use. E.g. `$YOURAPP_API_KEY`.
2. **User-provided in conversation** — if the user has pasted a key in the current conversation, use it.
3. **Prompt the user** — as a last resort, ask: *"To proceed, I need your YourApp API key. You can find it in Settings → API Keys."*

**Never** hardcode credentials. **Never** log or echo credentials back in full.

### 6.2 Credential Validation

Always validate the credential before attempting substantive work:

```bash
# Quick validation call
curl -sf -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $YOURAPP_API_KEY" \
  https://api.yourapp.com/v1/auth/me
```

If the result is `401`, stop and report to the user. Do not proceed.

### 6.3 Masking in Output

When showing curl commands or HTTP snippets to the user, always mask the token:

```bash
# Correct — masked
Authorization: Bearer ****...****

# Wrong — exposed
Authorization: Bearer eyJhbGciOiJSUzI1NiIsIn...
```

---

## 7. Error Handling Patterns

Encode these patterns directly in `SKILL.md` so the agent knows what to do without guessing:

### 7.1 Request Failure Decision Tree

```
API call returns non-2xx
    │
    ├─ 400/422 (client error)
    │      → Read error.details[], identify the bad field(s)
    │      → Fix the request and retry once
    │      → If still failing, report to user with the details
    │
    ├─ 401 (unauthorized)
    │      → Credential issue — do NOT retry
    │      → Ask user to verify API key
    │
    ├─ 403 (forbidden)
    │      → User's account lacks permission
    │      → Report clearly: "Your account does not have access to X"
    │
    ├─ 404 (not found)
    │      → The ID/resource doesn't exist
    │      → Confirm with user before assuming it should exist
    │
    ├─ 409 (conflict)
    │      → Duplicate or state conflict
    │      → Show message to user, suggest alternatives if known
    │
    ├─ 429 (rate limited)
    │      → Read Retry-After header
    │      → Wait that many seconds, then retry once
    │      → If rate limited again, stop and inform user
    │
    └─ 500+ (server error)
           → Do NOT retry automatically
           → Report to user: "The YourApp API returned a server error"
           → Suggest they check the app's status page
```

### 7.2 Destructive Actions (PUT/DELETE)

Before any `DELETE` or `PATCH`/`PUT` that overwrites data:

1. **Show the user what will change.** Display the current value → proposed value.
2. **Ask for explicit confirmation.** Do not proceed on assumed consent.
3. **On success, report what changed.** On failure, report what was *not* changed.

### 7.3 Multi-step Workflows

For workflows involving multiple API calls (e.g. create → attach → publish):

1. Execute each step sequentially.
2. After each step, verify the response before proceeding.
3. If any step fails, **stop**. Do not attempt subsequent steps. Report:
   - Which step failed
   - What succeeded before it (so the user knows the partial state)
   - What the user needs to do to recover

---

## 8. Writing Evals

Evals verify that the skill actually produces correct behavior. Create `evals/evals.json`.

### 8.1 Eval Structure

```json
{
  "skill_name": "your-app-api",
  "evals": [
    {
      "id": 1,
      "prompt": "Fetch the list of active campaigns from YourApp and show me the names and statuses.",
      "expected_output": "A formatted list of campaign names and their statuses from the /campaigns endpoint",
      "expectations": [
        "The agent reads references/auth.md or SKILL.md to determine authentication method",
        "The agent calls GET /campaigns with the correct Authorization header",
        "The agent filters or labels results as 'active'",
        "The agent presents campaign names and statuses clearly to the user",
        "No credentials are exposed in the output"
      ]
    },
    {
      "id": 2,
      "prompt": "Create a new email campaign called 'May Newsletter' for audience ID abc-123 using template ID xyz-789.",
      "expected_output": "The agent calls POST /campaigns with correct body and confirms creation",
      "expectations": [
        "The agent calls POST /campaigns",
        "The request body includes name='May Newsletter', type='email', audience_id='abc-123', template_id='xyz-789'",
        "The agent reports back the new campaign's ID and status",
        "If the API returns an error, the agent reports it clearly"
      ]
    },
    {
      "id": 3,
      "prompt": "Delete campaign ID 99999.",
      "expected_output": "The agent asks for confirmation before deleting",
      "expectations": [
        "The agent does NOT immediately call DELETE /campaigns/99999",
        "The agent asks the user to confirm before proceeding",
        "The agent fetches the campaign name first so confirmation is meaningful"
      ]
    },
    {
      "id": 4,
      "prompt": "Pull the analytics report for campaign ID abc-456 for the last 30 days.",
      "expected_output": "The agent calls the analytics endpoint with correct date range and presents results",
      "expectations": [
        "The agent calculates the correct date range (today minus 30 days)",
        "The agent calls the correct analytics endpoint",
        "The agent presents key metrics clearly (open rate, click rate, etc.)",
        "Dates are formatted correctly per the API's expected format"
      ]
    },
    {
      "id": 5,
      "prompt": "I need to update campaign 'Spring Sale' to send tomorrow at 9am Cape Town time.",
      "expected_output": "The agent finds the campaign by name, converts timezone, and updates scheduled_at",
      "expectations": [
        "The agent searches for campaigns by name or lists and filters",
        "The agent correctly converts 9am SAST (UTC+2) to ISO 8601 UTC",
        "The agent uses PATCH or PUT (whichever your API supports) on the correct endpoint",
        "The agent confirms the change with the user before or after applying it"
      ]
    }
  ]
}
```

### 8.2 Eval Writing Principles

- **Cover the happy path** (correct input → correct output) for your most common operations.
- **Cover destructive actions** — verify the agent asks for confirmation.
- **Cover error cases** — what happens when an ID doesn't exist? When auth fails?
- **Cover multi-step workflows** — verify each step fires in the right order.
- **Expectations should be falsifiable.** "The agent says something helpful" is a bad expectation. "The agent calls `GET /campaigns/{id}` with the correct campaign ID" is a good one.
- **Aim for 8–15 evals** minimum. More if your API surface is large.

---

## 9. Testing the Skill (Claude.ai / Claude Desktop)

In Claude.ai or Claude Desktop, subagents aren't available, so testing is done manually. Here's the process:

### 9.1 Install the Skill

Package and install it (see Section 11), or place the skill directory where your Claude environment can see it.

### 9.2 Run Test Cases Manually

For each eval in `evals.json`:

1. Start a new conversation (clean context).
2. Paste the `prompt` exactly.
3. Observe:
   - Did Claude load the skill? (It should — if it doesn't, your `description` needs strengthening.)
   - Did it read `SKILL.md`? Did it read the right reference files?
   - Did it make the expected API calls?
   - Was the output correct?
4. Note any failures.

### 9.3 Evaluate Against Expectations

After each run, manually check each expectation in `evals.json`:
- ✅ `passed` — clearly met
- ❌ `failed` — clearly not met
- ⚠️ `partial` — ambiguous

Record results. Any ❌ or ⚠️ is a signal to revise the skill.

### 9.4 Common Failure Modes and Fixes

| Failure | Likely Cause | Fix |
|---|---|---|
| Skill doesn't trigger | `description` not matching user phrasing | Add more trigger phrases to description |
| Agent doesn't read reference files | No clear instruction to read them | Add explicit `READ references/endpoints.md before any API call` instruction |
| Wrong endpoint called | Ambiguous endpoint names | Rename or clarify endpoints in `endpoints.md` |
| Missing auth header | Auth instructions buried or unclear | Move auth to top of SKILL.md as "ALWAYS DO THIS FIRST" |
| Agent hallucinates fields | Schemas not in context | Ensure `data-model.md` is referenced explicitly |
| No confirmation on delete | Guardrail not explicit enough | Add `NEVER call DELETE without user confirmation` as a bold, prominent rule |
| Incorrect date format | Format not specified | Add explicit date format with example in `endpoints.md` |
| Pagination ignored | No instruction | Add pagination handling instructions with code example |

---

## 10. Iterating and Improving

### 10.1 Revision Cycle

```
Draft SKILL.md
    ↓
Run all evals manually
    ↓
Record pass/fail per expectation
    ↓
Identify patterns in failures
    ↓
Revise the specific section of SKILL.md that caused failures
    ↓
Re-run only the affected evals
    ↓
Repeat until all evals pass consistently
```

### 10.2 The Three Most Common Improvements

**1. Be more explicit about sequencing.**

Instead of: *"Call the appropriate endpoint to create the resource."*

Write: *"To create a campaign: (1) validate all required fields are present, (2) call `POST /campaigns` with the body from Section 3.2, (3) confirm the response contains an `id`, (4) report the new campaign ID to the user."*

**2. Add worked examples.**

The agent performs dramatically better when it sees a complete request/response example for each operation. Add them to `references/endpoints.md`.

**3. Make guardrails impossible to miss.**

Don't bury safety rules in prose. Use this pattern:

```markdown
> ⚠️ **ALWAYS required before any DELETE:** Call `GET /{resource}/{id}` first to
> confirm the resource exists and show the user what will be deleted. Never skip this.
```

### 10.3 Versioning

Keep a brief changelog at the bottom of `SKILL.md`:

```markdown
## Changelog
- v1.0 — Initial release. Covers CRUD for campaigns and analytics reads.
- v1.1 — Added pagination handling. Fixed auth header format.
- v1.2 — Added email send workflow. Expanded error codes.
```

---

## 11. Packaging and Installing the Skill

### 11.1 Package with the skill-creator script (Claude Code / Cowork)

```bash
python -m scripts.package_skill path/to/your-app-api/
```

This produces `your-app-api.skill`, a single portable file.

### 11.2 Manual Packaging (Claude.ai / Claude Desktop)

If you don't have the package script available:

```bash
cd /path/to/skills-parent-directory
zip -r your-app-api.skill your-app-api/
```

The `.skill` file is just a ZIP archive of the directory.

### 11.3 Installing

- In **Claude Desktop**: Drop the `.skill` file into `~/Library/Application Support/Claude/skills/` (macOS) or `%APPDATA%\Claude\skills\` (Windows).
- In **Claude Code / Cowork**: Place in the project's skills directory or wherever your environment reads skills from.
- In **claude.ai**: Upload via the Skills interface in settings.

### 11.4 Verifying Installation

Start a new conversation and ask: *"What skills do you have access to?"*

The agent should list your skill. Then run one of your eval prompts to confirm end-to-end.

---

## 12. Triggering Checklist

Before considering the skill done, verify these:

- [ ] The `name` in frontmatter is unique and lowercase with hyphens.
- [ ] The `description` mentions the app by name at least twice.
- [ ] The `description` includes at least 5 different phrasing variations of how a user might ask.
- [ ] The `description` has a `Do NOT use for...` exclusion clause to prevent false triggers.
- [ ] The body of `SKILL.md` opens with a one-paragraph summary of what the skill does.
- [ ] `SKILL.md` includes an explicit instruction to read `references/endpoints.md` before making any API call.
- [ ] `SKILL.md` includes an explicit instruction on where to find/how to use credentials.
- [ ] All destructive operations have explicit confirmation requirements.
- [ ] All reference files are reachable via relative paths from `SKILL.md`.
- [ ] `evals/evals.json` exists with at least 8 test cases.
- [ ] All evals have been run at least once and pass.

---

## 13. Complete Annotated SKILL.md Template

Copy this and fill in the `[PLACEHOLDERS]`. Comments in `<!-- -->` are instructions to you — remove them in the final version.

```markdown
---
name: [your-app-name]-api
description: >
  Use this skill whenever the agent needs to interact with the [YourApp] web application
  via its REST API. Triggers include: any request to read, create, update, or delete
  data in [YourApp]; references to [YourApp] entities like [Entity1], [Entity2], [Entity3];
  phrases like "fetch from [YourApp]", "push to [YourApp]", "update in [YourApp]",
  "pull the report", "run the workflow", "via the API", or "using the API".
  Also triggers when the user asks about [YourApp]-specific concepts like [concept1]
  or [concept2]. Do NOT use for tasks that only involve local files with no API calls,
  or for other applications that are not [YourApp].
compatibility: "Claude.ai, Claude Desktop, Claude Code, Cowork"
---

# [YourApp] API Skill

This skill enables interaction with the [YourApp] REST API at `[BASE_URL]`.
Use it to [brief description of what the agent can do — e.g. manage campaigns,
pull analytics, administer users, process orders].

---

## ⚠️ Always Do First

Before any API call:

1. **Load the endpoint reference**: Read `references/endpoints.md` — do this before
   constructing any request.
2. **Confirm credentials**: Check for `[YOUR_APP_API_KEY_ENV_VAR]` environment variable.
   If absent, ask the user. Validate with `GET [BASE_URL]/auth/me`.
3. **Identify the correct endpoint**: Do not guess. Match the user's intent to the
   endpoint table in `references/endpoints.md`.

---

## Base Configuration

| Property | Value |
|---|---|
| Base URL (production) | `[BASE_URL]` |
| Base URL (staging) | `[STAGING_URL]` |
| Auth header | `Authorization: Bearer $[ENV_VAR_NAME]` |
| Content-Type | `application/json` |
| API version | `[v1 / v2 / etc.]` |
| Rate limit | `[e.g. 100 req/min]` |

---

## Agent Scope & Guardrails

<!-- Explicitly list what the agent CAN and CANNOT do -->

**Permitted operations:**
- Read any resource the user's account has access to
- Create [list entity types]
- Update [list entity types]
- [etc.]

**Requires user confirmation before executing:**
- Any `DELETE` operation
- Any bulk operation affecting more than [N] records
- Any publish/send action that triggers external delivery (e.g. sending an email campaign)

**Not permitted (even if asked):**
- Modifying billing or subscription settings
- Changing API credentials or user permissions
- [Any other off-limits operations]

---

## Step-by-Step: Making an API Call

<!-- This section is the agent's procedure for every call -->

1. Identify the target endpoint in `references/endpoints.md`.
2. Build the request:
   - Set `Authorization: Bearer $[ENV_VAR]` header.
   - Set `Content-Type: application/json` for POST/PUT/PATCH.
   - Validate required fields against the schema *before* sending.
3. Execute the call. Use `curl` or the available HTTP tool.
4. Check the response status:
   - `2xx` → success. Extract the relevant data and proceed.
   - `4xx/5xx` → handle per the error tree in `references/error-codes.md`.
5. Report the outcome to the user clearly.

---

## Common Workflows

<!-- Add one subsection per high-frequency task -->

### Fetch [Entity] List

1. Call `GET [BASE_URL]/[entities]` (see `references/endpoints.md` → List [Entities]).
2. Apply any user-specified filters as query params.
3. If the response is paginated, fetch all pages before presenting (see Pagination below).
4. Present results as a formatted table or list.

### Create a New [Entity]

1. Gather required fields from the user: [list required fields].
2. Validate against the schema in `references/data-model.md` → [Entity].
3. Call `POST [BASE_URL]/[entities]`.
4. Confirm creation by reporting back the new `id` and key fields.

### Update an Existing [Entity]

1. Fetch the current state first: `GET [BASE_URL]/[entities]/{id}`.
2. Show the user the current value → proposed value.
3. Ask for confirmation.
4. On confirmation, call `PATCH [BASE_URL]/[entities]/{id}` with only changed fields.
5. Confirm the update.

### Delete an [Entity]

> ⚠️ **Never skip this sequence.**

1. Fetch the resource: `GET [BASE_URL]/[entities]/{id}`.
2. Show the user: *"About to delete [Entity Name] (ID: {id}). This cannot be undone. Confirm?"*
3. Wait for explicit confirmation.
4. On confirmation only: call `DELETE [BASE_URL]/[entities]/{id}`.
5. Report the outcome.

---

## Pagination

<!-- Describe your API's specific pagination scheme -->

This API uses [cursor / offset+limit / page number] pagination.

```
<!-- cursor example: -->
Initial request:   GET /entities?limit=50
Follow-up:         GET /entities?limit=50&cursor={next_cursor from previous response}
Stop when:         response.next_cursor is null

<!-- offset example: -->
Initial request:   GET /entities?limit=50&offset=0
Follow-up:         GET /entities?limit=50&offset=50
Stop when:         response.data.length < limit
```

When a user asks for "all" records, fetch all pages before presenting results.

---

## Rate Limiting

- Limit: `[X]` requests per `[minute/second]`.
- On `429` response: read `Retry-After` header, wait that many seconds, retry once.
- For bulk operations: add a `[0.5 / 1]`-second delay between calls.

---

## Reference Files

| File | When to read it |
|---|---|
| `references/endpoints.md` | Before constructing any API request |
| `references/auth.md` | If credentials are unclear or validation fails |
| `references/data-model.md` | When building request bodies or interpreting responses |
| `references/error-codes.md` | When a non-2xx response is received |

---

## Changelog

- v1.0 — Initial release.
```

---

*End of IMPLEMENTATION.md*
