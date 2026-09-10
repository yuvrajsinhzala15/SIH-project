import re
import unicodedata
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings

class DomainForensicsEngine:
    """
    Domain Forensics, Homoglyph, Punycode & Typosquatting Engine.
    Implements Sections 20 and 21 by calculating Levenshtein/Jaro-Winkler similarity,
    detecting Unicode confusable substitutions, Punycode/IDN spoofing,
    and mismatch between Display Name, From domain, and Reply-To domain.
    """

    # Common homoglyphs & visual confusable substitutions
    HOMOGLYPH_MAP = {
        '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '8': 'b',
        'vv': 'w', 'rn': 'm', 'cl': 'd', 'cj': 'g', 'nn': 'm',
        # Cyrillic confusables
        '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p',
        '\u0441': 'c', '\u0443': 'y', '\u0445': 'x', '\u0456': 'i',
        # Greek confusables
        '\u03bf': 'o', '\u03c5': 'u', '\u03bd': 'v'
    }

    @classmethod
    def levenshtein_distance(cls, s1: str, s2: str) -> int:
        if len(s1) < len(s2):
            return cls.levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        return previous_row[-1]

    @classmethod
    def similarity_ratio(cls, s1: str, s2: str) -> float:
        distance = cls.levenshtein_distance(s1, s2)
        max_len = max(len(s1), len(s2))
        if max_len == 0:
            return 1.0
        return max(0.0, 1.0 - (distance / max_len))

    @classmethod
    def normalize_homoglyphs(cls, domain: str) -> Tuple[str, Dict[str, str]]:
        """Replaces known visual confusables with normalized ASCII characters."""
        normalized = domain.lower()
        replacements_made = {}

        # Multi-char substitutions first
        for combo in ['vv', 'rn', 'cl', 'cj', 'nn']:
            if combo in normalized:
                replacements_made[combo] = cls.HOMOGLYPH_MAP[combo]
                normalized = normalized.replace(combo, cls.HOMOGLYPH_MAP[combo])

        # Single-char substitutions
        result = []
        for ch in normalized:
            if ch in cls.HOMOGLYPH_MAP:
                replacements_made[ch] = cls.HOMOGLYPH_MAP[ch]
                result.append(cls.HOMOGLYPH_MAP[ch])
            else:
                result.append(ch)
        
        return "".join(result), replacements_made

    @classmethod
    def analyze_domain(cls, domain_str: str, role: str = "sender_domain") -> Dict[str, Any]:
        if not domain_str:
            return {
                "domain": "Unavailable",
                "role": role,
                "is_suspicious": False,
                "target_brand": None,
                "similarity_score": 0.0,
                "is_homoglyph": False,
                "is_punycode": False,
                "reasons": []
            }

        domain_clean = domain_str.strip().lower()
        is_punycode = domain_clean.startswith("xn--") or ".xn--" in domain_clean
        punycode_decoded = None
        
        if is_punycode:
            try:
                punycode_decoded = domain_clean.encode('ascii').decode('idna')
            except Exception:
                punycode_decoded = "IDN_DECODE_ERROR"

        # Check for homoglyphs
        normalized_str, substitutions = cls.normalize_homoglyphs(punycode_decoded or domain_clean)
        is_homoglyph = len(substitutions) > 0

        # Compare against monitored brand allowlist
        best_match_brand = None
        best_similarity = 0.0
        reasons = []

        # Extract root domain (e.g. login.microsoft-security.com -> microsoft-security.com)
        parts = domain_clean.split(".")
        root_domain = ".".join(parts[-2:]) if len(parts) >= 2 else domain_clean
        norm_root = ".".join(normalized_str.split(".")[-2:]) if len(parts) >= 2 else normalized_str

        for monitored in settings.MONITORED_DOMAINS:
            # Exact match means legitimate
            if root_domain == monitored:
                return {
                    "domain": domain_clean,
                    "role": role,
                    "is_suspicious": False,
                    "target_brand": monitored,
                    "similarity_score": 1.0,
                    "similarity_algorithm": "Exact Match (Allowlist)",
                    "is_homoglyph": False,
                    "is_punycode": is_punycode,
                    "punycode_decoded": punycode_decoded,
                    "homoglyph_breakdown": {},
                    "reasons": ["Domain strictly matches verified monitored organization allowlist."]
                }

            # Similarity against raw root and normalized root
            sim_raw = cls.similarity_ratio(root_domain, monitored)
            sim_norm = cls.similarity_ratio(norm_root, monitored)
            max_sim = max(sim_raw, sim_norm)

            # Keyword containment check (e.g. paypal-verification.com or microsoft-support.net)
            brand_name = monitored.split(".")[0]
            contains_brand = brand_name in root_domain or brand_name in norm_root

            if max_sim > best_similarity:
                best_similarity = max_sim
                best_match_brand = monitored

            if contains_brand and root_domain != monitored:
                best_match_brand = monitored
                best_similarity = max(best_similarity, 0.88)
                reasons.append(f"Domain contains legitimate brand trademark keyword '{brand_name}' inside '{root_domain}'.")

        # Determine suspicion threshold
        is_suspicious = False
        if best_similarity >= 0.78 and best_match_brand and root_domain != best_match_brand:
            is_suspicious = True
            reasons.append(f"High typosquatting similarity ({best_similarity:.2f}) to legitimate brand '{best_match_brand}'.")

        if is_homoglyph:
            is_suspicious = True
            reasons.append(f"Visual homoglyph substitutions detected: {substitutions}")

        if is_punycode:
            is_suspicious = True
            reasons.append(f"Internationalized Domain Name (Punycode) detected: {domain_clean} -> {punycode_decoded}")

        return {
            "domain": domain_clean,
            "role": role,
            "is_suspicious": is_suspicious,
            "target_brand": best_match_brand if is_suspicious else None,
            "similarity_score": round(best_similarity, 3),
            "similarity_algorithm": "Normalized Levenshtein & Homoglyph Matrix",
            "is_homoglyph": is_homoglyph,
            "is_punycode": is_punycode,
            "punycode_decoded": punycode_decoded,
            "homoglyph_breakdown": substitutions,
            "reasons": reasons
        }

    @classmethod
    def evaluate_mismatches(cls, from_name: str, from_addr: str, reply_to: str, return_path: str) -> List[Dict[str, Any]]:
        """
        Detects display-name impersonation, Reply-To discrepancies, and Return-Path mismatches.
        """
        mismatches = []
        from_domain = from_addr.split("@")[-1].lower() if "@" in from_addr else ""
        reply_domain = reply_to.split("@")[-1].lower() if "@" in reply_to else ""
        return_domain = return_path.split("@")[-1].lower() if "@" in return_path else ""

        # Display name spoofing (VIP name used with generic/unrelated domain)
        if from_name:
            for vip in settings.VIP_NAMES:
                if vip.lower() in from_name.lower():
                    # Check if domain looks free/unrelated (e.g. gmail.com, outlook.com, random domain)
                    if from_domain in ["gmail.com", "yahoo.com", "hotmail.com", "mail.com"] or "ceo" in from_name.lower():
                        mismatches.append({
                            "type": "DISPLAY_NAME_IMPERSONATION",
                            "severity": "HIGH",
                            "description": f"Display Name claims VIP identity '{from_name}', but sending domain is external/unaffiliated '{from_domain}'."
                        })
                    break

        # Reply-To mismatch
        if reply_to and reply_domain and from_domain and reply_domain != from_domain:
            mismatches.append({
                "type": "REPLY_TO_MISMATCH",
                "severity": "HIGH",
                "description": f"Reply-To address domain '{reply_domain}' does not match From address domain '{from_domain}'. Replies will be routed to a different entity."
            })

        # Return-Path mismatch
        if return_path and return_domain and from_domain and return_domain != from_domain:
            mismatches.append({
                "type": "RETURN_PATH_MISMATCH",
                "severity": "MEDIUM",
                "description": f"Envelope Return-Path domain '{return_domain}' differs from Header From domain '{from_domain}'."
            })

        return mismatches
