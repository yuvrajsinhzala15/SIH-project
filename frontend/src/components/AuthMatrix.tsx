import React from "react";
import { KeyRound, ShieldCheck, ShieldX, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
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
        <span className="flex items-center gap-1 font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/80">
          <CheckCircle className="w-3.5 h-3.5" /> {val}
        </span>
      );
    }
    if (val === "FAIL" || val === "PERMERROR") {
      return (
        <span className="flex items-center gap-1 font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-700/80">
          <ShieldX className="w-3.5 h-3.5" /> {val}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-700/80">
        <ShieldAlert className="w-3.5 h-3.5" /> {val}
      </span>
    );
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Sender Identity Verification (SPF, DKIM, DMARC)
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Checks if the sending server was legally authorized to send email on behalf of the claimed domain.
          </p>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">
          Reported by: {auth?.reported_by || "Upstream Mail Gateway"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SPF Card */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-extrabold text-sm text-cyan-300">SPF</span>
              <span className="text-[10px] text-slate-400 block">Sender Policy Framework</span>
            </div>
            {getStatusBadge(auth?.spf_result)}
          </div>
          <p className="text-[11px] text-slate-400">
            {auth?.spf_result === "PASS"
              ? "The sending IP address is listed in the domain's authorized DNS list."
              : "The sending server IP is NOT authorized by DNS to send mail for this domain."}
          </p>
          <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800 truncate">
            Domain: {auth?.spf_domain || "Unavailable"}
          </div>
        </div>

        {/* DKIM Card */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-extrabold text-sm text-cyan-300">DKIM</span>
              <span className="text-[10px] text-slate-400 block">Digital Signature</span>
            </div>
            {getStatusBadge(auth?.dkim_result)}
          </div>
          <p className="text-[11px] text-slate-400">
            {auth?.dkim_result === "PASS"
              ? "Cryptographic public-key digital signature is valid and untampered."
              : "Signature verification failed or no digital signature was present."}
          </p>
          <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800 truncate">
            Signing Domain: {auth?.dkim_domain || "None"}
          </div>
        </div>

        {/* DMARC Card */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-extrabold text-sm text-cyan-300">DMARC</span>
              <span className="text-[10px] text-slate-400 block">Alignment & Policy</span>
            </div>
            {getStatusBadge(auth?.dmarc_result)}
          </div>
          <p className="text-[11px] text-slate-400">
            {auth?.dmarc_alignment === "FAIL"
              ? "Sender domain alignment failed. Sender address does not match authenticated domain."
              : "Sender address perfectly matches the authenticated organization."}
          </p>
          <div className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
            Alignment: <span className="text-white font-bold">{auth?.dmarc_alignment || "UNKNOWN"}</span>
          </div>
        </div>
      </div>

      {auth?.summary_explanation && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono">
          <span className="font-sans font-bold text-slate-400 uppercase text-[10px] block mb-1">
            Forensic Authentication Summary:
          </span>
          {auth.summary_explanation}
        </div>
      )}
    </div>
  );
};
