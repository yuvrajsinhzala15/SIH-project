import React from "react";
import { ShieldAlert, ShieldCheck, AlertOctagon, HelpCircle, Info } from "lucide-react";
import { ThreatScore, AiThreatIntel } from "../services/api";

interface ThreatGaugeProps {
  score: ThreatScore;
  aiIntel: AiThreatIntel;
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({ score, aiIntel }) => {
  const finalScore = score?.final_score ?? 0;
  const riskLevel = score?.risk_level ?? "LOW";

  // Color mappings
  const getColor = () => {
    if (finalScore >= 90) return { stroke: "#ef4444", text: "text-red-400", bg: "bg-red-950/60", border: "border-red-600/70", label: "CRITICAL THREAT" };
    if (finalScore >= 70) return { stroke: "#f97316", text: "text-orange-400", bg: "bg-orange-950/60", border: "border-orange-600/70", label: "HIGH RISK" };
    if (finalScore >= 30) return { stroke: "#eab308", text: "text-yellow-400", bg: "bg-yellow-950/60", border: "border-yellow-600/70", label: "SUSPICIOUS" };
    return { stroke: "#10b981", text: "text-emerald-400", bg: "bg-emerald-950/60", border: "border-emerald-600/70", label: "CLEAN / BENIGN" };
  };

  const colors = getColor();
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalScore / 100) * circumference;

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full space-y-4">
      {/* Card Header with Tooltip */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Composite Threat Score
          </span>
          <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
            {colors.label}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Calculated by combining Authentication, AI Intent, Domain Impersonation, and Infrastructure signals.
        </p>
      </div>

      <div className="flex items-center justify-around gap-3 my-1">
        {/* SVG Circular Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-black ${colors.text} tracking-tighter leading-none`}>{finalScore}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">/ 100 Score</span>
          </div>
        </div>

        {/* Classification Summary Card */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">AI Threat Classification</div>
            <div className="text-sm font-extrabold text-cyan-300">{aiIntel?.classification || "Unknown"}</div>
            <div className="text-[11px] text-slate-400">
              Confidence: <span className="font-bold text-white">{(aiIntel?.confidence ?? 0.85) * 100}%</span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-200">Urgency:</strong> {aiIntel?.urgency_level || "LOW"} pressure detected in body.
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Sub-metrics */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-[11px] bg-slate-950/40 p-2.5 rounded-lg">
        <div>
          <span className="text-slate-400 text-[10px] block">Auth Inconsistency:</span>
          <span className="font-mono font-bold text-slate-200">{score?.component_scores?.authentication_risk ?? 0}/100</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Domain Spoofing:</span>
          <span className="font-mono font-bold text-slate-200">{score?.component_scores?.impersonation_risk ?? 0}/100</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">NLP Intent Risk:</span>
          <span className="font-mono font-bold text-slate-200">{score?.component_scores?.nlp_intent_risk ?? 0}/100</span>
        </div>
      </div>
    </div>
  );
};
