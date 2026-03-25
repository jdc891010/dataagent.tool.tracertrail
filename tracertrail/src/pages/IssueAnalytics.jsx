import { useMemo } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertTriangle, GitBranch, Target } from "lucide-react";
import AppNav from "@/components/navigation/AppNav";

export default function IssueAnalytics() {
  const { data: issues = [], isLoading, error } = useQuery({
    queryKey: ["issues"],
    queryFn: () => dataAgent.entities.Issue.list(),
    retry: 1,
  });

  if (error) {
    console.error("Error loading issues:", error);
  }

  // Cluster issues by similarity
  const issueClusters = useMemo(() => {
    const clusters = {};
    
    issues.forEach(issue => {
      // Cluster by project + issue_type
      const clusterKey = `${issue.project || 'uncategorized'}_${issue.issue_type}`;
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = {
          id: clusterKey,
          project: issue.project,
          type: issue.issue_type,
          issues: [],
          totalAffected: 0,
          severities: { critical: 0, high: 0, medium: 0, low: 0 }
        };
      }
      clusters[clusterKey].issues.push(issue);
      clusters[clusterKey].totalAffected += issue.rows_affected || 0;
      clusters[clusterKey].severities[issue.severity]++;
    });

    return Object.values(clusters).sort((a, b) => b.issues.length - a.issues.length);
  }, [issues]);

  const detectPattern = (clusterIssues) => {
    // Analyze timing
    const dates = clusterIssues.map(i => new Date(i.discovery_date)).sort();
    const daysDiff = dates.length > 1 
      ? (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24) 
      : 0;

    if (daysDiff < 7) return "Recurring issue (within 1 week)";
    if (daysDiff < 30) return "Recurring issue (within 1 month)";
    return "Long-term systemic issue";
  };

  // Identify systemic vs one-off issues
  const issueAnalysis = useMemo(() => {
    const analysis = {
      systemic: [],
      oneOff: []
    };

    issueClusters.forEach(cluster => {
      if (cluster.issues.length >= 3) {
        // Systemic: multiple occurrences
        analysis.systemic.push({
          ...cluster,
          pattern: detectPattern(cluster.issues),
          isSystemic: true
        });
      } else if (cluster.issues.length === 1) {
        // One-off: single occurrence
        analysis.oneOff.push(...cluster.issues.map(issue => ({
          ...issue,
          isSystemic: false
        })));
      } else {
        // In between: potential pattern
        analysis.systemic.push({
          ...cluster,
          pattern: "Emerging pattern",
          isSystemic: false
        });
      }
    });

    return analysis;
  }, [issueClusters]);

  // Project health analysis
  const projectHealth = useMemo(() => {
    const health = {};
    
    issues.forEach(issue => {
      const project = issue.project || 'Uncategorized';
      if (!health[project]) {
        health[project] = {
          name: project,
          total: 0,
          open: 0,
          critical: 0,
          systemic: 0
        };
      }
      health[project].total++;
      if (issue.status === 'open' || issue.status === 'in_progress') health[project].open++;
      if (issue.severity === 'critical') health[project].critical++;
    });

    // Count systemic issues per project
    issueAnalysis.systemic.forEach(cluster => {
      if (cluster.project && health[cluster.project]) {
        health[cluster.project].systemic++;
      }
    });

    return Object.values(health).sort((a, b) => b.critical - a.critical);
  }, [issues, issueAnalysis]);

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              Issue Analytics
            </h1>
            <p className="text-slate-400">Identify patterns, systemic issues, and one-off incidents</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
              <p>Error loading issues: {error.message}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-white">{issues.length}</div>
                    <div className="text-sm text-slate-400">Total Issues</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-400">{issueAnalysis.systemic.length}</div>
                    <div className="text-sm text-slate-400">Systemic Issues</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-400">{issueAnalysis.oneOff.length}</div>
                    <div className="text-sm text-slate-400">One-Off Issues</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-400">{issueClusters.length}</div>
                    <div className="text-sm text-slate-400">Issue Clusters</div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Health */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="w-5 h-5" />
                    Project Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectHealth.map(project => (
                      <div key={project.name} className="p-4 border border-slate-700 bg-slate-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{project.name}</h3>
                          <div className="flex gap-2">
                            {project.critical > 0 && (
                              <Badge variant="destructive">{project.critical} Critical</Badge>
                            )}
                            {project.systemic > 0 && (
                              <Badge className="bg-orange-900/30 text-orange-400 border-orange-500/30 border">
                                {project.systemic} Systemic
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-slate-400">
                          {project.total} total issues • {project.open} open
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Systemic Issues */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Systemic Issues (Root Problems)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {issueAnalysis.systemic.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No systemic issues detected</p>
                    ) : (
                      issueAnalysis.systemic.map(cluster => (
                        <div key={cluster.id} className="border border-red-900/30 rounded-lg p-4 bg-red-950/30">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-red-100 text-red-700">
                                  {cluster.issues.length} occurrences
                                </Badge>
                                {cluster.isSystemic && (
                                  <Badge variant="destructive">Systemic</Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-white">{cluster.project} - {cluster.type ? cluster.type.replace('_', ' ') : 'Unknown'}</h3>
                              <p className="text-sm text-slate-400 mt-1">{cluster.pattern}</p>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium text-white">{cluster.totalAffected.toLocaleString()}</div>
                              <div className="text-slate-400">rows affected</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {cluster.issues.map(issue => (
                              <Link key={issue.id} to={createPageUrl(`IssueDetail?id=${issue.id}`)}>
                                <div className="p-2 bg-slate-900 rounded border border-slate-700 hover:border-red-500/50 cursor-pointer transition-colors">
                                  <div className="text-sm font-medium text-white">{issue.title}</div>
                                  <div className="text-xs text-slate-400">
                                    {issue.discovery_date} • {issue.severity} • {issue.rows_affected?.toLocaleString() || 0} rows
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* One-Off Issues */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <GitBranch className="w-5 h-5 text-blue-400" />
                    One-Off Issues (Isolated Incidents)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {issueAnalysis.oneOff.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No one-off issues</p>
                    ) : (
                      issueAnalysis.oneOff.map(issue => (
                        <Link key={issue.id} to={createPageUrl(`IssueDetail?id=${issue.id}`)}>
                          <div className="p-3 border border-slate-700 bg-slate-900 rounded hover:bg-blue-950/30 cursor-pointer transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-white">{issue.title}</div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {issue.project} • {issue.dataset} • {issue.discovery_date || 'N/A'}
                                </div>
                              </div>
                              <Badge className={
                                issue.severity === 'critical' ? 'bg-red-600 text-white' :
                                issue.severity === 'high' ? 'bg-orange-600 text-white' :
                                issue.severity === 'medium' ? 'bg-yellow-600 text-white' :
                                'bg-blue-600 text-white'
                              }>{issue.severity}</Badge>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}