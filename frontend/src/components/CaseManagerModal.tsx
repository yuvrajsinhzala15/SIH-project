import React, { useState, useEffect } from "react";
import { FolderGit2, Plus, Trash2, Edit3, MessageSquare, Check, X, ShieldAlert, AlertTriangle } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                SOC Investigation Cases & Incident Management
              </h2>
              <p className="text-[11px] text-slate-400">Track, annotate, and manage active threat cases</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Left: Case List */}
          <div className="border-r border-slate-800 p-4 space-y-3 overflow-y-auto bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Cases ({cases.length})</span>
              <button
                onClick={() => setIsCreating(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                New Case
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateCase} className="bg-slate-900 p-3 rounded-xl border border-cyan-800 space-y-2 text-xs">
                <div className="font-bold text-cyan-300">Create Investigation Case</div>
                <input
                  type="text"
                  placeholder="Case Title (e.g. Executive Impersonation)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"
                  required
                />
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"
                >
                  <option value="CRITICAL">Severity: CRITICAL</option>
                  <option value="HIGH">Severity: HIGH</option>
                  <option value="MEDIUM">Severity: MEDIUM</option>
                  <option value="LOW">Severity: LOW</option>
                </select>
                <textarea
                  placeholder="Brief summary..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded font-bold"
                  >
                    Save Case
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
                        ? "bg-cyan-950/60 border-cyan-500 shadow"
                        : "bg-slate-900/60 hover:bg-slate-900 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300">{c.case_id}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                        c.severity === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-800" :
                        c.severity === "HIGH" ? "bg-orange-950 text-orange-400 border border-orange-800" :
                        "bg-yellow-950 text-yellow-400 border border-yellow-800"
                      }`}>
                        {c.severity}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">{c.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize text-slate-300 font-semibold">{c.status}</span>
                      <span>{c.evidence_count} Artifacts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Case Details & Notes */}
          <div className="col-span-2 p-5 overflow-y-auto space-y-4">
            {selectedCase ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-cyan-400">{selectedCase.case_id}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                        {selectedCase.status}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-1">{selectedCase.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{selectedCase.summary || "No summary provided."}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteCase(selectedCase.case_id)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-950/40 border border-red-900/60"
                    title="Delete Case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[11px] font-bold">Status:</span>
                  {["OPEN", "INVESTIGATING", "ESCALATED", "CLOSED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedCase.case_id, st)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                        selectedCase.status === st
                          ? "bg-cyan-600 text-white"
                          : "text-slate-400 hover:text-slate-200 bg-slate-900"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Linked Evidence */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Linked Evidence Records ({selectedCase.evidence.length})</h4>
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
                        className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs hover:border-cyan-500 cursor-pointer"
                      >
                        <span className="font-mono font-bold text-cyan-300">{ev.evidence_id}</span>
                        <span className="text-slate-300 truncate max-w-xs">{ev.filename}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                          {ev.risk} ({ev.score})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analyst Notes */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    Analyst Notes ({selectedCase.notes.length})
                  </h4>

                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedCase.notes.map((n, idx) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span className="text-purple-400 font-bold">{n.author}</span>
                          <span>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{n.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add investigation note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      onClick={handleAddNote}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-bold"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 py-16 text-xs">
                Select a case on the left or create a new case to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
