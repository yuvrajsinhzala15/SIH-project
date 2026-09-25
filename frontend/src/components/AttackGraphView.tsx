import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Share2, Layers, RefreshCw, X, Network, ZoomIn, ZoomOut,
  Maximize2, Search, Filter, ShieldAlert, ArrowRight, ExternalLink, Globe, HardDrive
} from "lucide-react";
import { api, AttackGraphData, GraphNode, GraphEdge } from "../services/api";

interface AttackGraphViewProps {
  onSelectEvidence?: (evidenceId: string) => void;
}

export const AttackGraphView: React.FC<AttackGraphViewProps> = ({ onSelectEvidence }) => {
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);

  const fetchGraph = async (campaignId: string = selectedCampaign) => {
    setLoading(true);
    try {
      const data = await api.getAttackGraph(campaignId);
      setGraphData(data);
      // Reset selected node if it's no longer in the graph
      if (selectedNode && !data.nodes.some((n) => n.id === selectedNode.id)) {
        setSelectedNode(null);
      }
    } catch (err) {
      console.error("Failed to load attack graph:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph(selectedCampaign);
  }, [selectedCampaign]);

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * factor)));
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    handleZoom(factor);
  };

  // Node color mapping
  const getNodeColor = (type: string, risk?: string) => {
    if (type === "campaign") return "#6366F1"; // Indigo
    if (type === "email") {
      if (risk === "CRITICAL" || risk === "HIGH") return "#EF4444"; // Red
      if (risk === "MEDIUM") return "#F97316"; // Orange
      return "#10B981"; // Emerald
    }
    if (type === "ip") return "#37D7FF"; // Cyan
    if (type === "domain") return "#F59E0B"; // Amber
    if (type === "sender") return "#8B5CF6"; // Purple
    if (type === "url") return "#EC4899"; // Pink
    if (type === "attachment") return "#D946EF"; // Fuchsia
    if (type === "infrastructure") return "#FB923C"; // Orange
    return "#3B82F6";
  };

  const nodes = useMemo(() => graphData?.nodes || [], [graphData]);
  const edges = useMemo(() => graphData?.edges || [], [graphData]);

  // Robust Non-Overlapping Layout Calculation
  const nodeCoords = useMemo(() => {
    const coords = new Map<string, { x: number; y: number }>();
    if (nodes.length === 0) return coords;

    const width = 860;
    const height = 520;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group nodes by type for structured hierarchical concentric layout
    const campaignNodes = nodes.filter((n) => n.type === "campaign");
    const emailNodes = nodes.filter((n) => n.type === "email");
    const domainNodes = nodes.filter((n) => n.type === "domain");
    const ipNodes = nodes.filter((n) => n.type === "ip");
    const urlNodes = nodes.filter((n) => n.type === "url");
    const otherNodes = nodes.filter(
      (n) => !["campaign", "email", "domain", "ip", "url"].includes(n.type)
    );

    // Place Campaign nodes along top center
    campaignNodes.forEach((n, idx) => {
      const step = width / (campaignNodes.length + 1);
      coords.set(n.id, { x: step * (idx + 1), y: 70 });
    });

    // Place Email nodes in the central ring or tier
    const emailCount = Math.max(1, emailNodes.length);
    const emailRadius = emailCount === 1 ? 0 : Math.min(180, 50 + emailCount * 30);
    emailNodes.forEach((n, idx) => {
      if (emailCount === 1) {
        coords.set(n.id, { x: centerX, y: centerY - 20 });
      } else {
        const angle = (idx / emailCount) * 2 * Math.PI - Math.PI / 2;
        coords.set(n.id, {
          x: centerX + emailRadius * Math.cos(angle),
          y: centerY + emailRadius * Math.sin(angle)
        });
      }
    });

    // Place Peripheral nodes (domains, IPs, URLs, senders, attachments) in outer orbits
    const peripheralNodes = [...domainNodes, ...ipNodes, ...urlNodes, ...otherNodes];
    const pCount = Math.max(1, peripheralNodes.length);
    const outerRadiusX = 350;
    const outerRadiusY = 210;

    peripheralNodes.forEach((n, idx) => {
      const angle = (idx / pCount) * 2 * Math.PI;
      // Stagger radius slightly to prevent collision on dense graphs
      const radiusJitter = (idx % 2 === 0 ? 0 : 35);
      const x = centerX + (outerRadiusX + radiusJitter) * Math.cos(angle);
      const y = centerY + (outerRadiusY + radiusJitter) * Math.sin(angle);
      coords.set(n.id, { x, y });
    });

    return coords;
  }, [nodes]);

  // Connected neighbors of selected node
  const selectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    const neighborIds = new Set<string>();
    edges.forEach((e) => {
      if (e.from === selectedNode.id) neighborIds.add(e.to);
      if (e.to === selectedNode.id) neighborIds.add(e.from);
    });
    return nodes.filter((n) => neighborIds.has(n.id));
  }, [selectedNode, edges, nodes]);

  // Filtered nodes by search query
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      nodes
        .filter((n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q))
        .map((n) => n.id)
    );
  }, [nodes, searchQuery]);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.25)]">
              <Network className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Adversarial Campaign Graph & Entity Correlation</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-[#37D7FF] border border-cyan-500/30 font-mono font-bold">
                  MULTI-HOP TOPOLOGY
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Visualizing interconnected infrastructure, senders, domains, and IOC clusters across cases.
              </p>
            </div>
          </div>

          {/* Controls: Campaign Selector, Search, Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Campaign Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[rgba(5,7,13,0.7)] px-2.5 py-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <select
                value={selectedCampaign}
                onChange={(e) => handleCampaignChange(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL" className="bg-[#0c1322] text-white">All Campaigns & Clusters</option>
                {graphData?.campaign_clusters.map((c) => (
                  <option key={c.campaign_id} value={c.campaign_id} className="bg-[#0c1322] text-white">
                    {c.campaign_id} ({c.name})
                  </option>
                ))}
                <option value="CASE-2026-0001" className="bg-[#0c1322] text-white">CASE-2026-0001 (Project Titan BEC)</option>
                <option value="CASE-2026-0002" className="bg-[#0c1322] text-white">CASE-2026-0002 (Office 365 Phishing)</option>
              </select>
            </div>

            {/* Quick Search IOC / Node */}
            <div className="flex items-center gap-1.5 bg-[rgba(5,7,13,0.7)] px-2.5 py-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-xs font-mono">
              <Search className="w-3.5 h-3.5 text-[#37D7FF]" />
              <input
                type="text"
                placeholder="Find node / IP / domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none w-36 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Metrics Badge */}
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[rgba(55,215,255,0.1)] text-[#37D7FF] border border-[rgba(55,215,255,0.25)] font-mono font-bold">
              {nodes.length} ENTITIES • {edges.length} EDGES
            </span>

            {/* Refresh */}
            <button
              onClick={() => fetchGraph(selectedCampaign)}
              className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.1)] transition-all"
              title="Refresh Graph Topology"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs mb-3.5 p-3 bg-[rgba(5,7,13,0.55)] rounded-xl border border-[rgba(255,255,255,0.06)] font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1] shadow-[0_0_8px_#6366F1]" />
            <span className="text-slate-300">Campaign / Case</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
            <span className="text-slate-300">High-Risk Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
            <span className="text-slate-300">Benign Email</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#37D7FF] shadow-[0_0_8px_#37D7FF]" />
            <span className="text-slate-300">Observed Public IP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span className="text-slate-300">Target Domain</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
            <span className="text-slate-300">Sender Identity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899]" />
            <span className="text-slate-300">Suspicious URL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D946EF] shadow-[0_0_8px_#D946EF]" />
            <span className="text-slate-300">Attachment Hash</span>
          </div>
        </div>

        {/* SVG Attack Graph Canvas Container */}
        <div className="w-full h-120 bg-[#05070D] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden relative flex items-center justify-center shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] select-none">
          
          {/* Zoom & Pan Overlay Toolbar */}
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 bg-[rgba(13,20,32,0.9)] backdrop-blur-md p-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] shadow-xl font-mono text-xs">
            <button
              onClick={() => handleZoom(1.2)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <span className="text-[9px] text-center text-slate-500 font-bold pt-1 border-t border-white/10">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 flex items-center gap-2.5 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-[#37D7FF]" />
              Computing correlated adversarial topology...
            </div>
          ) : nodes.length === 0 ? (
            /* Empty State for Campaign */
            <div className="text-center p-8 space-y-3 font-mono">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                No Relationship Data Available
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No relationship data available for this campaign. Select another campaign or view the global threat topology.
              </p>
              <button
                onClick={() => handleCampaignChange("ALL")}
                className="inline-flex items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-[#37D7FF] border border-cyan-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                <span>View All Campaigns</span>
              </button>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(55, 215, 255, 0.4)" />
                </marker>
              </defs>

              {/* Pan & Zoom Transform Layer */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* Edges */}
                {edges.map((e, idx) => {
                  const src = nodeCoords.get(e.from);
                  const dst = nodeCoords.get(e.to);
                  if (!src || !dst) return null;

                  const isHighlighted =
                    selectedNode && (e.from === selectedNode.id || e.to === selectedNode.id);

                  let strokeColor = "rgba(55, 215, 255, 0.25)";
                  let strokeDash = undefined;

                  if (e.type === "ROUTED_THROUGH") strokeDash = "4,4";
                  if (e.type === "SENT_FROM") strokeColor = "rgba(139, 92, 246, 0.4)";
                  if (e.type === "USES_DOMAIN") strokeColor = "rgba(245, 158, 11, 0.4)";
                  if (e.type === "CONTAINS_URL") strokeColor = "rgba(236, 72, 153, 0.4)";
                  if (e.type === "CONTAINS_INCIDENT") strokeColor = "rgba(99, 102, 241, 0.5)";

                  if (isHighlighted) {
                    strokeColor = "#37D7FF";
                  }

                  return (
                    <g key={idx}>
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={dst.x}
                        y2={dst.y}
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 2.5 : 1.5}
                        strokeDasharray={strokeDash}
                        markerEnd="url(#arrow)"
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
                  const isMatch = matchingNodeIds ? matchingNodeIds.has(n.id) : false;

                  const radius = isSelected ? 16 : n.type === "campaign" ? 15 : 12;

                  return (
                    <g
                      key={n.id}
                      transform={`translate(${coord.x}, ${coord.y})`}
                      className="cursor-pointer transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(n);
                      }}
                    >
                      {/* Search Match Halo */}
                      {isMatch && (
                        <circle
                          r={radius + 8}
                          fill="none"
                          stroke="#37D7FF"
                          strokeWidth="2"
                          strokeDasharray="3,3"
                          className="animate-spin"
                          style={{ animationDuration: "6s" }}
                        />
                      )}

                      <circle
                        r={radius}
                        fill={color}
                        stroke={isSelected ? "#ffffff" : isMatch ? "#37D7FF" : "rgba(255,255,255,0.25)"}
                        strokeWidth={isSelected ? 3 : 1.5}
                        filter="url(#glow)"
                      />
                      
                      {/* Node Label */}
                      <text
                        y={radius + 12}
                        textAnchor="middle"
                        fill={isSelected ? "#ffffff" : "#CBD5E1"}
                        fontSize="9"
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight={isSelected ? "700" : "600"}
                      >
                        {n.label.split("\n")[0]}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Selected Node Inspector Drawer */}
          {selectedNode && (
            <div className="absolute right-4 top-4 bottom-4 w-80 bg-[rgba(13,20,32,0.96)] backdrop-blur-2xl border border-[rgba(55,215,255,0.35)] rounded-2xl p-4 shadow-2xl text-xs space-y-3.5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-2.5">
                <span className="font-mono font-bold uppercase text-xs text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#37D7FF]" />
                  <span>// ENTITY INSPECTOR</span>
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Entity Type</div>
                <div className="font-mono text-white capitalize text-sm font-semibold flex items-center gap-2 mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getNodeColor(selectedNode.type, selectedNode.risk) }}
                  />
                  <span>{selectedNode.type}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Identifier / Value</div>
                <div className="font-mono text-[#37D7FF] break-all text-xs font-bold bg-slate-900/60 p-2 rounded-lg border border-white/5 mt-0.5">
                  {selectedNode.label}
                </div>
              </div>

              {selectedNode.asn && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">ASN Infrastructure</div>
                  <div className="text-slate-300 text-xs font-mono">{selectedNode.asn}</div>
                </div>
              )}

              {selectedNode.url && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Original URL</div>
                  <div className="text-slate-300 text-xs font-mono break-all">{selectedNode.url}</div>
                </div>
              )}

              {selectedNode.risk && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono font-bold">Threat Classification</div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold mt-1 border ${
                      selectedNode.risk === "HIGH" || selectedNode.risk === "CRITICAL"
                        ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.4)]"
                        : "bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.4)]"
                    }`}
                  >
                    ● {selectedNode.risk}
                  </span>
                </div>
              )}

              {/* Connected Relationships */}
              {selectedNeighbors.length > 0 && (
                <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1.5">
                    Connected Relationships ({selectedNeighbors.length})
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedNeighbors.map((nb) => (
                      <div
                        key={nb.id}
                        onClick={() => setSelectedNode(nb)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 cursor-pointer text-[11px] font-mono transition-colors"
                      >
                        <span className="text-slate-300 truncate max-w-44">{nb.label.split("\n")[0]}</span>
                        <span className="text-[9px] text-[#37D7FF] uppercase">{nb.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If node is an Email or linked to evidence, provide Inspect button */}
              {(selectedNode.evidence_id || selectedNode.type === "email") && onSelectEvidence && (
                <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
                  <button
                    onClick={() => {
                      const evId = selectedNode.evidence_id || selectedNode.id.replace("email_", "");
                      onSelectEvidence(evId);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <span>Inspect Evidence in Workbench</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Correlated Campaign Clusters List */}
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
              <div
                key={idx}
                onClick={() => handleCampaignChange(c.campaign_id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                  selectedCampaign === c.campaign_id
                    ? "bg-[rgba(139,92,246,0.15)] border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                    : "bg-[rgba(5,7,13,0.55)] border-[rgba(255,255,255,0.08)] hover:border-purple-500/40"
                }`}
              >
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
                <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <span>Linked Artifacts: {c.linked_emails.join(", ")}</span>
                  <span className="text-[#37D7FF] text-[10px] flex items-center gap-1">
                    <span>Filter Graph</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
