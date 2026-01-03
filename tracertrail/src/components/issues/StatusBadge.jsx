import { Badge } from "@/components/ui/badge";
import { Circle, Clock, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  open: {
    icon: Circle,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Open"
  },
  in_progress: {
    icon: Clock,
    className: "bg-purple-50 text-purple-700 border-purple-200",
    label: "In Progress"
  },
  fixed: {
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
    label: "Fixed"
  },
  verified: {
    icon: ShieldCheck,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Verified"
  },
  wont_fix: {
    icon: XCircle,
    className: "bg-slate-50 text-slate-600 border-slate-200",
    label: "Won't Fix"
  }
};

export default function StatusBadge({ status, showIcon = true, className }) {
  const config = statusConfig[status] || statusConfig.open;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}