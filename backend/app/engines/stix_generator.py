import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

class Stix21Generator:
    """
    STIX 2.1 Cyber Threat Intelligence Serializer.
    Implements Section 35 by generating OASIS STIX 2.1 compliant bundles
    containing indicators, observed data, cyber observables, and relationship links.
    """

    @classmethod
    def generate_bundle(cls, evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        bundle_id = f"bundle--{uuid.uuid4()}"
        
        objects = []

        # 1. Forensic Author Identity
        identity_id = f"identity--{uuid.uuid4()}"
        objects.append({
            "type": "identity",
            "spec_version": "2.1",
            "id": identity_id,
            "created": now_iso,
            "modified": now_iso,
            "name": "Forensic Intelligence Platform",
            "identity_class": "system",
            "sectors": ["cybersecurity", "digital-forensics"]
        })

        ev_id = evidence_data.get("evidence_id", "EV-UNKNOWN")
        subject = evidence_data.get("subject", "Suspicious Email")
        from_addr = evidence_data.get("from_addr", "")
        sha256 = evidence_data.get("sha256", "")

        # 2. Email Observable / Observed-Data
        observed_id = f"observed-data--{uuid.uuid4()}"
        objects.append({
            "type": "observed-data",
            "spec_version": "2.1",
            "id": observed_id,
            "created_by_ref": identity_id,
            "created": now_iso,
            "modified": now_iso,
            "first_observed": now_iso,
            "last_observed": now_iso,
            "number_observed": 1,
            "objects": {
                "0": {
                    "type": "email-message",
                    "subject": subject,
                    "from_ref": "1" if from_addr else None,
                    "is_multipart": True
                },
                "1": {
                    "type": "email-addr",
                    "value": from_addr,
                    "display_name": evidence_data.get("from_name", "")
                }
            }
        })

        # 3. Indicators for extracted IOCs
        for ioc in evidence_data.get("iocs", []):
            ioc_type = ioc.get("ioc_type")
            val = ioc.get("value")
            ind_id = f"indicator--{uuid.uuid4()}"
            
            pattern = None
            if ioc_type == "ip":
                pattern = f"[ipv4-addr:value = '{val}']"
            elif ioc_type == "domain":
                pattern = f"[domain-name:value = '{val}']"
            elif ioc_type == "url":
                pattern = f"[url:value = '{val}']"
            elif ioc_type == "sha256":
                pattern = f"[file:hashes.'SHA-256' = '{val}']"

            if pattern:
                objects.append({
                    "type": "indicator",
                    "spec_version": "2.1",
                    "id": ind_id,
                    "created_by_ref": identity_id,
                    "created": now_iso,
                    "modified": now_iso,
                    "name": f"Malicious {ioc_type.upper()} observed in {ev_id}",
                    "description": f"Extracted during email forensic investigation. Source: {ioc.get('source', 'Pipeline')}",
                    "indicator_types": ["malicious-activity"],
                    "pattern": pattern,
                    "pattern_type": "stix",
                    "valid_from": now_iso,
                    "confidence": int((ioc.get("confidence", 0.9)) * 100)
                })

                # Relationship: Indicator indicates Observed Data
                objects.append({
                    "type": "relationship",
                    "spec_version": "2.1",
                    "id": f"relationship--{uuid.uuid4()}",
                    "created": now_iso,
                    "modified": now_iso,
                    "relationship_type": "based-on",
                    "source_ref": ind_id,
                    "target_ref": observed_id
                })

        return {
            "type": "bundle",
            "id": bundle_id,
            "objects": objects
        }
