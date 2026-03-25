import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle,
  Loader2,
  Clock,
  Shield,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const EXPIRY_OPTIONS = [
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "1 day" },
  { value: "604800", label: "7 days" },
  { value: "2592000", label: "30 days" },
  { value: "-1", label: "Never" },
];

export default function ApiKeysManager() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("2592000");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState("100");
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await fetch("/api/auth/keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      return response.json();
    }
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["auth-settings"],
    queryFn: async () => {
      const response = await fetch("/api/auth/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    }
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/auth/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create API key");
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedKey(data);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create API key");
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/auth/keys/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete API key");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
      setShowDeleteDialog(false);
      setSelectedKeyId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke API key");
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/auth/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-settings"] });
      toast.success("Settings updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update settings");
    }
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    createKeyMutation.mutate({
      name: newKeyName,
      expires_in: parseInt(newKeyExpiry),
      rate_limit: parseInt(newKeyRateLimit)
    });
  };

  const handleCopyKey = () => {
    if (createdKey?.api_key) {
      navigator.clipboard.writeText(createdKey.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setNewKeyName("");
    setNewKeyExpiry("2592000");
    setNewKeyRateLimit("100");
    setCreatedKey(null);
  };

  const getSettingValue = (key, defaultValue) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  return (
    <div className="space-y-6">
      {/* API Keys Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            API Access Keys
          </CardTitle>
          <CardDescription className="text-slate-400">
            Create API keys to access TraceTrail from external applications like Jupyter notebooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Keys */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-700">
              <Key className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No API keys created yet</p>
              <p className="text-sm text-slate-500 mb-4">
                Create an API key to access TraceTrail from external applications
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div 
                  key={key.id} 
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{key.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        key.is_active 
                          ? "bg-green-900/30 text-green-400 border border-green-500/30" 
                          : "bg-red-900/30 text-red-400 border border-red-500/30"
                      }`}>
                        {key.is_active ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span>Created: {format(new Date(key.created_date), "MMM d, yyyy")}</span>
                      {key.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires: {format(new Date(key.expires_at), "MMM d, yyyy")}
                        </span>
                      )}
                      <span>Rate limit: {key.rate_limit}/min</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedKeyId(key.id);
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New API Key
          </Button>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-cyan-400" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <h4 className="font-medium text-white mb-2">1. Get an Access Token</h4>
              <pre className="bg-slate-950 p-3 rounded text-xs text-cyan-300 overflow-x-auto">
{`curl -X POST http://localhost:8081/api/auth/token/issue \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "sk_your_api_key_here"}'`}
              </pre>
              <p className="mt-2 text-slate-400 text-xs">
                This returns an access_token that expires in 1 hour by default
              </p>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <h4 className="font-medium text-white mb-2">2. Use the Token</h4>
              <pre className="bg-slate-950 p-3 rounded text-xs text-cyan-300 overflow-x-auto">
{`curl http://localhost:8081/api/projects \\
  -H "Authorization: Bearer tt_your_access_token_here"`}
              </pre>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <h4 className="font-medium text-white mb-2">3. Refresh the Token</h4>
              <pre className="bg-slate-950 p-3 rounded text-xs text-cyan-300 overflow-x-auto">
{`curl -X POST http://localhost:8081/api/auth/token/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"token": "tt_your_current_token"}'`}
              </pre>
            </div>

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs">
                <ExternalLink className="w-3 h-3 inline mr-1" />
                Full API documentation available at{" "}
                <a href="/api/docs" target="_blank" className="underline hover:text-blue-200">
                  /api/docs
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Default Settings
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure default values for new API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Default Token Expiry
              </label>
              <Select 
                value={getSettingValue("default_token_expiry", "3600")}
                onValueChange={(val) => updateSettingsMutation.mutate({ default_token_expiry: parseInt(val) })}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {EXPIRY_OPTIONS.filter(o => o.value !== "-1").map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Default Rate Limit (req/min)
              </label>
              <Input
                type="number"
                value={getSettingValue("default_rate_limit", "100")}
                onChange={(e) => updateSettingsMutation.mutate({ default_rate_limit: parseInt(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jupyter Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Jupyter Integration
          </CardTitle>
          <CardDescription className="text-slate-400">
            Connect to an external JupyterHub/JupyterLab instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              JupyterHub URL
            </label>
            <Input
              value={localStorage.getItem('jupyter_url') || ''}
              onChange={(e) => {
                localStorage.setItem('jupyter_url', e.target.value);
              }}
              placeholder="https://jupyter.example.com"
              className="bg-slate-900 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              Enter the URL of your JupyterHub or JupyterLab instance
            </p>
          </div>
          
          <Button
            onClick={() => {
              const url = localStorage.getItem('jupyter_url');
              if (url) {
                window.open(url, '_blank');
              } else {
                toast.error("Please enter a JupyterHub URL first");
              }
            }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Jupyter
          </Button>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs">
              <BookOpen className="w-3 h-3 inline mr-1" />
              In Jupyter, install the TraceTrail SDK:{" "}
              <code className="bg-slate-900 px-1 rounded">pip install tracertrail</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={(open) => !open && handleCloseCreateDialog()}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              {createdKey ? "API Key Created" : "Create New API Key"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {createdKey ? (
                <div className="space-y-4 mt-2">
                  <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-300 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Save this key now!</span>
                    </div>
                    <p className="text-xs text-yellow-200">
                      This is the only time you'll see this key. Copy it and store it securely.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={createdKey.api_key}
                      readOnly
                      className="bg-slate-950 border-slate-700 text-cyan-300 font-mono text-sm"
                    />
                    <Button 
                      onClick={handleCopyKey}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                "Create a new API key for external access to TraceTrail."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!createdKey && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Key Name
                </label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Jupyter Notebook, External Script"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Expires After
                  </label>
                  <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {EXPIRY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Rate Limit (req/min)
                  </label>
                  <Input
                    type="number"
                    value={newKeyRateLimit}
                    onChange={(e) => setNewKeyRateLimit(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={handleCloseCreateDialog}
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              {createdKey ? "Done" : "Cancel"}
            </AlertDialogAction>
            {!createdKey && (
              <Button 
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {createKeyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Key"
                )}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Revoke API Key
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to revoke this API key? Any applications using this key will no longer be able to access TraceTrail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              className="bg-slate-700 hover:bg-slate-600 text-white"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </AlertDialogAction>
            <Button 
              onClick={() => deleteKeyMutation.mutate(selectedKeyId)}
              disabled={deleteKeyMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteKeyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Key"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
