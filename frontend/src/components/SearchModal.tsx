import React, { useState } from "react";
import { Search, X, ArrowRight, Database, Terminal } from "lucide-react";
import { api } from "../services/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvidence: (evidenceId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectEvidence }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await api.globalSearch(val);
      setResults(resp.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel-elevated rounded-2xl border border-cyan-500/30 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(55,215,255,0.15)] overflow-hidden flex flex-col max-h-[540px]">
        {/* Search Input Bar */}
        <div className="bg-[#0c1322]/90 p-4 border-b border-cyan-500/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <input
            type="text"
            placeholder="Search across IPs, domains, URLs, cryptographic hashes, or cases..."
            value={query}
            autoFocus
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              ESC to exit
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white border border-slate-700/50 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-[#080d17]/90">
          {loading && (
            <div className="flex items-center gap-3 text-xs text-cyan-300/80 p-4 font-mono">
              <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <span>Querying global threat intelligence database & artifact indexes...</span>
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="text-xs text-slate-500 text-center py-10 font-mono space-y-1">
              <Database className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <div>No matching forensic telemetry artifacts found for "{query}".</div>
              <div className="text-[10px] text-slate-600">Try searching for an IP address, domain, SHA-256 hash, or subject keyword.</div>
            </div>
          )}

          {!loading && results.length === 0 && !query && (
            <div className="text-xs text-slate-500 text-center py-10 font-mono space-y-1">
              <Terminal className="w-6 h-6 text-cyan-500/50 mx-auto mb-2" />
              <div className="text-slate-400">Universal Forensic Artifact Search</div>
              <div className="text-[10px] text-slate-600">Type an IP, sender domain, homoglyph pattern, or SHA-256 hash to pivot.</div>
            </div>
          )}

          {results.map((r, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (r.evidence_id) {
                  onSelectEvidence(r.evidence_id);
                  onClose();
                }
              }}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs group ${
                r.evidence_id
                  ? "bg-[#0d1525]/80 hover:bg-cyan-950/30 border-cyan-500/20 hover:border-cyan-400/50 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(55,215,255,0.15)]"
                  : "bg-[#0d1525]/50 border-slate-800 opacity-75"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {r.category}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">{r.type}</span>
                </div>
                <div className="font-mono font-semibold text-white text-xs tracking-tight group-hover:text-cyan-300 transition-colors">
                  {r.value}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{r.source}</div>
              </div>

              {r.evidence_id && (
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-semibold opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <span>Pivot to Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
