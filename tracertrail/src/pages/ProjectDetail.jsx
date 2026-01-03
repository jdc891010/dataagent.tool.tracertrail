import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FolderTree, Database, Shield, User, Calendar, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import AppNav from "@/components/navigation/AppNav";

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const projects = await dataAgent.entities.Project.filter({ id: projectId });
      return projects[0] || null;
    },
    enabled: !!projectId
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ["project-datasets", projectId],
    queryFn: () => dataAgent.entities.Dataset.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const { data: allSources = [] } = useQuery({
    queryKey: ["data-sources"],
    queryFn: () => dataAgent.entities.DataSource.list()
  });

  // Calculate project-level progress
  const projectSources = allSources.filter(s => 
    datasets.some(d => d.id === s.dataset_id)
  );

  const projectProgress = {
    totalDatasets: datasets.length,
    completedDatasets: datasets.filter(d => {
      const sources = allSources.filter(s => s.dataset_id === d.id);
      return sources.length > 0 && sources.every(s => s.phase === 'completed');
    }).length,
    totalSources: projectSources.length,
    byPhase: {
      queued: projectSources.filter(s => s.phase === 'queued').length,
      basic_cleaning: projectSources.filter(s => s.phase === 'basic_cleaning').length,
      corrections: projectSources.filter(s => s.phase === 'corrections').length,
      data_quality: projectSources.filter(s => s.phase === 'data_quality').length,
      processed: projectSources.filter(s => s.phase === 'processed').length,
      concat: projectSources.filter(s => s.phase === 'concat').length,
      completed: projectSources.filter(s => s.phase === 'completed').length,
      failed: projectSources.filter(s => s.phase === 'failed').length
    }
  };

  const { data: allDatasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => dataAgent.entities.Dataset.list()
  });

  const updateDatasetMutation = useMutation({
    mutationFn: ({ datasetId, data }) => dataAgent.entities.Dataset.update(datasetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-datasets", projectId] });
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset updated");
      setSelectedDatasetId("");
    }
  });

  const handleAddDataset = () => {
    if (!selectedDatasetId) return;
    updateDatasetMutation.mutate({
      datasetId: selectedDatasetId,
      data: { project_id: projectId }
    });
  };

  const handleRemoveDataset = (datasetId) => {
    updateDatasetMutation.mutate({
      datasetId: datasetId,
      data: { project_id: null }
    });
  };

  const availableDatasets = allDatasets.filter(
    d => !d.project_id || d.project_id === projectId
  );

  const { data: allIssues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => dataAgent.entities.Issue.list()
  });

  const projectIssues = allIssues.filter(i => {
    const matchesProject = i.project === project?.name;
    const datasetInProject = datasets.some(d => d.name === i.dataset);
    return matchesProject || datasetInProject;
  });
  const openIssues = projectIssues.filter(i => !['fixed', 'verified', 'wont_fix'].includes(i.status));
  const criticalIssues = openIssues.filter(i => i.severity === 'critical');

  const governanceColors = {
    public: "bg-green-100 text-green-700",
    internal: "bg-blue-100 text-blue-700",
    confidential: "bg-orange-100 text-orange-700",
    restricted: "bg-red-100 text-red-700"
  };

  if (projectLoading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen bg-slate-950 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-8 w-32 bg-slate-800" />
            <Skeleton className="h-48 bg-slate-800" />
          </div>
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
            <Link to={createPageUrl("Projects")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Back to Projects
              </Button>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to={createPageUrl("Projects")}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-300 hover:text-blue-400 hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {project.name}
              </h1>
                {project.description && (
                  <p className="text-slate-400">{project.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Project Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Datasets Completed</span>
                    <span className="text-white font-medium">
                      {projectProgress.completedDatasets} / {projectProgress.totalDatasets}
                    </span>
                  </div>
                  <Progress 
                    value={projectProgress.totalDatasets > 0 ? (projectProgress.completedDatasets / projectProgress.totalDatasets) * 100 : 0} 
                    className="h-3"
                  />
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <div className="text-sm text-slate-400 mb-2">Data Sources by Phase ({projectProgress.totalSources} total)</div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-900/50 p-2 rounded">
                      <div className="font-bold text-slate-300">{projectProgress.byPhase.queued}</div>
                      <div className="text-slate-500">Queued</div>
                    </div>
                    <div className="bg-blue-900/20 p-2 rounded">
                      <div className="font-bold text-blue-400">{projectProgress.byPhase.basic_cleaning}</div>
                      <div className="text-slate-500">Cleaning</div>
                    </div>
                    <div className="bg-purple-900/20 p-2 rounded">
                      <div className="font-bold text-purple-400">{projectProgress.byPhase.corrections}</div>
                      <div className="text-slate-500">Corrections</div>
                    </div>
                    <div className="bg-yellow-900/20 p-2 rounded">
                      <div className="font-bold text-yellow-400">{projectProgress.byPhase.data_quality}</div>
                      <div className="text-slate-500">Quality</div>
                    </div>
                    <div className="bg-green-900/20 p-2 rounded">
                      <div className="font-bold text-green-400">{projectProgress.byPhase.processed}</div>
                      <div className="text-slate-500">Processed</div>
                    </div>
                    <div className="bg-indigo-900/20 p-2 rounded">
                      <div className="font-bold text-indigo-400">{projectProgress.byPhase.concat}</div>
                      <div className="text-slate-500">Concat</div>
                    </div>
                    <div className="bg-emerald-900/20 p-2 rounded">
                      <div className="font-bold text-emerald-400">{projectProgress.byPhase.completed}</div>
                      <div className="text-slate-500">Completed</div>
                    </div>
                    <div className="bg-red-900/20 p-2 rounded">
                      <div className="font-bold text-red-400">{projectProgress.byPhase.failed}</div>
                      <div className="text-slate-500">Failed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">Status</div>
                    <div className="font-medium text-white capitalize">{project.status}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Datasets</div>
                    <div className="font-medium text-white">{datasets.length}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Open Issues</div>
                    <div className="font-medium text-white">{openIssues.length}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Critical Issues</div>
                    <div className="font-medium text-red-400">{criticalIssues.length}</div>
                  </div>
                </div>

                {/* Time tracking moved to v2
                <div className="pt-4 border-t border-slate-700">
                   <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-medium text-white">Total Processing Time</h4>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {projectTimeString}
                  </div>
                </div>
                */}

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-medium text-white">Governance</h4>
                  </div>
                  <Badge className={governanceColors[project.governance_classification]}>
                    {project.governance_classification}
                  </Badge>
                </div>

                {project.data_steward && (
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <User className="w-3 h-3" />
                      Data Steward
                    </div>
                    <div className="font-medium text-white">{project.data_steward}</div>
                  </div>
                )}

                {project.data_owner && (
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      <User className="w-3 h-3" />
                      Data Owner
                    </div>
                    <div className="font-medium text-white">{project.data_owner}</div>
                  </div>
                )}

                {project.compliance_requirements?.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Compliance Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.compliance_requirements.map((req, i) => (
                        <Badge key={i} variant="outline" className="border-cyan-500 text-cyan-400">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.tags?.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <Calendar className="w-3 h-3" />
                    Created
                  </div>
                  <div className="text-sm text-white">
                    {format(new Date(project.created_date), "MMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datasets */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Datasets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                    <SelectTrigger className="flex-1 bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select a dataset to add" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {availableDatasets.map(dataset => (
                        <SelectItem key={dataset.id} value={dataset.id} className="text-white focus:bg-slate-800 focus:text-white">
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddDataset}
                    disabled={!selectedDatasetId || updateDatasetMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {datasets.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No datasets in this project</p>
                ) : (
                  <div className="space-y-2">
                    {datasets.map(dataset => (
                      <div key={dataset.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                        <Link to={createPageUrl(`DatasetDetail?id=${dataset.id}`)} className="flex-1">
                          <div className="hover:text-cyan-400 transition-colors">
                            <h4 className="font-medium text-white mb-1">{dataset.name}</h4>
                            {dataset.description && (
                              <p className="text-xs text-slate-400">{dataset.description}</p>
                            )}
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDataset(dataset.id)}
                          disabled={updateDatasetMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Issues */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-cyan-400" />
                  Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectIssues.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No issues logged for this project</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectIssues.slice(0, 5).map(issue => (
                      <Link key={issue.id} to={createPageUrl(`IssueDetail?id=${issue.id}`)}>
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">{issue.title}</h4>
                            <Badge className={`text-xs text-white ${
                              issue.severity === 'critical' ? 'bg-red-600' :
                              issue.severity === 'high' ? 'bg-orange-600' :
                              issue.severity === 'medium' ? 'bg-yellow-600' :
                              'bg-blue-600'
                            }`}>
                              {issue.severity}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {projectIssues.length > 5 && (
                      <p className="text-xs text-slate-400 text-center pt-2">
                        And {projectIssues.length - 5} more issues...
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
