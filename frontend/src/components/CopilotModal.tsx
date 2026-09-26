import React, { useState } from "react";
import { Bot, Send, Sparkles, X, Terminal, Cpu } from "lucide-react";
import { api } from "../services/api";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceId?: string;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({ isOpen, onClose, evidenceId = "" }) => {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; references?: string[] }[]>([
    {
      role: "assistant",
      text: evidenceId
        ? `Analyst session initialized. Grounded forensic reasoning engine loaded for evidence artifact [${evidenceId}]. Submit queries regarding authentication anomalies, routing hops, domain lookalikes, or forensic executive summary generation.`
        : `Analyst session initialized. No evidence artifact selected yet. Select an evidence artifact from the triage vault to query grounded contextual telemetry, or ask general forensic protocol questions.`,
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

    if (!evidenceId) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Please select an evidence record from the triage vault to inspect its grounded headers, DNS records, and adversarial telemetry.",
        },
      ]);
      setLoading(false);
      return;
    }

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[rgba(13,20,32,0.95)] backdrop-blur-2xl border border-[rgba(139,92,246,0.35)] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.15)] overflow-hidden flex flex-col h-[600px]">
        {/* Modal Header */}
        <div className="bg-[rgba(5,7,13,0.8)] px-5 py-3.5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#4D7CFF] p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              <div className="w-full h-full bg-[#080D16] rounded-[10px] flex items-center justify-center text-[#8B5CF6]">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2 font-mono">
                AI FORENSIC COPILOT
                {evidenceId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8B5CF6] border border-[rgba(139,92,246,0.3)]">
                    {evidenceId}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">Strictly verified against parsed RFC headers, DNS, and telemetry</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-[rgba(55,215,255,0.15)] to-[rgba(77,124,255,0.15)] text-white border border-[rgba(55,215,255,0.3)] shadow-sm"
                    : "bg-[rgba(5,7,13,0.7)] text-slate-200 border border-[rgba(255,255,255,0.08)] shadow-md"
                }`}
              >
                {m.text}
              </div>

              {m.references && m.references.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[#37D7FF] font-mono">
                  <span>Evidentiary References: {m.references.join(", ")}</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-[#8B5CF6] font-mono p-3 bg-[rgba(139,92,246,0.05)] rounded-xl border border-[rgba(139,92,246,0.2)]">
              <Sparkles className="w-4 h-4 animate-spin text-[#8B5CF6]" />
              <span>Querying verified forensic evidence parameters...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-5 py-2.5 bg-[rgba(5,7,13,0.7)] border-t border-[rgba(255,255,255,0.06)] flex flex-wrap gap-2">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[10px] font-mono font-medium bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(55,215,255,0.3)] px-2.5 py-1 rounded-full transition-all"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Query Input Bar */}
        <div className="p-4 bg-[rgba(5,7,13,0.85)] border-t border-[rgba(255,255,255,0.08)] flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Ask Copilot about this evidence artifact..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-[rgba(13,20,32,0.8)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] font-mono transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="bg-gradient-to-r from-[#8B5CF6] to-[#4D7CFF] hover:opacity-95 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

