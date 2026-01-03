import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderTree, Database, GitBranch, FileText, ArrowRight, CheckCircle } from "lucide-react";
import AppNav from "@/components/navigation/AppNav";
import logo from "@/assets/logo.png";

export default function Guide() {
  const steps = [
    {
      number: 1,
      title: "Create a Project",
      icon: FolderTree,
      description: "Start by creating a project to organize your data governance efforts. Projects group related datasets and help you manage compliance requirements.",
      details: [
        "Define the project name and description",
        "Set governance classification (public, internal, confidential, restricted)",
        "Assign data steward and owner",
        "Add compliance requirements (GDPR, HIPAA, etc.)",
        "Add relevant tags for categorization"
      ],
      action: "Create Project",
      link: "Projects"
    },
    {
      number: 2,
      title: "Add Datasets",
      icon: Database,
      description: "Create datasets within your project. Datasets represent logical groupings of data from specific source systems.",
      details: [
        "Link dataset to a project",
        "Specify source system and type (database, file, API, etc.)",
        "Set refresh frequency (real-time, hourly, daily, etc.)",
        "Mark if dataset contains PII",
        "Define data retention policies",
        "Add dataset-specific tags"
      ],
      action: "Add Dataset",
      link: "Datasets"
    },
    {
      number: 3,
      title: "Configure Data Sources",
      icon: GitBranch,
      description: "Set up data sources to track the actual ingestion processes. Data sources are linked to datasets and track quality metrics.",
      details: [
        "Link to parent dataset",
        "Define source and target locations",
        "Monitor processing status in real-time",
        "Track quality metrics (completeness, accuracy, timeliness)",
        "View records processed and failed counts",
        "Upload processing logs for audit trail"
      ],
      action: "Add Data Source",
      link: "DataSources"
    },
    {
      number: 4,
      title: "Log and Track Issues",
      icon: FileText,
      description: "When data quality issues occur, log them with detailed context. The system helps identify patterns and systemic problems.",
      details: [
        "Document issue with title and description",
        "Link to specific project, dataset, or file",
        "Set severity (critical, high, medium, low)",
        "Assign to team members with due dates",
        "Add code snippets for diagnosis and fixes",
        "Track affected tables and columns",
        "Get AI-powered solution suggestions",
        "Monitor resolution through comments and status updates"
      ],
      action: "Log Issue",
      link: "NewIssue"
    }
  ];

  const features = [
    {
      title: "Data Lineage Visualization",
      description: "View interactive graphs showing data flow from projects to datasets to sources"
    },
    {
      title: "Issue Analytics",
      description: "Identify systemic issues vs one-off incidents with automatic clustering"
    },
    {
      title: "AI-Powered Suggestions",
      description: "Get intelligent recommendations for resolving common data quality issues"
    },
    {
      title: "Collaboration Tools",
      description: "Assign issues, comment, track history, and work together as a team"
    }
  ];

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src={logo}
                alt="DataAgent" 
                className="h-16 w-auto object-contain"
              />
              <h1 className="text-3xl font-bold text-white">
                DataAgent LinTrack Guide
              </h1>
            </div>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              A step-by-step guide to managing your data governance, tracking quality issues, and maintaining data lineage
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-8 mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.number} className="overflow-hidden bg-slate-800 border-slate-700">
                  <CardHeader className="bg-slate-800/50">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-600 text-white font-bold text-xl flex-shrink-0">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <Icon className="w-6 h-6 text-cyan-600" />
                          {step.title}
                        </CardTitle>
                        <p className="text-slate-300">{step.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-2 mb-4">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                    <Link to={createPageUrl(step.link)}>
                      <Button className="w-full sm:w-auto">
                        {step.action}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Workflow Diagram */}
          <Card className="mb-12 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Typical Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <FolderTree className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="font-medium text-white">Project</div>
                  <div className="text-xs text-slate-400">Governance</div>
                </div>
                
                <ArrowRight className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Database className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="font-medium text-white">Dataset</div>
                  <div className="text-xs text-slate-400">Logical Group</div>
                </div>
                
                <ArrowRight className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <GitBranch className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="font-medium text-white">Data Source</div>
                  <div className="text-xs text-slate-400">Ingestion</div>
                </div>
                
                <ArrowRight className="w-6 h-6 text-slate-400 rotate-90 md:rotate-0" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="font-medium text-white">Issues</div>
                  <div className="text-xs text-slate-400">Track & Resolve</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, i) => (
                  <div key={i} className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
                    <h3 className="font-medium text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Start CTA */}
          <div className="mt-12 text-center">
            <Link to={createPageUrl("Projects")}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                Get Started - Create Your First Project
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}