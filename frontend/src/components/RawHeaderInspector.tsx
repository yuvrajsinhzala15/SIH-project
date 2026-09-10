import React, { useState } from "react";
import { FileCode, Search, Filter, ShieldCheck, AlertTriangle, ShieldAlert, Eye } from "lucide-react";
import { EvidenceDetail } from "../services/api";

interface RawHeaderInspectorProps {
  evidence: EvidenceDetail;
}

export const RawHeaderInspector: React.FC<RawHeaderInspectorProps> = ({ evidence }) => {
  const [filterTrust, setFilterTrust] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewBodyMode, setViewBodyMode] = useState<"plain" | "html" | "raw">("plain");

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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Email Header Forensics & Trust Model (Section 12)
            </h2>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search header name or value..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterTrust("ALL")}
                className={`px-2.5 py-1 rounded transition-all font-semibold ${
                  filterTrust === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({rawHeaders.length})
              </button>
              <button
                onClick={() => setFilterTrust("HIGH_TRUST")}
                className={`px-2.5 py-1 rounded transition-all font-semibold ${
                  filterTrust === "HIGH_TRUST" ? "bg-emerald-900 text-emerald-300" : "text-slate-400 hover:text-emerald-400"
                }`}
              >
                High
              </button>
              <button
                onClick={() => setFilterTrust("MEDIUM_TRUST")}
                className={`px-2.5 py-1 rounded transition-all font-semibold ${
                  filterTrust === "MEDIUM_TRUST" ? "bg-blue-900 text-blue-300" : "text-slate-400 hover:text-blue-400"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFilterTrust("LOWER_TRUST")}
                className={`px-2.5 py-1 rounded transition-all font-semibold ${
                  filterTrust === "LOWER_TRUST" ? "bg-amber-900 text-amber-300" : "text-slate-400 hover:text-amber-400"
                }`}
              >
                Lower
              </button>
            </div>
          </div>
        </div>

        {/* Headers Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-800/80 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-3 w-44">Header Name</th>
                <th className="p-3">Extracted Value</th>
                <th className="p-3 w-36">Trust Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredHeaders.map((h, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold text-cyan-400 align-top">
                    {h.name}
                  </td>
                  <td className="p-3 text-slate-300 break-all text-[11px] leading-relaxed">
                    {h.value}
                  </td>
                  <td className="p-3 align-top font-sans">
                    <span
                      title={h.explanation}
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded cursor-help ${
                        h.trust_level === "HIGH_TRUST"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                          : h.trust_level === "MEDIUM_TRUST"
                          ? "bg-blue-950 text-blue-300 border border-blue-800/60"
                          : "bg-amber-950 text-amber-300 border border-amber-800/60"
                      }`}
                    >
                      {h.trust_level}
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Isolated Message Body Sandbox (Execution-Safe)
            </h2>
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewBodyMode("plain")}
              className={`px-3 py-1 rounded font-semibold transition-all ${
                viewBodyMode === "plain" ? "bg-purple-900 text-purple-200" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Plaintext
            </button>
            <button
              onClick={() => setViewBodyMode("html")}
              className={`px-3 py-1 rounded font-semibold transition-all ${
                viewBodyMode === "html" ? "bg-purple-900 text-purple-200" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sanitized HTML
            </button>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
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
