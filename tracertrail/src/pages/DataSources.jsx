import { useState, useMemo } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GitBranch,
  Plus,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  Play,
  AlertTriangle,
  Circle,
  Loader2,
  StopCircle,
  Filter,
  X as ClearIcon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AppNav from "@/components/navigation/AppNav";

export default function DataSources() {

  const [filters, setFilters] = useState({
    search: "",
    project: "all",
    dataset: "all",
    status: "all",
    phase: "all",
    dateFrom: "",
    dateTo: "",
    sort: "priority"
  });
  const queryClient = useQueryClient();

  const { data: sources = [] } = useQuery({
    queryKey: ["data-sources"],
    queryFn: () => dataAgent.entities.DataSource.list("-last_run_date")
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => dataAgent.entities.Dataset.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });

  const { data: flows = [] } = useQuery({
    queryKey: ["data-flows"],
    queryFn: () => dataAgent.entities.DataFlow.list()
  });

  const getDatasetName = (datasetId) => {
    return datasets.find(d => d.id === datasetId)?.name || "Unassigned";
  };

  const getProjectName = (datasetId) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset || !dataset.project_id) return "—";
    return projects.find(p => p.id === dataset.project_id)?.name || "—";
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => dataAgent.entities.DataSource.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sources"] });
      toast.success("Status updated");
    }
  });

  const statusConfig = {
    idle: { icon: Circle, color: "text-slate-400" },
    in_progress: { icon: Loader2, color: "text-blue-500" },
    completed: { icon: CheckCircle, color: "text-green-500" },
    failed: { icon: XCircle, color: "text-red-500" },
    stopped: { icon: StopCircle, color: "text-orange-500" },
    alert: { icon: AlertTriangle, color: "text-yellow-500" }
  };

  const phaseConfig = {
    queued: { label: "Queued", color: "bg-slate-600 text-white" },
    basic_cleaning: { label: "Basic Cleaning", color: "bg-blue-600 text-white" },
    corrections: { label: "Corrections", color: "bg-purple-600 text-white" },
    data_quality: { label: "Data Quality", color: "bg-yellow-600 text-white" },
    processed: { label: "Processed", color: "bg-green-600 text-white" },
    concat: { label: "Concatenation", color: "bg-indigo-600 text-white" },
    completed: { label: "Completed", color: "bg-emerald-600 text-white" },
    failed: { label: "Failed", color: "bg-red-600 text-white" }
  };

  const getQualityColor = (score) => {
    if (!score) return "text-slate-400";
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const uniqueProjects = useMemo(() => {
    const projectNames = new Set();
    sources.forEach(source => {
      const projectName = getProjectName(source.dataset_id);
      if (projectName && projectName !== "—") projectNames.add(projectName);
    });
    return Array.from(projectNames).sort();
  }, [sources, datasets, projects]);

  const uniqueDatasets = useMemo(() => {
    const datasetNames = new Set();
    sources.forEach(source => {
      const datasetName = getDatasetName(source.dataset_id);
      if (datasetName && datasetName !== "Unassigned") datasetNames.add(datasetName);
    });
    return Array.from(datasetNames).sort();
  }, [sources, datasets]);

  const filteredSources = useMemo(() => {
    let filtered = sources.filter(source => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = source.name?.toLowerCase().includes(search);
        const matchesLocation = source.source_location?.toLowerCase().includes(search);
        if (!matchesName && !matchesLocation) return false;
      }

      // Project filter
      if (filters.project !== "all") {
        const projectName = getProjectName(source.dataset_id);
        if (projectName !== filters.project) return false;
      }

      // Dataset filter
      if (filters.dataset !== "all") {
        const datasetName = getDatasetName(source.dataset_id);
        if (datasetName !== filters.dataset) return false;
      }

      // Status filter
      if (filters.status !== "all" && source.status !== filters.status) return false;

      // Phase filter
      if (filters.phase !== "all" && source.phase !== filters.phase) return false;

      // Date filters
      if (filters.dateFrom && source.ingestion_date) {
        const sourceDate = new Date(source.ingestion_date);
        const fromDate = new Date(filters.dateFrom);
        if (sourceDate < fromDate) return false;
      }

      if (filters.dateTo && source.ingestion_date) {
        const sourceDate = new Date(source.ingestion_date);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (sourceDate > toDate) return false;
      }

      return true;
    });

    // Sort
    if (filters.sort === "priority") {
      // Priority: open and in_progress at top, then by last_run_date
      filtered.sort((a, b) => {
        const aPriority = (a.status === 'in_progress' || a.status === 'alert') ? 2 : 
                         (a.status === 'idle' || a.status === 'stopped') ? 1 : 0;
        const bPriority = (b.status === 'in_progress' || b.status === 'alert') ? 2 : 
                         (b.status === 'idle' || b.status === 'stopped') ? 1 : 0;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        // Secondary sort by last_run_date
        const aDate = a.last_run_date ? new Date(a.last_run_date) : new Date(0);
        const bDate = b.last_run_date ? new Date(b.last_run_date) : new Date(0);
        return bDate - aDate;
      });
    } else if (filters.sort === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sort === "date") {
      filtered.sort((a, b) => {
        const aDate = a.ingestion_date ? new Date(a.ingestion_date) : new Date(0);
        const bDate = b.ingestion_date ? new Date(b.ingestion_date) : new Date(0);
        return bDate - aDate;
      });
    }

    return filtered;
  }, [sources, filters, datasets, projects]);

  const clearFilters = () => {
    setFilters({
      search: "",
      project: "all",
      dataset: "all",
      status: "all",
      phase: "all",
      dateFrom: "",
      dateTo: "",
      sort: "priority"
    });
  };

  const hasActiveFilters = filters.search || filters.project !== "all" || filters.dataset !== "all" || 
    filters.status !== "all" || filters.phase !== "all" || filters.dateFrom || filters.dateTo;

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Data Sources</h1>
              <p className="text-slate-400">Monitor and manage data ingestion</p>
            </div>
            <Link to={createPageUrl("NewDataSource")}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6 bg-slate-800 border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-cyan-400" />
              <h3 className="font-medium text-white">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-slate-400 hover:text-white">
                  <ClearIcon className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Search</label>
                <Input
                  placeholder="Search by name or location..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Project</label>
                <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="all" className="text-white">All Projects</SelectItem>
                    {uniqueProjects.map(project => (
                      <SelectItem key={project} value={project} className="text-white">{project}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Dataset</label>
                <Select value={filters.dataset} onValueChange={(value) => setFilters(prev => ({ ...prev, dataset: value }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="All Datasets" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="all" className="text-white">All Datasets</SelectItem>
                    {uniqueDatasets.map(dataset => (
                      <SelectItem key={dataset} value={dataset} className="text-white">{dataset}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="all" className="text-white">All Statuses</SelectItem>
                    <SelectItem value="idle" className="text-white">Idle</SelectItem>
                    <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                    <SelectItem value="completed" className="text-white">Completed</SelectItem>
                    <SelectItem value="failed" className="text-white">Failed</SelectItem>
                    <SelectItem value="stopped" className="text-white">Stopped</SelectItem>
                    <SelectItem value="alert" className="text-white">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phase</label>
                <Select value={filters.phase} onValueChange={(value) => setFilters(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="All Phases" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">All Phases</SelectItem>
                    <SelectItem value="queued" className="text-white">Queued</SelectItem>
                    <SelectItem value="basic_cleaning" className="text-white">Basic Cleaning</SelectItem>
                    <SelectItem value="corrections" className="text-white">Corrections</SelectItem>
                    <SelectItem value="data_quality" className="text-white">Data Quality</SelectItem>
                    <SelectItem value="processed" className="text-white">Processed</SelectItem>
                    <SelectItem value="concat" className="text-white">Concatenation</SelectItem>
                    <SelectItem value="completed" className="text-white">Completed</SelectItem>
                    <SelectItem value="failed" className="text-white">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Ingestion From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Ingestion To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sort By</label>
                <Select value={filters.sort} onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="priority" className="text-white">Priority (Active First)</SelectItem>
                    <SelectItem value="name" className="text-white">Name (A-Z)</SelectItem>
                    <SelectItem value="date" className="text-white">Ingestion Date (Newest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              Showing {filteredSources.length} of {sources.length} data sources
            </div>
          </Card>

          {sources.length === 0 ? (
            <div className="text-center py-16">
              <GitBranch className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No data sources in queue</h3>
              <p className="text-slate-400 mb-6">Add your first data source to the processing queue</p>
              <Link to={createPageUrl("NewDataSource")}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Source
                </Button>
              </Link>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No data sources match your filters</h3>
              <p className="text-slate-400 mb-6">Try adjusting your filter criteria</p>
              <Button variant="outline" onClick={clearFilters} className="border-slate-700 text-white hover:bg-slate-700">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-stack-card md:space-y-stack-card-md">
              {filteredSources.map(source => {
                const StatusIcon = statusConfig[source.status]?.icon || Circle;
                const statusColor = statusConfig[source.status]?.color || "text-slate-400";
                const phaseInfo = phaseConfig[source.phase] || phaseConfig.queued;
                
                return (
                  <Link key={source.id} to={createPageUrl(`DataSourceDetail?id=${source.id}`)} className="block">
                    <Card className="p-4 bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusIcon className={`${statusColor} ${statusColor.includes('Loader2') ? 'animate-spin' : ''}`} />
                            <h3 className="font-semibold text-white group-hover:text-cyan-400">
                              {source.name}
                            </h3>
                            <Badge variant="outline" className="text-slate-300 border-slate-600">{source.type}</Badge>
                            <Badge className={phaseInfo.color}>{phaseInfo.label}</Badge>
                          </div>

                          {source.source_location && (
                            <div className="text-xs text-slate-400 font-mono truncate">
                              {source.source_location}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Dataset: <span className="text-cyan-400">{getDatasetName(source.dataset_id)}</span></span>
                            <span>•</span>
                            <span>Project: <span className="text-cyan-400">{getProjectName(source.dataset_id)}</span></span>
                          </div>

                          {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {source.quality_score && (
                              <div>
                                <div className="text-slate-400 text-xs">Quality Score</div>
                                <div className={cn("font-medium", getQualityColor(source.quality_score))}>
                                  {source.quality_score}%
                                </div>
                              </div>
                            )}
                            {source.records_processed > 0 && (
                              <div>
                                <div className="text-slate-400 text-xs">Processed</div>
                                <div className="font-medium text-white">{source.records_processed?.toLocaleString()}</div>
                              </div>
                            )}
                            {source.records_failed > 0 && (
                              <div>
                                <div className="text-slate-400 text-xs">Failed</div>
                                <div className="font-medium text-red-400">{source.records_failed}</div>
                              </div>
                            )}
                          </div> */}

                          {source.alert_message && (
                            <div className="flex items-start gap-2 p-2 mt-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-sm text-yellow-400">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              {source.alert_message}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 flex-shrink-0" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>


    </>
  );
}
