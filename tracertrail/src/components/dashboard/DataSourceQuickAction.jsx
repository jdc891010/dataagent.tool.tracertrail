import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  ArrowRight,
  Clock 
} from "lucide-react";
import { useDataSourceProcessing } from "@/hooks/useDataSourceProcessing";
import { formatDuration } from "date-fns";

export default function DataSourceQuickAction({ source }) {
  const { activeRun, handleStatusChange, isLoading } = useDataSourceProcessing(source);
  // Timer logic - commented out for v2 rework per user request
  /*
  const [elapsed, setElapsed] = useState(0);

  // Calculate base time from historical total (stored in ms)
  const baseTimeMs = Number(source.total_processing_duration || 0);

  useEffect(() => {
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

    // Initial update
    updateTimer();

    if (source.status === 'in_progress') {
      interval = setInterval(updateTimer, 1000);
    }

    return () => clearInterval(interval);
  }, [source.status, activeRun, baseTimeMs, source.last_run_date, source.updated_date]);

  const formatTime = (ms) => {
    if (!ms) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  */

  const getStatusColor = () => {
    switch (source.status) {
      case 'in_progress': return 'text-green-400';
      case 'paused': return 'text-orange-400';
      case 'stopped': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getTimerColor = () => {
    switch (source.status) {
      case 'in_progress': return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'paused': return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
      case 'stopped': return 'bg-red-900/30 text-red-400 border-red-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all group">
      <Link 
        to={createPageUrl(`DataSourceDetail?id=${source.id}`)}
        className="flex items-center gap-3 flex-1 min-w-0 mr-4"
      >
        {source.status === 'in_progress' ? (
          <Play className="w-4 h-4 text-green-400 flex-shrink-0" />
        ) : source.status === 'paused' ? (
          <Pause className="w-4 h-4 text-orange-400 flex-shrink-0" />
        ) : source.status === 'alert' ? (
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
        ) : (
          <Square className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white group-hover:text-cyan-400 truncate transition-colors">
            {source.name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <Badge className={source.phase === 'completed' ? 'bg-green-600' : 'bg-blue-600'}>
              {source.phase?.replace('_', ' ')}
            </Badge>
            {source.source_location && (
              <span className="font-mono truncate hidden sm:inline">{source.source_location}</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Last updated: {source.updated_date ? new Date(source.updated_date).toUTCString() : 'N/A'}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {/* Timer - commented out for v2 rework per user request */}
        {/*
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${getTimerColor()} font-mono text-sm`}>
          <Clock className="w-3 h-3" />
          {formatTime(elapsed)}
        </div>
        */}

        {/* Controls - commented out for v2 rework per user request */}
        {/*
        <div className="flex items-center gap-1">
          {source.status !== 'in_progress' ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-900/20"
              onClick={() => handleStatusChange('in_progress')}
              disabled={isLoading}
            >
              <Play className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
                onClick={() => handleStatusChange('paused')}
                disabled={isLoading}
              >
                <Pause className="w-4 h-4 fill-current" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => handleStatusChange('stopped')}
                disabled={isLoading}
              >
                <Square className="w-4 h-4 fill-current" />
              </Button>
            </>
          )}
        </div>
        */}
        
        <Link to={createPageUrl(`DataSourceDetail?id=${source.id}`)}>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-cyan-400">
                <ArrowRight className="w-4 h-4" />
            </Button>
        </Link>
      </div>
    </div>
  );
}
