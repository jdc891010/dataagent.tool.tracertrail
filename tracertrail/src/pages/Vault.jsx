import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Archive, Plus, Search, Copy, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import AppNav from "@/components/navigation/AppNav";
import VaultSolutionForm from "@/components/vault/VaultSolutionForm";
import CodeBlock from "@/components/issues/CodeBlock";

export default function Vault() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: solutions = [], isLoading } = useQuery({
    queryKey: ["vault-solutions"],
    queryFn: () => dataAgent.entities.VaultSolution.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.VaultSolution.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-solutions"] });
      setShowForm(false);
      toast.success("Solution added to vault");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => dataAgent.entities.VaultSolution.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-solutions"] });
      toast.success("Solution removed from vault");
    }
  });

  const incrementUsageMutation = useMutation({
    mutationFn: ({ id, currentCount }) => 
      dataAgent.entities.VaultSolution.update(id, { usage_count: currentCount + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault-solutions"] });
    }
  });

  const handleCopyCode = (solution) => {
    navigator.clipboard.writeText(solution.code || solution.code_snippet || "");
    incrementUsageMutation.mutate({ id: solution.id, currentCount: solution.usage_count || 0 });
    toast.success("Code copied to clipboard");
  };

  const filteredSolutions = solutions.filter(sol => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sol.title?.toLowerCase().includes(search) ||
      sol.description?.toLowerCase().includes(search) ||
      sol.tags?.some(t => t.toLowerCase().includes(search))
    );
  });

  const issueTypeColors = {
    data_quality: "bg-blue-900/30 text-blue-400 border-blue-500/30 border",
    schema_change: "bg-purple-900/30 text-purple-400 border-purple-500/30 border",
    missing_values: "bg-yellow-900/30 text-yellow-400 border-yellow-500/30 border",
    duplicates: "bg-orange-900/30 text-orange-400 border-orange-500/30 border",
    outliers: "bg-red-900/30 text-red-400 border-red-500/30 border",
    business_logic: "bg-green-900/30 text-green-400 border-green-500/30 border",
    etl_failure: "bg-pink-900/30 text-pink-400 border-pink-500/30 border",
    other: "bg-slate-800 text-slate-300 border-slate-700 border"
  };

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Archive className="w-6 h-6 text-cyan-400" />
                Solution Vault
              </h1>
              <p className="text-slate-400">Reusable solutions for common data issues</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Solution
        </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search solutions by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-400">Loading solutions...</div>
          ) : filteredSolutions.length === 0 ? (
            <div className="text-center py-16">
              <Archive className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                {solutions.length === 0 ? "No solutions in vault yet" : "No solutions match your search"}
              </h3>
              <p className="text-slate-400 mb-6">
                {solutions.length === 0 
                  ? "Start building your solution library"
                  : "Try adjusting your search"}
              </p>
              {solutions.length === 0 && (
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Solution
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSolutions.map(solution => (
                <Card key={solution.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-white mb-2">{solution.title}</CardTitle>
                        {solution.description && (
                          <p className="text-sm text-slate-400">{solution.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {solution.issue_type && (
                            <Badge className={issueTypeColors[solution.issue_type]}>
                              {solution.issue_type.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                            {solution.language}
                          </Badge>
                          {solution.tags?.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-slate-400">
                              {tag}
                            </Badge>
                          ))}
                          {/* {(solution.usage_count || 0) > 0 && (
                            <Badge variant="outline" className="text-green-400 border-green-500">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Used {solution.usage_count}x
                            </Badge>
                          )} */}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCopyCode(solution)}
                          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(solution.id)}
                          className="border-slate-700 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock snippet={{ code: solution.code || solution.code_snippet, language: solution.language }} />
                    {solution.source_issue_id && (
                      <Link to={createPageUrl(`IssueDetail?id=${solution.source_issue_id}`)}>
                        <p className="text-xs text-cyan-400 hover:text-cyan-300 mt-2">
                          View original issue →
                        </p>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add Solution to Vault</DialogTitle>
          </DialogHeader>
          <VaultSolutionForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
