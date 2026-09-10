import re
import ipaddress
import email.utils
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

class SmtpRouteEngine:
    """
    SMTP Route Reconstruction & Origin Analysis Engine.
    Implements Sections 13 and 14 by reversing prepended Received headers
    into chronological order (Hop 1 = Earliest origin, Hop N = Recipient destination),
    classifying private vs public IPs, and detecting the Earliest Observed External Hop.
    """

    IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    FROM_PATTERN = re.compile(r'from\s+([^\s;]+)', re.IGNORECASE)
    BY_PATTERN = re.compile(r'by\s+([^\s;]+)', re.IGNORECASE)
    WITH_PATTERN = re.compile(r'with\s+([^\s;]+)', re.IGNORECASE)
    TLS_PATTERN = re.compile(r'using\s+TLS[^\s;]+|TLS[a-zA-Z0-9_\-]+', re.IGNORECASE)

    @staticmethod
    def is_private_ip(ip_str: str) -> bool:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved or ip_obj.is_multicast
        except ValueError:
            return False

    @classmethod
    def parse_received_header(cls, header_value: str) -> Dict[str, Any]:
        """Parses individual Received header into structured hop components."""
        # Extract source host and IP
        from_match = cls.FROM_PATTERN.search(header_value)
        source_host = from_match.group(1).strip() if from_match else "Unknown"

        # Look for IP in the entire header or bracketed sections
        all_ips = cls.IP_PATTERN.findall(header_value)
        source_ip = None
        for candidate_ip in all_ips:
            try:
                ipaddress.ip_address(candidate_ip)
                source_ip = candidate_ip
                break
            except ValueError:
                continue

        # Extract destination host
        by_match = cls.BY_PATTERN.search(header_value)
        dest_host = by_match.group(1).strip() if by_match else "Unknown"

        # Extract protocol
        with_match = cls.WITH_PATTERN.search(header_value)
        protocol = with_match.group(1).strip() if with_match else "SMTP"

        # Extract TLS info
        tls_match = cls.TLS_PATTERN.search(header_value)
        tls_cipher = tls_match.group(0).strip() if tls_match else "None / Plaintext"

        # Extract timestamp (usually follows semicolon)
        timestamp_dt = None
        if ";" in header_value:
            date_str = header_value.split(";")[-1].strip()
            try:
                timestamp_dt = email.utils.parsedate_to_datetime(date_str)
            except Exception:
                timestamp_dt = None

        is_private = cls.is_private_ip(source_ip) if source_ip else False

        return {
            "source_host": source_host,
            "source_ip": source_ip,
            "is_private_ip": is_private,
            "dest_host": dest_host,
            "protocol": protocol,
            "tls_cipher": tls_cipher,
            "timestamp": timestamp_dt,
            "raw_header": header_value
        }

    @classmethod
    def reconstruct_route(cls, received_headers: List[str]) -> Dict[str, Any]:
        """
        Reconstructs the full SMTP routing path.
        RFC 822 adds Received headers in reverse order (newest at index 0).
        We reverse this list so hop 1 is the earliest observable sending hop.
        """
        if not received_headers:
            return {
                "hops": [],
                "earliest_observed_external_hop": None,
                "route_anomalies": ["No Received: headers present in message."]
            }

        # Chronological reversal
        chronological_raw = list(reversed(received_headers))
        hops: List[Dict[str, Any]] = []
        earliest_external_hop = None
        route_anomalies = []

        prev_time: Optional[datetime] = None

        for idx, raw_hdr in enumerate(chronological_raw, start=1):
            parsed = cls.parse_received_header(raw_hdr)
            parsed["hop_number"] = idx
            
            # Trust classification
            if idx == len(chronological_raw):
                parsed["trust_level"] = "HIGH_TRUST"
                parsed["role"] = "Recipient Gateway / MX Server"
            elif idx == 1:
                parsed["trust_level"] = "HIGH_TRUST"
                parsed["role"] = "Originating Relay / Submission Gateway"
            else:
                parsed["trust_level"] = "MEDIUM_TRUST"
                parsed["role"] = "Intermediate Relay Hop"

            # Transit delay calculation
            current_time = parsed["timestamp"]
            delay = 0.0
            if prev_time and current_time:
                try:
                    delta = (current_time - prev_time).total_seconds()
                    delay = max(0.0, delta)
                    if delta < 0:
                        route_anomalies.append(f"Timestamp anomaly at Hop {idx}: timestamp precedes prior hop ({delta}s difference). Possible clock skew or fabricated header.")
                except Exception:
                    delay = 0.0
            parsed["delay_seconds"] = delay
            if current_time:
                prev_time = current_time

            # Identify earliest external public IP
            if not earliest_external_hop and parsed["source_ip"] and not parsed["is_private_ip"]:
                earliest_external_hop = {
                    "ip": parsed["source_ip"],
                    "hop_number": idx,
                    "host": parsed["source_host"],
                    "timestamp": parsed["timestamp"],
                    "classification": "earliest_observed_external_hop",
                    "evidence": [
                        "Public IP address",
                        f"Appears at Chronological Hop {idx} in Received chain",
                        "Precedes downstream recipient infrastructure"
                    ],
                    "limitations": [
                        "Earliest infrastructure may be hidden or rewritten if upstream relays were not recorded"
                    ]
                }

            hops.append(parsed)

        return {
            "hops": hops,
            "earliest_observed_external_hop": earliest_external_hop,
            "route_anomalies": route_anomalies
        }
