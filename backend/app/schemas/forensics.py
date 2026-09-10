from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SmtpHopSchema(BaseModel):
    hop_number: int
    timestamp: Optional[datetime]
    source_host: Optional[str]
    source_ip: Optional[str]
    is_private_ip: bool
    dest_host: Optional[str]
    protocol: Optional[str]
    tls_cipher: Optional[str]
    delay_seconds: float
    trust_level: str
    raw_header: Optional[str]

    class Config:
        from_attributes = True

class AuthResultSchema(BaseModel):
    spf_result: str
    spf_domain: Optional[str]
    spf_scope: Optional[str]
    dkim_result: str
    dkim_domain: Optional[str]
    dkim_selector: Optional[str]
    dkim_independent_verified: str
    dmarc_result: str
    dmarc_policy: str
    dmarc_alignment: str
    arc_result: str
    reported_by: Optional[str]
    trust_classification: str
    summary_explanation: Optional[str]

    class Config:
        from_attributes = True

class IpIntelSchema(BaseModel):
    ip: str
    classification: str
    is_private: bool
    country: str
    country_code: str
    city: str
    latitude: Optional[float]
    longitude: Optional[float]
    asn: str
    asn_org: str
    reverse_dns: str
    infra_type: str
    provider_status: str
    attribution_confidence: str

    class Config:
        from_attributes = True

class DomainIntelSchema(BaseModel):
    domain: str
    role: str
    target_brand: Optional[str]
    similarity_score: float
    similarity_algorithm: Optional[str]
    is_homoglyph: bool
    is_punycode: bool
    punycode_decoded: Optional[str]
    homoglyph_breakdown: str
    is_suspicious: bool
    suspicious_reasons: str

    class Config:
        from_attributes = True

class UrlIntelSchema(BaseModel):
    original_url: str
    defanged_url: str
    domain: str
    tld: Optional[str]
    is_https: bool
    is_ip_based_url: bool
    has_suspicious_params: bool
    is_shortener: bool
    is_suspicious: bool
    risk_score: float
    risk_reasons: str

    class Config:
        from_attributes = True

class AttachmentRecordSchema(BaseModel):
    filename: str
    file_size: int
    mime_type: str
    sha256: str
    sha3_256: str
    extension: Optional[str]
    has_double_extension: bool
    is_executable_type: bool
    has_macro_indicators: bool
    is_suspicious: bool
    risk_factors: str

    class Config:
        from_attributes = True

class AiThreatIntelSchema(BaseModel):
    classification: str
    confidence: float
    intent_summary: Optional[str]
    urgency_level: str
    requested_action: Optional[str]
    impersonated_executive: Optional[str]
    impersonated_org: Optional[str]
    financial_indicators: str
    signals: str
    limitations: str
    model_name: str
    model_version: str
    pii_redacted_count: int

    class Config:
        from_attributes = True

class ThreatScoreSchema(BaseModel):
    final_score: float
    risk_level: str
    confidence: float
    auth_score: float
    nlp_score: float
    spoof_score: float
    infra_score: float
    url_score: float
    attach_score: float
    breakdown_json: str
    explanations_json: str
    recommended_actions_json: str

    class Config:
        from_attributes = True

class IOCSchema(BaseModel):
    ioc_type: str
    value: str
    defanged_value: str
    confidence: float
    source: str

    class Config:
        from_attributes = True

class ChainOfCustodySchema(BaseModel):
    timestamp: datetime
    actor: str
    action: str
    hash_snapshot: str
    details: str

    class Config:
        from_attributes = True

class EvidenceDetailSchema(BaseModel):
    evidence_id: str
    sha256: str
    sha3_256: str
    md5: str
    filename: str
    file_size: int
    mime_type: str
    received_at: datetime
    status: str
    case_id: Optional[int]

    email_record: Optional[Any] = None
    smtp_hops: List[SmtpHopSchema] = []
    auth_result: Optional[AuthResultSchema] = None
    ip_intelligence: List[IpIntelSchema] = []
    domain_intelligence: List[DomainIntelSchema] = []
    urls: List[UrlIntelSchema] = []
    attachments: List[AttachmentRecordSchema] = []
    ai_intel: Optional[AiThreatIntelSchema] = None
    threat_score: Optional[ThreatScoreSchema] = None
    iocs: List[IOCSchema] = []
    custody_logs: List[ChainOfCustodySchema] = []

    class Config:
        from_attributes = True

class CopilotQueryRequest(BaseModel):
    query: str
    evidence_id: str

class AnalystNoteCreate(BaseModel):
    author: str
    note: str

class CaseCreate(BaseModel):
    title: str
    severity: str
    assigned_analyst: str
    summary: Optional[str] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_analyst: Optional[str] = None
    summary: Optional[str] = None
