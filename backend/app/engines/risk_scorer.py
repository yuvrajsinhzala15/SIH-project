from typing import Dict, Any, List
from app.core.config import settings

class CompositeRiskScoringEngine:
    """
    Deterministic & Explainable Forensic Risk Scoring Engine.
    Calculates weighted risk across six core forensic dimensions
    and outputs an itemized trace (+X points for Rule Y) with actionable containment recommendations.
    """

    @classmethod
    def calculate_score(
        cls,
        auth_data: Dict[str, Any],
        ai_data: Dict[str, Any],
        domain_data: Dict[str, Any],
        mismatches: List[Dict[str, Any]],
        ip_data_list: List[Dict[str, Any]],
        url_data_list: List[Dict[str, Any]],
        attachment_data_list: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        
        breakdown = []
        explanations = []

        # 1. Authentication Risk (Weight: 25%)
        raw_auth = 0.0
        spf_res = auth_data.get("spf_result", "UNKNOWN")
        # Fallback baseline if all auth results are UNKNOWN
        if spf_res == "UNKNOWN" and auth_data.get("dkim_result", "UNKNOWN") == "UNKNOWN" and auth_data.get("dmarc_result", "UNKNOWN") == "UNKNOWN":
            raw_auth += 5.0  # Minimal risk for lacking auth data
            breakdown.append({"+2": "No authentication results; assign baseline risk"})        
        dkim_res = auth_data.get("dkim_result", "UNKNOWN")
        dmarc_res = auth_data.get("dmarc_result", "UNKNOWN")
        dmarc_align = auth_data.get("dmarc_alignment", "UNKNOWN")

        if spf_res in ["FAIL", "PERMERROR"]:
            raw_auth += 40.0
            breakdown.append({"+10": "SPF validation hard fail (unauthorized sending server)"})
        elif spf_res == "SOFTFAIL":
            raw_auth += 25.0
            breakdown.append({"+6": "SPF validation softfail (~all)"})

        if dkim_res in ["FAIL", "PERMERROR"]:
            raw_auth += 35.0
            breakdown.append({"+9": "DKIM cryptographic signature verification failed"})
        elif dkim_res == "NONE":
            raw_auth += 10.0
            breakdown.append({"+3": "No DKIM cryptographic signature attached"})

        if dmarc_res == "FAIL" or dmarc_align == "FAIL":
            raw_auth += 25.0
            breakdown.append({"+6": "DMARC alignment failure (neither SPF nor DKIM aligns with header From)"})

        raw_auth = min(100.0, raw_auth)

        # 2. Domain & Impersonation Risk (Weight: 20%)
        raw_spoof = 0.0
        if domain_data.get("is_suspicious", False):
            sim = domain_data.get("similarity_score", 0.0)
            pts = 50.0 + (sim * 40.0)
            raw_spoof += pts
            breakdown.append({f"+{int(pts * settings.WEIGHT_SPOOF)}": f"Domain typosquatting similarity ({sim:.2f}) against brand '{domain_data.get('target_brand')}'"})

        if domain_data.get("is_homoglyph", False):
            raw_spoof += 30.0
            breakdown.append({"+6": "Visual homoglyph / Cyrillic confusable substitutions in domain"})

        for m in mismatches:
            if m["type"] == "DISPLAY_NAME_IMPERSONATION":
                raw_spoof += 45.0
                breakdown.append({"+9": "Display Name impersonates VIP executive with external sender domain"})
            elif m["type"] == "REPLY_TO_MISMATCH":
                raw_spoof += 35.0
                breakdown.append({"+7": "Reply-To address points to differing external destination domain"})

        raw_spoof = min(100.0, raw_spoof)

        # 3. AI / NLP Threat Intent Risk (Weight: 20%)
        raw_nlp = 0.0
        classification = ai_data.get("classification", "Benign")
        ai_conf = ai_data.get("confidence", 0.5)
        urgency = ai_data.get("urgency_level", "LOW")

        if any(threat in classification for threat in ["BEC", "Phishing", "Fraud", "Extortion", "Scam", "Spam"]):
            pts = 85.0 * ai_conf
            raw_nlp += pts
            breakdown.append({f"+{int(pts * settings.WEIGHT_NLP)}": f"AI Intent Classifier identified '{classification}' with {ai_conf*100:.0f}% confidence"})

        if urgency == "CRITICAL":
            raw_nlp += 20.0
            breakdown.append({"+4": "Severe psychological urgency pressure detected in message body"})
        elif urgency == "HIGH":
            raw_nlp += 10.0
            breakdown.append({"+2": "High urgency language detected"})

        raw_nlp = min(100.0, raw_nlp)

        # 4. Infrastructure & GeoIP Risk (Weight: 15%)
        raw_infra = 0.0
        for ip_info in ip_data_list:
            infra_type = ip_info.get("infra_type", "Unknown")
            if infra_type == "TOR Exit":
                raw_infra += 60.0
                breakdown.append({"+9": f"Observed infrastructure {ip_info.get('ip')} is a known TOR Exit Node"})
            elif infra_type == "VPN":
                raw_infra += 35.0
                breakdown.append({"+5": f"Observed infrastructure {ip_info.get('ip')} is an anonymizing VPN gateway"})
            elif infra_type == "Dedicated Hosting":
                raw_infra += 15.0
                breakdown.append({"+2": f"Email routed via hosting provider '{ip_info.get('asn_org')}'"})

        raw_infra = min(100.0, raw_infra)

        # 5. URL Threat Risk (Weight: 10%)
        raw_url = 0.0
        suspicious_urls = [u for u in url_data_list if u.get("is_suspicious", False)]
        if suspicious_urls:
            raw_url = max([u.get("risk_score", 50.0) for u in suspicious_urls])
            breakdown.append({f"+{int(raw_url * settings.WEIGHT_URL)}": f"{len(suspicious_urls)} suspicious URL(s) detected with credential-harvesting indicators"})

        # 6. Attachment Risk (Weight: 10%)
        raw_attach = 0.0
        suspicious_att = [a for a in attachment_data_list if a.get("is_suspicious", False)]
        if suspicious_att:
            raw_attach = 90.0
            breakdown.append({f"+{int(90.0 * settings.WEIGHT_ATTACH)}": f"{len(suspicious_att)} dangerous attachment(s) with double extension / macro payload"})

        # Calculate final weighted score
        final_score = (
            settings.WEIGHT_AUTH * raw_auth +
            settings.WEIGHT_NLP * raw_nlp +
            settings.WEIGHT_SPOOF * raw_spoof +
            settings.WEIGHT_INFRA * raw_infra +
            settings.WEIGHT_URL * raw_url +
            settings.WEIGHT_ATTACH * raw_attach
        )

        final_score = max(0.0, min(100.0, final_score))

        # Risk tier assignment
        if final_score >= 80.0:
            risk_level = "CRITICAL"
        elif final_score >= 60.0:
            risk_level = "HIGH"
        elif final_score >= 25.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Recommended Actions
        actions = []
        if risk_level in ["CRITICAL", "HIGH"]:
            actions.append("Quarantine email across enterprise mailboxes immediately.")
            if domain_data.get("is_suspicious", False):
                actions.append(f"Block sender domain '{domain_data.get('domain')}' on email gateway and DNS firewalls.")
            if suspicious_urls:
                actions.append("Block extracted destination URLs and domains at web proxy / EDR.")
            if suspicious_att:
                actions.append("Block attachment SHA-256 hashes across endpoint protection (EDR).")
            actions.append("Initiate Incident Response ticket for potential executive/finance targeting.")
        elif risk_level == "MEDIUM":
            actions.append("Deliver to Junk/Spam with forensic warning banner.")
            actions.append("Monitor sending IP and domain for recurring campaign traffic.")
        else:
            actions.append("No immediate containment required. Allow standard message delivery.")

        return {
            "final_score": round(final_score, 1),
            "risk_level": risk_level,
            "confidence": 0.94,
            "component_scores": {
                "authentication_risk": round(raw_auth, 1),
                "nlp_intent_risk": round(raw_nlp, 1),
                "impersonation_risk": round(raw_spoof, 1),
                "infrastructure_risk": round(raw_infra, 1),
                "url_risk": round(raw_url, 1),
                "attachment_risk": round(raw_attach, 1)
            },
            "weights": {
                "auth": settings.WEIGHT_AUTH,
                "nlp": settings.WEIGHT_NLP,
                "spoof": settings.WEIGHT_SPOOF,
                "infra": settings.WEIGHT_INFRA,
                "url": settings.WEIGHT_URL,
                "attach": settings.WEIGHT_ATTACH
            },
            "breakdown": breakdown,
            "recommended_actions": actions
        }

