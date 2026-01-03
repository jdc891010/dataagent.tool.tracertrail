import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderTree, Database, GitBranch, AlertCircle, ChevronRight, 
  ChevronDown, ArrowRight, Info, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

const getNodeColor = (type, status) => {
  if (type === 'project') return 'border-purple-500/50 bg-purple-900/20';
  if (type === 'dataset') return 'border-blue-500/50 bg-blue-900/20';
  if (type === 'dataSource') {
    if (status === 'alert') return 'border-red-500/50 bg-red-900/20';
    if (status === 'in_progress') return 'border-yellow-500/50 bg-yellow-900/20';
    if (status === 'completed') return 'border-green-500/50 bg-green-900/20';
    return 'border-cyan-500/50 bg-cyan-900/20';
  }
  if (type === 'issue') {
    if (status === 'critical') return 'border-red-500/50 bg-red-900/20';
    if (status === 'high') return 'border-orange-500/50 bg-orange-900/20';
    return 'border-slate-500/50 bg-slate-900/20';
  }
  return 'border-slate-500/50 bg-slate-900/20';
};

const NodeCard = ({ 
  type, 
  data, 
  icon: Icon, 
  isExpanded, 
  onToggle, 
  hasChildren, 
  canExpand,
  hoveredNode,
  setHoveredNode,
  entityType,
  currentEntity
}) => {
  const [tooltipPos, setTooltipPos] = useState('right');
  const cardRef = useRef(null);
  
  const isHovered = hoveredNode?.id === data?.id && hoveredNode?.type === type;
  const isCurrent = entityType === type && currentEntity?.id === data?.id;

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      // Tooltip width (w-64 = 16rem = 256px) + margin (ml-4 = 16px) + safe buffer
      if (spaceRight < 300) {
        setTooltipPos('left');
      } else {
        setTooltipPos('right');
      }
    }
    setHoveredNode({ type, id: data?.id, data });
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "relative transition-all duration-200",
        isHovered && "scale-105 z-10"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHoveredNode(null)}
    >
      <div className={cn(
        "p-3 rounded-lg border-2 transition-all",
        getNodeColor(type, data?.status || data?.severity),
        isCurrent && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {data?.id ? (
                  <Link 
                    to={createPageUrl(
                      type === 'project' ? `ProjectDetail?id=${data.id}` :
                      type === 'dataset' ? `DatasetDetail?id=${data.id}` :
                      type === 'dataSource' ? `DataSourceDetail?id=${data.id}` :
                      `IssueDetail?id=${data.id}`
                    )}
                    className="font-medium text-white hover:text-cyan-400 transition-colors truncate"
                  >
                    {data.name || data.title}
                  </Link>
                ) : (
                  <span className="font-medium text-white truncate">
                    {data?.name || data?.title}
                  </span>
                )}
                {isCurrent && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Current</Badge>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                {type === 'dataSource' && (
                  <>
                    <div className="capitalize">{data?.type} • {data?.phase}</div>
                    {data?.quality_score && (
                      <div>Quality: {data.quality_score}%</div>
                    )}
                  </>
                )}
                {type === 'dataset' && data?.source_system && (
                  <div>{data.source_system}</div>
                )}
                {type === 'project' && data?.governance_classification && (
                  <div className="capitalize">{data.governance_classification}</div>
                )}
                {type === 'issue' && (
                  <div className="flex items-center gap-1">
                    <Badge className="text-xs h-4 px-1">{data?.severity}</Badge>
                    <span>• {data?.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {canExpand && hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Hover Tooltip */}
      {isHovered && (
        <div className={cn(
          "absolute top-0 z-20 w-64 p-3 bg-slate-800 border border-cyan-500/30 rounded-lg shadow-xl",
          tooltipPos === 'right' ? "left-full ml-4" : "right-full mr-4"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-white">Metadata</span>
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            {type === 'dataSource' && (
              <>
                <div>Type: <span className="text-white capitalize">{data?.type}</span></div>
                <div>Phase: <span className="text-white capitalize">{data?.phase}</span></div>
                <div>Status: <span className="text-white capitalize">{data?.status}</span></div>
                {data?.source_location && (
                  <div className="mt-2">
                    <div className="text-slate-400">Location:</div>
                    <div className="font-mono text-xs text-cyan-400 break-all">{data.source_location}</div>
                  </div>
                )}
                {data?.records_processed && (
                  <div>Records: <span className="text-white">{data.records_processed.toLocaleString()}</span></div>
                )}
              </>
            )}
            {type === 'dataset' && (
              <>
                {data?.source_system && <div>Source: <span className="text-white">{data.source_system}</span></div>}
                {data?.refresh_frequency && <div>Refresh: <span className="text-white capitalize">{data.refresh_frequency}</span></div>}
                {data?.governance_classification && <div>Governance: <span className="text-white capitalize">{data.governance_classification}</span></div>}
              </>
            )}
            {type === 'project' && (
              <>
                {data?.data_steward && <div>Steward: <span className="text-white">{data.data_steward}</span></div>}
                {data?.governance_classification && <div>Classification: <span className="text-white capitalize">{data.governance_classification}</span></div>}
              </>
            )}
            {type === 'issue' && (
              <>
                <div>Type: <span className="text-white capitalize">{data?.issue_type?.replace('_', ' ')}</span></div>
                <div>Severity: <span className="text-white capitalize">{data?.severity}</span></div>
                <div>Status: <span className="text-white capitalize">{data?.status}</span></div>
                {data?.rows_affected && <div>Rows: <span className="text-white">{data.rows_affected.toLocaleString()}</span></div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ConnectionLine = ({ vertical = false, dashed = false }) => (
  <div className={cn(
    "flex items-center justify-center",
    vertical ? "h-8 w-full" : "w-8 h-full"
  )}>
    <div className={cn(
      "bg-slate-600",
      vertical ? "w-0.5 h-full" : "h-0.5 w-full",
      dashed && "opacity-50"
    )} />
  </div>
);

export default function InteractiveLineageGraph({ 
  currentEntity, 
  entityType, // 'issue' | 'dataSource' | 'dataset' | 'project'
  project,
  dataset,
  dataSource,
  issues = [],
  allDataSources = [],
  allDatasets = [],
  allProjects = []
}) {
  const [expandedNodes, setExpandedNodes] = useState({
    project: true,
    dataset: true,
    sources: true,
    issues: true
  });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Build the lineage hierarchy
  const lineageData = useMemo(() => {
    const data = {
      project: project || null,
      dataset: dataset || null,
      dataSources: dataSource ? [dataSource] : (dataset?.id ? allDataSources.filter(s => s.dataset_id === dataset.id) : []),
      relatedIssues: issues.filter(i => {
        // Match by data source ID
        if (i.data_source_id === dataSource?.id) return true;
        
        // Match by dataset name or any source in this dataset
        if (dataset) {
          if (i.dataset === dataset.name) return true;
          const datasetSources = allDataSources.filter(s => s.dataset_id === dataset.id);
          if (datasetSources.some(s => s.id === i.data_source_id)) return true;
        }
        
        // Match by project name
        if (project && i.project === project.name) return true;
        
        return false;
      }),
      // Upstream sources (for data flows)
      upstreamSources: [],
      // Downstream targets (for data flows)
      downstreamTargets: []
    };

    return data;
  }, [project, dataset, dataSource, allDataSources, issues]);

  const toggleNode = (nodeKey) => {
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  return (
      <div>
        <div className="space-y-4">
          {/* Project Level */}
          {lineageData.project && (
            <>
              <NodeCard
                type="project"
                data={lineageData.project}
                icon={FolderTree}
                isExpanded={expandedNodes.project}
                onToggle={() => toggleNode('project')}
                hasChildren={!!lineageData.dataset}
                canExpand={!!lineageData.dataset}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                entityType={entityType}
                currentEntity={currentEntity}
              />
              {lineageData.dataset && (
                <>
                  <ConnectionLine vertical />
                  <div className="ml-6">
                    <NodeCard
                      type="dataset"
                      data={lineageData.dataset}
                      icon={Database}
                      isExpanded={expandedNodes.dataset}
                      onToggle={() => toggleNode('dataset')}
                      hasChildren={lineageData.dataSources.length > 0}
                      canExpand={lineageData.dataSources.length > 0}
                      hoveredNode={hoveredNode}
                      setHoveredNode={setHoveredNode}
                      entityType={entityType}
                      currentEntity={currentEntity}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Dataset Level (if no project) */}
          {!lineageData.project && lineageData.dataset && (
            <>
              <NodeCard
                type="dataset"
                data={lineageData.dataset}
                icon={Database}
                isExpanded={expandedNodes.dataset}
                onToggle={() => toggleNode('dataset')}
                hasChildren={lineageData.dataSources.length > 0}
                canExpand={lineageData.dataSources.length > 0}
                hoveredNode={hoveredNode}
                setHoveredNode={setHoveredNode}
                entityType={entityType}
                currentEntity={currentEntity}
              />
            </>
          )}

          {/* Data Sources Level */}
          {expandedNodes.dataset && lineageData.dataSources.length > 0 && (
            <>
              <ConnectionLine vertical />
              <div className={cn("ml-6 space-y-3", lineageData.project && "ml-12")}>
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Data Sources ({lineageData.dataSources.length})
                  </span>
                  {lineageData.dataSources.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => toggleNode('sources')}
                    >
                      {expandedNodes.sources ? 'Collapse' : 'Expand'}
                    </Button>
                  )}
                </div>
                {expandedNodes.sources && lineageData.dataSources.map((source, idx) => (
                  <div key={source.id}>
                    {idx > 0 && <ConnectionLine vertical dashed />}
                    <NodeCard
                      type="dataSource"
                      data={source}
                      icon={GitBranch}
                      isExpanded={false}
                      hasChildren={false}
                      canExpand={false}
                      hoveredNode={hoveredNode}
                      setHoveredNode={setHoveredNode}
                      entityType={entityType}
                      currentEntity={currentEntity}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Issues Level */}
          {lineageData.relatedIssues.length > 0 && (
            <>
              <ConnectionLine vertical dashed />
              <div className={cn("space-y-3", lineageData.project ? "ml-12" : "ml-6")}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Related Issues ({lineageData.relatedIssues.length})
                  </span>
                  {lineageData.relatedIssues.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => toggleNode('issues')}
                    >
                      {expandedNodes.issues ? 'Collapse' : 'Expand'}
                    </Button>
                  )}
                </div>
                {(expandedNodes.issues ? lineageData.relatedIssues : lineageData.relatedIssues.slice(0, 3)).map((issue, idx) => (
                  <div key={issue.id}>
                    {idx > 0 && <ConnectionLine vertical dashed />}
                    <NodeCard
                      type="issue"
                      data={issue}
                      icon={AlertCircle}
                      isExpanded={false}
                      hasChildren={false}
                      canExpand={false}
                      hoveredNode={hoveredNode}
                      setHoveredNode={setHoveredNode}
                      entityType={entityType}
                      currentEntity={currentEntity}
                    />
                  </div>
                ))}
                {!expandedNodes.issues && lineageData.relatedIssues.length > 3 && (
                  <div className="text-xs text-slate-400 text-center">
                    +{lineageData.relatedIssues.length - 3} more issues
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State */}
          {!lineageData.project && !lineageData.dataset && lineageData.dataSources.length === 0 && (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No lineage data available</p>
            </div>
          )}
        </div>
      </div>
  );
}
