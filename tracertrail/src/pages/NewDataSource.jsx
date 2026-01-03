import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppNav from "@/components/navigation/AppNav";

const sourceTypes = [
  { value: "file", label: "File" },
  { value: "database", label: "Database Table" },
  { value: "api", label: "API Endpoint" },
  { value: "stream", label: "Stream" },
  { value: "warehouse", label: "Data Warehouse" },
  { value: "lake", label: "Data Lake" },
  { value: "other", label: "Other" }
];

const phases = [
  { value: "queued", label: "Queued" },
  { value: "basic_cleaning", label: "Basic Cleaning" },
  { value: "corrections", label: "Corrections" },
  { value: "data_quality", label: "Data Quality" },
  { value: "processed", label: "Processed" },
  { value: "concat", label: "Concatenation" },
  { value: "completed", label: "Completed" }
];

export default function NewDataSource() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    type: "file",
    dataset_id: "",
    source_location: "",
    target_location: "",
    connection_string: "",
    phase: "queued",
    status: "idle"
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => dataAgent.entities.Dataset.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.DataSource.create(data),
    onSuccess: (newSource) => {
      toast.success("Data source created");
      navigate(createPageUrl(`DataSourceDetail?id=${newSource.id}`));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link to={createPageUrl("DataSources")}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sources
            </Button>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">New Data Source</h1>
            <p className="text-slate-400">Add database table, API endpoint, or file to processing queue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Data Source Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Sales Data Feed"
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {sourceTypes.map(t => (
                        <SelectItem key={t.value} value={t.value} className="focus:bg-slate-800 focus:text-white">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300">Dataset</Label>
                  <Select value={formData.dataset_id} onValueChange={(v) => handleChange("dataset_id", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select dataset (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {datasets.map(d => (
                        <SelectItem key={d.id} value={d.id} className="focus:bg-slate-800 focus:text-white">{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="source_location" className="text-slate-300">Source Location *</Label>
                  <Input
                    id="source_location"
                    value={formData.source_location}
                    onChange={(e) => handleChange("source_location", e.target.value)}
                    placeholder={
                      formData.type === 'database' ? 'e.g., schema.table_name' :
                      formData.type === 'api' ? 'e.g., /api/v1/customers' :
                      'e.g., /data/sales.csv'
                    }
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {formData.type === 'database' ? 'Database table name or query' :
                     formData.type === 'api' ? 'API endpoint path' :
                     'File path or storage location'}
                  </p>
                </div>

                {(formData.type === 'database' || formData.type === 'api') && (
                  <div>
                    <Label htmlFor="connection_string" className="text-slate-300">Connection String</Label>
                    <Input
                      id="connection_string"
                      value={formData.connection_string}
                      onChange={(e) => handleChange("connection_string", e.target.value)}
                      placeholder={
                        formData.type === 'database' 
                          ? 'postgresql://host:5432/dbname' 
                          : 'https://api.example.com'
                      }
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="target_location" className="text-slate-300">Target Location</Label>
                  <Input
                    id="target_location"
                    value={formData.target_location}
                    onChange={(e) => handleChange("target_location", e.target.value)}
                    placeholder="e.g., warehouse.schema.table"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Processing Phase</Label>
                  <Select value={formData.phase} onValueChange={(v) => handleChange("phase", v)}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {phases.map(p => (
                        <SelectItem key={p.value} value={p.value} className="focus:bg-slate-800 focus:text-white">{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(createPageUrl("DataSources"))}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Add to Queue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}