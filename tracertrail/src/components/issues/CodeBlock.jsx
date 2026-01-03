import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Play, Terminal, Database, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const languageIcons = {
  sql: Database,
  python: Code2,
  bash: Terminal,
  dbt: Database,
  javascript: Code2,
  other: Code2
};

const languageColors = {
  sql: "border-l-blue-500",
  python: "border-l-yellow-500",
  bash: "border-l-green-500",
  dbt: "border-l-orange-500",
  javascript: "border-l-amber-500",
  other: "border-l-slate-400"
};

export default function CodeBlock({ snippet, onExecute }) {
  const [copied, setCopied] = useState(false);
  const Icon = languageIcons[snippet.language] || Code2;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden border-l-4",
      languageColors[snippet.language]
    )}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-300 capitalize">
            {snippet.language}
          </span>
          <span className="text-xs text-slate-300 px-2 py-0.5 bg-slate-700 rounded-full capitalize">
            {snippet.snippet_type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
      
      {snippet.description && (
        <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-700 text-sm text-slate-300">
          {snippet.description}
        </div>
      )}
      
      <pre className="p-4 overflow-x-auto text-sm bg-slate-950">
        <code className="text-slate-200 font-mono whitespace-pre-wrap break-words">
          {snippet.code}
        </code>
      </pre>
      
      {(snippet.executed_by || snippet.rows_affected) && (
        <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400 flex items-center gap-4">
          {snippet.executed_by && (
            <span>Executed by: {snippet.executed_by}</span>
          )}
          {snippet.rows_affected && (
            <span>Rows affected: {snippet.rows_affected.toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  );
}