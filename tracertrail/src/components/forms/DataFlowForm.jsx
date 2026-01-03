import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2 } from "lucide-react";

export default function DataFlowForm({ sources = [], onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: "",
    source_ids: [],
    target_id: "",
    description: "",
    status: "active"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSource = (sourceId) => {
    setFormData(prev => ({
      ...prev,
      source_ids: prev.source_ids.includes(sourceId)
        ? prev.source_ids.filter(id => id !== sourceId)
        : [...prev.source_ids, sourceId]
    }));
  };

  const availableSources = sources.filter(s => s.id !== formData.target_id);
  const availableTargets = sources.filter(s => !formData.source_ids.includes(s.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-slate-300">Flow Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Sales Data Pipeline"
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
          placeholder="Describe this data flow..."
          rows={3}
          className="bg-slate-900 border-slate-700 text-white"
        />
      </div>

      <div>
        <Label className="text-slate-300">Source Data Sources *</Label>
        <div className="border border-slate-700 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-slate-900">
          {availableSources.length === 0 ? (
            <p className="text-sm text-slate-500">No sources available</p>
          ) : (
            availableSources.map(source => (
              <div key={source.id} className="flex items-center gap-2">
                <Checkbox
                  checked={formData.source_ids.includes(source.id)}
                  onCheckedChange={() => toggleSource(source.id)}
                  className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label className="text-sm flex-1 cursor-pointer text-slate-300" onClick={() => toggleSource(source.id)}>
                  {source.name} <span className="text-slate-500">({source.type})</span>
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <Label className="text-slate-300">Target Data Source *</Label>
        <Select value={formData.target_id} onValueChange={(v) => handleChange("target_id", v)}>
          <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Select target" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-white">
            {availableTargets.map(source => (
              <SelectItem key={source.id} value={source.id} className="focus:bg-slate-800 focus:text-white">
                {source.name} ({source.type})
              </SelectItem>
            ))}
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
            <SelectItem value="paused" className="focus:bg-slate-800 focus:text-white">Paused</SelectItem>
            <SelectItem value="stopped" className="focus:bg-slate-800 focus:text-white">Stopped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name || formData.source_ids.length === 0 || !formData.target_id} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Create Flow
        </Button>
      </div>
    </form>
  );
}