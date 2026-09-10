import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { SmtpHop, IpIntel } from "../services/api";
import { Navigation, Clock, ArrowRight } from "lucide-react";

interface RouteMapProps {
  hops: SmtpHop[];
  ips: IpIntel[];
}

export const RouteMap: React.FC<RouteMapProps> = ({ hops, ips }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // If map already exists, remove it before reinitializing
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([20.0, 0.0], 2);

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

        // Custom cyber pulsing pin icon
        const iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #00f0ff; border: 2px solid #ffffff; box-shadow: 0 0 10px #00f0ff;"></div>
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(0, 240, 255, 0.3); animation: pulse-subtle 2s infinite;"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-map-pin",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker(coord, { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 800; color: #38bdf8; text-transform: uppercase;">Observed Relay #${idx + 1}</div>
            <div style="font-weight: 700; color: #f8fafc; font-family: monospace; margin: 3px 0;">${ip.ip}</div>
            <div style="color: #94a3b8;">${ip.city}, ${ip.country}</div>
            <div style="color: #64748b; font-size: 11px;">${ip.asn} &bull; ${ip.asn_org}</div>
            <div style="margin-top: 4px; font-weight: 600; color: #a855f7;">${ip.infra_type}</div>
          </div>
        `;

        marker.bindPopup(popupContent);
      }
    });

    // Draw route transit lines
    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: "#38bdf8",
        weight: 2.5,
        opacity: 0.8,
        dashArray: "6, 6",
      }).addTo(map);
    }

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 5 });
    }

    // Cleanup function on unmount
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              SMTP Route Geolocation & Infrastructure Map
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {hops.length} Total Hops ({(ips || []).filter((i) => !i.is_private).length} Public Relays)
          </span>
        </div>

        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-80 rounded-lg overflow-hidden border border-slate-800 shadow-inner" />
      </div>

      {/* Chronological Hop Reconstruct Timeline Table */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Chronological SMTP Hop Reconstruction (RFC 822 Unwound)
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Hop 1 (Earliest Observed Origin) <ArrowRight className="inline w-3 h-3 mx-1 text-cyan-400" /> Hop {hops.length} (Recipient Gateway)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/80">
                <th className="p-3">Hop #</th>
                <th className="p-3">Source Host / IP</th>
                <th className="p-3">Destination Host</th>
                <th className="p-3">Protocol / TLS Cipher</th>
                <th className="p-3">Transit Delay</th>
                <th className="p-3">Trust Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {hops.map((hop) => {
                const ipIntel = (ips || []).find((i) => i.ip === hop.source_ip);
                return (
                  <tr key={hop.hop_number} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">
                      #{hop.hop_number}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{hop.source_host || "Unknown Host"}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-400 text-[11px]">
                          {hop.source_ip || "No IP in header"}
                        </span>
                        {hop.is_private_ip ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 font-mono">
                            RFC 1918 Private
                          </span>
                        ) : ipIntel ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-mono">
                            {ipIntel.country_code} &bull; {ipIntel.infra_type}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-300 text-[11px]">
                      {hop.dest_host || "Destination MTA"}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-300">{hop.protocol || "SMTP"}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs" title={hop.tls_cipher || "Plaintext"}>
                        {hop.tls_cipher || "None / Plaintext"}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {hop.delay_seconds > 0 ? `+${hop.delay_seconds.toFixed(1)}s` : "0.0s"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          hop.trust_level === "HIGH_TRUST"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {hop.trust_level}
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
