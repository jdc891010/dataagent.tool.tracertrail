import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FolderTree, Plus, ChevronRight, Shield, User, Archive, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import ProjectForm from "@/components/forms/ProjectForm";
import AppNav from "@/components/navigation/AppNav";

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
      toast.success("Project created");
    }
  });

  const governanceColors = {
    public: "bg-green-900/30 text-green-400 border-green-500/30 border",
    internal: "bg-blue-900/30 text-blue-400 border-blue-500/30 border",
    confidential: "bg-orange-900/30 text-orange-400 border-orange-500/30 border",
    restricted: "bg-red-900/30 text-red-400 border-red-500/30 border"
  };

  const statusIcons = {
    active: <CheckCircle className="w-4 h-4 text-green-600" />,
    archived: <Archive className="w-4 h-4 text-slate-400" />,
    planned: <FolderTree className="w-4 h-4 text-blue-600" />
  };

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-slate-400">Manage your data projects and governance</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderTree className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">Create your first project to get started</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                <Card className="p-5 bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {statusIcons[project.status]}
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {project.name}
                        </h3>
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      
                      {project.client && (
                        <div className="text-sm text-slate-300 mb-2">
                          <span className="text-slate-500">Client:</span> {project.client}
                        </div>
                      )}
                      
                      {project.solution?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.solution.map((sol, i) => (
                            <Badge key={i} className="bg-purple-900/30 text-purple-400 border-purple-500/30 text-xs">
                              {sol}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge className={governanceColors[project.governance_classification]}>
                          <Shield className="w-3 h-3 mr-1" />
                          {project.governance_classification}
                        </Badge>
                        
                        {project.data_steward && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {project.data_steward}
                          </span>
                        )}
                        
                        {project.compliance_requirements?.length > 0 && (
                          <Badge variant="outline" className="text-white">
                            {project.compliance_requirements.length} compliance
                          </Badge>
                        )}
                      </div>
                      
                      {project.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Create New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}