import React from "react";
import { Link2, Paperclip, ShieldAlert, FileWarning, ExternalLink, Copy, Check } from "lucide-react";
import { UrlIntel, AttachmentRecord, IOC } from "../services/api";

interface ArtifactsMatrixProps {
  urls: UrlIntel[];
  attachments: AttachmentRecord[];
  iocs: IOC[];
}

export const ArtifactsMatrix: React.FC<ArtifactsMatrixProps> = ({ urls, attachments, iocs }) => {
  return (
    <div className="space-y-5">
      {/* 1. URL Safe Forensics */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Safe URL Extraction & Inspection (Section 22)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {urls.length} Total Links Defanged
          </span>
        </div>

        {urls.length === 0 ? (
          <div className="text-xs text-slate-500 py-3">No embedded hyperlinks detected in email body.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/80 font-sans">
                  <th className="p-3">Defanged URL Destination</th>
                  <th className="p-3">Target Hostname</th>
                  <th className="p-3">Risk Assessment</th>
                  <th className="p-3">Triggered Heuristics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {urls.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-cyan-300 font-bold break-all max-w-sm">
                      {u.defanged_url}
                    </td>
                    <td className="p-3 text-slate-300">
                      {u.domain}
                      {u.is_ip_based_url && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          IP Hostname
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        u.is_suspicious
                          ? "bg-red-950 text-red-300 border border-red-800/60"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                      }`}>
                        {u.is_suspicious ? `HIGH (${u.risk_score} pts)` : "LOW"}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] font-sans text-slate-400">
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Attachment Static Forensics (Section 23 - No Dynamic Execution)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {attachments.length} Artifacts Analyzed
          </span>
        </div>

        {attachments.length === 0 ? (
          <div className="text-xs text-slate-500 py-3">No binary attachments present in this evidence record.</div>
        ) : (
          <div className="space-y-3">
            {attachments.map((att, idx) => (
              <div key={idx} className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileWarning className={`w-5 h-5 ${att.is_suspicious ? "text-red-400" : "text-slate-400"}`} />
                    <span className="font-mono font-bold text-xs text-white">{att.filename}</span>
                    <span className="text-[10px] font-mono text-slate-400">({(att.file_size / 1024).toFixed(1)} KB)</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    att.is_suspicious ? "bg-red-950 text-red-300 border border-red-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  }`}>
                    {att.is_suspicious ? "SUSPICIOUS ARTIFACT" : "BENIGN"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">SHA-256 Hash:</span>
                    <span className="text-cyan-400 text-[11px] break-all">{att.sha256}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SHA-3-256 Hash:</span>
                    <span className="text-purple-400 text-[11px] break-all">{att.sha3_256}</span>
                  </div>
                </div>

                {att.risk_factors.length > 0 && (
                  <div className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded border border-red-900/40 space-y-1">
                    <span className="font-bold uppercase text-[10px]">Static Risk Indicators:</span>
                    <ul className="list-disc list-inside text-[11px]">
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Extracted Threat Indicators of Compromise (Section 29)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {iocs.length} Normalized Indicators
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/80">
                <th className="p-3">IOC Type</th>
                <th className="p-3">Defanged Value</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Evidence Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {iocs.map((ioc, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold text-amber-400 uppercase">
                    {ioc.ioc_type}
                  </td>
                  <td className="p-3 text-slate-200 break-all">
                    {ioc.defanged_value}
                  </td>
                  <td className="p-3 font-sans">
                    {(ioc.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="p-3 font-sans text-slate-400 text-[11px]">
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
