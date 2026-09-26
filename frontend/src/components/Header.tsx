import React from "react";
import { Shield, Search, Terminal, FileText, Database, Share2, UploadCloud, Bot, FolderGit2, Activity } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUploader: () => void;
  onOpenCopilot: () => void;
  onOpenSearch: () => void;
  onOpenCases: () => void;
  onOpenBlockchain?: () => void;
  evidenceCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUploader,
  onOpenCopilot,
  onOpenSearch,
  onOpenCases,
  onOpenBlockchain,
  evidenceCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-50 px-6 py-3 bg-[rgba(8,13,22,0.75)] backdrop-blur-2xl border-b border-[rgba(255,255,255,0.08)] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
      <div className="max-w-[1780px] mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Identity - Clean SIH Style Logo */}
        <div 
          className="flex items-center gap-4 cursor-pointer select-none py-1 group" 
          onClick={() => setActiveTab("dashboard")}
        >
          <img 
            src="/edrishti-text-logo-bright.png" 
            alt="E-Drishti" 
            className="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]" 
          />
        </div>

        {/* Futuristic Glass Navigation Dock */}
        <nav className="flex items-center bg-[rgba(13,20,32,0.65)] backdrop-blur-xl p-1 rounded-xl border border-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-[rgba(55,215,255,0.15)] to-[rgba(77,124,255,0.15)] text-[#37D7FF] border border-[rgba(55,215,255,0.35)] shadow-[0_0_15px_rgba(55,215,255,0.12)]"
                : "text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Triage & Intel
          </button>
          <button
            onClick={() => setActiveTab("route")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "route"
                ? "bg-gradient-to-r from-[rgba(77,124,255,0.15)] to-[rgba(139,92,246,0.15)] text-[#4D7CFF] border border-[rgba(77,124,255,0.35)] shadow-[0_0_15px_rgba(77,124,255,0.12)]"
                : "text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Route & GeoIP
          </button>
          <button
            onClick={() => setActiveTab("headers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "headers"
                ? "bg-gradient-to-r from-[rgba(139,92,246,0.15)] to-[rgba(217,70,239,0.15)] text-[#8B5CF6] border border-[rgba(139,92,246,0.35)] shadow-[0_0_15px_rgba(139,92,246,0.12)]"
                : "text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Headers & RFC 822
          </button>
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "graph"
                ? "bg-gradient-to-r from-[rgba(217,70,239,0.15)] to-[rgba(55,215,255,0.15)] text-[#D946EF] border border-[rgba(217,70,239,0.35)] shadow-[0_0_15px_rgba(217,70,239,0.12)]"
                : "text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Campaign Graph
          </button>
        </nav>

        {/* Holographic Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-[rgba(55,215,255,0.3)] text-xs font-medium transition-all shadow-sm"
            title="Search IOCs across all evidence (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#37D7FF]" />
            <span>Search IOCs</span>
            <kbd className="font-mono text-[10px] bg-[rgba(5,7,13,0.8)] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.1)] text-[#37D7FF]">Ctrl+K</kbd>
          </button>

          <button
            onClick={onOpenCases}
            className="flex items-center gap-1.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-slate-200 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(77,124,255,0.3)] px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#4D7CFF]" />
            <span>Cases</span>
          </button>

          {onOpenBlockchain && (
            <button
              onClick={onOpenBlockchain}
              className="flex items-center gap-1.5 bg-[rgba(16,185,129,0.08)] hover:bg-[rgba(16,185,129,0.16)] text-emerald-300 border border-[rgba(16,185,129,0.25)] px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              title="Blockchain Evidence Integrity & Chain of Custody"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Blockchain</span>
            </button>
          )}

          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 bg-[rgba(139,92,246,0.1)] hover:bg-[rgba(139,92,246,0.18)] text-violet-200 border border-[rgba(139,92,246,0.3)] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)] cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>AI Copilot</span>
          </button>

          <button
            onClick={onOpenUploader}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#37D7FF] via-[#4D7CFF] to-[#8B5CF6] hover:opacity-95 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(55,215,255,0.3)] cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Ingest Evidence</span>
          </button>
        </div>
      </div>
    </header>
  );
};

