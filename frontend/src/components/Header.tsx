import React from "react";
import { Shield, Search, Terminal, FileText, Database, Share2, UploadCloud, AlertTriangle, FolderGit2 } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenUploader: () => void;
  onOpenCopilot: () => void;
  onOpenSearch: () => void;
  onOpenCases: () => void;
  evidenceCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUploader,
  onOpenCopilot,
  onOpenSearch,
  onOpenCases,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white">ANTIGRAVITY</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                FORENSIC ENGINE v1.4
              </span>
            </div>
            <div className="text-xs text-slate-400">AI Email Threat Detection, Geolocation & Forensic Intelligence</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "dashboard" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Triage & Intel
          </button>
          <button
            onClick={() => setActiveTab("route")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "route" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Route & GeoIP
          </button>
          <button
            onClick={() => setActiveTab("headers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "headers" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Headers & Auth
          </button>
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "graph" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Campaign Graph
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search IOCs...</span>
            <kbd className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">Ctrl+K</kbd>
          </button>

          <button
            onClick={onOpenCases}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            Cases
          </button>

          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/60 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            AI Copilot
          </button>

          <button
            onClick={onOpenUploader}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-cyan-600/30"
          >
            <UploadCloud className="w-4 h-4" />
            Ingest Evidence
          </button>
        </div>
      </div>
    </header>
  );
};
