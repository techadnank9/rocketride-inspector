import { useEffect, useMemo } from "react";
import { Activity, AlertCircle, Coins, Timer } from "lucide-react";
import { PipelineRunSnapshot, WebviewToExtensionMessage, ExtensionToWebviewMessage } from "../../src/types";
import { ChatPanel } from "./components/ChatPanel";
import { DetailsPanel } from "./components/DetailsPanel";
import { SourcePanel } from "./components/SourcePanel";
import { Timeline } from "./components/Timeline";
import { Card, CardContent } from "./components/ui/card";
import { useInspectorStore } from "./store";
import { formatCurrency } from "./lib/utils";

declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: WebviewToExtensionMessage) => void;
    };
  }
}

const vscodeApi = window.acquireVsCodeApi?.();

function postMessage(message: WebviewToExtensionMessage) {
  vscodeApi?.postMessage(message);
}

function SummaryStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white md:mt-3 md:text-2xl">{value}</div>
    </div>
  );
}

export default function App() {
  const snapshot = useInspectorStore((state) => state.snapshot);
  const source = useInspectorStore((state) => state.source);
  const selectedNodeId = useInspectorStore((state) => state.selectedNodeId);
  const messages = useInspectorStore((state) => state.messages);
  const isRunning = useInspectorStore((state) => state.isRunning);
  const setInspectorData = useInspectorStore((state) => state.setInspectorData);
  const selectNode = useInspectorStore((state) => state.selectNode);
  const appendUserMessage = useInspectorStore((state) => state.appendUserMessage);
  const appendAssistantMessage = useInspectorStore((state) => state.appendAssistantMessage);
  const setRunning = useInspectorStore((state) => state.setRunning);

  useEffect(() => {
    const onMessage = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      if (event.data.type === "execution:update" || event.data.type === "execution:replayed") {
        setInspectorData(event.data.payload);
        const reply =
          (event.data.payload.snapshot?.nodes.find((node) => node.nodeId === "generate-reply")?.output as { reply?: string } | null)
            ?.reply;
        if (reply && messages[messages.length - 1]?.role === "user") {
          appendAssistantMessage(reply);
        }
        setRunning(false);
      }
    };

    window.addEventListener("message", onMessage);
    postMessage({ type: "ready" });

    return () => window.removeEventListener("message", onMessage);
  }, [appendAssistantMessage, messages, setInspectorData, setRunning]);

  const selectedNode = useMemo(
    () => snapshot?.nodes.find((node) => node.nodeId === selectedNodeId),
    [selectedNodeId, snapshot],
  );

  function handleSendMessage(message: string) {
    appendUserMessage(message);
    setRunning(true);
    postMessage({
      type: "chat:send",
      message,
      history: messages,
    });
  }

  return (
    <main className="min-h-screen bg-grid bg-[size:26px_26px]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4 md:gap-6 md:p-6">
        <header className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.22),rgba(7,17,31,0.78))] p-4 shadow-panel md:rounded-[36px] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">RocketRide Inspector</p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl xl:text-4xl">
                Chrome DevTools for RocketRide pipelines
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
                Send a message, run the `.pipe` flow through Gemini, and inspect each node execution without leaving VS Code.
              </p>
            </div>
          </div>

          {snapshot ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <SummaryStat label="Nodes" value={`${snapshot.totals.totalNodes}`} icon={Activity} />
              <SummaryStat label="Failures" value={`${snapshot.totals.failedCount}`} icon={AlertCircle} />
              <SummaryStat label="Latency" value={`${snapshot.totals.totalLatency} ms`} icon={Timer} />
              <SummaryStat label="Cost" value={formatCurrency(snapshot.totals.totalCost)} icon={Coins} />
            </div>
          ) : null}
        </header>

        <div className="grid flex-1 gap-4 2xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.15fr)_minmax(320px,0.8fr)] 2xl:gap-6">
          <ChatPanel messages={messages} isRunning={isRunning} onSend={handleSendMessage} />

          {snapshot ? (
            <div className="space-y-6">
              <Timeline snapshot={snapshot} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
              <RunSummary snapshot={snapshot} />
              <DetailsPanel node={selectedNode} />
            </div>
          ) : (
            <Card className="h-full">
              <CardContent className="flex min-h-[520px] items-center justify-center p-8 text-center text-slate-300">
                Send a chat message to run `Simple Chat Reply.pipe`. Node inputs and outputs will appear here after the Gemini request completes.
              </CardContent>
            </Card>
          )}

          <SourcePanel source={source} />
        </div>
      </div>
    </main>
  );
}

function RunSummary({ snapshot }: { snapshot: PipelineRunSnapshot }) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Succeeded</div>
          <div className="mt-2 text-3xl font-semibold text-mint">{snapshot.totals.successCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Failed</div>
          <div className="mt-2 text-3xl font-semibold text-crimson">{snapshot.totals.failedCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Skipped</div>
          <div className="mt-2 text-3xl font-semibold text-amber-200">{snapshot.totals.skippedCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Tokens</div>
          <div className="mt-2 text-3xl font-semibold text-white">{snapshot.totals.totalTokens}</div>
        </div>
      </CardContent>
    </Card>
  );
}
