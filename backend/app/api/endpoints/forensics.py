import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Evidence, Case, AnalystNote, ChainOfCustody, IOC, IpIntel, DomainIntel, UrlIntel
from app.services.pipeline import ForensicPipelineService
from app.engines.stix_generator import Stix21Generator
from app.engines.report_generator import ForensicReportGenerator
from app.engines.correlation import CorrelationEngine
from app.engines.copilot import ForensicCopilotEngine
from app.schemas.forensics import CopilotQueryRequest, AnalystNoteCreate, CaseCreate, CaseUpdate
from app.samples.seeder import seed_database

router = APIRouter()

@router.post("/evidence/upload")
async def upload_evidence(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    filename: Optional[str] = Form("uploaded_evidence.eml"),
    case_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Ingests and parses email artifact (.eml, raw RFC 822 text).
    Computes SHA-256 / SHA-3-256 hashes and runs full analytical pipeline.
    """
    content = b""
    fname = filename or "uploaded_evidence.eml"

    if file:
        content = await file.read()
        fname = file.filename or filename or "uploaded_evidence.eml"
    elif raw_text and raw_text.strip():
        content = raw_text.encode("utf-8")
        fname = filename or "raw_headers_input.eml"
    else:
        raise HTTPException(status_code=400, detail="Either file upload or non-empty raw_text is required.")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Cannot analyze an empty (0-byte) evidence file.")

    evidence = ForensicPipelineService.ingest_and_analyze(
        db=db,
        raw_bytes=content,
        filename=fname,
        actor="SOC_ANALYST_WEB_INGEST",
        case_id=case_id
    )

    return {
        "status": "SUCCESS",
        "evidence_id": evidence.evidence_id,
        "sha256": evidence.sha256,
        "sha3_256": evidence.sha3_256,
        "filename": evidence.filename,
        "message": "Evidence cryptographically preserved and analyzed."
    }

@router.post("/evidence/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seeds sample forensic cases and emails for demonstration."""
    seed_database(db)
    return {"status": "SUCCESS", "message": "Demo forensic evidence loaded."}

@router.get("/evidence")
def list_evidence(db: Session = Depends(get_db)):
    """Lists all ingested evidence items with threat scores and classifications."""
    evidences = db.query(Evidence).order_by(Evidence.id.desc()).all()
    results = []
    for ev in evidences:
        score_val = ev.threat_score.final_score if ev.threat_score else 0.0
        risk_val = ev.threat_score.risk_level if ev.threat_score else "LOW"
        classification_val = ev.ai_intel.classification if ev.ai_intel else "Unknown"
        sender_val = ev.email_record.from_addr if ev.email_record else "Unknown"
        subject_val = ev.email_record.subject if ev.email_record else "No Subject"

        results.append({
            "evidence_id": ev.evidence_id,
            "filename": ev.filename,
            "file_size": ev.file_size,
            "sha256": ev.sha256,
            "received_at": ev.received_at.isoformat() if ev.received_at else None,
            "status": ev.status,
            "subject": subject_val,
            "from_addr": sender_val,
            "final_score": score_val,
            "risk_level": risk_val,
            "classification": classification_val,
            "case_id": ev.case_id
        })
    return results

@router.get("/evidence/{evidence_id}")
def get_evidence_details(evidence_id: str, db: Session = Depends(get_db)):
    """Returns complete forensic intelligence for a specific evidence record."""
    ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Evidence with ID '{evidence_id}' not found.")

    email_rec = ev.email_record
    auth_rec = ev.auth_result
    ai_rec = ev.ai_intel
    threat_rec = ev.threat_score

    # Parse JSON fields safely
    raw_headers = json.loads(email_rec.raw_headers_json) if (email_rec and email_rec.raw_headers_json) else []
    score_breakdown = json.loads(threat_rec.breakdown_json) if (threat_rec and threat_rec.breakdown_json) else []
    recommended_actions = json.loads(threat_rec.recommended_actions_json) if (threat_rec and threat_rec.recommended_actions_json) else []

    return {
        "evidence_id": ev.evidence_id,
        "sha256": ev.sha256,
        "sha3_256": ev.sha3_256,
        "md5": ev.md5,
        "filename": ev.filename,
        "file_size": ev.file_size,
        "mime_type": ev.mime_type,
        "received_at": ev.received_at.isoformat() if ev.received_at else None,
        "status": ev.status,
        "case_id": ev.case_id,
        
        # Email Info
        "subject": email_rec.subject if email_rec else "",
        "from_addr": email_rec.from_addr if email_rec else "",
        "from_name": email_rec.from_name if email_rec else "",
        "to_addr": email_rec.to_addr if email_rec else "",
        "cc_addr": email_rec.cc_addr if email_rec else "",
        "reply_to": email_rec.reply_to if email_rec else "",
        "return_path": email_rec.return_path if email_rec else "",
        "message_id": email_rec.message_id if email_rec else "",
        "date_header": email_rec.date_header if email_rec else "",
        "user_agent": email_rec.user_agent if email_rec else "",
        "x_originating_ip": email_rec.x_originating_ip if email_rec else "",
        "body_plain": email_rec.body_plain if email_rec else "",
        "body_html": email_rec.body_html if email_rec else "",
        "raw_headers": raw_headers,

        # SMTP Hops
        "smtp_hops": [{
            "hop_number": h.hop_number,
            "timestamp": h.timestamp.isoformat() if h.timestamp else None,
            "source_host": h.source_host,
            "source_ip": h.source_ip,
            "is_private_ip": h.is_private_ip,
            "dest_host": h.dest_host,
            "protocol": h.protocol,
            "tls_cipher": h.tls_cipher,
            "delay_seconds": h.delay_seconds,
            "trust_level": h.trust_level,
            "raw_header": h.raw_header
        } for h in (ev.smtp_hops or [])],

        # Auth
        "auth": {
            "spf_result": auth_rec.spf_result if auth_rec else "UNKNOWN",
            "spf_domain": auth_rec.spf_domain if auth_rec else "",
            "spf_scope": auth_rec.spf_scope if auth_rec else "",
            "dkim_result": auth_rec.dkim_result if auth_rec else "UNKNOWN",
            "dkim_domain": auth_rec.dkim_domain if auth_rec else "",
            "dkim_selector": auth_rec.dkim_selector if auth_rec else "",
            "dkim_independent_verified": auth_rec.dkim_independent_verified if auth_rec else "NOT_PERFORMED",
            "dmarc_result": auth_rec.dmarc_result if auth_rec else "UNKNOWN",
            "dmarc_policy": auth_rec.dmarc_policy if auth_rec else "none",
            "dmarc_alignment": auth_rec.dmarc_alignment if auth_rec else "UNKNOWN",
            "arc_result": auth_rec.arc_result if auth_rec else "NONE",
            "reported_by": auth_rec.reported_by if auth_rec else "",
            "trust_classification": auth_rec.trust_classification if auth_rec else "",
            "summary_explanation": auth_rec.summary_explanation if auth_rec else ""
        } if auth_rec else {},

        # IP Intel
        "ips": [{
            "ip": ip.ip,
            "classification": ip.classification,
            "is_private": ip.is_private,
            "country": ip.country,
            "country_code": ip.country_code,
            "city": ip.city,
            "latitude": ip.latitude,
            "longitude": ip.longitude,
            "asn": ip.asn,
            "asn_org": ip.asn_org,
            "reverse_dns": ip.reverse_dns,
            "infra_type": ip.infra_type,
            "provider_status": ip.provider_status,
            "attribution_confidence": ip.attribution_confidence
        } for ip in (ev.ip_intelligence or [])],

        # Domain Intel
        "domains": [{
            "domain": d.domain,
            "role": d.role,
            "target_brand": d.target_brand,
            "similarity_score": d.similarity_score,
            "similarity_algorithm": d.similarity_algorithm,
            "is_homoglyph": d.is_homoglyph,
            "is_punycode": d.is_punycode,
            "punycode_decoded": d.punycode_decoded,
            "homoglyph_breakdown": json.loads(d.homoglyph_breakdown) if d.homoglyph_breakdown else {},
            "is_suspicious": d.is_suspicious,
            "reasons": json.loads(d.suspicious_reasons) if d.suspicious_reasons else []
        } for d in (ev.domain_intelligence or [])],

        # URLs
        "urls": [{
            "original_url": u.original_url,
            "defanged_url": u.defanged_url,
            "domain": u.domain,
            "tld": u.tld,
            "is_https": u.is_https,
            "is_ip_based_url": u.is_ip_based_url,
            "has_suspicious_params": u.has_suspicious_params,
            "is_shortener": u.is_shortener,
            "is_suspicious": u.is_suspicious,
            "risk_score": u.risk_score,
            "risk_reasons": json.loads(u.risk_reasons) if u.risk_reasons else []
        } for u in (ev.urls or [])],

        # Attachments
        "attachments": [{
            "filename": a.filename,
            "file_size": a.file_size,
            "mime_type": a.mime_type,
            "sha256": a.sha256,
            "sha3_256": a.sha3_256,
            "extension": a.extension,
            "has_double_extension": a.has_double_extension,
            "is_executable_type": a.is_executable_type,
            "has_macro_indicators": a.has_macro_indicators,
            "is_suspicious": a.is_suspicious,
            "risk_factors": json.loads(a.risk_factors) if a.risk_factors else []
        } for a in (ev.attachments or [])],

        # AI Threat Intel
        "ai_intel": {
            "classification": ai_rec.classification if ai_rec else "Unknown",
            "confidence": ai_rec.confidence if ai_rec else 0.0,
            "intent_summary": ai_rec.intent_summary if ai_rec else "",
            "urgency_level": ai_rec.urgency_level if ai_rec else "LOW",
            "requested_action": ai_rec.requested_action if ai_rec else "None",
            "impersonated_executive": ai_rec.impersonated_executive if ai_rec else None,
            "impersonated_org": ai_rec.impersonated_org if ai_rec else None,
            "financial_indicators": json.loads(ai_rec.financial_indicators) if (ai_rec and ai_rec.financial_indicators) else [],
            "signals": json.loads(ai_rec.signals) if (ai_rec and ai_rec.signals) else [],
            "limitations": json.loads(ai_rec.limitations) if (ai_rec and ai_rec.limitations) else [],
            "model_name": ai_rec.model_name if ai_rec else "",
            "model_version": ai_rec.model_version if ai_rec else "",
            "pii_redacted_count": ai_rec.pii_redacted_count if ai_rec else 0
        } if ai_rec else {},

        # Threat Score
        "threat_score": {
            "final_score": threat_rec.final_score if threat_rec else 0.0,
            "risk_level": threat_rec.risk_level if threat_rec else "LOW",
            "confidence": threat_rec.confidence if threat_rec else 0.85,
            "component_scores": {
                "authentication_risk": threat_rec.auth_score if threat_rec else 0.0,
                "nlp_intent_risk": threat_rec.nlp_score if threat_rec else 0.0,
                "impersonation_risk": threat_rec.spoof_score if threat_rec else 0.0,
                "infrastructure_risk": threat_rec.infra_score if threat_rec else 0.0,
                "url_risk": threat_rec.url_score if threat_rec else 0.0,
                "attachment_risk": threat_rec.attach_score if threat_rec else 0.0
            },
            "breakdown": score_breakdown,
            "recommended_actions": recommended_actions
        } if threat_rec else {},

        # IOCs
        "iocs": [{
            "ioc_type": i.ioc_type,
            "value": i.value,
            "defanged_value": i.defanged_value,
            "confidence": i.confidence,
            "source": i.source
        } for i in (ev.iocs or [])],

        # Chain of Custody
        "custody_logs": [{
            "timestamp": c.timestamp.isoformat(),
            "actor": c.actor,
            "action": c.action,
            "hash_snapshot": c.hash_snapshot,
            "details": json.loads(c.details) if c.details else {}
        } for c in (ev.custody_logs or [])]
    }

@router.delete("/evidence/{evidence_id}")
def delete_evidence(evidence_id: str, db: Session = Depends(get_db)):
    """
    Deletes an evidence artifact and cascades to all child analysis records.
    """
    ev = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Evidence with ID '{evidence_id}' not found.")

    db.delete(ev)
    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Evidence '{evidence_id}' and all associated forensic data successfully deleted."
    }

@router.get("/evidence/{evidence_id}/stix")
def export_stix_bundle(evidence_id: str, db: Session = Depends(get_db)):
    """Exports evidence artifacts and indicators as an OASIS STIX 2.1 JSON bundle."""
    details = get_evidence_details(evidence_id, db)
    bundle = Stix21Generator.generate_bundle(details)
    return Response(
        content=json.dumps(bundle, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={evidence_id}_stix21.json"}
    )

@router.get("/evidence/{evidence_id}/report")
def export_html_report(evidence_id: str, db: Session = Depends(get_db)):
    """Generates and returns full HTML printable forensic dossier."""
    details = get_evidence_details(evidence_id, db)
    html_content = ForensicReportGenerator.generate_html_report(details)
    return Response(content=html_content, media_type="text/html")

@router.post("/copilot/query")
def query_copilot(req: CopilotQueryRequest, db: Session = Depends(get_db)):
    """Provides grounded contextual answers for SOC analysts."""
    details = get_evidence_details(req.evidence_id, db)
    # Find earliest external hop
    earliest_hop = next((h for h in details.get("smtp_hops", []) if h.get("source_ip") and not h.get("is_private_ip")), None)
    if earliest_hop:
        details["earliest_external_hop"] = {
            "ip": earliest_hop.get("source_ip"),
            "host": earliest_hop.get("source_host"),
            "hop_number": earliest_hop.get("hop_number")
        }
    answer = ForensicCopilotEngine.answer_query(req.query, details)
    return answer

@router.get("/graph")
def get_attack_graph(db: Session = Depends(get_db)):
    """Builds and returns the comprehensive cross-email attack correlation graph."""
    evidences = db.query(Evidence).all()
    evidence_payloads = []
    for ev in evidences:
        try:
            evidence_payloads.append(get_evidence_details(ev.evidence_id, db))
        except Exception:
            continue
    graph = CorrelationEngine.build_threat_graph(evidence_payloads)
    return graph

@router.get("/cases")
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.id.desc()).all()
    results = []
    for c in cases:
        results.append({
            "id": c.id,
            "case_id": c.case_id,
            "title": c.title,
            "status": c.status,
            "severity": c.severity,
            "assigned_analyst": c.assigned_analyst,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "summary": c.summary,
            "evidence_count": len(c.evidence_list or [])
        })
    return results

@router.post("/cases")
def create_case(case_in: CaseCreate, db: Session = Depends(get_db)):
    case_count = db.query(Case).count() + 1
    new_case = Case(
        case_id=f"CASE-2026-{case_count:04d}",
        title=case_in.title,
        severity=case_in.severity,
        assigned_analyst=case_in.assigned_analyst,
        summary=case_in.summary
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return {
        "status": "SUCCESS",
        "case_id": new_case.case_id,
        "title": new_case.title,
        "status_code": 200
    }

@router.get("/cases/{case_id_str}")
def get_case(case_id_str: str, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.case_id == case_id_str).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id_str}' not found.")
    return {
        "id": c.id,
        "case_id": c.case_id,
        "title": c.title,
        "status": c.status,
        "severity": c.severity,
        "assigned_analyst": c.assigned_analyst,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "summary": c.summary,
        "evidence": [{
            "evidence_id": ev.evidence_id,
            "filename": ev.filename,
            "score": ev.threat_score.final_score if ev.threat_score else 0,
            "risk": ev.threat_score.risk_level if ev.threat_score else "LOW"
        } for ev in (c.evidence_list or [])],
        "notes": [{
            "author": n.author,
            "note": n.note,
            "created_at": n.created_at.isoformat() if n.created_at else None
        } for n in (c.notes or [])]
    }

@router.put("/cases/{case_id_str}")
def update_case(case_id_str: str, case_in: CaseUpdate, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.case_id == case_id_str).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id_str}' not found.")

    if case_in.title is not None:
        c.title = case_in.title
    if case_in.status is not None:
        c.status = case_in.status
    if case_in.severity is not None:
        c.severity = case_in.severity
    if case_in.assigned_analyst is not None:
        c.assigned_analyst = case_in.assigned_analyst
    if case_in.summary is not None:
        c.summary = case_in.summary

    db.commit()
    return {
        "status": "SUCCESS",
        "case_id": c.case_id,
        "message": f"Case '{case_id_str}' successfully updated."
    }

@router.delete("/cases/{case_id_str}")
def delete_case(case_id_str: str, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.case_id == case_id_str).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id_str}' not found.")

    # Detach linked evidence
    for ev in c.evidence_list or []:
        ev.case_id = None

    db.delete(c)
    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Case '{case_id_str}' deleted."
    }

@router.post("/cases/{case_id_str}/notes")
def add_case_note(case_id_str: str, note_in: AnalystNoteCreate, db: Session = Depends(get_db)):
    c = db.query(Case).filter(Case.case_id == case_id_str).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id_str}' not found.")
    note = AnalystNote(
        case_id=c.id,
        author=note_in.author,
        note=note_in.note
    )
    db.add(note)
    db.commit()
    return {"status": "SUCCESS", "message": "Note added to case file."}

@router.get("/search")
def global_search(q: str = Query("", min_length=0), db: Session = Depends(get_db)):
    """Universal case-insensitive forensic search across IPs, Domains, URLs, Hashes, Cases, and Senders."""
    query = q.strip().lower()
    if not query:
        return {"query": "", "total_matches": 0, "results": []}

    results = []

    # Search IOCs (case-insensitive)
    iocs = db.query(IOC).filter(func.lower(IOC.value).contains(query)).limit(20).all()
    for i in iocs:
        results.append({
            "category": "Indicator of Compromise (IOC)",
            "type": i.ioc_type,
            "value": i.value,
            "evidence_id": i.evidence_id,
            "source": i.source
        })

    # Search Evidences (ID, filename, SHA-256)
    evs = db.query(Evidence).filter(
        (func.lower(Evidence.evidence_id).contains(query)) |
        (func.lower(Evidence.filename).contains(query)) |
        (func.lower(Evidence.sha256).contains(query))
    ).limit(10).all()
    for ev in evs:
        results.append({
            "category": "Evidence Artifact",
            "type": "evidence",
            "value": f"[{ev.evidence_id}] {ev.filename}",
            "evidence_id": ev.evidence_id,
            "source": f"SHA-256: {ev.sha256[:16]}..."
        })

    # Search Cases
    cases = db.query(Case).filter(
        (func.lower(Case.case_id).contains(query)) |
        (func.lower(Case.title).contains(query))
    ).limit(5).all()
    for c in cases:
        results.append({
            "category": "Investigation Case",
            "type": "case",
            "value": f"[{c.case_id}] {c.title}",
            "evidence_id": None,
            "source": f"Severity: {c.severity}"
        })

    return {"query": q, "total_matches": len(results), "results": results}
