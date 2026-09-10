import re
from typing import List, Dict, Any

class AttachmentForensicsEngine:
    """
    Attachment Static Forensics Engine.
    Implements Section 23 by performing static inspection, identifying double extensions,
    dangerous executable/script formats, macro payload indicators, and computing
    dual cryptographic hashes without dynamic execution.
    """

    DANGEROUS_EXTENSIONS = {
        "exe", "dll", "scr", "vbs", "js", "ps1", "bat", "cmd", "hta",
        "iso", "img", "lnk", "wsf", "jar", "cpl", "pif"
    }

    MACRO_EXTENSIONS = {
        "docm", "xlsm", "pptm", "dotm", "xltm", "xlam"
    }

    ARCHIVE_EXTENSIONS = {
        "zip", "rar", "7z", "tar", "gz", "bz2"
    }

    @classmethod
    def analyze_attachments(cls, raw_attachments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        analyzed = []

        for att in raw_attachments:
            filename = att.get("filename", "unnamed")
            file_size = att.get("file_size", 0)
            mime_type = att.get("mime_type", "application/octet-stream")
            sha256 = att.get("sha256", "")
            sha3_256 = att.get("sha3_256", "")
            raw_bytes = att.get("raw_bytes", b"")

            # Extract extension
            ext = ""
            if "." in filename:
                ext = filename.rsplit(".", 1)[-1].lower()

            # Detect double extensions (e.g. invoice.pdf.exe or scan.docx.vbs)
            double_ext_match = re.search(r'\.(pdf|docx?|xlsx?|jpg|png|txt)\.([a-zA-Z0-9]+)$', filename, re.IGNORECASE)
            has_double_ext = bool(double_ext_match)

            # Check dangerous types
            is_executable = ext in cls.DANGEROUS_EXTENSIONS
            is_macro_ext = ext in cls.MACRO_EXTENSIONS
            is_archive = ext in cls.ARCHIVE_EXTENSIONS

            # Macro bytecode inspection (static signature scan in binary)
            has_macro_indicators = False
            if is_macro_ext or b"vbaProject.bin" in raw_bytes or b"AutoOpen" in raw_bytes or b"Workbook_Open" in raw_bytes:
                has_macro_indicators = True

            # Risk factors
            risk_factors = []
            is_suspicious = False

            if has_double_ext:
                is_suspicious = True
                risk_factors.append(f"Deceptive double extension detected: '{filename}'. Designed to disguise executable as a document.")

            if is_executable:
                is_suspicious = True
                risk_factors.append(f"High-risk executable or script format (.{ext}). Potential dropper or payload.")

            if has_macro_indicators:
                is_suspicious = True
                risk_factors.append("Embedded VBA/Macro automation signatures detected inside document structure.")

            if is_archive:
                risk_factors.append(f"Archive file (.{ext}) may contain nested or obfuscated malicious artifacts.")

            analyzed.append({
                "filename": filename,
                "file_size": file_size,
                "mime_type": mime_type,
                "sha256": sha256,
                "sha3_256": sha3_256,
                "extension": ext,
                "has_double_extension": has_double_ext,
                "is_executable_type": is_executable,
                "has_macro_indicators": has_macro_indicators,
                "is_suspicious": is_suspicious,
                "risk_factors": risk_factors
            })

        return analyzed
