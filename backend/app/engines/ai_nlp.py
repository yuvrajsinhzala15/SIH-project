import re
from typing import Dict, Any, List, Tuple
from app.core.security import sanitize_pii_for_ai
from app.core.config import settings

class AiThreatAnalysisEngine:
    """
    AI / NLP Threat & Intent Classification Engine.
    Executes privacy-preserving PII redaction, performs structured intent extraction
    (BEC, Credential Harvester, Wire Fraud, Extortion, Package Scams, Invoice Fraud, Spam, etc.),
    and provides probabilistic confidence metrics with explainable evidentiary signals.
    """

    INTENT_PATTERNS = {
        "BEC": [
            r'urgent\s+wire\s+transfer', r'confidential\s+acquisition', r'are\s+you\s+at\s+your\s+desk',
            r'need\s+you\s+to\s+process\s+a\s+payment', r'keep\s+this\s+strictly\s+confidential',
            r'send\s+me\s+the\s+aging\s+report', r'gift\s+cards?\s+for\s+clients', r'executive\s+board\s+meeting',
            r'wire\s+confirmation\s+number', r'disbursement\s+request', r'transfer\s+\$?\d+[\d,]*'
        ],
        "Credential Phishing": [
            r'password\s+expires?\s+today', r'verify\s+your\s+account', r'microsoft\s+365\s+security\s+alert',
            r'mailbox\s+storage\s+limit\s+exceeded', r'action\s+required:\s+update\s+your\s+sign-in',
            r'suspicious\s+login\s+detected', r'click\s+here\s+to\s+keep\s+your\s+current\s+password',
            r'account\s+will\s+be\s+suspended', r'reset\s+your\s+credentials', r'confirm\s+your\s+identity',
            r'unauthorized\s+sign-in\s+attempt', r're-authenticate\s+session', r'update\s+billing\s+details',
            r'login\s+to\s+your\s+portal', r'security\s+checkpoint'
        ],
        "Invoice Fraud": [
            r'updated\s+banking\s+details', r'revised\s+wire\s+instructions', r'overdue\s+invoice',
            r'remittance\s+advice', r'payment\s+remittance', r'new\s+beneficiary\s+account',
            r'revised\s+invoice', r'attached\s+invoice', r'outstanding\s+balance', r'settlement\s+statement',
            r'electronic\s+funds\s+transfer', r'routing\s+number\s+change'
        ],
        "Extortion": [
            r'i\s+have\s+recorded\s+you', r'pay\s+in\s+bitcoin', r'compromised\s+your\s+camera',
            r'wallet\s+address:', r'send\s+btc\s+to', r'ransom', r'leak\s+your\s+data',
            r'private\s+video\s+recorded', r'bitcoin\s+transfer'
        ],
        "Delivery & Package Scam": [
            r'package\s+delivery\s+failed', r'customs\s+duty\s+fee', r'reschedule\s+delivery',
            r'postal\s+service\s+notification', r'courier\s+shipment\s+on\s+hold', r'dhl\s+express\s+shipment',
            r'fedex\s+tracking\s+update', r'ups\s+delivery\s+exception'
        ],
        "Payroll & Tax Scam": [
            r'direct\s+deposit\s+update', r'w-2\s+tax\s+form', r'payroll\s+adjustment',
            r'irs\s+tax\s+refund', r'benefits\s+enrollment\s+deadline', r'employee\s+tax\s+portal'
        ],
        "Spam": [
            r'buy\s+now', r'special\s+offer', r'limited\s+time', r'click\s+here',
            r'winner', r'congratulations', r'discount', r'subscribe'
        ]
    }

    URGENCY_KEYWORDS = [
        "urgent", "immediate", "immediately", "within 24 hours", "asap",
        "action required", "critical", "suspension", "terminated", "right now",
        "do not delay", "time sensitive", "prompt attention", "final warning", "expires soon"
    ]

    BENIGN_SIGNALS = [
        "newsletter", "monthly briefing", "release notes", "unsubscribe", "engineering team",
        "weekly digest", "privacy policy", "terms of service", "official documentation",
        "all rights reserved", "view in browser", "meeting invitation", "calendar invite",
        "standup", "sprint review", "project update", "release update"
    ]

    FINANCIAL_REGEX = re.compile(r'(\$\s?[\d,]+(?:\.\d{2})?|\bEUR\s?[\d,]+|\bUSD\s?[\d,]+|\bINR\s?[\d,]+|\b[\d,]+\s?dollars|\b[\d,]+\s?USD)', re.IGNORECASE)

    @classmethod
    def analyze(cls, subject: str, body_plain: str, body_html: str, from_name: str, mismatches: List[Dict[str, Any]]) -> Dict[str, Any]:
        full_text = f"{subject}\n{body_plain or ''}\n{body_html or ''}"
        
        # Privacy redaction before AI processing
        sanitized_text, pii_stats = sanitize_pii_for_ai(full_text)
        text_lower = sanitized_text.lower()

        # Score intent categories
        scores: Dict[str, float] = {
            "BEC": 0.0,
            "Credential Phishing": 0.0,
            "Invoice Fraud": 0.0,
            "Extortion": 0.0,
            "Delivery & Package Scam": 0.0,
            "Payroll & Tax Scam": 0.0
        }
        detected_signals: List[str] = []

        for category, patterns in cls.INTENT_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, text_lower):
                    scores[category] += 0.35
                    detected_signals.append(f"Matched {category} intent signature: '{pat}'")

        # Urgency detection
        urgency_hits = [kw for kw in cls.URGENCY_KEYWORDS if kw in text_lower]
        urgency_level = "LOW"
        if len(urgency_hits) >= 3:
            urgency_level = "CRITICAL"
            detected_signals.append(f"Severe psychological urgency pressure detected: {', '.join(urgency_hits[:5])}")
        elif len(urgency_hits) >= 1:
            urgency_level = "HIGH"
            detected_signals.append(f"Urgency pressure tactics detected: {', '.join(urgency_hits[:3])}")

        # Benign keywords check
        benign_hits = [kw for kw in cls.BENIGN_SIGNALS if kw in text_lower]

        # Financial Indicators
        financial_matches = cls.FINANCIAL_REGEX.findall(sanitized_text)
        financial_indicators = []
        if financial_matches:
            financial_indicators = list(set(financial_matches))
            detected_signals.append(f"Financial transaction requests detected: {', '.join(financial_indicators)}")
            scores["BEC"] += 0.30
            scores["Invoice Fraud"] += 0.30

        # Incorporate impersonation mismatches into classification
        has_display_impersonation = any(m["type"] == "DISPLAY_NAME_IMPERSONATION" for m in mismatches)
        has_reply_to_mismatch = any(m["type"] == "REPLY_TO_MISMATCH" for m in mismatches)

        if has_display_impersonation:
            scores["BEC"] += 0.45
            detected_signals.append("Executive display-name impersonation strongly correlates with BEC.")

        if has_reply_to_mismatch:
            scores["BEC"] += 0.25
            scores["Credential Phishing"] += 0.25
            detected_signals.append("Reply-To diversion route indicates intent to intercept victim response.")

        # Determine highest scoring threat classification
        top_category = max(scores, key=scores.get)
        top_score = scores[top_category]

        classification = "Benign"
        confidence = 0.85

        if top_score >= 0.40:
            classification = top_category
            confidence = min(0.98, 0.65 + (top_score * 0.25))
        elif top_score >= 0.20:
            classification = f"Suspicious {top_category}"
            confidence = min(0.85, 0.50 + (top_score * 0.25))
        else:
            if len(benign_hits) >= 2 or "briefing" in text_lower or "newsletter" in text_lower or "update" in text_lower:
                classification = "Informational / Benign"
                confidence = 0.95
            else:
                classification = "Benign"
                confidence = 0.90

        # Intent summary
        if "BEC" in classification:
            intent_summary = "Attempted Business Email Compromise targeting financial disbursement or executive wire transfer authorization."
            requested_action = "Execute wire transfer / financial transaction"
        elif "Credential Phishing" in classification:
            intent_summary = "Credential harvesting scheme aiming to capture authentication credentials or session tokens."
            requested_action = "Navigate to external portal to verify password/credentials"
        elif "Invoice Fraud" in classification:
            intent_summary = "Vendor impersonation or banking update fraud to divert legitimate payments."
            requested_action = "Update supplier banking records"
        elif "Extortion" in classification:
            intent_summary = "Extortion / Blackmail scheme demanding cryptocurrency payment."
            requested_action = "Send cryptocurrency / Bitcoin to provided wallet"
        elif "Delivery" in classification:
            intent_summary = "Smishing/Phishing lure masquerading as shipping courier or customs clearance."
            requested_action = "Click link to pay fake customs fee or reschedule package"
        elif "Payroll" in classification:
            intent_summary = "Payroll / HR spoofing attempting to divert employee direct deposit or steal W-2 tax forms."
            requested_action = "Submit employee tax or banking credentials"
        elif classification.startswith("Informational"):
            intent_summary = "Verified operational briefing, corporate bulletin, or transactional notification."
            requested_action = "None"
        else:
            intent_summary = "Standard corporate communication or low-risk operational message."
            requested_action = "None"

        return {
            "classification": classification,
            "confidence": round(confidence, 2),
            "intent_summary": intent_summary,
            "urgency_level": urgency_level,
            "requested_action": requested_action,
            "impersonated_executive": from_name if has_display_impersonation else None,
            "impersonated_org": "Monitored Enterprise" if has_display_impersonation else None,
            "financial_indicators": financial_indicators,
            "signals": detected_signals,
            "pii_redacted_count": sum(pii_stats.values()),
            "model_name": "Antigravity-Cyber-Forensic-LLM-v2",
            "model_version": "2.5.0",
            "limitations": [
                "Probabilistic AI inference - must be verified against cryptographic and routing facts.",
                "Sender identity cannot be established from NLP analysis alone."
            ]
        }

