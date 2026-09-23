import React, { useState, useEffect } from "react";
import { FolderGit2, Plus, Trash2, MessageSquare, X, ShieldAlert, ArrowRight, User, Clock } from "lucide-react";
import { api, CaseRecord, CaseDetail } from "../services/api";

interface CaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvidence?: (evidenceId: string) => void;
}

export const CaseManagerModal: React.FC<CaseManagerModalProps> = ({ isOpen, onClose, onSelectEvidence }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState("HIGH");
  const [newAnalyst, setNewAnalyst] = useState("Senior SOC Analyst");
  const [newSummary, setNewSummary] = useState("");
  const [newNote, setNewNote] = useState("");

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases();
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        loadCaseDetail(data[0].case_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetail = async (caseId: string) => {
    try {
      const data = await api.getCaseDetail(caseId);
      setSelectedCase(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCases();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createCase({
        title: newTitle,
        severity: newSeverity,
        assigned_analyst: newAnalyst,
        summary: newSummary,
      });
      setIsCreating(false);
      setNewTitle("");
      setNewSummary("");
      fetchCases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (caseId: string, status: string) => {
    try {
      await api.updateCase(caseId, { status });
      fetchCases();
      if (selectedCase) {
        setSelectedCase({ ...selectedCase, status });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!window.confirm(`Are you sure you want to delete case ${caseId}?`)) return;
    try {
      await api.deleteCase(caseId);
      setSelectedCase(null);
      fetchCases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !newNote.trim()) return;
    try {
      await api.addCaseNote(selectedCase.case_id, "Analyst", newNote);
      setNewNote("");
      loadCaseDetail(selectedCase.case_id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl glass-panel-elevated rounded-2xl border border-cyan-500/25 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(55,215,255,0.15)] overflow-hidden flex flex-col h-[640px]">
        {/* Header */}
        <div className="bg-[#0c1322]/90 px-5 py-4 border-b border-cyan-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_15px_rgba(55,215,255,0.2)]">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>SOC Incident Dossiers & Case Docket</span>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  CHAIN OF CUSTODY
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Multi-analyst evidence linking, threat hypothesis records, and SOC containment tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white border border-slate-700/50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Left: Case List Sidebar */}
          <div className="border-r border-cyan-500/15 p-4 space-y-3 overflow-y-auto bg-[#080d17]/80">
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 tracking-wider">
                Dockets ({cases.length})
              </span>
              <button
                onClick={() => setIsCreating(true)}
                className="text-[10px] font-mono text-cyan-300 hover:text-white font-semibold flex items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>New Docket</span>
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateCase} className="glass-panel p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5 text-xs">
                <div className="font-semibold text-xs text-white flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Initiate Case Docket</span>
                </div>
                <input
                  type="text"
                  placeholder="Case Title (e.g. Executive Impersonation)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#060a12] border border-cyan-500/25 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-[#060a12] border border-cyan-500/25 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                >
                  <option value="CRITICAL">Severity: CRITICAL</option>
                  <option value="HIGH">Severity: HIGH</option>
                  <option value="MEDIUM">Severity: MEDIUM</option>
                  <option value="LOW">Severity: LOW</option>
                </select>
                <textarea
                  placeholder="Investigation summary & hypothesis..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={2}
                  className="w-full bg-[#060a12] border border-cyan-500/25 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <div className="flex justify-end gap-2 pt-1 font-mono">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-3 py-1 rounded-lg text-[11px] font-bold shadow-[0_0_15px_rgba(55,215,255,0.3)]"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {cases.map((c) => {
                const isSelected = selectedCase?.case_id === c.case_id;
                return (
                  <div
                    key={c.case_id}
                    onClick={() => loadCaseDetail(c.case_id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_20px_rgba(55,215,255,0.15)]"
                        : "bg-[#0c1322]/60 hover:bg-[#0c1322]/90 border-slate-800/80 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300">{c.case_id}</span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        c.severity === "CRITICAL" ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                        c.severity === "HIGH" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                      }`}>
                        {c.severity}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-200 line-clamp-1">{c.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="capitalize text-slate-400">{c.status}</span>
                      <span className="text-cyan-400/80">{c.evidence_count} Evidence Records</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Case Dossier Details & Notes */}
          <div className="col-span-2 p-5 overflow-y-auto space-y-4 bg-[#0a0f1d]/90">
            {selectedCase ? (
              <>
                <div className="flex items-start justify-between border-b border-cyan-500/15 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-cyan-400">{selectedCase.case_id}</span>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-semibold uppercase">
                        {selectedCase.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {selectedCase.assigned_analyst}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5">{selectedCase.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedCase.summary || "No investigation summary provided."}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteCase(selectedCase.case_id)}
                    className="text-slate-500 hover:text-red-400 p-2 rounded-lg bg-slate-800/40 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/30 transition-colors"
                    title="Delete Case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Switcher Bar */}
                <div className="flex items-center gap-2 bg-[#060a12]/80 p-2 rounded-xl border border-cyan-500/20 text-xs">
                  <span className="text-slate-400 text-[10px] font-mono uppercase px-1.5 font-bold">Investigation Lifecycle:</span>
                  {["OPEN", "INVESTIGATING", "ESCALATED", "CLOSED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedCase.case_id, st)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                        selectedCase.status === st
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(55,215,255,0.25)]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Linked Evidence Section */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase text-cyan-400 tracking-wider mb-2">
                    Linked Evidence Records ({selectedCase.evidence.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedCase.evidence.map((ev) => (
                      <div
                        key={ev.evidence_id}
                        onClick={() => {
                          if (onSelectEvidence) {
                            onSelectEvidence(ev.evidence_id);
                            onClose();
                          }
                        }}
                        className="p-2.5 bg-[#0d1525]/80 rounded-xl border border-cyan-500/15 flex items-center justify-between text-xs hover:border-cyan-400/50 hover:bg-cyan-950/20 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-cyan-400 text-xs">{ev.evidence_id}</span>
                          <span className="text-slate-200 truncate max-w-sm text-[11px] font-medium">{ev.filename}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {ev.risk} ({ev.score})
                          </span>
                          <ArrowRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analyst Notes Deliberation Feed */}
                <div className="space-y-3 pt-3 border-t border-cyan-500/15">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Analyst Deliberation Log ({selectedCase.notes.length})</span>
                  </h4>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedCase.notes.map((n, idx) => (
                      <div key={idx} className="bg-[#070b14] p-2.5 rounded-xl border border-cyan-500/15 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="text-purple-300 font-bold flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {n.author}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{n.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add investigation deliberation or containment action note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      className="flex-1 bg-[#070b14] border border-cyan-500/25 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                      onClick={handleAddNote}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs font-mono transition-all shadow-[0_0_15px_rgba(55,215,255,0.25)]"
                    >
                      Post Note
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 py-20 text-xs font-mono space-y-2">
                <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-slate-400">Select an investigation docket on the left</div>
                <div className="text-[11px] text-slate-600">or initialize a new case to review forensic chain-of-custody notes.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
