import React, { useState } from "react";
import { Bot, Send, Sparkles, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceId: string;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({ isOpen, onClose, evidenceId }) => {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; references?: string[] }[]>([
    {
      role: "assistant",
      text: `Hello Analyst. I am your Evidence-Grounded Forensic Copilot. I analyze observed artifacts for evidence record **${evidenceId}**. Ask me questions regarding threat indicators, routing infrastructure, or incident summaries.`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInputQuery("");
    setLoading(true);

    try {
      const resp = await api.queryCopilot(evidenceId, q);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: resp.answer,
          references: resp.evidence_references,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "An error occurred while evaluating the evidence context.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Why is this email suspicious?",
    "Where was this email observed entering the network?",
    "Summarize this investigation for a senior analyst / CISO",
    "What should the analyst investigate next?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-purple-800/80 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-purple-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                AI Investigation Copilot (Section 42)
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {evidenceId}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Strictly grounded on observable forensic evidence</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3.5 leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-purple-900/70 text-white border border-purple-700"
                    : "bg-slate-950 text-slate-200 border border-slate-800"
                }`}
              >
                {m.text}
              </div>

              {m.references && m.references.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-purple-400 font-mono">
                  <span>Evidentiary References: {m.references.join(", ")}</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-purple-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Analyzing evidence context & formulating grounded answer...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-5 py-2 bg-slate-950/80 border-t border-slate-800 flex flex-wrap gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-purple-200 border border-purple-900/60 px-2.5 py-1 rounded-full transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Query Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask Copilot a question based on this email's evidence..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
