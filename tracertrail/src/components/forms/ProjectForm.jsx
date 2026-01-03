import { useState } from "react";
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

export default function ProjectForm({ project, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    client: project?.client || "",
    solution: project?.solution || [],
    data_steward: project?.data_steward || "",
    data_owner: project?.data_owner || "",
    governance_classification: project?.governance_classification || "internal",
    compliance_requirements: project?.compliance_requirements || [],
    status: project?.status || "active",
    tags: project?.tags || []
  });
  
  const [complianceInput, setComplianceInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [solutionInput, setSolutionInput] = useState("");

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
            <Label htmlFor="name" className="text-slate-300">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Customer Analytics"
              required
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the purpose and scope of this project"
              rows={3}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <Label htmlFor="client" className="text-slate-300">Client</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => handleChange("client", e.target.value)}
              placeholder="Client name or organization"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
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
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
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
                placeholder="Person responsible for data quality"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            
            <div>
              <Label htmlFor="data_owner" className="text-slate-300">Data Owner</Label>
              <Input
                id="data_owner"
                value={formData.data_owner}
                onChange={(e) => handleChange("data_owner", e.target.value)}
                placeholder="Business owner of the data"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Governance Classification</Label>
              <Select value={formData.governance_classification} onValueChange={(v) => handleChange("governance_classification", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="public" className="focus:bg-slate-800 focus:text-white">Public</SelectItem>
                  <SelectItem value="internal" className="focus:bg-slate-800 focus:text-white">Internal</SelectItem>
                  <SelectItem value="confidential" className="focus:bg-slate-800 focus:text-white">Confidential</SelectItem>
                  <SelectItem value="restricted" className="focus:bg-slate-800 focus:text-white">Restricted</SelectItem>
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
                  <SelectItem value="planned" className="focus:bg-slate-800 focus:text-white">Planned</SelectItem>
                  <SelectItem value="active" className="focus:bg-slate-800 focus:text-white">Active</SelectItem>
                  <SelectItem value="archived" className="focus:bg-slate-800 focus:text-white">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-transparent border-0 shadow-none p-0">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg text-white">Compliance & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div>
            <Label className="text-slate-300">Compliance Requirements</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={complianceInput}
                onChange={(e) => setComplianceInput(e.target.value)}
                placeholder="e.g., GDPR, HIPAA, SOX"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCompliance())}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button type="button" onClick={addCompliance} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.compliance_requirements.map((req, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded-full text-sm">
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
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button type="button" onClick={addTag} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 border border-slate-600 rounded-full text-sm">
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
          {project ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}