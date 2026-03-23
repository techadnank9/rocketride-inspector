import { FormEvent, useState } from "react";
import { LoaderCircle, SendHorizonal, Sparkles } from "lucide-react";
import { ChatMessage } from "../../../src/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type ChatPanelProps = {
  messages: ChatMessage[];
  isRunning: boolean;
  onSend: (message: string) => void;
};

export function ChatPanel({ messages, isRunning, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || isRunning) {
      return;
    }

    onSend(value);
    setDraft("");
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-200/70">
          <Sparkles className="h-4 w-4" />
          Live Chat
        </div>
        <CardTitle className="text-xl">Send a message to run the pipeline</CardTitle>
        <p className="text-sm text-slate-400">
          The Gemini-backed `generate-reply` node runs when you send a message, then the inspector updates with the node execution details.
        </p>
      </CardHeader>
      <CardContent className="flex h-full min-h-[520px] flex-col gap-4 pb-5">
        <div className="min-h-0 flex-1 rounded-2xl border border-white/10 bg-ink/55 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
              No messages yet. Ask anything in the chat box below to run `Simple Chat Reply.pipe`.
            </div>
          ) : (
            <div className="flex h-full flex-col gap-3 overflow-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? "self-end" : "self-start"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[85%] rounded-3xl rounded-br-md bg-cyan-500 px-4 py-3 text-sm text-white"
                        : "max-w-[85%] rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-100"
                    }
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isRunning ? (
                <div className="self-start rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Running pipeline...
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <form className="sticky bottom-0 flex gap-3 rounded-2xl border border-white/10 bg-[rgba(7,17,31,0.92)] p-3 backdrop-blur" onSubmit={handleSubmit}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message for Gemini..."
            className="min-h-[88px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
          />
          <Button className="self-end" type="submit" disabled={isRunning || !draft.trim()}>
            <SendHorizonal className="mr-2 h-4 w-4" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
