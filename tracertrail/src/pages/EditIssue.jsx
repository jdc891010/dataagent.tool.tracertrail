import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import IssueForm from "@/components/forms/IssueForm";

export default function EditIssue() {
  const urlParams = new URLSearchParams(window.location.search);
  const issueId = urlParams.get("id");
  const navigate = useNavigate();

  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      const issues = await dataAgent.entities.Issue.filter({ id: issueId });
      return issues[0];
    },
    enabled: !!issueId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.Issue.update(issueId, data),
    onSuccess: () => {
      toast.success("Issue updated successfully");
      navigate(createPageUrl(`IssueDetail?id=${issueId}`));
    },
    onError: () => {
      toast.error("Failed to update issue");
    }
  });

  const handleSubmit = (data) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate(createPageUrl(`IssueDetail?id=${issueId}`));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-32 bg-slate-800" />
          <Skeleton className="h-96 bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Issue not found</h2>
          <Link to={createPageUrl("Dashboard")}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl(`IssueDetail?id=${issueId}`)}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Issue
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Edit Issue</h1>
          <p className="text-slate-400">Update issue details</p>
        </div>

        <IssueForm 
          issue={issue}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  );
}