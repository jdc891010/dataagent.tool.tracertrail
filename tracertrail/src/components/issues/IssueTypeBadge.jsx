import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const typeLabels = {
  data_quality: "Data Quality",
  schema_change: "Schema Change",
  missing_values: "Missing Values",
  duplicates: "Duplicates",
  outliers: "Outliers",
  business_logic: "Business Logic",
  etl_failure: "ETL Failure",
  other: "Other"
};

const typeColors = {
  data_quality: "bg-indigo-50 text-indigo-700 border-indigo-200",
  schema_change: "bg-violet-50 text-violet-700 border-violet-200",
  missing_values: "bg-rose-50 text-rose-700 border-rose-200",
  duplicates: "bg-amber-50 text-amber-700 border-amber-200",
  outliers: "bg-cyan-50 text-cyan-700 border-cyan-200",
  business_logic: "bg-pink-50 text-pink-700 border-pink-200",
  etl_failure: "bg-red-50 text-red-700 border-red-200",
  other: "bg-slate-50 text-slate-600 border-slate-200"
};

export default function IssueTypeBadge({ type, className }) {
  return (
    <Badge variant="outline" className={cn("font-medium", typeColors[type] || typeColors.other, className)}>
      {typeLabels[type] || type}
    </Badge>
  );
}