import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataAgent } from "@/api/dataAgentClient";
import { toast } from "sonner";

export function useDataSourceProcessing(source) {
  const queryClient = useQueryClient();
  const sourceId = source?.id;

  // Fetch active run for this source
  const { data: runs = [] } = useQuery({
    queryKey: ["processing-runs", sourceId],
    queryFn: () => dataAgent.entities.ProcessingRun.filter({ data_source_id: sourceId }, "-started_at"),
    enabled: !!sourceId
  });

  const activeRun = runs.find(r => r.status === "in_progress");

  const updateSourceMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.DataSource.update(sourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-sources"] }); // For Dashboard list
      queryClient.invalidateQueries({ queryKey: ["data-source", sourceId] }); // For Detail view
    }
  });

  const handleStatusChange = async (newStatus) => {
    if (!sourceId) return;

    try {
      // 1. Start Processing
      if (newStatus === "in_progress") {
        const nowIso = new Date().toISOString();
        await updateSourceMutation.mutateAsync({ status: "in_progress", last_run_date: nowIso });
        
        await dataAgent.entities.ProcessingRun.create({
          data_source_id: sourceId,
          started_at: nowIso,
          status: "in_progress",
          records_processed: 0,
          records_failed: 0
        });
        
        queryClient.invalidateQueries({ queryKey: ["processing-runs", sourceId] });
        toast.success("Processing started");
        return;
      }

      // 2. Stop or Pause (End current run)
      if (newStatus === "stopped" || newStatus === "paused" || newStatus === "completed") {
        if (!activeRun) {
          // If no active run but we want to change status (e.g. from paused to stopped), just update status
          await updateSourceMutation.mutateAsync({ status: newStatus });
          return;
        }

        const finishedAt = new Date();
        const startedAt = new Date(activeRun.started_at);
        const durationMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());
        const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

        // Update the run
        await dataAgent.entities.ProcessingRun.update(activeRun.id, {
          finished_at: finishedAt.toISOString(),
          duration_minutes: durationMinutes,
          duration_ms: durationMs,
          status: newStatus === "completed" ? "completed" : "stopped" // 'paused' runs are also 'stopped' in terms of run lifecycle
        });

        // Accumulate stats
        const dateKey = finishedAt.toISOString().slice(0, 10);
        const currentDaily = source?.daily_processing_duration || {};
        const prev = Number(currentDaily[dateKey] || 0);
        const updatedDaily = { ...currentDaily, [dateKey]: prev + durationMs };
        const totalDurationMs = Object.values(updatedDaily).reduce((sum, v) => sum + Number(v || 0), 0);
        const totalMinutes = Math.round(totalDurationMs / 60000);

        await updateSourceMutation.mutateAsync({
          status: newStatus, // Set the actual status (stopped/paused)
          daily_processing_duration: updatedDaily, // Now storing MS
          total_processing_duration: totalDurationMs, // Now storing MS
          last_run_date: finishedAt.toISOString()
        });

        queryClient.invalidateQueries({ queryKey: ["processing-runs", sourceId] });
        toast.success(`Processing ${newStatus}`);
      }
    } catch (err) {
      console.error("Failed to update processing status:", err);
      toast.error("Failed to update status");
    }
  };

  return {
    activeRun,
    handleStatusChange,
    isLoading: updateSourceMutation.isPending
  };
}
