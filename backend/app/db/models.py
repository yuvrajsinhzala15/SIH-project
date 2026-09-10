import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), unique=True, index=True, nullable=False)
    sha256 = Column(String(64), index=True, nullable=False)
    sha3_256 = Column(String(64), nullable=False)
    md5 = Column(String(32), nullable=False)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(128), default="message/rfc822")
    raw_content = Column(Text, nullable=False)
    received_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    status = Column(String(32), default="ANALYZED", index=True) # INGESTED, ANALYZED, ARCHIVED
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)

    # Relationships
    custody_logs = relationship("ChainOfCustody", back_populates="evidence", cascade="all, delete-orphan")
    email_record = relationship("EmailRecord", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    smtp_hops = relationship("SmtpHop", back_populates="evidence", cascade="all, delete-orphan", order_by="SmtpHop.hop_number")
    auth_result = relationship("AuthResult", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    ip_intelligence = relationship("IpIntel", back_populates="evidence", cascade="all, delete-orphan")
    domain_intelligence = relationship("DomainIntel", back_populates="evidence", cascade="all, delete-orphan")
    urls = relationship("UrlIntel", back_populates="evidence", cascade="all, delete-orphan")
    attachments = relationship("AttachmentRecord", back_populates="evidence", cascade="all, delete-orphan")
    ai_intel = relationship("AiThreatIntel", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    threat_score = relationship("ThreatScore", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    iocs = relationship("IOC", back_populates="evidence", cascade="all, delete-orphan")
    notes = relationship("AnalystNote", back_populates="evidence", cascade="all, delete-orphan")
    case = relationship("Case", back_populates="evidence_list")


class ChainOfCustody(Base):
    __tablename__ = "chain_of_custody"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    actor = Column(String(128), default="SYSTEM_AUTOMATION", nullable=False)
    action = Column(String(64), nullable=False) # EVIDENCE_UPLOADED, EVIDENCE_HASHED, EVIDENCE_PARSED, etc.
    hash_snapshot = Column(String(64), nullable=False)
    details = Column(Text, default="{}")

    evidence = relationship("Evidence", back_populates="custody_logs")


class EmailRecord(Base):
    __tablename__ = "email_records"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    message_id = Column(String(255), index=True, nullable=True)
    subject = Column(String(512), nullable=True)
    from_addr = Column(String(255), index=True, nullable=True)
    from_name = Column(String(255), nullable=True)
    to_addr = Column(String(512), nullable=True)
    cc_addr = Column(String(512), nullable=True)
    reply_to = Column(String(255), nullable=True)
    return_path = Column(String(255), nullable=True)
    date_header = Column(String(128), nullable=True)
    date_parsed = Column(DateTime(timezone=True), nullable=True)
    user_agent = Column(String(255), nullable=True)
    x_originating_ip = Column(String(64), nullable=True)
    body_plain = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    raw_headers_json = Column(Text, default="[]") # List of {name, value, trust_level, explanation}

    evidence = relationship("Evidence", back_populates="email_record")


class SmtpHop(Base):
    __tablename__ = "smtp_hops"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    hop_number = Column(Integer, nullable=False) # 1 = Earliest/Originating, N = Final Recipient hop
    timestamp = Column(DateTime(timezone=True), nullable=True)
    source_host = Column(String(255), nullable=True)
    source_ip = Column(String(64), index=True, nullable=True)
    is_private_ip = Column(Boolean, default=False)
    dest_host = Column(String(255), nullable=True)
    protocol = Column(String(64), nullable=True)
    tls_cipher = Column(String(128), nullable=True)
    delay_seconds = Column(Float, default=0.0)
    trust_level = Column(String(32), default="MEDIUM_TRUST") # HIGH_TRUST, MEDIUM_TRUST, LOWER_TRUST
    raw_header = Column(Text, nullable=True)

    evidence = relationship("Evidence", back_populates="smtp_hops")


class AuthResult(Base):
    __tablename__ = "auth_results"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    
    # SPF
    spf_result = Column(String(32), default="UNKNOWN") # PASS, FAIL, SOFTFAIL, NEUTRAL, NONE, PERMERROR
    spf_domain = Column(String(255), nullable=True)
    spf_scope = Column(String(64), nullable=True) # mfrom, helo
    
    # DKIM
    dkim_result = Column(String(32), default="UNKNOWN")
    dkim_domain = Column(String(255), nullable=True)
    dkim_selector = Column(String(128), nullable=True)
    dkim_independent_verified = Column(String(32), default="NOT_PERFORMED") # PASS, FAIL, NOT_PERFORMED
    
    # DMARC
    dmarc_result = Column(String(32), default="UNKNOWN")
    dmarc_policy = Column(String(32), default="none") # none, quarantine, reject
    dmarc_alignment = Column(String(32), default="UNKNOWN") # PASS, FAIL, PARTIAL
    
    # ARC & Upstream
    arc_result = Column(String(32), default="NONE")
    reported_by = Column(String(255), nullable=True)
    trust_classification = Column(String(64), default="REPORTED / UPSTREAM ASSERTION")
    summary_explanation = Column(Text, nullable=True)

    evidence = relationship("Evidence", back_populates="auth_result")


class IpIntel(Base):
    __tablename__ = "ip_intel"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    ip = Column(String(64), index=True, nullable=False)
    classification = Column(String(64), default="observed_infrastructure") # earliest_observed_external_hop, intermediate_relay, recipient_server
    is_private = Column(Boolean, default=False)
    country = Column(String(128), default="Unavailable")
    country_code = Column(String(8), default="XX")
    city = Column(String(128), default="Unavailable")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    asn = Column(String(64), default="Unavailable")
    asn_org = Column(String(255), default="Unavailable")
    reverse_dns = Column(String(255), default="Unavailable")
    infra_type = Column(String(64), default="Unknown") # Cloud Provider, Data Center, Dedicated Hosting, Residential ISP, VPN, TOR Exit
    provider_status = Column(String(64), default="LIVE_OR_FALLBACK") # LIVE_QUERY, FALLBACK_DATABASE, SIMULATED_INTELLIGENCE
    attribution_confidence = Column(String(32), default="LOW") # LOW, MEDIUM (forensic principle: GeoIP != physical attacker location)

    evidence = relationship("Evidence", back_populates="ip_intelligence")


class DomainIntel(Base):
    __tablename__ = "domain_intel"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    domain = Column(String(255), index=True, nullable=False)
    role = Column(String(64), default="sender_domain") # sender_domain, reply_to_domain, return_path_domain, dkim_domain, url_domain
    target_brand = Column(String(128), nullable=True) # e.g. "Microsoft", "PayPal" if impersonating
    similarity_score = Column(Float, default=0.0) # 0.0 - 1.0 (Levenshtein / Jaro-Winkler)
    similarity_algorithm = Column(String(64), nullable=True)
    is_homoglyph = Column(Boolean, default=False)
    is_punycode = Column(Boolean, default=False)
    punycode_decoded = Column(String(255), nullable=True)
    homoglyph_breakdown = Column(Text, default="{}") # e.g. {"0": "o", "1": "l", "rn": "m"}
    mx_records = Column(Text, default="[]")
    age_days = Column(Integer, nullable=True)
    is_suspicious = Column(Boolean, default=False)
    suspicious_reasons = Column(Text, default="[]")

    evidence = relationship("Evidence", back_populates="domain_intelligence")


class UrlIntel(Base):
    __tablename__ = "url_intel"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    original_url = Column(Text, nullable=False)
    defanged_url = Column(Text, nullable=False)
    domain = Column(String(255), index=True, nullable=False)
    tld = Column(String(32), nullable=True)
    is_https = Column(Boolean, default=True)
    is_ip_based_url = Column(Boolean, default=False)
    has_suspicious_params = Column(Boolean, default=False)
    is_shortener = Column(Boolean, default=False)
    is_suspicious = Column(Boolean, default=False)
    risk_score = Column(Float, default=0.0)
    risk_reasons = Column(Text, default="[]")

    evidence = relationship("Evidence", back_populates="urls")


class AttachmentRecord(Base):
    __tablename__ = "attachment_records"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(128), default="application/octet-stream")
    sha256 = Column(String(64), index=True, nullable=False)
    sha3_256 = Column(String(64), nullable=False)
    extension = Column(String(32), nullable=True)
    has_double_extension = Column(Boolean, default=False)
    is_executable_type = Column(Boolean, default=False)
    has_macro_indicators = Column(Boolean, default=False)
    is_suspicious = Column(Boolean, default=False)
    risk_factors = Column(Text, default="[]")

    evidence = relationship("Evidence", back_populates="attachments")


class AiThreatIntel(Base):
    __tablename__ = "ai_threat_intel"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    classification = Column(String(64), default="Unknown") # BEC, Credential Phishing, Financial Fraud, Wire Transfer Fraud, Executive Impersonation, Malware Delivery, Benign, Spam
    confidence = Column(Float, default=0.0) # 0.0 - 1.0
    intent_summary = Column(Text, nullable=True)
    urgency_level = Column(String(32), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    requested_action = Column(String(255), nullable=True)
    impersonated_executive = Column(String(255), nullable=True)
    impersonated_org = Column(String(255), nullable=True)
    financial_indicators = Column(Text, default="[]") # Payment amount, bank details, invoice refs
    signals = Column(Text, default="[]") # List of detected behavioural cues
    limitations = Column(Text, default="[\"Probabilistic AI inference - not definitive forensic proof\"]")
    model_name = Column(String(64), default="Heuristic-Transformer-Hybrid-v1")
    model_version = Column(String(32), default="1.4.0")
    pii_redacted_count = Column(Integer, default=0)

    evidence = relationship("Evidence", back_populates="ai_intel")


class ThreatScore(Base):
    __tablename__ = "threat_scores"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), unique=True, nullable=False)
    final_score = Column(Float, nullable=False) # 0 - 100
    risk_level = Column(String(32), nullable=False) # LOW (0-29), MEDIUM (30-69), HIGH (70-89), CRITICAL (90-100)
    confidence = Column(Float, default=0.85)
    
    # Sub-component scores
    auth_score = Column(Float, default=0.0)
    nlp_score = Column(Float, default=0.0)
    spoof_score = Column(Float, default=0.0)
    infra_score = Column(Float, default=0.0)
    url_score = Column(Float, default=0.0)
    attach_score = Column(Float, default=0.0)
    
    breakdown_json = Column(Text, default="{}") # { "+25": "Authentication inconsistency", ... }
    explanations_json = Column(Text, default="[]")
    recommended_actions_json = Column(Text, default="[]")

    evidence = relationship("Evidence", back_populates="threat_score")


class IOC(Base):
    __tablename__ = "iocs"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=False, index=True)
    ioc_type = Column(String(32), index=True, nullable=False) # ip, domain, url, sha256, email_address, asn
    value = Column(String(512), index=True, nullable=False)
    defanged_value = Column(String(512), nullable=False)
    confidence = Column(Float, default=0.90)
    source = Column(String(64), default="Email-Forensic-Pipeline")
    first_seen = Column(DateTime(timezone=True), default=utc_now)
    last_seen = Column(DateTime(timezone=True), default=utc_now)

    evidence = relationship("Evidence", back_populates="iocs")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(String(64), unique=True, index=True, nullable=False) # CAM-YYYY-XXXX
    name = Column(String(255), nullable=False)
    confidence = Column(Float, default=0.85)
    description = Column(Text, nullable=True)
    shared_iocs_json = Column(Text, default="[]")
    reasons_json = Column(Text, default="[]")
    first_seen = Column(DateTime(timezone=True), default=utc_now)
    last_seen = Column(DateTime(timezone=True), default=utc_now)


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(64), unique=True, index=True, nullable=False) # CASE-YYYY-XXXX
    title = Column(String(255), nullable=False)
    status = Column(String(32), default="OPEN", index=True) # OPEN, INVESTIGATING, ESCALATED, CLOSED
    severity = Column(String(32), default="HIGH", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    assigned_analyst = Column(String(128), default="Analyst-01")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    summary = Column(Text, nullable=True)

    evidence_list = relationship("Evidence", back_populates="case")
    notes = relationship("AnalystNote", back_populates="case", cascade="all, delete-orphan")


class AnalystNote(Base):
    __tablename__ = "analyst_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    evidence_id = Column(String(64), ForeignKey("evidence.evidence_id"), nullable=True)
    author = Column(String(128), default="Analyst")
    note = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    case = relationship("Case", back_populates="notes")
    evidence = relationship("Evidence", back_populates="notes")
