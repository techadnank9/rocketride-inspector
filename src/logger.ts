import { NodeExecution, PipelineRunSnapshot, ValidationIssue } from "./types";

const TOKEN_COST = 0.0000025;

function validationIssuesForNode(
  expectedSchema: Record<string, string> | undefined,
  output: unknown,
  status: NodeExecution["status"],
): ValidationIssue[] {
  if (status === "failed") {
    return [
      {
        path: "root",
        expected: "valid schema object",
        actual: "execution failed",
        message: "Node did not produce an output because execution failed.",
        severity: "error",
      },
    ];
  }

  if (status === "skipped") {
    return [
      {
        path: "root",
        expected: "object",
        actual: "skipped",
        message: "Node was skipped because an upstream dependency failed.",
        severity: "warning",
      },
    ];
  }

  if (!expectedSchema || typeof output !== "object" || output === null) {
    return [];
  }

  const issues: ValidationIssue[] = [];
  const outputRecord = output as Record<string, unknown>;

  for (const [key, expectedType] of Object.entries(expectedSchema)) {
    const actualValue = outputRecord[key];
    const actualType = Array.isArray(actualValue) ? "array" : typeof actualValue;

    if (actualValue === undefined) {
      issues.push({
        path: key,
        expected: expectedType,
        actual: "undefined",
        message: `Missing expected field "${key}".`,
        severity: "warning",
      });
      continue;
    }

    if (actualType !== expectedType) {
      issues.push({
        path: key,
        expected: expectedType,
        actual: actualType,
        message: `Expected "${key}" to be ${expectedType} but received ${actualType}.`,
        severity: "warning",
      });
    }
  }

  return issues;
}

type RawNodeExecution = Omit<NodeExecution, "cost" | "validationIssues">;

export class PipelineExecutionLogger {
  private nodes: NodeExecution[] = [];

  constructor(
    private readonly runId: string,
    private readonly pipelineName: string,
  ) {}

  record(rawNode: RawNodeExecution): NodeExecution {
    const node: NodeExecution = {
      ...rawNode,
      cost: rawNode.tokens ? Number((rawNode.tokens * TOKEN_COST).toFixed(5)) : 0,
      validationIssues: validationIssuesForNode(rawNode.expectedSchema, rawNode.output, rawNode.status),
    };

    this.nodes.push(node);
    return node;
  }

  snapshot(): PipelineRunSnapshot {
    const startedAt = this.nodes.length > 0 ? this.nodes[0].timestamp : Date.now();
    const finishedAt =
      this.nodes.length > 0
        ? this.nodes[this.nodes.length - 1].timestamp + this.nodes[this.nodes.length - 1].latency
        : startedAt;

    const totals = this.nodes.reduce(
      (acc, node) => {
        acc.totalNodes += 1;
        acc.totalLatency += node.latency;
        acc.totalTokens += node.tokens ?? 0;
        acc.totalCost += node.cost ?? 0;
        acc.successCount += Number(node.status === "success");
        acc.failedCount += Number(node.status === "failed");
        acc.skippedCount += Number(node.status === "skipped");
        acc.runningCount += Number(node.status === "running");
        return acc;
      },
      {
        totalNodes: 0,
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
        runningCount: 0,
        totalLatency: 0,
        totalTokens: 0,
        totalCost: 0,
      },
    );

    return {
      runId: this.runId,
      pipelineName: this.pipelineName,
      startedAt,
      finishedAt,
      nodes: this.nodes,
      totals: {
        ...totals,
        totalCost: Number(totals.totalCost.toFixed(5)),
      },
    };
  }
}

export function createMockPipelineRun(runId = `run-${Date.now()}`): PipelineRunSnapshot {
  const logger = new PipelineExecutionLogger(runId, "Simple Chat Reply.pipe");
  const startedAt = Date.now();

  logger.record({
    nodeId: "generate-reply",
    nodeName: "Generate Reply",
    input: {
      conversationId: "chat-2048",
      userMessage: "Can you explain RocketRide in one sentence?",
      systemPrompt: "Reply in a friendly tone using one concise sentence.",
    },
    output: {
      reply:
        "RocketRide is an IDE-native pipeline builder that lets developers design, run, and debug AI workflows with code and visual nodes.",
      model: "gpt-4.1-mini",
    },
    latency: 214,
    tokens: 196,
    status: "success",
    timestamp: startedAt,
    expectedSchema: {
      reply: "string",
      model: "string",
    },
  });

  logger.record({
    nodeId: "score-response",
    nodeName: "Score Response",
    input: {
      reply:
        "RocketRide is an IDE-native pipeline builder that lets developers design, run, and debug AI workflows with code and visual nodes.",
      model: "gpt-4.1-mini",
      rubric: "Return JSON with score:number and approved:boolean",
    },
    output: {
      score: "9.4",
      approved: true,
    },
    error:
      "SchemaValidationError: Expected score to be number.\n    at score-response.pipe:27:11\n    at runtime.executeNode (/rocketride/runtime.ts:88:14)",
    latency: 318,
    tokens: 244,
    status: "failed",
    timestamp: startedAt + 284,
    expectedSchema: {
      score: "number",
      approved: "boolean",
    },
  });

  logger.record({
    nodeId: "publish-message",
    nodeName: "Publish Message",
    input: {
      dependency: "score-response",
      channel: "chat-panel",
    },
    output: null,
    latency: 0,
    status: "skipped",
    timestamp: startedAt + 640,
    expectedSchema: {
      delivered: "boolean",
      messageId: "string",
    },
    downstreamOf: "score-response",
  });

  return logger.snapshot();
}

type LiveRunInput = {
  runId?: string;
  userMessage: string;
  assistantReply: string;
  model: string;
  latency: number;
  tokens?: number;
  published?: boolean;
};

export function createLiveChatPipelineRun({
  runId = `run-${Date.now()}`,
  userMessage,
  assistantReply,
  model,
  latency,
  tokens = 0,
  published = true,
}: LiveRunInput): PipelineRunSnapshot {
  const logger = new PipelineExecutionLogger(runId, "Simple Chat Reply.pipe");
  const startedAt = Date.now();
  const scoreLatency = Math.max(18, Math.round(latency * 0.18));
  const publishLatency = published ? 12 : 0;
  const qualityScore = assistantReply.length > 0 ? Math.min(9.8, Number((assistantReply.length / 24).toFixed(1))) : 0;

  logger.record({
    nodeId: "generate-reply",
    nodeName: "Generate Reply",
    input: {
      conversationId: runId,
      userMessage,
      systemPrompt: "Reply in a friendly tone using one concise sentence.",
    },
    output: {
      reply: assistantReply,
      model,
    },
    latency,
    tokens,
    status: "success",
    timestamp: startedAt,
    expectedSchema: {
      reply: "string",
      model: "string",
    },
  });

  logger.record({
    nodeId: "score-response",
    nodeName: "Score Response",
    input: {
      reply: assistantReply,
      rubric: "Return JSON with score:number and approved:boolean",
    },
    output: {
      score: qualityScore,
      approved: true,
    },
    latency: scoreLatency,
    tokens: Math.max(16, Math.round(tokens * 0.08)),
    status: "success",
    timestamp: startedAt + latency + 20,
    expectedSchema: {
      score: "number",
      approved: "boolean",
    },
  });

  logger.record({
    nodeId: "publish-message",
    nodeName: "Publish Message",
    input: {
      channel: "chat-panel",
      message: assistantReply,
    },
    output: {
      delivered: published,
      messageId: published ? `msg-${runId}` : "",
    },
    latency: publishLatency,
    status: published ? "success" : "failed",
    timestamp: startedAt + latency + scoreLatency + 34,
    expectedSchema: {
      delivered: "boolean",
      messageId: "string",
    },
    error: published ? undefined : "Failed to publish message to chat-panel.",
  });

  return logger.snapshot();
}

export function createLiveChatFailureRun(
  userMessage: string,
  error: string,
  runId = `run-${Date.now()}`,
): PipelineRunSnapshot {
  const logger = new PipelineExecutionLogger(runId, "Simple Chat Reply.pipe");
  const startedAt = Date.now();

  logger.record({
    nodeId: "generate-reply",
    nodeName: "Generate Reply",
    input: {
      conversationId: runId,
      userMessage,
      systemPrompt: "Reply in a friendly tone using one concise sentence.",
    },
    output: null,
    latency: 0,
    status: "failed",
    timestamp: startedAt,
    expectedSchema: {
      reply: "string",
      model: "string",
    },
    error,
  });

  logger.record({
    nodeId: "score-response",
    nodeName: "Score Response",
    input: {
      reply: null,
      rubric: "Return JSON with score:number and approved:boolean",
    },
    output: null,
    latency: 0,
    status: "skipped",
    timestamp: startedAt + 12,
    expectedSchema: {
      score: "number",
      approved: "boolean",
    },
    downstreamOf: "generate-reply",
  });

  logger.record({
    nodeId: "publish-message",
    nodeName: "Publish Message",
    input: {
      channel: "chat-panel",
      message: null,
    },
    output: null,
    latency: 0,
    status: "skipped",
    timestamp: startedAt + 24,
    expectedSchema: {
      delivered: "boolean",
      messageId: "string",
    },
    downstreamOf: "score-response",
  });

  return logger.snapshot();
}
