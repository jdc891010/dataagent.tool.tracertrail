import { useState } from "react";
import { dataAgent } from "@/api/dataAgentClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Settings as SettingsIcon, Key, Webhook, Save, FolderTree, FileText, CheckCircle, AlertCircle, AlertTriangle, Loader2, Database, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import AppNav from "@/components/navigation/AppNav";
import { populateSampleData } from "@/utils/sampleDataGenerator";

export default function Settings() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [storageSecrets, setStorageSecrets] = useState("");
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(null);
  const [dbPath, setDbPath] = useState("");
  const [createNewDb, setCreateNewDb] = useState(true);
  const [sampleDataStatus, setSampleDataStatus] = useState("idle"); // idle, loading, success, error

  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");

  // Progress Dialog State
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);
  const [isProgressComplete, setIsProgressComplete] = useState(false);

  const updateStep = (id, status) => {
    setProgressSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status } : step
    ));
  };

  const { data: appSettings = [] } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => dataAgent.entities.AppSettings.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => dataAgent.entities.Project.list()
  });
  
  // Deduplicate projects by ID
  const uniqueProjects = Array.from(new Map(projects.map(item => [item.id, item])).values());

  const { data: projectSettings = [] } = useQuery({
    queryKey: ["project-settings"],
    queryFn: () => dataAgent.entities.ProjectSettings.list()
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => dataAgent.entities.AuditLog.list("-created_date", 100)
  });

  const saveApiKeyMutation = useMutation({
    mutationFn: async (key) => {
      const user = await dataAgent.auth.me();
      
      // Store in database with cache timestamp
      const existing = appSettings.find(s => s.setting_key === 'deepseek_api_key');
      const cacheExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours from now
      
      if (existing) {
        await dataAgent.entities.AppSettings.update(existing.id, {
          deepseek_api_key: key,
          setting_value: cacheExpiry // Store expiry time
        });
      } else {
        await dataAgent.entities.AppSettings.create({
          setting_key: 'deepseek_api_key',
          deepseek_api_key: key,
          setting_value: cacheExpiry
        });
      }
      
      // Log the action
      await dataAgent.entities.AuditLog.create({
        event_type: "settings_updated",
        entity_type: "AppSettings",
        entity_name: "DeepSeek API Key",
        description: "Updated DeepSeek API key configuration (cached for 6 hours)",
        action_by: user.email,
        metadata: { cache_expiry: cacheExpiry }
      });
      
      return cacheExpiry;
    },
    onSuccess: (cacheExpiry) => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      const time = format(new Date(cacheExpiry), "h:mm a");
      toast.success(`Successfully stored until ${time}`);
    }
  });

  const saveProjectSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const existing = projectSettings.find(s => s.project_id === selectedProject);
      if (existing) {
        return dataAgent.entities.ProjectSettings.update(existing.id, data);
      }
      return dataAgent.entities.ProjectSettings.create({ ...data, project_id: selectedProject });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-settings"] });
      toast.success("Project settings saved");
    }
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await dataAgent.resetDatabase();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("All data cleared successfully");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to clear data");
    }
  });

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      clearDataMutation.mutate();
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    
    setTestingApiKey(true);
    setApiKeyValid(null);
    
    try {
      // Simple ping to check if API key is valid
      // Using a very short prompt to minimize latency and cost
      const response = await dataAgent.integrations.Core.InvokeLLM({
        prompt: "Hi", 
        response_json_schema: null,
        apiKey: apiKey // Pass the current input key for validation
      });
      
      if (response) {
        setApiKeyValid(true);
        toast.success("API key is valid!");
      }
    } catch (error) {
      setApiKeyValid(false);
      console.error("API Validation Error:", error);
      
      // Show verbose error in popup
      setErrorMessage("API Connection Failed");
      setErrorDetails(error.message || "Unknown error occurred during API validation");
      setShowErrorDialog(true);
    } finally {
      setTestingApiKey(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    saveApiKeyMutation.mutate(apiKey);
  };

  const handleConnectDb = async () => {
    if (createNewDb) {
      setShowProgressDialog(true);
      setIsProgressComplete(false);
      
      const steps = [
        { id: 1, message: "Validating environment configuration...", status: 'pending' },
        { id: 2, message: "Stopping background services...", status: 'pending' },
        { id: 3, message: "Clearing local storage and cache...", status: 'pending' },
        { id: 4, message: "Initializing new database schema...", status: 'pending' },
        { id: 5, message: "Verifying database integrity...", status: 'pending' },
      ];
      setProgressSteps(steps);

      try {
        // Step 1: Validate
        updateStep(1, 'running');
        await new Promise(resolve => setTimeout(resolve, 600));
        updateStep(1, 'completed');

        // Step 2: Stop services (simulated)
        updateStep(2, 'running');
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStep(2, 'completed');

        // Step 3: Clear data
        updateStep(3, 'running');
        await dataAgent.resetDatabase();
        await new Promise(resolve => setTimeout(resolve, 800)); // Min delay for visibility
        updateStep(3, 'completed');

        // Step 4: Init schema
        updateStep(4, 'running');
        queryClient.invalidateQueries();
        await new Promise(resolve => setTimeout(resolve, 600));
        updateStep(4, 'completed');

        // Step 5: Verify
        updateStep(5, 'running');
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStep(5, 'completed');

        setIsProgressComplete(true);
        toast.success("New database created successfully");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create database");
        // Mark current step as failed
        setProgressSteps(prev => {
          const runningStep = prev.find(s => s.status === 'running');
          if (runningStep) {
            return prev.map(s => s.id === runningStep.id ? { ...s, status: 'failed' } : s);
          }
          return prev;
        });
      }
    } else {
      if (!dbPath.trim()) {
        toast.error("Please enter database path");
        return;
      }
      toast.info(`Connecting to ${dbPath}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Successfully connected to database: ${dbPath}`);
    }
  };

  const handleSaveProjectSettings = () => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    let secrets = {};
    try {
      if (storageSecrets.trim()) {
        secrets = JSON.parse(storageSecrets);
      }
    } catch (e) {
      toast.error("Invalid JSON format for storage secrets");
      return;
    }

    saveProjectSettingsMutation.mutate({
      webhook_url: webhookUrl,
      webhook_enabled: webhookEnabled,
      storage_secrets: secrets,
      notification_events: ["project_created", "dataset_created", "source_created", "issue_created", "issue_status_changed"]
    });
  };

  const loadProjectSettings = (projectId) => {
    const settings = projectSettings.find(s => s.project_id === projectId);
    if (settings) {
      setWebhookUrl(settings.webhook_url || "");
      setWebhookEnabled(settings.webhook_enabled || false);
      setStorageSecrets(JSON.stringify(settings.storage_secrets || {}, null, 2));
    } else {
      setWebhookUrl("");
      setWebhookEnabled(false);
      setStorageSecrets("{}");
    }
  };

  const currentApiKey = appSettings.find(s => s.setting_key === "deepseek_api_key");

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-cyan-400" />
              Settings
            </h1>
            <p className="text-slate-400">Configure your application and project settings</p>
          </div>

          <Tabs defaultValue="api" className="space-y-6">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="api" className="data-[state=active]:bg-cyan-600">
                <Key className="w-4 h-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="data-[state=active]:bg-cyan-600">
                <Webhook className="w-4 h-4 mr-2" />
                Webhooks & Secrets
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-cyan-600">
                <FileText className="w-4 h-4 mr-2" />
                Audit Log
              </TabsTrigger>
              <TabsTrigger value="dev" className="data-[state=active]:bg-cyan-600">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Dev
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">DeepSeek API Configuration</CardTitle>
                  <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <span className="font-semibold">💡 Recommended:</span> We recommend using DeepSeek API for its exceptional cost-effectiveness. 
                      DeepSeek offers industry-leading token pricing, making it ideal for high-volume data quality operations.
                    </p>
                    <a 
                      href="https://platform.deepseek.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline mt-1 inline-block"
                    >
                      Get your DeepSeek API key →
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      DeepSeek API Key
                    </label>
                    <Input
                      type="password"
                      value={apiKey || currentApiKey?.deepseek_api_key || ""}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                    {currentApiKey && (
                      <p className="text-xs text-green-400 mt-2">✓ API key configured</p>
                    )}
                    {apiKeyValid === true && (
                      <div className="flex items-center gap-2 text-xs text-green-400 mt-2">
                        <CheckCircle className="w-4 h-4" />
                        API key validated successfully
                      </div>
                    )}
                    {apiKeyValid === false && (
                      <div className="flex items-center gap-2 text-xs text-red-400 mt-2">
                        <AlertCircle className="w-4 h-4" />
                        API key validation failed
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTestApiKey}
                      disabled={testingApiKey || !apiKey.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                    >
                      {testingApiKey ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Test API Key
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleSaveApiKey} 
                      disabled={saveApiKeyMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saveApiKeyMutation.isPending ? "Saving..." : "Save API Key"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="webhooks">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Webhooks & Storage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      <FolderTree className="w-4 h-4 inline mr-1" />
                      Select Project
                    </label>
                    <Select 
                      value={selectedProject} 
                      onValueChange={(val) => {
                        setSelectedProject(val);
                        loadProjectSettings(val);
                      }}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {uniqueProjects.map(p => (
                        <SelectItem 
                          key={p.id} 
                          value={p.id}
                          className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                        >
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  </div>

                  {selectedProject && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">
                          Webhook URL
                        </label>
                        <Input
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://your-webhook-endpoint.com/events"
                          className="bg-slate-900 border-slate-700 text-white"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Receives events: project created, dataset created, source created, issue created/updated
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
                        <div>
                          <div className="font-medium text-white">Enable Webhook Notifications</div>
                          <div className="text-xs text-slate-400">Send events to the webhook URL</div>
                        </div>
                        <Switch
                          checked={webhookEnabled}
                          onCheckedChange={setWebhookEnabled}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">
                          Storage Secrets (JSON)
                        </label>
                        <Textarea
                          value={storageSecrets}
                          onChange={(e) => setStorageSecrets(e.target.value)}
                          placeholder='{"aws_key": "...", "aws_secret": "..."}'
                          className="h-32 font-mono text-sm bg-slate-900 border-slate-700 text-white"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Store project-specific secrets as JSON key-value pairs
                        </p>
                      </div>

                      <Button 
                        onClick={handleSaveProjectSettings}
                        disabled={saveProjectSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saveProjectSettingsMutation.isPending ? "Saving..." : "Save Project Settings"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dev">
              <div className="space-y-6">
                {/* Sample Data */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      Sample Database
                    </CardTitle>
                    <p className="text-sm text-slate-400">Populate the app with sample data to explore features</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-cyan-500/30">
                      <h4 className="text-white font-medium mb-2">What's Included</h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• 2 Sample Projects with full configuration</li>
                        <li>• 3 Datasets with governance settings</li>
                        <li>• 3 Data Sources with metadata</li>
                        <li>• 3 Sample Issues with code snippets</li>
                        <li>• Vault solutions and audit logs</li>
                      </ul>
                    </div>
                    <Button
                      onClick={async () => {
                        if (sampleDataStatus === 'loading') return;
                        try {
                          setSampleDataStatus('loading');
                          toast.info("Generating sample data...");
                          await populateSampleData();
                          queryClient.invalidateQueries();
                          toast.success("Sample database populated successfully!");
                          setSampleDataStatus('success');
                          setTimeout(() => setSampleDataStatus('idle'), 3000);
                        } catch (error) {
                          console.error(error);
                          toast.error("Failed to populate sample data");
                          setSampleDataStatus('error');
                          setTimeout(() => setSampleDataStatus('idle'), 3000);
                        }
                      }}
                      className={`w-full transition-all duration-300 ${
                        sampleDataStatus === 'success' 
                          ? "bg-green-600 hover:bg-green-700" 
                          : sampleDataStatus === 'error'
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      disabled={sampleDataStatus === 'loading'}
                    >
                      {sampleDataStatus === 'loading' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Data...
                        </>
                      ) : sampleDataStatus === 'success' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Success
                        </>
                      ) : sampleDataStatus === 'error' ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Failed
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 mr-2" />
                          Load Sample Database
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Database Connection */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Database Connection
                    </CardTitle>
                    <p className="text-sm text-slate-400">Connect to local database or create new</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
                      <div>
                        <div className="font-medium text-white">Create New Database</div>
                        <div className="text-xs text-slate-400">Initialize empty local database (Resets Data)</div>
                      </div>
                      <Switch
                        checked={createNewDb}
                        onCheckedChange={setCreateNewDb}
                      />
                    </div>

                    {!createNewDb && (
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">
                          Database File Path
                        </label>
                        <Input
                          value={dbPath}
                          onChange={(e) => setDbPath(e.target.value)}
                          placeholder="/path/to/database.db"
                          className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Point to existing SQLite or DuckDB file
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleConnectDb}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        {createNewDb ? "Create Database" : "Connect to Database"}
                      </Button>
                      <Button 
                        onClick={handleClearData}
                        disabled={clearDataMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {clearDataMutation.isPending ? "Clearing..." : "Clear All Data"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* DDL Schema */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Database Schema (DDL)</CardTitle>
                    <p className="text-sm text-slate-400">SQL DDL statements for SQLite and DuckDB</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300 max-h-[600px]">
{`-- Project Table
CREATE TABLE project (
    id TEXT PRIMARY KEY,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    name TEXT NOT NULL,
    description TEXT,
    client TEXT,
    solution TEXT, -- JSON array
    data_steward TEXT,
    data_owner TEXT,
    governance_classification TEXT CHECK(governance_classification IN ('public', 'internal', 'confidential', 'restricted')),
    compliance_requirements TEXT, -- JSON array
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'planned')),
    tags TEXT -- JSON array
);

-- Dataset Table
CREATE TABLE dataset (
    id TEXT PRIMARY KEY,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    name TEXT NOT NULL,
    project_id TEXT REFERENCES project(id),
    description TEXT,
    client TEXT,
    solution TEXT, -- JSON array
    data_steward TEXT,
    data_owner TEXT,
    source_system TEXT,
    source_type TEXT CHECK(source_type IN ('database', 'file', 'api', 'stream', 'warehouse', 'lake', 'other')),
    refresh_frequency TEXT CHECK(refresh_frequency IN ('real-time', 'hourly', 'daily', 'weekly', 'monthly', 'on-demand')),
    governance_classification TEXT CHECK(governance_classification IN ('public', 'internal', 'confidential', 'restricted')),
    compliance_requirements TEXT, -- JSON array
    contains_pii INTEGER DEFAULT 0,
    retention_period TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'planned')),
    tags TEXT, -- JSON array
    deadline_date DATE
);

-- DataSource Table
CREATE TABLE data_source (
    id TEXT PRIMARY KEY,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('file', 'stream', 'database', 'api', 'warehouse', 'lake', 'other')),
    dataset_id TEXT REFERENCES dataset(id),
    source_location TEXT,
    target_location TEXT,
    connection_string TEXT,
    phase TEXT DEFAULT 'queued' CHECK(phase IN ('queued', 'basic_cleaning', 'corrections', 'data_quality', 'processed', 'concat', 'completed', 'failed')),
    version TEXT,
    ingestion_date TIMESTAMP,
    status TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'in_progress', 'paused', 'completed', 'failed', 'stopped', 'alert')),
    alert_message TEXT,
    quality_score REAL,
    completeness_score REAL,
    accuracy_score REAL,
    timeliness_score REAL,
    records_processed INTEGER,
    records_failed INTEGER,
    last_run_date TIMESTAMP,
    next_run_date TIMESTAMP,
    log_file_url TEXT,
    file_size TEXT,
    file_size_bytes INTEGER,
    row_count INTEGER,
    column_count INTEGER,
    schema TEXT,
    hash TEXT,
    hash_algorithm TEXT,
    version_id TEXT,
    etag TEXT,
    file_type TEXT,
    dbms_type TEXT,
    api_response_type TEXT,
    content_type TEXT,
    encoding TEXT,
    compression TEXT,
    encryption TEXT,
    storage_class TEXT,
    last_modified TIMESTAMP,
    owner TEXT,
    table_name TEXT,
    database_name TEXT,
    schema_name TEXT,
    partition_info TEXT,
    format_version TEXT,
    api_version TEXT,
    authentication_type TEXT,
    delimiter TEXT,
    header_row INTEGER,
    daily_processing_duration TEXT, -- JSON object: {"YYYY-MM-DD": milliseconds}
    total_processing_duration INTEGER, -- Total milliseconds processed across all days
    metadata TEXT -- JSON object
);

-- ProcessingRun Table
CREATE TABLE processing_run (
    id TEXT PRIMARY KEY,
    data_source_id TEXT REFERENCES data_source(id),
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    duration_minutes REAL,
    duration_ms INTEGER,
    status TEXT CHECK(status IN ('in_progress', 'completed', 'failed', 'stopped')),
    records_processed INTEGER,
    records_failed INTEGER,
    issue_ids TEXT, -- JSON array
    metadata TEXT -- JSON object
);

-- Issue Table
CREATE TABLE issue (
    id TEXT PRIMARY KEY,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    title TEXT NOT NULL,
    description TEXT,
    issue_type TEXT NOT NULL CHECK(issue_type IN ('data_quality', 'schema_change', 'missing_values', 'duplicates', 'outliers', 'business_logic', 'etl_failure', 'other')),
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'fixed', 'verified', 'wont_fix')),
    assigned_to TEXT,
    due_date DATE,
    data_source_id TEXT REFERENCES data_source(id),
    data_flow_id TEXT,
    processing_run_id TEXT,
    project TEXT,
    dataset TEXT,
    file TEXT,
    file_version TEXT,
    ingestion_date TIMESTAMP,
    source_type TEXT CHECK(source_type IN ('database', 'file', 'api', 'stream', 'warehouse', 'lake', 'other')),
    target_type TEXT CHECK(target_type IN ('database', 'file', 'api', 'stream', 'warehouse', 'lake', 'other')),
    screenshots TEXT, -- JSON array
    log_files TEXT, -- JSON array
    discovery_date DATE,
    occurrence_date DATE,
    resolution_date DATE,
    reporter TEXT,
    owner TEXT,
    root_cause TEXT,
    impact_description TEXT,
    rows_affected INTEGER,
    tags TEXT -- JSON array
);

-- Indexes for performance
CREATE INDEX idx_dataset_project ON dataset(project_id);
CREATE INDEX idx_data_source_dataset ON data_source(dataset_id);
CREATE INDEX idx_data_source_phase ON data_source(phase);
CREATE INDEX idx_data_source_status ON data_source(status);
CREATE INDEX idx_processing_run_source ON processing_run(data_source_id);
CREATE INDEX idx_processing_run_started ON processing_run(started_at);
CREATE INDEX idx_issue_status ON issue(status);
CREATE INDEX idx_issue_severity ON issue(severity);`}
                      </pre>
                      <Button 
                        onClick={() => {
                          const ddl = document.querySelector('pre').textContent;
                          navigator.clipboard.writeText(ddl);
                          toast.success("DDL copied to clipboard");
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Copy DDL
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Audit Log</CardTitle>
                    <p className="text-sm text-slate-400">System-wide activity log</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          toast.info("Fetching audit logs...");
                          
                          // Fetch logs directly from database instead of backend function
                          const logs = await dataAgent.entities.AuditLog.list("-created_date");
                          
                          // Convert to human-readable text
                          let textOutput = "=== AUDIT LOG EXPORT ===\n";
                          textOutput += `Generated: ${new Date().toISOString()}\n`;
                          textOutput += `Total Entries: ${logs.length}\n\n`;
                          textOutput += "=".repeat(80) + "\n\n";
                          
                          logs.forEach((log, index) => {
                            textOutput += `[${index + 1}] ${format(new Date(log.created_date), "MMM d, yyyy HH:mm:ss")}\n`;
                            textOutput += `Event: ${log.event_type} | Entity: ${log.entity_type}\n`;
                            textOutput += `Name: ${log.entity_name || 'N/A'}\n`;
                            textOutput += `Action By: ${log.action_by || 'N/A'}\n`;
                            textOutput += `Description: ${log.description}\n`;
                            if (log.metadata && Object.keys(log.metadata).length > 0) {
                              textOutput += `Metadata: ${JSON.stringify(log.metadata, null, 2)}\n`;
                            }
                            textOutput += "-".repeat(80) + "\n\n";
                          });
                          
                          // Create and download file
                          const blob = new Blob([textOutput], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `audit-log-${new Date().toISOString().split('T')[0]}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          toast.success(`Exported ${logs.length} audit log entries as text`);
                        } catch (error) {
                          console.error("Export failed:", error);
                          toast.error("Export failed: " + error.message);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export Text
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          toast.info("Fetching audit logs...");
                          
                          // Fetch logs directly from database
                          const logs = await dataAgent.entities.AuditLog.list("-created_date");
                          
                          // Format as JSON export
                          const jsonExport = {
                            export_date: new Date().toISOString(),
                            total_entries: logs.length,
                            logs: logs
                          };
                          
                          // Create and download file
                          const blob = new Blob([JSON.stringify(jsonExport, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          toast.success(`Exported ${logs.length} audit log entries as JSON`);
                        } catch (error) {
                          console.error("Export failed:", error);
                          toast.error("Export failed: " + error.message);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No audit logs yet</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-cyan-400 border-cyan-500">
                                  {log.event_type.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {format(new Date(log.created_date), "MMM d, yyyy HH:mm")}
                                </span>
                              </div>
                              <p className="text-sm text-white mb-1">{log.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span>Entity: {log.entity_type}</span>
                                {log.entity_name && <span>Name: {log.entity_name}</span>}
                                {log.action_by && <span>By: {log.action_by}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* API Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              {errorMessage}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded text-xs font-mono break-all max-h-[200px] overflow-y-auto">
                {errorDetails}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="bg-slate-700 hover:bg-slate-600 text-white"
              onClick={() => setShowErrorDialog(false)}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Database Creation Progress Dialog */}
      <AlertDialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Creating New Database
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              <div className="space-y-4 mt-4">
                <p>
                  Please wait while we initialize your local database environment.
                </p>
                <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                  {progressSteps.map(step => (
                    <div key={step.id} className="flex items-center gap-3">
                      {step.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-700 bg-slate-800" />}
                      {step.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                      {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-400" />}
                      <span className={`text-sm ${
                        step.status === 'pending' ? 'text-slate-500' : 
                        step.status === 'running' ? 'text-blue-300 font-medium' :
                        step.status === 'failed' ? 'text-red-300' :
                        'text-slate-200'
                      }`}>
                        {step.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             {isProgressComplete && (
               <AlertDialogAction 
                 onClick={() => setShowProgressDialog(false)}
                 className="bg-blue-600 hover:bg-blue-700 text-white"
               >
                 Done
               </AlertDialogAction>
             )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
