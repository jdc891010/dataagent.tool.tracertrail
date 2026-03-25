
// Local Data Store implementation replacing the Cloud SDK
const STORAGE_PREFIX = 'dataagent_local_';

class LocalEntity {
  constructor(name) {
    this.name = name;
    this.storageKey = `${STORAGE_PREFIX}${name}`;
  }

  _getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${this.name} from local storage`, e);
      return [];
    }
  }

  _saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${this.name} to local storage`, e);
    }
  }

  async list(sort = null, limit = null) {
    let data = this._getData();
    // Simple sort support (descending only for now if starts with -)
    if (sort && sort.startsWith('-')) {
      const field = sort.substring(1);
      data.sort((a, b) => (b[field] > a[field] ? 1 : -1));
    }
    if (limit) {
      data = data.slice(0, limit);
    }
    return data;
  }

  async filter(criteria, sort = null) {
    let data = this._getData();
    data = data.filter(item => {
      return Object.entries(criteria).every(([key, value]) => {
        if (Array.isArray(value)) return value.includes(item[key]);
        return item[key] === value;
      });
    });
    
    if (sort && sort.startsWith('-')) {
      const field = sort.substring(1);
      data.sort((a, b) => (b[field] > a[field] ? 1 : -1));
    }
    return data;
  }

  async create(data) {
    const items = this._getData();
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    this._saveData(items);
    return newItem;
  }

  async update(id, updates) {
    const items = this._getData();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Not found');
    
    let updatedItem = { ...items[index] };

    // Handle metadata merging if present in updates
    if (updates.metadata && updatedItem.metadata) {
      // Merge metadata instead of overwriting
      const mergedMetadata = { ...updatedItem.metadata, ...updates.metadata };
      updates = { ...updates, metadata: mergedMetadata };
    }
    
    items[index] = { 
      ...updatedItem, 
      ...updates, 
      updated_date: new Date().toISOString() 
    };
    this._saveData(items);
    return items[index];
  }

  async delete(id) {
    const items = this._getData();
    const filtered = items.filter(i => i.id !== id);
    this._saveData(filtered);
    return { success: true };
  }
}

const entities = {
  Issue: new LocalEntity('Issue'),
  AffectedColumn: new LocalEntity('AffectedColumn'),
  CodeSnippet: new LocalEntity('CodeSnippet'),
  Project: new LocalEntity('Project'),
  Dataset: new LocalEntity('Dataset'),
  DataSource: new LocalEntity('DataSource'),
  ProcessingRun: new LocalEntity('ProcessingRun'),
  DataFlow: new LocalEntity('DataFlow'),
  IssueComment: new LocalEntity('IssueComment'),
  IssueTest: new LocalEntity('IssueTest'),
  VaultSolution: new LocalEntity('VaultSolution'),
  ProjectSettings: new LocalEntity('ProjectSettings'),
  AppSettings: new LocalEntity('AppSettings'),
  AuditLog: new LocalEntity('AuditLog'),
  DataQualityCheck: new LocalEntity('DataQualityCheck'),
  User: new LocalEntity('User'),
};

/*
// Seed initial data if empty
const seedData = async () => {
  if (entities.Project._getData().length === 0) {
    // Populate complete sample data on first initialization
    try {
      const { populateSampleData } = await import('@/utils/sampleDataGenerator');
      await populateSampleData();
    } catch (e) {
      console.error("Failed to seed data", e);
    }
  }
};
seedData();
*/

export const localDataStore = {
  entities: entities,
  auth: {
    me: async () => ({ 
      email: 'local@dataagent.dev', 
      id: 'local-user', 
      name: 'Local Dev' 
    }),
    login: async () => ({ success: true }),
    logout: async () => ({ success: true }),
    list: async () => ([{ email: 'local@dataagent.dev', id: 'local-user', name: 'Local Dev' }])
  },
  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        // Log the attempt
        try {
          await entities.AuditLog.create({
            event_type: 'llm_invoke',
            entity_type: 'integration',
            entity_name: 'DeepSeek',
            action_by: 'system',
            description: 'Invoking DeepSeek LLM',
            metadata: { prompt_length: params.prompt?.length }
          });
        } catch (logError) {
          console.error("Failed to create audit log:", logError);
        }

        let apiKey = params.apiKey;
        
        if (!apiKey) {
          const settings = await entities.AppSettings.filter({ setting_key: 'deepseek_api_key' });
          apiKey = settings[0]?.deepseek_api_key;
        }

        if (apiKey) {
          try {
            // Use local proxy to avoid CORS issues
            const response = await fetch("/deepseek-proxy/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                  { role: "system", content: "You are a helpful data quality assistant. Always respond with valid JSON." },
                  { role: "user", content: params.prompt }
                ],
                stream: false
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("DeepSeek API Error:", errorText);
              
              await entities.AuditLog.create({
                event_type: 'llm_error',
                entity_type: 'integration',
                entity_name: 'DeepSeek',
                action_by: 'system',
                description: 'DeepSeek API call failed',
                metadata: { status: response.status, error: errorText }
              });

              // Return detailed error for UI
              throw new Error(`DeepSeek API failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
            }

            const data = await response.json();
            
            await entities.AuditLog.create({
              event_type: 'llm_success',
              entity_type: 'integration',
              entity_name: 'DeepSeek',
              action_by: 'system',
              description: 'DeepSeek API call successful',
              metadata: { 
                model: data.model, 
                tokens: data.usage?.total_tokens 
              }
            });

            return { result: data.choices[0].message.content };
          } catch (e) {
            console.error("LLM Call Failed:", e);
            
            await entities.AuditLog.create({
              event_type: 'llm_exception',
              entity_type: 'integration',
              entity_name: 'DeepSeek',
              action_by: 'system',
              description: 'Exception during DeepSeek API call',
              metadata: { error: e.message }
            });
            
            throw e;
          }
        }
        
        console.log("No API key found, using mock LLM response");
        
        await entities.AuditLog.create({
          event_type: 'llm_mock',
          entity_type: 'integration',
          entity_name: 'LocalMock',
          action_by: 'system',
          description: 'Using mock LLM response (no API key)',
          metadata: {}
        });

        return { result: "This is a mock LLM response from the local environment." };
      },
      SendEmail: async () => ({ success: true }),
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          return await response.json();
        } catch (e) {
          console.error("Upload failed:", e);
          throw e;
        }
      },
      GenerateImage: async () => ({ image_url: "https://placehold.co/600x400?text=Mock+Image" }),
      ExtractDataFromUploadedFile: async () => ({ data: [] }),
      CreateFileSignedUrl: async () => ({ url: "#" }),
      UploadPrivateFile: async () => ({ file_url: "#" })
    }
  },
  functions: {
    ensureBasicChecks: async ({ data_source_id, source: providedSource }) => {
      // Check if basic checks already exist
      const existingBasicChecks = await entities.DataQualityCheck.filter({
        data_source_id,
        check_type: 'basic'
      });
      if (existingBasicChecks.length > 0) {
        return { success: true, count: 0 };
      }

      let source = providedSource;
      if (!source) {
        const sources = await entities.DataSource.filter({ id: data_source_id });
        source = sources[0];
      }
      if (!source) return { success: false, error: "Source not found" };

      // Patch: Ensure schema exists for sample data sources if missing (backward compatibility)
      if (!source.schema) {
        if (source.name === "SFDC Contacts API") {
          source.schema = {
            columns: [
              { name: "id", type: "string", nullable: false },
              { name: "email", type: "string", nullable: true },
              { name: "first_name", type: "string", nullable: true },
              { name: "last_name", type: "string", nullable: true },
              { name: "phone", type: "string", nullable: true },
              { name: "created_date", type: "timestamp", nullable: false },
              { name: "last_modified", type: "timestamp", nullable: false }
            ]
          };
        } else if (source.name === "Event Stream Topic") {
          source.schema = {
            columns: [
              { name: "event_id", type: "string", nullable: false },
              { name: "session_id", type: "string", nullable: false },
              { name: "user_id", type: "string", nullable: true },
              { name: "event_type", type: "string", nullable: false },
              { name: "url", type: "string", nullable: true },
              { name: "timestamp", type: "timestamp", nullable: false },
              { name: "properties", type: "string", nullable: true }
            ]
          };
        } else if (source.name === "Q3 Sales CSV") {
          source.schema = {
            columns: [
              { name: "transaction_id", type: "string", nullable: false },
              { name: "customer_id", type: "string", nullable: false },
              { name: "product_id", type: "string", nullable: false },
              { name: "amount", type: "decimal", nullable: false },
              { name: "currency", type: "string", nullable: false },
              { name: "sale_date", type: "date", nullable: false },
              { name: "region", type: "string", nullable: true }
            ]
          };
        }
        
        // Persist the patched schema
        if (source.schema) {
            try {
                await entities.DataSource.update(source.id, { schema: source.schema });
            } catch (e) {
                console.warn("Failed to persist patched schema", e);
            }
        }
      }

      const timestamp = new Date().toISOString();
      const checks = [];

      // 1. Table Emptiness Check (Table Level)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'completeness',
        check_name: 'Table Emptiness Check',
        description: 'Ensure the table is not empty and contains records.',
        status: 'passed',
        severity: 'critical',
        created_date: timestamp,
        sql_check: `SELECT COUNT(*) as row_count \nFROM ${source.target_location || 'source_table'};\n-- FAIL if row_count = 0`,
        python_check: `def validate_table_not_empty(df):\n    return len(df) > 0`,
        pyspark_check: `def validate_table_not_empty_spark(df):\n    return df.count() > 0`
      });

      // 2. Row Count Validation (Table Level)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'completeness',
        check_name: 'Row Count Validation',
        description: 'Ensure row count is within expected range and matches metadata.',
        status: 'passed',
        severity: 'high',
        created_date: timestamp,
        sql_check: `SELECT COUNT(*) as row_count \nFROM ${source.target_location || 'source_table'}\nWHERE ingestion_date = CURRENT_DATE;`,
        python_check: `def validate_row_count(df, expected_count):\n    actual_count = len(df)\n    deviation = abs(actual_count - expected_count) / expected_count\n    return deviation < 0.10  # Pass if within 10%`,
        pyspark_check: `def validate_row_count_spark(df, expected_count):\n    actual_count = df.count()\n    deviation = abs(actual_count - expected_count) / expected_count\n    return deviation < 0.10`
      });

      // 2. Column Count Validation (Table Level)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'schema',
        check_name: 'Column Count Validation',
        description: 'Verify the number of columns matches the expected schema.',
        status: 'passed',
        severity: 'high',
        created_date: timestamp,
        sql_check: `SELECT COUNT(*) as column_count\nFROM information_schema.columns\nWHERE table_name = '${source.target_location || 'source_table'}';`,
        python_check: `def validate_column_count(df, expected_count):\n    actual_count = len(df.columns)\n    return actual_count == expected_count`,
        pyspark_check: `def validate_column_count_spark(df, expected_count):\n    actual_count = len(df.columns)\n    return actual_count == expected_count`
      });

      // 3. Schema Validation (Table Level)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'schema',
        check_name: 'Schema Validation',
        description: 'Verify column names, data types, and order match the defined schema.',
        status: 'passed',
        severity: 'critical',
        created_date: timestamp,
        sql_check: `SELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = '${source.target_location || 'source_table'}'\nORDER BY ordinal_position;`,
        python_check: `def validate_schema(df, expected_schema):\n    # expected_schema is dict {col: type}\n    for col, dtype in expected_schema.items():\n        if col not in df.columns:\n            return False\n        if df[col].dtype != dtype:\n            return False\n    return True`,
        pyspark_check: `def validate_schema_spark(df, expected_schema):\n    # expected_schema is dict {col: type}\n    actual_cols = df.columns\n    for col, dtype in expected_schema.items():\n        if col not in actual_cols:\n            return False\n    return True`
      });

      // 4. Null Value Check (Row Level)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'consistency',
        check_name: 'Critical Column Null Check',
        description: 'Ensure critical identifier columns do not contain NULL values.',
        status: 'passed',
        severity: 'high',
        created_date: timestamp,
        sql_check: `SELECT COUNT(*) as null_count\nFROM ${source.target_location || 'source_table'}\nWHERE id IS NULL OR created_at IS NULL;`,
        python_check: `def check_nulls(df, critical_cols):\n    null_counts = df[critical_cols].isnull().sum()\n    return null_counts.sum() == 0`,
        pyspark_check: `def check_nulls_spark(df, critical_cols):\n    from pyspark.sql.functions import col, sum as spark_sum\n    null_counts = df.select([spark_sum(col(c).isNull().cast(\"int\")) for c in critical_cols]).collect()[0]\n    total_nulls = sum(null_counts)\n    return total_nulls == 0`
      });

      // 5. Duplicate Record Check (Table Level - based on primary key)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'uniqueness',
        check_name: 'Duplicate Record Check (Key-based)',
        description: 'Identify and flag duplicate records based on primary key.',
        status: 'passed',
        severity: 'medium',
        created_date: timestamp,
        sql_check: `SELECT id, COUNT(*)\nFROM ${source.target_location || 'source_table'}\nGROUP BY id\nHAVING COUNT(*) > 1;`,
        python_check: `def check_duplicates(df, subset_cols=['id']):\n    return df.duplicated(subset=subset_cols).sum() == 0`,
        pyspark_check: `def check_duplicates_spark(df, subset_cols=['id']):\n    original_count = df.count()\n    distinct_count = df.dropDuplicates(subset_cols).count()\n    return original_count == distinct_count`
      });

      // 6. Total Duplicate Rows Check (Table Level - all columns)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'uniqueness',
        check_name: 'Total Duplicate Rows Check',
        description: 'Check for completely duplicate rows across all columns.',
        status: 'passed',
        severity: 'high',
        created_date: timestamp,
        sql_check: `SELECT COUNT(*) as duplicate_count\nFROM (\n  SELECT *, COUNT(*) as row_count\n  FROM ${source.target_location || 'source_table'}\n  GROUP BY *\n  HAVING COUNT(*) > 1\n) t;`,
        python_check: `def check_total_duplicates(df):\n    return df.duplicated().sum() == 0`,
        pyspark_check: `def check_total_duplicates_spark(df):\n    original_count = df.count()\n    distinct_count = df.distinct().count()\n    duplicate_count = original_count - distinct_count\n    return duplicate_count == 0`
      });

      // 7. Column Level Checks (Generated from Schema)
      if (source.schema) {
        try {
          const schema = typeof source.schema === 'string' ? JSON.parse(source.schema) : source.schema;
          let columns = [];
          
          // Handle different schema formats
          if (Array.isArray(schema)) {
             columns = schema;
          } else if (schema.columns && Array.isArray(schema.columns)) {
             columns = schema.columns;
          } else if (typeof schema === 'object' && !schema.columns) {
             // Try key-value format
             columns = Object.entries(schema).map(([k, v]) => ({
               name: k,
               type: typeof v === 'string' ? v : (v.type || 'string')
             }));
          }

          if (columns.length > 0) {
            columns.forEach(col => {
              const colName = col.name || col.column_name || col.field;
              const colType = col.type || col.data_type || col.field_type || 'string';
              
              if (!colName) return;

              // 7a. Data Type Validation
              checks.push({
                  id: Math.random().toString(36).substr(2, 9),
                  data_source_id: data_source_id,
                  check_type: 'column_level',
                  category: 'validity',
                  check_name: `Data Type Validation - ${colName}`,
                  description: `Ensure ${colName} column matches expected data type ${colType}.`,
                  status: 'passed',
                  severity: 'medium',
                  column_name: colName,
                  column_type: colType,
                  importance: 'high',
                  created_date: timestamp,
                  sql_check: `SELECT ${colName}, typeof(${colName}) as actual_type\nFROM ${source.target_location || 'source_table'}\nLIMIT 10;`,
                  python_check: `def validate_column_type(df, col_name, expected_type):\n    actual_type = str(df[col_name].dtype)\n    # Check if the type matches expected type\n    return expected_type.lower() in actual_type.lower()`,
                  pyspark_check: `def validate_column_type_spark(df, col_name, expected_type):\n    from pyspark.sql.types import StructField\n    field = [f for f in df.schema.fields if f.name == col_name][0]\n    actual_type = str(field.dataType)\n    return expected_type.lower() in actual_type.lower()`
              });

              // 7b. Null Check
              checks.push({
                  id: Math.random().toString(36).substr(2, 9),
                  data_source_id: data_source_id,
                  check_type: 'column_level',
                  category: 'completeness',
                  check_name: `Null Value Check - ${colName}`,
                  description: `Check for null values in ${colName}.`,
                  status: 'passed',
                  severity: 'high',
                  column_name: colName,
                  column_type: colType,
                  created_date: timestamp,
                  sql_check: `SELECT COUNT(*) FROM ${source.target_location || "table_name"} WHERE ${colName} IS NULL;`,
                  python_check: `def check_nulls(df):\n    return df['${colName}'].isnull().sum() == 0`,
                  pyspark_check: `def check_nulls(df):\n    return df.filter(df['${colName}'].isNull()).count() == 0`
              });

              // 7c. Uniqueness Check (if string or id)
              const isString = ['string', 'text', 'varchar', 'char'].some(t => String(colType).toLowerCase().includes(t));
              if (isString || colName.toLowerCase().includes('id')) {
                  checks.push({
                    id: Math.random().toString(36).substr(2, 9),
                    data_source_id: data_source_id,
                    check_type: 'column_level',
                    category: 'uniqueness',
                    check_name: `Uniqueness Check - ${colName}`,
                    description: `Count distinct values in ${colName}.`,
                    status: 'passed',
                    severity: 'low',
                    column_name: colName,
                    column_type: colType,
                    created_date: timestamp,
                    sql_check: `SELECT COUNT(DISTINCT ${colName}) FROM ${source.target_location || "table_name"};`,
                    python_check: `def check_unique(df):\n    return df['${colName}'].nunique()`,
                    pyspark_check: `def check_unique(df):\n    return df.select('${colName}').distinct().count()`
                  });
              }
            });
          }
        } catch (e) {
          console.warn("Could not parse schema for column checks:", e);
        }
      }

      // 8. Completeness Check (Row Level)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'basic',
        category: 'completeness',
        check_name: 'Completeness Check',
        description: 'Ensure required columns have non-null values for a specified percentage of rows.',
        status: 'passed',
        severity: 'medium',
        created_date: timestamp,
        sql_check: `SELECT \n  COUNT(*) as total_rows,\n  COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as id_not_null,\n  COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as created_at_not_null,\n  (COUNT(CASE WHEN id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)) as id_completeness,\n  (COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)) as created_at_completeness\nFROM ${source.target_location || 'source_table'};`,
        python_check: `def completeness_check(df, required_cols, threshold=0.95):\n    completeness = df[required_cols].notna().mean()\n    return all(completeness >= threshold)`,
        pyspark_check: `def completeness_check_spark(df, required_cols, threshold=0.95):\n    from pyspark.sql.functions import col, sum as spark_sum, count\n    total_rows = df.count()\n    completeness_results = []\n    for col_name in required_cols:\n        not_null_count = df.filter(col(col_name).isNotNull()).count()\n        completeness = not_null_count / total_rows if total_rows > 0 else 0\n        completeness_results.append(completeness >= threshold)\n    return all(completeness_results)`
      });

      // 9. Range Check (Column Level - for numeric columns)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'column_level',
        category: 'validity',
        check_name: 'Numeric Range Validation',
        description: 'Validate that numeric columns fall within expected ranges.',
        status: 'passed',
        severity: 'medium',
        column_name: 'amount', // Example column
        column_type: 'numeric',
        importance: 'medium',
        created_date: timestamp,
        sql_check: `SELECT \n  MIN(amount) as min_val,\n  MAX(amount) as max_val,\n  AVG(amount) as avg_val,\n  COUNT(CASE WHEN amount < 0 THEN 1 END) as negative_count\nFROM ${source.target_location || 'source_table'}\nWHERE amount IS NOT NULL;`,
        python_check: `def validate_numeric_range(df, col_name, min_val=None, max_val=None):\n    series = df[col_name]\n    if min_val is not None and series.min() < min_val:\n        return False\n    if max_val is not None and series.max() > max_val:\n        return False\n    return True`,
        pyspark_check: `def validate_numeric_range_spark(df, col_name, min_val=None, max_val=None):\n    from pyspark.sql.functions import col, min as spark_min, max as spark_max\n    stats = df.select(spark_min(col(col_name)).alias('min'), spark_max(col(col_name)).alias('max')).collect()[0]\n    if min_val is not None and stats['min'] < min_val:\n        return False\n    if max_val is not None and stats['max'] > max_val:\n        return False\n    return True`
      });

      // 10. Pattern Check (Column Level - for string columns)
      checks.push({
        id: Math.random().toString(36).substr(2, 9),
        data_source_id: data_source_id,
        check_type: 'column_level',
        category: 'validity',
        check_name: 'Email Pattern Validation',
        description: 'Validate email format in email column using regex.',
        status: 'passed',
        severity: 'medium',
        column_name: 'email',
        column_type: 'string',
        importance: 'high',
        created_date: timestamp,
        sql_check: `SELECT \n  COUNT(*) as total_emails,\n  COUNT(CASE WHEN email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN 1 END) as valid_emails\nFROM ${source.target_location || 'source_table'}\nWHERE email IS NOT NULL;`,
        python_check: `import re\ndef validate_email_pattern(df, col_name):\n    pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'\n    return df[col_name].dropna().apply(lambda x: bool(re.match(pattern, str(x)))).all()`,
        pyspark_check: `def validate_email_pattern_spark(df, col_name):\n    from pyspark.sql.functions import col, regexp_extract, length\n    # Count rows where email doesn't match pattern\n    invalid_count = df.filter(col(col_name).rlike('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$') == False).count()\n    return invalid_count == 0`
      });

      // Save checks to store
      for (const check of checks) {
        await entities.DataQualityCheck.create(check);
      }

      return { success: true, count: checks.length };
    },
    generateDataSourceChecks: async ({ data_source_id, force = false, onProgress }) => {
      const logProgress = (msg) => {
        if (onProgress) onProgress(msg);
        console.log(`[Backend]: ${msg}`);
      };

      logProgress(`Starting check generation (Force: ${force})...`);

      if (force) {
        logProgress("Force mode enabled. Cleaning existing checks...");
        const existing = await entities.DataQualityCheck.filter({ data_source_id });
        for (const check of existing) {
          await entities.DataQualityCheck.delete(check.id);
        }
        logProgress(`Deleted ${existing.length} existing checks.`);
      }

      // 1. Ensure basic checks exist first
      logProgress("Step 1: Ensuring basic quality checks...");
      await localDataStore.functions.ensureBasicChecks({ data_source_id });
      logProgress("Basic checks verified.");

      // 2. Get Source and Dataset info for AI checks
      logProgress("Step 2: Loading source context...");
      const sources = await entities.DataSource.filter({ id: data_source_id });
      const source = sources[0];
      if (!source) throw new Error("Source not found");

      const datasets = await entities.Dataset.filter({ id: source.dataset_id });
      const dataset = datasets[0];
      logProgress(`Context loaded: ${source.name} / ${dataset?.name || 'No Dataset'}`);

      // 3. Generate AI checks (Context-aware)
      const existingAiChecks = await entities.DataQualityCheck.filter({
        data_source_id,
        check_type: 'ai_suggested'
      });

      if (existingAiChecks.length > 0) {
        logProgress(`Found ${existingAiChecks.length} existing AI checks. Skipping generation.`);
        return {
          success: true,
          data: {
            total_count: (await entities.DataQualityCheck.filter({ data_source_id })).length,
            ai_checks: existingAiChecks
          }
        };
      }

      const timestamp = new Date().toISOString();
      const checks = [];

      // LLM Generation
      try {
        logProgress("Step 3: AI Check Generation...");
        
        // Get API key
        const settings = await entities.AppSettings.filter({ setting_key: 'deepseek_api_key' });
        const apiKey = settings[0]?.deepseek_api_key;

        if (apiKey) {
          logProgress("DeepSeek API key found. Constructing prompt...");
          
          const prompt = `
            You are a Data Quality Engineer. Analyze this data source and suggest 3-5 specific data quality checks (SQL, Python Pandas, and PySpark).

            Data Source: ${source.name}
            Type: ${source.type}
            Location/Table: ${source.target_location || 'N/A'}
            Dataset Context: ${dataset?.name} - ${dataset?.description || 'No description'}
            Has PII: ${dataset?.contains_pii ? 'Yes' : 'No'}

            Return a JSON array of objects. Each object must have:
            - check_name: string
            - description: string
            - category: string (one of: completeness, accuracy, consistency, validity, uniqueness, integrity, schema, statistics, outliers, patterns, distribution)
            - severity: string (low, medium, high, critical)
            - sql_check: string (SQL query returning failing rows or count)
            - python_check: string (Python function returning boolean or list of failures)
            - pyspark_check: string (PySpark function returning boolean or list of failures)
            - check_type: string (column_level, basic, ai_suggested)
            - column_name: string (optional, for column-specific checks)
            - column_type: string (optional, for column-specific checks)
            - importance: string (critical, high, medium, low)

            Output ONLY valid JSON. No markdown formatting.
          `;

          logProgress("Sending request to DeepSeek API...");
          
          // Use the internal InvokeLLM but capture logs if possible, or just call directly
          // Using InvokeLLM to get audit logging for free
          const llmResult = await localDataStore.integrations.Core.InvokeLLM({ 
             prompt, 
             apiKey 
          });

          logProgress("Response received. Parsing...");
          const content = llmResult.result;
          
          const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
          let generatedChecks = [];
          
          try {
             if (cleanJson.startsWith('[')) {
                generatedChecks = JSON.parse(cleanJson);
             } else {
                // If it's the mock response or just text, try to parse or fail gracefully
                if (cleanJson.includes("mock LLM response")) {
                    logProgress("Mock response detected (no real checks).");
                } else {
                    console.warn("LLM response not an array:", cleanJson);
                }
             }
          } catch (e) {
             console.warn("JSON Parse Error", e);
             logProgress("Failed to parse AI response.");
          }

          logProgress(`Parsed ${generatedChecks.length} checks from AI.`);

          generatedChecks.forEach(genCheck => {
            checks.push({
              id: Math.random().toString(36).substr(2, 9),
              data_source_id: data_source_id,
              check_type: 'ai_suggested',
              category: genCheck.category || 'custom',
              check_name: genCheck.check_name || 'AI Suggested Check',
              description: genCheck.description || 'AI generated check',
              status: 'pending',
              severity: genCheck.severity || 'medium',
              created_date: timestamp,
              sql_check: genCheck.sql_check,
              python_check: genCheck.python_check,
              pyspark_check: genCheck.pyspark_check,
              importance: genCheck.importance || 'medium',
              column_name: genCheck.column_name,
              column_type: genCheck.column_type
            });
          });
        } else {
            logProgress("No API key configured. Skipping AI generation.");
        }
      } catch (llmError) {
        logProgress(`AI Generation failed: ${llmError.message}`);
        console.error("LLM Generation failed:", llmError);
      }

      // Fallback: Use heuristics if LLM failed
      if (checks.length === 0) {
        logProgress("Using heuristic fallback checks...");

        if (dataset?.contains_pii) {
           logProgress("Adding PII Check...");
           checks.push({
            id: Math.random().toString(36).substr(2, 9),
            data_source_id: data_source_id,
            check_type: 'ai_suggested',
            category: 'compliance',
            check_name: 'PII Exposure Check',
            description: 'AI detected potential PII patterns in non-encrypted columns',
            status: 'warning',
            severity: 'critical',
            created_date: timestamp,
            sql_check: `SELECT count(*)\nFROM ${source.target_location}\nWHERE email NOT LIKE '%@%' OR phone_number !~ '^[0-9]+$';`,
            python_check: `def detect_pii(df):\n    # Use NLP model or regex patterns\n    pii_patterns = [r'\\d{3}-\\d{2}-\\d{4}', r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}']\n    # ... implementation details`,
            pyspark_check: `def detect_pii_spark(df):\n    from pyspark.sql.functions import col, regexp_extract\n    # Apply PII detection patterns to sensitive columns\n    return True`,
            importance: 'critical'
          });
        }

        if (source?.type === 'api') {
           logProgress("Adding API Latency Check...");
           checks.push({
            id: Math.random().toString(36).substr(2, 9),
            data_source_id: data_source_id,
            check_type: 'ai_suggested',
            category: 'performance',
            check_name: 'API Latency Anomaly',
            description: 'Detect unusual spikes in API response time',
            status: 'passed',
            severity: 'medium',
            created_date: timestamp,
            sql_check: `-- Not applicable for SQL (Log analysis required)\nSELECT AVG(response_time) as avg_latency\nFROM api_logs\nWHERE endpoint = '${source.source_location}';`,
            python_check: `def check_latency_anomaly(latency_values):\n    mean = np.mean(latency_values)\n    std = np.std(latency_values)\n    threshold = mean + 3 * std\n    return any(v > threshold for v in latency_values)`,
            pyspark_check: `def check_latency_anomaly_spark(df):\n    # Calculate statistical measures on response times\n    return True`,
            importance: 'high'
          });
        }
      }

      // Save checks to store
      logProgress(`Saving ${checks.length} new checks to database...`);
      for (const check of checks) {
        await entities.DataQualityCheck.create(check);
      }
      logProgress("All checks saved successfully.");

      return {
        success: true,
        data: {
          total_count: (await entities.DataQualityCheck.filter({ data_source_id })).length,
          ai_checks: checks
        }
      };
    },

  },
  resetDatabase: async () => {
    Object.values(entities).forEach(entity => {
      localStorage.removeItem(entity.storageKey);
    });
    // Re-seed initial minimal data if needed, or just leave empty
    // entities.Project.create({ name: 'Demo Project', description: 'Local demo project' });
    return true;
  }
};
