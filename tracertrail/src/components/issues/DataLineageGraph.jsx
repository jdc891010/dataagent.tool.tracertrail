import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderTree, Database, FileText, AlertCircle, ChevronRight, X, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import SeverityBadge from "./SeverityBadge";
import StatusBadge from "./StatusBadge";

export default function DataLineageGraph({ issue, allIssues = [] }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter all issues based on severity and status
  const filteredAllIssues = useMemo(() => {
    return allIssues.filter(i => {
      if (filterSeverity !== "all" && i.severity !== filterSeverity) return false;
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      return true;
    });
  }, [allIssues, filterSeverity, filterStatus]);

  if (!issue.project && !issue.dataset && !issue.file) {
    return null;
  }

  // Build comprehensive lineage map
  const lineageMap = useMemo(() => {
    const map = {
      projects: new Map(),
      datasets: new Map(),
      files: new Map()
    };

    // Include current issue
    const allRelevantIssues = [...filteredAllIssues, issue];

    allRelevantIssues.forEach(iss => {
      // Track projects
      if (iss.project) {
        if (!map.projects.has(iss.project)) {
          map.projects.set(iss.project, { issues: [], datasets: new Set(), files: new Set() });
        }
        map.projects.get(iss.project).issues.push(iss);
        if (iss.dataset) map.projects.get(iss.project).datasets.add(iss.dataset);
        if (iss.file) map.projects.get(iss.project).files.add(iss.file);
      }

      // Track datasets
      if (iss.dataset) {
        if (!map.datasets.has(iss.dataset)) {
          map.datasets.set(iss.dataset, { issues: [], projects: new Set(), files: new Set() });
        }
        map.datasets.get(iss.dataset).issues.push(iss);
        if (iss.project) map.datasets.get(iss.dataset).projects.add(iss.project);
        if (iss.file) map.datasets.get(iss.dataset).files.add(iss.file);
      }

      // Track files
      if (iss.file) {
        if (!map.files.has(iss.file)) {
          map.files.set(iss.file, { issues: [], projects: new Set(), datasets: new Set() });
        }
        map.files.get(iss.file).issues.push(iss);
        if (iss.project) map.files.get(iss.file).projects.add(iss.project);
        if (iss.dataset) map.files.get(iss.file).datasets.add(iss.dataset);
      }
    });

    return map;
  }, [filteredAllIssues, issue]);

  // Find related issues for current issue's lineage
  const relatedByProject = lineageMap.projects.get(issue.project)?.issues.filter(i => i.id !== issue.id) || [];
  const relatedByDataset = lineageMap.datasets.get(issue.dataset)?.issues.filter(i => i.id !== issue.id) || [];
  const relatedByFile = lineageMap.files.get(issue.file)?.issues.filter(i => i.id !== issue.id) || [];

  const nodes = [
    {
      id: "project",
      type: "project",
      label: issue.project || "Unspecified Project",
      icon: FolderTree,
      color: "indigo",
      exists: !!issue.project,
      related: relatedByProject,
      connections: lineageMap.projects.get(issue.project) || { datasets: new Set(), files: new Set() }
    },
    {
      id: "dataset",
      type: "dataset",
      label: issue.dataset || "Unspecified Dataset",
      icon: Database,
      color: "blue",
      exists: !!issue.dataset,
      related: relatedByDataset,
      connections: lineageMap.datasets.get(issue.dataset) || { projects: new Set(), files: new Set() }
    },
    {
      id: "file",
      type: "file",
      label: issue.file || "Unspecified File",
      icon: FileText,
      color: "cyan",
      exists: !!issue.file,
      related: relatedByFile,
      connections: lineageMap.files.get(issue.file) || { projects: new Set(), datasets: new Set() }
    }
  ];

  const activeNodes = nodes.filter(n => n.exists);

  const hasActiveFilters = filterSeverity !== "all" || filterStatus !== "all";

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <FolderTree className="w-5 h-5 text-white" />
            Data Lineage
          </CardTitle>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white" />
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-blue-600 text-white border-blue-700 hover:bg-blue-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Severity</SelectItem>
                <SelectItem value="critical" className="focus:bg-slate-800 focus:text-white">Critical</SelectItem>
                <SelectItem value="high" className="focus:bg-slate-800 focus:text-white">High</SelectItem>
                <SelectItem value="medium" className="focus:bg-slate-800 focus:text-white">Medium</SelectItem>
                <SelectItem value="low" className="focus:bg-slate-800 focus:text-white">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-blue-600 text-white border-blue-700 hover:bg-blue-700">
                <SelectValue />
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
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setFilterSeverity("all");
                  setFilterStatus("all");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div>
        <div className="space-y-6">
          {/* Flow Diagram */}
          <div className="flex items-center justify-center gap-4 py-6 overflow-x-auto">
            {activeNodes.map((node, index) => (
              <div key={node.id} className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                  className={cn(
                    "relative group flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all cursor-pointer min-w-[140px]",
                    selectedNode?.id === node.id 
                      ? `border-${node.color}-500 bg-${node.color}-900/20 shadow-lg scale-105`
                      : "border-slate-700 hover:border-slate-600 hover:shadow-md bg-slate-800/50"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    selectedNode?.id === node.id 
                      ? `bg-${node.color}-500`
                      : `bg-${node.color}-900/30 group-hover:bg-${node.color}-900/40`
                  )}>
                    <node.icon className={cn(
                      "w-6 h-6",
                      selectedNode?.id === node.id ? "text-white" : `text-${node.color}-400`
                    )} />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                      {node.id}
                    </div>
                    <div className="font-medium text-white break-all text-sm">
                      {node.label}
                    </div>
                  </div>

                  {node.related.length > 0 && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "absolute -top-2 -right-2 shadow-sm",
                        selectedNode?.id === node.id 
                          ? `bg-${node.color}-500 text-white border-${node.color}-600`
                          : `bg-slate-700 text-${node.color}-400 border-${node.color}-600`
                      )}
                    >
                      {node.related.length}
                    </Badge>
                  )}
                  
                  {/* Connection indicators */}
                  {node.type === "project" && node.connections.datasets.size > 1 && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-slate-800 px-4 py-0.5 rounded-full border border-slate-600 whitespace-nowrap shadow-sm z-10">
                      {node.connections.datasets.size} datasets
                    </div>
                  )}
                  {node.type === "dataset" && (node.connections.projects.size > 1 || node.connections.files.size > 1) && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-slate-800 px-4 py-0.5 rounded-full border border-slate-600 whitespace-nowrap shadow-sm z-10">
                      {node.connections.projects.size > 1 ? `${node.connections.projects.size} projects` : `${node.connections.files.size} files`}
                    </div>
                  )}
                  {node.type === "file" && node.connections.datasets.size > 1 && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-slate-800 px-4 py-0.5 rounded-full border border-slate-600 whitespace-nowrap shadow-sm z-10">
                      {node.connections.datasets.size} datasets
                    </div>
                  )}
                </button>
                
                {index < activeNodes.length - 1 && (
                  <ChevronRight className="w-6 h-6 text-white flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Related Issues & Connections Panel */}
          {selectedNode && (
          <div className="border-t border-slate-700 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-medium text-white">
                  {selectedNode.label}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedNode.related.length} issue{selectedNode.related.length !== 1 ? 's' : ''} found
                  {hasActiveFilters && " (filtered)"}
                </p>
              </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="w-4 h-4 text-white" />
                </Button>
              </div>

              {/* Cross-relationships */}
              {(selectedNode.type === "project" && (selectedNode.connections.datasets.size > 1 || selectedNode.connections.files.size > 0)) ||
               (selectedNode.type === "dataset" && (selectedNode.connections.projects.size > 1 || selectedNode.connections.files.size > 1)) ||
               (selectedNode.type === "file" && (selectedNode.connections.projects.size > 1 || selectedNode.connections.datasets.size > 1)) ? (
                <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h5 className="text-xs font-medium text-slate-300 mb-2">Connected Components</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    {selectedNode.type !== "project" && selectedNode.connections.projects.size > 0 && (
                      <div>
                        <div className="text-slate-400 mb-1">Projects ({selectedNode.connections.projects.size})</div>
                        <div className="space-y-1">
                          {Array.from(selectedNode.connections.projects).slice(0, 3).map((proj, i) => (
                            <div key={i} className="font-mono text-white truncate">{proj}</div>
                          ))}
                          {selectedNode.connections.projects.size > 3 && (
                            <div className="text-slate-500">+{selectedNode.connections.projects.size - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedNode.type !== "dataset" && selectedNode.connections.datasets.size > 0 && (
                      <div>
                        <div className="text-slate-400 mb-1">Datasets ({selectedNode.connections.datasets.size})</div>
                        <div className="space-y-1">
                          {Array.from(selectedNode.connections.datasets).slice(0, 3).map((ds, i) => (
                            <div key={i} className="font-mono text-white truncate">{ds}</div>
                          ))}
                          {selectedNode.connections.datasets.size > 3 && (
                            <div className="text-slate-500">+{selectedNode.connections.datasets.size - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedNode.type !== "file" && selectedNode.connections.files.size > 0 && (
                      <div>
                        <div className="text-slate-400 mb-1">Files ({selectedNode.connections.files.size})</div>
                        <div className="space-y-1">
                          {Array.from(selectedNode.connections.files).slice(0, 3).map((file, i) => (
                            <div key={i} className="font-mono text-white truncate">{file}</div>
                          ))}
                          {selectedNode.connections.files.size > 3 && (
                            <div className="text-slate-500">+{selectedNode.connections.files.size - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              
              {/* Issues list */}
              {selectedNode.related.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedNode.related.map((relatedIssue) => (
                    <Link 
                      key={relatedIssue.id}
                      to={createPageUrl(`IssueDetail?id=${relatedIssue.id}`)}
                      className="block p-3 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-mono text-slate-400">
                              #{relatedIssue.id?.slice(-6)}
                            </span>
                            <SeverityBadge severity={relatedIssue.severity} showIcon={false} />
                            <StatusBadge status={relatedIssue.status} showIcon={false} />
                          </div>
                          <p className="text-sm font-medium text-white line-clamp-2 mb-1">
                            {relatedIssue.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                            {relatedIssue.project && relatedIssue.project !== selectedNode.label && (
                              <span className="flex items-center gap-1">
                                <FolderTree className="w-3 h-3 text-white" />
                                {relatedIssue.project}
                              </span>
                            )}
                            {relatedIssue.dataset && relatedIssue.dataset !== selectedNode.label && (
                              <span className="flex items-center gap-1">
                                <Database className="w-3 h-3 text-white" />
                                {relatedIssue.dataset}
                              </span>
                            )}
                            {relatedIssue.file && relatedIssue.file !== selectedNode.label && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-white" />
                                {relatedIssue.file}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-slate-400 py-8">
                  No issues found for this {selectedNode.type}
                  {hasActiveFilters && " with current filters"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}