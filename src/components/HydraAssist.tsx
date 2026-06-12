import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

const GREETING: UIMessage = {
  id: "greet",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hi, I'm HydraAssist. How can I help you today?",
    },
  ],
};

const SUGGESTIONS = [
  "Book a water tanker",
  "Track my order",
  "How do wallet payments work?",
  "Become a driver partner",
];

function Avatar({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-primary to-indigo-500 text-white shadow-lg"
      style={{ height: size, width: size }}
      aria-hidden="true"
    >
      <Sparkles className="h-1/2 w-1/2" />
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-400" />
    </span>
  );
}

export function HydraAssist() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: "hydra-assist",
    messages: [GREETING],
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    void sendMessage({ text: t });
  };

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open HydraAssist"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:scale-105"
        >
          <Avatar size={28} />
          <span className="pr-1">HydraAssist</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[600px] w-[min(94vw,400px)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
          <header className="flex items-center justify-between bg-gradient-to-r from-primary to-indigo-600 px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <Avatar size={40} />
              <div>
                <p className="font-display text-sm font-bold leading-tight">
                  HydraAssist
                </p>
                <p className="text-[10px] opacity-90">
                  AI assistant · online
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-1.5 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-secondary/30 px-4 py-4"
          >
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const mine = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={mine ? "flex justify-end" : "flex items-end gap-2 justify-start"}
                >
                  {!mine && <Avatar size={26} />}
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card text-foreground rounded-bl-sm border border-border"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            {busy && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar size={26} />
                <div className="rounded-2xl border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  </span>
                </div>
              </div>
            )}

            {messages.length <= 1 && !busy && (
              <div className="pt-2">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={onSend}
            className="flex items-center gap-2 border-t border-border bg-card p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              aria-label="Send"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// keep MessageCircle import referenced for tree-shake safety in some bundlers
void MessageCircle;
