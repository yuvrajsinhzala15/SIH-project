import React, { useEffect, useState } from "react";
import { Share2, Layers, RefreshCw, X, Network, Cpu } from "lucide-react";
import { api, AttackGraphData, GraphNode } from "../services/api";

export const AttackGraphView: React.FC = () => {
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getAttackGraph();
      setGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Futuristic threat intel node color mapping
  const getNodeColor = (type: string, risk?: string) => {
    if (type === "email") {
      if (risk === "CRITICAL" || risk === "HIGH") return "#EF4444";
      return "#10B981";
    }
    if (type === "ip") return "#37D7FF";
    if (type === "domain") return "#F59E0B";
    if (type === "sender") return "#8B5CF6";
    if (type === "attachment") return "#D946EF";
    return "#4D7CFF";
  };

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  // Generate deterministic coordinates for SVG canvas
  const nodeCoords = new Map<string, { x: number; y: number }>();
  const centerX = 400;
  const centerY = 240;
  const radius = 175;

  nodes.forEach((n, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle) + ((idx % 3) * 15 - 15);
    const y = centerY + radius * Math.sin(angle) + ((idx % 2) * 20 - 10);
    nodeCoords.set(n.id, { x, y });
  });

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[#37D7FF]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Cross-Incident Threat Graph & Campaign Correlation Matrix
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[rgba(55,215,255,0.1)] text-[#37D7FF] border border-[rgba(55,215,255,0.25)] font-mono font-bold">
              {nodes.length} ENTITIES • {edges.length} CORRELATIONS
            </span>
            <button
              onClick={fetchGraph}
              className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.1)] transition-all"
              title="Refresh Graph Topology"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs mb-3.5 p-3 bg-[rgba(5,7,13,0.55)] rounded-xl border border-[rgba(255,255,255,0.06)] font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
            <span className="text-slate-300">High-Risk Email</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
            <span className="text-slate-300">Benign Email</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#37D7FF] shadow-[0_0_8px_#37D7FF]" />
            <span className="text-slate-300">Observed Public IP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span className="text-slate-300">Target Domain</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
            <span className="text-slate-300">Sender Identity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D946EF] shadow-[0_0_8px_#D946EF]" />
            <span className="text-slate-300">Attachment Hash</span>
          </div>
        </div>

        {/* SVG Attack Graph Canvas */}
        <div className="w-full h-100 bg-[#05070D] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden relative flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
          {loading ? (
            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-[#37D7FF]" />
              Computing correlated threat topology...
            </div>
          ) : (
            <svg className="w-full h-full cursor-grab">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Edges */}
              {edges.map((e, idx) => {
                const src = nodeCoords.get(e.from);
                const dst = nodeCoords.get(e.to);
                if (!src || !dst) return null;
                return (
                  <g key={idx}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={dst.x}
                      y2={dst.y}
                      stroke="rgba(55, 215, 255, 0.25)"
                      strokeWidth="1.5"
                      strokeDasharray={e.type === "ROUTED_THROUGH" ? "4,4" : undefined}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((n) => {
                const coord = nodeCoords.get(n.id);
                if (!coord) return null;
                const color = getNodeColor(n.type, n.risk);
                const isSelected = selectedNode?.id === n.id;

                return (
                  <g
                    key={n.id}
                    transform={`translate(${coord.x}, ${coord.y})`}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedNode(n)}
                  >
                    <circle
                      r={isSelected ? 16 : 12}
                      fill={color}
                      stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.2)"}
                      strokeWidth={isSelected ? 3 : 1.5}
                      filter="url(#glow)"
                    />
                    <text
                      y={24}
                      textAnchor="middle"
                      fill="#CBD5E1"
                      fontSize="9"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="600"
                    >
                      {n.label.split("\n")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Selected Node Inspector Drawer */}
          {selectedNode && (
            <div className="absolute right-4 top-4 bottom-4 w-72 bg-[rgba(13,20,32,0.95)] backdrop-blur-2xl border border-[rgba(55,215,255,0.3)] rounded-xl p-4 shadow-2xl text-xs space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-2.5">
                <span className="font-mono font-bold uppercase text-xs text-white">// ENTITY INSPECTOR</span>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Entity Type</div>
                <div className="font-mono text-white capitalize text-sm font-semibold">{selectedNode.type}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Identifier / Value</div>
                <div className="font-mono text-[#37D7FF] break-all text-xs font-bold">{selectedNode.label}</div>
              </div>

              {selectedNode.asn && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">ASN Provider</div>
                  <div className="text-slate-300 text-xs">{selectedNode.asn}</div>
                </div>
              )}

              {selectedNode.risk && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Threat Classification</div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold mt-1 border ${
                    selectedNode.risk === "HIGH" || selectedNode.risk === "CRITICAL"
                      ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.4)]"
                      : "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.4)]"
                  }`}>
                    ● {selectedNode.risk}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Cluster Cards */}
      {graphData?.campaign_clusters && graphData.campaign_clusters.length > 0 && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-3.5 border-b border-[rgba(255,255,255,0.08)] pb-3">
            <Layers className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Correlated Campaign Clusters (Attacker Infrastructure Fingerprints)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {graphData.campaign_clusters.map((c, idx) => (
              <div key={idx} className="bg-[rgba(5,7,13,0.55)] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#8B5CF6]">{c.campaign_id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-slate-300 border border-[rgba(255,255,255,0.1)] font-mono">
                    Confidence: {(c.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{c.name}</div>
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-slate-500 font-mono text-[10px] uppercase">Correlated Signals: </span>
                  {c.reasons.join(" • ")}
                </div>
                <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  Linked Artifacts: {c.linked_emails.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

