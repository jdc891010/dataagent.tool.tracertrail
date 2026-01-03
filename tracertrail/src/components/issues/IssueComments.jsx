import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2, Bot, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function IssueComments({ issueId, comments = [], issue }) {
  const [newComment, setNewComment] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.IssueComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue-comments", issueId] });
      setNewComment("");
      toast.success("Comment added");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      issue_id: issueId,
      comment: newComment,
      comment_type: "comment"
    });
  };

  const getCommentIcon = (type) => {
    switch(type) {
      case "status_change": return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case "assignment": return <AlertCircle className="w-4 h-4 text-purple-600" />;
      case "ai_suggestion": return <Bot className="w-4 h-4 text-green-600" />;
      default: return <MessageSquare className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleAISuggestion = async () => {
    setLoadingAI(true);
    try {
      const prompt = `Analyze this data quality issue and suggest solutions:

Title: ${issue.title}
Type: ${issue.issue_type}
Severity: ${issue.severity}
Description: ${issue.description || "N/A"}
Root Cause: ${issue.root_cause || "Unknown"}
Impact: ${issue.impact_description || "N/A"}
Rows Affected: ${issue.rows_affected || "Unknown"}

Provide:
1. Likely root causes (if not already identified)
2. Step-by-step solution recommendations
3. Prevention strategies for the future
4. SQL or code snippets if applicable

Keep it concise and actionable.`;

      const response = await dataAgent.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      await dataAgent.entities.IssueComment.create({
        issue_id: issueId,
        comment: response,
        comment_type: "ai_suggestion"
      });

      queryClient.invalidateQueries({ queryKey: ["issue-comments", issueId] });
      toast.success("AI suggestion generated");
    } catch (error) {
      toast.error("Failed to generate AI suggestion");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between -mt-1 mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          Comments & Activity
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAISuggestion}
          disabled={loadingAI}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          {loadingAI ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Bot className="w-4 h-4 mr-2" />
          )}
          AI Suggestion
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
              <Avatar className="w-8 h-8 bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                {getCommentIcon(comment.comment_type)}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-200">{comment.created_by}</span>
                  <span className="text-xs text-slate-500">
                    {format(new Date(comment.created_date), "MMM d, yyyy 'at' HH:mm")}
                  </span>
                  {comment.comment_type !== "comment" && (
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                      {comment.comment_type.replace("_", " ")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 text-white bg-slate-900/50 border-slate-600 placeholder:text-slate-400 focus-visible:ring-cyan-500"
        />
        <Button 
          type="submit" 
          disabled={!newComment.trim() || addCommentMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}