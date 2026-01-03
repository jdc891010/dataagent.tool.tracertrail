import { useState, useRef } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, Edit, Trash2, Plus, Calendar, User, Hash, 
  Table2, Code2, AlertTriangle, FolderTree, Database, FileText,
  Upload, Image, FileCode, CheckCircle, X, Archive, ArrowRight, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SeverityBadge from "@/components/issues/SeverityBadge";
import StatusBadge from "@/components/issues/StatusBadge";
import IssueTypeBadge from "@/components/issues/IssueTypeBadge";
import CodeBlock from "@/components/issues/CodeBlock";
import CodeSnippetForm from "@/components/forms/CodeSnippetForm";
import AffectedColumnForm from "@/components/forms/AffectedColumnForm";
import DataLineageGraph from "@/components/issues/DataLineageGraph";
// import InteractiveLineageGraph from "@/components/lineage/InteractiveLineageGraph";
import IssueComments from "@/components/issues/IssueComments";
import IssueTestForm from "@/components/forms/IssueTestForm";
import IssueTestCard from "@/components/issues/IssueTestCard";

export default function IssueDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const issueId = urlParams.get("id");
  const navigate = useNavigate();
  const screenshotInputRef = useRef(null);
  const logInputRef = useRef(null);
  const queryClient = useQueryClient();

  const [showSnippetForm, setShowSnippetForm] = useState(false);
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadingLogFile, setUploadingLogFile] = useState(false);
  const [showInteractiveLineage, setShowInteractiveLineage] = useState(false);
  const [showDataLineage, setShowDataLineage] = useState(true);

  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      const issues = await dataAgent.entities.Issue.filter({ id: issueId });
      return issues[0] || null;
    },
    enabled: !!issueId
  });

  const { data: snippets = [], isLoading: snippetsLoading } = useQuery({
    queryKey: ["snippets", issueId],
    queryFn: () => dataAgent.entities.CodeSnippet.filter({ issue_id: issueId }, "order_index"),
    enabled: !!issueId
  });

  const { data: affectedColumns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["columns", issueId],
    queryFn: () => dataAgent.entities.AffectedColumn.filter({ issue_id: issueId }),
    enabled: !!issueId
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["issue-comments", issueId],
    queryFn: () => dataAgent.entities.IssueComment.filter({ issue_id: issueId }, "created_date"),
    enabled: !!issueId
  });

  const { data: allIssues = [] } = useQuery({
    queryKey: ["all-issues"],
    queryFn: () => dataAgent.entities.Issue.list()
  });

  const { data: allDataSources = [] } = useQuery({
    queryKey: ["all-data-sources"],
    queryFn: () => dataAgent.entities.DataSource.list()
  });

  const { data: allDatasets = [] } = useQuery({
    queryKey: ["all-datasets"],
    queryFn: () => dataAgent.entities.Dataset.list()
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ["all-projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });

  const { data: tests = [] } = useQuery({
    queryKey: ["issue-tests", issueId],
    queryFn: () => dataAgent.entities.IssueTest.filter({ issue_id: issueId }, "-executed_at"),
    enabled: !!issueId
  });

  const { data: dataSource } = useQuery({
    queryKey: ["data-source", issue?.data_source_id],
    queryFn: async () => {
      const sources = await dataAgent.entities.DataSource.filter({ id: issue.data_source_id });
      return sources[0] || null;
    },
    enabled: !!issue?.data_source_id
  });

  const { data: dataset } = useQuery({
    queryKey: ["dataset", dataSource?.dataset_id],
    queryFn: async () => {
      const datasets = await dataAgent.entities.Dataset.filter({ id: dataSource.dataset_id });
      return datasets[0] || null;
    },
    enabled: !!dataSource?.dataset_id
  });

  const { data: project } = useQuery({
    queryKey: ["project", dataset?.project_id],
    queryFn: async () => {
      const projects = await dataAgent.entities.Project.filter({ id: dataset.project_id });
      return projects[0] || null;
    },
    enabled: !!dataset?.project_id
  });

  const deleteMutation = useMutation({
    mutationFn: () => dataAgent.entities.Issue.delete(issueId),
    onSuccess: () => {
      toast.success("Issue deleted");
      navigate(createPageUrl("Dashboard"));
    }
  });

  const createSnippetMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.CodeSnippet.create({ ...data, issue_id: issueId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets", issueId] });
      setShowSnippetForm(false);
      toast.success("Snippet added");
    }
  });

  const updateSnippetMutation = useMutation({
    mutationFn: ({ id, data }) => dataAgent.entities.CodeSnippet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets", issueId] });
      setEditingSnippet(null);
      toast.success("Snippet updated");
    }
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: (id) => dataAgent.entities.CodeSnippet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets", issueId] });
      toast.success("Snippet deleted");
    }
  });

  const createColumnMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.AffectedColumn.create({ ...data, issue_id: issueId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", issueId] });
      setShowColumnForm(false);
      toast.success("Column added");
    }
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id) => dataAgent.entities.AffectedColumn.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", issueId] });
      toast.success("Column removed");
    }
  });

  const createTestMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.IssueTest.create({ 
      ...data, 
      issue_id: issueId,
      executed_by: dataAgent.auth.me().then(u => u.email).catch(() => "Unknown")
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue-tests", issueId] });
      setShowTestDialog(false);
      toast.success("Test added");
    }
  });

  const updateIssueMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.Issue.update(issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["all-issues"] });
      toast.success("Issue updated");
    }
  });

  const handleUploadScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    try {
      const { file_url } = await dataAgent.integrations.Core.UploadFile({ file });
      const currentScreenshots = issue.screenshots || [];
      await updateIssueMutation.mutateAsync({
        screenshots: [...currentScreenshots, file_url]
      });
      toast.success("Screenshot uploaded");
    } catch {
      toast.error("Failed to upload screenshot");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleUploadLogFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogFile(true);
    try {
      const { file_url } = await dataAgent.integrations.Core.UploadFile({ file });
      const currentLogs = issue.log_files || [];
      await updateIssueMutation.mutateAsync({
        log_files: [...currentLogs, file_url]
      });
      toast.success("Log file uploaded");
    } catch {
      toast.error("Failed to upload log file");
    } finally {
      setUploadingLogFile(false);
    }
  };

  const handleRemoveScreenshot = async (urlToRemove) => {
    const updatedScreenshots = issue.screenshots.filter(url => url !== urlToRemove);
    await updateIssueMutation.mutateAsync({ screenshots: updatedScreenshots });
  };

  const handleRemoveLogFile = async (urlToRemove) => {
    const updatedLogs = issue.log_files.filter(url => url !== urlToRemove);
    await updateIssueMutation.mutateAsync({ log_files: updatedLogs });
  };

  const handleStatusChangeToFixed = () => {
    if (tests.length === 0) {
      setShowTestDialog(true);
    } else {
      updateIssueMutation.mutate({ status: "fixed" });
    }
  };

  if (issueLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-32 bg-slate-800" />
          <Skeleton className="h-48 bg-slate-800" />
          <Skeleton className="h-32 bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Issue not found</h2>
          <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">Back to Dashboard</Button>
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-slate-400">#{issue.id?.slice(-6)}</span>
                <SeverityBadge severity={issue.severity} />
                <StatusBadge status={issue.status} />
              </div>
              <h1 className="text-2xl font-bold text-white">{issue.title}</h1>
            </div>
            
            <div className="flex gap-2">
              <Link to={createPageUrl(`EditIssue?id=${issue.id}`)}>
                <Button variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-0" aria-label="Edit Issue">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-slate-700 text-red-400 hover:text-red-300 hover:bg-red-950/30" aria-label="Delete Issue">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete Issue</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      This will permanently delete this issue and all associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Data Source Traceability - Prominent Display */}
        {dataSource && (
          <Card className="bg-slate-800 border-cyan-500/50 shadow-lg shadow-cyan-500/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-cyan-400" />
                Data Source Traceability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-900/50 rounded-lg border border-cyan-500/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Data Source
                    </div>
                    <Link to={createPageUrl(`DataSourceDetail?id=${dataSource.id}`)}>
                      <div className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium text-lg">
                        {dataSource.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 capitalize">
                        {dataSource.type} • {dataSource.phase}
                      </div>
                    </Link>
                    {dataSource.source_location && (
                      <div className="text-xs text-slate-400 font-mono mt-2 p-2 bg-slate-800 rounded">
                        {dataSource.source_location}
                      </div>
                    )}
                  </div>
                  {dataset && (
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Dataset</div>
                      <Link to={createPageUrl(`DatasetDetail?id=${dataset.id}`)}>
                        <div className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium text-lg">
                          {dataset.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {dataset.source_system || dataset.source_type}
                        </div>
                      </Link>
                    </div>
                  )}
                  {project && (
                    <div>
                      <div className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                        <FolderTree className="w-3 h-3" />
                        Project
                      </div>
                      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                        <div className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium text-lg">
                          {project.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 capitalize">
                          {project.governance_classification}
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="space-y-6">

          {/* Interactive Data Lineage Graph 
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <button 
                onClick={() => setShowInteractiveLineage(!showInteractiveLineage)}
                className="w-full flex items-center justify-between text-left"
              >
                <CardTitle className="text-lg text-white">Interactive Data Lineage</CardTitle>
                <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform", showInteractiveLineage && "rotate-90")} />
              </button>
            </CardHeader>
            {showInteractiveLineage && (
              <CardContent>
                <InteractiveLineageGraph
                  currentEntity={issue}
                  entityType="issue"
                  project={project}
                  dataset={dataset}
                  dataSource={dataSource}
                  issues={allIssues}
                  allDataSources={allDataSources}
                  allDatasets={allDatasets}
                  allProjects={allProjects}
                />
              </CardContent>
            )}
          </Card>
          */}

          {/* Original Data Lineage Graph */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <button 
                onClick={() => setShowDataLineage(!showDataLineage)}
                className="w-full flex items-center justify-between text-left"
              >
                <CardTitle className="text-lg text-white">Data Lineage Flow</CardTitle>
                <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform", showDataLineage && "rotate-90")} />
              </button>
            </CardHeader>
            {showDataLineage && (
              <CardContent>
                <DataLineageGraph issue={issue} allIssues={allIssues} />
              </CardContent>
            )}
          </Card>

          {/* Overview Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <IssueTypeBadge type={issue.issue_type} />
                {issue.tags?.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>

              {dataSource && (
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        Data Source
                      </div>
                      <Link to={createPageUrl(`DataSourceDetail?id=${dataSource.id}`)}>
                        <div className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium text-lg flex items-center gap-2">
                          {dataSource.name}
                          <ArrowRight className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-slate-500 mt-1 capitalize">
                          {dataSource.type} • {dataSource.phase} • Quality: {dataSource.quality_score || 0}%
                        </div>
                      </Link>
                    </div>
                    {dataSource.source_location && (
                      <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-2 rounded max-w-xs truncate">
                        {dataSource.source_location}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {(dataSource || project || dataset || issue.project || issue.dataset || issue.file || issue.source_type || issue.target_type) && (
               <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                 <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                   <FolderTree className="w-4 h-4" />
                   Data Lineage
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                   {project && (
                     <div>
                       <div className="text-slate-400 mb-1 flex items-center gap-1">
                         <FolderTree className="w-3 h-3" />
                         Project
                       </div>
                       <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                         <div className="font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer">{project.name}</div>
                       </Link>
                     </div>
                   )}
                   {!project && issue.project && (
                     <div>
                       <div className="text-slate-400 mb-1">Project</div>
                       <div className="font-medium font-mono text-white">{issue.project}</div>
                     </div>
                   )}
                   {dataset && (
                     <div>
                       <div className="text-slate-400 mb-1 flex items-center gap-1">
                         <Database className="w-3 h-3" />
                         Dataset
                       </div>
                       <Link to={createPageUrl(`DatasetDetail?id=${dataset.id}`)}>
                         <div className="font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer">{dataset.name}</div>
                       </Link>
                     </div>
                   )}
                   {!dataset && issue.dataset && (
                     <div>
                       <div className="text-slate-400 mb-1">Dataset</div>
                       <div className="font-medium font-mono text-white">{issue.dataset}</div>
                     </div>
                   )}
                   {dataSource && (
                     <div>
                       <div className="text-slate-400 mb-1 flex items-center gap-1">
                         <Database className="w-3 h-3" />
                         Data Source
                       </div>
                       <Link to={createPageUrl(`DataSourceDetail?id=${dataSource.id}`)}>
                         <div className="font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer">{dataSource.name}</div>
                         <div className="text-xs text-slate-500 mt-0.5 capitalize">{dataSource.type} • {dataSource.phase}</div>
                       </Link>
                     </div>
                   )}
                   {issue.file && (
                     <div>
                       <div className="text-slate-400 mb-1">File</div>
                       <div className="font-medium font-mono text-white">{issue.file}</div>
                     </div>
                   )}
                   {issue.source_type && (
                     <div>
                       <div className="text-slate-400 mb-1">Source Type</div>
                       <div className="font-medium text-white capitalize">{issue.source_type.replace('_', ' ')}</div>
                     </div>
                   )}
                   {issue.target_type && (
                     <div>
                       <div className="text-slate-400 mb-1">Target Type</div>
                       <div className="font-medium text-white capitalize">{issue.target_type.replace('_', ' ')}</div>
                     </div>
                   )}
                 </div>
               </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {dataSource && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <Database className="w-3 h-3" />
                      Data Source
                    </div>
                    <Link to={createPageUrl(`DataSourceDetail?id=${dataSource.id}`)}>
                      <div className="font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer">{dataSource.name}</div>
                    </Link>
                  </div>
                )}
                {issue.assigned_to && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <User className="w-3 h-3" />
                      Assigned To
                    </div>
                    <div className="font-medium text-white">{issue.assigned_to}</div>
                  </div>
                )}
                {issue.due_date && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <Calendar className="w-3 h-3" />
                      Due Date
                    </div>
                    <div className="font-medium text-white">{format(new Date(issue.due_date), "MMM d, yyyy")}</div>
                  </div>
                )}
                {issue.discovery_date && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <Calendar className="w-3 h-3" />
                      Discovered
                    </div>
                    <div className="font-medium text-white">{format(new Date(issue.discovery_date), "MMM d, yyyy")}</div>
                  </div>
                )}
                {issue.occurrence_date && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <Calendar className="w-3 h-3" />
                      Occurred
                    </div>
                    <div className="font-medium text-white">{format(new Date(issue.occurrence_date), "MMM d, yyyy")}</div>
                  </div>
                )}
                {issue.reporter && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <User className="w-3 h-3" />
                      Reporter
                    </div>
                    <div className="font-medium text-white">{issue.reporter}</div>
                  </div>
                )}
                {issue.owner && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <User className="w-3 h-3" />
                      Owner
                    </div>
                    <div className="font-medium text-white">{issue.owner}</div>
                  </div>
                )}
                {issue.rows_affected && (
                  <div>
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <Hash className="w-3 h-3" />
                      Rows Affected
                    </div>
                    <div className="font-medium text-white">{issue.rows_affected.toLocaleString()}</div>
                  </div>
                )}
              </div>

              {issue.description && (
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Description</h4>
                  <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                    <ReactMarkdown>{issue.description}</ReactMarkdown>
                  </div>
                </div>
              )}

              {issue.impact_description && (
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Impact</h4>
                  <p className="text-slate-300">{issue.impact_description}</p>
                </div>
              )}

              {issue.root_cause && (
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Root Cause</h4>
                  <p className="text-slate-300">{issue.root_cause}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Affected Columns */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Table2 className="w-5 h-5 text-cyan-400" />
                Affected Tables/Columns
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowColumnForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
            </CardHeader>
            <CardContent>
              {showColumnForm && (
                <div className="mb-4">
                  <AffectedColumnForm
                    onSubmit={(data) => createColumnMutation.mutate(data)}
                    onCancel={() => setShowColumnForm(false)}
                    isLoading={createColumnMutation.isPending}
                  />
                </div>
              )}
              
              {columnsLoading ? (
                <Skeleton className="h-20 bg-slate-700" />
              ) : affectedColumns.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No affected columns specified
                </p>
              ) : (
                <div className="space-y-2">
                  {affectedColumns.map(col => (
                    <div 
                      key={col.id}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="font-mono text-sm">
                        {col.schema_name && <span className="text-slate-400">{col.schema_name}.</span>}
                        <span className="text-white">{col.table_name}</span>
                        {col.column_name && <span className="text-cyan-400">.{col.column_name}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                        onClick={() => deleteColumnMutation.mutate(col.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Snippets */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5 text-cyan-400" />
                Code Snippets
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowSnippetForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          <Plus className="w-4 h-4 mr-1" />
          Add Snippet
        </Button>
            </CardHeader>
            <CardContent>
              {showSnippetForm && (
                <div className="mb-4">
                  <CodeSnippetForm
                    onSubmit={(data) => createSnippetMutation.mutate(data)}
                    onCancel={() => setShowSnippetForm(false)}
                    isLoading={createSnippetMutation.isPending}
                  />
                </div>
              )}

              {editingSnippet && (
                <div className="mb-4">
                  <CodeSnippetForm
                    snippet={editingSnippet}
                    onSubmit={(data) => updateSnippetMutation.mutate({ id: editingSnippet.id, data })}
                    onCancel={() => setEditingSnippet(null)}
                    isLoading={updateSnippetMutation.isPending}
                  />
                </div>
              )}
              
              {snippetsLoading ? (
                <Skeleton className="h-32 bg-slate-700" />
              ) : snippets.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No code snippets added yet
                </p>
              ) : (
                <div className="space-y-4">
                  {snippets.map(snippet => (
                    <div key={snippet.id} className="relative group">
                      <CodeBlock snippet={snippet} />
                      <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 bg-slate-700/80 hover:bg-slate-600"
                          onClick={() => {
                            const solution = {
                              title: `Solution for: ${issue.title}`,
                              code: snippet.code,
                              language: snippet.language,
                              description: snippet.description,
                              issue_type: issue.issue_type,
                              source_issue_id: issue.id
                            };
                            dataAgent.entities.VaultSolution.create(solution).then(() => {
                              toast.success("Added to vault");
                            });
                          }}
                        >
                          <Archive className="w-3 h-3 text-cyan-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 bg-slate-700/80 hover:bg-slate-600"
                          onClick={() => setEditingSnippet(snippet)}
                        >
                          <Edit className="w-3 h-3 text-white" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 bg-slate-700/80 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          onClick={() => deleteSnippetMutation.mutate(snippet.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
              </Card>

              {/* Screenshots */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Image className="w-5 h-5 text-cyan-400" />
                    Screenshots
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={uploadingScreenshot} 
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                    onClick={() => screenshotInputRef.current.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploadingScreenshot ? "Uploading..." : "Upload"}
                  </Button>
                    <input
                      type="file"
                      ref={screenshotInputRef}
                      accept="image/*"
                      onChange={handleUploadScreenshot}
                      className="hidden"
                    />
                </CardHeader>
                <CardContent>
                  {!issue.screenshots?.length ? (
                    <p className="text-sm text-slate-400 text-center py-4">No screenshots uploaded</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {issue.screenshots.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-700 hover:opacity-80 transition-opacity" />
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveScreenshot(url)}
                          >
                            <X className="w-3 h-3 text-white" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Log Files */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <FileCode className="w-5 h-5 text-cyan-400" />
                    Log Files
                  </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={uploadingLogFile} 
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                      onClick={() => logInputRef.current.click()}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {uploadingLogFile ? "Uploading..." : "Upload"}
                    </Button>
                    <input
                      type="file"
                      ref={logInputRef}
                      onChange={handleUploadLogFile}
                      className="hidden"
                    />
                </CardHeader>
                <CardContent>
                  {!issue.log_files?.length ? (
                    <p className="text-sm text-slate-400 text-center py-4">No log files uploaded</p>
                  ) : (
                    <div className="space-y-2">
                      {issue.log_files.map((url, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Log file {idx + 1}
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                            onClick={() => handleRemoveLogFile(url)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Validation Tests */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    Validation Tests
                  </CardTitle>
                  {issue.status !== "fixed" && issue.status !== "verified" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleStatusChangeToFixed}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            Mark as Fixed
          </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {tests.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No validation tests recorded
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {tests.map((test) => (
                        <IssueTestCard key={test.id} test={test} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments & Activity */}
              <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
              <IssueComments issueId={issueId} comments={comments} issue={issue} />
              </CardContent>
              </Card>
              </div>
              </div>

              {/* Test Dialog */}
              <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Validation Test</DialogTitle>
                    <p className="text-sm text-slate-400">
                      Before marking this issue as fixed, please document the test that validates the fix.
                    </p>
                  </DialogHeader>
                  <IssueTestForm
                    onSubmit={async (data) => {
                      await createTestMutation.mutateAsync(data);
                      await updateIssueMutation.mutateAsync({ status: "fixed" });
                    }}
                    onCancel={() => setShowTestDialog(false)}
                    isLoading={createTestMutation.isPending || updateIssueMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
              </div>
              );
              }