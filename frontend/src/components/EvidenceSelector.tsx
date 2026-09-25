import React from "react";
import { Mail, Trash2, Shield, AlertTriangle, FileWarning, CheckCircle, Database } from "lucide-react";
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
  // Categorize threats with professional nomenclature and iconography
  const getThreatCategory = (subject: string, classification: string) => {
    const s = subject.toLowerCase();
    if (s.includes("wire transfer") || s.includes("titan") || classification.includes("BEC")) {
      return { 
        Icon: AlertTriangle, 
        label: "BEC Wire Fraud ($148.5k)", 
        iconColor: "text-[#EF4444]" 
      };
    }
    if (s.includes("password") || s.includes("expires") || classification.includes("Phishing")) {
      return { 
        Icon: Shield, 
        label: "Credential Harvest Phish", 
        iconColor: "text-[#F59E0B]" 
      };
    }
    if (s.includes("invoice") || s.includes("remittance") || classification.includes("Invoice")) {
      return { 
        Icon: FileWarning, 
        label: "Malicious Macro Attachment", 
        iconColor: "text-[#EF4444]" 
      };
    }
    return { 
      Icon: CheckCircle, 
      label: "Legitimate Corporate Traffic", 
      iconColor: "text-[#10B981]" 
    };
  };

  return (
    <div className="glass-panel p-4 space-y-3.5 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#37D7FF]" />
          <span>EVIDENCE VAULT QUEUE</span>
        </span>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[rgba(55,215,255,0.1)] text-[#37D7FF] border border-[rgba(55,215,255,0.25)]">
          {evidenceList.length} CASES
        </span>
      </div>

      <div className="space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
        {evidenceList.map((ev) => {
          const isSelected = ev.evidence_id === selectedId;
          const score = ev.final_score ?? 0;
          const risk = ev.risk_level ?? "LOW";
          const threat = getThreatCategory(ev.subject, ev.classification);
          const ThreatIcon = threat.Icon;

          return (
            <div
              key={ev.evidence_id}
              onClick={() => onSelect(ev.evidence_id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative group ${
                isSelected
                  ? "bg-[rgba(18,28,45,0.9)] border-[rgba(55,215,255,0.45)] shadow-[0_0_25px_rgba(55,215,255,0.15)] pl-4"
                  : "bg-[rgba(5,7,13,0.55)] hover:bg-[rgba(13,20,32,0.8)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]"
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[#37D7FF] to-[#8B5CF6] rounded-l-xl shadow-[0_0_8px_#37D7FF]" />
              )}

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white tracking-wide">
                  {ev.evidence_id}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      risk === "CRITICAL"
                        ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.4)] shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                        : risk === "HIGH"
                        ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.4)]"
                        : risk === "MEDIUM"
                        ? "bg-[rgba(55,215,255,0.15)] text-[#37D7FF] border-[rgba(55,215,255,0.4)]"
                        : "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.4)]"
                    }`}
                  >
                    {risk} • {score}
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Permanently purge forensic evidence ${ev.evidence_id} and associated telemetry?`)) {
                        onDelete(ev.evidence_id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-[#EF4444] p-1 rounded-md transition-all hover:bg-[rgba(239,68,68,0.1)]"
                    title="Purge Evidence Artifact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2" title={ev.subject}>
                {ev.subject || "(No Subject)"}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ThreatIcon className={`w-3.5 h-3.5 shrink-0 ${threat.iconColor}`} />
                <span className="truncate text-[11px] font-medium">{threat.label}</span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 truncate pt-1.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <span className="truncate">{ev.from_addr}</span>
                {ev.blockchain_status === "REGISTERED" && (
                  <span className="shrink-0 text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20" title="Cryptographically Anchored on Blockchain">
                    ⛓ ON-CHAIN
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

