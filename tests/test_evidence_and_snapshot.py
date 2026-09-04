import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_evidence
import update_code_snapshot as snap


def test_evidence_hash_is_sha256_of_commit():
    commit = "a" * 40
    assert snap.sha256_text(commit) == hashlib.sha256(commit.encode()).hexdigest()


def test_validate_example_evidence():
    payload = build_evidence.example_payload()
    parsed = build_evidence.validate_evidence(payload)
    assert parsed["condition_met"] is True
    assert parsed["payload_hash"]
    assert parsed["dealUrl"].startswith("https://")


def test_reject_bad_deal_url():
    payload = build_evidence.example_payload()
    payload["dealUrl"] = "http://insecure.example"
    try:
        build_evidence.validate_evidence(payload)
        assert False, "expected ValueError"
    except ValueError:
        pass


def test_reject_non_bool_condition_met():
    payload = build_evidence.example_payload()
    payload["condition_met"] = "yes"
    try:
        build_evidence.validate_evidence(payload)
        assert False, "expected ValueError"
    except ValueError:
        pass


def test_code_snapshot_file_consistent():
    path = ROOT / "CODE_SNAPSHOT.json"
    assert path.exists(), "CODE_SNAPSHOT.json missing — run scripts/update_code_snapshot.py update"
    pinned = json.loads(path.read_text())
    assert pinned["evidence_hash"] == snap.sha256_text(pinned["commit"])
    live_contract = snap.sha256_bytes((ROOT / "contracts" / "DealGuard.py").read_bytes())
    assert pinned["contract_hash"] == live_contract


def test_criteria_template_file():
    tmpl = json.loads((ROOT / "templates" / "deal_evidence.json").read_text())
    for key in ("dealUrl", "signature", "amount", "condition_met"):
        assert key in tmpl["example"]
