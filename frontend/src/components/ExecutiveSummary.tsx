import React from "react";
import { AlertCircle, CheckCircle2, Globe, Server, CheckSquare, Sparkles, Lock, ShieldCheck, MapPin } from "lucide-react";
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Observable Sending Infrastructure */}
      <div className="glass-panel p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              1. Observed Network Origin
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              Hop #{earliestHop?.hop_number || 1}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            The earliest public server where this message was detected entering the internet.
          </p>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2.5 mt-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">First Observable Public IP</span>
              <div className="font-mono text-sm font-extrabold text-cyan-300">
                {earliestHop?.source_ip || "Internal Network Relay"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Server Location:</span>
                <span className="font-semibold text-slate-200">
                  {earliestIpIntel ? `${earliestIpIntel.city}, ${earliestIpIntel.country}` : "Unavailable"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Hosting / ASN:</span>
                <span className="font-semibold text-slate-200 truncate block" title={earliestIpIntel?.asn_org}>
                  {earliestIpIntel ? `${earliestIpIntel.asn} (${earliestIpIntel.asn_org})` : "Unavailable"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Infrastructure Type:</span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                {earliestIpIntel?.infra_type || "Standard Relay"}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-amber-400 font-bold">Forensic Note: </span>
          Attribution confidence is <span className="font-bold text-white">LOW</span> because sophisticated attackers route messages through proxies, VPNs, or TOR nodes.
        </div>
      </div>

      {/* 2. Explainable Contributing Factors */}
      <div className="glass-panel p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              2. Why Is This Suspicious?
            </span>
            <span className="text-[10px] text-slate-400">Score Audit Log</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Every point added to the threat score is traceable to a specific forensic trigger.
          </p>

          <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1">
            {breakdown.length > 0 ? (
              breakdown.map((item, idx) => {
                const points = Object.keys(item)[0];
                const text = Object.values(item)[0];
                return (
                  <div key={idx} className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-900/60 shrink-0">
                      {points}
                    </span>
                    <span className="text-slate-300 text-[11px] leading-relaxed">{text}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-emerald-400 bg-emerald-950/40 p-3.5 rounded-lg border border-emerald-900/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>No suspicious indicators detected. Email conforms to all security checks.</span>
              </div>
            )}
          </div>
        </div>

        {evidence.ai_intel?.pii_redacted_count > 0 && (
          <div className="text-[10px] text-cyan-400 flex items-center gap-1.5 bg-cyan-950/40 px-3 py-2 rounded-lg border border-cyan-900/60">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Privacy Filter: {evidence.ai_intel.pii_redacted_count} sensitive PII fields (credit cards, banking details) were masked.</span>
          </div>
        )}
      </div>

      {/* 3. Recommended SOC Playbook Actions */}
      <div className="glass-panel p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              3. Recommended Actions
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">Incident Playbook</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Suggested next mitigation steps for security operations (SOC) analysts.
          </p>

          <div className="space-y-2 mt-3">
            {actions.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs">
                <div className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="text-slate-200 text-[11px] leading-snug">{act}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 text-right">
          *Analyst Advisory: Human confirmation required before taking blocking actions.
        </div>
      </div>
    </div>
  );
};
