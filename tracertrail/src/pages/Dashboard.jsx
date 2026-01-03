import { useState, useMemo } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Database, FileDown, List, FolderTree, GitBranch, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import StatsCards from "@/components/issues/StatsCards";
import IssueFilters from "@/components/issues/IssueFilters";
import IssueCard from "@/components/issues/IssueCard";
import ProjectTreeView from "@/components/dashboard/ProjectTreeView";
import DataSourceQuickAction from "@/components/dashboard/DataSourceQuickAction";
import AppNav from "@/components/navigation/AppNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState("hierarchy");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    severity: "all",
    type: "all",
    project: "all",
    dataset: "all",
    file: "all"
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: ({ signal }) => dataAgent.entities.Issue.list("-created_date", null, { signal })
  });

  const { data: affectedColumns = [] } = useQuery({
    queryKey: ["affected-columns"],
    queryFn: ({ signal }) => dataAgent.entities.AffectedColumn.list(null, null, { signal })
  });

  const { data: dataSources = [] } = useQuery({
    queryKey: ["data-sources"],
    queryFn: ({ signal }) => dataAgent.entities.DataSource.list(null, null, { signal })
  });

  const inProgressSources = useMemo(() => {
    return dataSources
      .filter(source => 
        source.status === 'in_progress' || 
        source.status === 'paused' || 
        source.status === 'alert' ||
        // Include recently active stopped sources (last 3 days) to allow quick resume
        (source.status === 'stopped' && source.updated_date && (new Date() - new Date(source.updated_date)) < 3 * 24 * 60 * 60 * 1000)
      )
      .sort((a, b) => {
        const aDate = a.updated_date ? new Date(a.updated_date) : new Date(0);
        const bDate = b.updated_date ? new Date(b.updated_date) : new Date(0);
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [dataSources]);

  const columnsByIssue = useMemo(() => {
    const map = {};
    affectedColumns.forEach(col => {
      if (!map[col.issue_id]) map[col.issue_id] = [];
      map[col.issue_id].push(col);
    });
    return map;
  }, [affectedColumns]);

  const uniqueProjects = useMemo(() => 
    [...new Set(issues.map(i => i.project).filter(Boolean))].sort(),
    [issues]
  );
  
  const uniqueDatasets = useMemo(() => 
    [...new Set(issues.map(i => i.dataset).filter(Boolean))].sort(),
    [issues]
  );
  
  const uniqueFiles = useMemo(() => 
    [...new Set(issues.map(i => i.file).filter(Boolean))].sort(),
    [issues]
  );

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesTitle = issue.title?.toLowerCase().includes(search);
        const matchesDesc = issue.description?.toLowerCase().includes(search);
        const matchesTags = issue.tags?.some(t => t.toLowerCase().includes(search));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      if (filters.status !== "all" && issue.status !== filters.status) return false;
      if (filters.severity !== "all" && issue.severity !== filters.severity) return false;
      if (filters.type !== "all" && issue.issue_type !== filters.type) return false;
      if (filters.project !== "all" && issue.project !== filters.project) return false;
      if (filters.dataset !== "all" && issue.dataset !== filters.dataset) return false;
      if (filters.file !== "all" && issue.file !== filters.file) return false;
      return true;
    });
  }, [issues, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ 
      search: "", 
      status: "all", 
      severity: "all", 
      type: "all",
      project: "all",
      dataset: "all",
      file: "all"
    });
  };

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8 text-white">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={logo}
                alt="DataAgent" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">
                    DataAgent Trace Trail
                  </h1>
                  <p className="text-slate-500 text-sm">Track and resolve data quality issues</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link to={createPageUrl("Projects")}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <FolderTree className="w-4 h-4 mr-2" />
                Projects
              </Button>
            </Link>
            <Link to={createPageUrl("Datasets")}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Database className="w-4 h-4 mr-2" />
                Datasets
              </Button>
            </Link>
            <Link to={createPageUrl("Export")}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
            </Link>
            <Link to={createPageUrl("NewIssue")}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                New Issue
              </Button>
            </Link>
          </div>
        </div>

        {/* Quickstart - In Progress Data Sources */}
        {inProgressSources.length > 0 && (
          <Card className="bg-slate-800 border-cyan-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                Quickstart - Continue Working
              </CardTitle>
              <p className="text-sm text-slate-400">Data sources currently in progress</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {inProgressSources.map(source => (
                  <DataSourceQuickAction key={source.id} source={source} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {issuesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <StatsCards issues={issues} />
          </div>
        )}

        {/* Filters */}
        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FolderTree className="w-4 h-4" />
              Hierarchy View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "list" && (
          <div className="mb-6">
            <IssueFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={clearFilters}
              projects={uniqueProjects}
              datasets={uniqueDatasets}
              files={uniqueFiles}
            />
          </div>
        )}

        {/* Issue Display */}
        {issuesLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              {issues.length === 0 ? "No issues logged yet" : "No issues match your filters"}
            </h3>
            <p className="text-slate-500 mb-6">
              {issues.length === 0 
                ? "Start by logging your first dataset issue"
                : "Try adjusting your filters"}
            </p>
            {issues.length === 0 && (
              <Link to={createPageUrl("NewIssue")}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Log First Issue
                </Button>
              </Link>
            )}
          </div>
        ) : viewMode === "hierarchy" ? (
          <ProjectTreeView issues={filteredIssues} />
        ) : (
          <div className="space-y-3">
            {filteredIssues.map(issue => (
              <IssueCard 
                key={issue.id} 
                issue={issue}
                affectedColumns={columnsByIssue[issue.id] || []}
              />
            ))}
          </div>
        )}

        {filteredIssues.length > 0 && (
          <p className="text-center text-sm text-slate-400 mt-6">
            Showing {filteredIssues.length} of {issues.length} issues
          </p>
        )}
      </div>
    </div>
    </>
  );
}