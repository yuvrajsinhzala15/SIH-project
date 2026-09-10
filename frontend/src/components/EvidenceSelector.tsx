import React from "react";
import { Mail, Trash2 } from "lucide-react";
import { EvidenceSummary } from "../services/api";

interface EvidenceSelectorProps {
  evidenceList: EvidenceSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EvidenceSelector: React.FC<EvidenceSelectorProps> = ({
  evidenceList,
  selectedId,
  onSelect,
  onDelete,
}) => {
  // Helper to give user-friendly threat badges
  const getThreatCategory = (subject: string, classification: string) => {
    const s = subject.toLowerCase();
    if (s.includes("wire transfer") || s.includes("titan") || classification.includes("BEC")) {
      return { icon: "🚨", label: "BEC Wire Fraud ($148.5k)", color: "text-red-400" };
    }
    if (s.includes("password") || s.includes("expires") || classification.includes("Phishing")) {
      return { icon: "🎣", label: "Password Phishing", color: "text-orange-400" };
    }
    if (s.includes("invoice") || s.includes("remittance") || classification.includes("Invoice")) {
      return { icon: "📄", label: "Fake Invoice + Macro (.docm)", color: "text-purple-400" };
    }
    return { icon: "🛡️", label: "Clean / Benign Newsletter", color: "text-emerald-400" };
  };

  return (
    <div className="glass-panel p-4 space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-cyan-400" />
            Analyzed Incidents ({evidenceList.length})
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">Click any email below to inspect its forensic story:</p>
      </div>

      <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
        {evidenceList.map((ev) => {
          const isSelected = ev.evidence_id === selectedId;
          const score = ev.final_score ?? 0;
          const risk = ev.risk_level ?? "LOW";
          const threatInfo = getThreatCategory(ev.subject, ev.classification);

          return (
            <div
              key={ev.evidence_id}
              onClick={() => onSelect(ev.evidence_id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative overflow-hidden group ${
                isSelected
                  ? "bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                  : "bg-slate-900/70 hover:bg-slate-800/80 border-slate-800"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-400" />
              )}

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-cyan-300">
                  {ev.evidence_id}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      risk === "CRITICAL"
                        ? "bg-red-950 text-red-400 border border-red-700"
                        : risk === "HIGH"
                        ? "bg-orange-950 text-orange-400 border border-orange-700"
                        : risk === "MEDIUM"
                        ? "bg-yellow-950 text-yellow-400 border border-yellow-700"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-700"
                    }`}
                  >
                    {risk} &bull; {score} pts
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to permanently delete evidence ${ev.evidence_id}? This will purge its database records and telemetry.`)) {
                        onDelete(ev.evidence_id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition-all"
                    title="Delete Evidence"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs font-bold text-white leading-snug line-clamp-2" title={ev.subject}>
                {ev.subject || "(No Subject)"}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span>{threatInfo.icon}</span>
                <span className={threatInfo.color}>{threatInfo.label}</span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 truncate pt-1 border-t border-slate-800/60">
                From: {ev.from_addr}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
