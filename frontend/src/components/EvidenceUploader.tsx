import React, { useState } from "react";
import { UploadCloud, FileCode, AlertCircle, X, Sparkles, AlertTriangle, KeyRound, FileWarning, CheckCircle, ShieldCheck, Database } from "lucide-react";
import { api } from "../services/api";

interface EvidenceUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (evidenceId: string) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ isOpen, onClose, onIngestSuccess }) => {
  const [activeTab, setActiveTab] = useState<"samples" | "file" | "text">("samples");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (activeTab === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (activeTab === "text" && rawText.trim()) {
        formData.append("raw_text", rawText);
        formData.append("filename", "raw_analyst_ingest.eml");
      } else {
        setError("Please provide an EML file or paste raw RFC 822 email headers.");
        setLoading(false);
        return;
      }

      const res = await api.uploadEvidence(formData);
      onIngestSuccess(res.evidence_id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to ingest evidence");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSamples = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.seedDemoData();
      const list = await api.getEvidenceList();
      if (list.length > 0) {
        onIngestSuccess(list[0].evidence_id);
      }
      onClose();
    } catch (err: any) {
      setError("Failed to load demo samples");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSamplePreset = async (presetIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.seedDemoData();
      const list = await api.getEvidenceList();
      if (list.length > presetIndex) {
        onIngestSuccess(list[presetIndex].evidence_id);
      } else if (list.length > 0) {
        onIngestSuccess(list[0].evidence_id);
      }
      onClose();
    } catch (err: any) {
      setError("Failed to load selected preset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel-elevated rounded-2xl border border-cyan-500/25 shadow-[0_0_60px_rgba(0,0,0,0.85),0_0_30px_rgba(55,215,255,0.12)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0c1322]/90 px-5 py-4 border-b border-cyan-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_15px_rgba(55,215,255,0.2)]">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Forensic Email Ingestion & Analysis Engine</span>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  SECURE VAULT
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Dual SHA-256 / SHA-3-256 Cryptographic Preservation & Telemetry Reconstruction</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white border border-slate-700/50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyan-500/15 bg-[#080d17]/80 text-xs font-mono">
          <button
            onClick={() => setActiveTab("samples")}
            className={`flex-1 py-3 transition-all flex items-center justify-center gap-2 font-medium ${
              activeTab === "samples"
                ? "text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10 shadow-[inset_0_-2px_8px_rgba(55,215,255,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Threat Presets</span>
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={`flex-1 py-3 transition-all flex items-center justify-center gap-2 font-medium ${
              activeTab === "file"
                ? "text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10 shadow-[inset_0_-2px_8px_rgba(55,215,255,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload .EML File</span>
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-3 transition-all flex items-center justify-center gap-2 font-medium ${
              activeTab === "text"
                ? "text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10 shadow-[inset_0_-2px_8px_rgba(55,215,255,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Paste RFC 822 Headers</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2.5 font-mono shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "samples" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-mono">
                  Select a forensic threat scenario to inspect real-time cryptographic verification and hop unwinding:
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Preset 1: BEC Wire Transfer */}
                <button
                  onClick={() => handleSelectSamplePreset(0)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-red-500/25 bg-gradient-to-br from-red-500/10 via-slate-900/40 to-slate-900/60 hover:from-red-500/20 hover:border-red-500/40 text-left transition-all group flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>BEC Wire Transfer ($148.5k)</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      CRITICAL 96
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Executive impersonation with hidden Reply-To address diversion and TOR exit relay transit.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Origin: 185.220.101.5</span>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Ingest &rarr;</span>
                  </div>
                </button>

                {/* Preset 2: Credential Harvester */}
                <button
                  onClick={() => handleSelectSamplePreset(1)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-900/60 hover:from-amber-500/20 hover:border-amber-500/40 text-left transition-all group flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Credential Phishing Portal</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HIGH 82
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Homoglyph domain <code className="text-amber-200 font-mono bg-amber-500/10 px-1 rounded">rnicrosoft-security.com</code> targeting M365 authentication.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Origin: 104.244.42.1</span>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Ingest &rarr;</span>
                  </div>
                </button>

                {/* Preset 3: Invoice Macro */}
                <button
                  onClick={() => handleSelectSamplePreset(2)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-slate-900/40 to-slate-900/60 hover:from-purple-500/20 hover:border-purple-500/40 text-left transition-all group flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                      <FileWarning className="w-3.5 h-3.5 text-purple-400" />
                      <span>Supply Chain Invoice Macro</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      HIGH 74
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Overdue invoice with double extension <code className="text-purple-200 font-mono bg-purple-500/10 px-1 rounded">.pdf.docm</code> containing obfuscated VBA code.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Origin: 198.51.100.22</span>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Ingest &rarr;</span>
                  </div>
                </button>

                {/* Preset 4: Benign Newsletter */}
                <button
                  onClick={() => handleSelectSamplePreset(3)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-slate-900/60 hover:from-emerald-500/20 hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Legitimate Cloud Bulletin</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      BENIGN 12
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Aligned SPF/DKIM/DMARC pass flags originating from verified SendGrid enterprise outbound cluster.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Origin: 167.89.44.12</span>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Ingest &rarr;</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === "file" && (
            <div className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/70 rounded-2xl p-8 text-center cursor-pointer transition-all bg-gradient-to-b from-cyan-950/20 to-transparent hover:bg-cyan-950/30 group">
              <input
                type="file"
                accept=".eml,.msg,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(55,215,255,0.25)]">
                  <UploadCloud className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="text-sm font-semibold text-white">
                  {selectedFile ? selectedFile.name : "Select or drag & drop RFC 822 .eml file"}
                </div>
                <div className="text-[11px] text-cyan-300/70 font-mono">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB (Ready for extraction)` : "Preserves bitstream with dual SHA-256 / SHA-3-256 cryptographic hashing"}
                </div>
              </label>
            </div>
          )}

          {activeTab === "text" && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-slate-400">Direct RFC 822 Raw Headers Input:</div>
              <textarea
                rows={9}
                placeholder="Paste raw RFC 822 email headers (e.g. Received: from..., Authentication-Results:..., From:..., Subject:..., Message-ID:...)..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full bg-[#070b13] border border-cyan-500/20 rounded-xl p-3.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0c1322]/90 px-5 py-3.5 border-t border-cyan-500/15 flex items-center justify-between">
          <button
            onClick={handleSeedSamples}
            disabled={loading}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-2 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Reset Demo Threats Database</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 transition-colors"
            >
              Cancel
            </button>
            {activeTab !== "samples" && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs font-mono transition-all shadow-[0_0_20px_rgba(55,215,255,0.35)] flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Preserve & Ingest"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
