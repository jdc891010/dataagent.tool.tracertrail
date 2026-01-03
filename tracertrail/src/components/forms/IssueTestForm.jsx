import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function IssueTestForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    test_name: "",
    test_description: "",
    test_query: "",
    test_result: "",
    passed: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      executed_at: new Date().toISOString()
    });
  };

  return (
    <Card className="p-4 bg-slate-900/50 border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-white">Test Name *</Label>
          <Input
            value={formData.test_name}
            onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
            placeholder="e.g., Duplicate check validation"
            required
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div>
          <Label className="text-white">Test Description</Label>
          <Textarea
            value={formData.test_description}
            onChange={(e) => setFormData({ ...formData, test_description: e.target.value })}
            placeholder="What was tested and why"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div>
          <Label className="text-white">Test Query/Code</Label>
          <Textarea
            value={formData.test_query}
            onChange={(e) => setFormData({ ...formData, test_query: e.target.value })}
            placeholder="SQL query or code executed"
            className="bg-slate-800 border-slate-700 text-white font-mono"
          />
        </div>

        <div>
          <Label className="text-white">Test Result *</Label>
          <Textarea
            value={formData.test_result}
            onChange={(e) => setFormData({ ...formData, test_result: e.target.value })}
            placeholder="Output or result of the test"
            required
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.passed}
            onChange={(e) => setFormData({ ...formData, passed: e.target.checked })}
            className="w-4 h-4"
          />
          <Label className="text-white">Test Passed</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onCancel} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
            {isLoading ? "Adding..." : "Add Test"}
          </Button>
        </div>
      </form>
    </Card>
  );
}