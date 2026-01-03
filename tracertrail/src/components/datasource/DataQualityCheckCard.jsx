import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Code, 
  Database,
  ChevronDown,
  ChevronRight,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DataQualityCheckCard({ check }) {
  const [expanded, setExpanded] = useState(false);

  const categoryColors = {
    completeness: "bg-blue-950 text-blue-400 border-blue-800",
    accuracy: "bg-green-950 text-green-400 border-green-800",
    consistency: "bg-purple-950 text-purple-400 border-purple-800",
    validity: "bg-orange-950 text-orange-400 border-orange-800",
    timeliness: "bg-cyan-950 text-cyan-400 border-cyan-800",
    integrity: "bg-pink-950 text-pink-400 border-pink-800",
    schema: "bg-indigo-950 text-indigo-400 border-indigo-800"
  };

  const severityColors = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-600 text-white",
    medium: "bg-yellow-600 text-white",
    low: "bg-slate-600 text-white"
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-slate-400" />,
    passed: <CheckCircle className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    skipped: <AlertTriangle className="w-4 h-4 text-yellow-500" />
  };

  const typeLabels = {
    basic: "Basic",
    ai_suggested: "AI Suggested",
    custom: "Custom"
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="hover:bg-slate-700 rounded p-1 transition-colors"
              >
                {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {statusIcons[check.status]}
              <CardTitle className="text-sm font-semibold text-white">{check.check_name}</CardTitle>
            </div>
            <p className="text-xs text-slate-400 ml-9">{check.description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className={categoryColors[check.category]}>
              {check.category}
            </Badge>
            <Badge className={severityColors[check.severity]}>
              {check.severity}
            </Badge>
            {check.check_type === "ai_suggested" && (
          <Badge className="bg-blue-600 text-white">
            ✨ AI
          </Badge>
        )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <Tabs defaultValue="sql" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900">
              <TabsTrigger value="sql" className="data-[state=active]:bg-slate-700">
                <Database className="w-3 h-3 mr-1" />
                SQL Check
              </TabsTrigger>
              <TabsTrigger value="python" className="data-[state=active]:bg-slate-700">
                <Code className="w-3 h-3 mr-1" />
                Python Check
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sql" className="mt-3">
              <div className="relative">
                <pre className="bg-slate-900 p-3 rounded-lg text-xs text-slate-300 overflow-x-auto border border-slate-700">
                  <code>{check.sql_check || "No SQL check provided"}</code>
                </pre>
                {check.sql_check && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(check.sql_check, "SQL")}
                    className="absolute top-2 right-2 h-7 w-7 p-0 hover:bg-slate-800"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="python" className="mt-3">
              <div className="relative">
                <pre className="bg-slate-900 p-3 rounded-lg text-xs text-slate-300 overflow-x-auto border border-slate-700">
                  <code>{check.python_check || "No Python check provided"}</code>
                </pre>
                {check.python_check && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(check.python_check, "Python")}
                    className="absolute top-2 right-2 h-7 w-7 p-0 hover:bg-slate-800"
                  >
                    <Copy className="w-3 h-3 text-slate-400" />
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {check.result_message && (
            <div className="mt-3 p-2 bg-slate-900 rounded text-xs text-slate-400 border border-slate-700">
              <span className="font-semibold">Last Result:</span> {check.result_message}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}