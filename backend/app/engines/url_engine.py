import re
from urllib.parse import urlparse, parse_qs
from typing import List, Dict, Any, Set
from app.core.security import defang_url

class UrlForensicsEngine:
    """
    URL Forensic Extraction & Safe Analysis Engine.
    Implements Section 22 by extracting, normalizing, and defanging all URLs,
    detecting IP-based URLs, URL shorteners, credential-harvesting parameters,
    and evaluating link-level threat risk without performing unsafe network fetches (SSRF defense).
    """

    URL_REGEX = re.compile(
        r'(?:https?:\/\/|www\.)[^\s<>"\'\)\(\]]+',
        re.IGNORECASE
    )

    SHORTENER_DOMAINS = {
        "bit.ly", "tinyurl.com", "t.co", "is.gd", "ow.ly", "buff.ly",
        "rebrand.ly", "cutt.ly", "soo.gd", "qr.ae", "tiny.cc"
    }

    SUSPICIOUS_PARAM_KEYS = {
        "email", "mail", "user", "username", "login", "account",
        "redirect", "return", "next", "token", "auth", "session", "pass"
    }

    SUSPICIOUS_TLDS = {
        "xyz", "top", "work", "click", "buzz", "cfd", "rest", "cam",
        "icu", "fit", "tk", "ml", "ga", "cf", "gq"
    }

    @classmethod
    def extract_and_analyze_urls(cls, body_plain: str, body_html: str) -> List[Dict[str, Any]]:
        combined_text = f"{body_plain or ''}\n{body_html or ''}"
        raw_urls = set(cls.URL_REGEX.findall(combined_text))
        results = []

        for raw_url in raw_urls:
            # Clean trailing punctuation
            clean_url = raw_url.rstrip('.,;:"\')]>')
            if clean_url.startswith("www."):
                clean_url = "http://" + clean_url

            parsed = urlparse(clean_url)
            domain = parsed.netloc.lower().split(":")[0]
            if not domain:
                continue

            defanged = defang_url(clean_url)
            tld = domain.split(".")[-1] if "." in domain else ""

            # Check if domain is an IP address
            is_ip_based = bool(re.match(r'^(?:\d{1,3}\.){3}\d{1,3}$', domain))
            is_shortener = domain in cls.SHORTENER_DOMAINS
            
            # Analyze query parameters
            query_params = parse_qs(parsed.query)
            has_suspicious_params = False
            for param in query_params:
                if param.lower() in cls.SUSPICIOUS_PARAM_KEYS:
                    has_suspicious_params = True
                    break

            # Risk calculation
            risk_score = 0.0
            reasons = []

            if is_ip_based:
                risk_score += 40.0
                reasons.append("Direct IP address used in URL hostname instead of valid domain name.")

            if is_shortener:
                risk_score += 30.0
                reasons.append("URL shortener service obfuscates ultimate destination.")

            if has_suspicious_params:
                risk_score += 25.0
                reasons.append(f"URL contains targeted parameters ({list(query_params.keys())}) commonly used in credential harvesting.")

            if tld in cls.SUSPICIOUS_TLDS:
                risk_score += 20.0
                reasons.append(f"High-risk Top-Level Domain (.{tld}) with high historical abuse rates.")

            if not parsed.scheme or parsed.scheme.lower() == "http":
                risk_score += 15.0
                reasons.append("Insecure plain HTTP protocol used for sensitive target link.")

            # Look for keyword spoofing inside path or subdomain (e.g. login.microsoft.com.attacker.com)
            if "login" in parsed.path.lower() or "signin" in parsed.path.lower() or "verify" in parsed.path.lower():
                risk_score += 20.0
                reasons.append(f"Path '{parsed.path}' contains authentication harvesting keywords.")

            risk_score = min(100.0, risk_score)
            is_suspicious = risk_score >= 40.0

            results.append({
                "original_url": clean_url,
                "defanged_url": defanged,
                "domain": domain,
                "tld": tld,
                "is_https": parsed.scheme.lower() == "https",
                "is_ip_based_url": is_ip_based,
                "has_suspicious_params": has_suspicious_params,
                "is_shortener": is_shortener,
                "is_suspicious": is_suspicious,
                "risk_score": round(risk_score, 1),
                "risk_reasons": reasons
            })

        return results
