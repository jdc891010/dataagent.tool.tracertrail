import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, Edit, Trash2, Database, GitBranch, AlertTriangle,
  Shield, User, Clock, CheckCircle, FolderTree
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import AppNav from "@/components/navigation/AppNav";
import DatasetForm from "@/components/forms/DatasetForm";
import DatasetLineageEditor from "@/components/lineage/DatasetLineageEditor";

export default function DatasetDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const datasetId = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: dataset, isLoading: datasetLoading } = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: async () => {
      const datasets = await dataAgent.entities.Dataset.filter({ id: datasetId });
      return datasets[0];
    },
    enabled: !!datasetId
  });

  const { data: project } = useQuery({
    queryKey: ["project", dataset?.project_id],
    queryFn: async () => {
      const projects = await dataAgent.entities.Project.filter({ id: dataset.project_id });
      return projects[0];
    },
    enabled: !!dataset?.project_id
  });

  const { data: dataSources = [] } = useQuery({
    queryKey: ["dataset-sources", datasetId],
    queryFn: () => dataAgent.entities.DataSource.filter({ dataset_id: datasetId }),
    enabled: !!datasetId
  });

  // Calculate progress
  const sourceProgress = {
    total: dataSources.length,
    queued: dataSources.filter(s => s.phase === 'queued').length,
    processing: dataSources.filter(s => ['basic_cleaning', 'corrections', 'data_quality', 'processed', 'concat'].includes(s.phase)).length,
    completed: dataSources.filter(s => s.phase === 'completed').length,
    failed: dataSources.filter(s => s.phase === 'failed').length
  };

  const { data: allIssues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => dataAgent.entities.Issue.list()
  });

  const relatedIssues = allIssues.filter(issue => issue.dataset === dataset?.name);

  const deleteMutation = useMutation({
    mutationFn: () => dataAgent.entities.Dataset.delete(datasetId),
    onSuccess: () => {
      toast.success("Dataset deleted");
      navigate(createPageUrl("Datasets"));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.Dataset.update(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });
      setShowEditForm(false);
      toast.success("Dataset updated");
    }
  });

  const governanceColors = {
    public: "bg-green-100 text-green-700",
    internal: "bg-blue-100 text-blue-700",
    confidential: "bg-orange-100 text-orange-700",
    restricted: "bg-red-100 text-red-700"
  };

  const statusColors = {
    active: "text-green-400",
    deprecated: "text-orange-400",
    planned: "text-blue-400"
  };

  if (datasetLoading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen bg-slate-950 p-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </>
    );
  }

  if (!dataset) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <Database className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Dataset not found</h2>
            <Link to={createPageUrl("Datasets")}>
              <Button>Back to Datasets</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link to={createPageUrl("Datasets")}>
              <Button variant="ghost" size="sm" className="mb-4 text-slate-300 hover:text-cyan-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Datasets
              </Button>
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-6 h-6 text-blue-400" />
                  <Badge className={governanceColors[dataset.governance_classification]}>
                    <Shield className="w-3 h-3 mr-1" />
                    {dataset.governance_classification}
                  </Badge>
                  <Badge className={statusColors[dataset.status]}>
                    {dataset.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {dataset.status}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-white">{dataset.name}</h1>
                {dataset.description && (
                  <p className="text-slate-400 mt-2">{dataset.description}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this dataset. Data sources linked to this dataset will remain but will lose their connection. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dataset Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Dataset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Project</div>
                      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                        <div className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 cursor-pointer">
                          <FolderTree className="w-4 h-4" />
                          {project.name}
                        </div>
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {dataset.source_system && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Source System</div>
                        <div className="font-medium text-white">{dataset.source_system}</div>
                      </div>
                    )}
                    
                    {dataset.source_type && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Source Type</div>
                        <div className="font-medium text-white capitalize">{dataset.source_type.replace('_', ' ')}</div>
                      </div>
                    )}
                    
                    {dataset.refresh_frequency && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Refresh Frequency</div>
                        <div className="font-medium text-white capitalize">{dataset.refresh_frequency.replace('_', ' ')}</div>
                      </div>
                    )}

                    {dataset.data_steward && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Data Steward
                        </div>
                        <div className="font-medium text-white">{dataset.data_steward}</div>
                      </div>
                    )}

                    {dataset.data_owner && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Data Owner
                        </div>
                        <div className="font-medium text-white">{dataset.data_owner}</div>
                      </div>
                    )}

                    {dataset.retention_period && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Retention Period
                        </div>
                        <div className="font-medium text-white">{dataset.retention_period}</div>
                      </div>
                    )}
                  </div>

                  {dataset.contains_pii && (
                    <div className="p-3 bg-orange-950/30 border border-orange-900/30 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-400">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Contains PII</span>
                      </div>
                    </div>
                  )}

                  {dataset.compliance_requirements?.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Compliance Requirements</div>
                      <div className="flex flex-wrap gap-2">
                        {dataset.compliance_requirements.map((req, i) => (
                          <Badge key={i} variant="outline" className="text-white">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {dataset.tags?.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {dataset.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <GitBranch className="w-5 h-5 text-green-400" />
                    Data Sources ({dataSources.length})
                  </CardTitle>
                  <Link to={createPageUrl("NewDataSource")}>
                    <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                      Add Source
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {dataSources.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No data sources linked yet</p>
                  ) : (
                    <div className="space-y-3">
                      {dataSources.map(source => (
                        <Link key={source.id} to={createPageUrl(`DataSourceDetail?id=${source.id}`)}>
                          <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-cyan-500/50 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">{source.name}</div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {source.type} • {source.status}
                                </div>
                              </div>
                              {/* {source.quality_score && (
                                <div className="text-right">
                                  <div className="text-sm font-medium text-white">{source.quality_score}%</div>
                                  <div className="text-xs text-slate-400">Quality</div>
                                </div>
                              )} */}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lineage Editor */}
              <DatasetLineageEditor datasetId={datasetId} currentProjectId={dataset.project_id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Issues */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-white">
                    <AlertTriangle className="w-4 h-4" />
                    Related Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedIssues.length === 0 ? (
                    <p className="text-sm text-slate-400">No issues reported</p>
                  ) : (
                    <div className="space-y-2">
                      {relatedIssues.slice(0, 5).map(issue => (
                        <Link key={issue.id} to={createPageUrl(`IssueDetail?id=${issue.id}`)}>
                          <div className="p-2 bg-slate-900 border border-slate-700 rounded hover:border-cyan-500/50 cursor-pointer transition-colors">
                            <div className="text-sm font-medium text-white line-clamp-1">{issue.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${issue.severity === 'critical' ? 'bg-red-100 text-red-700' : issue.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {issue.severity}
                              </Badge>
                              <span className="text-xs text-slate-400">{issue.status}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {relatedIssues.length > 5 && (
                        <p className="text-xs text-slate-400 text-center">
                          +{relatedIssues.length - 5} more issues
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm text-white">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <div className="text-slate-400">Created</div>
                    <div className="text-white">{format(new Date(dataset.created_date), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Last Updated</div>
                    <div className="text-white">{format(new Date(dataset.updated_date), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Created By</div>
                    <div className="text-white">{dataset.created_by}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Dataset</DialogTitle>
          </DialogHeader>
          <DatasetForm
            dataset={dataset}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => setShowEditForm(false)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
