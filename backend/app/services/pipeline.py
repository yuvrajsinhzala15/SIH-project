import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.db.models import (
    Evidence, ChainOfCustody, EmailRecord, SmtpHop, AuthResult,
    IpIntel, DomainIntel, UrlIntel, AttachmentRecord, AiThreatIntel,
    ThreatScore, IOC, Case
)
from app.core.security import generate_evidence_id
from app.engines.parser import EmailParserEngine
from app.engines.header_trust import HeaderTrustEngine
from app.engines.smtp_route import SmtpRouteEngine
from app.engines.auth_engine import AuthenticationEngine
from app.engines.geoip_asn import GeoIpAsnEngine
from app.engines.domain_engine import DomainForensicsEngine
from app.engines.url_engine import UrlForensicsEngine
from app.engines.attachment import AttachmentForensicsEngine
from app.engines.ai_nlp import AiThreatAnalysisEngine
from app.engines.risk_scorer import CompositeRiskScoringEngine
from app.engines.correlation import CorrelationEngine

class ForensicPipelineService:
    """
    End-to-End Automated Forensic Ingestion & Threat Analysis Pipeline.
    Executes all analytical stages in sequence, preserving cryptographic integrity
    and recording immutable chain of custody audit logs.
    """

    @classmethod
    def ingest_and_analyze(
        cls,
        db: Session,
        raw_bytes: bytes,
        filename: str = "suspicious.eml",
        actor: str = "SOC_ANALYST_INGEST",
        case_id: Optional[int] = None
    ) -> Evidence:
        
        # 1. Parsing & Hashing
        parsed_data = EmailParserEngine.parse_raw_email(raw_bytes, filename=filename)
        hashes = parsed_data["hashes"]
        
        # Sequence number for Evidence ID
        ev_count = db.query(Evidence).count() + 1
        ev_id_str = generate_evidence_id(ev_count)

        # Create Evidence Record
        evidence = Evidence(
            evidence_id=ev_id_str,
            sha256=hashes["sha256"],
            sha3_256=hashes["sha3_256"],
            md5=hashes["md5"],
            filename=filename,
            file_size=parsed_data["file_size"],
            mime_type=parsed_data["mime_type"],
            raw_content=raw_bytes.decode(errors="replace"),
            received_at=datetime.now(timezone.utc),
            status="ANALYZING",
            case_id=case_id
        )
        db.add(evidence)
        db.flush()

        # Log Chain of Custody: INGESTION & HASHING
        cls._log_custody(db, ev_id_str, actor, "EVIDENCE_UPLOADED", hashes["sha256"], {"filename": filename, "size": parsed_data["file_size"]})
        cls._log_custody(db, ev_id_str, "SYSTEM_CRYPTO", "EVIDENCE_HASHED", hashes["sha256"], {"sha256": hashes["sha256"], "sha3_256": hashes["sha3_256"]})

        # 2. Header Trust Classification
        raw_headers = parsed_data["raw_headers"]
        annotated_headers = HeaderTrustEngine.evaluate_headers(raw_headers)

        email_rec = EmailRecord(
            evidence_id=ev_id_str,
            message_id=parsed_data["message_id"],
            subject=parsed_data["subject"],
            from_addr=parsed_data["from_addr"],
            from_name=parsed_data["from_name"],
            to_addr=parsed_data["to_header"],
            cc_addr=parsed_data["cc_header"],
            reply_to=parsed_data["reply_to"],
            return_path=parsed_data["return_path"],
            date_header=parsed_data["date_header"],
            date_parsed=parsed_data["date_parsed"],
            user_agent=parsed_data["user_agent"],
            x_originating_ip=parsed_data["x_originating_ip"],
            body_plain=parsed_data["body_plain"],
            body_html=parsed_data["body_html"],
            raw_headers_json=json.dumps(annotated_headers)
        )
        db.add(email_rec)

        # 3. SMTP Route Reconstruction
        received_raw_list = [h["value"] for h in raw_headers if h["name"].lower() == "received"]
        route_data = SmtpRouteEngine.reconstruct_route(received_raw_list)
        
        all_observed_ips = []
        for hop in route_data["hops"]:
            hop_rec = SmtpHop(
                evidence_id=ev_id_str,
                hop_number=hop["hop_number"],
                timestamp=hop["timestamp"],
                source_host=hop["source_host"],
                source_ip=hop["source_ip"],
                is_private_ip=hop["is_private_ip"],
                dest_host=hop["dest_host"],
                protocol=hop["protocol"],
                tls_cipher=hop["tls_cipher"],
                delay_seconds=hop["delay_seconds"],
                trust_level=hop["trust_level"],
                raw_header=hop["raw_header"]
            )
            db.add(hop_rec)
            if hop["source_ip"]:
                all_observed_ips.append(hop["source_ip"])

        if parsed_data["x_originating_ip"]:
            all_observed_ips.append(parsed_data["x_originating_ip"])

        # 4. Authentication Analysis (SPF, DKIM, DMARC, ARC)
        auth_data = AuthenticationEngine.analyze(
            raw_headers,
            parsed_data["from_addr"],
            parsed_data["return_path"]
        )
        auth_rec = AuthResult(
            evidence_id=ev_id_str,
            spf_result=auth_data["spf_result"],
            spf_domain=auth_data["spf_domain"],
            spf_scope=auth_data["spf_scope"],
            dkim_result=auth_data["dkim_result"],
            dkim_domain=auth_data["dkim_domain"],
            dkim_selector=auth_data["dkim_selector"],
            dkim_independent_verified=auth_data["dkim_independent_verified"],
            dmarc_result=auth_data["dmarc_result"],
            dmarc_policy=auth_data["dmarc_policy"],
            dmarc_alignment=auth_data["dmarc_alignment"],
            arc_result=auth_data["arc_result"],
            reported_by=auth_data["reported_by"],
            trust_classification=auth_data["trust_classification"],
            summary_explanation="\n".join(auth_data["summary_explanations"])
        )
        db.add(auth_rec)

        # 5. Geolocation & ASN Intelligence
        ip_intel_results = []
        for ip_val in set(all_observed_ips):
            geo = GeoIpAsnEngine.lookup_ip(ip_val)
            
            classification = "observed_infrastructure"
            if route_data["earliest_observed_external_hop"] and route_data["earliest_observed_external_hop"]["ip"] == ip_val:
                classification = "earliest_observed_external_hop"

            ip_rec = IpIntel(
                evidence_id=ev_id_str,
                ip=geo["ip"],
                classification=classification,
                is_private=geo["is_private"],
                country=geo["country"],
                country_code=geo["country_code"],
                city=geo["city"],
                latitude=geo["latitude"],
                longitude=geo["longitude"],
                asn=geo["asn"],
                asn_org=geo["asn_org"],
                reverse_dns=geo["reverse_dns"],
                infra_type=geo["infra_type"],
                provider_status=geo["provider_status"],
                attribution_confidence=geo["attribution_confidence"]
            )
            db.add(ip_rec)
            ip_intel_results.append(geo)

        # 6. Domain Forensics & Impersonation Analysis
        from_domain = parsed_data["from_addr"].split("@")[-1] if "@" in parsed_data["from_addr"] else ""
        domain_data = DomainForensicsEngine.analyze_domain(from_domain, role="sender_domain")
        
        mismatches = DomainForensicsEngine.evaluate_mismatches(
            parsed_data["from_name"],
            parsed_data["from_addr"],
            parsed_data["reply_to"],
            parsed_data["return_path"]
        )

        domain_rec = DomainIntel(
            evidence_id=ev_id_str,
            domain=domain_data.get("domain", "Unavailable"),
            role=domain_data.get("role", "sender_domain"),
            target_brand=domain_data.get("target_brand"),
            similarity_score=domain_data.get("similarity_score", 0.0),
            similarity_algorithm=domain_data.get("similarity_algorithm"),
            is_homoglyph=domain_data.get("is_homoglyph", False),
            is_punycode=domain_data.get("is_punycode", False),
            punycode_decoded=domain_data.get("punycode_decoded"),
            homoglyph_breakdown=json.dumps(domain_data.get("homoglyph_breakdown", {})),
            is_suspicious=domain_data.get("is_suspicious", False),
            suspicious_reasons=json.dumps(domain_data.get("reasons", []))
        )
        db.add(domain_rec)

        # 7. URL Forensics
        url_results = UrlForensicsEngine.extract_and_analyze_urls(
            parsed_data["body_plain"],
            parsed_data["body_html"]
        )
        for u in url_results:
            u_rec = UrlIntel(
                evidence_id=ev_id_str,
                original_url=u["original_url"],
                defanged_url=u["defanged_url"],
                domain=u["domain"],
                tld=u["tld"],
                is_https=u["is_https"],
                is_ip_based_url=u["is_ip_based_url"],
                has_suspicious_params=u["has_suspicious_params"],
                is_shortener=u["is_shortener"],
                is_suspicious=u["is_suspicious"],
                risk_score=u["risk_score"],
                risk_reasons=json.dumps(u["risk_reasons"])
            )
            db.add(u_rec)

        # 8. Attachment Static Forensics
        att_results = AttachmentForensicsEngine.analyze_attachments(parsed_data["attachments"])
        for a in att_results:
            a_rec = AttachmentRecord(
                evidence_id=ev_id_str,
                filename=a["filename"],
                file_size=a["file_size"],
                mime_type=a["mime_type"],
                sha256=a["sha256"],
                sha3_256=a["sha3_256"],
                extension=a["extension"],
                has_double_extension=a["has_double_extension"],
                is_executable_type=a["is_executable_type"],
                has_macro_indicators=a["has_macro_indicators"],
                is_suspicious=a["is_suspicious"],
                risk_factors=json.dumps(a["risk_factors"])
            )
            db.add(a_rec)

        # 9. AI / NLP Threat Analysis
        ai_data = AiThreatAnalysisEngine.analyze(
            parsed_data["subject"],
            parsed_data["body_plain"],
            parsed_data["body_html"],
            parsed_data["from_name"],
            mismatches
        )
        ai_rec = AiThreatIntel(
            evidence_id=ev_id_str,
            classification=ai_data["classification"],
            confidence=ai_data["confidence"],
            intent_summary=ai_data["intent_summary"],
            urgency_level=ai_data["urgency_level"],
            requested_action=ai_data["requested_action"],
            impersonated_executive=ai_data["impersonated_executive"],
            impersonated_org=ai_data["impersonated_org"],
            financial_indicators=json.dumps(ai_data["financial_indicators"]),
            signals=json.dumps(ai_data["signals"]),
            limitations=json.dumps(ai_data["limitations"]),
            model_name=ai_data["model_name"],
            model_version=ai_data["model_version"],
            pii_redacted_count=ai_data["pii_redacted_count"]
        )
        db.add(ai_rec)

        # 10. Composite Explainable Risk Scoring
        score_data = CompositeRiskScoringEngine.calculate_score(
            auth_data=auth_data,
            ai_data=ai_data,
            domain_data=domain_data,
            mismatches=mismatches,
            ip_data_list=ip_intel_results,
            url_data_list=url_results,
            attachment_data_list=att_results
        )
        score_rec = ThreatScore(
            evidence_id=ev_id_str,
            final_score=score_data["final_score"],
            risk_level=score_data["risk_level"],
            confidence=score_data["confidence"],
            auth_score=score_data["component_scores"]["authentication_risk"],
            nlp_score=score_data["component_scores"]["nlp_intent_risk"],
            spoof_score=score_data["component_scores"]["impersonation_risk"],
            infra_score=score_data["component_scores"]["infrastructure_risk"],
            url_score=score_data["component_scores"]["url_risk"],
            attach_score=score_data["component_scores"]["attachment_risk"],
            breakdown_json=json.dumps(score_data["breakdown"]),
            explanations_json=json.dumps([list(item.values())[0] for item in score_data["breakdown"]]),
            recommended_actions_json=json.dumps(score_data["recommended_actions"])
        )
        db.add(score_rec)

        # 11. Extract and Index IOCs
        all_domains = [from_domain] + [u["domain"] for u in url_results]
        all_urls = [u["original_url"] for u in url_results]
        all_hashes = [a["sha256"] for a in att_results]
        
        iocs = CorrelationEngine.extract_iocs(
            evidence_id=ev_id_str,
            from_addr=parsed_data["from_addr"],
            reply_to=parsed_data["reply_to"],
            ips=all_observed_ips,
            domains=all_domains,
            urls=all_urls,
            attachment_hashes=all_hashes
        )
        for ioc_item in iocs:
            ioc_rec = IOC(
                evidence_id=ev_id_str,
                ioc_type=ioc_item["ioc_type"],
                value=ioc_item["value"],
                defanged_value=ioc_item["defanged_value"],
                confidence=ioc_item["confidence"],
                source=ioc_item["source"]
            )
            db.add(ioc_rec)

        # Update Evidence status
        evidence.status = "ANALYZED"
        cls._log_custody(db, ev_id_str, "SYSTEM_PIPELINE", "EVIDENCE_ANALYZED", hashes["sha256"], {"score": score_data["final_score"], "risk": score_data["risk_level"]})

        db.commit()
        db.refresh(evidence)
        return evidence

    @staticmethod
    def _log_custody(db: Session, evidence_id: str, actor: str, action: str, hash_snapshot: str, details: Dict[str, Any]):
        log = ChainOfCustody(
            evidence_id=evidence_id,
            timestamp=datetime.now(timezone.utc),
            actor=actor,
            action=action,
            hash_snapshot=hash_snapshot,
            details=json.dumps(details)
        )
        db.add(log)
