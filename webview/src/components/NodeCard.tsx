import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, PauseCircle } from "lucide-react";
import { NodeExecution } from "../../../src/types";
import { cn, formatCurrency, formatTimestamp } from "../lib/utils";
import { Badge } from "./ui/badge";

const statusConfig = {
  success: {
    icon: CheckCircle2,
    ring: "border-mint/40 bg-mint/10 text-mint",
    label: "Success",
  },
  failed: {
    icon: AlertTriangle,
    ring: "border-crimson/50 bg-crimson/10 text-crimson",
    label: "Failed",
  },
  running: {
    icon: Clock3,
    ring: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
    label: "Running",
  },
  skipped: {
    icon: PauseCircle,
    ring: "border-amber-300/35 bg-amber-200/10 text-amber-100",
    label: "Skipped",
  },
};

type NodeCardProps = {
  node: NodeExecution;
  selected: boolean;
  onSelect: () => void;
  showConnector: boolean;
};

export function NodeCard({ node, selected, onSelect, showConnector }: NodeCardProps) {
  const config = statusConfig[node.status];
  const Icon = config.icon;

  return (
    <div className="relative flex min-w-[260px] items-center gap-4">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-[28px] border p-4 text-left transition-all",
          "bg-[rgba(16,36,58,0.78)] backdrop-blur-sm",
          selected ? "border-cyan-300/70 shadow-[0_0_0_1px_rgba(103,232,249,0.25)]" : "border-white/10 hover:border-white/25",
          node.status === "skipped" && "opacity-75",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{node.nodeId}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{node.nodeName}</h3>
          </div>
          <div className={cn("rounded-full border p-2", config.ring)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className={cn("text-[10px]", config.ring)}>{config.label}</Badge>
          <Badge>{node.latency} ms</Badge>
          <Badge>{node.tokens ?? 0} tokens</Badge>
          <Badge>{formatCurrency(node.cost ?? 0)}</Badge>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>{formatTimestamp(node.timestamp)}</span>
          {node.downstreamOf ? <span>Blocked by {node.downstreamOf}</span> : null}
        </div>
      </button>

      {showConnector ? (
        <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/10 bg-ink/80 p-1 text-slate-300 md:block">
          <ArrowRight className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}
