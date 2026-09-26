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
import { BlockchainIntegrityModal } from "./components/BlockchainIntegrityModal";
import { api, EvidenceSummary, EvidenceDetail, BlockchainVerificationResult } from "./services/api";
import { Download, Printer, Copy, Check, Terminal, ChevronDown, ChevronUp, RefreshCw, UploadCloud, Shield, Hash, ShieldCheck, Link } from "lucide-react";

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
  const [blockchainModalOpen, setBlockchainModalOpen] = useState(false);
  const [quickVerifyResult, setQuickVerifyResult] = useState<BlockchainVerificationResult | null>(null);
  const [verifyingQuick, setVerifyingQuick] = useState(false);
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
      const urlParams = new URLSearchParams(window.location.search);
      const urlEv = urlParams.get("ev");
      const targetId = preferredId || (urlEv && list.some(e => e.evidence_id === urlEv) ? urlEv : undefined);

      if (targetId && list.some((e) => e.evidence_id === targetId)) {
        setSelectedEvidenceId(targetId);
      } else if (list.length > 0) {
        setSelectedEvidenceId(list[0].evidence_id);
      } else {
        setSelectedEvidenceId(null);
        setCurrentEvidence(null);
      }

      const urlTab = urlParams.get("tab");
      if (urlTab) setActiveTab(urlTab);
      const urlModal = urlParams.get("modal");
      if (urlModal === "copilot") setCopilotOpen(true);
      if (urlModal === "blockchain") setBlockchainModalOpen(true);
      if (urlModal === "cases") setCaseModalOpen(true);
      if (urlModal === "search") setSearchOpen(true);
      if (urlModal === "uploader") setUploaderOpen(true);
      if (urlParams.get("guide") === "false") setShowGuide(false);
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
    <div className="futuristic-bg min-h-screen text-slate-200 flex flex-col font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Floating Command Dock Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploader={() => setUploaderOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCases={() => setCaseModalOpen(true)}
        onOpenBlockchain={() => setBlockchainModalOpen(true)}
        evidenceCount={evidenceList.length}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        
        {/* Streamlined Forensic Workflow SOP Guide Banner */}
        <div className="glass-panel rounded-2xl border border-cyan-500/20 p-4 shadow-xl transition-all">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setShowGuide(!showGuide)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(55,215,255,0.2)]">
                <Terminal className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xs font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                  <span>Forensic Workbench Standard Operating Procedure (SOP)</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    LIVE PLAYBOOK
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Five-phase protocol for RFC 822 bitstream preservation, adversarial risk scoring, and adversary campaign attribution.
                </p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-cyan-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-700/50">
              <span>{showGuide ? "COLLAPSE PROTOCOL" : "EXPAND PROTOCOL"}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showGuide && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 pt-3.5 border-t border-cyan-500/15 text-[11px]">
              <div className="bg-[#0c1322]/80 p-3 rounded-xl border border-cyan-500/15 space-y-1 shadow-sm">
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  01 // INGEST EVIDENCE
                </span>
                <span className="text-slate-300 leading-relaxed block text-[11px]">
                  Pick queued artifact from the left evidence vault or upload custom RFC 822 EML bitstream.
                </span>
              </div>
              <div className="bg-[#0c1322]/80 p-3 rounded-xl border border-cyan-500/15 space-y-1 shadow-sm">
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  02 // RISK GAUGING
                </span>
                <span className="text-slate-300 leading-relaxed block text-[11px]">
                  Inspect calculated adversarial score, domain confusable glyphs, and heuristic indicators.
                </span>
              </div>
              <div className="bg-[#0c1322]/80 p-3 rounded-xl border border-cyan-500/15 space-y-1 shadow-sm">
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  03 // ROUTE UNWINDING
                </span>
                <span className="text-slate-300 leading-relaxed block text-[11px]">
                  Trace chronological RFC 822 relay hops timeline from border MTA boundary to destination.
                </span>
              </div>
              <div className="bg-[#0c1322]/80 p-3 rounded-xl border border-cyan-500/15 space-y-1 shadow-sm">
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  04 // FORENSIC COPILOT
                </span>
                <span className="text-slate-300 leading-relaxed block text-[11px]">
                  Query evidence-grounded AI copilot for chain-of-custody advisory, IOC pivots, and legal notes.
                </span>
              </div>
              <div className="bg-[#0c1322]/80 p-3 rounded-xl border border-cyan-500/15 space-y-1 shadow-sm">
                <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  05 // DOSSIER EXPORT
                </span>
                <span className="text-slate-300 leading-relaxed block text-[11px]">
                  Export structured OASIS STIX 2.1 JSON bundles or generate a court-admissible HTML dossier.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hero Evidence Identity & Dual-Hash Cryptographic Integrity Capsule */}
        {currentEvidence && (
          <div className="glass-panel-elevated rounded-2xl border border-cyan-500/25 p-4 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-lg border border-cyan-500/30 shadow-[0_0_12px_rgba(55,215,255,0.2)]">
                  {currentEvidence.evidence_id}
                </span>
                <span className="text-sm font-semibold text-white truncate max-w-xl">
                  {currentEvidence.subject || "(No Subject Header)"}
                </span>
                <span className="text-[11px] text-cyan-400/80 font-mono bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/60">
                  {(currentEvidence.file_size / 1024).toFixed(1)} KB
                </span>
              </div>

              {/* Dual-Hash Cryptographic Integrity Strip */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                <div className="flex items-center gap-2 bg-[#080e1a]/90 px-3 py-1.5 rounded-xl border border-cyan-500/20 shadow-sm">
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold uppercase">
                    <Hash className="w-3 h-3" />
                    <span>SHA-256:</span>
                  </div>
                  <span className="text-slate-300 tracking-wider">{currentEvidence.sha256.slice(0, 28)}...</span>
                  <button
                    onClick={() => handleCopy(currentEvidence.sha256, "sha256")}
                    className="text-slate-400 hover:text-cyan-300 transition-colors ml-1 p-0.5 rounded hover:bg-white/5"
                    title="Copy Full SHA-256 Bitstream Hash"
                  >
                    {copiedHash === "sha256" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-[#080e1a]/90 px-3 py-1.5 rounded-xl border border-purple-500/20 shadow-sm">
                  <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold uppercase">
                    <Shield className="w-3 h-3" />
                    <span>SHA-3-256:</span>
                  </div>
                  <span className="text-slate-300 tracking-wider">{currentEvidence.sha3_256.slice(0, 28)}...</span>
                  <button
                    onClick={() => handleCopy(currentEvidence.sha3_256, "sha3")}
                    className="text-slate-400 hover:text-purple-300 transition-colors ml-1 p-0.5 rounded hover:bg-white/5"
                    title="Copy Full SHA-3-256 Keccak Hash"
                  >
                    {copiedHash === "sha3" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Blockchain Anchoring Capsule */}
                <div className="flex items-center gap-2 bg-[#080e1a]/90 px-3 py-1.5 rounded-xl border border-emerald-500/25 shadow-sm">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase">
                    <Link className="w-3 h-3" />
                    <span>BLOCKCHAIN:</span>
                  </div>
                  <span className={`text-[10px] font-bold ${
                    currentEvidence.blockchain?.status === "REGISTERED" || currentEvidence.blockchain?.tx_hash
                      ? "text-emerald-300"
                      : "text-amber-400"
                  }`}>
                    {currentEvidence.blockchain?.status === "REGISTERED" || currentEvidence.blockchain?.tx_hash
                      ? "✓ REGISTERED"
                      : "UNREGISTERED"}
                  </span>
                  {currentEvidence.blockchain?.tx_hash && (
                    <span className="text-slate-400 text-[10px] hidden sm:inline">
                      ({currentEvidence.blockchain.tx_hash.slice(0, 10)}...)
                    </span>
                  )}
                  <button
                    onClick={() => setBlockchainModalOpen(true)}
                    className="ml-1 text-emerald-400 hover:text-emerald-300 underline text-[10px] cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Export & Blockchain Integrity Actions Strip */}
            <div className="flex flex-wrap items-center gap-2.5 font-mono">
              <button
                onClick={async () => {
                  setVerifyingQuick(true);
                  try {
                    const res = await api.verifyEvidenceIntegrity(currentEvidence.evidence_id);
                    setQuickVerifyResult(res);
                    setTimeout(() => setQuickVerifyResult(null), 4000);
                  } catch (e: any) {
                    alert("Verification error: " + (e.message || e));
                  } finally {
                    setVerifyingQuick(false);
                  }
                }}
                disabled={verifyingQuick}
                className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
                title="Cryptographically verify local bitstream against blockchain hash"
              >
                {verifyingQuick ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{quickVerifyResult ? `${quickVerifyResult.result} ✓` : "Verify Integrity"}</span>
              </button>

              <button
                onClick={() => setBlockchainModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/35 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                <Link className="w-3.5 h-3.5" />
                <span>Custody Ledger</span>
              </button>

              <a
                href={api.getStixUrl(currentEvidence.evidence_id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#0c1322]/90 hover:bg-cyan-950/40 text-slate-300 hover:text-white border border-cyan-500/25 hover:border-cyan-400/60 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>STIX 2.1</span>
              </a>

              <a
                href={api.getReportUrl(currentEvidence.evidence_id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(77,124,255,0.35)]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Dossier</span>
              </a>
            </div>
          </div>
        )}

        {/* 2-Column Forensic Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left Column: Evidence Queue Vault */}
          <div className="lg:col-span-1">
            <EvidenceSelector
              evidenceList={evidenceList}
              selectedId={selectedEvidenceId}
              onSelect={(id) => setSelectedEvidenceId(id)}
              onDelete={handleDeleteEvidence}
            />
          </div>

          {/* Right Column: Investigation Workspace */}
          <div className="lg:col-span-3 space-y-5">
            {loading ? (
              <div className="glass-panel-elevated rounded-2xl border border-cyan-500/20 p-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-4 shadow-2xl">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                  <div className="w-6 h-6 border-2 border-purple-500/30 border-b-purple-400 rounded-full animate-spin absolute inset-3" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-white tracking-wider uppercase block">
                    Reconstructing forensic telemetry & relay topology...
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    Validating cryptographic hashes and unrolling RFC 822 received headers
                  </span>
                </div>
              </div>
            ) : currentEvidence ? (
              <>
                {/* 1. Triage & Intel Dashboard */}
                {activeTab === "dashboard" && (
                  <div className="space-y-5">
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
                  <div className="space-y-5">
                    <AuthMatrix
                      auth={currentEvidence.auth}
                      fromAddr={currentEvidence.from_addr}
                      returnPath={currentEvidence.return_path}
                      replyTo={currentEvidence.reply_to}
                    />
                    <RawHeaderInspector evidence={currentEvidence} />
                  </div>
                )}

                {/* 4. Campaign Attack Graph View */}
                {activeTab === "graph" && (
                  <AttackGraphView
                    onSelectEvidence={(evId) => {
                      setSelectedEvidenceId(evId);
                      setActiveTab("dashboard");
                    }}
                  />
                )}
              </>
            ) : activeTab === "graph" ? (
              <AttackGraphView
                onSelectEvidence={(evId) => {
                  setSelectedEvidenceId(evId);
                  setActiveTab("dashboard");
                }}
              />
            ) : (
              <div className="glass-panel-elevated rounded-2xl border border-cyan-500/20 p-16 text-center text-slate-400 space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(55,215,255,0.2)]">
                  <Terminal className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  No Active Forensic Record Loaded in Workspace
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Ingest an RFC 822/5322 (.eml) artifact into the evidence vault or populate the benchmark threat presets to start telemetry triage.
                </p>
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={handleSeedSamples}
                    className="bg-[#0c1322] hover:bg-cyan-950/30 text-slate-200 hover:text-white border border-cyan-500/30 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Load Benchmark Threat Samples</span>
                  </button>
                  <button
                    onClick={() => setUploaderOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-[0_0_20px_rgba(55,215,255,0.35)] flex items-center gap-2"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Custom Email (.EML)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive HUD Modals */}
      <CopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        evidenceId={currentEvidence?.evidence_id || (evidenceList.length > 0 ? evidenceList[0].evidence_id : "")}
      />

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

      <BlockchainIntegrityModal
        evidence={currentEvidence}
        isOpen={blockchainModalOpen}
        onClose={() => setBlockchainModalOpen(false)}
        onEvidenceUpdated={() => {
          if (selectedEvidenceId) {
            api.getEvidenceDetail(selectedEvidenceId).then(setCurrentEvidence);
          }
        }}
      />
    </div>
  );
};

export default App;
