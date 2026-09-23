import React from "react";
import { Globe, AlertCircle, CheckCircle2, CheckSquare, Lock, Activity, ShieldAlert } from "lucide-react";
import { EvidenceDetail } from "../services/api";

interface ExecutiveSummaryProps {
  evidence: EvidenceDetail;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ evidence }) => {
  const earliestHop = evidence.smtp_hops?.find((h) => !h.is_private_ip && h.source_ip);
  const earliestIpIntel = evidence.ips?.find((ip) => ip.ip === earliestHop?.source_ip);
  const breakdown = evidence.threat_score?.breakdown || [];
  const actions = evidence.threat_score?.recommended_actions || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Observable Sending Infrastructure */}
      <div className="glass-panel p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#37D7FF]" />
              <span>01 // NETWORK ORIGIN</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(55,215,255,0.1)] text-[#37D7FF] border border-[rgba(55,215,255,0.3)]">
              Hop #{earliestHop?.hop_number || 1}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Earliest public perimeter relay observed receiving the message before transit.
          </p>

          <div className="bg-[rgba(5,7,13,0.55)] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-2.5 mt-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">First Observable Public IP</span>
              <div className="font-mono text-xs font-bold text-white mt-0.5 flex items-center gap-2">
                <span className="text-[#37D7FF]">{earliestHop?.source_ip || "Internal Relay (RFC 1918)"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-[rgba(255,255,255,0.06)]">
              <div>
                <span className="text-[10px] font-mono text-slate-500 block">GeoIP Location</span>
                <span className="font-semibold text-slate-200 text-[11px] truncate block mt-0.5">
                  {earliestIpIntel ? `${earliestIpIntel.city}, ${earliestIpIntel.country}` : "Unavailable"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block">Autonomous System</span>
                <span className="font-semibold text-slate-200 text-[11px] truncate block mt-0.5" title={earliestIpIntel?.asn_org}>
                  {earliestIpIntel ? `${earliestIpIntel.asn} (${earliestIpIntel.asn_org})` : "Unavailable"}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">Infrastructure Node:</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.05)] text-[#4D7CFF] border border-[rgba(77,124,255,0.25)]">
                {earliestIpIntel?.infra_type || "Standard Relay"}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 bg-[rgba(5,7,13,0.65)] p-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] leading-relaxed font-mono">
          <span className="text-[#F59E0B] font-bold">ATTRIBUTION NOTE: </span>
          Confidence constrained by upstream commercial VPNs, proxies, or Tor exit gateways.
        </div>
      </div>

      {/* 2. Explainable Contributing Factors */}
      <div className="glass-panel p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>02 // FORENSIC AUDIT TRIGGERS</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Heuristic Log</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Mathematical threat points verified against deterministic detection rules.
          </p>

          <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1">
            {breakdown.length > 0 ? (
              breakdown.map((item, idx) => {
                const points = Object.keys(item)[0];
                const text = Object.values(item)[0];
                return (
                  <div key={idx} className="flex items-start gap-2 bg-[rgba(5,7,13,0.55)] p-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] text-xs">
                    <span className="font-mono font-black text-[#EF4444] bg-[rgba(239,68,68,0.12)] px-2 py-0.5 rounded border border-[rgba(239,68,68,0.3)] shrink-0 text-[10px]">
                      {points}
                    </span>
                    <span className="text-slate-200 text-xs leading-relaxed">{text}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-[#10B981] bg-[rgba(16,185,129,0.08)] p-3 rounded-xl border border-[rgba(16,185,129,0.3)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero anomalous triggers. Conforms to baseline hygiene.</span>
              </div>
            )}
          </div>
        </div>

        {evidence.ai_intel?.pii_redacted_count > 0 && (
          <div className="text-[11px] text-[#37D7FF] flex items-center gap-2 bg-[rgba(55,215,255,0.06)] px-3 py-2 rounded-lg border border-[rgba(55,215,255,0.2)] font-mono">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Privacy Filter: {evidence.ai_intel.pii_redacted_count} PII items redacted prior to NLP.</span>
          </div>
        )}
      </div>

      {/* 3. Recommended SOC Playbook Actions */}
      <div className="glass-panel p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-[#10B981]" />
              <span>03 // SOC INCIDENT PLAYBOOK</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.3)]">
              Triage Steps
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Automated containment actions tailored to extracted threat telemetry.
          </p>

          <div className="space-y-2 mt-3">
            {actions.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2.5 bg-[rgba(5,7,13,0.55)] p-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] text-xs">
                <div className="w-5 h-5 rounded-md bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.3)] flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="text-slate-200 text-xs leading-snug">{act}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-500 border-t border-[rgba(255,255,255,0.06)] pt-2.5 text-right">
          *Advisory: Requires tier-2 analyst approval before firewall block push.
        </div>
      </div>
    </div>
  );
};

