import React from "react";
import { AlertOctagon, UserX, ArrowRight, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";
import { DomainIntel } from "../services/api";

interface DomainImpersonatorProps {
  domains: DomainIntel[];
  fromName?: string;
  fromAddr: string;
  replyTo: string;
}

export const DomainImpersonator: React.FC<DomainImpersonatorProps> = ({
  domains,
  fromAddr,
  replyTo,
}) => {
  const fromDomain = fromAddr.includes("@") ? fromAddr.split("@")[1].toLowerCase() : "";
  const replyDomain = replyTo.includes("@") ? replyTo.split("@")[1].toLowerCase() : "";
  const hasReplyMismatch = replyTo && replyDomain && fromDomain && replyDomain !== fromDomain;

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Domain Spoofing & Lookalike Analysis (Homoglyphs & Typosquatting)
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Detects deceptive lookalike characters (e.g. Cyrillic 'а', or 'rn' mimicking 'm' in 'rnicrosoft.com') intended to trick the victim.
          </p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded">Brand Impersonation Engine</span>
      </div>

      {/* Reply-To Diversion Alert Banner */}
      {hasReplyMismatch && (
        <div className="bg-red-950/60 border border-red-700/80 p-4 rounded-xl flex items-start gap-3 shadow-lg">
          <UserX className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-extrabold text-sm text-red-300">
              🚨 Critical Routing Deception: Hidden Reply-To Address Mismatch
            </div>
            <div className="text-slate-200 text-[11px] leading-relaxed">
              The email displays sender <span className="font-mono font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded">{fromAddr}</span>, but when the victim clicks "Reply", their response will secretly be sent to an attacker-controlled inbox at{" "}
              <span className="font-mono font-bold text-red-300 bg-red-900/60 px-1.5 py-0.5 rounded">{replyTo}</span>!
            </div>
          </div>
        </div>
      )}

      {/* Domain Analysis Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/90 font-sans">
              <th className="p-3">Observed Domain</th>
              <th className="p-3">Target Brand Impersonated</th>
              <th className="p-3">Visual Similarity</th>
              <th className="p-3">Homoglyph / Lookalike Breakdown</th>
              <th className="p-3">Risk Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {domains.map((d, idx) => (
              <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                <td className="p-3 font-bold text-cyan-300 text-sm">
                  {d.domain}
                </td>
                <td className="p-3">
                  {d.target_brand ? (
                    <span className="text-amber-300 font-extrabold text-xs">{d.target_brand}</span>
                  ) : (
                    <span className="text-slate-500 font-sans">None (Independent Domain)</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 font-sans">
                    <span className="font-mono font-bold text-slate-200">
                      {(d.similarity_score * 100).toFixed(0)}%
                    </span>
                    <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          d.similarity_score >= 0.8 ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${d.similarity_score * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-3 text-[11px] text-slate-300">
                  {d.is_homoglyph ? (
                    <div className="text-red-400 font-sans bg-red-950/40 p-2 rounded border border-red-900/50">
                      <strong className="block text-[10px] uppercase">Confusable Substitutions:</strong>
                      {Object.entries(d.homoglyph_breakdown).map(([k, v]) => `'${k}' ➔ '${v}'`).join(", ")}
                    </div>
                  ) : d.is_punycode ? (
                    <span className="text-purple-400">Punycode (IDN): {d.punycode_decoded}</span>
                  ) : (
                    <span className="text-slate-400 font-sans">Standard Domain Characters</span>
                  )}
                </td>
                <td className="p-3 font-sans">
                  {d.is_suspicious ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-950 text-red-300 border border-red-700">
                      SUSPICIOUS SENDER
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                      LEGITIMATE DOMAIN
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
