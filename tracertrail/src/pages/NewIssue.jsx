import { useState, useRef } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Upload, Image, FileCode, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import IssueForm from "@/components/forms/IssueForm";
import CodeSnippetForm from "@/components/forms/CodeSnippetForm";
import CodeBlock from "@/components/issues/CodeBlock";

export default function NewIssue() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get("sourceId");
  const [snippets, setSnippets] = useState([]);
  const [showSnippetForm, setShowSnippetForm] = useState(false);
  const [editingSnippetIndex, setEditingSnippetIndex] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [logFiles, setLogFiles] = useState([]);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadingLog, setUploadingLog] = useState(false);
  const screenshotInputRef = useRef(null);
  const logInputRef = useRef(null);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Create the issue first
      const issue = await dataAgent.entities.Issue.create(data.issueData);
      
      // Then create all snippets with the issue_id
      if (data.snippets.length > 0) {
        await Promise.all(
          data.snippets.map((snippet, index) => 
            dataAgent.entities.CodeSnippet.create({
              ...snippet,
              issue_id: issue.id,
              order_index: index + 1
            })
          )
        );
      }
      
      return issue;
    },
    onSuccess: (result) => {
      toast.success(`Issue created with ${snippets.length} code snippet(s)`);
      navigate(createPageUrl(`IssueDetail?id=${result.id}`));
    },
    onError: () => {
      toast.error("Failed to create issue");
    }
  });

  const handleSubmit = (issueData) => {
    createMutation.mutate({ 
      issueData: {
        ...issueData,
        screenshots,
        log_files: logFiles
      }, 
      snippets 
    });
  };

  const handleUploadScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    try {
      const { file_url } = await dataAgent.integrations.Core.UploadFile({ file });
      setScreenshots([...screenshots, file_url]);
      toast.success("Screenshot uploaded");
    } catch {
      toast.error("Failed to upload screenshot");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleUploadLogFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLog(true);
    try {
      const { file_url } = await dataAgent.integrations.Core.UploadFile({ file });
      setLogFiles([...logFiles, file_url]);
      toast.success("Log file uploaded");
    } catch {
      toast.error("Failed to upload log file");
    } finally {
      setUploadingLog(false);
    }
  };

  const handleRemoveScreenshot = (urlToRemove) => {
    setScreenshots(screenshots.filter(url => url !== urlToRemove));
  };

  const handleRemoveLogFile = (urlToRemove) => {
    setLogFiles(logFiles.filter(url => url !== urlToRemove));
  };

  const handleAddSnippet = (snippetData) => {
    if (editingSnippetIndex !== null) {
      const updated = [...snippets];
      updated[editingSnippetIndex] = snippetData;
      setSnippets(updated);
      setEditingSnippetIndex(null);
    } else {
      setSnippets([...snippets, snippetData]);
    }
    setShowSnippetForm(false);
    toast.success("Snippet added");
  };

  const handleEditSnippet = (index) => {
    setEditingSnippetIndex(index);
    setShowSnippetForm(true);
  };

  const handleDeleteSnippet = (index) => {
    setSnippets(snippets.filter((_, i) => i !== index));
    toast.success("Snippet removed");
  };

  const handleCancelSnippet = () => {
    setShowSnippetForm(false);
    setEditingSnippetIndex(null);
  };

  const handleCancel = () => {
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Log New Issue</h1>
          <p className="text-slate-400">Document a data quality issue for tracking</p>
        </div>

        <IssueForm 
          issue={sourceId ? { data_source_id: sourceId } : null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createMutation.isPending}
        />

        {/* Screenshots Section */}
        <Card className="mt-6 bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Image className="w-5 h-5 text-cyan-400" />
              Screenshots / Images
            </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={uploadingScreenshot}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                onClick={() => screenshotInputRef.current.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                {uploadingScreenshot ? "Uploading..." : "Upload"}
              </Button>
              <input
                type="file"
                ref={screenshotInputRef}
                accept="image/*"
                onChange={handleUploadScreenshot}
                className="hidden"
              />
          </CardHeader>
          <CardContent>
            {screenshots.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No screenshots uploaded. Upload images or graphs showing the issue.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {screenshots.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={url} 
                        alt={`Screenshot ${idx + 1}`} 
                        className="w-full h-32 object-cover rounded-lg border border-slate-700 hover:opacity-80 transition-opacity" 
                      />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-red-600 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveScreenshot(url)}
                    >
                      <X className="w-3 h-3 text-white" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Files Section */}
        <Card className="mt-6 bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <FileCode className="w-5 h-5 text-cyan-400" />
              Log Files
            </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={uploadingLog}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                onClick={() => logInputRef.current.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                {uploadingLog ? "Uploading..." : "Upload"}
              </Button>
              <input
                type="file"
                ref={logInputRef}
                onChange={handleUploadLogFile}
                className="hidden"
              />
          </CardHeader>
          <CardContent>
            {logFiles.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No log files uploaded. Upload log files related to this issue.
              </p>
            ) : (
              <div className="space-y-2">
                {logFiles.map((url, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                    >
                      <FileCode className="w-4 h-4" />
                      Log file {idx + 1}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-950/30"
                      onClick={() => handleRemoveLogFile(url)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code Snippets Section */}
        <Card className="mt-6 bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">Code Snippets</CardTitle>
            <Button 
              size="sm" 
              onClick={() => setShowSnippetForm(true)}
              disabled={showSnippetForm}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Snippet
            </Button>
          </CardHeader>
          <CardContent>
            {showSnippetForm && (
              <div className="mb-4">
                <CodeSnippetForm
                  snippet={editingSnippetIndex !== null ? snippets[editingSnippetIndex] : null}
                  onSubmit={handleAddSnippet}
                  onCancel={handleCancelSnippet}
                  isLoading={false}
                />
              </div>
            )}

            {snippets.length === 0 && !showSnippetForm ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No code snippets added yet. Add diagnostic queries, fixes, or verification scripts.
              </p>
            ) : (
              <div className="space-y-4">
                {snippets.map((snippet, index) => (
                  <div key={index} className="relative group">
                    <CodeBlock snippet={snippet} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-slate-700/80 hover:bg-slate-600"
                        onClick={() => handleEditSnippet(index)}
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-red-600/80 hover:bg-red-700 text-white"
                        onClick={() => handleDeleteSnippet(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}