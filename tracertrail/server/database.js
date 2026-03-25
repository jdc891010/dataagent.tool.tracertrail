import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage directory exists
import fs from 'fs';
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const sqlite = sqlite3.verbose();
const dbPath = path.resolve(storageDir, 'tracertrail.db');

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Enable WAL mode for better concurrency
    db.run('PRAGMA journal_mode = WAL;', (err) => {
      if (err) console.error('Failed to enable WAL mode:', err.message);
    });
    initializeSchema();
  }
});

function initializeSchema() {
  db.serialize(() => {
    // Projects
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON
    )`);

    // DataSources
    db.run(`CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT NOT NULL,
      type TEXT,
      status TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    )`);

    // Datasets
    db.run(`CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    )`);

    // Issues
    db.run(`CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      data_source_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT,
      severity TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON,
      FOREIGN KEY(data_source_id) REFERENCES data_sources(id)
    )`);

    // Vault Solutions
    db.run(`CREATE TABLE IF NOT EXISTS vault_solutions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      tags JSON,
      code_snippet TEXT,
      language TEXT,
      usage_count INTEGER,
      author TEXT,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON
    )`);

    // Processing Runs
    db.run(`CREATE TABLE IF NOT EXISTS processing_runs (
      id TEXT PRIMARY KEY,
      data_source_id TEXT,
      status TEXT,
      started_at TEXT,
      finished_at TEXT,
      duration_ms INTEGER,
      records_processed INTEGER,
      records_failed INTEGER,
      created_date TEXT,
      updated_date TEXT,
      metadata JSON,
      FOREIGN KEY(data_source_id) REFERENCES data_sources(id)
    )`);

    // API Keys for external access
    db.run(`CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      permissions JSON,
      rate_limit INTEGER DEFAULT 100,
      is_active INTEGER DEFAULT 1,
      last_used_at TEXT,
      created_date TEXT,
      expires_at TEXT
    )`);

    // Access Tokens
    db.run(`CREATE TABLE IF NOT EXISTS access_tokens (
      id TEXT PRIMARY KEY,
      api_key_id TEXT,
      token_hash TEXT NOT NULL,
      expires_at TEXT,
      created_date TEXT,
      FOREIGN KEY(api_key_id) REFERENCES api_keys(id)
    )`);

    // Settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_date TEXT
    )`);

    // Audit Logs
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      api_key_id TEXT,
      key_name TEXT,
      method TEXT,
      endpoint TEXT,
      status_code INTEGER,
      subject_type TEXT,
      subject_id TEXT,
      client_ip TEXT,
      user_agent TEXT,
      duration_ms INTEGER,
      created_date TEXT
    )`);

    // Create index for faster queries
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_date ON audit_logs(created_date DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_api_key ON audit_logs(api_key_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_subject ON audit_logs(subject_type, subject_id)`);

    seedDefaultSettings();
    seedVaultSolutions();
  });
}

function seedDefaultSettings() {
  const defaultSettings = [
    { key: 'default_rate_limit', value: '100' },
    { key: 'default_token_expiry', value: '3600' },
    { key: 'default_key_expiry', value: '2592000' },
    { key: 'jupyter_url', value: '' },
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO settings (key, value, updated_date) VALUES (?, ?, ?)`);
  defaultSettings.forEach(setting => {
    stmt.run(setting.key, setting.value, new Date().toISOString());
  });
  stmt.finalize();
  console.log('Default settings seeded.');
}

function seedVaultSolutions() {
  db.get("SELECT count(*) as count FROM vault_solutions", (err, row) => {
    if (err) {
      console.error("Error checking vault_solutions count:", err);
      return;
    }
    
    if (row && row.count === 0) {
      console.log("Seeding Vault Solutions...");
      const solutions = [
        {
          id: "sol_email_val",
          title: "Standard Email Validation & Normalization",
          description: "Robust SQL pattern to validate email format, handle nulls, and normalize to lowercase.",
          category: "Data Quality",
          tags: JSON.stringify(["sql", "email", "validation", "normalization"]),
          code_snippet: `/* 
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
    batch_date = CURRENT_DATE();`,
          language: "sql",
          usage_count: 15,
          author: "System",
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          metadata: "{}"
        },
        {
          id: "sol_pyspark_dedup",
          title: "PySpark Deduplication with Window Functions",
          description: "Remove duplicate records while keeping the most recent entry based on timestamp.",
          category: "Transformation",
          tags: JSON.stringify(["python", "pyspark", "dedup", "window-functions"]),
          code_snippet: `from pyspark.sql.window import Window
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
# clean_df = deduplicate_dataframe(raw_df, ["user_id", "session_id"], "event_time")`,
          language: "python",
          usage_count: 8,
          author: "System",
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          metadata: "{}"
        },
        {
          id: "sol_pii_mask",
          title: "Smart PII Masking Utility",
          description: "Configurable Python function to mask sensitive PII data while preserving some context.",
          category: "Compliance",
          tags: JSON.stringify(["python", "gdpr", "privacy", "security"]),
          code_snippet: `def mask_pii(text, visible_chars=2, mask_char='*'):
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
# df['email_masked'] = df['email'].apply(mask_pii)`,
          language: "python",
          usage_count: 12,
          author: "System",
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          metadata: "{}"
        },
        {
          id: "sol_date_norm",
          title: "Universal Date Normalization (SQL)",
          description: "Safely casts various string date formats to a standard DATE type, handling errors gracefully.",
          category: "Data Quality",
          tags: JSON.stringify(["sql", "dates", "casting", "snowflake"]),
          code_snippet: `/*
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
    transactions_staging;`,
          language: "sql",
          usage_count: 23,
          author: "System",
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          metadata: "{}"
        },
        {
          id: "sol_outlier_iqr",
          title: "Statistical Outlier Detection (IQR)",
          description: "Pandas-based function to detect and filter statistical outliers using the Interquartile Range.",
          category: "Data Quality",
          tags: JSON.stringify(["python", "pandas", "statistics", "outliers"]),
          code_snippet: `import pandas as pd

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
    
    return filtered_df`,
          language: "python",
          usage_count: 9,
          author: "System",
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          metadata: "{}"
        },
        {
          id: "sol_schema_val",
          title: "Dynamic Schema Validator",
          description: "Python utility to validate DataFrame schema against a dictionary of expected types.",
          category: "Data Quality",
          tags: JSON.stringify(["python", "validation", "schema", "quality-control"]),
          code_snippet: `def validate_schema(df, expected_schema):
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
    }`,
          language: "python",
          usage_count: 18,
          author: "System",
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          metadata: "{}"
        },
        {
          id: "sol_numeric_clean",
          title: "Safe Numeric Conversion & Cleanup",
          description: "SQL pattern to safely convert dirty currency strings to decimal values.",
          category: "Transformation",
          tags: JSON.stringify(["sql", "cleaning", "conversion", "finance"]),
          code_snippet: `/*
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
    AND raw_amount REGEXP '[0-9]';`,
          language: "sql",
          usage_count: 14,
          author: "System",
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          metadata: "{}"
        }
      ];

      const stmt = db.prepare(`INSERT INTO vault_solutions (id, title, description, category, tags, code_snippet, language, usage_count, author, created_date, updated_date, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      solutions.forEach(sol => {
        stmt.run(
          sol.id, sol.title, sol.description, sol.category, sol.tags,
          sol.code_snippet, sol.language, sol.usage_count, sol.author,
          sol.created_date, sol.updated_date, sol.metadata
        );
      });
      
      stmt.finalize();
      console.log(`Seeded ${solutions.length} Vault Solutions.`);
    }
  });
}

import crypto from 'crypto';

export function generateApiKey() {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
}

export function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function generateToken() {
  return 'tt_' + crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getSetting(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.value : null);
    });
  });
}

export function setSetting(key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO settings (key, value, updated_date) VALUES (?, ?, ?)',
      [key, value, new Date().toISOString()],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

export function getAllSettings() {
  return new Promise((resolve, reject) => {
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
      if (err) reject(err);
      else {
        const settings = {};
        rows.forEach(row => { settings[row.key] = row.value; });
        resolve(settings);
      }
    });
  });
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function createAuditLog(logData) {
  return new Promise((resolve, reject) => {
    const { api_key_id, key_name, method, endpoint, status_code, subject_type, subject_id, client_ip, user_agent, duration_ms } = logData;
    const id = generateId();
    const created_date = new Date().toISOString();
    
    db.run(
      `INSERT INTO audit_logs (id, api_key_id, key_name, method, endpoint, status_code, subject_type, subject_id, client_ip, user_agent, duration_ms, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, api_key_id, key_name, method, endpoint, status_code, subject_type, subject_id, client_ip, user_agent, duration_ms, created_date],
      function(err) {
        if (err) reject(err);
        else resolve(id);
      }
    );
  });
}

export function getAuditLogs(filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (filters.api_key_id) {
      sql += ' AND api_key_id = ?';
      params.push(filters.api_key_id);
    }
    if (filters.subject_type) {
      sql += ' AND subject_type = ?';
      params.push(filters.subject_type);
    }
    if (filters.method) {
      sql += ' AND method = ?';
      params.push(filters.method);
    }
    if (filters.status_code) {
      sql += ' AND status_code = ?';
      params.push(filters.status_code);
    }
    if (filters.from_date) {
      sql += ' AND created_date >= ?';
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      sql += ' AND created_date <= ?';
      params.push(filters.to_date);
    }
    
    sql += ' ORDER BY created_date DESC';
    
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }
    
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export default db;
