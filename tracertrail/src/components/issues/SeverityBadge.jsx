import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

const severityConfig = {
  critical: {
    icon: AlertOctagon,
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
  },
  high: {
    icon: AlertTriangle,
    className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
  },
  medium: {
    icon: AlertCircle,
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
  },
  low: {
    icon: Info,
    className: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
  }
};

export default function SeverityBadge({ severity, showIcon = true, className }) {
  const config = severityConfig[severity] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
    </Badge>
  );
}