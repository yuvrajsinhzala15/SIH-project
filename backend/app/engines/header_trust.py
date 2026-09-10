from typing import List, Dict, Any

class HeaderTrustEngine:
    """
    Forensic Header Trust Classifier.
    Implements Section 12 (Header Trust Model) by categorizing email headers
    into forensic reliability tiers with evidentiary justification.
    """

    HIGH_TRUST_HEADERS = {
        "received", "authentication-results", "received-spf", "arc-seal",
        "arc-message-signature", "arc-authentication-results", "dkim-signature"
    }

    MEDIUM_TRUST_HEADERS = {
        "message-id", "date", "return-path", "to", "cc", "bcc", "content-type",
        "mime-version", "content-transfer-encoding"
    }

    LOWER_TRUST_HEADERS = {
        "x-originating-ip", "x-mailer", "user-agent", "x-sender", "x-php-script",
        "x-priority", "x-msmail-priority", "from", "reply-to", "subject"
    }

    @classmethod
    def classify_header(cls, header_name: str) -> Dict[str, str]:
        name_lower = header_name.strip().lower()

        if name_lower in cls.HIGH_TRUST_HEADERS:
            return {
                "trust_level": "HIGH_TRUST",
                "explanation": "Added or verified by receiving/intermediate MTAs or cryptographic digital signatures. High forensic evidentiary value."
            }
        elif name_lower in cls.MEDIUM_TRUST_HEADERS:
            return {
                "trust_level": "MEDIUM_TRUST",
                "explanation": "Standard protocol metadata. Moderately reliable, but can be influenced by transmitting client software."
            }
        elif name_lower.startswith("x-") or name_lower in cls.LOWER_TRUST_HEADERS:
            return {
                "trust_level": "LOWER_TRUST",
                "explanation": "Client-controlled or custom header. Highly susceptible to spoofing, forging, or arbitrary modification."
            }
        else:
            return {
                "trust_level": "LOWER_TRUST",
                "explanation": "Unrecognized or non-standard header. Must not be used as standalone forensic proof of origin."
            }

    @classmethod
    def evaluate_headers(cls, raw_headers: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        annotated = []
        for h in raw_headers:
            classification = cls.classify_header(h["name"])
            annotated.append({
                "name": h["name"],
                "value": h["value"],
                "trust_level": classification["trust_level"],
                "explanation": classification["explanation"]
            })
        return annotated
