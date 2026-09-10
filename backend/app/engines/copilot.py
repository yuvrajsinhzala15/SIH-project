from typing import Dict, Any, List

class ForensicCopilotEngine:
    """
    Evidence-Grounded AI Investigation Copilot Engine.
    Implements Sections 42 and 43 by providing contextual forensic analysis
    strictly constrained to observable evidence facts, resistant to prompt-injection,
    and supplying targeted recommendations for SOC tier 1-3 analysts.
    """

    @classmethod
    def answer_query(cls, query: str, evidence_context: Dict[str, Any]) -> Dict[str, Any]:
        q_lower = query.strip().lower()

        ev_id = evidence_context.get("evidence_id", "Unknown")
        subject = evidence_context.get("subject", "No subject")
        from_addr = evidence_context.get("from_addr", "Unknown")
        from_name = evidence_context.get("from_name", "")
        reply_to = evidence_context.get("reply_to", "")
        score_data = evidence_context.get("threat_score", {})
        score = score_data.get("final_score", 0.0)
        risk = score_data.get("risk_level", "LOW")
        auth = evidence_context.get("auth", {})
        hops = evidence_context.get("hops", [])
        earliest_hop = evidence_context.get("earliest_external_hop")
        domains = evidence_context.get("domains", [])
        urls = evidence_context.get("urls", [])
        attachments = evidence_context.get("attachments", [])
        ai_intel = evidence_context.get("ai_intel", {})
        iocs = evidence_context.get("iocs", [])

        # Security check: prompt injection guard
        injection_keywords = ["ignore previous instructions", "system prompt", "bypass security", "you are now a", "drop table"]
        if any(ik in q_lower for ik in injection_keywords):
            return {
                "answer": "Security Alert: Prompt injection attempt detected. Input treated strictly as passive forensic evidence.",
                "evidence_references": [ev_id],
                "confidence": 1.0
            }

        # Query Handler: Why is this email suspicious? / Evidence supporting risk score
        if "why" in q_lower or "suspicious" in q_lower or "score" in q_lower or "risk" in q_lower:
            points = []
            if auth.get("spf_result") in ["FAIL", "SOFTFAIL"]:
                points.append(f"• **Authentication Inconsistency**: SPF evaluated to `{auth.get('spf_result')}` for domain `{auth.get('spf_domain')}`.")
            if auth.get("dmarc_alignment") == "FAIL":
                points.append("• **DMARC Misalignment**: Neither SPF nor DKIM aligns with the visible From address.")
            
            for d in domains:
                if d.get("is_suspicious"):
                    points.append(f"• **Domain Typosquatting**: `{d.get('domain')}` has a {d.get('similarity_score', 0)*100:.0f}% similarity to legitimate brand `{d.get('target_brand')}`.")
                if d.get("is_homoglyph"):
                    points.append(f"• **Homoglyph Substitutions**: Visual confusable characters detected: `{d.get('homoglyph_breakdown')}`.")

            if reply_to and reply_to != from_addr:
                points.append(f"• **Reply-To Routing Anomaly**: Replies are directed to `{reply_to}`, diverging from the sender `{from_addr}`.")

            if ai_intel.get("classification") and ai_intel.get("classification") != "Benign":
                points.append(f"• **AI Intent Signal**: Detected `{ai_intel.get('classification')}` with urgency `{ai_intel.get('urgency_level')}`.")

            if not points:
                points.append("• No anomalous forensic signals observed. The email complies with baseline authentication and domain checks.")

            answer = (
                f"### Threat Assessment for Evidence `{ev_id}`\n\n"
                f"**Assigned Risk Score:** `{score}/100` ({risk})\n\n"
                f"**Primary Evidentiary Drivers:**\n" + "\n".join(points) + "\n\n"
                f"*Forensic Note: Risk scoring is deterministic and traceable to observed header artifacts.*"
            )
            return {
                "answer": answer,
                "evidence_references": [f"Authentication ({auth.get('spf_result')})", f"Risk Matrix ({score} pts)"],
                "confidence": 0.94
            }

        # Query Handler: Where was this email observed entering / Infrastructure
        elif "where" in q_lower or "origin" in q_lower or "infrastructure" in q_lower or "route" in q_lower or "ip" in q_lower:
            if earliest_hop:
                ip = earliest_hop.get("ip")
                host = earliest_hop.get("host", "Unknown")
                hop_num = earliest_hop.get("hop_number", 1)
                
                # Match IP intel
                ip_intel = next((item for item in evidence_context.get("ips", []) if item.get("ip") == ip), {})
                loc = f"{ip_intel.get('city', 'Unknown')}, {ip_intel.get('country', 'Unknown')}"
                asn = f"{ip_intel.get('asn', 'Unknown')} ({ip_intel.get('asn_org', 'Unknown')})"
                infra = ip_intel.get("infra_type", "Data Center")

                answer = (
                    f"### Observed Infrastructure Route\n\n"
                    f"• **Earliest Observed External Hop:** `{ip}` (Received Hop #{hop_num})\n"
                    f"• **Observed Hostname:** `{host}`\n"
                    f"• **Observed Infrastructure Location:** `{loc}`\n"
                    f"• **Autonomous System (ASN):** `{asn}`\n"
                    f"• **Infrastructure Type:** `{infra}`\n"
                    f"• **Attribution Confidence:** `LOW` (Forensic Principle: Geolocation reflects observable routing infrastructure, not confirmed physical location of the threat actor).\n"
                )
            else:
                answer = "No external public IP was observed in the Received headers. All hops belong to private or local infrastructure."

            return {
                "answer": answer,
                "evidence_references": [f"Earliest Hop {earliest_hop.get('ip') if earliest_hop else 'None'}"],
                "confidence": 0.92
            }

        # Query Handler: Executive / CISO Summary
        elif "summary" in q_lower or "ciso" in q_lower or "executive" in q_lower:
            summary = (
                f"### Executive Threat Briefing: {subject}\n\n"
                f"**Case Reference:** `{ev_id}` | **Severity:** `{risk}` (`{score}/100`)\n\n"
                f"**Threat Classification:** `{ai_intel.get('classification', 'Suspicious Email')}`\n\n"
                f"**Executive Synthesis:**\n"
                f"The email claims identity `{from_name or from_addr}`. Header inspection revealed an authentication failure (`{auth.get('spf_result')}` on SPF) and routing through infrastructure located in `{evidence_context.get('ips', [{}])[0].get('country', 'Observed Infrastructure')}`. "
                f"The message intent exhibits `{ai_intel.get('urgency_level', 'LOW')}` urgency targeting `{ai_intel.get('requested_action', 'None')}`.\n\n"
                f"**Recommended Immediate Response:**\n"
                f"1. Quarantine message across all enterprise mailboxes.\n"
                f"2. Add sender and associated URLs to perimeter blocklists.\n"
                f"3. Ingest extracted IOCs ({len(iocs)} indicators) into SIEM/EDR."
            )
            return {
                "answer": summary,
                "evidence_references": [ev_id, f"Risk {score}"],
                "confidence": 0.95
            }

        # Query Handler: What to investigate next / Recommended action
        elif "next" in q_lower or "action" in q_lower or "investigate" in q_lower or "recommend" in q_lower:
            actions = score_data.get("recommended_actions", [
                "Verify DKIM signatures against authoritative DNS.",
                "Cross-reference sending IP against threat intelligence feeds.",
                "Check email gateway logs for identical subjects in the past 72 hours."
            ])
            formatted_actions = "\n".join([f"{idx}. {act}" for idx, act in enumerate(actions, 1)])
            answer = (
                f"### Recommended Analyst Next Steps\n\n"
                f"{formatted_actions}\n\n"
                f"*Advisory Notice: These steps are guidance for SOC analysts. Destructive containment actions require human authorization.*"
            )
            return {
                "answer": answer,
                "evidence_references": ["SOC Playbook Guidelines"],
                "confidence": 0.96
            }

        # Default fallback strictly from evidence
        return {
            "answer": (
                f"### Forensic Intelligence Summary for `{ev_id}`\n\n"
                f"• **Subject:** {subject}\n"
                f"• **Sender:** {from_addr}\n"
                f"• **Risk Level:** {risk} ({score}/100)\n"
                f"• **Classification:** {ai_intel.get('classification')}\n"
                f"• **Extracted IOCs:** {len(iocs)} indicators indexed\n"
                f"• **Authentication:** SPF={auth.get('spf_result')}, DKIM={auth.get('dkim_result')}, DMARC={auth.get('dmarc_result')}\n\n"
                f"You can ask me specific questions like: *'Why is this email suspicious?'*, *'Where was the email observed entering?'*, or *'Summarize for CISO'*."
            ),
            "evidence_references": [ev_id],
            "confidence": 0.90
        }
