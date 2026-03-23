import { PipelineRunSnapshot } from "../../../src/types";
import { NodeCard } from "./NodeCard";

type TimelineProps = {
  snapshot: PipelineRunSnapshot;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
};

export function Timeline({ snapshot, selectedNodeId, onSelectNode }: TimelineProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-cyan-200/80">Pipeline Timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{snapshot.pipelineName}</h2>
        </div>
        <p className="text-sm text-slate-300">Run ID: {snapshot.runId}</p>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-4 xl:grid-cols-3">
          {snapshot.nodes.map((node, index) => (
            <NodeCard
              key={node.nodeId}
              node={node}
              selected={selectedNodeId === node.nodeId}
              onSelect={() => onSelectNode(node.nodeId)}
              showConnector={index < snapshot.nodes.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
