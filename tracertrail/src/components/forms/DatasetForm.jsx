import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Save, Loader2 } from "lucide-react";

export default function DatasetForm({ dataset, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: dataset?.name || "",
    project_id: dataset?.project_id || "",
    description: dataset?.description || "",
    client: dataset?.client || "",
    solution: dataset?.solution || [],
    data_steward: dataset?.data_steward || "",
    data_owner: dataset?.data_owner || "",
    source_system: dataset?.source_system || "",
    source_type: dataset?.source_type || "",
    refresh_frequency: dataset?.refresh_frequency || "daily",
    governance_classification: dataset?.governance_classification || "internal",
    compliance_requirements: dataset?.compliance_requirements || [],
    contains_pii: dataset?.contains_pii || false,
    retention_period: dataset?.retention_period || "",
    status: dataset?.status || "active",
    tags: dataset?.tags || [],
    deadline_date: dataset?.deadline_date || ""
  });
  
  const [complianceInput, setComplianceInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [solutionInput, setSolutionInput] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCompliance = () => {
    if (complianceInput.trim() && !formData.compliance_requirements.includes(complianceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        compliance_requirements: [...prev.compliance_requirements, complianceInput.trim()]
      }));
      setComplianceInput("");
    }
  };

  const removeCompliance = (req) => {
    setFormData(prev => ({
      ...prev,
      compliance_requirements: prev.compliance_requirements.filter(r => r !== req)
    }));
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

  const addSolution = () => {
    if (solutionInput.trim() && !formData.solution.includes(solutionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        solution: [...prev.solution, solutionInput.trim()]
      }));
      setSolutionInput("");
    }
  };

  const removeSolution = (sol) => {
    setFormData(prev => ({
      ...prev,
      solution: prev.solution.filter(s => s !== sol)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-transparent border-0 shadow-none p-0">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg text-white">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div>
            <Label htmlFor="project_id" className="text-slate-300">Project *</Label>
            <Select value={formData.project_id} onValueChange={(v) => handleChange("project_id", v)} required>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="focus:bg-slate-800 focus:text-white">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="name" className="text-slate-300">Dataset Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., users_production"
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
              placeholder="Describe this dataset"
              rows={3}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="deadline_date" className="text-slate-300">Target Completion Date</Label>
            <Input
              id="deadline_date"
              type="date"
              value={formData.deadline_date}
              onChange={(e) => handleChange("deadline_date", e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="client" className="text-slate-300">Client</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => handleChange("client", e.target.value)}
              placeholder="Client name or organization"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Solution / Use Cases</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={solutionInput}
                onChange={(e) => setSolutionInput(e.target.value)}
                placeholder="e.g., Analytics, Reporting, ML Model"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSolution())}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <Button type="button" onClick={addSolution} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.solution.map((sol, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 text-purple-400 border border-purple-500/30 rounded-full text-sm">
                  {sol}
                  <button type="button" onClick={() => removeSolution(sol)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_steward" className="text-slate-300">Data Steward</Label>
              <Input
                id="data_steward"
                value={formData.data_steward}
                onChange={(e) => handleChange("data_steward", e.target.value)}
                placeholder="Person responsible"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="data_owner" className="text-slate-300">Data Owner</Label>
              <Input
                id="data_owner"
                value={formData.data_owner}
                onChange={(e) => handleChange("data_owner", e.target.value)}
                placeholder="Business owner"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-transparent border-0 shadow-none p-0">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg text-white">Source & Refresh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source_system" className="text-slate-300">Source System</Label>
              <Input
                id="source_system"
                value={formData.source_system}
                onChange={(e) => handleChange("source_system", e.target.value)}
                placeholder="e.g., Salesforce, PostgreSQL"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Source Type</Label>
              <Select value={formData.source_type} onValueChange={(v) => handleChange("source_type", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="database" className="focus:bg-slate-800 focus:text-white">Database</SelectItem>
                  <SelectItem value="file" className="focus:bg-slate-800 focus:text-white">File</SelectItem>
                  <SelectItem value="api" className="focus:bg-slate-800 focus:text-white">API</SelectItem>
                  <SelectItem value="stream" className="focus:bg-slate-800 focus:text-white">Stream</SelectItem>
                  <SelectItem value="warehouse" className="focus:bg-slate-800 focus:text-white">Data Warehouse</SelectItem>
                  <SelectItem value="lake" className="focus:bg-slate-800 focus:text-white">Data Lake</SelectItem>
                  <SelectItem value="other" className="focus:bg-slate-800 focus:text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-slate-300">Refresh Frequency</Label>
            <Select value={formData.refresh_frequency} onValueChange={(v) => handleChange("refresh_frequency", v)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="real-time" className="focus:bg-slate-800 focus:text-white">Real-time</SelectItem>
                <SelectItem value="hourly" className="focus:bg-slate-800 focus:text-white">Hourly</SelectItem>
                <SelectItem value="daily" className="focus:bg-slate-800 focus:text-white">Daily</SelectItem>
                <SelectItem value="weekly" className="focus:bg-slate-800 focus:text-white">Weekly</SelectItem>
                <SelectItem value="monthly" className="focus:bg-slate-800 focus:text-white">Monthly</SelectItem>
                <SelectItem value="on-demand" className="focus:bg-slate-800 focus:text-white">On-demand</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-transparent border-0 shadow-none p-0">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg text-white">Governance & Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Governance Classification</Label>
              <Select value={formData.governance_classification} onValueChange={(v) => handleChange("governance_classification", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="active" className="focus:bg-slate-800 focus:text-white">Active</SelectItem>
                  <SelectItem value="deprecated" className="focus:bg-slate-800 focus:text-white">Deprecated</SelectItem>
                  <SelectItem value="planned" className="focus:bg-slate-800 focus:text-white">Planned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contains_pii"
                checked={formData.contains_pii}
                onCheckedChange={(checked) => handleChange("contains_pii", checked)}
              />
              <Label htmlFor="contains_pii" className="cursor-pointer text-slate-300">
                Contains PII (Personally Identifiable Information)
              </Label>
            </div>
            
            <div>
              <Label htmlFor="retention_period" className="text-slate-300">Retention Period</Label>
              <Input
                id="retention_period"
                value={formData.retention_period}
                onChange={(e) => handleChange("retention_period", e.target.value)}
                placeholder="e.g., 90 days, 7 years"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-slate-300">Compliance Requirements</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={complianceInput}
                onChange={(e) => setComplianceInput(e.target.value)}
                placeholder="e.g., GDPR, HIPAA"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompliance())}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <Button type="button" onClick={addCompliance} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.compliance_requirements.map((req, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 rounded-full text-sm">
                  {req}
                  <button type="button" onClick={() => removeCompliance(req)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
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
          {dataset ? "Update Dataset" : "Create Dataset"}
        </Button>
      </div>
    </form>
  );
}