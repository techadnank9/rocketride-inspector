export type NodeExecutionStatus = "success" | "failed" | "running" | "skipped";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
};

export type ValidationSeverity = "warning" | "error";

export type ValidationIssue = {
  path: string;
  expected: string;
  actual: string;
  message: string;
  severity: ValidationSeverity;
};

export type NodeExecution = {
  nodeId: string;
  nodeName: string;
  input: unknown;
  output: unknown;
  error?: string;
  latency: number;
  tokens?: number;
  cost?: number;
  status: NodeExecutionStatus;
  timestamp: number;
  expectedSchema?: Record<string, string>;
  validationIssues?: ValidationIssue[];
  downstreamOf?: string;
};

export type PipelineRunSnapshot = {
  runId: string;
  pipelineName: string;
  startedAt: number;
  finishedAt: number;
  nodes: NodeExecution[];
  totals: {
    totalNodes: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    runningCount: number;
    totalLatency: number;
    totalTokens: number;
    totalCost: number;
  };
};

export type PipelineSource = {
  fileName: string;
  language: string;
  content: string;
};

export type PipelineInspectorData = {
  snapshot?: PipelineRunSnapshot;
  source: PipelineSource;
};

export type ExtensionToWebviewMessage =
  | { type: "execution:update"; payload: PipelineInspectorData }
  | { type: "execution:replayed"; payload: PipelineInspectorData };

export type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "replay-demo" }
  | { type: "chat:send"; message: string; history: ChatMessage[] };
