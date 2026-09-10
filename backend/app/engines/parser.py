import email
import email.policy
from email.parser import BytesParser
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.security import compute_evidence_hashes, generate_evidence_id

class EmailParserEngine:
    """
    Forensic Email & MIME Ingestion Engine.
    Preserves original bytes, computes dual SHA-256 / SHA-3-256 hashes,
    and extracts headers, bodies, and attachments without unsafe execution.
    """

    @staticmethod
    def parse_raw_email(raw_bytes: bytes, filename: str = "suspicious.eml") -> Dict[str, Any]:
        hashes = compute_evidence_hashes(raw_bytes)
        file_size = len(raw_bytes)
        
        # Parse using strict RFC policy
        msg = BytesParser(policy=email.policy.default).parsebytes(raw_bytes)
        
        # Extract core RFC 5322 headers
        subject = msg.get("Subject", "(No Subject)")
        from_header = msg.get("From", "Unavailable")
        to_header = msg.get("To", "Unavailable")
        cc_header = msg.get("Cc", "")
        reply_to = msg.get("Reply-To", "")
        return_path = msg.get("Return-Path", "")
        message_id = msg.get("Message-ID", "")
        date_header = msg.get("Date", "")
        user_agent = msg.get("User-Agent") or msg.get("X-Mailer", "Unavailable")
        x_originating_ip = msg.get("X-Originating-IP", "")
        
        # Clean X-Originating-IP if enclosed in brackets
        if x_originating_ip:
            x_originating_ip = re.sub(r'[\[\]\(\)]', '', x_originating_ip).strip()
            
        # Parse From address and display name
        from_name = ""
        from_addr = from_header
        match = re.match(r'^(.*?)\s*<(.+?)>$', from_header)
        if match:
            from_name = match.group(1).strip('"\'' )
            from_addr = match.group(2).strip()
            
        # Parse Date header to datetime object if possible
        date_parsed = None
        try:
            if date_header:
                date_parsed = email.utils.parsedate_to_datetime(date_header)
        except Exception:
            date_parsed = None

        # Extract all raw headers with case-preserved names
        raw_headers = []
        for header_name, header_value in msg.items():
            raw_headers.append({
                "name": header_name,
                "value": str(header_value)
            })

        # Extract body (plaintext & html) safely
        body_plain = ""
        body_html = ""
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                content_disposition = str(part.get("Content-Disposition", ""))
                content_type = part.get_content_type()
                
                # Check if it is an attachment
                filename_att = part.get_filename()
                if filename_att or "attachment" in content_disposition.lower():
                    att_payload = part.get_payload(decode=True) or b""
                    att_hashes = compute_evidence_hashes(att_payload)
                    attachments.append({
                        "filename": filename_att or "unnamed_attachment",
                        "mime_type": content_type,
                        "file_size": len(att_payload),
                        "sha256": att_hashes["sha256"],
                        "sha3_256": att_hashes["sha3_256"],
                        "raw_bytes": att_payload
                    })
                elif content_type == "text/plain" and not body_plain:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body_plain = payload.decode(errors="replace")
                elif content_type == "text/html" and not body_html:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body_html = payload.decode(errors="replace")
        else:
            content_type = msg.get_content_type()
            payload = msg.get_payload(decode=True) or b""
            if content_type == "text/html":
                body_html = payload.decode(errors="replace")
            else:
                body_plain = payload.decode(errors="replace")

        return {
            "hashes": hashes,
            "filename": filename,
            "file_size": file_size,
            "mime_type": "message/rfc822",
            "subject": subject,
            "from_header": from_header,
            "from_name": from_name,
            "from_addr": from_addr,
            "to_header": to_header,
            "cc_header": cc_header,
            "reply_to": reply_to,
            "return_path": return_path,
            "message_id": message_id,
            "date_header": date_header,
            "date_parsed": date_parsed,
            "user_agent": user_agent,
            "x_originating_ip": x_originating_ip,
            "body_plain": body_plain,
            "body_html": body_html,
            "raw_headers": raw_headers,
            "attachments": attachments,
            "raw_msg_obj": msg
        }
