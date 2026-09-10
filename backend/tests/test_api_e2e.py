import urllib.request
import json
import pytest

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api_health():
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode())
        assert data["status"] == "HEALTHY"

def test_list_evidence():
    with urllib.request.urlopen(f"{BASE_URL}/evidence") as resp:
        assert resp.status == 200
        evs = json.loads(resp.read().decode())
        assert len(evs) >= 1
        ev_ids = [e["evidence_id"] for e in evs]
        assert any(e.startswith("EV-2026-") for e in ev_ids)

def test_evidence_detail():
    with urllib.request.urlopen(f"{BASE_URL}/evidence") as resp:
        evs = json.loads(resp.read().decode())
        target_id = evs[0]["evidence_id"]

    with urllib.request.urlopen(f"{BASE_URL}/evidence/{target_id}") as resp:
        assert resp.status == 200
        detail = json.loads(resp.read().decode())
        assert detail["evidence_id"] == target_id
        assert len(detail["sha256"]) == 64
        assert len(detail["sha3_256"]) == 64
        assert "auth" in detail
        assert "threat_score" in detail
        assert "smtp_hops" in detail
        assert "custody_logs" in detail

def test_stix_export():
    with urllib.request.urlopen(f"{BASE_URL}/evidence") as resp:
        evs = json.loads(resp.read().decode())
        target_id = evs[0]["evidence_id"]

    with urllib.request.urlopen(f"{BASE_URL}/evidence/{target_id}/stix") as resp:
        assert resp.status == 200
        stix = json.loads(resp.read().decode())
        assert stix["type"] == "bundle"
        assert "objects" in stix

def test_copilot_query():
    with urllib.request.urlopen(f"{BASE_URL}/evidence") as resp:
        evs = json.loads(resp.read().decode())
        target_id = evs[0]["evidence_id"]

    req_data = json.dumps({
        "evidence_id": target_id,
        "query": "Why is this email suspicious?"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        f"{BASE_URL}/copilot/query",
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        ans = json.loads(resp.read().decode())
        assert "answer" in ans
        assert len(ans["answer"]) > 20

def test_attack_graph():
    with urllib.request.urlopen(f"{BASE_URL}/graph") as resp:
        assert resp.status == 200
        graph = json.loads(resp.read().decode())
        assert "nodes" in graph
        assert "edges" in graph
        assert len(graph["nodes"]) > 0

def test_case_insensitive_search():
    # Test uppercase and lowercase
    for q in ["ACME", "acme", "AcMe"]:
        with urllib.request.urlopen(f"{BASE_URL}/search?q={q}") as resp:
            assert resp.status == 200
            res = json.loads(resp.read().decode())
            assert "results" in res

def test_case_lifecycle_crud():
    # 1. Create Case
    create_payload = json.dumps({
        "title": "Automated Test Case Lifecycle",
        "severity": "CRITICAL",
        "assigned_analyst": "QA Bot",
        "summary": "Testing CRUD lifecycle of investigation case"
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/cases", data=create_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        created = json.loads(resp.read().decode())
        case_id = created["case_id"]

    # 2. Get Case Detail
    with urllib.request.urlopen(f"{BASE_URL}/cases/{case_id}") as resp:
        assert resp.status == 200
        c_detail = json.loads(resp.read().decode())
        assert c_detail["title"] == "Automated Test Case Lifecycle"
        assert c_detail["status"] == "OPEN"

    # 3. Add Note
    note_payload = json.dumps({"author": "QA Bot", "note": "Forensic test note."}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/cases/{case_id}/notes", data=note_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200

    # 4. Update Case
    update_payload = json.dumps({"status": "INVESTIGATING", "severity": "HIGH"}).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/cases/{case_id}", data=update_payload, headers={"Content-Type": "application/json"}, method="PUT")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200

    # Verify update
    with urllib.request.urlopen(f"{BASE_URL}/cases/{case_id}") as resp:
        updated = json.loads(resp.read().decode())
        assert updated["status"] == "INVESTIGATING"
        assert len(updated["notes"]) == 1

    # 5. Delete Case
    req = urllib.request.Request(f"{BASE_URL}/cases/{case_id}", method="DELETE")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200

    # Verify 404 after deletion
    try:
        urllib.request.urlopen(f"{BASE_URL}/cases/{case_id}")
        assert False, "Should have raised 404"
    except urllib.error.HTTPError as e:
        assert e.code == 404

def test_evidence_ingestion_and_deletion_lifecycle():
    # 1. Ingest a temporary test email
    raw_eml = b"From: test@spoofed.com\r\nTo: victim@company.com\r\nSubject: Temp Delete Test\r\n\r\nTesting delete"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="raw_text"\r\n\r\n'
        f"From: test@spoofed.com\nTo: victim@company.com\nSubject: Temp Delete Test\n\nTesting delete\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/evidence/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        ingested = json.loads(resp.read().decode())
        temp_id = ingested["evidence_id"]

    # 2. Verify it exists
    with urllib.request.urlopen(f"{BASE_URL}/evidence/{temp_id}") as resp:
        assert resp.status == 200

    # 3. Delete evidence
    req = urllib.request.Request(f"{BASE_URL}/evidence/{temp_id}", method="DELETE")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        del_resp = json.loads(resp.read().decode())
        assert del_resp["status"] == "SUCCESS"

    # 4. Verify 404 after deletion
    try:
        urllib.request.urlopen(f"{BASE_URL}/evidence/{temp_id}")
        assert False, "Should have raised 404"
    except urllib.error.HTTPError as e:
        assert e.code == 404
