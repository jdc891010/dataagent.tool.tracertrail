import { useState, useMemo, useRef } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AppNav from "@/components/navigation/AppNav";
import LineageGraph from "@/components/lineage/LineageGraph";

export default function DataLineage() {
  const [zoom, setZoom] = useState(1);
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedDataset, setSelectedDataset] = useState("all");
  const [showDataSources, setShowDataSources] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

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

  const { data: flows = [], isLoading: flowsLoading } = useQuery({
    queryKey: ["data-flows"],
    queryFn: () => dataAgent.entities.DataFlow.list()
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => dataAgent.entities.Issue.list()
  });

  const isLoading = projectsLoading || datasetsLoading || sourcesLoading || flowsLoading;

  const filteredProjects = useMemo(() => {
    if (selectedProject === "all") return projects;
    return projects.filter(p => p.id === selectedProject);
  }, [projects, selectedProject]);

  const filteredDatasets = useMemo(() => {
    let filtered = datasets;
    if (selectedProject !== "all") {
      filtered = filtered.filter(d => d.project_id === selectedProject);
    }
    if (selectedDataset !== "all") {
      filtered = filtered.filter(d => d.id === selectedDataset);
    }
    return filtered;
  }, [datasets, selectedProject, selectedDataset]);

  const filteredSources = useMemo(() => {
    if (selectedDataset === "all") return sources;
    return sources.filter(s => s.dataset_id === selectedDataset);
  }, [sources, selectedDataset]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
    }
  };

  return (
    <>
      <AppNav />
      <div className="fixed inset-0 top-16 bg-slate-950 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 py-6">
            <div className="max-w-5xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <GitBranch className="w-5 h-5 text-blue-500" />
                      Data Lineage
                    </h1>
                    <p className="text-sm text-slate-400">Drag to pan • Scroll to zoom</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleZoomOut} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleZoomIn} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Projects</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id} className="focus:bg-slate-800 focus:text-white">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="All Datasets" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All Datasets</SelectItem>
                      {datasets
                        .filter(d => selectedProject === "all" || d.project_id === selectedProject)
                        .map(d => (
                          <SelectItem key={d.id} value={d.id} className="focus:bg-slate-800 focus:text-white">{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md">
                    <Checkbox 
                      id="show-sources" 
                      checked={showDataSources} 
                      onCheckedChange={setShowDataSources}
                      className="border-slate-600"
                    />
                    <Label htmlFor="show-sources" className="text-sm text-slate-300 cursor-pointer">
                      Show Data Sources
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <div className="max-w-7xl mx-auto h-full">
              {isLoading ? (
                <Card className="p-8 h-full bg-slate-800 border-slate-700">
                  <Skeleton className="h-full" />
                </Card>
              ) : (
                <div 
                  className="h-full bg-slate-800 border border-slate-700 rounded-lg overflow-hidden relative"
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                >
                  <div
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px)`,
                      transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <LineageGraph
                      projects={filteredProjects}
                      datasets={filteredDatasets}
                      sources={showDataSources ? filteredSources : []}
                      flows={flows}
                      issues={issues}
                      zoom={zoom}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}