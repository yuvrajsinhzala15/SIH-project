import React, { useState } from "react";
import { Search, X, Database, Shield, ArrowRight } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
        {/* Search Input */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search everything across IPs, domains, URLs, hashes, cases, or senders..."
            value={query}
            autoFocus
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {loading && <div className="text-xs text-slate-400 p-2">Searching threat intelligence database...</div>}

          {!loading && results.length === 0 && query && (
            <div className="text-xs text-slate-500 text-center py-6">
              No matching forensic artifacts found for "{query}".
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
              className={`p-3 rounded-lg border transition-all flex items-center justify-between text-xs ${
                r.evidence_id
                  ? "bg-slate-950/80 hover:bg-slate-800 border-slate-800 cursor-pointer"
                  : "bg-slate-950 border-slate-800/60 opacity-80"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                    {r.category}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">{r.type}</span>
                </div>
                <div className="font-mono font-bold text-white text-xs">{r.value}</div>
                <div className="text-[10px] text-slate-400">{r.source}</div>
              </div>

              {r.evidence_id && (
                <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold">
                  <span>View Evidence</span>
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
