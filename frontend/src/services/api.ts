const API_BASE = "http://127.0.0.1:8000/api/v1";

export interface SmtpHop {
  hop_number: number;
  timestamp: string | null;
  source_host: string | null;
  source_ip: string | null;
  is_private_ip: boolean;
  dest_host: string | null;
  protocol: string | null;
  tls_cipher: string | null;
  delay_seconds: number;
  trust_level: string;
  raw_header: string | null;
}

export interface AuthDetails {
  spf_result: string;
  spf_domain: string;
  spf_scope: string;
  dkim_result: string;
  dkim_domain: string;
  dkim_selector: string;
  dkim_independent_verified: string;
  dmarc_result: string;
  dmarc_policy: string;
  dmarc_alignment: string;
  arc_result: string;
  reported_by: string;
  trust_classification: string;
  summary_explanation: string;
}

export interface IpIntel {
  ip: string;
  classification: string;
  is_private: boolean;
  country: string;
  country_code: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  asn: string;
  asn_org: string;
  reverse_dns: string;
  infra_type: string;
  provider_status: string;
  attribution_confidence: string;
}

export interface DomainIntel {
  domain: string;
  role: string;
  target_brand: string | null;
  similarity_score: number;
  similarity_algorithm: string | null;
  is_homoglyph: boolean;
  is_punycode: boolean;
  punycode_decoded: string | null;
  homoglyph_breakdown: Record<string, string>;
  is_suspicious: boolean;
  reasons: string[];
}

export interface UrlIntel {
  original_url: string;
  defanged_url: string;
  domain: string;
  tld: string | null;
  is_https: boolean;
  is_ip_based_url: boolean;
  has_suspicious_params: boolean;
  is_shortener: boolean;
  is_suspicious: boolean;
  risk_score: number;
  risk_reasons: string[];
}

export interface AttachmentRecord {
  filename: string;
  file_size: number;
  mime_type: string;
  sha256: string;
  sha3_256: string;
  extension: string | null;
  has_double_extension: boolean;
  is_executable_type: boolean;
  has_macro_indicators: boolean;
  is_suspicious: boolean;
  risk_factors: string[];
}

export interface AiThreatIntel {
  classification: string;
  confidence: number;
  intent_summary: string;
  urgency_level: string;
  requested_action: string;
  impersonated_executive: string | null;
  impersonated_org: string | null;
  financial_indicators: string[];
  signals: string[];
  limitations: string[];
  model_name: string;
  model_version: string;
  pii_redacted_count: number;
}

export interface ThreatScore {
  final_score: number;
  risk_level: string;
  confidence: number;
  component_scores: {
    authentication_risk: number;
    nlp_intent_risk: number;
    impersonation_risk: number;
    infrastructure_risk: number;
    url_risk: number;
    attachment_risk: number;
  };
  breakdown: Record<string, string>[];
  recommended_actions: string[];
}

export interface IOC {
  ioc_type: string;
  value: string;
  defanged_value: string;
  confidence: number;
  source: string;
}

export interface ChainOfCustody {
  timestamp: string;
  actor: string;
  action: string;
  hash_snapshot: string;
  details: Record<string, any>;
}

export interface EvidenceDetail {
  evidence_id: string;
  sha256: string;
  sha3_256: string;
  md5: string;
  filename: string;
  file_size: number;
  mime_type: string;
  received_at: string;
  status: string;
  case_id: number | null;
  
  subject: string;
  from_addr: string;
  from_name: string;
  to_addr: string;
  cc_addr: string;
  reply_to: string;
  return_path: string;
  message_id: string;
  date_header: string;
  user_agent: string;
  x_originating_ip: string;
  body_plain: string;
  body_html: string;
  raw_headers: { name: string; value: string; trust_level: string; explanation: string }[];
  
  smtp_hops: SmtpHop[];
  auth: AuthDetails;
  ips: IpIntel[];
  domains: DomainIntel[];
  urls: UrlIntel[];
  attachments: AttachmentRecord[];
  ai_intel: AiThreatIntel;
  threat_score: ThreatScore;
  iocs: IOC[];
  custody_logs: ChainOfCustody[];
}

export interface EvidenceSummary {
  evidence_id: string;
  filename: string;
  file_size: number;
  sha256: string;
  received_at: string;
  status: string;
  subject: string;
  from_addr: string;
  final_score: number;
  risk_level: string;
  classification: string;
  case_id: number | null;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  risk?: string;
  score?: number;
  evidence_id?: string;
  asn?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  type: string;
}

export interface AttackGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  campaign_clusters: {
    campaign_id: string;
    name: string;
    linked_emails: string[];
    total_entities: number;
    confidence: number;
    reasons: string[];
  }[];
  total_nodes: number;
  total_edges: number;
}

export interface CaseRecord {
  id: number;
  case_id: string;
  title: string;
  status: string;
  severity: string;
  assigned_analyst: string;
  created_at: string;
  summary: string;
  evidence_count: number;
}

export interface CaseDetail {
  id: number;
  case_id: string;
  title: string;
  status: string;
  severity: string;
  assigned_analyst: string;
  created_at: string;
  summary: string;
  evidence: { evidence_id: string; filename: string; score: number; risk: string }[];
  notes: { author: string; note: string; created_at: string }[];
}

export const api = {
  async getEvidenceList(): Promise<EvidenceSummary[]> {
    const res = await fetch(`${API_BASE}/evidence`);
    if (!res.ok) throw new Error("Failed to fetch evidence list");
    return res.json();
  },

  async getEvidenceDetail(evidenceId: string): Promise<EvidenceDetail> {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}`);
    if (!res.ok) throw new Error("Failed to fetch evidence details");
    return res.json();
  },

  async deleteEvidence(evidenceId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete evidence");
    return res.json();
  },

  async uploadEvidence(formData: FormData): Promise<{ status: string; evidence_id: string }> {
    const res = await fetch(`${API_BASE}/evidence/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async seedDemoData(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/evidence/seed`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed data");
    return res.json();
  },

  async getAttackGraph(): Promise<AttackGraphData> {
    const res = await fetch(`${API_BASE}/graph`);
    if (!res.ok) throw new Error("Failed to load attack graph");
    return res.json();
  },

  async getCases(): Promise<CaseRecord[]> {
    const res = await fetch(`${API_BASE}/cases`);
    if (!res.ok) throw new Error("Failed to fetch cases");
    return res.json();
  },

  async getCaseDetail(caseId: string): Promise<CaseDetail> {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    if (!res.ok) throw new Error("Failed to fetch case detail");
    return res.json();
  },

  async createCase(data: { title: string; severity: string; assigned_analyst: string; summary?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create case");
    return res.json();
  },

  async updateCase(caseId: string, data: { title?: string; status?: string; severity?: string; assigned_analyst?: string; summary?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update case");
    return res.json();
  },

  async deleteCase(caseId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete case");
    return res.json();
  },

  async addCaseNote(caseId: string, author: string, note: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, note }),
    });
    if (!res.ok) throw new Error("Failed to add note");
    return res.json();
  },

  async queryCopilot(evidenceId: string, query: string): Promise<{ answer: string; evidence_references: string[]; confidence: number }> {
    const res = await fetch(`${API_BASE}/copilot/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evidence_id: evidenceId, query }),
    });
    if (!res.ok) throw new Error("Failed to query copilot");
    return res.json();
  },

  async globalSearch(q: string): Promise<{ query: string; total_matches: number; results: any[] }> {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  getStixUrl(evidenceId: string): string {
    return `${API_BASE}/evidence/${evidenceId}/stix`;
  },

  getReportUrl(evidenceId: string): string {
    return `${API_BASE}/evidence/${evidenceId}/report`;
  }
};
