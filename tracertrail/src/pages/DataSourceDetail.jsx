import { useState, useEffect, useRef } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComprehensiveQualityChecks from "@/components/datasource/ComprehensiveQualityChecks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  AlertTriangle,
  Key,
  Upload,
  Link as LinkIcon,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  Database,
  FolderTree,
  XCircle,
  Sparkles,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, differenceInDays, parseISO, addDays, isSameDay } from "date-fns";
import AppNav from "@/components/navigation/AppNav";
// import InteractiveLineageGraph from "@/components/lineage/InteractiveLineageGraph";
import DataQualityCheckCard from "@/components/datasource/DataQualityCheckCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


import { useDataSourceProcessing } from "@/hooks/useDataSourceProcessing";

export default function DataSourceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const sourceId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showApiKeyAlert, setShowApiKeyAlert] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [generationLogs, setGenerationLogs] = useState([]);
  const [showGenerationLogs, setShowGenerationLogs] = useState(false);
  const fileInputRef = useRef(null);

  const { data: source } = useQuery({
    queryKey: ["data-source", sourceId],
    queryFn: async ({ signal }) => {
      const sources = await dataAgent.entities.DataSource.filter({ id: sourceId }, null, { signal });
      return sources[0] || null;
    },
    enabled: !!sourceId,
    onSuccess: (data) => {
      if (data?.status === "alert" && data?.alert_message) {
        setShowAlertDialog(true);
      }
    }
  });

  const { data: runs = [] } = useQuery({
    queryKey: ["processing-runs", sourceId],
    queryFn: ({ signal }) => dataAgent.entities.ProcessingRun.filter({ data_source_id: sourceId }, "-started_at", { signal }),
    enabled: !!sourceId
  });

  const { data: allIssues = [] } = useQuery({
    queryKey: ["all-issues"],
    queryFn: ({ signal }) => dataAgent.entities.Issue.list(null, null, { signal })
  });

  const { data: allDataSources = [] } = useQuery({
    queryKey: ["all-data-sources"],
    queryFn: ({ signal }) => dataAgent.entities.DataSource.list(null, null, { signal })
  });

  const { data: allDatasets = [] } = useQuery({
    queryKey: ["all-datasets"],
    queryFn: ({ signal }) => dataAgent.entities.Dataset.list(null, null, { signal })
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ["all-projects"],
    queryFn: ({ signal }) => dataAgent.entities.Project.list(null, null, { signal })
  });

  const issues = allIssues.filter(issue => 
    issue.data_source_id === sourceId || runs.some(run => run.issue_ids?.includes(issue.id))
  );

  const { data: qualityChecks = [], isLoading: checksLoading } = useQuery({
    queryKey: ["quality-checks", sourceId],
    queryFn: ({ signal }) => dataAgent.entities.DataQualityCheck.filter({ data_source_id: sourceId }, null, { signal }),
    enabled: !!sourceId
  });

  // Ensure basic checks are present
  useEffect(() => {
    if (sourceId && !checksLoading) {
      // Check if basic checks exist, if not, generate them
      const ensureBasic = async () => {
        try {
          // Filter for basic checks specifically
          const basicChecks = qualityChecks.filter(check => check.check_type === 'basic');
          if (basicChecks.length === 0 && source) {
            await dataAgent.functions.ensureBasicChecks({ data_source_id: sourceId, source });
            queryClient.invalidateQueries(["quality-checks", sourceId]);
          }
        } catch (error) {
          console.error("Failed to ensure basic checks:", error);
        }
      };
      ensureBasic();
    }
  }, [sourceId, qualityChecks, checksLoading, queryClient, source]);

  const generateChecksMutation = useMutation({
    mutationFn: async () => {
      setGenerationLogs([]);
      setShowGenerationLogs(true);
      const addLog = (msg) => setGenerationLogs(prev => [...prev, msg]);

      addLog("Starting generation process...");
      console.log("[Generate Checks] Starting generation process...");
      console.log("[Generate Checks] Source ID:", sourceId);
      console.log("[Generate Checks] Source data:", source);
      
      toast.info("Step 1/4: Checking API key configuration...");
      addLog("Checking API key configuration...");
      
      // Step 1: Check if DeepSeek API key is configured
      const settings = await dataAgent.entities.AppSettings.filter({ setting_key: 'deepseek_api_key' });
      console.log("[Generate Checks] Settings found:", settings);
      
      const apiKeySetting = settings[0];
      const apiKey = apiKeySetting?.deepseek_api_key;
      
      console.log("[Generate Checks] API key exists:", !!apiKey);
      console.log("[Generate Checks] Cache expiry:", apiKeySetting?.setting_value);
      
      if (!apiKey) {
        addLog("Error: No API key found.");
        console.error("[Generate Checks] No API key found in settings");
        throw new Error("API_KEY_MISSING");
      }
      
      // Check cache validity
      const cacheExpiry = apiKeySetting?.setting_value ? new Date(apiKeySetting.setting_value) : null;
      const cacheValid = cacheExpiry && cacheExpiry > new Date();
      console.log("[Generate Checks] Cache valid:", cacheValid);
      
      if (!cacheValid) {
        addLog("Error: API key cache expired.");
        console.warn("[Generate Checks] API key cache expired");
        toast.warning("API key cache expired. Please re-save your API key in Settings.");
        throw new Error("API_KEY_EXPIRED");
      }
      
      addLog("API key found and valid.");
      toast.success("API key found and valid");
      toast.info("Step 2/4: Testing API connection...");
      addLog("Testing API connection...");

      // Step 2: Test the API key
      try {
        const testResponse = await dataAgent.integrations.Core.InvokeLLM({
          prompt: "Respond with just 'OK'",
        });
        console.log("[Generate Checks] API test response:", testResponse);
        addLog("API connection successful.");
        toast.success("API connection successful");
      } catch (error) {
        addLog(`API test failed: ${error.message}`);
        console.error("[Generate Checks] API test failed:", error);
        throw new Error("API_KEY_INVALID");
      }

      // Step 3: Call backend function to generate checks
      toast.info("Step 3/4: Generating quality checks...");
      addLog("Calling backend function to generate checks...");
      console.log("[Generate Checks] Calling backend function with source_id:", sourceId);
      
      let result;
      try {
        // Use local dataAgent client instead of raw fetch
        // Force regeneration if checks already exist
        const shouldForce = qualityChecks.length > 0;
        result = await dataAgent.functions.generateDataSourceChecks({ 
          data_source_id: sourceId,
          force: shouldForce,
          onProgress: addLog
        });
        console.log("[Generate Checks] Backend response:", result);
      } catch (error) {
        addLog(`Backend call failed: ${error.message}`);
        console.error("[Generate Checks] Backend call failed:", error);
        throw new Error("Failed to call backend function: " + error.message);
      }

      if (!result.success) {
        addLog(`Backend returned error: ${result.error}`);
        console.error("[Generate Checks] Backend returned error:", result);
        throw new Error(result.error || "Backend function failed");
      }
      
      const totalChecks = result.data?.total_count || 0;
      const basicChecks = result.data?.basic_checks?.length || 0;
      const aiChecks = result.data?.ai_checks?.length || 0;
      
      addLog(`Checks created: Total=${totalChecks}, Basic=${basicChecks}, AI=${aiChecks}`);
      console.log("[Generate Checks] Checks created:", { total: totalChecks, basic: basicChecks, ai: aiChecks });
      
      if (totalChecks === 0) {
        addLog("Warning: No checks were created.");
        console.warn("[Generate Checks] No checks were created");
        toast.warning("No quality checks were generated");
        throw new Error("NO_CHECKS_GENERATED");
      }
      
      toast.info("Step 4/4: Refreshing check list...");
      addLog("Refreshing check list...");
      
      return result;
    },
    onSuccess: (data) => {
      const totalChecks = data?.data?.total_count || 0;
      const basicChecks = data?.data?.basic_checks?.length || 0;
      const aiChecks = data?.data?.ai_checks?.length || 0;
      
      console.log("[Generate Checks] Success! Refreshing UI...");
      queryClient.invalidateQueries({ queryKey: ["quality-checks", sourceId] });
      
      toast.success(`✓ Generated ${totalChecks} quality checks (${basicChecks} basic + ${aiChecks} AI-adapted)`, {
        duration: 5000
      });
    },
    onError: (error) => {
      console.error("[Generate Checks] Fatal error:", error);
      console.error("[Generate Checks] Error stack:", error.stack);
      
      if (error.message === "API_KEY_MISSING") {
        setShowApiKeyAlert(true);
      } else if (error.message === "API_KEY_EXPIRED") {
        toast.error("API key cache expired. Go to Settings and re-save your API key.");
      } else if (error.message === "API_KEY_INVALID") {
        toast.error("API key is invalid or connection failed. Check your Settings.");
      } else if (error.message === "NO_CHECKS_GENERATED") {
        toast.error("No quality checks were generated. Check console for details.");
      } else {
        toast.error("Failed: " + error.message);
      }
    }
  });

  const { data: dataset } = useQuery({
    queryKey: ["dataset", source?.dataset_id],
    queryFn: async () => {
      const datasets = await dataAgent.entities.Dataset.filter({ id: source.dataset_id });
      return datasets[0] || null;
    },
    enabled: !!source?.dataset_id
  });

  const { data: project } = useQuery({
    queryKey: ["project", dataset?.project_id],
    queryFn: async () => {
      const projects = await dataAgent.entities.Project.filter({ id: dataset.project_id });
      return projects[0] || null;
    },
    enabled: !!dataset?.project_id
  });

  const updateMutation = useMutation({
    mutationFn: (data) => dataAgent.entities.DataSource.update(sourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-source", sourceId] });
      toast.success("Updated successfully");
    }
  });

  const phases = [
    "queued", "basic_cleaning", "corrections", "data_quality", 
    "processed", "concat", "completed"
  ];

  const phaseLabels = {
    queued: "Queued",
    basic_cleaning: "Basic Cleaning",
    corrections: "Corrections",
    data_quality: "Data Quality",
    processed: "Processed",
    concat: "Concatenation",
    completed: "Completed",
    failed: "Failed"
  };

  const uploadLogMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await dataAgent.integrations.Core.UploadFile({ file });
      return dataAgent.entities.DataSource.update(sourceId, { log_file_url: file_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-source", sourceId] });
      toast.success("Log file uploaded");
    }
  });

  const handleUploadLog = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogMutation.mutate(file);
    }
  };

  const { handleStatusChange: handleProcessingStatusChange, activeRun, isLoading } = useDataSourceProcessing(source);

  // Timer logic - commented out for v2 rework per user request
  /*
  const [elapsed, setElapsed] = useState(0);
  const baseTimeMs = Number(source?.total_processing_duration || 0);

  useEffect(() => {
    if (!source) return;
    
    let interval;
    const updateTimer = () => {
      if (source.status === 'in_progress') {
        const startTime = activeRun?.started_at 
          ? new Date(activeRun.started_at).getTime() 
          : (source.last_run_date ? new Date(source.last_run_date).getTime() : (source.updated_date ? new Date(source.updated_date).getTime() : Date.now()));

        const currentRunDuration = Math.max(0, Date.now() - startTime);
        setElapsed(baseTimeMs + currentRunDuration);
      } else {
        setElapsed(baseTimeMs);
      }
    };

    updateTimer();

    if (source.status === 'in_progress') {
      interval = setInterval(updateTimer, 1000);
    }

    return () => clearInterval(interval);
  }, [source?.status, activeRun, baseTimeMs, source?.last_run_date, source?.updated_date]);

  const formatTime = (ms) => {
    if (!ms) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    switch (source?.status) {
      case 'in_progress': return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'paused': return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
      case 'stopped': return 'bg-red-900/30 text-red-400 border-red-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };
  */


  const handleRaiseAlert = () => {
    if (!alertMessage.trim()) {
      toast.error("Please enter an alert message");
      return;
    }
    updateMutation.mutate({ status: "alert", alert_message: alertMessage });
    setAlertMessage("");
    setShowAlertDialog(true);
  };

  const handleClearAlert = () => {
    updateMutation.mutate({ status: "idle", alert_message: null });
    setShowAlertDialog(false);
    toast.success("Alert cleared");
  };

  if (!source) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNav />

      {/* Alert Warning Dialog */}
      {source?.status === "alert" && (
        <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
          <DialogContent className="bg-red-950 border-red-500/50 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-8 h-8" />
                ⚠️ ALERT: Data Ingestion Stopped
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                <h3 className="font-semibold text-white mb-2">Alert Message:</h3>
                <p className="text-slate-200">{source.alert_message}</p>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="font-medium text-slate-300 mb-2">Data Source Details:</h4>
                <div className="space-y-1 text-sm text-slate-400">
                  <div>Name: <span className="text-white">{source.name}</span></div>
                  <div>Type: <span className="text-white capitalize">{source.type}</span></div>
                  <div>Phase: <span className="text-white capitalize">{source.phase}</span></div>
                  {source.source_location && (
                    <div>Location: <span className="text-cyan-400 font-mono text-xs">{source.source_location}</span></div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Action Required
                </h4>
                <p className="text-sm text-slate-300">
                  This data source requires immediate attention. Please review the issues and resolve them before resuming ingestion.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleClearAlert}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Clear Alert & Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAlertDialog(false)}
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* API Key Missing Alert Dialog */}
      <AlertDialog open={showApiKeyAlert} onOpenChange={setShowApiKeyAlert}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <Key className="w-5 h-5 text-orange-400" />
              API Key Missing
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              You need to configure your DeepSeek API key before generating quality checks.
              <br /><br />
              Please go to <strong>Settings → API Keys</strong> to add your key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowApiKeyAlert(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </AlertDialogCancel>
            <Link to={createPageUrl("Settings")}>
              <AlertDialogAction className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Go to Settings
              </AlertDialogAction>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generation Progress Dialog */}
      <Dialog open={showGenerationLogs} onOpenChange={setShowGenerationLogs}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Generating Quality Checks
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-md font-mono text-xs text-slate-300 space-y-1">
            {generationLogs.map((log, i) => (
              <div key={i} className="border-b border-slate-800/50 pb-1 mb-1 last:border-0">
                <span className="text-cyan-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
            {generateChecksMutation.isPending && (
                <div className="flex items-center gap-2 text-cyan-400 mt-2 animate-pulse">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full"/> Processing...
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link to={createPageUrl("DataSources")}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sources
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{source.name}</h1>
              <Badge className="mt-1 bg-cyan-900/30 text-cyan-400 border-cyan-500/30">{source.type}</Badge>
            </div>
            <div className="flex gap-4 items-center">
              <Link to={createPageUrl(`NewIssue?source_id=${sourceId}`)}>
                <Button className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-900/20">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Log Issue
                </Button>
              </Link>

              {/* Timer Display - commented out for v2 rework per user request */}
              {/*
              <div className={`flex items-center gap-3 px-4 py-2 rounded-md border ${getTimerColor()} font-mono text-lg font-bold shadow-lg shadow-black/20`}>
                <Clock className="w-5 h-5" />
                {formatTime(elapsed)}
              </div>
              */}

              {/* Control Buttons - commented out for v2 rework per user request */}
              {/*
              <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700">
                {source.status !== "in_progress" ? (
                  <Button 
                    onClick={() => handleProcessingStatusChange("in_progress")} 
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-500 text-white min-w-[140px] shadow-lg shadow-green-900/20"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    {source.status === 'paused' || source.status === 'stopped' ? 'Resume' : 'Start Processing'}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => handleProcessingStatusChange("paused")} 
                      disabled={isLoading}
                      variant="outline"
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-950 hover:text-orange-300 hover:border-orange-500"
                    >
                      <Pause className="w-4 h-4 mr-2 fill-current" />
                      Pause
                    </Button>
                    <Button 
                      onClick={() => handleProcessingStatusChange("stopped")} 
                      disabled={isLoading}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-950 hover:text-red-300 hover:border-red-500"
                    >
                      <Square className="w-4 h-4 mr-2 fill-current" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
              */}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">
                <Database className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="whisper" className="data-[state=active]:bg-blue-600 data-[state=active]:hover:bg-blue-700">
                <Sparkles className="w-4 h-4 mr-2" />
                DataAgent Whisper
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-6">
            {activeTab === "overview" && (
              <>
            {/* Interactive Lineage Graph
            <InteractiveLineageGraph
              currentEntity={source}
              entityType="dataSource"
              project={project}
              dataset={dataset}
              dataSource={source}
              issues={issues}
              allDataSources={allDataSources}
              allDatasets={allDatasets}
              allProjects={allProjects}
            /> */}

            {/* Dataset & Project Connection */}
            {(dataset || project) && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <FolderTree className="w-5 h-5 text-cyan-400" />
                    Hierarchy Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-cyan-500/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dataset && (
                        <div>
                          <div className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            Dataset
                          </div>
                          <Link to={createPageUrl(`DatasetDetail?id=${dataset.id}`)}>
                            <div className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium text-lg">
                              {dataset.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {dataset.source_system || dataset.source_type}
                            </div>
                          </Link>
                        </div>
                      )}
                      {project && (
                        <div>
                          <div className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                            <FolderTree className="w-3 h-3" />
                            Project
                          </div>
                          <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                            <div className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium text-lg">
                              {project.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 capitalize">
                              {project.governance_classification}
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata / Technical Details */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Metadata & Technical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Source Location */}
                  {source.source_location && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Source Location / Path</div>
                      <div className="font-mono text-sm text-white bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                        {source.source_location}
                      </div>
                    </div>
                  )}

                  {/* Target Location */}
                  {source.target_location && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Target Location</div>
                      <div className="font-mono text-sm text-white bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                        {source.target_location}
                      </div>
                    </div>
                  )}

                  {/* Type & Format */}
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Data Source Type</div>
                    <div className="font-medium text-white capitalize">{source.type}</div>
                  </div>

                  {/* Version */}
                  {source.version && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Version</div>
                      <div className="font-mono text-white">{source.version}</div>
                    </div>
                  )}

                  {/* Ingestion Date */}
                  {source.ingestion_date && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Ingestion Date</div>
                      <div className="text-white">{format(new Date(source.ingestion_date), "MMM d, yyyy HH:mm")}</div>
                    </div>
                  )}

                  {/* Connection String (masked) */}
                  {source.connection_string && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Connection / Endpoint</div>
                      <div className="font-mono text-sm text-white bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                        {source.connection_string}
                      </div>
                    </div>
                  )}

                  {/* File Size */}
                  {source.file_size && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">File Size</div>
                      <div className="text-white">{source.file_size}</div>
                    </div>
                  )}

                  {/* Row Count */}
                  {source.row_count !== undefined && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Row Count</div>
                      <div className="text-white">{source.row_count?.toLocaleString()}</div>
                    </div>
                  )}

                  {/* Column Count */}
                  {source.column_count !== undefined && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Column Count</div>
                      <div className="text-white">{source.column_count}</div>
                    </div>
                  )}

                  {/* File Type / DBMS Type / API Response Type */}
                  {source.file_type && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">File Type</div>
                      <div className="text-white uppercase">{source.file_type}</div>
                    </div>
                  )}

                  {source.dbms_type && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Database Type</div>
                      <div className="text-white">{source.dbms_type}</div>
                    </div>
                  )}

                  {source.api_response_type && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">API Response Format</div>
                      <div className="text-white uppercase">{source.api_response_type}</div>
                    </div>
                  )}

                  {/* Schema */}
                  {source.schema && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-slate-400 mb-1">Schema</div>
                      <div className="font-mono text-xs text-white bg-slate-900/50 p-2 rounded border border-slate-700 max-h-32 overflow-y-auto">
                        {typeof source.schema === 'object' ? JSON.stringify(source.schema, null, 2) : source.schema}
                      </div>
                    </div>
                  )}

                  {/* Hash / Checksum */}
                  {source.hash && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Hash / Checksum</div>
                      <div className="font-mono text-xs text-white bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                        {source.hash}
                      </div>
                    </div>
                  )}

                  {/* S3 Version ID */}
                  {source.version_id && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">S3 Version ID</div>
                      <div className="font-mono text-xs text-white bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                        {source.version_id}
                      </div>
                    </div>
                  )}

                  {/* ETag */}
                  {source.etag && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">ETag</div>
                      <div className="font-mono text-xs text-white bg-slate-900/50 p-2 rounded border border-slate-700 break-all">
                        {source.etag}
                      </div>
                    </div>
                  )}

                  {/* Hash Algorithm */}
                  {source.hash_algorithm && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Hash Algorithm</div>
                      <div className="text-white uppercase">{source.hash_algorithm}</div>
                    </div>
                  )}

                  {/* Content Type */}
                  {source.content_type && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Content Type</div>
                      <div className="font-mono text-xs text-white">{source.content_type}</div>
                    </div>
                  )}

                  {/* Encoding */}
                  {source.encoding && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Encoding</div>
                      <div className="text-white uppercase">{source.encoding}</div>
                    </div>
                  )}

                  {/* Compression */}
                  {source.compression && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Compression</div>
                      <div className="text-white capitalize">{source.compression}</div>
                    </div>
                  )}

                  {/* Encryption */}
                  {source.encryption && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Encryption</div>
                      <div className="text-white">{source.encryption}</div>
                    </div>
                  )}

                  {/* Storage Class */}
                  {source.storage_class && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Storage Class</div>
                      <div className="text-white uppercase">{source.storage_class}</div>
                    </div>
                  )}

                  {/* Database Fields */}
                  {source.database_name && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Database Name</div>
                      <div className="font-mono text-sm text-white">{source.database_name}</div>
                    </div>
                  )}

                  {source.schema_name && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Schema Name</div>
                      <div className="font-mono text-sm text-white">{source.schema_name}</div>
                    </div>
                  )}

                  {source.table_name && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Table Name</div>
                      <div className="font-mono text-sm text-white">{source.table_name}</div>
                    </div>
                  )}

                  {/* API Fields */}
                  {source.api_version && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">API Version</div>
                      <div className="text-white">{source.api_version}</div>
                    </div>
                  )}

                  {source.authentication_type && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Authentication</div>
                      <div className="text-white">{source.authentication_type}</div>
                    </div>
                  )}

                  {/* File Format Details */}
                  {source.delimiter && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Delimiter</div>
                      <div className="font-mono text-white">{source.delimiter === '\t' ? 'Tab' : source.delimiter}</div>
                    </div>
                  )}

                  {source.header_row !== undefined && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Header Row</div>
                      <div className="text-white">{source.header_row ? 'Yes' : 'No'}</div>
                    </div>
                  )}

                  {source.format_version && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Format Version</div>
                      <div className="text-white">{source.format_version}</div>
                    </div>
                  )}

                  {/* Partition Info */}
                  {source.partition_info && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-slate-400 mb-1">Partition Info</div>
                      <div className="font-mono text-xs text-white bg-slate-900/50 p-2 rounded border border-slate-700">
                        {typeof source.partition_info === 'object' ? JSON.stringify(source.partition_info, null, 2) : source.partition_info}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  {source.created_date && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Created</div>
                      <div className="text-white">{format(new Date(source.created_date), "MMM d, yyyy HH:mm")}</div>
                    </div>
                  )}

                  {source.last_modified && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Last Modified</div>
                      <div className="text-white">{format(new Date(source.last_modified), "MMM d, yyyy HH:mm")}</div>
                    </div>
                  )}

                  {source.owner && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Owner</div>
                      <div className="text-white">{source.owner}</div>
                    </div>
                  )}

                  {/* File Size in Bytes */}
                  {source.file_size_bytes && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Size (Bytes)</div>
                      <div className="font-mono text-xs text-white">{source.file_size_bytes.toLocaleString()}</div>
                    </div>
                  )}

                  {/* Last Run */}
                  {source.last_run_date && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Last Run</div>
                      <div className="text-white">{format(new Date(source.last_run_date), "MMM d, yyyy HH:mm")}</div>
                    </div>
                  )}

                  {/* Next Run */}
                  {source.next_run_date && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Next Scheduled Run</div>
                      <div className="text-cyan-400">{format(new Date(source.next_run_date), "MMM d, yyyy HH:mm")}</div>
                    </div>
                  )}
                </div>

                {/* Additional Metadata Object */}
                {source.metadata && Object.keys(source.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400 mb-2">Additional Metadata</div>
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(source.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Phase */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Processing Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                  {phases.map((phase, idx) => {
                    const isActive = phase === source.phase;
                    const isPast = phases.indexOf(source.phase) > idx;
                    return (
                      <div key={phase} className="flex items-center flex-shrink-0">
                        <button
                          onClick={() => updateMutation.mutate({ phase })}
                          className={`px-3 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                            isActive 
                              ? 'bg-cyan-600 text-white' 
                              : isPast 
                              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {phaseLabels[phase]}
                        </button>
                        {idx < phases.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-slate-600 mx-1 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-slate-400">
                  Click on a phase to update the processing status
                </p>
              </CardContent>
            </Card>

            {/* Quality Metrics - Temporarily commented out for later implementation */}
            {/* <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Data Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Overall Quality</div>
                    <div className="flex items-center gap-2">
                      <Progress value={source.quality_score || 0} className="h-3" />
                      <span className="text-lg font-bold text-white">{source.quality_score || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Completeness</div>
                    <div className="flex items-center gap-2">
                      <Progress value={source.completeness_score || 0} className="h-3" />
                      <span className="text-lg font-bold text-white">{source.completeness_score || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Accuracy</div>
                    <div className="flex items-center gap-2">
                      <Progress value={source.accuracy_score || 0} className="h-3" />
                      <span className="text-lg font-bold text-white">{source.accuracy_score || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-2">Timeliness</div>
                    <div className="flex items-center gap-2">
                      <Progress value={source.timeliness_score || 0} className="h-3" />
                      <span className="text-lg font-bold text-white">{source.timeliness_score || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* Raise Alert */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Raise Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Describe the issue that requires team attention..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={3}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!alertMessage.trim()} className="bg-red-600 hover:bg-red-700">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Stop Ingestion & Alert Team
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Stop Ingestion & Alert Team?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        This will stop the data ingestion immediately and notify the team about this critical issue.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate-700 text-white hover:bg-slate-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRaiseAlert} className="bg-red-600 hover:bg-red-700">
                        Stop & Alert
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Log File */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Log File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {source.log_file_url ? (
                  <a href={source.log_file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-700">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      View Log File
                    </Button>
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">No log file uploaded</p>
                )}
                <div className="flex gap-2">
                    <Button
                  variant="outline"
                  disabled={uploadLogMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadLogMutation.isPending ? "Uploading..." : "Upload Log File"}
                </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadLog}
                      className="hidden"
                    />
                </div>
              </CardContent>
            </Card>

            {/* Processing Timeline - Commented out per user request
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Processing Timeline ({runs.length} runs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {(() => {
                    const dailyMap = source?.daily_processing_duration || {};
                    let rawSeries = [];
                    
                    if (Object.keys(dailyMap).length > 0) {
                        rawSeries = Object.keys(dailyMap).map(date => ({
                            date,
                            totalMinutes: Math.round(Number(dailyMap[date] || 0) / 60000)
                        }));
                    } else if (runs.length > 0) {
                         const temp = {};
                         runs.forEach(r => {
                            if (!r.finished_at || !r.duration_minutes) return;
                            const key = new Date(r.finished_at).toISOString().slice(0, 10);
                            temp[key] = (temp[key] || 0) + Number(r.duration_minutes || 0);
                         });
                         rawSeries = Object.keys(temp).map(date => ({ date, totalMinutes: temp[date] }));
                    }

                    if (rawSeries.length === 0 && !activeRun) {
                      return <p className="text-sm text-slate-400 text-center py-12">No processing data available</p>;
                    }

                    // Add active run duration if in progress
                    if (source?.status === 'in_progress' && activeRun?.started_at) {
                      const today = new Date().toISOString().slice(0, 10);
                      const startTime = new Date(activeRun.started_at).getTime();
                      // Use elapsed state if available to sync exactly with timer, otherwise calculate
                      const currentRunDurationMs = Date.now() - startTime;
                      const currentRunMinutes = Math.floor(currentRunDurationMs / 60000);
                      
                      const existingToday = rawSeries.find(s => s.date === today);
                      if (existingToday) {
                        existingToday.totalMinutes += currentRunMinutes;
                      } else {
                        rawSeries.push({ date: today, totalMinutes: currentRunMinutes });
                      }
                    }

                    // Ensure minimum 14 days range
                    rawSeries.sort((a, b) => a.date.localeCompare(b.date));
                    
                    const dataMap = new Map(rawSeries.map(i => [i.date, i.totalMinutes]));
                    const dates = rawSeries.map(d => d.date);
                    let minDate = parseISO(dates[0]);
                    let maxDate = parseISO(dates[dates.length - 1]);

                    const daysCovered = differenceInDays(maxDate, minDate) + 1;
                    if (daysCovered < 14) {
                        const daysToAdd = 14 - daysCovered;
                        minDate = subDays(minDate, daysToAdd);
                    }

                    const paddedSeries = [];
                    let curr = minDate;
                    while (curr <= maxDate) {
                        const dateStr = format(curr, 'yyyy-MM-dd');
                        paddedSeries.push({
                            date: dateStr,
                            totalMinutes: dataMap.get(dateStr) || 0
                        });
                        curr = addDays(curr, 1);
                    }

                    // Mock distribution for stacked visualization based on user request
                    const series = paddedSeries.map(item => {
                        const total = item.totalMinutes;
                        if (total === 0) {
                             return {
                                date: item.date,
                                queued: 0,
                                basic_cleaning: 0,
                                corrections: 0,
                                data_quality: 0,
                                processed: 0,
                                concat: 0,
                                completed: 0
                            };
                        }

                        // Calculate parts
                        const queued = Math.floor(total * 0.05);
                        const basic_cleaning = Math.floor(total * 0.25);
                        const corrections = Math.floor(total * 0.15);
                        const data_quality = Math.floor(total * 0.20);
                        const processed = Math.floor(total * 0.15);
                        const concat = Math.floor(total * 0.10);
                        
                        // Assign remainder to completed to ensure total matches exactly
                        const currentSum = queued + basic_cleaning + corrections + data_quality + processed + concat;
                        const completed = total - currentSum;

                        return {
                            date: item.date,
                            queued,
                            basic_cleaning,
                            corrections,
                            data_quality,
                            processed,
                            concat,
                            completed
                        };
                    });

                    const chartPhaseColors = {
                      queued: "#64748b",
                      basic_cleaning: "#0ea5e9",
                      corrections: "#eab308",
                      data_quality: "#a855f7",
                      processed: "#22c55e",
                      concat: "#ec4899",
                      completed: "#10b981",
                      failed: "#ef4444"
                    };

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={series} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: "#94a3b8", fontSize: 12 }} 
                            tickFormatter={(d) => format(new Date(d), "MMM d")}
                          />
                          <YAxis 
                            tick={{ fill: "#94a3b8", fontSize: 12 }} 
                            label={{ value: "Minutes", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc" }}
                            labelFormatter={(d) => format(new Date(d), "MMM d, yyyy")}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: "20px" }} />
                          {phases.map(phase => (
                             <Bar 
                               key={phase} 
                               dataKey={phase} 
                               stackId="a" 
                               fill={chartPhaseColors[phase] || "#cbd5e1"} 
                               name={phaseLabels[phase]} 
                             />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
            */}

            {/* Related Issues */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Related Issues ({issues.length})</CardTitle>
                  <Link to={createPageUrl(`NewIssue?source_id=${sourceId}`)}>
                    <Button variant="outline" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                      <Plus className="w-4 h-4 mr-1" />
                      Log Issue
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {issues.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No issues logged for this source</p>
                ) : (
                  <div className="space-y-2">
                    {issues.map((issue) => (
                      <Link key={issue.id} to={createPageUrl(`IssueDetail?id=${issue.id}`)}>
                        <div className="p-3 border border-slate-700 rounded hover:border-cyan-500/50 cursor-pointer bg-slate-900/50">
                          <div className="font-medium text-sm text-white">{issue.title}</div>
                          <div className="text-xs text-slate-400">{issue.severity} • {issue.status}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
              </>
            )}

            {activeTab === "whisper" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-white">
                          <Sparkles className="w-6 h-6 text-cyan-400" />
                          DataAgent Whisper
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">
                          AI-powered quality checks tailored to your data context
                        </p>
                      </div>
                      <Button
              onClick={() => generateChecksMutation.mutate()}
              disabled={generateChecksMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generateChecksMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : qualityChecks.length > 0 ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate Checks
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Checks
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/30">
                      <p className="text-sm text-slate-300">
                        DataAgent analyzes your data source context, including project details, dataset configuration, 
                        compliance requirements, and data structure to suggest targeted quality checks. These checks 
                        include both industry-standard validations and context-specific tests based on your unique data scenario.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {checksLoading ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="py-8 text-center text-slate-400">
                      Loading quality checks...
                    </CardContent>
                  </Card>
                ) : qualityChecks.length === 0 ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="py-16 text-center">
                      <Sparkles className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-300 mb-2">No quality checks generated yet</h3>
                      <p className="text-slate-400 mb-6">
                        Click "Generate Checks" to create AI-powered quality checks for this data source
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <ComprehensiveQualityChecks dataSource={source} qualityChecks={qualityChecks} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Key Missing Alert */}
      <AlertDialog open={showApiKeyAlert} onOpenChange={setShowApiKeyAlert}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Configuration Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              To generate AI-powered quality checks, you need to configure your DeepSeek API key.
              <br /><br />
              Please go to <strong>Settings</strong> to add your API key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700 border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => {
                window.location.href = createPageUrl("Settings");
              }}
            >
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
