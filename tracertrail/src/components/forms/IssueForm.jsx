import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const issueTypes = [
  { value: "data_quality", label: "Data Quality" },
  { value: "schema_change", label: "Schema Change" },
  { value: "missing_values", label: "Missing Values" },
  { value: "duplicates", label: "Duplicates" },
  { value: "outliers", label: "Outliers" },
  { value: "business_logic", label: "Business Logic" },
  { value: "etl_failure", label: "ETL Failure" },
  { value: "other", label: "Other" }
];

const severities = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
];

const statuses = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "fixed", label: "Fixed" },
  { value: "verified", label: "Verified" },
  { value: "wont_fix", label: "Won't Fix" }
];

const sourceTargetTypes = [
  { value: "database", label: "Database" },
  { value: "file", label: "File" },
  { value: "api", label: "API" },
  { value: "stream", label: "Stream" },
  { value: "warehouse", label: "Data Warehouse" },
  { value: "lake", label: "Data Lake" },
  { value: "other", label: "Other" }
];

export default function IssueForm({ issue, onSubmit, onCancel, isLoading }) {
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => dataAgent.entities.User.list()
  });

  const { data: flows = [] } = useQuery({
    queryKey: ["data-flows"],
    queryFn: () => dataAgent.entities.DataFlow.list()
  });

  const { data: dataSources = [] } = useQuery({
    queryKey: ["data-sources"],
    queryFn: () => dataAgent.entities.DataSource.list()
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => dataAgent.entities.Dataset.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });

  const [formData, setFormData] = useState({
    title: issue?.title || "",
    description: issue?.description || "",
    issue_type: issue?.issue_type || "data_quality",
    severity: issue?.severity || "medium",
    status: issue?.status || "open",
    assigned_to: issue?.assigned_to || "",
    due_date: issue?.due_date || "",
    data_flow_id: issue?.data_flow_id || "",
    data_source_id: issue?.data_source_id || "",
    processing_run_id: issue?.processing_run_id || "",
    project: issue?.project || "",
    dataset: issue?.dataset || "",
    file: issue?.file || "",
    source_type: issue?.source_type || "",
    target_type: issue?.target_type || "",
    screenshots: issue?.screenshots || [],
    discovery_date: issue?.discovery_date || new Date().toISOString().split("T")[0],
    occurrence_date: issue?.occurrence_date || "",
    resolution_date: issue?.resolution_date || "",
    reporter: issue?.reporter || "",
    owner: issue?.owner || "",
    root_cause: issue?.root_cause || "",
    impact_description: issue?.impact_description || "",
    rows_affected: issue?.rows_affected || "",
    tags: issue?.tags || []
  });
  
  const [tagInput, setTagInput] = useState("");

  const selectedSource = dataSources.find(s => s.id === formData.data_source_id);
  const selectedDataset = selectedSource ? datasets.find(d => d.id === selectedSource.dataset_id) : null;
  const selectedProject = selectedDataset ? projects.find(p => p.id === selectedDataset.project_id) : null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };



  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      rows_affected: formData.rows_affected ? parseInt(formData.rows_affected) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-slate-300">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Brief description of the issue"
              required
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detailed description (supports markdown)"
              rows={4}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Issue Type *</Label>
              <Select value={formData.issue_type} onValueChange={(v) => handleChange("issue_type", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {issueTypes.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-white focus:bg-slate-800 focus:text-white">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Severity *</Label>
              <Select value={formData.severity} onValueChange={(v) => handleChange("severity", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {severities.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-white focus:bg-slate-800 focus:text-white">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Status *</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {statuses.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-white focus:bg-slate-800 focus:text-white">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Assigned To</Label>
              <Select value={formData.assigned_to} onValueChange={(v) => handleChange("assigned_to", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.email} className="text-white focus:bg-slate-800 focus:text-white">{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date" className="text-slate-300">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Related Data Source</Label>
              <Select value={formData.data_source_id} onValueChange={(v) => handleChange("data_source_id", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select data source (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {dataSources.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-white focus:bg-slate-800 focus:text-white">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Related Data Flow</Label>
              <Select value={formData.data_flow_id} onValueChange={(v) => handleChange("data_flow_id", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select data flow (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {flows.map(f => (
                    <SelectItem key={f.id} value={f.id} className="text-white focus:bg-slate-800 focus:text-white">{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Data Lineage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSource ? (
            <div className="p-4 bg-slate-900/50 rounded-lg border border-cyan-500/30">
              <div className="text-sm text-slate-400 mb-2">Linked to Data Source:</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-medium">{selectedSource.name}</span>
                  <span className="text-xs text-slate-500">({selectedSource.type})</span>
                </div>
                {selectedSource.source_location && (
                  <div className="text-xs text-slate-400 font-mono">
                    {selectedSource.source_location}
                  </div>
                )}
                {selectedDataset && (
                  <div className="text-xs text-slate-400">
                    Dataset: <span className="text-cyan-400">{selectedDataset.name}</span>
                  </div>
                )}
                {selectedProject && (
                  <div className="text-xs text-slate-400">
                    Project: <span className="text-cyan-400">{selectedProject.name}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center py-4">
              Select a data source above to link lineage automatically
            </div>
          )}
        </CardContent>
      </Card>
      

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Timeline & People</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discovery_date" className="text-slate-300">Discovery Date</Label>
              <Input
                id="discovery_date"
                type="date"
                value={formData.discovery_date}
                onChange={(e) => handleChange("discovery_date", e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="occurrence_date" className="text-slate-300">Occurrence Date</Label>
              <Input
                id="occurrence_date"
                type="date"
                value={formData.occurrence_date}
                onChange={(e) => handleChange("occurrence_date", e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="resolution_date" className="text-slate-300">Resolution Date</Label>
              <Input
                id="resolution_date"
                type="date"
                value={formData.resolution_date}
                onChange={(e) => handleChange("resolution_date", e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reporter" className="text-slate-300">Reporter</Label>
              <Input
                id="reporter"
                value={formData.reporter}
                onChange={(e) => handleChange("reporter", e.target.value)}
                placeholder="Who found this issue"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="owner" className="text-slate-300">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => handleChange("owner", e.target.value)}
                placeholder="Who is responsible for fixing"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Impact & Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rows_affected" className="text-slate-300">Rows Affected</Label>
            <Input
              id="rows_affected"
              type="number"
              value={formData.rows_affected}
              onChange={(e) => handleChange("rows_affected", e.target.value)}
              placeholder="Number of rows affected"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="impact_description" className="text-slate-300">Impact Description</Label>
            <Textarea
              id="impact_description"
              value={formData.impact_description}
              onChange={(e) => handleChange("impact_description", e.target.value)}
              placeholder="What was the downstream impact?"
              rows={3}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="root_cause" className="text-slate-300">Root Cause</Label>
            <Textarea
              id="root_cause"
              value={formData.root_cause}
              onChange={(e) => handleChange("root_cause", e.target.value)}
              placeholder="Root cause analysis"
              rows={3}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div>
            <Label className="text-slate-300">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <Button type="button" onClick={addTag} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {issue?.id ? "Update Issue" : "Create Issue"}
        </Button>
      </div>
    </form>
  );
}