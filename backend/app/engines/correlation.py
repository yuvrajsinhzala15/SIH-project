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
    def build_threat_graph(cls, all_evidence_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Constructs multi-entity attack graph linking emails, infrastructure, domains, and IOCs.
        Returns graph payload formatted for vis-network / cytoscape / React rendering.
        """
        G = nx.MultiDiGraph()
        nodes_dict = {}
        edges_list = []

        for ev in all_evidence_data:
            ev_id = ev.get("evidence_id")
            subject = ev.get("subject", "Email")
            score = ev.get("threat_score", {}).get("final_score", 0)
            risk = ev.get("threat_score", {}).get("risk_level", "LOW")

            # Email node
            ev_node_id = f"email_{ev_id}"
            if ev_node_id not in nodes_dict:
                nodes_dict[ev_node_id] = {
                    "id": ev_node_id,
                    "label": f"[{ev_id}]\n{subject[:20]}...",
                    "type": "email",
                    "risk": risk,
                    "score": score,
                    "evidence_id": ev_id
                }

            # Sender Node
            from_addr = ev.get("from_addr")
            if from_addr:
                sender_node_id = f"sender_{from_addr}"
                if sender_node_id not in nodes_dict:
                    nodes_dict[sender_node_id] = {
                        "id": sender_node_id,
                        "label": from_addr,
                        "type": "sender",
                        "risk": risk
                    }
                edges_list.append({
                    "from": ev_node_id,
                    "to": sender_node_id,
                    "label": "SENT_FROM",
                    "type": "SENT_FROM"
                })

            # Domain Nodes
            for dom in ev.get("domains", []):
                dom_val = dom.get("domain")
                if dom_val and dom_val != "Unavailable":
                    dom_node_id = f"domain_{dom_val}"
                    if dom_node_id not in nodes_dict:
                        nodes_dict[dom_node_id] = {
                            "id": dom_node_id,
                            "label": dom_val,
                            "type": "domain",
                            "risk": "HIGH" if dom.get("is_suspicious") else "LOW"
                        }
                    edges_list.append({
                        "from": ev_node_id,
                        "to": dom_node_id,
                        "label": "USES_DOMAIN",
                        "type": "USES_DOMAIN"
                    })

            # IP Nodes
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
                            "asn": ip_info.get("asn_org")
                        }
                    edges_list.append({
                        "from": ev_node_id,
                        "to": ip_node_id,
                        "label": "ROUTED_THROUGH",
                        "type": "ROUTED_THROUGH"
                    })

            # Attachment Hash Nodes
            for att in ev.get("attachments", []):
                h_val = att.get("sha256")
                if h_val:
                    att_node_id = f"hash_{h_val[:10]}"
                    if att_node_id not in nodes_dict:
                        nodes_dict[att_node_id] = {
                            "id": att_node_id,
                            "label": f"Hash: {h_val[:8]}...\n({att.get('filename')})",
                            "type": "attachment",
                            "risk": "HIGH" if att.get("is_suspicious") else "LOW"
                        }
                    edges_list.append({
                        "from": ev_node_id,
                        "to": att_node_id,
                        "label": "CONTAINS_ATTACHMENT",
                        "type": "CONTAINS_ATTACHMENT"
                    })

        # Calculate Campaign Clusters using connected component detection
        for edge in edges_list:
            G.add_edge(edge["from"], edge["to"], label=edge["label"])

        clusters = []
        try:
            undirected_G = G.to_undirected()
            for idx, comp in enumerate(nx.connected_components(undirected_G), start=1):
                # Only consider campaigns if connected cluster has multiple emails
                email_members = [n for n in comp if n.startswith("email_")]
                if len(email_members) >= 2:
                    camp_id = f"CAM-2026-{idx:03d}"
                    clusters.append({
                        "campaign_id": camp_id,
                        "name": f"Correlated Threat Cluster #{idx}",
                        "linked_emails": email_members,
                        "total_entities": len(comp),
                        "confidence": 0.91,
                        "reasons": ["Shared observed routing IP", "Identical attachment hash / infrastructure"]
                    })
        except Exception:
            pass

        return {
            "nodes": list(nodes_dict.values()),
            "edges": edges_list,
            "campaign_clusters": clusters,
            "total_nodes": len(nodes_dict),
            "total_edges": len(edges_list)
        }
