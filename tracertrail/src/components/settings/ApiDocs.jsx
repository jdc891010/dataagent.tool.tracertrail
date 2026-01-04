
/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Server } from "lucide-react";
import CodeBlock from "@/components/issues/CodeBlock";


export default function ApiDocs() {
  const { data: spec, isLoading, error } = useQuery({
    queryKey: ["openapi-spec"],
    queryFn: async () => {
      const res = await fetch("/api/openapi.json");
      if (!res.ok) throw new Error("Failed to fetch API spec");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-400 bg-red-950/20 border border-red-900 rounded-md">
        Error loading API documentation: {error.message}
      </div>
    );
  }

  // Group paths by tag
  const pathsByTag = {};
  if (spec && spec.paths) {
    Object.entries(spec.paths).forEach(([path, methods]) => {
        Object.entries(methods).forEach(([method, operation]) => {
        const tag = operation.tags?.[0] || "General";
        if (!pathsByTag[tag]) pathsByTag[tag] = [];
        pathsByTag[tag].push({ path, method, ...operation });
        });
    });
  }

  const methodColors = {
    get: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    post: "bg-green-500/20 text-green-400 border-green-500/50",
    put: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    delete: "bg-red-500/20 text-red-400 border-red-500/50",
    patch: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            RESTful API Reference
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Interact with the TracerTrail platform programmatically.
            Base URL: <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">/api</code>
          </p>
        </div>
        <Badge variant="outline" className="border-slate-700 text-slate-400">
          v{spec?.info?.version || "1.0.0"}
        </Badge>
      </div>

      {Object.keys(pathsByTag).length === 0 && (
          <div className="text-slate-400">No API documentation available.</div>
      )}

      {Object.entries(pathsByTag).map(([tag, operations]) => (
        <Card key={tag} className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-200">{tag}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {operations.map((op, i) => (
                <AccordionItem key={`${op.method}-${op.path}`} value={`${tag}-${i}`} className="border-slate-800">
                  <AccordionTrigger className="hover:no-underline py-3 px-2 hover:bg-slate-800/50 rounded-md">
                    <div className="flex items-center gap-4 w-full overflow-hidden">
                      <Badge variant="outline" className={`uppercase w-16 justify-center ${methodColors[op.method] || "bg-slate-700"}`}>
                        {op.method}
                      </Badge>
                      <span className="font-mono text-sm text-slate-300 truncate">
                        {op.path}
                      </span>
                      <span className="text-sm text-slate-500 truncate flex-1 text-left ml-4">
                        {op.summary}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-4 space-y-4">
                    <p className="text-slate-400 text-sm">{op.description || op.summary}</p>
                    
                    {/* Parameters */}
                    {op.parameters && op.parameters.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Parameters</h4>
                        <div className="border border-slate-800 rounded-md overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800/50 text-slate-400">
                              <tr>
                                <th className="px-3 py-2 font-medium">Name</th>
                                <th className="px-3 py-2 font-medium">In</th>
                                <th className="px-3 py-2 font-medium">Required</th>
                                <th className="px-3 py-2 font-medium">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {op.parameters.map((param, idx) => (
                                <tr key={idx} className="bg-slate-900/50">
                                  <td className="px-3 py-2 font-mono text-blue-400">{param.name}</td>
                                  <td className="px-3 py-2 text-slate-500">{param.in}</td>
                                  <td className="px-3 py-2 text-slate-500">{param.required ? "Yes" : "No"}</td>
                                  <td className="px-3 py-2 text-slate-400">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Request Body */}
                    {op.requestBody && op.requestBody.content && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Request Body</h4>
                        {Object.entries(op.requestBody.content).map(([contentType, content], idx) => (
                           <div key={idx}>
                             <div className="text-xs text-slate-500 mb-2 font-mono">{contentType}</div>
                             <SchemaViewer schema={content.schema} spec={spec} example={content.example} />
                           </div>
                        ))}
                      </div>
                    )}

                    {/* Responses */}
                    {op.responses && (
                        <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Responses</h4>
                        <div className="space-y-3">
                            {Object.entries(op.responses).map(([status, response]) => (
                            <div key={status} className="border border-slate-800 rounded-md p-3 bg-slate-950/30">
                                <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={status.startsWith('2') ? "text-green-400 border-green-900" : "text-red-400 border-red-900"}>
                                    {status}
                                </Badge>
                                <span className="text-sm text-slate-400">{response.description}</span>
                                </div>
                                {response.content && response.content['application/json'] && (
                                    <SchemaViewer 
                                        schema={response.content['application/json'].schema} 
                                        spec={spec} 
                                        example={response.content['application/json'].example}
                                    />
                                )}
                            </div>
                            ))}
                        </div>
                        </div>
                    )}

                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SchemaViewer({ schema, spec, example }) {
  if (example) {
      return (
          <CodeBlock 
            snippet={{ 
              code: JSON.stringify(example, null, 2), 
              language: 'json',
              snippet_type: 'example' 
            }} 
          />
      );
  }

  if (!schema) return null;

  // Resolve ref
  let resolvedSchema = schema;
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    resolvedSchema = spec.components?.schemas?.[refName];
  }

  if (!resolvedSchema) return <div className="text-slate-500 text-xs italic">Schema definition not found</div>;

  // If it's an array
  if (resolvedSchema.type === 'array' && resolvedSchema.items) {
      return (
          <div className="space-y-1">
              <div className="text-xs text-slate-500">Array of:</div>
              <SchemaViewer schema={resolvedSchema.items} spec={spec} />
          </div>
      )
  }

  // If it's an object with properties
  if (resolvedSchema.properties) {
      // Create an example object
      const example = generateExample(resolvedSchema, spec);
      return (
          <CodeBlock 
            snippet={{ 
              code: JSON.stringify(example, null, 2), 
              language: 'json',
              snippet_type: 'example' 
            }} 
          />
      );
  }

  return <div className="text-slate-500 text-xs">Type: {resolvedSchema.type}</div>;
}

function generateExample(schema, spec, depth = 0) {
    if (depth > 3) return "..."; // Prevent infinite recursion

    let resolved = schema;
    if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        resolved = spec.components?.schemas?.[refName];
        if (!resolved) return {};
    }

    if (resolved.type === 'array') {
        return [generateExample(resolved.items, spec, depth)];
    }

    if (resolved.type === 'object' && resolved.properties) {
        const obj = {};
        Object.entries(resolved.properties).forEach(([key, prop]) => {
            obj[key] = generateExample(prop, spec, depth + 1);
        });
        return obj;
    }

    // Primitives
    if (resolved.example !== undefined) return resolved.example;
    if (resolved.type === 'string') {
        if (resolved.format === 'date-time') return "2024-01-01T12:00:00Z";
        if (resolved.format === 'uuid') return "123e4567-e89b-12d3-a456-426614174000";
        return "string";
    }
    if (resolved.type === 'integer') return 0;
    if (resolved.type === 'number') return 0.0;
    if (resolved.type === 'boolean') return true;

    return null;
}
