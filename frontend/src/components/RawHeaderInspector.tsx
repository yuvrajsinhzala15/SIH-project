import React, { useState } from "react";
import { FileCode, Search, Eye, Terminal, Lock } from "lucide-react";
import { EvidenceDetail } from "../services/api";

interface RawHeaderInspectorProps {
  evidence: EvidenceDetail;
}

export const RawHeaderInspector: React.FC<RawHeaderInspectorProps> = ({ evidence }) => {
  const [filterTrust, setFilterTrust] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewBodyMode, setViewBodyMode] = useState<"plain" | "html">("plain");

  const rawHeaders = evidence.raw_headers || [];

  const filteredHeaders = rawHeaders.filter((h) => {
    const matchesTrust = filterTrust === "ALL" || h.trust_level === filterTrust;
    const matchesQuery =
      searchQuery === "" ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrust && matchesQuery;
  });

  return (
    <div className="space-y-5">
      {/* Header Forensic Inspector */}
      <div className="glass-panel p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3.5 mb-3.5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#37D7FF]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              RFC 822 Header Integrity & Trust Verification Engine
            </h2>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter header or value..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[rgba(5,7,13,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#37D7FF] font-mono transition-all"
              />
            </div>

            <div className="flex items-center bg-[rgba(5,7,13,0.8)] p-1 rounded-lg border border-[rgba(255,255,255,0.08)] text-xs font-mono">
              <button
                onClick={() => setFilterTrust("ALL")}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterTrust === "ALL" ? "bg-[rgba(55,215,255,0.15)] text-[#37D7FF] border border-[rgba(55,215,255,0.3)] shadow-[0_0_10px_rgba(55,215,255,0.15)]" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({rawHeaders.length})
              </button>
              <button
                onClick={() => setFilterTrust("HIGH_TRUST")}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterTrust === "HIGH_TRUST" ? "bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.3)]" : "text-slate-400 hover:text-[#10B981]"
                }`}
              >
                High
              </button>
              <button
                onClick={() => setFilterTrust("MEDIUM_TRUST")}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterTrust === "MEDIUM_TRUST" ? "bg-[rgba(77,124,255,0.15)] text-[#4D7CFF] border border-[rgba(77,124,255,0.3)]" : "text-slate-400 hover:text-[#4D7CFF]"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFilterTrust("LOWER_TRUST")}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterTrust === "LOWER_TRUST" ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)]" : "text-slate-400 hover:text-[#F59E0B]"
                }`}
              >
                Lower
              </button>
            </div>
          </div>
        </div>

        {/* Headers Table */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-[rgba(255,255,255,0.08)] rounded-xl bg-[rgba(5,7,13,0.4)]">
          <table className="forensic-table font-mono">
            <thead className="sticky top-0 bg-[rgba(8,13,22,0.95)] backdrop-blur-md z-10 font-sans border-b border-[rgba(255,255,255,0.08)]">
              <tr>
                <th className="w-52">Header Field</th>
                <th>Extracted RFC Value</th>
                <th className="w-40">Trust Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {filteredHeaders.map((h, idx) => (
                <tr key={idx} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                  <td className="font-bold text-[#37D7FF] align-top text-xs">
                    {h.name}
                  </td>
                  <td className="text-slate-200 break-all text-xs leading-relaxed font-medium">
                    {h.value}
                  </td>
                  <td className="align-top font-sans">
                    <span
                      title={h.explanation}
                      className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full cursor-help border ${
                        h.trust_level === "HIGH_TRUST"
                          ? "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.35)]"
                          : h.trust_level === "MEDIUM_TRUST"
                          ? "bg-[rgba(77,124,255,0.15)] text-[#4D7CFF] border-[rgba(77,124,255,0.35)]"
                          : "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.35)]"
                      }`}
                    >
                      {h.trust_level === "HIGH_TRUST" ? "● HIGH" : h.trust_level === "MEDIUM_TRUST" ? "● MEDIUM" : "● LOWER"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Message Body Sandbox View */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Execution-Isolated Quarantined Body Sandbox
            </h2>
          </div>

          <div className="flex items-center bg-[rgba(5,7,13,0.8)] p-1 rounded-lg border border-[rgba(255,255,255,0.08)] text-xs font-mono">
            <button
              onClick={() => setViewBodyMode("plain")}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                viewBodyMode === "plain" ? "bg-[rgba(55,215,255,0.15)] text-[#37D7FF] border border-[rgba(55,215,255,0.3)]" : "text-slate-400 hover:text-white"
              }`}
            >
              Plaintext
            </button>
            <button
              onClick={() => setViewBodyMode("html")}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                viewBodyMode === "html" ? "bg-[rgba(139,92,246,0.15)] text-[#8B5CF6] border border-[rgba(139,92,246,0.3)]" : "text-slate-400 hover:text-white"
              }`}
            >
              Sanitized HTML
            </button>
          </div>
        </div>

        <div className="bg-[rgba(5,7,13,0.85)] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed select-text shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)]">
          {viewBodyMode === "plain" ? (
            evidence.body_plain || "(No plaintext body found in message)"
          ) : (
            evidence.body_html || "(No HTML body found in message)"
          )}
        </div>
      </div>
    </div>
  );
};

