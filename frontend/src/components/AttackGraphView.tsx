import React, { useEffect, useState } from "react";
import { Share2, Network, ShieldAlert, Layers, RefreshCw, ZoomIn, Info } from "lucide-react";
import { api, AttackGraphData, GraphNode, GraphEdge } from "../services/api";

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

  // Compute 2D node layout positions in a circle/cluster layout
  const getNodeColor = (type: string, risk?: string) => {
    if (type === "email") {
      if (risk === "CRITICAL" || risk === "HIGH") return "#ef4444";
      return "#10b981";
    }
    if (type === "ip") return "#00f0ff";
    if (type === "domain") return "#f59e0b";
    if (type === "sender") return "#a855f7";
    if (type === "attachment") return "#f43f5e";
    return "#3b82f6";
  };

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  // Generate deterministic coordinates for SVG canvas
  const nodeCoords = new Map<string, { x: number; y: number }>();
  const centerX = 400;
  const centerY = 250;
  const radius = 180;

  nodes.forEach((n, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle) + ((idx % 3) * 15 - 15);
    const y = centerY + radius * Math.sin(angle) + ((idx % 2) * 20 - 10);
    nodeCoords.set(n.id, { x, y });
  });

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Cross-Email Threat Graph & Campaign Correlation (Section 31)
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
              {nodes.length} Entities &bull; {edges.length} Relationships
            </span>
            <button
              onClick={fetchGraph}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
              title="Refresh Graph"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs mb-4 p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-300">High-Risk Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Benign Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Observed Public IP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-slate-300">Domain</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <span className="text-slate-300">Sender Identity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-slate-300">Attachment Hash</span>
          </div>
        </div>

        {/* SVG Attack Graph Canvas */}
        <div className="w-full h-96 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative flex items-center justify-center">
          {loading ? (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              Computing NetworkX attack graph layout...
            </div>
          ) : (
            <svg className="w-full h-full cursor-grab">
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
                      stroke="#334155"
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
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedNode(n)}
                  >
                    <circle
                      r={isSelected ? 16 : 12}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="shadow-lg"
                      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                    />
                    <text
                      y={22}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
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
            <div className="absolute right-3 top-3 bottom-3 w-64 bg-slate-900/95 backdrop-blur border border-cyan-500/40 rounded-lg p-4 shadow-xl text-xs space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold uppercase text-cyan-400">Entity Details</span>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Type</div>
                <div className="font-mono text-white capitalize">{selectedNode.type}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Identifier / Label</div>
                <div className="font-mono text-cyan-300 break-all">{selectedNode.label}</div>
              </div>

              {selectedNode.asn && (
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">ASN Organization</div>
                  <div className="text-slate-300">{selectedNode.asn}</div>
                </div>
              )}

              {selectedNode.risk && (
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Threat Tier</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedNode.risk === "HIGH" || selectedNode.risk === "CRITICAL"
                      ? "bg-red-950 text-red-400 border border-red-800"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  }`}>
                    {selectedNode.risk}
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
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Correlated Campaign Clusters (Section 32)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {graphData.campaign_clusters.map((c, idx) => (
              <div key={idx} className="bg-slate-900/90 p-4 rounded-lg border border-purple-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-purple-300">{c.campaign_id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                    Confidence: {(c.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-200">{c.name}</div>
                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Shared Drivers: </span>
                  {c.reasons.join(" &bull; ")}
                </div>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
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
