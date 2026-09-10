import os
from typing import List, Dict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Email Threat Detection, Geolocation & Forensic Intelligence Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./forensic_platform.db")
    
    # Forensic Scoring Weights (Configurable)
    WEIGHT_AUTH: float = 0.25      # Authentication failure (SPF/DKIM/DMARC)
    WEIGHT_NLP: float = 0.20       # AI threat classification & intent signals
    WEIGHT_SPOOF: float = 0.20     # Domain typosquatting / homoglyphs / impersonation
    WEIGHT_INFRA: float = 0.15     # Suspicious ASN / TOR / VPN / Datacenter vs claimed identity
    WEIGHT_URL: float = 0.10       # Malicious / suspicious URLs
    WEIGHT_ATTACH: float = 0.10    # Suspicious attachments / macros / double extensions
    
    # Legitimate corporate domains allowlist for homoglyph / impersonation comparison
    MONITORED_DOMAINS: List[str] = [
        "microsoft.com", "office.com", "office365.com", "azure.com", "google.com", "gmail.com",
        "paypal.com", "apple.com", "icloud.com", "amazon.com", "aws.amazon.com",
        "chase.com", "bankofamerica.com", "wellsfargo.com", "citi.com", "capitalone.com",
        "docusign.com", "dropbox.com", "adobe.com", "github.com", "gitlab.com",
        "netflix.com", "spotify.com", "meta.com", "facebook.com", "instagram.com",
        "linkedin.com", "twitter.com", "x.com", "whatsapp.com", "telegram.org",
        "dhl.com", "fedex.com", "ups.com", "usps.com", "irs.gov",
        "zoom.us", "salesforce.com", "intuit.com", "quickbooks.com",
        "binance.com", "coinbase.com", "kraken.com", "stripe.com",
        "acmecorp.com", "globaltech.io", "securebanking.net"
    ]
    
    # Executive / VIP names to detect display-name impersonation
    VIP_NAMES: List[str] = [
        "Satya Nadella", "Sundar Pichai", "Tim Cook", "Andy Jassy", "Mark Zuckerberg",
        "Elon Musk", "Chief Executive Officer", "Chief Financial Officer", "Managing Director",
        "President", "Executive Vice President", "Head of Finance", "Treasurer",
        "Johnathan Doe (CEO)", "Finance Department", "IT Helpdesk", "Security Operations",
        "Payroll Administrator", "Human Resources Director"
    ]
    
    # Sensitive redaction patterns
    ENABLE_AI_REDACTION: bool = True
    
    model_config = {"case_sensitive": True, "env_file": ".env"}

settings = Settings()

