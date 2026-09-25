import pytest
import hashlib
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.services.blockchain import BlockchainService
from app.engines.correlation import CorrelationEngine
from app.db.models import Evidence

client = TestClient(app)

def test_blockchain_genesis_and_status():
    """Verify blockchain initialized with intact cryptographic blocks."""
    res = client.get("/api/v1/blockchain/status")
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["chain_status"] == "INTACT"
    assert data["total_blocks"] >= 1

def test_blockchain_registration_and_verification_flow():
    """
    Full lifecycle test:
    1. Retrieve seeded evidence
    2. Register on blockchain
    3. Verify integrity -> MATCH
    4. Simulate tampering -> MISMATCH
    5. Restore evidence -> MATCH
    """
    db = SessionLocal()
    try:
        ev = db.query(Evidence).first()
        assert ev is not None
        ev_id = ev.evidence_id
    finally:
        db.close()

    # 1. Register evidence on blockchain
    reg_res = client.post(f"/api/v1/evidence/{ev_id}/blockchain/register?actor=TEST_AUDITOR")
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["status"] == "SUCCESS"
    assert reg_data["blockchain_status"] == "REGISTERED"
    assert reg_data["tx_hash"].startswith("0x")
    assert reg_data["block_number"] >= 1

    # 2. Verify untampered evidence integrity -> MATCH
    verify_res = client.post(f"/api/v1/evidence/{ev_id}/blockchain/verify")
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["verification_status"] == "VERIFIED"
    assert verify_data["result"] == "MATCH"
    assert verify_data["tamper_detected"] is False
    assert verify_data["local_hash"] == verify_data["blockchain_hash"]

    # 3. Simulate bitstream tampering -> MODIFIED / MISMATCH
    tamper_res = client.post(f"/api/v1/evidence/{ev_id}/blockchain/simulate-tamper")
    assert tamper_res.status_code == 200

    verify_tampered = client.post(f"/api/v1/evidence/{ev_id}/blockchain/verify")
    assert verify_tampered.status_code == 200
    t_data = verify_tampered.json()
    assert t_data["verification_status"] == "MODIFIED"
    assert t_data["result"] == "MISMATCH"
    assert t_data["tamper_detected"] is True
    assert t_data["local_hash"] != t_data["blockchain_hash"]

    # 4. Restore authentic bitstream -> VERIFIED / MATCH
    restore_res = client.post(f"/api/v1/evidence/{ev_id}/blockchain/restore")
    assert restore_res.status_code == 200

    verify_restored = client.post(f"/api/v1/evidence/{ev_id}/blockchain/verify")
    assert verify_restored.status_code == 200
    r_data = verify_restored.json()
    assert r_data["verification_status"] == "VERIFIED"
    assert r_data["result"] == "MATCH"
    assert r_data["tamper_detected"] is False

def test_blockchain_ledger_endpoint():
    """Verify blockchain ledger endpoint returns blocks and transactions."""
    res = client.get("/api/v1/blockchain/ledger")
    assert res.status_code == 200
    ledger = res.json()
    assert "blocks" in ledger
    assert "transactions" in ledger
    assert len(ledger["blocks"]) >= 1

def test_campaign_graph_endpoint_all_and_filtered():
    """Verify attack graph returns nodes, edges, clusters, and handles campaign filtering safely."""
    # 1. Full Graph
    res_all = client.get("/api/v1/graph")
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert "nodes" in data_all
    assert "edges" in data_all
    assert "campaign_clusters" in data_all
    assert data_all["total_nodes"] >= 1

    # Check that edges only connect existing nodes (no broken edges)
    node_ids = {n["id"] for n in data_all["nodes"]}
    for edge in data_all["edges"]:
        assert edge["from"] in node_ids
        assert edge["to"] in node_ids

    # 2. Filtered Graph by specific case
    res_camp = client.get("/api/v1/graph?campaign_id=CASE-2026-0001")
    assert res_camp.status_code == 200
    data_camp = res_camp.json()
    assert "nodes" in data_camp
    assert "edges" in data_camp

    # 3. Non-existent campaign returns graceful empty state
    res_empty = client.get("/api/v1/graph?campaign_id=NON_EXISTENT_CAMPAIGN_9999")
    assert res_empty.status_code == 200
    data_empty = res_empty.json()
    assert data_empty["total_nodes"] == 0
    assert data_empty["total_edges"] == 0
    assert "No relationship data available" in data_empty["message"]
