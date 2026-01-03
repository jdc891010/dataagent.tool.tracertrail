import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function VaultSolutionForm({ solution, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(solution || {
    title: "",
    description: "",
    code: "",
    language: "sql",
    issue_type: "",
    tags: []
  });

  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="text-sm font-medium text-slate-300 mb-1 block">Title *</label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Remove duplicate records based on composite key"
          required
          className="bg-slate-900 border-slate-700 text-white"
        />
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-slate-300 mb-1 block">Description</label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this solution does and when to use it..."
          className="h-20 bg-slate-900 border-slate-700 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Language *</label>
          <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sql">SQL</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="dbt">dbt</SelectItem>
              <SelectItem value="bash">Bash</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-1 block">Issue Type</label>
          <Select value={formData.issue_type} onValueChange={(value) => setFormData({ ...formData, issue_type: value })}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="data_quality" className="focus:bg-slate-800 focus:text-white">Data Quality</SelectItem>
              <SelectItem value="schema_change" className="focus:bg-slate-800 focus:text-white">Schema Change</SelectItem>
              <SelectItem value="missing_values" className="focus:bg-slate-800 focus:text-white">Missing Values</SelectItem>
              <SelectItem value="duplicates" className="focus:bg-slate-800 focus:text-white">Duplicates</SelectItem>
              <SelectItem value="outliers" className="focus:bg-slate-800 focus:text-white">Outliers</SelectItem>
              <SelectItem value="business_logic" className="focus:bg-slate-800 focus:text-white">Business Logic</SelectItem>
              <SelectItem value="etl_failure" className="focus:bg-slate-800 focus:text-white">ETL Failure</SelectItem>
              <SelectItem value="other" className="focus:bg-slate-800 focus:text-white">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="code" className="text-sm font-medium text-slate-300 mb-1 block">Code Solution *</label>
        <Textarea
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="Paste your code solution here..."
          className="h-48 font-mono text-sm bg-slate-900 border-slate-700 text-white"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300 mb-1 block">Tags</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tags..."
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Button type="button" onClick={addTag} variant="outline" className="border-slate-700 text-white">
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white border-0">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          {isLoading ? "Saving..." : solution ? "Update Solution" : "Add to Vault"}
        </Button>
      </div>
    </form>
  );
}