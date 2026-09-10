import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { ThreatGauge } from "./components/ThreatGauge";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { RouteMap } from "./components/RouteMap";
import { RawHeaderInspector } from "./components/RawHeaderInspector";
import { AuthMatrix } from "./components/AuthMatrix";
import { DomainImpersonator } from "./components/DomainImpersonator";
import { ArtifactsMatrix } from "./components/ArtifactsMatrix";
import { AttackGraphView } from "./components/AttackGraphView";
import { EvidenceSelector } from "./components/EvidenceSelector";
import { CopilotModal } from "./components/CopilotModal";
import { EvidenceUploader } from "./components/EvidenceUploader";
import { SearchModal } from "./components/SearchModal";
import { CaseManagerModal } from "./components/CaseManagerModal";
import { api, EvidenceSummary, EvidenceDetail } from "./services/api";
import { Download, Printer, Copy, Check, Sparkles, ChevronDown, ChevronUp, RefreshCw, UploadCloud } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [evidenceList, setEvidenceList] = useState<EvidenceSummary[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [currentEvidence, setCurrentEvidence] = useState<EvidenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  // Modals
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch initial evidence list
  const fetchList = async (preferredId?: string) => {
    try {
      const list = await api.getEvidenceList();
      setEvidenceList(list);
      if (preferredId && list.some((e) => e.evidence_id === preferredId)) {
        setSelectedEvidenceId(preferredId);
      } else if (list.length > 0) {
        setSelectedEvidenceId(list[0].evidence_id);
      } else {
        setSelectedEvidenceId(null);
        setCurrentEvidence(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Fetch active evidence details
  useEffect(() => {
    if (!selectedEvidenceId) {
      setCurrentEvidence(null);
      setLoading(false);
      return;
    }
    const loadDetail = async () => {
      setLoading(true);
      try {
        const data = await api.getEvidenceDetail(selectedEvidenceId);
        setCurrentEvidence(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [selectedEvidenceId]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDeleteEvidence = async (id: string) => {
    try {
      await api.deleteEvidence(id);
      const remaining = evidenceList.filter((e) => e.evidence_id !== id);
      setEvidenceList(remaining);
      if (selectedEvidenceId === id) {
        if (remaining.length > 0) {
          setSelectedEvidenceId(remaining[0].evidence_id);
        } else {
          setSelectedEvidenceId(null);
          setCurrentEvidence(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete evidence:", err);
    }
  };

  const handleSeedSamples = async () => {
    setLoading(true);
    try {
      await api.seedDemoData();
      await fetchList();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploader={() => setUploaderOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCases={() => setCaseModalOpen(true)}
        evidenceCount={evidenceList.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 space-y-6">
        
        {/* Interactive "How To Use" Guide Banner */}
        <div className="glass-panel p-4 border-l-4 border-cyan-400 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div>
                <h1 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  How This Platform Works (Quick 5-Step Guide)
                </h1>
                <p className="text-xs text-slate-400">
                  AI-assisted email forensic investigation & threat intelligence workbench.
                </p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1">
              <span>{showGuide ? "Hide Guide" : "Show Guide"}</span>
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showGuide && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="font-extrabold text-cyan-400 block">1️⃣ Select Incident</span>
                <span className="text-slate-300">Pick any suspicious email from the left sidebar to load its evidence.</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="font-extrabold text-cyan-400 block">2️⃣ Threat Gauge (0-100)</span>
                <span className="text-slate-300">See the exact mathematical score & reasons why the email is dangerous.</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="font-extrabold text-cyan-400 block">3️⃣ Trace World Route</span>
                <span className="text-slate-300">Click <strong>Route & GeoIP</strong> to see the interactive map and SMTP hops.</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="font-extrabold text-purple-400 block">4️⃣ Ask AI Copilot</span>
                <span className="text-slate-300">Click <strong>AI Copilot</strong> to ask questions like <em>"Why is this fake?"</em>.</span>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="font-extrabold text-emerald-400 block">5️⃣ Export Reports</span>
                <span className="text-slate-300">Download court/SOC forensic HTML dossiers or STIX 2.1 JSON bundles.</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Evidence Identity & Cryptographic Hash Strip */}
        {currentEvidence && (
          <div className="glass-panel p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-slate-800">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-800">
                  {currentEvidence.evidence_id}
                </span>
                <span className="text-sm font-extrabold text-white truncate max-w-xl">
                  {currentEvidence.subject || "(No Subject)"}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({(currentEvidence.file_size / 1024).toFixed(1)} KB)
                </span>
              </div>

              {/* Dual-Hash Cryptographic Integrity Strip */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">SHA-256:</span>
                  <span className="text-slate-200 text-[11px]">{currentEvidence.sha256.slice(0, 24)}...</span>
                  <button
                    onClick={() => handleCopy(currentEvidence.sha256, "sha256")}
                    className="text-slate-400 hover:text-cyan-400 transition-colors ml-1"
                    title="Copy Full SHA-256"
                  >
                    {copiedHash === "sha256" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">SHA-3-256:</span>
                  <span className="text-slate-200 text-[11px]">{currentEvidence.sha3_256.slice(0, 24)}...</span>
                  <button
                    onClick={() => handleCopy(currentEvidence.sha3_256, "sha3")}
                    className="text-slate-400 hover:text-purple-400 transition-colors ml-1"
                    title="Copy Full SHA-3-256"
                  >
                    {copiedHash === "sha3" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2.5">
              <a
                href={api.getStixUrl(currentEvidence.evidence_id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                STIX 2.1 JSON
              </a>

              <a
                href={api.getReportUrl(currentEvidence.evidence_id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-cyan-600/30"
              >
                <Printer className="w-4 h-4" />
                Print Forensic Dossier
              </a>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Evidence Incidents Selector */}
          <div className="lg:col-span-1">
            <EvidenceSelector
              evidenceList={evidenceList}
              selectedId={selectedEvidenceId}
              onSelect={(id) => setSelectedEvidenceId(id)}
              onDelete={handleDeleteEvidence}
            />
          </div>

          {/* Right Column: Investigation Workspace */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="glass-panel p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-300">Analyzing cryptographic artifacts & reconstructing route...</span>
              </div>
            ) : currentEvidence ? (
              <>
                {/* 1. Triage & Intel Dashboard */}
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-1">
                        <ThreatGauge
                          score={currentEvidence.threat_score}
                          aiIntel={currentEvidence.ai_intel}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <AuthMatrix
                          auth={currentEvidence.auth}
                          fromAddr={currentEvidence.from_addr}
                          returnPath={currentEvidence.return_path}
                          replyTo={currentEvidence.reply_to}
                        />
                      </div>
                    </div>

                    <ExecutiveSummary evidence={currentEvidence} />

                    <DomainImpersonator
                      domains={currentEvidence.domains}
                      fromName={currentEvidence.from_name}
                      fromAddr={currentEvidence.from_addr}
                      replyTo={currentEvidence.reply_to}
                    />

                    <ArtifactsMatrix
                      urls={currentEvidence.urls}
                      attachments={currentEvidence.attachments}
                      iocs={currentEvidence.iocs}
                    />
                  </div>
                )}

                {/* 2. Route & GeoIP View */}
                {activeTab === "route" && (
                  <RouteMap
                    hops={currentEvidence.smtp_hops}
                    ips={currentEvidence.ips}
                  />
                )}

                {/* 3. Headers & Auth View */}
                {activeTab === "headers" && (
                  <div className="space-y-6">
                    <AuthMatrix
                      auth={currentEvidence.auth}
                      fromAddr={currentEvidence.from_addr}
                      returnPath={currentEvidence.return_path}
                      replyTo={currentEvidence.reply_to}
                    />
                    <RawHeaderInspector evidence={currentEvidence} />
                  </div>
                )}

                {/* 4. Campaign Graph View */}
                {activeTab === "graph" && <AttackGraphView />}
              </>
            ) : (
              <div className="glass-panel p-16 text-center text-slate-400 space-y-4">
                <div className="text-sm font-bold text-white">No active evidence records in workspace.</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Upload a custom suspicious email artifact (.eml) or load the pre-packaged forensic sample threats to start investigating.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleSeedSamples}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Load Forensic Sample Threats
                  </button>
                  <button
                    onClick={() => setUploaderOpen(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload Custom Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive Modals */}
      {currentEvidence && (
        <CopilotModal
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          evidenceId={currentEvidence.evidence_id}
        />
      )}

      <EvidenceUploader
        isOpen={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        onIngestSuccess={(newId) => {
          fetchList(newId);
          setActiveTab("dashboard");
        }}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectEvidence={(evId) => {
          setSelectedEvidenceId(evId);
          setActiveTab("dashboard");
        }}
      />

      <CaseManagerModal
        isOpen={caseModalOpen}
        onClose={() => setCaseModalOpen(false)}
        onSelectEvidence={(evId) => {
          setSelectedEvidenceId(evId);
          setActiveTab("dashboard");
        }}
      />
    </div>
  );
};

export default App;
