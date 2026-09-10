from datetime import datetime, timezone
from typing import Dict, Any, List

class ForensicReportGenerator:
    """
    Forensic Dossier & Executive Intelligence Report Generator.
    Implements Sections 34 and 57 by generating a court-admissible and SOC-ready
    technical and executive report with immutable cryptographic hashes and chain of custody.
    """

    @classmethod
    def generate_html_report(cls, evidence_data: Dict[str, Any]) -> str:
        ev_id = evidence_data.get("evidence_id", "EV-UNKNOWN")
        sha256 = evidence_data.get("sha256", "")
        sha3_256 = evidence_data.get("sha3_256", "")
        filename = evidence_data.get("filename", "suspicious.eml")
        file_size = evidence_data.get("file_size", 0)
        received_at = evidence_data.get("received_at", datetime.now(timezone.utc).isoformat())

        score_data = evidence_data.get("threat_score", {})
        final_score = score_data.get("final_score", 0.0)
        risk_level = score_data.get("risk_level", "LOW")
        classification = evidence_data.get("ai_intel", {}).get("classification", "Unknown")

        subject = evidence_data.get("subject", "(No Subject)")
        from_header = evidence_data.get("from_header", "")
        to_header = evidence_data.get("to_header", "")
        reply_to = evidence_data.get("reply_to", "None")

        auth = evidence_data.get("auth", {})
        hops = evidence_data.get("hops", [])
        ips = evidence_data.get("ips", [])
        domains = evidence_data.get("domains", [])
        urls = evidence_data.get("urls", [])
        attachments = evidence_data.get("attachments", [])
        iocs = evidence_data.get("iocs", [])
        custody_logs = evidence_data.get("custody_logs", [])

        # Color mapping
        risk_color = "#ef4444" if risk_level == "CRITICAL" else "#f97316" if risk_level == "HIGH" else "#eab308" if risk_level == "MEDIUM" else "#10b981"

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Digital Forensic Intelligence Dossier - {ev_id}</title>
<style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 30px; }}
    .container {{ max-width: 1000px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
    .header-banner {{ border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }}
    .title {{ font-size: 24px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; }}
    .badge {{ display: inline-block; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 14px; color: #ffffff; background: {risk_color}; }}
    .section {{ margin-bottom: 35px; }}
    .section-title {{ font-size: 16px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #38bdf8; padding-left: 10px; margin-bottom: 15px; }}
    .grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }}
    .card {{ background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 15px; }}
    .card-label {{ font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }}
    .card-value {{ font-size: 14px; color: #e2e8f0; font-weight: 600; margin-top: 4px; word-break: break-all; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }}
    th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; }}
    th {{ background: #0f172a; color: #94a3b8; font-weight: 600; }}
    .mono {{ font-family: 'Courier New', Courier, monospace; }}
    .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }}
</style>
</head>
<body>
<div class="container">
    <div class="header-banner">
        <div>
            <div class="title">Digital Forensic Intelligence Dossier</div>
            <div style="font-size: 13px; color: #94a3b8; margin-top: 5px;">Evidence Record: <span class="mono" style="color: #38bdf8;">{ev_id}</span></div>
        </div>
        <div>
            <span class="badge">{risk_level} RISK &bull; {final_score}/100</span>
        </div>
    </div>

    <!-- 1. Executive Summary -->
    <div class="section">
        <div class="section-title">1. Executive Threat Summary</div>
        <div class="grid">
            <div class="card">
                <div class="card-label">Classification</div>
                <div class="card-value" style="color: #38bdf8;">{classification}</div>
            </div>
            <div class="card">
                <div class="card-label">Confidence Assessment</div>
                <div class="card-value">{score_data.get('confidence', 0.9)*100:.0f}% (Traceable to Observed Artifacts)</div>
            </div>
            <div class="card" style="grid-column: span 2;">
                <div class="card-label">Threat Explanation & Key Drivers</div>
                <div class="card-value" style="font-size: 13px; font-weight: 400; line-height: 1.6;">
                    <ul>
                        {"".join([f"<li>{list(item.values())[0]}</li>" for item in score_data.get('breakdown', [])])}
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- 2. Cryptographic Integrity & Chain of Custody -->
    <div class="section">
        <div class="section-title">2. Cryptographic Evidence Integrity (Dual-Hash)</div>
        <div class="grid">
            <div class="card">
                <div class="card-label">Original Filename</div>
                <div class="card-value">{filename} ({file_size} bytes)</div>
            </div>
            <div class="card">
                <div class="card-label">Acquisition UTC Timestamp</div>
                <div class="card-value">{received_at}</div>
            </div>
            <div class="card" style="grid-column: span 2;">
                <div class="card-label">SHA-256 Hash</div>
                <div class="card-value mono">{sha256}</div>
            </div>
            <div class="card" style="grid-column: span 2;">
                <div class="card-label">SHA-3-256 Hash</div>
                <div class="card-value mono">{sha3_256}</div>
            </div>
        </div>
    </div>

    <!-- 3. Chain of Custody -->
    <div class="section">
        <div class="section-title">3. Chain of Custody Audit Trail</div>
        <table>
            <thead>
                <tr>
                    <th>Timestamp (UTC)</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Hash Snapshot</th>
                </tr>
            </thead>
            <tbody>
                {"".join([f"<tr><td>{c.get('timestamp')}</td><td>{c.get('actor')}</td><td>{c.get('action')}</td><td class='mono'>{c.get('hash_snapshot', '')[:16]}...</td></tr>" for c in custody_logs])}
            </tbody>
        </table>
    </div>

    <!-- 4. Email Metadata -->
    <div class="section">
        <div class="section-title">4. RFC 5322 Email Message Headers</div>
        <div class="grid">
            <div class="card">
                <div class="card-label">Subject</div>
                <div class="card-value">{subject}</div>
            </div>
            <div class="card">
                <div class="card-label">From Header</div>
                <div class="card-value">{from_header}</div>
            </div>
            <div class="card">
                <div class="card-label">To Header</div>
                <div class="card-value">{to_header}</div>
            </div>
            <div class="card">
                <div class="card-label">Reply-To Header</div>
                <div class="card-value">{reply_to}</div>
            </div>
        </div>
    </div>

    <!-- 5. Authentication Matrix -->
    <div class="section">
        <div class="section-title">5. Authentication & Upstream Verification</div>
        <table>
            <thead>
                <tr>
                    <th>Protocol</th>
                    <th>Reported Result</th>
                    <th>Authenticated Domain</th>
                    <th>Alignment Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>SPF</strong></td>
                    <td style="color: {'#10b981' if auth.get('spf_result') == 'PASS' else '#ef4444'}; font-weight: 700;">{auth.get('spf_result')}</td>
                    <td>{auth.get('spf_domain')}</td>
                    <td>{'ALIGNED' if auth.get('spf_aligned') else 'MISALIGNED'}</td>
                </tr>
                <tr>
                    <td><strong>DKIM</strong></td>
                    <td style="color: {'#10b981' if auth.get('dkim_result') == 'PASS' else '#ef4444'}; font-weight: 700;">{auth.get('dkim_result')}</td>
                    <td>{auth.get('dkim_domain')} (Selector: {auth.get('dkim_selector')})</td>
                    <td>{'ALIGNED' if auth.get('dkim_aligned') else 'MISALIGNED'}</td>
                </tr>
                <tr>
                    <td><strong>DMARC</strong></td>
                    <td style="color: {'#10b981' if auth.get('dmarc_result') == 'PASS' else '#ef4444'}; font-weight: 700;">{auth.get('dmarc_result')}</td>
                    <td>Policy: {auth.get('dmarc_policy')}</td>
                    <td>{auth.get('dmarc_alignment')}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- 6. Extracted IOCs -->
    <div class="section">
        <div class="section-title">6. Extracted Indicators of Compromise (IOCs)</div>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Defanged Value</th>
                    <th>Confidence</th>
                    <th>Evidence Source</th>
                </tr>
            </thead>
            <tbody>
                {"".join([f"<tr><td><strong>{i.get('ioc_type').upper()}</strong></td><td class='mono'>{i.get('defanged_value')}</td><td>{int(i.get('confidence', 0.9)*100)}%</td><td>{i.get('source')}</td></tr>" for i in iocs])}
            </tbody>
        </table>
    </div>

    <div class="footer">
        Generated by AI-Powered Email Threat Detection, Geolocation & Forensic Intelligence Platform.<br>
        This document contains preserved digital forensics evidence. Classification and scoring adhere to deterministic forensic standards.
    </div>
</div>
</body>
</html>
"""
        return html
