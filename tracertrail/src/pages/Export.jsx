import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppNav from "@/components/navigation/AppNav";

export default function Export() {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => dataAgent.entities.Dataset.list()
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["data-sources"],
    queryFn: () => dataAgent.entities.DataSource.list()
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => dataAgent.entities.Issue.list()
  });

  const handleExport = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    setExporting(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId);
      const projectDatasets = datasets.filter(d => d.project_id === selectedProjectId);
      const projectSources = sources.filter(s => 
        projectDatasets.some(d => d.id === s.dataset_id)
      );
      const projectIssues = issues.filter(i => i.project === project.name);

      // Prepare data for Excel
      const exportData = {
        project: {
          name: project.name,
          description: project.description,
          data_steward: project.data_steward,
          data_owner: project.data_owner,
          governance_classification: project.governance_classification,
          status: project.status,
          created_date: project.created_date
        },
        datasets: projectDatasets.map(d => ({
          name: d.name,
          description: d.description,
          source_type: d.source_type,
          refresh_frequency: d.refresh_frequency,
          governance_classification: d.governance_classification,
          status: d.status,
          deadline_date: d.deadline_date
        })),
        data_sources: projectSources.map(s => ({
          name: s.name,
          type: s.type,
          source_location: s.source_location,
          target_location: s.target_location,
          phase: s.phase,
          status: s.status,
          quality_score: s.quality_score,
          records_processed: s.records_processed,
          records_failed: s.records_failed,
          last_run_date: s.last_run_date,
          total_processing_duration: s.total_processing_duration || 0
        })),
        issues: projectIssues.map(i => ({
          title: i.title,
          issue_type: i.issue_type,
          severity: i.severity,
          status: i.status,
          assigned_to: i.assigned_to,
          due_date: i.due_date,
          dataset: i.dataset,
          file: i.file,
          discovery_date: i.discovery_date,
          resolution_date: i.resolution_date
        })),
        summary: {
          total_datasets: projectDatasets.length,
          total_sources: projectSources.length,
          sources_completed: projectSources.filter(s => s.phase === 'completed').length,
          sources_failed: projectSources.filter(s => s.phase === 'failed').length,
          total_issues: projectIssues.length,
          open_issues: projectIssues.filter(i => i.status === 'open').length,
          critical_issues: projectIssues.filter(i => i.severity === 'critical').length
        }
      };

      // Convert to CSV format (simplified - in production use a proper Excel library)
      const csvContent = generateCSV(exportData);
      downloadCSV(csvContent, `${project.name}_export.csv`);
      
      toast.success("Export completed");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = (data) => {
    let csv = "";
    
    // Summary
    csv += "SUMMARY\n";
    csv += `Total Datasets,${data.summary.total_datasets}\n`;
    csv += `Total Sources,${data.summary.total_sources}\n`;
    csv += `Sources Completed,${data.summary.sources_completed}\n`;
    csv += `Sources Failed,${data.summary.sources_failed}\n`;
    csv += `Total Issues,${data.summary.total_issues}\n`;
    csv += `Open Issues,${data.summary.open_issues}\n`;
    csv += `Critical Issues,${data.summary.critical_issues}\n\n`;

    // Datasets
    csv += "DATASETS\n";
    csv += "Name,Description,Source Type,Refresh Frequency,Status\n";
    data.datasets.forEach(d => {
      csv += `"${d.name}","${d.description || ''}","${d.source_type || ''}","${d.refresh_frequency || ''}","${d.status}"\n`;
    });
    csv += "\n";

    // Data Sources
    csv += "DATA SOURCES\n";
    csv += "Name,Type,Phase,Status,Quality Score,Records Processed,Records Failed,Total Processing Minutes\n";
    data.data_sources.forEach(s => {
      csv += `"${s.name}","${s.type}","${s.phase}","${s.status}","${s.quality_score || ''}","${s.records_processed || 0}","${s.records_failed || 0}","${Math.round(s.total_processing_duration || 0)}"\n`;
    });
    csv += "\n";

    // Issues
    csv += "ISSUES\n";
    csv += "Title,Type,Severity,Status,Assigned To,Due Date\n";
    data.issues.forEach(i => {
      csv += `"${i.title}","${i.issue_type}","${i.severity}","${i.status}","${i.assigned_to || ''}","${i.due_date || ''}"\n`;
    });

    return csv;
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Export Project Data
            </h1>
            <p className="text-slate-400">Export project details, datasets, sources, and issues to CSV</p>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                Select Project to Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Project</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id} className="focus:bg-slate-800 focus:text-white">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProjectId && (
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Export will include:</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Project summary and metadata</li>
                    <li>• All datasets in this project</li>
                    <li>• All data sources linked to datasets</li>
                    <li>• All issues related to this project</li>
                    <li>• Processing status and statistics</li>
                  </ul>
                </div>
              )}

              <Button 
          onClick={handleExport}
          disabled={!selectedProjectId || exporting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
