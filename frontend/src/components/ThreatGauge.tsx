import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, Zap } from "lucide-react";
import { ThreatScore, AiThreatIntel } from "../services/api";

interface ThreatGaugeProps {
  score: ThreatScore;
  aiIntel: AiThreatIntel;
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({ score, aiIntel }) => {
  const finalScore = score?.final_score ?? 0;
  const riskLevel = score?.risk_level ?? "LOW";

  // Arc calculation for SVG circular HUD
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalScore / 100) * circumference;

  // Semantic styling configurations
  const getRiskStyle = () => {
    if (finalScore >= 90) {
      return {
        badge: "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.4)] shadow-[0_0_15px_rgba(239,68,68,0.25)]",
        stroke: "url(#criticalGrad)",
        glow: "shadow-[0_0_35px_rgba(239,68,68,0.25)]",
        label: "CRITICAL THREAT",
        textColor: "text-[#EF4444]"
      };
    }
    if (finalScore >= 70) {
      return {
        badge: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.4)] shadow-[0_0_15px_rgba(245,158,11,0.25)]",
        stroke: "url(#highGrad)",
        glow: "shadow-[0_0_35px_rgba(245,158,11,0.2)]",
        label: "HIGH RISK",
        textColor: "text-[#F59E0B]"
      };
    }
    if (finalScore >= 30) {
      return {
        badge: "bg-[rgba(55,215,255,0.15)] text-[#37D7FF] border-[rgba(55,215,255,0.4)] shadow-[0_0_15px_rgba(55,215,255,0.25)]",
        stroke: "url(#medGrad)",
        glow: "shadow-[0_0_35px_rgba(55,215,255,0.15)]",
        label: "SUSPICIOUS",
        textColor: "text-[#37D7FF]"
      };
    }
    return {
      badge: "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.4)] shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      stroke: "url(#cleanGrad)",
      glow: "shadow-[0_0_35px_rgba(16,185,129,0.15)]",
      label: "BENIGN / VERIFIED",
      textColor: "text-[#10B981]"
    };
  };

  const style = getRiskStyle();
  const authScore = score?.component_scores?.authentication_risk ?? 0;
  const domainScore = score?.component_scores?.impersonation_risk ?? 0;
  const nlpScore = score?.component_scores?.nlp_intent_risk ?? 0;

  return (
    <div className={`glass-panel p-5 flex flex-col justify-between h-full space-y-4 ${style.glow}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#37D7FF]" />
          <span>ADVERSARIAL RISK HUD</span>
        </span>
        <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${style.badge}`}>
          ● {style.label}
        </span>
      </div>

      {/* Futuristic Radial HUD Gauge & Classification */}
      <div className="flex items-center gap-4 bg-[rgba(5,7,13,0.55)] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)]">
        {/* Circular SVG Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <defs>
              <linearGradient id="criticalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="highGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D946EF" />
              </linearGradient>
              <linearGradient id="medGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#37D7FF" />
                <stop offset="100%" stopColor="#4D7CFF" />
              </linearGradient>
              <linearGradient id="cleanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#37D7FF" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Active Glow Bar */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={style.stroke}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered Numerical Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-2xl font-mono font-black tracking-tight ${style.textColor}`}>
              {finalScore}
            </span>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest -mt-1">
              SCORE
            </span>
          </div>
        </div>

        {/* Classification Info */}
        <div className="space-y-1 min-w-0">
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-400">
            AI Classification
          </div>
          <div className="text-xs font-bold text-white truncate" title={aiIntel?.classification}>
            {aiIntel?.classification || "Analyzing telemetry..."}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Confidence: <span className="text-[#37D7FF] font-semibold">{((aiIntel?.confidence ?? 0.85) * 100).toFixed(0)}%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 truncate">
            Urgency: <span className="text-slate-300 uppercase">{aiIntel?.urgency_level || "LOW"}</span>
          </div>
        </div>
      </div>

      {/* Threat Spectrum Continuum Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
          <span>LOW</span>
          <span>MEDIUM</span>
          <span>HIGH</span>
          <span>CRITICAL</span>
        </div>
        <div className="relative h-2 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden p-0.5 border border-[rgba(255,255,255,0.1)]">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[#10B981] via-[#37D7FF] via-[#F59E0B] to-[#EF4444] opacity-80" />
          {/* Slider Pointer */}
          <div 
            className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_10px_white] -translate-x-1/2 transition-all duration-700"
            style={{ left: `${Math.min(98, Math.max(2, finalScore))}%` }}
          />
        </div>
      </div>

      {/* Forensic Vector Breakdown */}
      <div className="space-y-2.5 pt-1">
        <div className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
          Forensic Vector Breakdown
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
              <span className="text-slate-400">Authentication Risk</span>
              <span className="text-white font-semibold">{authScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${authScore >= 60 ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-[#37D7FF]"}`}
                style={{ width: `${Math.min(100, Math.max(2, authScore))}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
              <span className="text-slate-400">Domain Lookalike / Impersonation</span>
              <span className="text-white font-semibold">{domainScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${domainScore >= 60 ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-[#8B5CF6]"}`}
                style={{ width: `${Math.min(100, Math.max(2, domainScore))}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1 font-mono">
              <span className="text-slate-400">NLP Intent & Urgency Signals</span>
              <span className="text-white font-semibold">{nlpScore} / 100</span>
            </div>
            <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${nlpScore >= 60 ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-[#D946EF]"}`}
                style={{ width: `${Math.min(100, Math.max(2, nlpScore))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

