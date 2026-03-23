import { FileCode2, MessageSquareText, Sparkles } from "lucide-react";
import { PipelineRunSnapshot, PipelineSource } from "../../../src/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "../lib/utils";

type SourcePanelProps = {
  source?: PipelineSource;
  snapshot?: PipelineRunSnapshot;
  isRunning?: boolean;
};

type PipeGraph = {
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  components: Array<{
    id: string;
    provider: string;
    ui?: {
      position?: {
        x: number;
        y: number;
      };
      measured?: {
        width: number;
        height: number;
      };
    };
    input?: Array<{
      lane: string;
      from: string;
    }>;
  }>;
};

function parsePipeGraph(content?: string): PipeGraph | undefined {
  if (!content) {
    return undefined;
  }

  try {
    return JSON.parse(content) as PipeGraph;
  } catch {
    return undefined;
  }
}

const providerMeta = {
  chat: {
    label: "Chat",
    subtitle: "SOURCE",
    icon: MessageSquareText,
  },
  llm_gemini: {
    label: "Gemini",
    subtitle: "LLM",
    icon: Sparkles,
  },
} as const;

export function SourcePanel({ source, snapshot, isRunning = false }: SourcePanelProps) {
  const graph = parsePipeGraph(source?.content);
  const components = graph?.components ?? [];
  const minX = Math.min(...components.map((item) => item.ui?.position?.x ?? 0), 0);
  const maxX = Math.max(...components.map((item) => (item.ui?.position?.x ?? 0) + (item.ui?.measured?.width ?? 160)), 200);
  const minY = Math.min(...components.map((item) => item.ui?.position?.y ?? 0), 0);
  const maxY = Math.max(...components.map((item) => (item.ui?.position?.y ?? 0) + (item.ui?.measured?.height ?? 65)), 200);
  const width = maxX - minX + 180;
  const height = maxY - minY + 180;
  const hasExecuted = Boolean(snapshot);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-200/70">
          <FileCode2 className="h-4 w-4" />
          Pipeline Flow
        </div>
        <CardTitle className="text-xl">{source?.fileName ?? "No source loaded"}</CardTitle>
        <p className="text-sm text-slate-400">
          Read-only visual flow generated from the current `.pipe` file.
        </p>
      </CardHeader>
      <CardContent className="h-full pb-5">
        <div className="h-full min-h-[420px] rounded-2xl border border-white/10 bg-ink/75 p-4">
          {graph ? (
            <div className="h-full overflow-auto rounded-xl border border-white/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
              <div
                className="relative bg-grid bg-[size:28px_28px]"
                style={{ width, height }}
              >
                {components.map((component) => {
                  const meta = providerMeta[component.provider as keyof typeof providerMeta];
                  const Icon = meta?.icon ?? FileCode2;
                  const x = (component.ui?.position?.x ?? 0) - minX + 70;
                  const y = (component.ui?.position?.y ?? 0) - minY + 60;
                  const nodeWidth = component.ui?.measured?.width ?? 160;
                  const nodeHeight = component.ui?.measured?.height ?? 65;
                  const isChatNode = component.provider === "chat";
                  const isModelNode = component.provider === "llm_gemini";
                  const active =
                    isRunning
                      ? isChatNode || isModelNode
                      : hasExecuted
                        ? isChatNode || isModelNode
                        : false;

                  return (
                    <div
                      key={component.id}
                      className={cn(
                        "absolute rounded-2xl border bg-[rgba(16,24,40,0.96)] shadow-[0_12px_40px_rgba(2,8,23,0.45)] transition-all",
                        active ? "border-cyan-300/70 ring-1 ring-cyan-300/30" : "border-white/10",
                      )}
                      style={{ left: x, top: y, width: nodeWidth + 70, minHeight: nodeHeight + 28 }}
                    >
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-5 w-5", active ? "text-cyan-200" : "text-slate-300")} />
                          <div>
                            <div className="text-lg font-medium text-white">{meta?.label ?? component.provider}</div>
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{meta?.subtitle ?? "NODE"}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-400">
                        <span>{isChatNode ? "Questions" : "Questions"}</span>
                        <span>{isModelNode ? "Answers" : ""}</span>
                      </div>
                    </div>
                  );
                })}

                <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                  {components.flatMap((component) =>
                    (component.input ?? []).map((input, index) => {
                      const sourceNode = components.find((candidate) => candidate.id === input.from);
                      if (!sourceNode) {
                        return [];
                      }

                      const sourceX =
                        (sourceNode.ui?.position?.x ?? 0) - minX + 70 + (sourceNode.ui?.measured?.width ?? 160) + 70;
                      const sourceY =
                        (sourceNode.ui?.position?.y ?? 0) - minY + 60 + ((sourceNode.ui?.measured?.height ?? 65) + 28) / 2;
                      const targetX = (component.ui?.position?.x ?? 0) - minX + 70;
                      const targetY =
                        (component.ui?.position?.y ?? 0) - minY + 60 + ((component.ui?.measured?.height ?? 65) + 28) / 2;
                      const delta = Math.max(36, (targetX - sourceX) / 2);
                      const d = `M ${sourceX} ${sourceY} C ${sourceX + delta} ${sourceY}, ${targetX - delta} ${targetY}, ${targetX} ${targetY}`;

                      return (
                        <path
                          key={`${component.id}-${input.from}-${index}`}
                          d={d}
                          fill="none"
                          stroke={hasExecuted ? "rgba(103,232,249,0.82)" : "rgba(148,163,184,0.5)"}
                          strokeDasharray={hasExecuted ? "0" : "6 6"}
                          strokeLinecap="round"
                          strokeWidth="2.5"
                        />
                      );
                    }),
                  )}
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
              Waiting for pipeline source from the extension host.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
