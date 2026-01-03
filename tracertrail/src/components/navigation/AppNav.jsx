import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, FolderTree, Database, FileText, GitBranch, Network, TrendingUp, BookOpen, Archive, Settings, Activity, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export default function AppNav() {
  const location = useLocation();
  
  const isActive = (pageName) => {
    return location.pathname.includes(pageName);
  };
  
  const navItems = [
    { name: "Dashboard", icon: Home, page: "Dashboard" },
    { 
      name: "Analytics", 
      icon: TrendingUp, 
      page: "IssueAnalytics",
      children: [
        { name: "Health", icon: Activity, page: "ProjectHealth" }
      ]
    },
    { name: "Lineage", icon: Network, page: "DataLineage" },
    { name: "Projects", icon: FolderTree, page: "Projects" },
    { name: "Datasets", icon: Database, page: "Datasets" },
    { name: "Data Sources", icon: GitBranch, page: "DataSources" },
    { name: "Vault", icon: Archive, page: "Vault" },
    { name: "Export", icon: FileText, page: "Export" },
    { name: "Settings", icon: Settings, page: "Settings" },
  ];
  
  return (
    <nav className="bg-slate-950 border-b border-cyan-500/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16 overflow-x-auto">
          <Link to={createPageUrl("Dashboard")} className="mr-4 flex items-center gap-2">
            <img 
              src={logo}
              alt="DataAgent" 
              className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
            />
            <span className="text-[10px] text-slate-500 font-mono mt-3">v{import.meta.env.PACKAGE_VERSION}</span>
          </Link>
          {navItems.map((item) => (
            item.children ? (
              <DropdownMenu key={item.page}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50",
                      (isActive(item.page) || item.children.some(child => isActive(child.page))) && "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <Link to={createPageUrl(item.page)}>
                    <DropdownMenuItem className="text-slate-300 hover:text-cyan-400 hover:bg-slate-700 cursor-pointer">
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </DropdownMenuItem>
                  </Link>
                  {item.children.map((child) => (
                    <Link key={child.page} to={createPageUrl(child.page)}>
                      <DropdownMenuItem className="text-slate-300 hover:text-cyan-400 hover:bg-slate-700 cursor-pointer">
                        <child.icon className="w-4 h-4 mr-2" />
                        {child.name}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50",
                    isActive(item.page) && "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
}