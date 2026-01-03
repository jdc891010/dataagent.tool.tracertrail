import { useState, useMemo } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, AlertCircle, Database, TrendingUp, CheckCircle } from "lucide-react";
import { differenceInDays } from "date-fns";
import AppNav from "@/components/navigation/AppNav";

export default function ProjectHealth() {
  const [selectedProject, setSelectedProject] = useState("all");

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });

  const { data: datasets = [], isLoading: datasetsLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => dataAgent.entities.Dataset.list()
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["data-sources"],
    queryFn: () => dataAgent.entities.DataSource.list()
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: () => dataAgent.entities.Issue.list()
  });

  const projectHealthData = useMemo(() => {
    return projects.map(project => {
      const projectDatasets = datasets.filter(d => d.project_id === project.id);
      const datasetNames = projectDatasets.map(d => d.name);
      
      const projectIssues = issues.filter(i => 
        i.project === project.name || datasetNames.includes(i.dataset)
      );
      
      const projectSources = sources.filter(s => 
        projectDatasets.some(d => d.id === s.dataset_id)
      );

      const openIssues = projectIssues.filter(i => !['fixed', 'verified', 'wont_fix'].includes(i.status));
      const criticalIssues = openIssues.filter(i => i.severity === 'critical');
      const highIssues = openIssues.filter(i => i.severity === 'high');
      
      // Calculate health score (0-100)
      let healthScore = 100;
      healthScore -= criticalIssues.length * 15;
      healthScore -= highIssues.length * 8;
      healthScore -= (openIssues.length - criticalIssues.length - highIssues.length) * 3;
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Recent activity (issues created in last 7 days)
      const recentIssues = projectIssues.filter(i => 
        differenceInDays(new Date(), new Date(i.created_date)) <= 7
      );

      return {
        id: project.id,
        name: project.name,
        healthScore,
        totalIssues: projectIssues.length,
        openIssues: openIssues.length,
        criticalIssues: criticalIssues.length,
        highIssues: highIssues.length,
        datasets: projectDatasets.length,
        sources: projectSources.length,
        recentActivity: recentIssues.length,
        status: project.status
      };
    }).sort((a, b) => a.healthScore - b.healthScore);
  }, [projects, datasets, sources, issues]);

  const filteredData = selectedProject === "all" 
    ? projectHealthData 
    : projectHealthData.filter(p => p.id === selectedProject);

  const aggregatedStats = useMemo(() => {
    const data = selectedProject === "all" ? projectHealthData : filteredData;
    return {
      totalProjects: data.length,
      totalIssues: data.reduce((sum, p) => sum + p.totalIssues, 0),
      openIssues: data.reduce((sum, p) => sum + p.openIssues, 0),
      criticalIssues: data.reduce((sum, p) => sum + p.criticalIssues, 0),
      totalDatasets: data.reduce((sum, p) => sum + p.datasets, 0),
      totalSources: data.reduce((sum, p) => sum + p.sources, 0),
      avgHealthScore: data.length > 0 
        ? Math.round(data.reduce((sum, p) => sum + p.healthScore, 0) / data.length)
        : 0
    };
  }, [projectHealthData, filteredData, selectedProject]);

  if (projectsLoading || datasetsLoading || sourcesLoading || issuesLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <AppNav />
        <div className="max-w-7xl mx-auto space-y-6 mt-8">
          <Skeleton className="h-32 w-full bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 bg-slate-800" />
            <Skeleton className="h-64 bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Project Health
            </h1>
            
            <div className="flex gap-2">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Projects</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id} className="focus:bg-slate-800 focus:text-white">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700 col-span-2 md:col-span-2 lg:col-span-1">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <div className={`text-3xl font-bold ${
                  aggregatedStats.avgHealthScore >= 80 ? 'text-green-400' :
                  aggregatedStats.avgHealthScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {aggregatedStats.avgHealthScore}%
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Avg Health</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <div className="text-2xl font-bold text-white">{aggregatedStats.totalProjects}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Projects</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <div className="text-2xl font-bold text-white">{aggregatedStats.totalDatasets}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Datasets</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <div className="text-2xl font-bold text-white">{aggregatedStats.openIssues}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Open Issues</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <div className="text-2xl font-bold text-red-400">{aggregatedStats.criticalIssues}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Critical</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <div className="text-2xl font-bold text-cyan-400">{aggregatedStats.totalSources}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Sources</div>
              </CardContent>
            </Card>
          </div>

          {/* Project List */}
          <div className="grid grid-cols-1 gap-6">
            {filteredData.map(project => (
              <Card key={project.id} className="bg-slate-800 border-slate-700 overflow-hidden">
                <div className="h-1 w-full bg-slate-700">
                  <div 
                    className={`h-full ${
                      project.healthScore >= 80 ? 'bg-green-500' :
                      project.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${project.healthScore}%` }}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{project.name}</h3>
                        <Badge variant="outline" className={`
                          ${project.status === 'active' ? 'border-green-500/30 text-green-400' : 'border-slate-500/30 text-slate-400'}
                        `}>
                          {project.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Database className="w-4 h-4 text-cyan-500" />
                          <span>{project.datasets} datasets</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span>{project.openIssues} issues</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span>{project.recentActivity} recent</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link to={createPageUrl(`IssueAnalytics?project=${project.id}`)}>
                          <Badge variant="secondary" className="bg-slate-700 hover:bg-slate-600 cursor-pointer">
                            Analytics
                          </Badge>
                        </Link>
                        <Link to={createPageUrl(`Projects?id=${project.id}`)}>
                          <Badge variant="secondary" className="bg-slate-700 hover:bg-slate-600 cursor-pointer">
                            Details
                          </Badge>
                        </Link>
                      </div>
                    </div>

                    {/* Mini Charts */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <div className="text-xs text-slate-400 mb-1">Issue Severity</div>
                        <div className="flex items-end gap-1 h-12">
                          <div className="flex-1 bg-red-500/20 rounded-t relative group h-full">
                            <div 
                              className="absolute bottom-0 w-full bg-red-500 rounded-t transition-all" 
                              style={{ height: `${project.totalIssues ? (project.criticalIssues / project.totalIssues) * 100 : 0}%` }}
                            />
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-slate-700">
                              {project.criticalIssues} Critical
                            </div>
                          </div>
                          <div className="flex-1 bg-orange-500/20 rounded-t relative group h-full">
                            <div 
                              className="absolute bottom-0 w-full bg-orange-500 rounded-t transition-all" 
                              style={{ height: `${project.totalIssues ? (project.highIssues / project.totalIssues) * 100 : 0}%` }}
                            />
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-slate-700">
                              {project.highIssues} High
                            </div>
                          </div>
                          <div className="flex-1 bg-blue-500/20 rounded-t relative group h-full">
                            <div 
                              className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all" 
                              style={{ height: `${project.totalIssues ? ((project.openIssues - project.criticalIssues - project.highIssues) / project.totalIssues) * 100 : 0}%` }}
                            />
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 border border-slate-700">
                              {project.openIssues - project.criticalIssues - project.highIssues} Other
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex flex-col justify-center items-center">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              className="text-slate-700"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 28}
                              strokeDashoffset={2 * Math.PI * 28 * (1 - project.healthScore / 100)}
                              className={`${
                                project.healthScore >= 80 ? 'text-green-500' :
                                project.healthScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                              } transition-all duration-1000 ease-out`}
                            />
                          </svg>
                          <div className="absolute text-sm font-bold text-white">{Math.round(project.healthScore)}</div>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Health Score</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredData.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-white mb-2">No Projects Found</h3>
                <p>Try selecting a different filter or create a new project.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}