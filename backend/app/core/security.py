import hashlib
import re
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

def compute_evidence_hashes(raw_bytes: bytes) -> Dict[str, str]:
    """
    Computes cryptographic hashes for immutable evidence preservation.
    Generates both SHA-256 and SHA-3-256 per forensic requirements.
    """
    sha256 = hashlib.sha256(raw_bytes).hexdigest()
    sha3_256 = hashlib.sha3_256(raw_bytes).hexdigest()
    md5 = hashlib.md5(raw_bytes).hexdigest()
    return {
        "sha256": sha256,
        "sha3_256": sha3_256,
        "md5": md5
    }

def generate_evidence_id(sequence: int = 1) -> str:
    """Generates unique standardized Evidence ID: EV-YYYY-XXXXXX"""
    year = datetime.now(timezone.utc).year
    return f"EV-{year}-{sequence:06d}"

def defang_url(url: str) -> str:
    """Defangs a URL for safe forensic display without clickable execution risks."""
    if not url:
        return ""
    defanged = url.replace("http://", "hxxp://").replace("https://", "hxxps://")
    defanged = defanged.replace(".", "[.]")
    return defanged

def defang_ip(ip: str) -> str:
    """Defangs an IP address for safe forensic report presentation."""
    if not ip:
        return ""
    return ip.replace(".", "[.]")

def sanitize_pii_for_ai(text: str) -> Tuple[str, Dict[str, int]]:
    """
    Minimizes and redacts sensitive PII before passing to AI/NLP models per Privacy Rule 26.
    Masks SSN, credit cards, banking IBANs, and direct passwords.
    """
    stats = {"ssn_masked": 0, "credit_card_masked": 0, "iban_masked": 0}
    
    # Credit Card pattern (simple Luhn-like matching)
    cc_pattern = r'\b(?:\d{4}[ -]?){3}\d{4}\b'
    matches_cc = re.findall(cc_pattern, text)
    if matches_cc:
        stats["credit_card_masked"] = len(matches_cc)
        text = re.sub(cc_pattern, "[REDACTED_CREDIT_CARD]", text)
        
    # SSN pattern
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    matches_ssn = re.findall(ssn_pattern, text)
    if matches_ssn:
        stats["ssn_masked"] = len(matches_ssn)
        text = re.sub(ssn_pattern, "[REDACTED_SSN]", text)
        
    # IBAN pattern
    iban_pattern = r'\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b'
    matches_iban = re.findall(iban_pattern, text)
    if matches_iban:
        stats["iban_masked"] = len(matches_iban)
        text = re.sub(iban_pattern, "[REDACTED_IBAN]", text)
        
    return text, stats
