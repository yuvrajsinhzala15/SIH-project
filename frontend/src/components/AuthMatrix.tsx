import React from "react";
import { KeyRound, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { AuthDetails } from "../services/api";

interface AuthMatrixProps {
  auth: AuthDetails;
  fromAddr?: string;
  returnPath?: string;
  replyTo?: string;
}

export const AuthMatrix: React.FC<AuthMatrixProps> = ({ auth }) => {
  const getStatusBadge = (res: string) => {
    const val = (res || "UNKNOWN").toUpperCase();
    if (val === "PASS" || val === "STRICT_PASS" || val === "RELAXED_PASS") {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[rgba(16,185,129,0.4)] shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          <CheckCircle2 className="w-3.5 h-3.5" /> {val}
        </span>
      );
    }
    if (val === "FAIL" || val === "PERMERROR") {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.45)] shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
          <XCircle className="w-3.5 h-3.5" /> {val}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.4)] shadow-[0_0_12px_rgba(245,158,11,0.2)]">
        <AlertTriangle className="w-3.5 h-3.5" /> {val}
      </span>
    );
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#37D7FF]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Cryptographic Sender Authentication Matrix
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time validation against DNS authoritative TXT, SPF, DKIM public keys & DMARC alignment.
          </p>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)] text-slate-300 border border-[rgba(255,255,255,0.1)] font-mono">
          MTA Gateway: {auth?.reported_by || "Upstream Receiver"}
        </span>
      </div>

      {/* 3 Protocol Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* SPF Card */}
        <div className={`p-4 rounded-xl border transition-all ${auth?.spf_result === "PASS" ? "bg-[rgba(16,185,129,0.04)] border-[rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.4)]" : "bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.2)] hover:border-[rgba(239,68,68,0.4)]"}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono font-black text-sm text-white">SPF</span>
              <span className="text-[10px] text-slate-400 block font-medium">Sender Policy Framework</span>
            </div>
            {getStatusBadge(auth?.spf_result)}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
            {auth?.spf_result === "PASS"
              ? "Relaying server IP address is explicitly designated in authoritative DNS."
              : "Originating IP is not authorized in sender domain's SPF record."}
          </p>
          <div className="mt-3 text-[11px] text-slate-200 font-mono bg-[rgba(5,7,13,0.6)] p-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] truncate">
            <span className="text-slate-500 font-bold">Domain: </span>{auth?.spf_domain || "Unavailable"}
          </div>
        </div>

        {/* DKIM Card */}
        <div className={`p-4 rounded-xl border transition-all ${auth?.dkim_result === "PASS" ? "bg-[rgba(16,185,129,0.04)] border-[rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.4)]" : "bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.2)] hover:border-[rgba(239,68,68,0.4)]"}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono font-black text-sm text-white">DKIM</span>
              <span className="text-[10px] text-slate-400 block font-medium">Cryptographic Signature</span>
            </div>
            {getStatusBadge(auth?.dkim_result)}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
            {auth?.dkim_result === "PASS"
              ? "Cryptographic signature verified with public key; body untouched."
              : "Digital signature missing or failed cryptographic hash verification."}
          </p>
          <div className="mt-3 text-[11px] text-slate-200 font-mono bg-[rgba(5,7,13,0.6)] p-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] truncate">
            <span className="text-slate-500 font-bold">Signer: </span>{auth?.dkim_domain || "None"}
          </div>
        </div>

        {/* DMARC Card */}
        <div className={`p-4 rounded-xl border transition-all ${auth?.dmarc_result === "PASS" ? "bg-[rgba(16,185,129,0.04)] border-[rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.4)]" : "bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.2)] hover:border-[rgba(239,68,68,0.4)]"}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono font-black text-sm text-white">DMARC</span>
              <span className="text-[10px] text-slate-400 block font-medium">Domain Alignment Policy</span>
            </div>
            {getStatusBadge(auth?.dmarc_result)}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
            {auth?.dmarc_alignment === "FAIL"
              ? "From header domain fails strict alignment with authenticated SPF/DKIM."
              : "Strict identifier alignment confirmed between From and signing identities."}
          </p>
          <div className="mt-3 text-[11px] text-slate-200 font-mono bg-[rgba(5,7,13,0.6)] p-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <span className="text-slate-500 font-bold">Alignment:</span>
            <span className={auth?.dmarc_alignment === "FAIL" ? "text-[#EF4444] font-extrabold" : "text-[#10B981] font-extrabold"}>
              {auth?.dmarc_alignment || "UNKNOWN"}
            </span>
          </div>
        </div>
      </div>

      {auth?.summary_explanation && (
        <div className="p-3.5 rounded-xl bg-[rgba(5,7,13,0.7)] border border-[rgba(255,255,255,0.06)] text-xs text-slate-300 leading-relaxed font-mono">
          <span className="font-mono font-bold text-[#37D7FF] uppercase text-[10px] block mb-1">
            // AUTHENTICATION FORENSIC SYNTHESIS:
          </span>
          {auth.summary_explanation}
        </div>
      )}
    </div>
  );
};

