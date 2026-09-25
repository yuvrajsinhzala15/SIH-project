import networkx as nx
from typing import List, Dict, Any, Tuple
from app.core.security import defang_url, defang_ip

class CorrelationEngine:
    """
    Cross-Email Correlation, IOC Extraction & Graph Analytics Engine.
    Implements Sections 29, 30, 31, and 32 by indexing forensic IOCs,
    constructing a NetworkX multi-entity threat graph, and identifying campaign clusters.
    """

    @classmethod
    def extract_iocs(
        cls,
        evidence_id: str,
        from_addr: str,
        reply_to: str,
        ips: List[str],
        domains: List[str],
        urls: List[str],
        attachment_hashes: List[str]
    ) -> List[Dict[str, Any]]:
        iocs = []

        if from_addr and "@" in from_addr:
            iocs.append({
                "evidence_id": evidence_id,
                "ioc_type": "email_address",
                "value": from_addr,
                "defanged_value": from_addr.replace("@", "[at]"),
                "confidence": 0.95,
                "source": "Header-From"
            })

        if reply_to and "@" in reply_to and reply_to != from_addr:
            iocs.append({
                "evidence_id": evidence_id,
                "ioc_type": "email_address",
                "value": reply_to,
                "defanged_value": reply_to.replace("@", "[at]"),
                "confidence": 0.95,
                "source": "Header-Reply-To"
            })

        for ip in set(ips):
            if ip and not ip.startswith("10.") and not ip.startswith("192.168.") and not ip.startswith("127."):
                iocs.append({
                    "evidence_id": evidence_id,
                    "ioc_type": "ip",
                    "value": ip,
                    "defanged_value": defang_ip(ip),
                    "confidence": 0.90,
                    "source": "SMTP-Received-Hop"
                })

        for d in set(domains):
            if d and d != "Unavailable":
                iocs.append({
                    "evidence_id": evidence_id,
                    "ioc_type": "domain",
                    "value": d,
                    "defanged_value": d.replace(".", "[.]"),
                    "confidence": 0.92,
                    "source": "Domain-Forensics"
                })

        for u in set(urls):
            if u:
                iocs.append({
                    "evidence_id": evidence_id,
                    "ioc_type": "url",
                    "value": u,
                    "defanged_value": defang_url(u),
                    "confidence": 0.94,
                    "source": "URL-Extractor"
                })

        for h in set(attachment_hashes):
            if h:
                iocs.append({
                    "evidence_id": evidence_id,
                    "ioc_type": "sha256",
                    "value": h,
                    "defanged_value": h,
                    "confidence": 0.99,
                    "source": "Attachment-Hasher"
                })

        return iocs

    @classmethod
    def build_threat_graph(
        cls,
        all_evidence_data: List[Dict[str, Any]],
        filter_campaign_id: Optional[str] = None,
        cases_map: Optional[Dict[Any, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Constructs multi-entity attack graph linking campaigns, emails, infrastructure, domains, URLs, and IOCs.
        Supports campaign filtering, edge validation, deduplication, and zero-stale-node switching.
        """
        cases_map = cases_map or {}

        # 1. Compute Connected Threat Clusters across all emails first
        all_graph = nx.MultiDiGraph()
        for ev in all_evidence_data:
            ev_id = ev.get("evidence_id")
            ev_node = f"email_{ev_id}"
            
            from_addr = ev.get("from_addr")
            if from_addr:
                all_graph.add_edge(ev_node, f"sender_{from_addr.lower()}", type="SENT_FROM")
                
            for dom in ev.get("domains", []):
                d_val = dom.get("domain")
                if d_val and d_val != "Unavailable":
                    all_graph.add_edge(ev_node, f"domain_{d_val.lower()}", type="USES_DOMAIN")
                    
            for ip_info in ev.get("ips", []):
                ip_val = ip_info.get("ip")
                if ip_val and not ip_info.get("is_private"):
                    all_graph.add_edge(ev_node, f"ip_{ip_val}", type="ROUTED_THROUGH")
                    
            for att in ev.get("attachments", []):
                h_val = att.get("sha256")
                if h_val:
                    all_graph.add_edge(ev_node, f"hash_{h_val[:16]}", type="CONTAINS_ATTACHMENT")

        clusters = []
        try:
            undirected_G = all_graph.to_undirected()
            for idx, comp in enumerate(nx.connected_components(undirected_G), start=1):
                email_members = [n.replace("email_", "") for n in comp if n.startswith("email_")]
                if len(email_members) >= 2:
                    camp_id = f"CAM-2026-{idx:03d}"
                    clusters.append({
                        "campaign_id": camp_id,
                        "name": f"Correlated Threat Cluster #{idx}",
                        "linked_emails": email_members,
                        "total_entities": len(comp),
                        "confidence": 0.92,
                        "reasons": ["Shared observed routing IP", "Identical attachment hash / infrastructure"]
                    })
        except Exception:
            pass

        # 2. Filter evidence if a specific campaign is selected
        target_evidence = all_evidence_data
        if filter_campaign_id and filter_campaign_id != "ALL":
            if filter_campaign_id.startswith("CASE-"):
                # Filter by formal case
                target_evidence = [
                    ev for ev in all_evidence_data
                    if str(ev.get("case_id")) == str(filter_campaign_id) or
                    (ev.get("case_id") and cases_map.get(ev.get("case_id"), {}).get("case_id") == filter_campaign_id)
                ]
            elif filter_campaign_id.startswith("CAM-"):
                # Filter by correlated cluster
                matched_cluster = next((c for c in clusters if c["campaign_id"] == filter_campaign_id), None)
                if matched_cluster:
                    target_evidence = [
                        ev for ev in all_evidence_data
                        if ev.get("evidence_id") in matched_cluster["linked_emails"]
                    ]
                else:
                    target_evidence = []
            else:
                # Direct match by evidence or string
                target_evidence = [
                    ev for ev in all_evidence_data
                    if str(ev.get("case_id")) == filter_campaign_id or ev.get("evidence_id") == filter_campaign_id
                ]

            if not target_evidence:
                return {
                    "nodes": [],
                    "edges": [],
                    "campaign_clusters": clusters,
                    "total_nodes": 0,
                    "total_edges": 0,
                    "message": "No relationship data available for this campaign."
                }

        # 3. Construct Nodes and Edges for targeted evidence
        nodes_dict: Dict[str, Any] = {}
        raw_edges: List[Dict[str, Any]] = []

        for ev in target_evidence:
            ev_id = ev.get("evidence_id")
            subject = ev.get("subject", "Email Artifact")
            score = ev.get("threat_score", {}).get("final_score", 0)
            risk = ev.get("threat_score", {}).get("risk_level", "LOW")
            case_id = ev.get("case_id")

            # Campaign Node (if linked to a formal case)
            if case_id and case_id in cases_map:
                case_rec = cases_map[case_id]
                camp_node_id = f"campaign_{case_rec.get('case_id')}"
                if camp_node_id not in nodes_dict:
                    nodes_dict[camp_node_id] = {
                        "id": camp_node_id,
                        "label": f"Campaign: {case_rec.get('title', 'Case')[:24]}",
                        "type": "campaign",
                        "risk": case_rec.get("severity", "HIGH"),
                        "campaign_id": case_rec.get("case_id")
                    }
                raw_edges.append({
                    "from": camp_node_id,
                    "to": f"email_{ev_id}",
                    "label": "CONTAINS_INCIDENT",
                    "type": "CONTAINS_INCIDENT"
                })

            # Email Node
            ev_node_id = f"email_{ev_id}"
            if ev_node_id not in nodes_dict:
                nodes_dict[ev_node_id] = {
                    "id": ev_node_id,
                    "label": f"[{ev_id}]\n{subject[:22]}",
                    "type": "email",
                    "risk": risk,
                    "score": score,
                    "evidence_id": ev_id,
                    "case_id": case_id
                }

            # Sender Node
            from_addr = ev.get("from_addr")
            if from_addr:
                sender_node_id = f"sender_{from_addr.lower()}"
                if sender_node_id not in nodes_dict:
                    nodes_dict[sender_node_id] = {
                        "id": sender_node_id,
                        "label": from_addr,
                        "type": "sender",
                        "risk": risk
                    }
                raw_edges.append({
                    "from": ev_node_id,
                    "to": sender_node_id,
                    "label": "SENT_FROM",
                    "type": "SENT_FROM"
                })

            # Domain Nodes
            for dom in ev.get("domains", []):
                dom_val = dom.get("domain")
                if dom_val and dom_val != "Unavailable":
                    dom_node_id = f"domain_{dom_val.lower()}"
                    if dom_node_id not in nodes_dict:
                        nodes_dict[dom_node_id] = {
                            "id": dom_node_id,
                            "label": dom_val,
                            "type": "domain",
                            "risk": "HIGH" if dom.get("is_suspicious") else "LOW",
                            "target_brand": dom.get("target_brand")
                        }
                    raw_edges.append({
                        "from": ev_node_id,
                        "to": dom_node_id,
                        "label": "USES_DOMAIN",
                        "type": "USES_DOMAIN"
                    })

            # IP Nodes & Infrastructure
            for ip_info in ev.get("ips", []):
                ip_val = ip_info.get("ip")
                if ip_val and not ip_info.get("is_private"):
                    ip_node_id = f"ip_{ip_val}"
                    if ip_node_id not in nodes_dict:
                        nodes_dict[ip_node_id] = {
                            "id": ip_node_id,
                            "label": f"{ip_val}\n({ip_info.get('country_code', 'XX')})",
                            "type": "ip",
                            "risk": "HIGH" if ip_info.get("infra_type") in ["TOR Exit", "VPN"] else "MEDIUM",
                            "asn": ip_info.get("asn_org"),
                            "infra_type": ip_info.get("infra_type")
                        }
                    raw_edges.append({
                        "from": ev_node_id,
                        "to": ip_node_id,
                        "label": "ROUTED_THROUGH",
                        "type": "ROUTED_THROUGH"
                    })

                    # If IP has specialized infrastructure (e.g. TOR Exit, VPN)
                    infra_type = ip_info.get("infra_type")
                    if infra_type and infra_type not in ["Unknown", "Residential ISP", "Cloud Provider"]:
                        infra_node_id = f"infra_{infra_type.replace(' ', '_').lower()}"
                        if infra_node_id not in nodes_dict:
                            nodes_dict[infra_node_id] = {
                                "id": infra_node_id,
                                "label": f"Infra: {infra_type}",
                                "type": "infrastructure",
                                "risk": "HIGH"
                            }
                        raw_edges.append({
                            "from": ip_node_id,
                            "to": infra_node_id,
                            "label": "HOSTED_ON",
                            "type": "HOSTED_ON"
                        })

            # URL Nodes
            for u in ev.get("urls", []):
                u_defanged = u.get("defanged_url") or u.get("original_url") or "url"
                u_domain = u.get("domain") or "url"
                u_node_id = f"url_{u_defanged[:32]}"
                if u_node_id not in nodes_dict:
                    nodes_dict[u_node_id] = {
                        "id": u_node_id,
                        "label": f"{u_domain}\n({u_defanged[:18]}...)",
                        "type": "url",
                        "risk": "HIGH" if u.get("is_suspicious") else "LOW",
                        "original_url": u.get("original_url")
                    }
                raw_edges.append({
                    "from": ev_node_id,
                    "to": u_node_id,
                    "label": "CONTAINS_URL",
                    "type": "CONTAINS_URL"
                })

            # Attachment Hash Nodes
            for att in ev.get("attachments", []):
                h_val = att.get("sha256")
                if h_val:
                    att_node_id = f"hash_{h_val[:16]}"
                    if att_node_id not in nodes_dict:
                        nodes_dict[att_node_id] = {
                            "id": att_node_id,
                            "label": f"{att.get('filename')}\n({h_val[:8]}...)",
                            "type": "attachment",
                            "risk": "HIGH" if att.get("is_suspicious") else "LOW"
                        }
                    raw_edges.append({
                        "from": ev_node_id,
                        "to": att_node_id,
                        "label": "CONTAINS_ATTACHMENT",
                        "type": "CONTAINS_ATTACHMENT"
                    })

        # 4. Strict Edge Validation: eliminate invalid nodes, duplicates, and self-loops
        validated_edges = []
        seen_edge_signatures = set()

        for edge in raw_edges:
            src = edge.get("from")
            dst = edge.get("to")
            etype = edge.get("type")
            if src in nodes_dict and dst in nodes_dict and src != dst:
                sig = (src, dst, etype)
                if sig not in seen_edge_signatures:
                    seen_edge_signatures.add(sig)
                    validated_edges.append(edge)

        return {
            "nodes": list(nodes_dict.values()),
            "edges": validated_edges,
            "campaign_clusters": clusters,
            "total_nodes": len(nodes_dict),
            "total_edges": len(validated_edges),
            "filtered_campaign": filter_campaign_id or "ALL"
        }
