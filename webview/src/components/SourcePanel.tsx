import { FileCode2 } from "lucide-react";
import { PipelineSource } from "../../../src/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type SourcePanelProps = {
  source?: PipelineSource;
};

export function SourcePanel({ source }: SourcePanelProps) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-200/70">
          <FileCode2 className="h-4 w-4" />
          Pipeline Source
        </div>
        <CardTitle className="text-xl">{source?.fileName ?? "No source loaded"}</CardTitle>
        <p className="text-sm text-slate-400">
          Read-only `.pipe` source aligned with the current inspector demo.
        </p>
      </CardHeader>
      <CardContent className="h-full pb-5">
        <div className="h-full min-h-[420px] rounded-2xl border border-white/10 bg-ink/75 p-4">
          <pre className="h-full overflow-auto font-mono text-xs leading-6 text-slate-100">
            {source?.content ?? "Waiting for pipeline source from the extension host."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
