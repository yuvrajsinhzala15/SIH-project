from sqlalchemy.orm import Session
from app.db.models import Case, Evidence
from app.services.pipeline import ForensicPipelineService
from app.samples.samples import (
    SAMPLE_BEC_EML, SAMPLE_CREDENTIAL_PHISHING_EML,
    SAMPLE_INVOICE_FRAUD_EML, SAMPLE_BENIGN_EML
)

def seed_database(db: Session):
    """
    Seeds database with initial cases and high-fidelity forensic sample emails.
    """
    if db.query(Evidence).count() > 0:
        return

    # Create Case 1: Executive Impersonation & Wire Fraud
    case1 = Case(
        case_id="CASE-2026-0001",
        title="Active Executive BEC & Wire Fraud Campaign (Project Titan)",
        status="INVESTIGATING",
        severity="CRITICAL",
        assigned_analyst="Senior Analyst Miller (SOC-T3)",
        summary="Multiple coordinated executive impersonation attempts targeting corporate finance officers with urgent wire transfer requests."
    )
    db.add(case1)
    db.flush()

    # Create Case 2: Credential Phishing & Password Reset Campaign
    case2 = Case(
        case_id="CASE-2026-0002",
        title="Office 365 Password Expiration Credential Harvesting",
        status="OPEN",
        severity="HIGH",
        assigned_analyst="Analyst Chen (SOC-T2)",
        summary="Lookalike domain rnicrosoft-security.com hosting credential harvest portals."
    )
    db.add(case2)
    db.flush()

    # Ingest Sample 1: BEC Wire Transfer
    ForensicPipelineService.ingest_and_analyze(
        db=db,
        raw_bytes=SAMPLE_BEC_EML.encode("utf-8"),
        filename="suspicious_ceo_wire_transfer.eml",
        actor="INGEST_GATEWAY_DEMO",
        case_id=case1.id
    )

    # Ingest Sample 2: Credential Harvester Phishing
    ForensicPipelineService.ingest_and_analyze(
        db=db,
        raw_bytes=SAMPLE_CREDENTIAL_PHISHING_EML.encode("utf-8"),
        filename="office365_password_alert.eml",
        actor="INGEST_GATEWAY_DEMO",
        case_id=case2.id
    )

    # Ingest Sample 3: Invoice Fraud with Malicious Attachment
    ForensicPipelineService.ingest_and_analyze(
        db=db,
        raw_bytes=SAMPLE_INVOICE_FRAUD_EML.encode("utf-8"),
        filename="revised_remittance_inv8941.eml",
        actor="INGEST_GATEWAY_DEMO",
        case_id=case1.id
    )

    # Ingest Sample 4: Benign Corporate Communication
    ForensicPipelineService.ingest_and_analyze(
        db=db,
        raw_bytes=SAMPLE_BENIGN_EML.encode("utf-8"),
        filename="azure_cloud_monthly_briefing.eml",
        actor="INGEST_GATEWAY_DEMO"
    )

    db.commit()
