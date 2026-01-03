import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";

export default function IssueFilters({ filters, onFilterChange, onClear, projects, datasets, files }) {
  const hasFilters = filters.search || filters.status !== "all" || 
    filters.severity !== "all" || filters.type !== "all" ||
    filters.project !== "all" || filters.dataset !== "all" || filters.file !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search issues..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="pl-9 bg-slate-900 border-slate-700 text-white"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Select value={filters.status} onValueChange={(v) => onFilterChange("status", v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
        <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Status</SelectItem>
        <SelectItem value="open" className="focus:bg-slate-800 focus:text-white">Open</SelectItem>
        <SelectItem value="in_progress" className="focus:bg-slate-800 focus:text-white">In Progress</SelectItem>
        <SelectItem value="fixed" className="focus:bg-slate-800 focus:text-white">Fixed</SelectItem>
        <SelectItem value="verified" className="focus:bg-slate-800 focus:text-white">Verified</SelectItem>
        <SelectItem value="wont_fix" className="focus:bg-slate-800 focus:text-white">Won't Fix</SelectItem>
      </SelectContent>
        </Select>
        
        <Select value={filters.severity} onValueChange={(v) => onFilterChange("severity", v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Severity</SelectItem>
            <SelectItem value="critical" className="focus:bg-slate-800 focus:text-white">Critical</SelectItem>
            <SelectItem value="high" className="focus:bg-slate-800 focus:text-white">High</SelectItem>
            <SelectItem value="medium" className="focus:bg-slate-800 focus:text-white">Medium</SelectItem>
            <SelectItem value="low" className="focus:bg-slate-800 focus:text-white">Low</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.type} onValueChange={(v) => onFilterChange("type", v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Types</SelectItem>
            <SelectItem value="data_quality" className="focus:bg-slate-800 focus:text-white">Data Quality</SelectItem>
            <SelectItem value="schema_change" className="focus:bg-slate-800 focus:text-white">Schema Change</SelectItem>
            <SelectItem value="missing_values" className="focus:bg-slate-800 focus:text-white">Missing Values</SelectItem>
            <SelectItem value="duplicates" className="focus:bg-slate-800 focus:text-white">Duplicates</SelectItem>
            <SelectItem value="outliers" className="focus:bg-slate-800 focus:text-white">Outliers</SelectItem>
            <SelectItem value="business_logic" className="focus:bg-slate-800 focus:text-white">Business Logic</SelectItem>
            <SelectItem value="etl_failure" className="focus:bg-slate-800 focus:text-white">ETL Failure</SelectItem>
            <SelectItem value="other" className="focus:bg-slate-800 focus:text-white">Other</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.project} onValueChange={(v) => onFilterChange("project", v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Projects</SelectItem>
            {projects?.map((p) => (
              <SelectItem key={p} value={p} className="focus:bg-slate-800 focus:text-white">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.dataset} onValueChange={(v) => onFilterChange("dataset", v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Dataset" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Datasets</SelectItem>
            {datasets?.map((d) => (
              <SelectItem key={d} value={d} className="focus:bg-slate-800 focus:text-white">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.file} onValueChange={(v) => onFilterChange("file", v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="File" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Files</SelectItem>
            {files?.map((f) => (
              <SelectItem key={f} value={f} className="focus:bg-slate-800 focus:text-white">{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {hasFilters && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onClear} 
            className="border-slate-700 text-white hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
