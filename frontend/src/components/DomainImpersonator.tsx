import React from "react";
import { AlertOctagon, UserX, AlertTriangle, ShieldCheck, Fingerprint } from "lucide-react";
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Domain Spoofing & Confusable Glyph Matrix
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Evaluates Cyrillic/Greek homoglyphs, visual confusable character matrices, and brand impersonation.
          </p>
        </div>
        <span className="text-[10px] font-mono text-[#F59E0B] bg-[rgba(245,158,11,0.1)] px-2.5 py-0.5 rounded-full border border-[rgba(245,158,11,0.3)]">
          Adversarial Homoglyph Engine
        </span>
      </div>

      {/* Reply-To Diversion Alert Banner */}
      {hasReplyMismatch && (
        <div className="bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.4)] p-4 rounded-xl flex items-start gap-3 shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-pulse">
          <UserX className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-extrabold text-[#EF4444] uppercase tracking-wider font-mono">
              CRITICAL: Deceptive Reply-To Routing Diversion
            </div>
            <div className="text-slate-300 text-xs leading-relaxed">
              Email sender displays <span className="font-mono text-white bg-[rgba(5,7,13,0.8)] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.15)] font-bold">{fromAddr}</span>, but replies are redirected to adversary-controlled mailbox{" "}
              <span className="font-mono text-[#EF4444] bg-[rgba(5,7,13,0.8)] px-2 py-0.5 rounded border border-[rgba(239,68,68,0.4)] font-bold">{replyTo}</span>.
            </div>
          </div>
        </div>
      )}

      {/* Domain Analysis Table */}
      <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-xl bg-[rgba(5,7,13,0.4)]">
        <table className="forensic-table">
          <thead>
            <tr>
              <th>Observed Domain</th>
              <th>Target Brand</th>
              <th>Visual Similarity</th>
              <th>Homoglyph / Punycode Substitution</th>
              <th>Risk Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)] font-mono">
            {domains.map((d, idx) => (
              <tr key={idx} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                <td className="font-mono font-bold text-white text-xs">
                  {d.domain}
                </td>
                <td>
                  {d.target_brand ? (
                    <span className="text-[#37D7FF] font-sans font-bold text-xs">{d.target_brand}</span>
                  ) : (
                    <span className="text-slate-500 font-sans text-xs">None (Independent)</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-2 font-sans">
                    <span className="font-mono text-xs font-bold text-white">
                      {(d.similarity_score * 100).toFixed(0)}%
                    </span>
                    <div className="w-20 bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden border border-[rgba(255,255,255,0.1)]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          d.similarity_score >= 0.8 ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-[#10B981]"
                        }`}
                        style={{ width: `${d.similarity_score * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="text-xs text-slate-300">
                  {d.is_homoglyph ? (
                    <div className="text-[#EF4444] font-mono bg-[rgba(239,68,68,0.08)] p-2 rounded-lg border border-[rgba(239,68,68,0.3)] text-[11px] shadow-sm">
                      <span className="font-sans font-bold text-slate-400 uppercase block text-[9px] mb-0.5">Confusable Glyphs:</span>
                      {Object.entries(d.homoglyph_breakdown).map(([k, v]) => `'${k}' ➔ '${v}'`).join(", ")}
                    </div>
                  ) : d.is_punycode ? (
                    <span className="text-[#8B5CF6] font-mono">Punycode (IDN): {d.punycode_decoded}</span>
                  ) : (
                    <span className="text-slate-500 font-sans text-xs">ASCII Clean Standard Domain</span>
                  )}
                </td>
                <td className="font-sans">
                  {d.is_suspicious ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.4)] shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      ● SUSPICIOUS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.4)]">
                      ● BENIGN
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

