import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, ArrowRight, GitBranch } from "lucide-react";
import { toast } from "sonner";
import AppNav from "@/components/navigation/AppNav";
import DataFlowForm from "@/components/forms/DataFlowForm";

export default function DataFlows() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: flows = [] } = useQuery({
    queryKey: ["data-flows"],
    queryFn: () => dataAgent.entities.DataFlow.list()
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["data-sources"],
    queryFn: () => dataAgent.entities.DataSource.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.DataFlow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-flows"] });
      setShowForm(false);
      toast.success("Flow created");
    }
  });

  const getSourceById = (id) => sources.find(s => s.id === id);

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link to={createPageUrl("DataSources")}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sources
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Data Flows</h1>
              <p className="text-slate-400">Visualize source to target data flows</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
              <Plus className="w-4 h-4 mr-2" />
              New Flow
            </Button>
          </div>

          {flows.length === 0 ? (
            <div className="text-center py-16">
              <GitBranch className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No flows defined yet</h3>
              <p className="text-slate-400 mb-6">Create your first data flow to visualize connections</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                Create First Flow
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {flows.map(flow => {
                const flowSources = flow.source_ids?.map(getSourceById).filter(Boolean) || [];
                const target = getSourceById(flow.target_id);

                return (
                  <Card key={flow.id} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white">{flow.name}</CardTitle>
                        <Badge>{flow.status}</Badge>
                      </div>
                      {flow.description && (
                        <p className="text-sm text-slate-400">{flow.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 overflow-x-auto py-4">
                        {/* Sources */}
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {flowSources.length === 0 ? (
                            <div className="text-sm text-slate-400">No sources</div>
                          ) : (
                            flowSources.map(source => (
                              <Link key={source.id} to={createPageUrl(`DataSourceDetail?id=${source.id}`)}>
                                <div className="p-3 bg-blue-950/50 border border-blue-900 rounded-lg hover:bg-blue-900/50 transition-colors">
                                  <div className="font-medium text-sm text-blue-100">{source.name}</div>
                                  <div className="text-xs text-blue-400">{source.type}</div>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center gap-2 text-slate-600">
                          <ArrowRight className="w-6 h-6" />
                          <ArrowRight className="w-6 h-6" />
                          <ArrowRight className="w-6 h-6" />
                        </div>

                        {/* Target */}
                        <div className="min-w-[200px]">
                          {target ? (
                            <Link to={createPageUrl(`DataSourceDetail?id=${target.id}`)}>
                              <div className="p-3 bg-green-950/50 border border-green-900 rounded-lg hover:bg-green-900/50 transition-colors">
                                <div className="font-medium text-sm text-green-100">{target.name}</div>
                                <div className="text-xs text-green-400">{target.type}</div>
                              </div>
                            </Link>
                          ) : (
                            <div className="text-sm text-slate-400">No target</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Data Flow</DialogTitle>
          </DialogHeader>
          <DataFlowForm
            sources={sources}
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}