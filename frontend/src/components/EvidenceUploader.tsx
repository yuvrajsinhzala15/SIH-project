import React, { useState } from "react";
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, X, Sparkles, ShieldAlert, KeyRound, FileWarning, ShieldCheck } from "lucide-react";
import { api } from "../services/api";

interface EvidenceUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (evidenceId: string) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ isOpen, onClose, onIngestSuccess }) => {
  const [activeTab, setActiveTab] = useState<"file" | "text" | "samples">("samples");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-800/60 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Forensic Email Ingestion & Analysis Engine
              </div>
              <div className="text-[10px] text-slate-400">
                100% Defensible Evidence • Live DNS & GeoIP Lookups • Zero Synthetic Data
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs">
          <button
            onClick={() => setActiveTab("samples")}
            className={`flex-1 py-2.5 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "samples" ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-900" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1-Click Threat Presets
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={`flex-1 py-2.5 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "file" ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-900" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Custom .EML
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-2.5 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "text" ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-900" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-4 h-4" />
            Paste RFC 822 Headers
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "samples" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Select any verified forensic scenario to inspect real-time authentication analysis, GeoIP routing, and threat breakdown:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Preset 1: BEC Wire Transfer */}
                <button
                  onClick={() => handleSelectSamplePreset(0)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-red-900/60 bg-red-950/20 hover:bg-red-950/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Executive BEC Wire Fraud</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    CEO display-name spoofing requesting $148,500 wire transfer with TOR exit node routing.
                  </p>
                  <span className="mt-2 text-[10px] text-red-300 font-mono font-bold">Risk: CRITICAL (90+)</span>
                </button>

                {/* Preset 2: Credential Harvester */}
                <button
                  onClick={() => handleSelectSamplePreset(1)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-amber-900/60 bg-amber-950/20 hover:bg-amber-950/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Credential Phishing Portal</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Homoglyph domain <code className="text-amber-300 font-mono">rnicrosoft-security.com</code> with direct IP phishing link.
                  </p>
                  <span className="mt-2 text-[10px] text-amber-300 font-mono font-bold">Risk: HIGH (75+)</span>
                </button>

                {/* Preset 3: Invoice Macro */}
                <button
                  onClick={() => handleSelectSamplePreset(2)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <FileWarning className="w-4 h-4 text-rose-400" />
                    <span>Supply Chain Invoice Macro</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Overdue invoice with double extension <code className="text-rose-300 font-mono">.pdf.docm</code> containing embedded VBA macro.
                  </p>
                  <span className="mt-2 text-[10px] text-rose-300 font-mono font-bold">Risk: HIGH (70+)</span>
                </button>

                {/* Preset 4: Benign Newsletter */}
                <button
                  onClick={() => handleSelectSamplePreset(3)}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-emerald-900/60 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Legitimate Azure Bulletin</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Strictly aligned SPF/DKIM/DMARC from official Microsoft outbound protection relay.
                  </p>
                  <span className="mt-2 text-[10px] text-emerald-300 font-mono font-bold">Risk: CLEAN / BENIGN (&lt;20)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "file" && (
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-lg p-6 text-center cursor-pointer transition-colors bg-slate-950/40">
              <input
                type="file"
                accept=".eml,.msg,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto" />
                <div className="text-xs font-bold text-slate-200">
                  {selectedFile ? selectedFile.name : "Click to browse or drag & drop .eml file"}
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "Preserves original bytes with dual SHA-256 / SHA-3-256 cryptographic hashing"}
                </div>
              </label>
            </div>
          )}

          {activeTab === "text" && (
            <textarea
              rows={8}
              placeholder="Paste raw RFC 822 email headers (e.g. From, Received, Subject, Authentication-Results, body)..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleSeedSamples}
            disabled={loading}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Reload All 4 Demo Incidents
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Close
            </button>
            {activeTab !== "samples" && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center gap-2"
              >
                {loading ? "Processing..." : "Preserve & Analyze Evidence"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

