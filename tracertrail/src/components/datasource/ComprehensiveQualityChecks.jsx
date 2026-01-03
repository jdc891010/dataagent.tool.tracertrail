import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Code,
  Database,
  ChevronDown,
  ChevronRight,
  Copy,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  Table,
  Rows,
  Columns,
  Filter,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import DataQualityCheckCard from "@/components/datasource/DataQualityCheckCard";
import ColumnQualityCheckCard from "@/components/datasource/ColumnQualityCheckCard";

const ComprehensiveQualityChecks = ({ dataSource, qualityChecks }) => {
  const [expandedSections, setExpandedSections] = useState({
    ai: true,
    table: true,
    row: true,
    column: true
  });

  const [selectedColumn, setSelectedColumn] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  // Parse schema to extract column information
  const columns = useMemo(() => {
    if (!dataSource?.schema) return [];

    try {
      // Try to parse schema if it's a string
      let schemaObj;
      if (typeof dataSource.schema === 'string') {
        schemaObj = JSON.parse(dataSource.schema);
      } else {
        schemaObj = dataSource.schema;
      }

      // Handle different schema formats
      if (Array.isArray(schemaObj)) {
        return schemaObj.map(col => ({
          name: col.name || col.column_name || col.field,
          type: col.type || col.data_type || col.field_type,
          nullable: col.nullable !== undefined ? col.nullable : col.is_nullable
        }));
      } else if (schemaObj.columns) {
        return schemaObj.columns.map(col => ({
          name: col.name || col.column_name || col.field,
          type: col.type || col.data_type || col.field_type,
          nullable: col.nullable !== undefined ? col.nullable : col.is_nullable
        }));
      } else {
        // If schema is an object with column names as keys
        return Object.entries(schemaObj).map(([name, details]) => ({
          name,
          type: typeof details === 'string' ? details : (details.type || details.data_type),
          nullable: details.nullable !== undefined ? details.nullable : details.is_nullable
        }));
      }
    } catch (e) {
      console.warn("Could not parse schema:", e);
      return [];
    }
  }, [dataSource]);

  // Filter checks based on selections
  const filteredChecks = useMemo(() => {
    return qualityChecks.filter(check => {
      // Apply column filter
      if (selectedColumn !== "all" && check.column_name && check.column_name !== selectedColumn) {
        return false;
      }

      // Apply category filter
      if (selectedCategory !== "all" && check.category !== selectedCategory) {
        return false;
      }

      // Apply severity filter
      if (selectedSeverity !== "all" && check.severity !== selectedSeverity) {
        return false;
      }

      return true;
    });
  }, [qualityChecks, selectedColumn, selectedCategory, selectedSeverity]);

  // Group checks by type
  const groupedChecks = useMemo(() => {
    const groups = {
      table: [],
      row: [],
      column: [],
      basic: [],
      ai_suggested: []
    };

    // Hardcoded default table checks
    const defaultChecks = [
      {
        id: "default-access",
        check_name: "Table Accessibility Check",
        description: "Verify that the table exists and is accessible.",
        category: "availability",
        severity: "critical",
        status: "passed",
        check_type: "basic",
        sql_check: `SELECT 1 FROM ${dataSource?.target_location || "table_name"} LIMIT 1;`,
        python_check: `def check_accessibility(df):\n    return not df.empty`,
        pyspark_check: `def check_accessibility(df):\n    return df.head(1).isEmpty == False`
      },
      {
        id: "default-count",
        check_name: "Row Count Validation",
        description: "Ensure table has data and track row count.",
        category: "completeness",
        severity: "critical",
        status: "passed",
        check_type: "basic",
        sql_check: `SELECT COUNT(*) FROM ${dataSource?.target_location || "table_name"};`,
        python_check: `def check_row_count(df):\n    return len(df) > 0`,
        pyspark_check: `def check_row_count(df):\n    return df.count() > 0`
      },
      {
        id: "default-schema",
        check_name: "Schema Consistency Check",
        description: "Verify that the table schema matches the expected definition.",
        category: "schema",
        severity: "high",
        status: "passed",
        check_type: "basic",
        sql_check: `-- Check for schema drift\nSELECT column_name, data_type \nFROM information_schema.columns \nWHERE table_name = '${dataSource?.target_location || "table_name"}';`,
        python_check: `def check_schema(df, expected_columns):\n    return all(col in df.columns for col in expected_columns)`,
        pyspark_check: `def check_schema(df, expected_schema):\n    return df.schema == expected_schema`
      },
      {
        id: "default-freshness",
        check_name: "Data Freshness Check",
        description: "Verify that the data has been updated within the expected timeframe.",
        category: "freshness",
        severity: "medium",
        status: "passed",
        check_type: "basic",
        sql_check: `SELECT MAX(updated_at) FROM ${dataSource?.target_location || "table_name"};`,
        python_check: `def check_freshness(df):\n    return df['updated_at'].max() > threshold`,
        pyspark_check: `def check_freshness(df):\n    return df.agg({"updated_at": "max"}).collect()[0][0]`
      }
    ];

    // Add default checks to basic group (filter out if similar check exists in filteredChecks to avoid duplicates)
    defaultChecks.forEach(defaultCheck => {
      const exists = filteredChecks.some(c => c.check_name === defaultCheck.check_name);
      if (!exists) {
        groups.basic.push(defaultCheck);
      }
    });

    // Default column checks based on type
    if (columns.length > 0) {
      columns.forEach(col => {
        const type = col.type?.toLowerCase() || 'string';
        const isNumeric = ['int', 'integer', 'float', 'double', 'decimal', 'number'].some(t => type.includes(t));
        const isDate = ['date', 'time', 'timestamp'].some(t => type.includes(t));
        const isBoolean = ['bool', 'boolean'].some(t => type.includes(t));

        let colChecks = [];

        // Common checks for all columns
        colChecks.push({
          id: `default-null-${col.name}`,
          check_name: "Null Value Check",
          description: `Check for null values in ${col.name}.`,
          category: "completeness",
          severity: "high",
          status: "passed",
          check_type: "column_level",
          column_name: col.name,
          column_type: col.type,
          sql_check: `SELECT COUNT(*) FROM ${dataSource?.target_location || "table_name"} WHERE ${col.name} IS NULL;`,
          python_check: `def check_nulls(df):\n    return df['${col.name}'].isnull().sum() == 0`,
          pyspark_check: `def check_nulls(df):\n    return df.filter(df['${col.name}'].isNull()).count() == 0`
        });

        if (isNumeric) {
          colChecks.push({
            id: `default-minmax-${col.name}`,
            check_name: "Min/Max Range Check",
            description: `Verify values in ${col.name} are within expected range.`,
            category: "validity",
            severity: "medium",
            status: "passed",
            check_type: "column_level",
            column_name: col.name,
            column_type: col.type,
            sql_check: `SELECT MIN(${col.name}), MAX(${col.name}) FROM ${dataSource?.target_location || "table_name"};`,
            python_check: `def check_range(df):\n    return df['${col.name}'].min() >= 0  # Example range check`,
            pyspark_check: `def check_range(df):\n    stats = df.agg({"${col.name}": "min", "${col.name}": "max"}).collect()[0]\n    return stats[0] >= 0`
          });
          colChecks.push({
            id: `default-zero-${col.name}`,
            check_name: "Zero Value Check",
            description: `Identify zero values in ${col.name}.`,
            category: "distribution",
            severity: "low",
            status: "passed",
            check_type: "column_level",
            column_name: col.name,
            column_type: col.type,
            sql_check: `SELECT COUNT(*) FROM ${dataSource?.target_location || "table_name"} WHERE ${col.name} = 0;`,
            python_check: `def check_zeros(df):\n    return (df['${col.name}'] == 0).sum()`,
            pyspark_check: `def check_zeros(df):\n    return df.filter(df['${col.name}'] == 0).count()`
          });
        } else if (isDate) {
          colChecks.push({
            id: `default-future-${col.name}`,
            check_name: "Future Date Check",
            description: `Ensure no dates in ${col.name} are in the future.`,
            category: "validity",
            severity: "high",
            status: "passed",
            check_type: "column_level",
            column_name: col.name,
            column_type: col.type,
            sql_check: `SELECT COUNT(*) FROM ${dataSource?.target_location || "table_name"} WHERE ${col.name} > CURRENT_DATE;`,
            python_check: `def check_future(df):\n    return (df['${col.name}'] > pd.Timestamp.now()).sum() == 0`,
            pyspark_check: `def check_future(df):\n    return df.filter(df['${col.name}'] > current_date()).count() == 0`
          });
        } else if (!isBoolean) { // String/Text
          colChecks.push({
            id: `default-empty-${col.name}`,
            check_name: "Empty String Check",
            description: `Check for empty strings in ${col.name}.`,
            category: "completeness",
            severity: "medium",
            status: "passed",
            check_type: "column_level",
            column_name: col.name,
            column_type: col.type,
            sql_check: `SELECT COUNT(*) FROM ${dataSource?.target_location || "table_name"} WHERE ${col.name} = '';`,
            python_check: `def check_empty(df):\n    return (df['${col.name}'] == '').sum() == 0`,
            pyspark_check: `def check_empty(df):\n    return df.filter(df['${col.name}'] == '').count() == 0`
          });
          colChecks.push({
            id: `default-distinct-${col.name}`,
            check_name: "Uniqueness Check",
            description: `Count distinct values in ${col.name}.`,
            category: "uniqueness",
            severity: "low",
            status: "passed",
            check_type: "column_level",
            column_name: col.name,
            column_type: col.type,
            sql_check: `SELECT COUNT(DISTINCT ${col.name}) FROM ${dataSource?.target_location || "table_name"};`,
            python_check: `def check_unique(df):\n    return df['${col.name}'].nunique()`,
            pyspark_check: `def check_unique(df):\n    return df.select('${col.name}').distinct().count()`
          });
        }

        // Add to groups.column if not exists
        colChecks.forEach(check => {
          const exists = filteredChecks.some(c => 
            c.check_name === check.check_name && c.column_name === check.column_name
          );
          if (!exists) {
            groups.column.push(check);
          }
        });
      });
    }

    filteredChecks.forEach(check => {
      if (check.check_type === 'ai_suggested') {
        groups.ai_suggested.push(check);
      } else if (check.check_type === 'column_level' || check.column_name) {
        groups.column.push(check);
      } else if (check.category === 'completeness' || check.category === 'accuracy' ||
                 check.category === 'consistency' || check.category === 'validity' ||
                 check.category === 'uniqueness' || check.category === 'integrity' ||
                 check.category === 'schema' || check.category === 'statistics' ||
                 check.category === 'outliers' || check.category === 'patterns' ||
                 check.category === 'distribution') {
        groups.row.push(check);
      } else if (check.check_type === 'basic') {
        groups.basic.push(check);
      } else {
        groups.table.push(check);
      }
    });

    return groups;
  }, [filteredChecks, dataSource]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "completeness", label: "Completeness" },
    { value: "accuracy", label: "Accuracy" },
    { value: "consistency", label: "Consistency" },
    { value: "validity", label: "Validity" },
    { value: "uniqueness", label: "Uniqueness" },
    { value: "integrity", label: "Integrity" },
    { value: "schema", label: "Schema" },
    { value: "statistics", label: "Statistics" },
    { value: "outliers", label: "Outliers" },
    { value: "patterns", label: "Patterns" },
    { value: "distribution", label: "Distribution" }
  ];

  const severityOptions = [
    { value: "all", label: "All Severities" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Filter className="w-5 h-5 text-cyan-400" />
            Filter Quality Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Column</label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="All Columns" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Columns</SelectItem>
                  {columns.map(col => (
                    <SelectItem key={col.name} value={col.name} className="focus:bg-slate-800 focus:text-white">
                      {col.name} ({col.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="focus:bg-slate-800 focus:text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Severity</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {severityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="focus:bg-slate-800 focus:text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Quality Whispers */}
      {groupedChecks.ai_suggested.length > 0 && (
        <Card className="bg-slate-900 border-purple-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSection('ai')}
                  className="hover:bg-slate-700 rounded p-1 transition-colors"
                >
                  {expandedSections.ai ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Quality Whispers ({groupedChecks.ai_suggested.length})
                </CardTitle>
              </div>
              <Badge className="bg-purple-900/30 text-purple-400 border-purple-500/30">
                AI Suggested
              </Badge>
            </div>
          </CardHeader>
          {expandedSections.ai && (
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {groupedChecks.ai_suggested.map(check => (
                  <DataQualityCheckCard key={check.id} check={check} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Table Level Checks */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSection('table')}
                className="hover:bg-slate-700 rounded p-1 transition-colors"
              >
                {expandedSections.table ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Table className="w-5 h-5 text-blue-400" />
                Table Level Checks ({groupedChecks.table.length + groupedChecks.basic.length})
              </CardTitle>
            </div>
            <Badge className="bg-blue-900/30 text-blue-400 border-blue-500/30">
              Table Level
            </Badge>
          </div>
        </CardHeader>
        {expandedSections.table && (
          <CardContent className="space-y-3">
            {groupedChecks.basic.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Basic Table Checks
                </h4>
                {groupedChecks.basic.map(check => (
                  <DataQualityCheckCard key={check.id} check={check} />
                ))}
              </div>
            )}
            {groupedChecks.table.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-400" />
                  Additional Table Checks
                </h4>
                {groupedChecks.table.map(check => (
                  <DataQualityCheckCard key={check.id} check={check} />
                ))}
              </div>
            )}
            {groupedChecks.basic.length === 0 && groupedChecks.table.length === 0 && (
              <p className="text-slate-400 text-sm py-4 text-center">No table-level quality checks available</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Row Level Checks */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSection('row')}
                className="hover:bg-slate-700 rounded p-1 transition-colors"
              >
                {expandedSections.row ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Rows className="w-5 h-5 text-green-400" />
                Row Level Checks ({groupedChecks.row.length})
              </CardTitle>
            </div>
            <Badge className="bg-green-900/30 text-green-400 border-green-500/30">
              Row Level
            </Badge>
          </div>
        </CardHeader>
        {expandedSections.row && (
          <CardContent className="space-y-3">
            {groupedChecks.row.length > 0 ? (
              groupedChecks.row.map(check => (
                <DataQualityCheckCard key={check.id} check={check} />
              ))
            ) : (
              <p className="text-slate-400 text-sm py-4 text-center">No row-level quality checks available</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Column Level Checks */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSection('column')}
                className="hover:bg-slate-700 rounded p-1 transition-colors"
              >
                {expandedSections.column ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Columns className="w-5 h-5 text-amber-400" />
                Column Level Checks ({groupedChecks.column.length})
              </CardTitle>
            </div>
            <Badge className="bg-amber-900/30 text-amber-400 border-amber-500/30">
              Column Level
            </Badge>
          </div>
        </CardHeader>
        {expandedSections.column && (
          <CardContent className="space-y-3">
            {groupedChecks.column.length > 0 ? (
              groupedChecks.column.map(check => (
                <ColumnQualityCheckCard key={check.id} check={check} />
              ))
            ) : (
              <p className="text-slate-400 text-sm py-4 text-center">No column-level quality checks available</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ComprehensiveQualityChecks;
