import hashlib
import json
from pathlib import Path

import pytest

from conftest import load_contract

ROOT = Path(__file__).resolve().parents[1]
mod = load_contract(ROOT, "DealGuard.py")

OWNER = "0x1111111111111111111111111111111111111111"
CLIENT = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
PROVIDER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
OTHER = "0xcccccccccccccccccccccccccccccccccccccccc"
URLS = '["https://test-server.genlayer.com/static/genvm/hello.html"]'
TERMS = "Provider must deliver a page that contains the word Hello"


def _c():
    return mod.DealGuard(OWNER)


def _sha_commit(commit: str) -> str:
    return hashlib.sha256(commit.encode()).hexdigest()


def test_create_deal_freezes_listing():
    import genlayer

    c = _c()
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-1", PROVIDER, TERMS, URLS, "100")
    deal = json.loads(c.get_deal("demo-1"))
    assert deal["status"] == "open"
    assert deal["client"] == CLIENT
    assert deal["provider"] == PROVIDER
    assert deal["amount"] == 100
    assert deal["listing_items"][0]["status"] == "ok"
    assert len(deal["listing_items"][0]["content_hash"]) == 64
    assert "demo-1" in json.loads(c.list_deals())


def test_create_deal_rejects_self_provider():
    import genlayer

    c = _c()
    genlayer.message.sender_address = CLIENT
    with pytest.raises(Exception, match="provider cannot be the client"):
        c.create_deal("x", CLIENT, TERMS, URLS, "10")


def test_fund_locks_escrow():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "500")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-fund", PROVIDER, TERMS, URLS, "120")
    c.fund("demo-fund")
    deal = json.loads(c.get_deal("demo-fund"))
    assert deal["status"] == "funded"
    bal = json.loads(c.get_balance(CLIENT))
    assert bal["available"] == 380
    assert bal["escrowed"] == 120


def test_fund_requires_client_and_balance():
    import genlayer

    c = _c()
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-nf", PROVIDER, TERMS, URLS, "50")
    with pytest.raises(Exception, match="insufficient balance"):
        c.fund("demo-nf")
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "50")
    genlayer.message.sender_address = PROVIDER
    with pytest.raises(Exception, match="only client"):
        c.fund("demo-nf")


def test_submit_delivery_freezes_urls():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "200")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-del", PROVIDER, TERMS, URLS, "80")
    c.fund("demo-del")
    genlayer.message.sender_address = PROVIDER
    c.submit_delivery("demo-del", URLS)
    deal = json.loads(c.get_deal("demo-del"))
    assert deal["status"] == "delivered"
    assert deal["delivery_items"][0]["status"] == "ok"
    assert len(deal["delivery_items"][0]["content_hash"]) == 64


def test_submit_delivery_only_provider():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "100")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-del2", PROVIDER, TERMS, URLS, "40")
    c.fund("demo-del2")
    with pytest.raises(Exception, match="only provider"):
        c.submit_delivery("demo-del2", URLS)


def test_dispute_sets_claim():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "100")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-dis", PROVIDER, TERMS, URLS, "30")
    c.fund("demo-dis")
    genlayer.message.sender_address = PROVIDER
    c.submit_delivery("demo-dis", URLS)
    genlayer.message.sender_address = CLIENT
    c.dispute("demo-dis", "Delivery does not match listing terms")
    deal = json.loads(c.get_deal("demo-dis"))
    assert deal["status"] == "disputed"
    assert "does not match" in deal["claim"]


def test_dispute_only_after_delivery():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "100")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-early", PROVIDER, TERMS, URLS, "25")
    c.fund("demo-early")
    with pytest.raises(Exception, match="must be delivered"):
        c.dispute("demo-early", "too early")


def test_release_happy_path():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "100")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-rel", PROVIDER, TERMS, URLS, "60")
    c.fund("demo-rel")
    genlayer.message.sender_address = PROVIDER
    c.submit_delivery("demo-rel", URLS)
    genlayer.message.sender_address = CLIENT
    c.release("demo-rel")
    deal = json.loads(c.get_deal("demo-rel"))
    assert deal["status"] == "completed"
    assert json.loads(c.get_balance(PROVIDER))["available"] == 60
    rep = json.loads(c.get_reputation(PROVIDER))
    assert rep["wins"] == 1


def test_adjudicate_pays_provider():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "100")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-adj", PROVIDER, TERMS, URLS, "70")
    c.fund("demo-adj")
    genlayer.message.sender_address = PROVIDER
    c.submit_delivery("demo-adj", URLS)
    genlayer.message.sender_address = CLIENT
    c.dispute("demo-adj", "please check")
    c.adjudicate("demo-adj")
    deal = json.loads(c.get_deal("demo-adj"))
    assert deal["status"] == "settled_pay"
    assert deal["pay_provider"] is True


def test_pin_code_snapshot_only_owner():
    import genlayer

    c = _c()
    commit = "a" * 40
    eh = _sha_commit(commit)
    ch = "b" * 64
    genlayer.message.sender_address = OTHER
    with pytest.raises(Exception, match="only owner"):
        c.pin_code_snapshot(commit, eh, ch, "2026-01-01T00:00:00Z")
    genlayer.message.sender_address = OWNER
    c.pin_code_snapshot(commit, eh, ch, "2026-01-01T00:00:00Z")
    snap = json.loads(c.get_code_snapshot())
    assert snap["commit"] == commit
    assert snap["evidence_hash"] == eh


def test_store_evidence_condition_met():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "100")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-ev", PROVIDER, TERMS, URLS, "100")
    c.fund("demo-ev")
    payload = {
        "dealUrl": "https://test-server.genlayer.com/static/genvm/hello.html",
        "signature": "0x" + ("ab" * 32),
        "amount": "100",
        "condition_met": True,
        "metadata": {"deal_id": "demo-ev"},
    }
    c.store_evidence("demo-ev", json.dumps(payload))
    ev = json.loads(c.get_evidence("demo-ev"))
    assert ev["condition_met"] is True
    assert ev["payload_hash"]
    tmpl = json.loads(c.get_criteria_template())
    assert "dealUrl" in tmpl["required_fields"]


def test_cross_check_static_fixture_matches():
    import genlayer

    c = _c()
    genlayer.message.sender_address = OWNER
    c.credit(CLIENT, "100")
    genlayer.message.sender_address = CLIENT
    c.create_deal("demo-cc", PROVIDER, TERMS, URLS, "10")
    c.fund("demo-cc")
    genlayer.message.sender_address = PROVIDER
    c.submit_delivery("demo-cc", URLS)
    c.cross_check("demo-cc")
    deal = json.loads(c.get_deal("demo-cc"))
    assert deal["checks"] == 1
    assert deal["tampered_listing"] is False
    assert deal["tampered_delivery"] is False
