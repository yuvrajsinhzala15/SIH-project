import React from "react";
import { Link2, Paperclip, ShieldAlert, FileWarning, ExternalLink, Hash, Check } from "lucide-react";
import { UrlIntel, AttachmentRecord, IOC } from "../services/api";

interface ArtifactsMatrixProps {
  urls: UrlIntel[];
  attachments: AttachmentRecord[];
  iocs: IOC[];
}

export const ArtifactsMatrix: React.FC<ArtifactsMatrixProps> = ({ urls, attachments, iocs }) => {
  return (
    <div className="space-y-4">
      {/* 1. URL Safe Forensics */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#37D7FF]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Extracted Hyperlink Telemetry (Defanged)
            </h2>
          </div>
          <span className="text-[10px] text-[#37D7FF] font-mono bg-[rgba(55,215,255,0.1)] px-2.5 py-0.5 rounded-full border border-[rgba(55,215,255,0.25)]">
            {urls.length} DESTINATIONS
          </span>
        </div>

        {urls.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 font-mono">No embedded hyperlinks detected in message body.</div>
        ) : (
          <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-xl bg-[rgba(5,7,13,0.4)]">
            <table className="forensic-table font-mono">
              <thead>
                <tr className="font-sans">
                  <th>Defanged Destination</th>
                  <th>Target Hostname</th>
                  <th>Risk Score</th>
                  <th>Triggered Heuristics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {urls.map((u, idx) => (
                  <tr key={idx} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                    <td className="text-white font-medium break-all max-w-sm text-xs">
                      {u.defanged_url}
                    </td>
                    <td className="text-slate-300 text-xs">
                      {u.domain}
                      {u.is_ip_based_url && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.35)] font-bold">
                          RAW IP
                        </span>
                      )}
                    </td>
                    <td className="font-sans">
                      <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                        u.is_suspicious
                          ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.4)] shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                          : "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.4)]"
                      }`}>
                        {u.is_suspicious ? `● HIGH (${u.risk_score} pts)` : "● BENIGN"}
                      </span>
                    </td>
                    <td className="text-xs font-sans text-slate-300">
                      {u.risk_reasons.length > 0 ? u.risk_reasons.join(" • ") : "Standard link structure"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Attachment Static Analysis */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Binary Attachment Static Analysis (Isolated Sandbox)
            </h2>
          </div>
          <span className="text-[10px] text-[#8B5CF6] font-mono bg-[rgba(139,92,246,0.1)] px-2.5 py-0.5 rounded-full border border-[rgba(139,92,246,0.25)]">
            {attachments.length} ARTIFACTS
          </span>
        </div>

        {attachments.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 font-mono">No binary attachments present in this evidence record.</div>
        ) : (
          <div className="space-y-3">
            {attachments.map((att, idx) => (
              <div key={idx} className="bg-[rgba(5,7,13,0.55)] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileWarning className={`w-4 h-4 ${att.is_suspicious ? "text-[#EF4444]" : "text-slate-400"}`} />
                    <span className="font-mono font-bold text-xs text-white">{att.filename}</span>
                    <span className="text-[10px] font-mono text-slate-400">({(att.file_size / 1024).toFixed(1)} KB)</span>
                  </div>

                  <span className={`font-mono text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    att.is_suspicious 
                      ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.4)] shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                      : "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.4)]"
                  }`}>
                    {att.is_suspicious ? "● MALICIOUS HEURISTICS" : "● BENIGN"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono bg-[rgba(5,7,13,0.8)] p-3 rounded-lg border border-[rgba(255,255,255,0.06)]">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">SHA-256 Digest:</span>
                    <span className="text-[#37D7FF] text-xs break-all">{att.sha256}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">SHA-3-256 Digest:</span>
                    <span className="text-[#8B5CF6] text-xs break-all">{att.sha3_256}</span>
                  </div>
                </div>

                {att.risk_factors.length > 0 && (
                  <div className="text-xs text-[#EF4444] bg-[rgba(239,68,68,0.1)] p-3 rounded-lg border border-[rgba(239,68,68,0.3)] space-y-1">
                    <span className="font-bold uppercase text-[10px] font-mono tracking-wider">Static Risk Indicators:</span>
                    <ul className="list-disc list-inside text-xs font-mono space-y-0.5">
                      {att.risk_factors.map((rf, rIdx) => (
                        <li key={rIdx}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Normalized IOCs Table */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Normalized Indicators of Compromise (IOC Registry)
            </h2>
          </div>
          <span className="text-[10px] text-[#F59E0B] font-mono bg-[rgba(245,158,11,0.1)] px-2.5 py-0.5 rounded-full border border-[rgba(245,158,11,0.25)]">
            {iocs.length} NORMALIZED INDICATORS
          </span>
        </div>

        <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-xl bg-[rgba(5,7,13,0.4)]">
          <table className="forensic-table font-mono">
            <thead>
              <tr className="font-sans">
                <th>IOC Type</th>
                <th>Defanged Value</th>
                <th>Confidence</th>
                <th>Source Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {iocs.map((ioc, idx) => (
                <tr key={idx} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                  <td className="font-bold text-[#F59E0B] uppercase text-xs">
                    {ioc.ioc_type}
                  </td>
                  <td className="text-white break-all text-xs font-bold">
                    {ioc.defanged_value}
                  </td>
                  <td className="font-sans text-xs">
                    <span className="text-[#37D7FF] font-mono font-bold">{(ioc.confidence * 100).toFixed(0)}%</span>
                  </td>
                  <td className="font-sans text-slate-300 text-xs">
                    {ioc.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

