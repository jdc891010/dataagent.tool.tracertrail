import { dataAgent } from "@/api/dataAgentClient";

export async function populateSampleData() {
  const timestamp = new Date().toISOString();
  const today = new Date();
  const day = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return d;
  };
  
  // 1. Create Projects
  const project1 = await dataAgent.entities.Project.create({
    name: "Customer 360",
    description: "Consolidated view of customer data across all touchpoints",
    classification: "internal",
    owner: "Sarah Chen",
    data_steward: "Mike Ross",
    requirements: ["GDPR", "CCPA"],
    tags: ["customer", "analytics", "marketing"]
  });

  const project2 = await dataAgent.entities.Project.create({
    name: "Sales Forecast",
    description: "Quarterly sales prediction models and reporting",
    classification: "confidential",
    owner: "Alex Thompson",
    data_steward: "Lisa Wang",
    requirements: ["SOX"],
    tags: ["finance", "forecasting"]
  });

  // 2. Create Datasets
  const dataset1 = await dataAgent.entities.Dataset.create({
    name: "CRM Contacts",
    description: "Raw contact data from Salesforce",
    project_id: project1.id,
    project: project1.name,
    source_system: "Salesforce",
    type: "api",
    refresh_frequency: "daily",
    contains_pii: true,
    data_retention: "7 years",
    data_steward: "Mike Ross",
    data_owner: "Sarah Chen",
    tags: ["raw", "crm"],
    solution: ["Customer Segmentation", "Churn Prediction"]
  });

  const dataset2 = await dataAgent.entities.Dataset.create({
    name: "Web Events",
    description: "Clickstream data from website",
    project_id: project1.id,
    project: project1.name,
    source_system: "Segment",
    type: "stream",
    refresh_frequency: "real-time",
    contains_pii: false,
    data_retention: "1 year",
    data_steward: "Mike Ross",
    data_owner: "Sarah Chen",
    tags: ["events", "clickstream"],
    solution: ["Behavior Analysis"]
  });

  const dataset3 = await dataAgent.entities.Dataset.create({
    name: "Regional Sales",
    description: "Aggregated sales numbers by region",
    project_id: project2.id,
    project: project2.name,
    source_system: "Snowflake",
    type: "warehouse",
    refresh_frequency: "weekly",
    contains_pii: false,
    data_retention: "10 years",
    data_steward: "Lisa Wang",
    data_owner: "Alex Thompson",
    tags: ["aggregated", "finance"],
    solution: ["Revenue Reporting"]
  });

  // 3. Create Data Sources
  const source1 = await dataAgent.entities.DataSource.create({
    name: "SFDC Contacts API",
    dataset_id: dataset1.id,
    dataset: dataset1.name,
    project: project1.name,
    type: "api",
    source_location: "/services/data/v54.0/sobjects/Contact",
    target_location: "warehouse.raw.sfdc_contacts",
    status: "completed",
    phase: "ingestion",
    records_processed: 15420,
    records_failed: 0,
    quality_score: 98,
    schema: {
      columns: [
        { name: "id", type: "string", nullable: false },
        { name: "email", type: "string", nullable: true },
        { name: "first_name", type: "string", nullable: true },
        { name: "last_name", type: "string", nullable: true },
        { name: "phone", type: "string", nullable: true },
        { name: "created_date", type: "timestamp", nullable: false },
        { name: "last_modified", type: "timestamp", nullable: false }
      ]
    },
    // Provide mock daily processing duration for timeline
    daily_processing_duration: {
      [day(6).toISOString().slice(0,10)]: 42 * 60000,
      [day(5).toISOString().slice(0,10)]: 38 * 60000,
      [day(4).toISOString().slice(0,10)]: 55 * 60000,
      [day(3).toISOString().slice(0,10)]: 47 * 60000,
      [day(2).toISOString().slice(0,10)]: 61 * 60000,
      [day(1).toISOString().slice(0,10)]: 30 * 60000
    },
    total_processing_duration: (42 + 38 + 55 + 47 + 61 + 30) * 60000,
    last_run_date: day(1).toISOString()
  });

  const source2 = await dataAgent.entities.DataSource.create({
    name: "Event Stream Topic",
    dataset_id: dataset2.id,
    dataset: dataset2.name,
    project: project1.name,
    type: "stream",
    source_location: "kafka://events-prod/clickstream",
    target_location: "lake.events.clickstream",
    status: "in_progress",
    phase: "processing",
    records_processed: 2500000,
    records_failed: 150,
    quality_score: 95,
    schema: {
      columns: [
        { name: "event_id", type: "string", nullable: false },
        { name: "session_id", type: "string", nullable: false },
        { name: "user_id", type: "string", nullable: true },
        { name: "event_type", type: "string", nullable: false },
        { name: "url", type: "string", nullable: true },
        { name: "timestamp", type: "timestamp", nullable: false },
        { name: "properties", type: "string", nullable: true }
      ]
    },
    daily_processing_duration: {
      [day(6).toISOString().slice(0,10)]: 120 * 60000,
      [day(5).toISOString().slice(0,10)]: 95 * 60000,
      [day(4).toISOString().slice(0,10)]: 110 * 60000,
      [day(3).toISOString().slice(0,10)]: 130 * 60000,
      [day(2).toISOString().slice(0,10)]: 80 * 60000,
      [day(1).toISOString().slice(0,10)]: 140 * 60000
    },
    total_processing_duration: (120 + 95 + 110 + 130 + 80 + 140) * 60000,
    last_run_date: today.toISOString()
  });

  const source3 = await dataAgent.entities.DataSource.create({
    name: "Q3 Sales CSV",
    dataset_id: dataset3.id,
    dataset: dataset3.name,
    project: project2.name,
    type: "file",
    source_location: "s3://finance-bucket/sales/2024/q3_final.csv",
    target_location: "warehouse.finance.quarterly_sales",
    status: "alert",
    phase: "validation",
    records_processed: 5000,
    records_failed: 42,
    quality_score: 85,
    schema: {
      columns: [
        { name: "transaction_id", type: "string", nullable: false },
        { name: "customer_id", type: "string", nullable: false },
        { name: "product_id", type: "string", nullable: false },
        { name: "amount", type: "decimal", nullable: false },
        { name: "currency", type: "string", nullable: false },
        { name: "sale_date", type: "date", nullable: false },
        { name: "region", type: "string", nullable: true }
      ]
    },
    daily_processing_duration: {
      [day(4).toISOString().slice(0,10)]: 25 * 60000,
      [day(3).toISOString().slice(0,10)]: 0,
      [day(2).toISOString().slice(0,10)]: 15 * 60000
    },
    total_processing_duration: (25 + 0 + 15) * 60000,
    last_run_date: day(2).toISOString()
  });

  const source4 = await dataAgent.entities.DataSource.create({
    name: "Customer Survey Data",
    dataset_id: dataset2.id,
    dataset: dataset2.name,
    project: project1.name,
    type: "api",
    source_location: "/api/surveys/responses",
    target_location: "lake.surveys.raw",
    status: "paused",
    phase: "processing",
    records_processed: 1200,
    records_failed: 5,
    quality_score: 92,
    daily_processing_duration: {
      [day(1).toISOString().slice(0,10)]: 45 * 60000
    },
    total_processing_duration: 45 * 60000,
    last_run_date: day(1).toISOString()
  });

  // 3a. Create mock ProcessingRun history for each source
  // SFDC Contacts - completed runs
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source1.id,
    started_at: day(6).toISOString(),
    finished_at: new Date(day(6).getTime() + 42 * 60000).toISOString(),
    duration_minutes: 42,
    duration_ms: 42 * 60000,
    status: "completed",
    records_processed: 3000,
    records_failed: 5
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source1.id,
    started_at: day(4).toISOString(),
    finished_at: new Date(day(4).getTime() + 55 * 60000).toISOString(),
    duration_minutes: 55,
    duration_ms: 55 * 60000,
    status: "completed",
    records_processed: 5000,
    records_failed: 10
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source1.id,
    started_at: day(2).toISOString(),
    finished_at: new Date(day(2).getTime() + 61 * 60000).toISOString(),
    duration_minutes: 61,
    duration_ms: 61 * 60000,
    status: "completed",
    records_processed: 6420,
    records_failed: 2
  });

  // Event Stream Topic - mostly in_progress and completed
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source2.id,
    started_at: day(3).toISOString(),
    finished_at: new Date(day(3).getTime() + 130 * 60000).toISOString(),
    duration_minutes: 130,
    duration_ms: 130 * 60000,
    status: "completed",
    records_processed: 400000,
    records_failed: 20
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source2.id,
    started_at: day(1).toISOString(),
    finished_at: new Date(day(1).getTime() + 140 * 60000).toISOString(),
    duration_minutes: 140,
    duration_ms: 140 * 60000,
    status: "completed",
    records_processed: 500000,
    records_failed: 30
  });
  // Add an active run for current day
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source2.id,
    started_at: today.toISOString(),
    status: "in_progress",
    duration_ms: 0,
    records_processed: 0,
    records_failed: 0
  });

  // Q3 Sales CSV - shorter runs with an alert
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source3.id,
    started_at: day(4).toISOString(),
    finished_at: new Date(day(4).getTime() + 25 * 60000).toISOString(),
    duration_minutes: 25,
    duration_ms: 25 * 60000,
    status: "completed",
    records_processed: 2500,
    records_failed: 12,
    issue_ids: []
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source3.id,
    started_at: day(2).toISOString(),
    finished_at: new Date(day(2).getTime() + 15 * 60000).toISOString(),
    duration_minutes: 15,
    duration_ms: 15 * 60000,
    status: "stopped",
    records_processed: 2500,
    records_failed: 30,
    issue_ids: []
  });

  // Customer Survey Data - paused run
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source4.id,
    started_at: day(1).toISOString(),
    finished_at: new Date(day(1).getTime() + 45 * 60000).toISOString(),
    duration_minutes: 45,
    duration_ms: 45 * 60000,
    status: "stopped", // Paused is effectively stopped in run history
    records_processed: 1200,
    records_failed: 5
  });

  // 4. Create Issues
  const issue1 = await dataAgent.entities.Issue.create({
    title: "Null values in Email field",
    description: "Significant number of records coming from CRM have null email addresses despite it being a required field.",
    status: "open",
    severity: "high",
    issue_type: "completeness",
    project: project1.name,
    dataset: dataset1.name,
    file: "SFDC Contacts API",
    assigned_to: "Mike Ross",
    created_date: timestamp,
    tags: ["data-quality", "critical"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue1.id,
    column_name: "email_address",
    table_name: "sfdc_contacts",
    schema_name: "raw",
    records_affected: 450,
    data_type: "VARCHAR(255)"
  });

  const issue2 = await dataAgent.entities.Issue.create({
    title: "Duplicate Event IDs",
    description: "Found duplicate event IDs in the clickstream data causing inaccurate session counts.",
    status: "in_progress",
    severity: "medium",
    issue_type: "uniqueness",
    project: project1.name,
    dataset: dataset2.name,
    file: "Event Stream Topic",
    assigned_to: "Sarah Chen",
    created_date: timestamp,
    tags: ["deduplication"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue2.id,
    column_name: "event_id",
    table_name: "clickstream",
    schema_name: "events",
    records_affected: 120,
    data_type: "UUID"
  });

  const issue3 = await dataAgent.entities.Issue.create({
    title: "Currency Mismatch in Sales Data",
    description: "Q3 Sales CSV contains mixed currency symbols (USD and EUR) in the amount column, causing aggregation errors.",
    status: "open",
    severity: "critical",
    issue_type: "consistency",
    project: project2.name,
    dataset: dataset3.name,
    file: "Q3 Sales CSV",
    assigned_to: "Lisa Wang",
    created_date: timestamp,
    tags: ["finance", "formatting"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue3.id,
    column_name: "amount",
    table_name: "quarterly_sales",
    schema_name: "finance",
    records_affected: 42,
    data_type: "DECIMAL(10,2)"
  });

  // 5. Create more comprehensive Vault Solutions
  // Clear existing Vault Solutions first to prevent duplicates
  const existingSolutions = await dataAgent.entities.VaultSolution.list();
  for (const sol of existingSolutions) {
    await dataAgent.entities.VaultSolution.delete(sol.id);
  }

  await dataAgent.entities.VaultSolution.create({
    title: "Standard Email Validation & Normalization",
    description: "Robust SQL pattern to validate email format, handle nulls, and normalize to lowercase.",
    category: "Data Quality",
    tags: ["sql", "email", "validation", "normalization"],
    code_snippet: `
/* 
 * Standard Email Cleaning Pattern
 * 1. Coalesces NULLs to a placeholder
 * 2. Trims whitespace
 * 3. Converts to lowercase
 * 4. Validates format using regex
 */

SELECT 
    id,
    CASE 
        WHEN email IS NULL OR TRIM(email) = '' THEN 'unknown@example.com'
        WHEN email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'invalid_format'
        ELSE LOWER(TRIM(email)) 
    END AS clean_email,
    original_email_column
FROM 
    source_table
WHERE 
    batch_date = CURRENT_DATE();
    `.trim(),
    language: "sql",
    usage_count: 15,
    author: "System",
    created_date: timestamp
  });

  await dataAgent.entities.VaultSolution.create({
    title: "PySpark Deduplication with Window Functions",
    description: "Remove duplicate records while keeping the most recent entry based on timestamp.",
    category: "Transformation",
    tags: ["python", "pyspark", "dedup", "window-functions"],
    code_snippet: `
from pyspark.sql.window import Window
from pyspark.sql.functions import col, row_number

def deduplicate_dataframe(df, key_columns, timestamp_col):
    """
    Deduplicates a DataFrame keeping the latest record.
    
    Args:
        df: Input DataFrame
        key_columns: List of columns to identify duplicates
        timestamp_col: Column to determine latest record
    """
    
    # Define window spec to partition by keys and order by time desc
    window_spec = Window \\
        .partitionBy([col(c) for c in key_columns]) \\
        .orderBy(col(timestamp_col).desc())
        
    # Add row number and filter
    return df \\
        .withColumn("rn", row_number().over(window_spec)) \\
        .filter(col("rn") == 1) \\
        .drop("rn")

# Usage example:
# clean_df = deduplicate_dataframe(raw_df, ["user_id", "session_id"], "event_time")
    `.trim(),
    language: "python",
    usage_count: 8,
    author: "System",
    created_date: timestamp
  });

  await dataAgent.entities.VaultSolution.create({
    title: "Smart PII Masking Utility",
    description: "Configurable Python function to mask sensitive PII data while preserving some context.",
    category: "Compliance",
    tags: ["python", "gdpr", "privacy", "security"],
    code_snippet: `
def mask_pii(text, visible_chars=2, mask_char='*'):
    """
    Masks string data for PII compliance.
    
    Example: 
    mask_pii("john.doe@example.com") -> "jo******************om"
    """
    if not text or not isinstance(text, str):
        return text
        
    # If text is too short, mask everything
    if len(text) <= visible_chars * 2:
        return mask_char * len(text)
        
    # Keep first N and last N characters visible
    prefix = text[:visible_chars]
    suffix = text[-visible_chars:]
    mask_length = len(text) - (visible_chars * 2)
    
    return f"{prefix}{mask_char * mask_length}{suffix}"

# Apply to pandas DataFrame
# df['email_masked'] = df['email'].apply(mask_pii)
    `.trim(),
    language: "python",
    usage_count: 12,
    author: "System",
    created_date: timestamp
  });

  await dataAgent.entities.VaultSolution.create({
    title: "Universal Date Normalization (SQL)",
    description: "Safely casts various string date formats to a standard DATE type, handling errors gracefully.",
    category: "Data Quality",
    tags: ["sql", "dates", "casting", "snowflake"],
    code_snippet: `
/*
 * Safe Date Conversion
 * Handles: 'YYYY-MM-DD', 'MM/DD/YYYY', and NULLs
 * Returns: Standard ISO Date or NULL for errors
 */

SELECT 
    transaction_id,
    raw_date_string,
    COALESCE(
        TRY_TO_DATE(raw_date_string, 'YYYY-MM-DD'),
        TRY_TO_DATE(raw_date_string, 'MM/DD/YYYY'),
        TRY_TO_DATE(raw_date_string, 'DD-MON-YYYY')
    ) AS normalized_date,
    CASE 
        WHEN raw_date_string IS NOT NULL 
             AND normalized_date IS NULL 
        THEN 'PARSE_ERROR' 
        ELSE 'VALID' 
    END AS validation_status
FROM 
    transactions_staging;
    `.trim(),
    language: "sql",
    usage_count: 23,
    author: "System",
    created_date: timestamp
  });

  await dataAgent.entities.VaultSolution.create({
    title: "Statistical Outlier Detection (IQR)",
    description: "Pandas-based function to detect and filter statistical outliers using the Interquartile Range.",
    category: "Data Quality",
    tags: ["python", "pandas", "statistics", "outliers"],
    code_snippet: `
import pandas as pd

def remove_outliers_iqr(df, column, multiplier=1.5):
    """
    Removes outliers from a dataframe column using IQR method.
    
    Args:
        df: Pandas DataFrame
        column: Column name to check
        multiplier: IQR multiplier (default 1.5, use 3.0 for extreme outliers)
    """
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    
    lower_bound = Q1 - (multiplier * IQR)
    upper_bound = Q3 + (multiplier * IQR)
    
    # Filter data
    filtered_df = df[
        (df[column] >= lower_bound) & 
        (df[column] <= upper_bound)
    ]
    
    outliers_removed = len(df) - len(filtered_df)
    print(f"Removed {outliers_removed} outliers from {column}")
    
    return filtered_df
    `.trim(),
    language: "python",
    usage_count: 9,
    author: "System",
    created_date: timestamp
  });

  await dataAgent.entities.VaultSolution.create({
    title: "Dynamic Schema Validator",
    description: "Python utility to validate DataFrame schema against a dictionary of expected types.",
    category: "Data Quality",
    tags: ["python", "validation", "schema", "quality-control"],
    code_snippet: `
def validate_schema(df, expected_schema):
    """
    Validates that a DataFrame contains expected columns and types.
    
    expected_schema = {
        'user_id': 'int64',
        'email': 'object',
        'signup_date': 'datetime64[ns]'
    }
    """
    errors = []
    
    for col, expected_type in expected_schema.items():
        # Check if column exists
        if col not in df.columns:
            errors.append(f"Missing column: {col}")
            continue
            
        # Check data type (simplified)
        actual_type = str(df[col].dtype)
        if expected_type not in actual_type:
            errors.append(
                f"Type mismatch for {col}: "
                f"expected {expected_type}, got {actual_type}"
            )
            
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }
    `.trim(),
    language: "python",
    usage_count: 18,
    author: "System",
    created_date: timestamp
  });

  await dataAgent.entities.VaultSolution.create({
    title: "Safe Numeric Conversion & Cleanup",
    description: "SQL pattern to safely convert dirty currency strings to decimal values.",
    category: "Transformation",
    tags: ["sql", "cleaning", "conversion", "finance"],
    code_snippet: `
/*
 * Cleans and converts currency strings
 * Handles: '$1,234.56', 'USD 500', '(200.00)'
 */

SELECT 
    raw_amount,
    CAST(
        REGEXP_REPLACE(
            REPLACE(
                REPLACE(raw_amount, '$', ''), 
                ',', ''
            ), 
            '[^0-9.-]', ''
        ) AS DECIMAL(18, 2)
    ) AS clean_amount
FROM 
    financial_records
WHERE 
    -- Filter out empty or non-numeric looking strings
    raw_amount IS NOT NULL 
    AND raw_amount REGEXP '[0-9]';
    `.trim(),
    language: "sql",
    usage_count: 14,
    author: "System",
    created_date: timestamp
  });

  // 6. Create additional Datasets for more complete project simulation
  const dataset4 = await dataAgent.entities.Dataset.create({
    name: "Product Catalog",
    description: "Master product information from ERP system",
    project_id: project1.id,
    project: project1.name,
    source_system: "SAP",
    type: "database",
    refresh_frequency: "daily",
    contains_pii: false,
    data_retention: "5 years",
    data_steward: "Mike Ross",
    data_owner: "Sarah Chen",
    tags: ["master", "catalog", "erp"],
    solution: ["Product Recommendations"]
  });

  const dataset5 = await dataAgent.entities.Dataset.create({
    name: "Payment Transactions",
    description: "Financial transaction records for compliance",
    project_id: project2.id,
    project: project2.name,
    source_system: "Stripe",
    type: "api",
    refresh_frequency: "real-time",
    contains_pii: true,
    data_retention: "7 years",
    data_steward: "Lisa Wang",
    data_owner: "Alex Thompson",
    tags: ["finance", "transactions", "compliance"],
    solution: ["Fraud Detection", "Revenue Analytics"]
  });

  // 7. Create additional Data Sources
  const source5 = await dataAgent.entities.DataSource.create({
    name: "SAP Product API",
    dataset_id: dataset4.id,
    dataset: dataset4.name,
    project: project1.name,
    type: "api",
    source_location: "/sap/opu/odata/sap/product_srv",
    target_location: "warehouse.master.product_catalog",
    status: "completed",
    phase: "processed",
    records_processed: 85000,
    records_failed: 5,
    quality_score: 99,
    daily_processing_duration: {
      [day(6).toISOString().slice(0,10)]: 18 * 60000,
      [day(5).toISOString().slice(0,10)]: 22 * 60000,
      [day(4).toISOString().slice(0,10)]: 15 * 60000,
      [day(3).toISOString().slice(0,10)]: 20 * 60000,
      [day(2).toISOString().slice(0,10)]: 19 * 60000,
      [day(1).toISOString().slice(0,10)]: 17 * 60000
    },
    total_processing_duration: (18 + 22 + 15 + 20 + 19 + 17) * 60000,
    last_run_date: day(1).toISOString()
  });

  const source6 = await dataAgent.entities.DataSource.create({
    name: "Stripe Payments API",
    dataset_id: dataset5.id,
    dataset: dataset5.name,
    project: project2.name,
    type: "api",
    source_location: "/v1/payments",
    target_location: "warehouse.finance.payments",
    status: "in_progress",
    phase: "data_quality",
    records_processed: 12500,
    records_failed: 8,
    quality_score: 94,
    daily_processing_duration: {
      [day(6).toISOString().slice(0,10)]: 45 * 60000,
      [day(5).toISOString().slice(0,10)]: 38 * 60000,
      [day(4).toISOString().slice(0,10)]: 52 * 60000,
      [day(3).toISOString().slice(0,10)]: 41 * 60000,
      [day(2).toISOString().slice(0,10)]: 49 * 60000,
      [day(1).toISOString().slice(0,10)]: 55 * 60000
    },
    total_processing_duration: (45 + 38 + 52 + 41 + 49 + 55) * 60000,
    last_run_date: day(1).toISOString()
  });

  // 7a. Create mock ProcessingRun history for additional sources
  // SAP Product API - completed runs
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source5.id,
    started_at: day(6).toISOString(),
    finished_at: new Date(day(6).getTime() + 18 * 60000).toISOString(),
    duration_minutes: 18,
    status: "completed",
    records_processed: 14000,
    records_failed: 1
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source5.id,
    started_at: day(4).toISOString(),
    finished_at: new Date(day(4).getTime() + 15 * 60000).toISOString(),
    duration_minutes: 15,
    status: "completed",
    records_processed: 15000,
    records_failed: 0
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source5.id,
    started_at: day(2).toISOString(),
    finished_at: new Date(day(2).getTime() + 19 * 60000).toISOString(),
    duration_minutes: 19,
    status: "completed",
    records_processed: 18000,
    records_failed: 1
  });

  // Stripe Payments API - ongoing runs
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source6.id,
    started_at: day(6).toISOString(),
    finished_at: new Date(day(6).getTime() + 45 * 60000).toISOString(),
    duration_minutes: 45,
    status: "completed",
    records_processed: 2000,
    records_failed: 2
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source6.id,
    started_at: day(4).toISOString(),
    finished_at: new Date(day(4).getTime() + 52 * 60000).toISOString(),
    duration_minutes: 52,
    status: "completed",
    records_processed: 2100,
    records_failed: 1
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source6.id,
    started_at: day(2).toISOString(),
    finished_at: new Date(day(2).getTime() + 49 * 60000).toISOString(),
    duration_minutes: 49,
    status: "completed",
    records_processed: 2050,
    records_failed: 2
  });

  // 8. Create additional Data Sources with mock schemas for Whisper testing
  const source7 = await dataAgent.entities.DataSource.create({
    name: "User Analytics Table",
    dataset_id: dataset2.id,
    dataset: dataset2.name,
    project: project1.name,
    type: "database",
    source_location: "analytics.users",
    target_location: "warehouse.analytics.users",
    status: "completed",
    phase: "processed",
    records_processed: 50000,
    records_failed: 2,
    quality_score: 97,
    schema: JSON.stringify({
      columns: [
        { name: "user_id", type: "INTEGER", nullable: false },
        { name: "email", type: "VARCHAR(255)", nullable: false },
        { name: "first_name", type: "VARCHAR(100)", nullable: true },
        { name: "last_name", type: "VARCHAR(100)", nullable: true },
        { name: "date_of_birth", type: "DATE", nullable: true },
        { name: "signup_date", type: "TIMESTAMP", nullable: false },
        { name: "last_login", type: "TIMESTAMP", nullable: true },
        { name: "account_status", type: "VARCHAR(20)", nullable: false, default: "active" },
        { name: "country", type: "VARCHAR(50)", nullable: true },
        { name: "city", type: "VARCHAR(100)", nullable: true }
      ]
    }),
    daily_processing_duration: {
      [day(6).toISOString().slice(0,10)]: 25,
      [day(5).toISOString().slice(0,10)]: 30,
      [day(4).toISOString().slice(0,10)]: 22,
      [day(3).toISOString().slice(0,10)]: 28,
      [day(2).toISOString().slice(0,10)]: 35,
      [day(1).toISOString().slice(0,10)]: 27
    },
    total_processing_duration: 25 + 30 + 22 + 28 + 35 + 27,
    last_run_date: day(1).toISOString(),
    row_count: 50000,
    column_count: 10
  });

  const source8 = await dataAgent.entities.DataSource.create({
    name: "Order Transactions",
    dataset_id: dataset5.id,
    dataset: dataset5.name,
    project: project2.name,
    type: "database",
    source_location: "finance.orders",
    target_location: "warehouse.finance.orders",
    status: "completed",
    phase: "processed",
    records_processed: 25000,
    records_failed: 1,
    quality_score: 96,
    schema: JSON.stringify({
      columns: [
        { name: "order_id", type: "INTEGER", nullable: false },
        { name: "customer_id", type: "INTEGER", nullable: false },
        { name: "product_id", type: "INTEGER", nullable: false },
        { name: "order_date", type: "TIMESTAMP", nullable: false },
        { name: "amount", type: "DECIMAL(10,2)", nullable: false },
        { name: "currency", type: "VARCHAR(3)", nullable: false },
        { name: "status", type: "VARCHAR(20)", nullable: false },
        { name: "payment_method", type: "VARCHAR(50)", nullable: true },
        { name: "shipping_address", type: "TEXT", nullable: true },
        { name: "tax_amount", type: "DECIMAL(10,2)", nullable: true },
        { name: "discount_amount", type: "DECIMAL(10,2)", nullable: true }
      ]
    }),
    daily_processing_duration: {
      [day(6).toISOString().slice(0,10)]: 32,
      [day(5).toISOString().slice(0,10)]: 28,
      [day(4).toISOString().slice(0,10)]: 35,
      [day(3).toISOString().slice(0,10)]: 30,
      [day(2).toISOString().slice(0,10)]: 29,
      [day(1).toISOString().slice(0,10)]: 31
    },
    total_processing_duration: 32 + 28 + 35 + 30 + 29 + 31,
    last_run_date: day(1).toISOString(),
    row_count: 25000,
    column_count: 11
  });

  // 8a. Create mock ProcessingRun history for schema sources
  // User Analytics - completed runs
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source7.id,
    started_at: day(6).toISOString(),
    finished_at: new Date(day(6).getTime() + 25 * 60000).toISOString(),
    duration_minutes: 25,
    status: "completed",
    records_processed: 8000,
    records_failed: 0
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source7.id,
    started_at: day(4).toISOString(),
    finished_at: new Date(day(4).getTime() + 22 * 60000).toISOString(),
    duration_minutes: 22,
    status: "completed",
    records_processed: 9000,
    records_failed: 1
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source7.id,
    started_at: day(2).toISOString(),
    finished_at: new Date(day(2).getTime() + 35 * 60000).toISOString(),
    duration_minutes: 35,
    status: "completed",
    records_processed: 12000,
    records_failed: 1
  });

  // Order Transactions - completed runs
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source8.id,
    started_at: day(6).toISOString(),
    finished_at: new Date(day(6).getTime() + 32 * 60000).toISOString(),
    duration_minutes: 32,
    status: "completed",
    records_processed: 4000,
    records_failed: 0
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source8.id,
    started_at: day(4).toISOString(),
    finished_at: new Date(day(4).getTime() + 35 * 60000).toISOString(),
    duration_minutes: 35,
    status: "completed",
    records_processed: 4500,
    records_failed: 0
  });
  await dataAgent.entities.ProcessingRun.create({
    data_source_id: source8.id,
    started_at: day(2).toISOString(),
    finished_at: new Date(day(2).getTime() + 29 * 60000).toISOString(),
    duration_minutes: 29,
    status: "completed",
    records_processed: 5000,
    records_failed: 1
  });

  // 9. Create additional Issues for schema-based testing
  const issue4 = await dataAgent.entities.Issue.create({
    title: "Product Name Encoding Issue",
    description: "Product names contain special characters that cause downstream processing failures.",
    status: "open",
    severity: "medium",
    issue_type: "encoding",
    project: project1.name,
    dataset: dataset4.name,
    file: "SAP Product API",
    assigned_to: "Mike Ross",
    created_date: timestamp,
    tags: ["encoding", "special-chars"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue4.id,
    column_name: "product_name",
    table_name: "product_catalog",
    schema_name: "master",
    records_affected: 23,
    data_type: "VARCHAR(500)"
  });

  const issue5 = await dataAgent.entities.Issue.create({
    title: "Payment Amount Format Inconsistency",
    description: "Payment amounts from Stripe API have inconsistent decimal formatting.",
    status: "in_progress",
    severity: "high",
    issue_type: "formatting",
    project: project2.name,
    dataset: dataset5.name,
    file: "Stripe Payments API",
    assigned_to: "Lisa Wang",
    created_date: timestamp,
    tags: ["formatting", "finance"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue5.id,
    column_name: "amount",
    table_name: "payments",
    schema_name: "finance",
    records_affected: 150,
    data_type: "VARCHAR(20)"
  });

  // 10. Create Issues specifically for schema-based sources to test column recommendations
  const issue6 = await dataAgent.entities.Issue.create({
    title: "Email Format Validation Required",
    description: "Email addresses in the users table need format validation and cleaning.",
    status: "open",
    severity: "high",
    issue_type: "validity",
    project: project1.name,
    dataset: dataset2.name,
    data_source_id: source7.id,
    file: "User Analytics Table",
    assigned_to: "Sarah Chen",
    created_date: timestamp,
    tags: ["email", "validation", "format"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue6.id,
    column_name: "email",
    table_name: "users",
    schema_name: "analytics",
    records_affected: 1500,
    data_type: "VARCHAR(255)"
  });

  const issue7 = await dataAgent.entities.Issue.create({
    title: "Missing Required Customer IDs",
    description: "Order transactions contain null customer_id values which are required for analysis.",
    status: "open",
    severity: "critical",
    issue_type: "completeness",
    project: project2.name,
    dataset: dataset5.name,
    data_source_id: source8.id,
    file: "Order Transactions",
    assigned_to: "Lisa Wang",
    created_date: timestamp,
    tags: ["nulls", "required", "completeness"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue7.id,
    column_name: "customer_id",
    table_name: "orders",
    schema_name: "finance",
    records_affected: 45,
    data_type: "INTEGER"
  });

  const issue8 = await dataAgent.entities.Issue.create({
    title: "Negative Amount Values",
    description: "Order transactions contain negative amount values that may indicate refunds or errors.",
    status: "in_progress",
    severity: "medium",
    issue_type: "validity",
    project: project2.name,
    dataset: dataset5.name,
    data_source_id: source8.id,
    file: "Order Transactions",
    assigned_to: "Alex Thompson",
    created_date: timestamp,
    tags: ["validation", "range", "amount"]
  });

  await dataAgent.entities.AffectedColumn.create({
    issue_id: issue8.id,
    column_name: "amount",
    table_name: "orders",
    schema_name: "finance",
    records_affected: 12,
    data_type: "DECIMAL(10,2)"
  });

  return true;
}
