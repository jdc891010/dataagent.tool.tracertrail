import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderTree, Database, GitBranch, AlertCircle, CheckCircle, Trash2, Edit } from "lucide-react";
import { dataAgent } from "@/api/dataAgentClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function LineageGraph({ projects, datasets, sources, flows, issues, zoom = 1 }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const queryClient = useQueryClient();

  const deleteFlowMutation = useMutation({
    mutationFn: (flowId) => dataAgent.entities.DataFlow.delete(flowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-flows"] });
      toast.success("Connection removed");
      setSelectedEdge(null);
    }
  });

  const findNodeById = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children?.length) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Build the lineage structure
  const lineageData = useMemo(() => {
    const structure = [];
    let yOffset = 20;
    const NODE_HEIGHT = 60;
    const VERTICAL_SPACING = 20;
    const PROJECT_SPACING = 40;

    projects.forEach((project, projIndex) => {
      const projectDatasets = datasets.filter(d => d.project_id === project.id);
      const projectIssues = issues.filter(i => i.project === project.name);
      const openIssues = projectIssues.filter(i => !['fixed', 'verified', 'wont_fix'].includes(i.status));
      const criticalIssues = openIssues.filter(i => i.severity === 'critical');
      const highIssues = openIssues.filter(i => i.severity === 'high');
      
      const projectNode = {
        id: project.id,
        type: "project",
        name: project.name,
        data: project,
        x: 50,
        y: yOffset,
        issues: openIssues.length,
        totalIssues: projectIssues.length,
        resolvedIssues: projectIssues.length - openIssues.length,
        criticalCount: criticalIssues.length,
        highCount: highIssues.length,
        children: []
      };

      let currentDatasetY = yOffset;
      
      projectDatasets.forEach((dataset, dsIndex) => {
        const datasetSources = sources.filter(s => s.dataset_id === dataset.id);
        const datasetIssues = issues.filter(i => i.dataset === dataset.name);
        const datasetOpenIssues = datasetIssues.filter(i => !['fixed', 'verified', 'wont_fix'].includes(i.status));
        const datasetCritical = datasetOpenIssues.filter(i => i.severity === 'critical');
        const datasetHigh = datasetOpenIssues.filter(i => i.severity === 'high');
        
        const datasetNode = {
          id: dataset.id,
          type: "dataset",
          name: dataset.name,
          data: dataset,
          x: 300,
          y: currentDatasetY,
          issues: datasetOpenIssues.length,
          totalIssues: datasetIssues.length,
          resolvedIssues: datasetIssues.length - datasetOpenIssues.length,
          criticalCount: datasetCritical.length,
          highCount: datasetHigh.length,
          children: []
        };

        let currentSourceY = currentDatasetY;

        datasetSources.forEach((source, srcIndex) => {
          const sourceFlows = flows.filter(f => 
            f.source_ids?.includes(source.id) || f.target_id === source.id
          );
          
          const sourceNode = {
            id: source.id,
            type: "source",
            name: source.name,
            data: source,
            x: 550,
            y: currentSourceY,
            flows: sourceFlows,
            children: []
          };

          datasetNode.children.push(sourceNode);
          currentSourceY += NODE_HEIGHT + VERTICAL_SPACING;
        });

        projectNode.children.push(datasetNode);
        
        // Calculate space needed for this dataset (including its sources)
        const datasetHeight = Math.max(
          NODE_HEIGHT,
          datasetSources.length * (NODE_HEIGHT + VERTICAL_SPACING)
        );
        currentDatasetY += datasetHeight + VERTICAL_SPACING;
      });

      structure.push(projectNode);
      
      // Move yOffset for next project
      const projectHeight = Math.max(
        NODE_HEIGHT,
        currentDatasetY - yOffset
      );
      yOffset += projectHeight + PROJECT_SPACING;
    });

    return structure;
  }, [projects, datasets, sources, flows, issues]);

  // Calculate flow connections
  const flowConnections = useMemo(() => {
    const connections = [];
    flows.forEach(flow => {
      const sourceNodes = flow.source_ids?.map(sid => 
        findNodeById(lineageData, sid)
      ).filter(Boolean) || [];
      
      const targetNode = findNodeById(lineageData, flow.target_id);
      
      sourceNodes.forEach(source => {
        if (targetNode) {
          connections.push({
            flow,
            from: source,
            to: targetNode
          });
        }
      });
    });
    return connections;
  }, [flows, lineageData]);

  const renderNode = (node) => {
    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    
    // Determine color based on issue severity
    const getNodeColor = () => {
      if (node.criticalCount > 0) {
        return {
          bg: "bg-red-900/40",
          border: "border-red-500",
          text: "text-white",
          hover: "hover:bg-red-900/50"
        };
      }
      if (node.highCount > 0) {
        return {
          bg: "bg-orange-900/40",
          border: "border-orange-500",
          text: "text-white",
          hover: "hover:bg-orange-900/50"
        };
      }
      if (node.issues > 0) {
        return {
          bg: "bg-yellow-900/40",
          border: "border-yellow-500",
          text: "text-white",
          hover: "hover:bg-yellow-900/50"
        };
      }
      return {
        bg: "bg-green-900/40",
        border: "border-green-500",
        text: "text-white",
        hover: "hover:bg-green-900/50"
      };
    };

    const nodeConfig = {
      project: { 
        icon: FolderTree,
        width: 200 
      },
      dataset: { 
        icon: Database,
        width: 180 
      },
      source: { 
        icon: GitBranch,
        width: 160 
      }
    };

    const config = nodeConfig[node.type];
    const Icon = config.icon;
    const colorScheme = getNodeColor();

    return (
      <g key={node.id}>
        <Link to={createPageUrl(getDetailPage(node))}>
          <foreignObject
            x={node.x}
            y={node.y}
            width={config.width}
            height={60}
            onMouseEnter={() => setHoveredNode(node)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => setSelectedNode(node)}
          >
            <div
              className={`
                h-full p-3 rounded-lg border-2 transition-all cursor-pointer
                ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text}
                ${isHovered ? colorScheme.hover : ''}
                ${isSelected ? 'ring-2 ring-offset-2 ring-cyan-500' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{node.name}</div>
                    <div className="text-xs text-slate-400 truncate capitalize">{node.type}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {node.issues === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <>
                      {node.criticalCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="w-3 h-3" />
                          {node.criticalCount}
                        </div>
                      )}
                      {node.highCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <AlertCircle className="w-3 h-3" />
                          {node.highCount}
                        </div>
                      )}
                      {node.issues > 0 && !node.criticalCount && !node.highCount && (
                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                          <AlertCircle className="w-3 h-3" />
                          {node.issues}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </foreignObject>
        </Link>
        
        {/* Render children connections */}
        {node.children?.map(child => (
          <g key={`${node.id}-${child.id}`}>
            <line
              x1={node.x + (config.width)}
              y1={node.y + 30}
              x2={child.x}
              y2={child.y + 30}
              stroke="#cbd5e1"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </g>
        ))}
        
        {/* Render children */}
        {node.children?.map(renderNode)}
      </g>
    );
  };

  const renderFlowConnection = (connection, index) => {
    const fromX = connection.from.x + 160;
    const fromY = connection.from.y + 30;
    const toX = connection.to.x;
    const toY = connection.to.y + 30;

    const midX = (fromX + toX) / 2;
    const isSelected = selectedEdge?.flow?.id === connection.flow.id;

    return (
      <g key={index}>
        <path
          d={`M ${fromX} ${fromY} Q ${midX} ${fromY}, ${midX} ${(fromY + toY) / 2} T ${toX} ${toY}`}
          stroke={isSelected ? "#10b981" : "#3b82f6"}
          strokeWidth={isSelected ? "3" : "2"}
          fill="none"
          strokeDasharray="5,5"
          markerEnd="url(#flow-arrowhead)"
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEdge({ flow: connection.flow, from: connection.from, to: connection.to });
          }}
        />
        <foreignObject
          x={midX - 40}
          y={(fromY + toY) / 2 - 10}
          width={80}
          height={20}
          style={{ pointerEvents: "none" }}
        >
          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-center truncate">
            {connection.flow.name}
          </div>
        </foreignObject>
      </g>
    );
  };

  const getDetailPage = (node) => {
    switch(node.type) {
      case "project": return `ProjectDetail?id=${node.id}`;
      case "dataset": return `DatasetDetail?id=${node.id}`;
      case "source": return `DataSourceDetail?id=${node.id}`;
      default: return "Dashboard";
    }
  };

  const totalHeight = Math.max(600, ...lineageData.flatMap(p => 
    p.children?.flatMap(d => 
      d.children?.map(s => s.y + 100) || [d.y + 100]
    ) || [p.y + 100]
  ));

  return (
    <div className="relative w-full h-full">
      <svg 
        width="100%" 
        height="100%"
        viewBox={`0 0 900 ${totalHeight}`}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        onClick={() => {
          setSelectedEdge(null);
          setSelectedNode(null);
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#cbd5e1" />
          </marker>
          <marker
            id="flow-arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Render all nodes */}
        {lineageData.map(renderNode)}

        {/* Render flow connections */}
        {flowConnections.map(renderFlowConnection)}
      </svg>

      {/* Edge Details Panel */}
      {selectedEdge && (
        <Card className="fixed top-24 right-8 p-4 w-72 shadow-lg z-50 bg-slate-800 border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              Data Flow
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedEdge(null)}
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-400">Name:</span>
              <div className="font-medium mt-1 text-white">{selectedEdge.flow.name}</div>
            </div>

            <div>
              <span className="text-slate-400">From:</span>
              <div className="font-medium mt-1 text-white">{selectedEdge.from.name}</div>
            </div>

            <div>
              <span className="text-slate-400">To:</span>
              <div className="font-medium mt-1 text-white">{selectedEdge.to.name}</div>
            </div>

            {selectedEdge.flow.description && (
              <div>
                <span className="text-slate-400">Description:</span>
                <p className="text-xs mt-1 text-slate-300">{selectedEdge.flow.description}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Link to={createPageUrl(`DataFlows`)} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => deleteFlowMutation.mutate(selectedEdge.flow.id)}
                disabled={deleteFlowMutation.isPending}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Node Details Panel */}
      {(hoveredNode || selectedNode) && !selectedEdge && (
        <Card className="fixed top-24 right-8 p-4 w-64 shadow-lg z-50 bg-slate-800 border-slate-700">
          {(() => {
            const node = selectedNode || hoveredNode;
            return (
              <>
                <div className="flex items-center gap-2 mb-3">
                  {node.type === "project" && <FolderTree className="w-5 h-5 text-purple-400" />}
                  {node.type === "dataset" && <Database className="w-5 h-5 text-blue-400" />}
                  {node.type === "source" && <GitBranch className="w-5 h-5 text-green-400" />}
                  <h3 className="font-semibold text-white">{node.name}</h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Type:</span>
                    <span className="ml-2 capitalize text-white">{node.type}</span>
                  </div>

                  {node.data?.description && (
                    <div>
                      <span className="text-slate-400">Description:</span>
                      <p className="text-xs mt-1 text-slate-300">{node.data.description}</p>
                    </div>
                  )}

                  {node.data?.status && (
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <Badge className="ml-2" variant="outline">{node.data.status}</Badge>
                    </div>
                  )}
                  
                  {node.issues === 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        All clear
                      </div>
                      {node.resolvedIssues > 0 && (
                        <div className="text-xs text-green-400">
                          ✓ {node.resolvedIssues} resolved
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {node.issues} open issue{node.issues !== 1 ? 's' : ''}
                      </div>
                      {node.criticalCount > 0 && (
                        <div className="text-xs text-red-400">
                          • {node.criticalCount} critical
                        </div>
                      )}
                      {node.highCount > 0 && (
                        <div className="text-xs text-orange-400">
                          • {node.highCount} high
                        </div>
                      )}
                      {node.resolvedIssues > 0 && (
                        <div className="text-xs text-green-400 mt-1">
                          ✓ {node.resolvedIssues} resolved
                        </div>
                      )}
                    </>
                  )}
                  
                  {node.type === "source" && node.data?.quality_score && (
                    <div>
                      <span className="text-slate-400">Quality:</span>
                      <span className="ml-2 font-medium text-white">{node.data.quality_score}%</span>
                    </div>
                  )}

                  {node.flows?.length > 0 && (
                    <div>
                      <span className="text-slate-400">Flows:</span>
                      <span className="ml-2 text-white">{node.flows.length}</span>
                    </div>
                  )}

                  {node.children?.length > 0 && (
                    <div>
                      <span className="text-slate-400">Children:</span>
                      <span className="ml-2 text-white">{node.children.length}</span>
                    </div>
                  )}
                </div>

                <Link to={createPageUrl(getDetailPage(node))}>
                  <button className="w-full mt-3 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">
                    View Details →
                  </button>
                </Link>
              </>
            );
          })()}
        </Card>
      )}
    </div>
  );
}