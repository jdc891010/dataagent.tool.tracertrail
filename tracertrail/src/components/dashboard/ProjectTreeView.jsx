import { useState } from "react";
import { ChevronRight, ChevronDown, FolderTree, Database, AlertCircle, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import SeverityBadge from "@/components/issues/SeverityBadge";
import StatusBadge from "@/components/issues/StatusBadge";

export default function ProjectTreeView({ issues }) {
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [expandedDatasets, setExpandedDatasets] = useState(new Set());
  const [expandedDataSources, setExpandedDataSources] = useState(new Set());

  // Build hierarchy: Project > Dataset > DataSource > Issues
  const hierarchy = {};
  issues.forEach(issue => {
    const project = issue.project || "Uncategorized";
    const dataset = issue.dataset || "No Dataset";
    const dataSource = issue.data_source_id || "No Data Source";
    
    if (!hierarchy[project]) {
      hierarchy[project] = {};
    }
    if (!hierarchy[project][dataset]) {
      hierarchy[project][dataset] = {};
    }
    if (!hierarchy[project][dataset][dataSource]) {
      hierarchy[project][dataset][dataSource] = [];
    }
    hierarchy[project][dataset][dataSource].push(issue);
  });

  const toggleProject = (project) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(project)) {
      newExpanded.delete(project);
    } else {
      newExpanded.add(project);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleDataset = (key) => {
    const newExpanded = new Set(expandedDatasets);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedDatasets(newExpanded);
  };

  const toggleDataSource = (key) => {
    const newExpanded = new Set(expandedDataSources);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedDataSources(newExpanded);
  };

  return (
    <div className="space-y-2">
      {Object.entries(hierarchy).map(([project, datasets]) => {
        const isProjectExpanded = expandedProjects.has(project);
        const projectIssueCount = Object.values(datasets).flat().length;
        
        return (
          <div key={project} className="border border-slate-700 rounded-lg bg-slate-800 overflow-hidden">
            {/* Project Level */}
            <button
              onClick={() => toggleProject(project)}
              className="w-full flex items-center gap-3 p-4 hover:bg-slate-700 transition-colors text-left"
            >
              {isProjectExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
              <FolderTree className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{project}</h3>
                <p className="text-sm text-slate-400">
                  {Object.keys(datasets).length} dataset{Object.keys(datasets).length !== 1 ? 's' : ''} • {projectIssueCount} issue{projectIssueCount !== 1 ? 's' : ''}
                </p>
              </div>
            </button>

            {/* Datasets Level */}
            {isProjectExpanded && (
              <div className="border-t border-slate-700 bg-slate-900">
                {Object.entries(datasets).map(([dataset, dataSources]) => {
                  const datasetKey = `${project}-${dataset}`;
                  const isDatasetExpanded = expandedDatasets.has(datasetKey);
                  const datasetIssueCount = Object.values(dataSources).flat().length;
                  
                  return (
                    <div key={datasetKey} className="border-b border-slate-700 last:border-b-0">
                      {/* Dataset Header */}
                      <button
                        onClick={() => toggleDataset(datasetKey)}
                        className="w-full flex items-center gap-3 p-4 pl-12 hover:bg-slate-800 transition-colors text-left"
                      >
                        {isDatasetExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white">{dataset}</h4>
                          <p className="text-xs text-slate-400">
                            {Object.keys(dataSources).length} data source{Object.keys(dataSources).length !== 1 ? 's' : ''} • {datasetIssueCount} issue{datasetIssueCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>

                      {/* Data Sources Level */}
                      {isDatasetExpanded && (
                        <div className="bg-slate-800">
                          {Object.entries(dataSources).map(([dataSourceId, sourceIssues]) => {
                            const dataSourceKey = `${datasetKey}-${dataSourceId}`;
                            const isDataSourceExpanded = expandedDataSources.has(dataSourceKey);
                            const dataSourceName = sourceIssues[0]?.data_source_name || `Source ${dataSourceId.slice(-6)}`;
                            
                            return (
                              <div key={dataSourceKey} className="border-t border-slate-700">
                                {/* Data Source Header */}
                                <button
                                  onClick={() => toggleDataSource(dataSourceKey)}
                                  className="w-full flex items-center gap-3 p-3 pl-20 hover:bg-slate-700 transition-colors text-left"
                                >
                                  {isDataSourceExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  )}
                                  <GitBranch className="w-4 h-4 text-green-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-white text-sm">
                                      {dataSourceId === "No Data Source" ? "No Data Source" : dataSourceName}
                                    </h5>
                                    <p className="text-xs text-slate-400">
                                      {sourceIssues.length} issue{sourceIssues.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </button>

                                {/* Issues List */}
                                {isDataSourceExpanded && (
                                  <div className="bg-slate-850">
                                    {sourceIssues.map((issue, idx) => (
                                      <Link
                                        key={issue.id}
                                        to={createPageUrl(`IssueDetail?id=${issue.id}`)}
                                        className={cn(
                                          "flex items-start gap-3 p-3 pl-28 hover:bg-slate-700 transition-colors border-t border-slate-700",
                                          idx === 0 && "border-t-0"
                                        )}
                                      >
                                        <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-xs font-mono text-slate-400">
                                              #{issue.id?.slice(-6)}
                                            </span>
                                            <SeverityBadge severity={issue.severity} showIcon={false} />
                                            <StatusBadge status={issue.status} showIcon={false} />
                                          </div>
                                          <p className="text-sm font-medium text-white line-clamp-1">
                                            {issue.title}
                                          </p>
                                          {issue.file && (
                                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                              {issue.file}
                                            </p>
                                          )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}