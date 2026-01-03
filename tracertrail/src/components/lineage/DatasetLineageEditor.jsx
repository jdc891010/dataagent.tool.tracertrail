import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Plus, Trash2, Database } from "lucide-react";
import { toast } from "sonner";

export default function DatasetLineageEditor({ datasetId, currentProjectId }) {
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const queryClient = useQueryClient();

  const { data: allSources = [] } = useQuery({
    queryKey: ["all-sources"],
    queryFn: () => dataAgent.entities.DataSource.list()
  });

  const { data: datasetSources = [] } = useQuery({
    queryKey: ["dataset-sources", datasetId],
    queryFn: () => dataAgent.entities.DataSource.filter({ dataset_id: datasetId }),
    enabled: !!datasetId
  });

  const updateSourceMutation = useMutation({
    mutationFn: ({ sourceId, data }) => dataAgent.entities.DataSource.update(sourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset-sources", datasetId] });
      queryClient.invalidateQueries({ queryKey: ["data-sources"] });
      toast.success("Data source updated");
      setSelectedSourceId("");
    }
  });

  const handleAddSource = () => {
    if (!selectedSourceId) return;
    updateSourceMutation.mutate({
      sourceId: selectedSourceId,
      data: { dataset_id: datasetId }
    });
  };

  const handleRemoveSource = (sourceId) => {
    updateSourceMutation.mutate({
      sourceId: sourceId,
      data: { dataset_id: null }
    });
  };

  const availableSources = allSources.filter(
    s => !s.dataset_id || s.dataset_id === datasetId
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          Manage Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
            <SelectTrigger className="flex-1 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select a data source to add" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              {availableSources.map(source => (
                <SelectItem key={source.id} value={source.id} className="focus:bg-slate-800 focus:text-white">
                  {source.name} ({source.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
          onClick={handleAddSource}
          disabled={!selectedSourceId || updateSourceMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Current Data Sources</h4>
          {datasetSources.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No data sources assigned</p>
          ) : (
            <div className="space-y-2">
              {datasetSources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-white">{source.name}</span>
                    <span className="text-xs text-slate-400">({source.type})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSource(source.id)}
                    disabled={updateSourceMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}