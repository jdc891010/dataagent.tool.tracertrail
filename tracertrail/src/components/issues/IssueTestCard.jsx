import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Code2 } from "lucide-react";

export default function IssueTestCard({ test }) {
  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {test.passed ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <h4 className="font-medium text-white">{test.test_name}</h4>
          </div>
          <span className="text-xs text-slate-400">
            {test.executed_at && format(new Date(test.executed_at), "MMM d, yyyy HH:mm")}
          </span>
        </div>

        {test.test_description && (
          <p className="text-sm text-slate-300 mb-3">{test.test_description}</p>
        )}

        {test.test_query && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Code2 className="w-3 h-3" />
              Test Query/Code
            </div>
            <pre className="bg-slate-950 p-3 rounded text-xs text-slate-300 overflow-x-auto border border-slate-800">
              {test.test_query}
            </pre>
          </div>
        )}

        <div>
          <div className="text-xs text-slate-400 mb-1">Result</div>
          <div className="bg-slate-950 p-3 rounded text-sm text-slate-300 border border-slate-800">
            {test.test_result}
          </div>
        </div>

        {test.executed_by && (
          <div className="mt-3 text-xs text-slate-400">
            Executed by: {test.executed_by}
          </div>
        )}
      </CardContent>
    </Card>
  );
}