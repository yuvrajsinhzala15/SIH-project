import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { SmtpHop, IpIntel } from "../services/api";
import { Navigation, Clock, ArrowRight, Activity, MapPin } from "lucide-react";

interface RouteMapProps {
  hops: SmtpHop[];
  ips: IpIntel[];
}

export const RouteMap: React.FC<RouteMapProps> = ({ hops, ips }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([25.0, 10.0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Extract valid Geo coordinates from public IPs
    const publicIpsWithCoords = (ips || []).filter(
      (ip) => !ip.is_private && ip.latitude !== null && ip.longitude !== null
    );

    const latLngs: L.LatLngExpression[] = [];

    publicIpsWithCoords.forEach((ip, idx) => {
      if (ip.latitude !== null && ip.longitude !== null) {
        const coord: [number, number] = [ip.latitude, ip.longitude];
        latLngs.push(coord);

        // Futuristic Holographic Map Marker
        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(55,215,255,0.25); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #37D7FF, #4D7CFF); border: 2px solid #05070D; box-shadow: 0 0 12px #37D7FF; display: flex; align-items: center; justify-content: center;">
              <span style="font-family: monospace; font-size: 9px; font-weight: 900; color: #05070D;">${idx + 1}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-map-pin",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker(coord, { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: Inter, sans-serif; font-size: 11px; line-height: 1.4; padding: 4px;">
            <div style="font-weight: 800; color: #37D7FF; text-transform: uppercase; font-size: 10px; font-family: monospace; letter-spacing: 0.05em;">// OBSERVED RELAY #${idx + 1}</div>
            <div style="font-weight: 800; color: #ffffff; font-family: 'JetBrains Mono', monospace; font-size: 12px; margin: 3px 0;">${ip.ip}</div>
            <div style="color: #94A3B8; font-size: 11px;">${ip.city}, ${ip.country}</div>
            <div style="color: #64748B; font-size: 10px; font-family: monospace; margin-top: 3px;">ASN: ${ip.asn} • ${ip.asn_org}</div>
            <div style="margin-top: 6px; font-weight: 700; font-size: 10px; color: #8B5CF6; font-family: monospace;">NODE: ${ip.infra_type}</div>
          </div>
        `;

        marker.bindPopup(popupContent);
      }
    });

    // Draw glowing route transit lines
    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: "#37D7FF",
        weight: 2.5,
        opacity: 0.85,
        dashArray: "6, 6",
      }).addTo(map);
    }

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 5 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ips]);

  return (
    <div className="space-y-5">
      {/* Interactive Map Header */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#37D7FF]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Global SMTP Route Geolocation & Relay Topology
            </h2>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[rgba(55,215,255,0.1)] text-[#37D7FF] border border-[rgba(55,215,255,0.25)] font-mono font-bold">
            {hops.length} TOTAL HOPS • {(ips || []).filter((i) => !i.is_private).length} PUBLIC RELAYS
          </span>
        </div>

        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-88 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Chronological Hop Reconstruct Timeline Table */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Chronological SMTP Hop Reconstruction (RFC 822 Transit Unwound)
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="text-[#37D7FF]">ORIGIN</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[#8B5CF6]">RECIPIENT GATEWAY</span>
          </div>
        </div>

        <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-xl bg-[rgba(5,7,13,0.4)]">
          <table className="forensic-table font-mono">
            <thead>
              <tr className="font-sans">
                <th>Hop #</th>
                <th>Source Host / IP</th>
                <th>Destination Host</th>
                <th>Protocol / Cipher</th>
                <th>Transit Delay</th>
                <th>Trust Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {hops.map((hop) => {
                const ipIntel = (ips || []).find((i) => i.ip === hop.source_ip);
                return (
                  <tr key={hop.hop_number} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                    <td className="font-mono font-black text-[#37D7FF] text-xs">
                      #{hop.hop_number}
                    </td>
                    <td>
                      <div className="font-sans font-bold text-white text-xs">{hop.source_host || "Unknown Host"}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[#37D7FF] text-xs font-bold">
                          {hop.source_ip || "No IP declared"}
                        </span>
                        {hop.is_private_ip ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] font-mono font-bold">
                            RFC 1918 Private
                          </span>
                        ) : ipIntel ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-slate-300 border border-[rgba(255,255,255,0.1)] font-mono">
                            {ipIntel.country_code} • {ipIntel.infra_type}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="text-slate-300 text-xs">
                      {hop.dest_host || "Destination MTA"}
                    </td>
                    <td>
                      <div className="font-sans font-semibold text-white text-xs">{hop.protocol || "SMTP"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5" title={hop.tls_cipher || "Plaintext"}>
                        {hop.tls_cipher || "None / Plaintext"}
                      </div>
                    </td>
                    <td className="text-white text-xs font-bold">
                      {hop.delay_seconds > 0 ? `+${hop.delay_seconds.toFixed(1)}s` : "0.0s"}
                    </td>
                    <td className="font-sans">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                          hop.trust_level === "HIGH_TRUST"
                            ? "bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.4)] shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                            : "bg-[rgba(255,255,255,0.05)] text-slate-400 border border-[rgba(255,255,255,0.1)]"
                        }`}
                      >
                        {hop.trust_level === "HIGH_TRUST" ? "● HIGH TRUST" : "● UNVERIFIED"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

