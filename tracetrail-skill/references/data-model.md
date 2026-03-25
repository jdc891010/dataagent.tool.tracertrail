# TraceTrail Data Models

This document provides detailed schemas for all TraceTrail entities.

---

## Common Fields

All entities share these base fields:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (prefixed: `proj_`, `ds_`, `dsrc_`, `issue_`, `vault_`, `run_`, `key_`) |
| created_date | ISO 8601 datetime | Creation timestamp |
| updated_date | ISO 8601 datetime | Last update timestamp |

---

## Project

Projects are top-level containers for organizing data governance assets.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Unique project ID |
| name | string | Yes | Project name (max 100 characters) |
| description | string | No | Project description |
| client | string | No | Client or business unit name |
| status | string | No | Project status (default: "active") |
| classification | string | No | Governance classification (e.g., "public", "internal", "confidential", "restricted") |
| owner | string | No | Project owner email |
| data_steward | string | No | Data steward email |
| tags | array[string] | No | Project tags |
| requirements | array[string] | No | Compliance requirements (e.g., "gdpr", "hipaa", "sox") |
| created_date | datetime | Auto | Creation timestamp |
| updated_date | datetime | Auto | Last update timestamp |

### Status Values

| Value | Description |
|-------|-------------|
| active | Project is active and in use |
| archived | Project is archived |
| pending | Project is pending approval |

### Classification Values

| Value | Description |
|-------|-------------|
| public | Publicly available data |
| internal | Internal-only data |
| confidential | Confidential business data |
| restricted | Highly sensitive data |

### Example

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

---

## Dataset

Datasets represent collections of related data within a project.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Unique dataset ID |
| name | string | Yes | Dataset name |
| project_id | string | No | Parent project ID |
| description | string | No | Dataset description |
| source_system | string | No | Source system name (e.g., "Salesforce", "Snowflake") |
| source_type | string | No | Type of source |
| refresh_frequency | string | No | How often data is refreshed (e.g., "daily", "hourly") |
| governance_classification | string | No | Data classification |
| contains_pii | boolean | No | Whether dataset contains PII (default: false) |
| retention_period | string | No | Data retention period (e.g., "7 years") |
| status | string | No | Dataset status (default: "active") |
| tags | array[string] | No | Dataset tags |
| created_date | datetime | Auto | Creation timestamp |
| updated_date | datetime | Auto | Last update timestamp |

### Source Type Values

| Value | Description |
|-------|-------------|
| database | Relational database |
| file | File-based (CSV, Parquet, etc.) |
| api | REST API |
| stream | Streaming data |
| warehouse | Data warehouse |
| lake | Data lake |

### Status Values

| Value | Description |
|-------|-------------|
| active | Dataset is active |
| archived | Dataset is archived |

### Example

```json
{
  "id": "ds_abc123",
  "name": "Customer Orders",
  "project_id": "proj_abc123",
  "description": "Customer order data from Salesforce",
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

## DataSource

Data sources represent connections to external data systems.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Unique data source ID |
| name | string | Yes | Data source name |
| project_id | string | No | Parent project ID |
| type | string | Yes | Type of data source |
| status | string | No | Current status (default: "idle") |
| source_location | string | No | Source connection string/URL |
| target_location | string | No | Target storage location |
| phase | string | No | Current processing phase |
| quality_score | float | No | Data quality score (0-100) |
| completeness_score | float | No | Data completeness score (0-100) |
| accuracy_score | float | No | Data accuracy score (0-100) |
| records_processed | integer | No | Number of records processed |
| records_failed | integer | No | Number of records that failed |
| file_size | string | No | Size of the data file |
| row_count | integer | No | Number of rows |
| column_count | integer | No | Number of columns |
| created_date | datetime | Auto | Creation timestamp |
| updated_date | datetime | Auto | Last update timestamp |

### Type Values

| Value | Description |
|-------|-------------|
| api | REST API |
| file | File upload |
| stream | Streaming |
| database | Database connection |
| warehouse | Data warehouse |

### Status Values

| Value | Description |
|-------|-------------|
| idle | Not currently processing |
| running | Actively processing |
| error | Processing failed |
| completed | Processing completed |

### Example

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

## Issue

Issues represent data quality problems or governance concerns.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Unique issue ID |
| title | string | Yes | Issue title |
| description | string | No | Detailed description |
| data_source_id | string | No | Related data source ID |
| issue_type | string | No | Type of issue |
| severity | string | No | Severity level (default: "medium") |
| status | string | No | Issue status (default: "open") |
| assigned_to | string | No | Email of assignee |
| file | string | No | Related file name |
| dataset | string | No | Related dataset name |
| root_cause | string | No | Root cause description |
| impact_description | string | No | Business impact description |
| rows_affected | integer | No | Number of affected rows |
| tags | array[string] | No | Issue tags |
| created_date | datetime | Auto | Creation timestamp |
| updated_date | datetime | Auto | Last update timestamp |

### Severity Values

| Value | Description |
|-------|-------------|
| low | Minor issue, low priority |
| medium | Moderate issue |
| high | Important issue |
| critical | Critical issue requiring immediate attention |

### Status Values

| Value | Description |
|-------|-------------|
| open | Issue newly created |
| in_progress | Issue being worked on |
| resolved | Issue resolved |
| closed | Issue closed and verified |

### Issue Type Values

| Value | Description |
|-------|-------------|
| data_quality | Data quality problem |
| governance | Governance violation |
| security | Security concern |
| compliance | Compliance issue |
| other | Other type of issue |

### Example

```json
{
  "id": "issue_abc123",
  "title": "Missing primary key",
  "description": "The customer_id column has null values in 150 rows",
  "data_source_id": "dsrc_abc123",
  "issue_type": "data_quality",
  "severity": "high",
  "status": "open",
  "assigned_to": "john.doe@example.com",
  "file": "customers.csv",
  "dataset": "Customer Data",
  "root_cause": "ETL process not handling nulls",
  "impact_description": "Cannot uniquely identify customers for 150 records",
  "rows_affected": 150,
  "tags": ["nulls", "primary-key", "data-quality"],
  "created_date": "2026-03-20T10:00:00.000Z",
  "updated_date": "2026-03-25T09:00:00.000Z"
}
```

---

## VaultSolution

Vault solutions store reusable code snippets and solutions.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Unique solution ID |
| title | string | Yes | Solution title |
| description | string | No | Solution description |
| category | string | No | Solution category |
| tags | array[string] | No | Solution tags |
| code_snippet | string | Yes | The code snippet |
| language | string | No | Programming language (default: "sql") |
| usage_count | integer | Auto | Number of times used |
| author | string | No | Author email |
| created_date | datetime | Auto | Creation timestamp |
| updated_date | datetime | Auto | Last update timestamp |

### Language Values

| Value | Description |
|-------|-------------|
| sql | SQL |
| python | Python |
| javascript | JavaScript |
| bash | Bash/Shell |
| yaml | YAML |
| json | JSON |
| other | Other language |

### Example

```json
{
  "id": "vault_abc123",
  "title": "SQL Deduplicate Rows",
  "description": "Remove duplicate rows using ROW_NUMBER() window function",
  "category": "sql",
  "tags": ["sql", "deduplication", "etl", "data-quality"],
  "code_snippet": "WITH ranked AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_date DESC) as rn\n  FROM table_name\n)\nDELETE FROM table_name WHERE id IN (\n  SELECT id FROM ranked WHERE rn > 1\n)",
  "language": "sql",
  "usage_count": 42,
  "author": "john.doe@example.com",
  "created_date": "2026-01-10T10:00:00.000Z",
  "updated_date": "2026-03-15T14:00:00.000Z"
}
```

---

## ProcessingRun

Processing runs track data ingestion and processing jobs.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto | Unique run ID |
| data_source_id | string | No | Associated data source ID |
| status | string | No | Run status (default: "pending") |
| started_at | datetime | Auto | When run started |
| finished_at | datetime | Auto | When run finished |
| duration_ms | integer | Auto | Duration in milliseconds |
| records_processed | integer | No | Number of records processed |
| records_failed | integer | No | Number of records failed |
| created_date | datetime | Auto | Creation timestamp |
| updated_date | datetime | Auto | Last update timestamp |

### Status Values

| Value | Description |
|-------|-------------|
| pending | Run created but not started |
| in_progress | Run is executing |
| completed | Run completed successfully |
| failed | Run failed |
| cancelled | Run was cancelled |

### Example

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

## ApiKey

API keys for authentication.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique key ID |
| name | string | Key name |
| permissions | object | Permission grants |
| rate_limit | integer | Requests per minute (default: 100) |
| is_active | boolean | Whether key is active |
| last_used_at | datetime | Last time key was used |
| created_date | datetime | Creation timestamp |
| expires_at | datetime | Expiration timestamp |

### Permissions Structure

```json
{
  "projects": ["read", "write", "delete"],
  "datasets": ["read", "write", "delete"],
  "datasources": ["read", "write", "delete"],
  "issues": ["read", "write", "delete"],
  "vault": ["read", "write", "delete"]
}
```

### Example

```json
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
```

---

## TokenResponse

Response from token issuance/refresh.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| access_token | string | JWT access token |
| token_type | string | Token type (always "Bearer") |
| expires_in | integer | Token lifetime in seconds |
| expires_at | datetime | Token expiration timestamp |

### Example

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "2026-03-26T10:00:00.000Z"
}
```

---

## HealthStatus

System health response.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| status | string | Health status |
| timestamp | datetime | Check timestamp |
| database | string | Database connection status |

### Example

```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T10:00:00.000Z",
  "database": "connected"
}
```

---

## SystemStats

System statistics response.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| projects | integer | Total number of projects |
| datasets | integer | Total number of datasets |
| data_sources | integer | Total number of data sources |
| issues | integer | Total number of issues |
| vault_solutions | integer | Total number of vault solutions |
| processing_runs | integer | Total number of processing runs |

### Example

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

*Last Updated: 2026-03-25*
