import { AlertTriangle, Coins, Cpu, Shapes, Timer } from "lucide-react";
import { NodeExecution } from "../../../src/types";
import { formatCurrency, formatJson, formatTimestamp } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

type DetailsPanelProps = {
  node?: NodeExecution;
};

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{title}</div>
      <div className="rounded-2xl border border-white/10 bg-ink/70 p-4">
        <pre className="font-mono text-xs leading-6 text-slate-100">{formatJson(value)}</pre>
      </div>
    </div>
  );
}

export function DetailsPanel({ node }: DetailsPanelProps) {
  if (!node) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full min-h-[520px] items-center justify-center text-slate-300">
          Select a node to inspect its execution details.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">{node.nodeId}</p>
            <CardTitle className="mt-2 text-xl">{node.nodeName}</CardTitle>
          </div>
          <Badge className="bg-white/5">{node.status}</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Timer} label="Latency" value={`${node.latency} ms`} />
          <Metric icon={Cpu} label="Tokens" value={`${node.tokens ?? 0}`} />
          <Metric icon={Coins} label="Cost" value={formatCurrency(node.cost ?? 0)} />
          <Metric icon={Shapes} label="Timestamp" value={formatTimestamp(node.timestamp)} />
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 pt-5">
        {node.error ? (
          <div className="rounded-2xl border border-crimson/30 bg-crimson/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-crimson">
              <AlertTriangle className="h-4 w-4" />
              Error Trace
            </div>
            <pre className="font-mono text-xs leading-6 text-rose-100">{node.error}</pre>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Schema Validation</div>
          <div className="space-y-2">
            {(node.validationIssues ?? []).length > 0 ? (
              node.validationIssues?.map((issue) => (
                <div
                  key={`${issue.path}-${issue.message}`}
                  className="rounded-2xl border border-amber-200/20 bg-amber-100/10 p-3 text-sm text-amber-50"
                >
                  <div className="font-medium">{issue.message}</div>
                  <div className="mt-1 text-xs text-amber-100/80">
                    {issue.path}: expected {issue.expected}, got {issue.actual}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-50">
                Output matches the expected schema.
              </div>
            )}
          </div>
        </div>

        <JsonPanel title="Input" value={node.input} />
        <JsonPanel title="Output" value={node.output} />
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
