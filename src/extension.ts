import * as fs from "node:fs";
import * as vscode from "vscode";
import { config as loadDotenv } from "dotenv";
import { createLiveChatFailureRun, createLiveChatPipelineRun } from "./logger";
import { ChatMessage, ExtensionToWebviewMessage, PipelineInspectorData, PipelineRunSnapshot, WebviewToExtensionMessage } from "./types";

let inspectorPanel: vscode.WebviewPanel | undefined;
let latestInspectorData: PipelineInspectorData | undefined;

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function activate(context: vscode.ExtensionContext) {
  loadLocalEnv(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("rocketrideInspector.openDemo", () => {
      inspectorPanel = createOrShowInspector(context);
      latestInspectorData = createInspectorData(context);
      postExecutionUpdate(inspectorPanel, "execution:update", latestInspectorData);
    }),
    vscode.commands.registerCommand("rocketrideInspector.replayDemo", () => {
      if (!inspectorPanel) {
        inspectorPanel = createOrShowInspector(context);
      }

      latestInspectorData = createInspectorData(context);
      postExecutionUpdate(inspectorPanel, "execution:replayed", latestInspectorData);
    }),
  );
}

export function deactivate() {
  inspectorPanel = undefined;
}

function createOrShowInspector(context: vscode.ExtensionContext): vscode.WebviewPanel {
  if (inspectorPanel) {
    inspectorPanel.reveal(vscode.ViewColumn.Beside);
    return inspectorPanel;
  }

  const panel = vscode.window.createWebviewPanel(
    "rocketrideInspector",
    "RocketRide Inspector",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "webview", "dist"),
      ],
    },
  );

  panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri);

  panel.webview.onDidReceiveMessage(async (message: WebviewToExtensionMessage) => {
    if (message.type === "ready") {
      latestInspectorData ??= createInspectorData(context);
      postExecutionUpdate(panel, "execution:update", latestInspectorData);
      return;
    }

    if (message.type === "replay-demo") {
      latestInspectorData = createInspectorData(context);
      postExecutionUpdate(panel, "execution:replayed", latestInspectorData);
      return;
    }

    if (message.type === "chat:send") {
      const snapshot = await runGeminiChatPipeline(message.message, message.history);
      latestInspectorData = createInspectorData(context, snapshot);
      postExecutionUpdate(panel, "execution:update", latestInspectorData);
    }
  });

  panel.onDidDispose(() => {
    if (inspectorPanel === panel) {
      inspectorPanel = undefined;
    }
  });

  inspectorPanel = panel;
  return panel;
}

function postExecutionUpdate(
  panel: vscode.WebviewPanel,
  type: ExtensionToWebviewMessage["type"],
  payload: PipelineInspectorData,
) {
  panel.webview.postMessage({
    type,
    payload,
  } satisfies ExtensionToWebviewMessage);
}

function createInspectorData(
  context: vscode.ExtensionContext,
  snapshot?: PipelineRunSnapshot,
): PipelineInspectorData {
  const sourceFile = vscode.Uri.joinPath(context.extensionUri, "demo", "simple-chat.pipe");
  const content = fs.readFileSync(sourceFile.fsPath, "utf8");

  return {
    snapshot,
    source: {
      fileName: "simple-chat.pipe",
      language: "pipe",
      content,
    },
  };
}

function loadLocalEnv(context: vscode.ExtensionContext) {
  if (process.env.GEMINI_API_KEY) {
    return;
  }

  const envFile = vscode.Uri.joinPath(context.extensionUri, ".env");
  if (!fs.existsSync(envFile.fsPath)) {
    return;
  }

  loadDotenv({
    path: envFile.fsPath,
    override: false,
  });
}

async function runGeminiChatPipeline(
  userMessage: string,
  history: ChatMessage[],
): Promise<PipelineRunSnapshot> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return createLiveChatFailureRun(
      userMessage,
      "Missing GEMINI_API_KEY in the VS Code environment. Export it before launching the Extension Development Host.",
    );
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: "You are the RocketRide demo assistant. Answer helpfully, clearly, and briefly.",
            },
          ],
        },
        contents: buildGeminiContents(history, userMessage),
      }),
    });

    const json = (await response.json()) as GeminiGenerateContentResponse;
    if (!response.ok) {
      const errorMessage = json.error?.message ?? `Gemini request failed with status ${response.status}.`;
      return createLiveChatFailureRun(userMessage, errorMessage);
    }

    const assistantReply = extractGeminiText(json);
    if (!assistantReply) {
      return createLiveChatFailureRun(userMessage, "Gemini returned an empty response.");
    }

    const totalTokens = json.usageMetadata?.totalTokenCount ?? 0;

    return createLiveChatPipelineRun({
      userMessage,
      assistantReply,
      model: GEMINI_MODEL,
      latency: Math.max(1, Date.now() - startedAt),
      tokens: totalTokens,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini request error.";
    return createLiveChatFailureRun(userMessage, message);
  }
}

function buildGeminiContents(history: ChatMessage[], userMessage: string) {
  const transcript = [...history, {
    id: "pending",
    role: "user" as const,
    content: userMessage,
    timestamp: Date.now(),
  }];

  return transcript.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));
}

function extractGeminiText(response: GeminiGenerateContentResponse): string {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
  };
};

function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const distUri = vscode.Uri.joinPath(extensionUri, "webview", "dist");
  const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "assets", "app.js"));
  const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, "assets", "app.css"));

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src ${webview.cspSource};">
    <title>RocketRide Inspector</title>
    <link rel="stylesheet" href="${cssUri.toString()}">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${jsUri.toString()}"></script>
  </body>
</html>`;
}
