import { Card } from "@/components/ui/card";
import { Calendar, User, Table2, Hash, ChevronRight, FolderTree, Database, FileText, Image } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SeverityBadge from "./SeverityBadge";
import StatusBadge from "./StatusBadge";
import IssueTypeBadge from "./IssueTypeBadge";

export default function IssueCard({ issue, affectedColumns = [] }) {
  return (
    <Link to={createPageUrl(`IssueDetail?id=${issue.id}`)}>
      <Card className="p-4 bg-slate-800 border-slate-700 hover:shadow-md hover:border-cyan-500/50 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-400">#{issue.id?.slice(-6)}</span>
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
            </div>
            
            <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
              {issue.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <IssueTypeBadge type={issue.issue_type} />
              
              {issue.discovery_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(issue.discovery_date), "MMM d, yyyy")}
                </span>
              )}
              
              {issue.reporter && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {issue.reporter}
                </span>
              )}
              
              {affectedColumns.length > 0 && (
                <span className="flex items-center gap-1">
                  <Table2 className="w-3 h-3" />
                  {affectedColumns[0].table_name}
                  {affectedColumns.length > 1 && ` +${affectedColumns.length - 1}`}
                </span>
              )}
              
              {issue.rows_affected && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {issue.rows_affected.toLocaleString()} rows
                </span>
              )}
            </div>
            
            {(issue.project || issue.dataset || issue.file) && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
                {issue.project && (
                  <span className="flex items-center gap-1">
                    <FolderTree className="w-3 h-3" />
                    {issue.project}
                  </span>
                )}
                {issue.dataset && (
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {issue.dataset}
                  </span>
                )}
                {issue.file && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {issue.file}
                  </span>
                )}
              </div>
            )}
            
            {issue.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {issue.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-full">
                    {tag}
                  </span>
                ))}
                {issue.tags.length > 3 && (
                  <span className="text-xs text-slate-400">+{issue.tags.length - 3}</span>
                )}
              </div>
            )}
            
            {issue.screenshots?.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <Image className="w-3 h-3" />
                {issue.screenshots.length} screenshot{issue.screenshots.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {issue.screenshots?.length > 0 && issue.screenshots[0] && (
              <img 
                src={issue.screenshots[0]} 
                alt="Preview"
                className="w-16 h-16 object-cover rounded border border-slate-700"
              />
            )}
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
          </div>
        </div>
      </Card>
    </Link>
  );
}