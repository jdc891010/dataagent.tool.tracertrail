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
import { Database, Plus, ChevronRight, Shield, User, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import DatasetForm from "@/components/forms/DatasetForm";
import AppNav from "@/components/navigation/AppNav";

export default function Datasets() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: datasets = [], isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => dataAgent.entities.Dataset.list("-created_date")
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.Dataset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      setShowForm(false);
      toast.success("Dataset created");
    }
  });

  const governanceColors = {
    public: "bg-green-900/30 text-green-400 border-green-500/30 border",
    internal: "bg-blue-900/30 text-blue-400 border-blue-500/30 border",
    confidential: "bg-orange-900/30 text-orange-400 border-orange-500/30 border",
    restricted: "bg-red-900/30 text-red-400 border-red-500/30 border"
  };

  const getProjectName = (projectId) => {
    return projects.find(p => p.id === projectId)?.name || "Unknown";
  };

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Datasets</h1>
            <p className="text-slate-400">Manage your datasets and data governance</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          New Dataset
        </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No datasets yet</h3>
            <p className="text-slate-400 mb-6">Create your first dataset to get started</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
              <Plus className="w-4 h-4 mr-2" />
              Create First Dataset
            </Button>
          </div>
        ) : (
          <div className="space-y-stack-card md:space-y-stack-card-md">
            {datasets.map(dataset => (
              <Link key={dataset.id} to={createPageUrl(`DatasetDetail?id=${dataset.id}`)} className="block">
                <Card className="p-4 bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {dataset.name}
                        </h3>
                        <span className="text-xs text-slate-500">• {getProjectName(dataset.project_id)}</span>
                      </div>
                      
                      {dataset.description && (
                        <p className="text-sm text-slate-400 line-clamp-1">
                          {dataset.description}
                        </p>
                      )}
                      
                      {dataset.client && (
                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500">Client:</span> {dataset.client}
                        </div>
                      )}
                      
                      {dataset.solution?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dataset.solution.map((sol, i) => (
                            <Badge key={i} className="bg-purple-900/30 text-purple-400 border-purple-500/30 text-xs">
                              {sol}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge className={governanceColors[dataset.governance_classification]}>
                          <Shield className="w-3 h-3 mr-1" />
                          {dataset.governance_classification}
                        </Badge>
                        
                        {dataset.refresh_frequency && (
                          <Badge className={
                            dataset.refresh_frequency === 'real-time' ? 'bg-green-900/30 text-green-400 border-green-500/30 border' :
                            dataset.refresh_frequency === 'hourly' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30 border' :
                            dataset.refresh_frequency === 'daily' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30 border' :
                            dataset.refresh_frequency === 'weekly' ? 'bg-orange-900/30 text-orange-400 border-orange-500/30 border' :
                            dataset.refresh_frequency === 'monthly' ? 'bg-pink-900/30 text-pink-400 border-pink-500/30 border' :
                            'bg-cyan-900/30 text-cyan-400 border-cyan-500/30 border'
                          }>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            {dataset.refresh_frequency}
                          </Badge>
                        )}
                        
                        {dataset.contains_pii && (
                          <Badge className="bg-amber-900/30 text-amber-400 border-amber-500/30 border">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            PII
                          </Badge>
                        )}
                        
                        {dataset.data_steward && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {dataset.data_steward}
                          </span>
                        )}
                      </div>
                      
                      {dataset.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dataset.tags.slice(0, 3).map((tag, i) => {
                            const colors = [
                              'bg-blue-600 text-white',
                              'bg-purple-600 text-white',
                              'bg-pink-600 text-white',
                              'bg-green-600 text-white',
                              'bg-orange-600 text-white',
                              'bg-cyan-600 text-white',
                              'bg-indigo-600 text-white',
                              'bg-teal-600 text-white'
                            ];
                            const colorIndex = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                            return (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${colors[colorIndex]}`}>
                                {tag}
                              </span>
                            );
                          })}
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
            <DialogTitle className="text-2xl font-bold text-white">Create New Dataset</DialogTitle>
          </DialogHeader>
          <DatasetForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
