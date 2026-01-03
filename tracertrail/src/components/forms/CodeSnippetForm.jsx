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
import { Save, X, Loader2 } from "lucide-react";

const snippetTypes = [
  { value: "diagnostic", label: "Diagnostic" },
  { value: "fix", label: "Fix" },
  { value: "verification", label: "Verification" }
];

const languages = [
  { value: "sql", label: "SQL" },
  { value: "python", label: "Python" },
  { value: "dbt", label: "dbt" },
  { value: "bash", label: "Bash" },
  { value: "javascript", label: "JavaScript" },
  { value: "other", label: "Other" }
];

export default function CodeSnippetForm({ snippet, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    snippet_type: snippet?.snippet_type || "diagnostic",
    language: snippet?.language || "sql",
    code: snippet?.code || "",
    description: snippet?.description || "",
    rows_affected: snippet?.rows_affected || "",
    executed_by: snippet?.executed_by || ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      rows_affected: formData.rows_affected ? parseInt(formData.rows_affected) : null
    });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between text-white">
          {snippet ? "Edit Code Snippet" : "Add Code Snippet"}
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-white hover:bg-slate-700">
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Type *</Label>
              <Select value={formData.snippet_type} onValueChange={(v) => handleChange("snippet_type", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {snippetTypes.map(t => (
                    <SelectItem key={t.value} value={t.value} className="focus:bg-slate-800 focus:text-white">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Language *</Label>
              <Select value={formData.language} onValueChange={(v) => handleChange("language", v)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {languages.map(l => (
                    <SelectItem key={l.value} value={l.value} className="focus:bg-slate-800 focus:text-white">{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="What does this code do?"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="code" className="text-slate-300">Code *</Label>
            <Textarea
              id="code"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="Paste your code here..."
              className="bg-slate-900 border-slate-700 text-white font-mono text-sm min-h-[200px]"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="executed_by" className="text-slate-300">Executed By</Label>
              <Input
                id="executed_by"
                value={formData.executed_by}
                onChange={(e) => handleChange("executed_by", e.target.value)}
                placeholder="Who ran this?"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="rows_affected" className="text-slate-300">Rows Affected</Label>
              <Input
                id="rows_affected"
                type="number"
                value={formData.rows_affected}
                onChange={(e) => handleChange("rows_affected", e.target.value)}
                placeholder="Number of rows"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel} 
              disabled={isLoading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Snippet
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
