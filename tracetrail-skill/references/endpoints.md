# TraceTrail API Endpoints

This document provides a complete reference for all TraceTrail API endpoints.

**Base URL**: `http://localhost:8081/api`

**Authentication**: All endpoints (except `/auth/token/issue`) require `Authorization: Bearer <token>` header.

---

## Table of Contents

1. [Health & Stats](#health--stats)
2. [Projects](#projects)
3. [Datasets](#datasets)
4. [Data Sources](#data-sources)
5. [Issues](#issues)
6. [Vault Solutions](#vault-solutions)
7. [Processing Runs](#processing-runs)
8. [API Keys](#api-keys)
9. [Authentication](#authentication)

---

## Health & Stats

### GET /health

Check system health status.

**Request**
```
GET /health
```

**Success Response** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T10:00:00.000Z",
  "database": "connected"
}
```

---

### GET /stats

Get system statistics.

**Request**
```
GET /stats
```

**Success Response** `200 OK`
```json
{
  "projects": 5,
  "datasets": 12,
  "data_sources": 20,
  "issues": 3,
  "vault_solutions": 15,
  "processing_runs": 45
}
```

---

## Projects

Projects are the top-level container for organizing data governance assets.

### GET /projects

List all projects.

**Request**
```
GET /projects
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Filter by project ID |
| name | string | Filter by project name |
| limit | integer | Maximum number of results (default: 50) |

**Success Response** `200 OK`
```json
{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "Customer Analytics",
      "description": "Customer data analytics project",
      "client": "Acme Corp",
      "status": "active",
      "classification": "confidential",
      "owner": "john.doe@example.com",
      "data_steward": "jane.smith@example.com",
      "tags": ["analytics", "customer", "pii"],
      "requirements": ["gdpr", "hipaa"],
      "created_date": "2026-01-15T08:00:00.000Z",
      "updated_date": "2026-03-20T14:30:00.000Z"
    }
  ]
}
```

---

### GET /projects/{project_id}

Get a project by ID.

**Request**
```
GET /projects/{project_id}
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| project_id | string | The project ID |

**Success Response** `200 OK`
```json
{
  "id": "proj_abc123",
  "name": "Customer Analytics",
  "description": "Customer data analytics project",
  "client": "Acme Corp",
  "status": "active",
  "classification": "confidential",
  "owner": "john.doe@example.com",
  "data_steward": "jane.smith@example.com",
  "tags": ["analytics", "customer", "pii"],
  "requirements": ["gdpr", "hipaa"],
  "created_date": "2026-01-15T08:00:00.000Z",
  "updated_date": "2026-03-20T14:30:00.000Z"
}
```

**Error Responses**
| Status | Error | Meaning |
|--------|-------|---------|
| 404 | not_found | Project does not exist |

---

### POST /projects

Create a new project.

**Request**
```
POST /projects
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "string (required, max 100 chars)",
  "description": "string (optional, default: '')",
  "client": "string (optional)",
  "status": "string (optional, default: 'active')",
  "classification": "string (optional)",
  "owner": "string (optional)",
  "data_steward": "string (optional)",
  "tags": ["array", "of", "strings"] (optional),
  "requirements": ["gdpr", "sox"] (optional)
}
```

**Success Response** `201 Created`
```json
{
  "id": "proj_xyz789",
  "name": "New Project",
  "description": "A new project",
  "status": "active",
  "created_date": "2026-03-25T10:00:00.000Z"
}
```

**Error Responses**
| Status | Error | Meaning |
|--------|-------|---------|
| 400 | validation_error | Missing or invalid required fields |
| 409 | duplicate_name | Project with this name already exists |

---

### PUT /projects/{project_id}

Update a project.

**Request**
```
PUT /projects/{project_id}
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "client": "string (optional)",
  "status": "active | archived | pending (optional)",
  "classification": "string (optional)",
  "owner": "string (optional)",
  "data_steward": "string (optional)",
  "tags": ["array", "of", "strings"] (optional),
  "requirements": ["array", "of", "strings"] (optional)
}
```

**Success Response** `200 OK`
```json
{
  "id": "proj_abc123",
  "name": "Updated Project",
  "description": "Updated description",
  "status": "active",
  "updated_date": "2026-03-25T11:00:00.000Z"
}
```

---

### DELETE /projects/{project_id}

Delete a project.

> ⚠️ **Warning**: This will also delete all associated datasets, data sources, and issues.

**Request**
```
DELETE /projects/{project_id}
```

**Success Response** `200 OK`
```json
{
  "message": "Project deleted successfully",
  "id": "proj_abc123"
}
```

**Error Responses**
| Status | Error | Meaning |
|--------|-------|---------|
| 404 | not_found | Project does not exist |

---

## Datasets

Datasets represent collections of related data within a project.

### GET /datasets

List all datasets.

**Request**
```
GET /datasets
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| project_id | string | Filter by parent project ID |
| id | string | Filter by dataset ID |
| name | string | Filter by dataset name |
| limit | integer | Maximum number of results |

**Success Response** `200 OK`
```json
{
  "datasets": [
    {
      "id": "ds_abc123",
      "name": "Customer Orders",
      "project_id": "proj_abc123",
      "description": "Customer order data",
      "source_system": "Salesforce",
      "source_type": "api",
      "refresh_frequency": "daily",
      "governance_classification": "confidential",
      "contains_pii": true,
      "retention_period": "7 years",
      "status": "active",
      "tags": ["orders", "sales", "customer"],
      "created_date": "2026-01-20T09:00:00.000Z",
      "updated_date": "2026-03-15T16:00:00.000Z"
    }
  ]
}
```

---

### GET /datasets/{dataset_id}

Get a dataset by ID.

**Request**
```
GET /datasets/{dataset_id}
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| dataset_id | string | The dataset ID |

**Success Response** `200 OK`
```json
{
  "id": "ds_abc123",
  "name": "Customer Orders",
  "project_id": "proj_abc123",
  "description": "Customer order data",
  "source_system": "Salesforce",
  "source_type": "api",
  "refresh_frequency": "daily",
  "governance_classification": "confidential",
  "contains_pii": true,
  "retention_period": "7 years",
  "status": "active",
  "tags": ["orders", "sales", "customer"],
  "created_date": "2026-01-20T09:00:00.000Z",
  "updated_date": "2026-03-15T16:00:00.000Z"
}
```

---

### POST /datasets

Create a new dataset.

**Request**
```
POST /datasets
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "string (required)",
  "project_id": "string (optional)",
  "description": "string (optional)",
  "source_system": "string (optional)",
  "source_type": "database | file | api | stream | warehouse | lake (optional)",
  "refresh_frequency": "string (optional)",
  "governance_classification": "string (optional)",
  "contains_pii": boolean (optional, default: false),
  "retention_period": "string (optional)",
  "status": "string (optional, default: 'active')",
  "tags": ["array", "of", "strings"] (optional)
}
```

**Success Response** `201 Created`
```json
{
  "id": "ds_xyz789",
  "name": "New Dataset",
  "project_id": "proj_abc123",
  "status": "active",
  "created_date": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /datasets/{dataset_id}

Update a dataset.

**Request**
```
PUT /datasets/{dataset_id}
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "source_system": "string (optional)",
  "source_type": "string (optional)",
  "refresh_frequency": "string (optional)",
  "governance_classification": "string (optional)",
  "contains_pii": boolean (optional),
  "retention_period": "string (optional)",
  "status": "active | archived (optional)",
  "tags": ["array", "of", "strings"] (optional)
}
```

**Success Response** `200 OK`
```json
{
  "id": "ds_abc123",
  "name": "Updated Dataset",
  "updated_date": "2026-03-25T11:00:00.000Z"
}
```

---

### DELETE /datasets/{dataset_id}

Delete a dataset.

> ⚠️ **Warning**: This will also delete all associated data sources and issues.

**Request**
```
DELETE /datasets/{dataset_id}
```

**Success Response** `200 OK`
```json
{
  "message": "Dataset deleted successfully",
  "id": "ds_abc123"
}
```

---

## Data Sources

Data sources represent connections to external data systems.

### GET /datasources

List all data sources.

**Request**
```
GET /datasources
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| project_id | string | Filter by project ID |
| dataset_id | string | Filter by dataset ID |
| type | string | Filter by data source type (api, file, stream, database, warehouse) |
| status | string | Filter by status (idle, running, error, completed) |
| limit | integer | Maximum number of results |

**Success Response** `200 OK`
```json
{
  "datasources": [
    {
      "id": "dsrc_abc123",
      "name": "Salesforce API",
      "project_id": "proj_abc123",
      "type": "api",
      "status": "idle",
      "source_location": "https://api.salesforce.com/v48.0",
      "target_location": "s3://tracertrail-data/raw/salesforce/",
      "phase": "extraction",
      "quality_score": 98.5,
      "completeness_score": 99.2,
      "accuracy_score": 98.0,
      "records_processed": 150000,
      "records_failed": 150,
      "file_size": "2.5 GB",
      "row_count": 150000,
      "column_count": 45,
      "created_date": "2026-01-25T10:00:00.000Z",
      "updated_date": "2026-03-24T18:00:00.000Z"
    }
  ]
}
```

---

### GET /datasources/{datasource_id}

Get a data source by ID.

**Request**
```
GET /datasources/{datasource_id}
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| datasource_id | string | The data source ID |

**Success Response** `200 OK`
```json
{
  "id": "dsrc_abc123",
  "name": "Salesforce API",
  "project_id": "proj_abc123",
  "type": "api",
  "status": "idle",
  "source_location": "https://api.salesforce.com/v48.0",
  "target_location": "s3://tracertrail-data/raw/salesforce/",
  "phase": "extraction",
  "quality_score": 98.5,
  "completeness_score": 99.2,
  "accuracy_score": 98.0,
  "records_processed": 150000,
  "records_failed": 150,
  "file_size": "2.5 GB",
  "row_count": 150000,
  "column_count": 45,
  "created_date": "2026-01-25T10:00:00.000Z",
  "updated_date": "2026-03-24T18:00:00.000Z"
}
```

---

### POST /datasources

Create a new data source.

**Request**
```
POST /datasources
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "string (required)",
  "project_id": "string (optional)",
  "type": "api | file | stream | database | warehouse (required)",
  "source_location": "string (optional)",
  "target_location": "string (optional)",
  "status": "idle (optional, default: 'idle')"
}
```

**Success Response** `201 Created`
```json
{
  "id": "dsrc_xyz789",
  "name": "New Data Source",
  "project_id": "proj_abc123",
  "type": "api",
  "status": "idle",
  "created_date": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /datasources/{datasource_id}

Update a data source.

**Request**
```
PUT /datasources/{datasource_id}
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "string (optional)",
  "source_location": "string (optional)",
  "target_location": "string (optional)",
  "status": "idle | running | error | completed (optional)",
  "phase": "string (optional)",
  "quality_score": number (optional),
  "completeness_score": number (optional),
  "accuracy_score": number (optional)
}
```

**Success Response** `200 OK`
```json
{
  "id": "dsrc_abc123",
  "name": "Updated Data Source",
  "updated_date": "2026-03-25T11:00:00.000Z"
}
```

---

### DELETE /datasources/{datasource_id}

Delete a data source.

> ⚠️ **Warning**: This will also delete all associated issues and processing runs.

**Request**
```
DELETE /datasources/{datasource_id}
```

**Success Response** `200 OK`
```json
{
  "message": "Data source deleted successfully",
  "id": "dsrc_abc123"
}
```

---

## Issues

Issues represent data quality problems or governance concerns.

### GET /issues

List all issues.

**Request**
```
GET /issues
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| data_source_id | string | Filter by data source ID |
| status | string | Filter by status (open, in_progress, resolved, closed) |
| severity | string | Filter by severity (low, medium, high, critical) |
| limit | integer | Maximum number of results |

**Success Response** `200 OK`
```json
{
  "issues": [
    {
      "id": "issue_abc123",
      "title": "Missing primary key",
      "description": "The customer_id column has null values",
      "data_source_id": "dsrc_abc123",
      "issue_type": "data_quality",
      "severity": "high",
      "status": "open",
      "assigned_to": "john.doe@example.com",
      "file": "customers.csv",
      "dataset": "Customer Data",
      "root_cause": "ETL process not handling nulls",
      "impact_description": "Cannot uniquely identify customers",
      "rows_affected": 150,
      "tags": ["nulls", "primary-key", "data-quality"],
      "created_date": "2026-03-20T10:00:00.000Z",
      "updated_date": "2026-03-25T09:00:00.000Z"
    }
  ]
}
```

---

### GET /issues/{issue_id}

Get an issue by ID.

**Request**
```
GET /issues/{issue_id}
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| issue_id | string | The issue ID |

**Success Response** `200 OK`
```json
{
  "id": "issue_abc123",
  "title": "Missing primary key",
  "description": "The customer_id column has null values",
  "data_source_id": "dsrc_abc123",
  "issue_type": "data_quality",
  "severity": "high",
  "status": "open",
  "assigned_to": "john.doe@example.com",
  "file": "customers.csv",
  "dataset": "Customer Data",
  "root_cause": "ETL process not handling nulls",
  "impact_description": "Cannot uniquely identify customers",
  "rows_affected": 150,
  "tags": ["nulls", "primary-key", "data-quality"],
  "created_date": "2026-03-20T10:00:00.000Z",
  "updated_date": "2026-03-25T09:00:00.000Z"
}
```

---

### POST /issues

Create a new issue.

**Request**
```
POST /issues
Content-Type: application/json
```

**Request Body**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "data_source_id": "string (optional)",
  "issue_type": "string (optional)",
  "severity": "low | medium | high | critical (optional, default: 'medium')",
  "status": "open | in_progress | resolved | closed (optional, default: 'open')",
  "assigned_to": "string (optional)",
  "file": "string (optional)",
  "dataset": "string (optional)",
  "root_cause": "string (optional)",
  "impact_description": "string (optional)",
  "rows_affected": number (optional),
  "tags": ["array", "of", "strings"] (optional)
}
```

**Success Response** `201 Created`
```json
{
  "id": "issue_xyz789",
  "title": "New Issue",
  "severity": "medium",
  "status": "open",
  "created_date": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /issues/{issue_id}

Update an issue.

**Request**
```
PUT /issues/{issue_id}
Content-Type: application/json
```

**Request Body**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "severity": "low | medium | high | critical (optional)",
  "status": "open | in_progress | resolved | closed (optional)",
  "assigned_to": "string (optional)",
  "root_cause": "string (optional)",
  "impact_description": "string (optional)",
  "rows_affected": number (optional),
  "tags": ["array", "of", "strings"] (optional)
}
```

**Success Response** `200 OK`
```json
{
  "id": "issue_abc123",
  "title": "Updated Issue",
  "status": "in_progress",
  "updated_date": "2026-03-25T11:00:00.000Z"
}
```

---

### PUT /issues/{issue_id}/resolve

Mark an issue as resolved (convenience endpoint).

**Request**
```
PUT /issues/{issue_id}/resolve
Content-Type: application/json
```

**Request Body**
```json
{
  "resolution": "string (optional)"
}
```

**Success Response** `200 OK`
```json
{
  "id": "issue_abc123",
  "status": "resolved",
  "resolution": "Fixed null handling in ETL",
  "updated_date": "2026-03-25T11:00:00.000Z"
}
```

---

### DELETE /issues/{issue_id}

Delete an issue.

**Request**
```
DELETE /issues/{issue_id}
```

**Success Response** `200 OK`
```json
{
  "message": "Issue deleted successfully",
  "id": "issue_abc123"
}
```

---

## Vault Solutions

Vault solutions store reusable code snippets and solutions.

### GET /vault

List all vault solutions or search.

**Request**
```
GET /vault
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (searches title, description, code_snippet) |
| category | string | Filter by category |
| limit | integer | Maximum number of results |

**Success Response** `200 OK`
```json
{
  "solutions": [
    {
      "id": "vault_abc123",
      "title": "SQL Deduplicate Rows",
      "description": "Remove duplicate rows using ROW_NUMBER()",
      "category": "sql",
      "tags": ["sql", "deduplication", "etl"],
      "code_snippet": "WITH ranked AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_date DESC) as rn\n  FROM table_name\n)\nDELETE FROM table_name WHERE id IN (\n  SELECT id FROM ranked WHERE rn > 1\n)",
      "language": "sql",
      "usage_count": 42,
      "author": "john.doe@example.com",
      "created_date": "2026-01-10T10:00:00.000Z",
      "updated_date": "2026-03-15T14:00:00.000Z"
    }
  ]
}
```

---

### GET /vault/{solution_id}

Get a vault solution by ID.

**Request**
```
GET /vault/{solution_id}
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| solution_id | string | The vault solution ID |

**Success Response** `200 OK`
```json
{
  "id": "vault_abc123",
  "title": "SQL Deduplicate Rows",
  "description": "Remove duplicate rows using ROW_NUMBER()",
  "category": "sql",
  "tags": ["sql", "deduplication", "etl"],
  "code_snippet": "...",
  "language": "sql",
  "usage_count": 42,
  "author": "john.doe@example.com",
  "created_date": "2026-01-10T10:00:00.000Z",
  "updated_date": "2026-03-15T14:00:00.000Z"
}
```

---

### POST /vault

Create a new vault solution.

**Request**
```
POST /vault
Content-Type: application/json
```

**Request Body**
```json
{
  "title": "string (required)",
  "code_snippet": "string (required)",
  "description": "string (optional)",
  "category": "string (optional)",
  "language": "sql | python | javascript | bash | yaml | json (optional, default: 'sql')",
  "tags": ["array", "of", "strings"] (optional),
  "author": "string (optional)"
}
```

**Success Response** `201 Created`
```json
{
  "id": "vault_xyz789",
  "title": "New Solution",
  "language": "sql",
  "usage_count": 0,
  "created_date": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /vault/{solution_id}

Update a vault solution.

**Request**
```
PUT /vault/{solution_id}
Content-Type: application/json
```

**Request Body**
```json
{
  "title": "string (optional)",
  "code_snippet": "string (optional)",
  "description": "string (optional)",
  "category": "string (optional)",
  "language": "string (optional)",
  "tags": ["array", "of", "strings"] (optional)
}
```

**Success Response** `200 OK`
```json
{
  "id": "vault_abc123",
  "title": "Updated Solution",
  "updated_date": "2026-03-25T11:00:00.000Z"
}
```

---

### DELETE /vault/{solution_id}

Delete a vault solution.

**Request**
```
DELETE /vault/{solution_id}
```

**Success Response** `200 OK`
```json
{
  "message": "Vault solution deleted successfully",
  "id": "vault_abc123"
}
```

---

## Processing Runs

Processing runs track data ingestion and processing jobs.

### GET /processing-runs

List all processing runs.

**Request**
```
GET /processing-runs
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| data_source_id | string | Filter by data source ID |
| status | string | Filter by status (pending, in_progress, completed, failed, cancelled) |
| limit | integer | Maximum number of results |

**Success Response** `200 OK`
```json
{
  "processing_runs": [
    {
      "id": "run_abc123",
      "data_source_id": "dsrc_abc123",
      "status": "completed",
      "started_at": "2026-03-25T08:00:00.000Z",
      "finished_at": "2026-03-25T08:15:00.000Z",
      "duration_ms": 900000,
      "records_processed": 150000,
      "records_failed": 150,
      "created_date": "2026-03-25T08:00:00.000Z",
      "updated_date": "2026-03-25T08:15:00.000Z"
    }
  ]
}
```

---

### GET /processing-runs/{run_id}

Get a processing run by ID.

**Request**
```
GET /processing-runs/{run_id}
```

**Path Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| run_id | string | The processing run ID |

**Success Response** `200 OK`
```json
{
  "id": "run_abc123",
  "data_source_id": "dsrc_abc123",
  "status": "completed",
  "started_at": "2026-03-25T08:00:00.000Z",
  "finished_at": "2026-03-25T08:15:00.000Z",
  "duration_ms": 900000,
  "records_processed": 150000,
  "records_failed": 150,
  "created_date": "2026-03-25T08:00:00.000Z",
  "updated_date": "2026-03-25T08:15:00.000Z"
}
```

---

### POST /processing-runs

Start a new processing run.

**Request**
```
POST /processing-runs
Content-Type: application/json
```

**Request Body**
```json
{
  "data_source_id": "string (required)",
  "status": "in_progress (optional, default: 'in_progress')"
}
```

**Success Response** `201 Created`
```json
{
  "id": "run_xyz789",
  "data_source_id": "dsrc_abc123",
  "status": "in_progress",
  "started_at": "2026-03-25T10:00:00.000Z",
  "created_date": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /processing-runs/{run_id}

Update a processing run (mark as complete, failed, etc.).

**Request**
```
PUT /processing-runs/{run_id}
Content-Type: application/json
```

**Request Body**
```json
{
  "status": "pending | in_progress | completed | failed | cancelled (optional)",
  "records_processed": number (optional),
  "records_failed": number (optional)
}
```

**Success Response** `200 OK`
```json
{
  "id": "run_abc123",
  "status": "completed",
  "finished_at": "2026-03-25T10:30:00.000Z",
  "records_processed": 150000,
  "records_failed": 150,
  "updated_date": "2026-03-25T10:30:00.000Z"
}
```

---

## API Keys

Manage API keys for authentication.

### GET /auth/keys

List all API keys.

**Request**
```
GET /auth/keys
```

**Success Response** `200 OK`
```json
{
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production API Key",
      "permissions": {
        "projects": ["read", "write"],
        "datasets": ["read", "write"],
        "datasources": ["read", "write"],
        "issues": ["read", "write"],
        "vault": ["read", "write"]
      },
      "rate_limit": 100,
      "is_active": true,
      "last_used_at": "2026-03-25T09:00:00.000Z",
      "created_date": "2026-01-01T00:00:00.000Z",
      "expires_at": "2026-12-31T23:59:59.000Z"
    }
  ]
}
```

---

### POST /auth/keys

Create a new API key.

**Request**
```
POST /auth/keys
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "string (required)",
  "expires_in": number (optional, default: 2592000 seconds = 30 days),
  "rate_limit": number (optional, default: 100 requests/minute)
}
```

**Success Response** `201 Created`
```json
{
  "id": "key_xyz789",
  "name": "New API Key",
  "key": "tt_live_abc123...",  // Only shown once!
  "expires_at": "2026-04-24T10:00:00.000Z",
  "created_date": "2026-03-25T10:00:00.000Z"
}
```

> ⚠️ **Important**: The `key` field is only shown at creation time. Copy it immediately as it cannot be retrieved later.

---

### DELETE /auth/keys/{key_id}

Delete an API key.

**Request**
```
DELETE /auth/keys/{key_id}
```

**Success Response** `200 OK`
```json
{
  "message": "API key deleted successfully",
  "id": "key_abc123"
}
```

---

## Authentication

### POST /auth/token/issue

Exchange an API key for an access token.

**Request**
```
POST /auth/token/issue
Content-Type: application/json
```

**Request Body**
```json
{
  "api_key": "string (required)"
}
```

**Success Response** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "2026-03-26T10:00:00.000Z"
}
```

---

### POST /auth/token/verify

Verify if a token is valid.

**Request**
```
POST /auth/token/verify
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response** `200 OK`
```json
{
  "valid": true,
  "user_id": "user_123",
  "expires_at": "2026-03-26T10:00:00.000Z"
}
```

---

### POST /auth/token/refresh

Refresh an access token.

**Request**
```
POST /auth/token/refresh
Content-Type: application/json
```

**Request Body**
```json
{
  "token": "string (required, current access token)"
}
```

**Success Response** `200 OK`
```json
{
  "access_token": "new-access-token...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "2026-03-27T10:00:00.000Z"
}
```

---

*Last Updated: 2026-03-25*
