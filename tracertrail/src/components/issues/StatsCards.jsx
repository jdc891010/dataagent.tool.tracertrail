import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2, TrendingUp } from "lucide-react";

export default function StatsCards({ issues }) {
  const openCount = issues.filter(i => i.status === "open").length;
  const inProgressCount = issues.filter(i => i.status === "in_progress").length;
  const resolvedCount = issues.filter(i => ["fixed", "verified"].includes(i.status)).length;
  const criticalCount = issues.filter(i => i.severity === "critical" && i.status === "open").length;

  const stats = [
    {
      label: "Open Issues",
      value: openCount,
      icon: AlertCircle,
      color: "text-blue-400",
      bg: "bg-blue-900/30"
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      color: "text-purple-400",
      bg: "bg-purple-900/30"
    },
    {
      label: "Resolved",
      value: resolvedCount,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-900/30"
    },
    {
      label: "Critical Open",
      value: criticalCount,
      icon: TrendingUp,
      color: "text-red-400",
      bg: "bg-red-900/30"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="p-4 bg-slate-800 border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}