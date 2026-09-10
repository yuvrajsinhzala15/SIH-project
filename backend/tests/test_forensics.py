import pytest
from app.core.security import compute_evidence_hashes
from app.engines.parser import EmailParserEngine
from app.engines.smtp_route import SmtpRouteEngine
from app.engines.domain_engine import DomainForensicsEngine
from app.engines.auth_engine import AuthenticationEngine
from app.engines.risk_scorer import CompositeRiskScoringEngine
from app.engines.stix_generator import Stix21Generator
from app.samples.samples import SAMPLE_BEC_EML

def test_evidence_dual_hashing():
    raw_data = b"MIME-Version: 1.0\r\nSubject: Test Evidence\r\n\r\nHello World"
    hashes = compute_evidence_hashes(raw_data)
    assert "sha256" in hashes
    assert "sha3_256" in hashes
    assert len(hashes["sha256"]) == 64
    assert len(hashes["sha3_256"]) == 64
    assert hashes["sha256"] != hashes["sha3_256"]

def test_email_parsing_and_rfc822_extraction():
    parsed = EmailParserEngine.parse_raw_email(SAMPLE_BEC_EML.encode("utf-8"), filename="test_bec.eml")
    assert parsed["from_addr"] == "john.doe@acmecorp.com"
    assert parsed["from_name"] == "Johnathan Doe (CEO)"
    assert "executing-desk@vip-finance-portal.com" in parsed["reply_to"]
    assert "Executive Desk" in parsed["reply_to"]
    assert "Confidential Wire Transfer" in parsed["subject"]
    assert parsed["file_size"] > 0
    assert len(parsed["raw_headers"]) > 5

def test_smtp_route_chronological_reversal():
    received_headers = [
        "from mail-relay.internal (10.0.1.50) by mx01.internal (10.0.1.10) with ESMTP id 3; Wed, 09 Sep 2026 14:35:12 +0000",
        "from gateway.cloud.net (54.240.12.18) by mail-relay.internal (10.0.1.50) with ESMTPS id 2; Wed, 09 Sep 2026 14:35:10 +0000",
        "from tor-exit.de (185.220.101.5) by gateway.cloud.net (54.240.12.18) with ESMTP id 1; Wed, 09 Sep 2026 14:35:05 +0000"
    ]
    route = SmtpRouteEngine.reconstruct_route(received_headers)
    assert len(route["hops"]) == 3
    # Hop 1 must be earliest (185.220.101.5)
    assert route["hops"][0]["hop_number"] == 1
    assert route["hops"][0]["source_ip"] == "185.220.101.5"
    assert route["hops"][0]["is_private_ip"] is False
    # Earliest external hop identified
    assert route["earliest_observed_external_hop"]["ip"] == "185.220.101.5"

def test_homoglyph_and_typosquatting_detection():
    # Cyrillic or number confusable: paypa1.com vs paypal.com
    res = DomainForensicsEngine.analyze_domain("paypa1.com", role="sender_domain")
    assert res["is_suspicious"] is True
    assert res["target_brand"] == "paypal.com"
    assert res["similarity_score"] >= 0.80
    assert res["is_homoglyph"] is True

def test_authentication_spf_dmarc_analysis():
    raw_headers = [
        {"name": "Authentication-Results", "value": "mx01.example.com; spf=fail smtp.mailfrom=attacker@fake.com; dkim=none; dmarc=fail header.from=microsoft.com"}
    ]
    auth = AuthenticationEngine.analyze(raw_headers, from_addr="ceo@microsoft.com", return_path="attacker@fake.com")
    assert auth["spf_result"] == "FAIL"
    assert auth["dmarc_alignment"] == "FAIL"

def test_explainable_risk_scoring():
    auth_data = {"spf_result": "FAIL", "dkim_result": "FAIL", "dmarc_alignment": "FAIL"}
    ai_data = {"classification": "BEC", "confidence": 0.95, "urgency_level": "CRITICAL"}
    domain_data = {"is_suspicious": True, "target_brand": "paypal.com", "similarity_score": 0.9, "is_homoglyph": True}
    mismatches = [{"type": "DISPLAY_NAME_IMPERSONATION"}]
    score_res = CompositeRiskScoringEngine.calculate_score(
        auth_data=auth_data,
        ai_data=ai_data,
        domain_data=domain_data,
        mismatches=mismatches,
        ip_data_list=[{"infra_type": "TOR Exit", "ip": "185.220.101.5"}],
        url_data_list=[],
        attachment_data_list=[]
    )
    assert score_res["final_score"] >= 70.0
    assert score_res["risk_level"] in ["HIGH", "CRITICAL"]
    assert len(score_res["breakdown"]) > 0

def test_stix_bundle_serialization():
    evidence_payload = {
        "evidence_id": "EV-2026-000001",
        "subject": "Phishing Test",
        "from_addr": "attacker@rnicrosoft-security.com",
        "from_name": "Security Desk",
        "sha256": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "iocs": [
            {"ioc_type": "domain", "value": "rnicrosoft-security.com", "source": "Domain-Engine", "confidence": 0.95}
        ]
    }
    bundle = Stix21Generator.generate_bundle(evidence_payload)
    assert bundle["type"] == "bundle"
    assert "objects" in bundle
    assert any(obj["type"] == "indicator" for obj in bundle["objects"])
    assert any(obj["type"] == "observed-data" for obj in bundle["objects"])
