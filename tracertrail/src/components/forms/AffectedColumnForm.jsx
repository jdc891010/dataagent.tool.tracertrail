import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X, Loader2 } from "lucide-react";

export default function AffectedColumnForm({ column, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    schema_name: column?.schema_name || "",
    table_name: column?.table_name || "",
    column_name: column?.column_name || ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between text-white">
          {column ? "Edit Affected Column" : "Add Affected Column"}
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-white hover:bg-slate-700">
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="schema_name" className="text-slate-300">Schema Name</Label>
            <Input
              id="schema_name"
              value={formData.schema_name}
              onChange={(e) => handleChange("schema_name", e.target.value)}
              placeholder="e.g., public, analytics"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <div>
            <Label htmlFor="table_name" className="text-slate-300">Table Name *</Label>
            <Input
              id="table_name"
              value={formData.table_name}
              onChange={(e) => handleChange("table_name", e.target.value)}
              placeholder="e.g., users, orders"
              required
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <div>
            <Label htmlFor="column_name" className="text-slate-300">Column Name</Label>
            <Input
              id="column_name"
              value={formData.column_name}
              onChange={(e) => handleChange("column_name", e.target.value)}
              placeholder="e.g., email, created_at"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              onClick={onCancel} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
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
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}