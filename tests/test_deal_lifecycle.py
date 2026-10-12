"""Deal lifecycle: create, fund with real value, deliver, release, dispute, adjudicate."""

import hashlib
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from conftest import advance, load_contract, pay, reset  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
mod = load_contract(ROOT, "DealGuard.py")
gl = sys.modules["genlayer"]

OWNER = "0x1111111111111111111111111111111111111111"
CLIENT = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
PROVIDER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
OTHER = "0xcccccccccccccccccccccccccccccccccccccccc"
URLS = '["https://test-server.genlayer.com/static/genvm/hello.html"]'
DELIVERY = '["https://provider.example/delivery"]'
TERMS = "Provider must deliver a page that contains the word Hello"
GEN = 10**18
DAY = 86400
D = "demo-1"


def _adj(c, deal_id=D):
    """Rule, let the appeal window pass with no appeal, and pay the ruling."""
    c.adjudicate(deal_id)
    advance(gl, 3601)
    return c.settle(deal_id)


@pytest.fixture(autouse=True)
def _fresh():
    reset(gl)
    yield


def _c():
    gl.message.sender_address = OWNER
    return mod.DealGuard(OWNER)


def _created(amount=GEN, window=str(DAY)):
    c = _c()
    gl.message.sender_address = CLIENT
    c.create_deal(D, PROVIDER, TERMS, URLS, str(amount), window)
    return c


def _funded(amount=GEN, window=str(DAY)):
    c = _created(amount, window)
    gl.message.sender_address = CLIENT
    pay(gl, c.fund, amount, D)
    return c


def _delivered(amount=GEN):
    c = _funded(amount)
    gl.message.sender_address = PROVIDER
    c.submit_delivery(D, DELIVERY)
    return c


def _deal(c):
    return json.loads(c.get_deal(D))


def _sha_commit(commit: str) -> str:
    return hashlib.sha256(commit.encode()).hexdigest()


def test_create_deal_freezes_listing_and_commits_amount_and_window():
    c = _created()
    deal = _deal(c)
    assert (
        deal["status"] == "open"
        and deal["client"] == CLIENT
        and deal["provider"] == PROVIDER
    )
    assert deal["amount"] == str(GEN) and deal["delivery_window"] == DAY
    assert deal["escrow"] == "0"
    item = deal["listing_items"][0]
    assert item["status"] == "ok" and len(item["content_hash"]) == 64
    assert item["excerpts"][0]["text"] == "Hello world! GenLayer fixture page"
    assert D in json.loads(c.list_deals())


def test_create_deal_validation():
    c = _c()
    gl.message.sender_address = CLIENT
    with pytest.raises(Exception, match="provider cannot be the client"):
        c.create_deal("x", CLIENT, TERMS, URLS, "10")
    with pytest.raises(Exception, match="provider cannot be the client"):
        c.create_deal("x", CLIENT.upper().replace("0X", "0x"), TERMS, URLS, "10")
    with pytest.raises(Exception, match="amount must be positive"):
        c.create_deal("x", PROVIDER, TERMS, URLS, "0")
    with pytest.raises(Exception, match="amount exceeds max"):
        c.create_deal("x", PROVIDER, TERMS, URLS, str(10**24 + 1))
    with pytest.raises(Exception, match="delivery_window must be between"):
        c.create_deal("x", PROVIDER, TERMS, URLS, "10", "5")
    with pytest.raises(Exception, match="https://"):
        c.create_deal("x", PROVIDER, TERMS, '["http://insecure.example"]', "10")
    c.create_deal(D, PROVIDER, TERMS, URLS, "10")
    with pytest.raises(Exception, match="already exists"):
        c.create_deal(D, PROVIDER, TERMS, URLS, "10")


def test_fund_puts_the_deal_amount_in_the_contract_balance():
    c = _created()
    gl.message.sender_address = CLIENT
    out = json.loads(pay(gl, c.fund, GEN, D))
    assert out == {"funded": True, "escrowed": str(GEN), "credited": "0"}
    deal = _deal(c)
    assert deal["status"] == "funded" and deal["escrow"] == str(GEN)
    assert deal["delivery_due_at"] == deal["funded_at"] + DAY
    assert gl.balance == GEN and c.get_escrow_balance() == str(GEN)
    assert json.loads(c.get_stats())["escrowed"] == str(GEN)


def test_submit_delivery_freezes_urls_and_is_provider_only():
    c = _funded()
    gl.message.sender_address = CLIENT
    with pytest.raises(Exception, match="only provider"):
        c.submit_delivery(D, DELIVERY)
    gl.message.sender_address = PROVIDER
    c.submit_delivery(D, DELIVERY)
    deal = _deal(c)
    assert deal["status"] == "delivered" and deal["delivery_items"][0]["status"] == "ok"
    assert deal["delivered_at"] > 0


def test_release_pays_the_provider_from_escrow():
    c = _delivered()
    gl.message.sender_address = CLIENT
    assert c.release(D) == str(GEN)
    deal = _deal(c)
    assert deal["status"] == "completed" and deal["outcome"] == "release"
    assert deal["escrow"] == "0" and deal["paid_to"] == PROVIDER
    assert deal["paid_amount"] == str(GEN)
    assert gl.transfers == [(PROVIDER, GEN)] and gl.balance == 0
    assert json.loads(c.get_reputation(PROVIDER))["wins"] == 1


def test_dispute_then_adjudicate_pays_the_provider_when_validators_agree():
    c = _delivered()
    gl.message.sender_address = CLIENT
    c.dispute(D, "The page does not contain what was promised")
    assert _deal(c)["status"] == "disputed"
    gl.llm_reply = '{"pay_provider": true}'
    gl.message.sender_address = OTHER
    out = json.loads(_adj(c))
    assert out == {
        "pay_provider": True,
        "amount": str(GEN),
        "to": PROVIDER,
        "final": True,
    }
    deal = _deal(c)
    assert deal["status"] == "settled_pay" and deal["outcome"] == "adjudicate_pay"
    assert gl.transfers == [(PROVIDER, GEN)] and gl.balance == 0
    assert json.loads(c.get_reputation(CLIENT))["disputed"] == 1


def test_adjudicate_refunds_the_client_when_validators_say_no():
    c = _delivered()
    gl.message.sender_address = PROVIDER
    c.dispute(D, "The client refuses to release")
    gl.llm_reply = '{"pay_provider": false}'
    out = json.loads(_adj(c))
    assert out == {
        "pay_provider": False,
        "amount": str(GEN),
        "to": CLIENT,
        "final": True,
    }
    assert _deal(c)["status"] == "settled_refund"
    assert gl.transfers == [(CLIENT, GEN)] and gl.balance == 0


def test_dispute_only_after_delivery_and_only_by_a_party():
    c = _funded()
    gl.message.sender_address = CLIENT
    with pytest.raises(Exception, match="must be delivered"):
        c.dispute(D, "too early")
    c = _delivered()
    gl.message.sender_address = OTHER
    with pytest.raises(Exception, match="only parties"):
        c.dispute(D, "not my deal")


def test_pin_code_snapshot_only_owner():
    c = _c()
    commit = "a" * 40
    gl.message.sender_address = OTHER
    with pytest.raises(Exception, match="only owner"):
        c.pin_code_snapshot(
            commit, _sha_commit(commit), "b" * 64, "2026-10-09T00:00:00Z"
        )
    gl.message.sender_address = OWNER
    with pytest.raises(Exception, match="must equal sha256"):
        c.pin_code_snapshot(commit, "c" * 64, "b" * 64, "2026-10-09T00:00:00Z")
    c.pin_code_snapshot(commit, _sha_commit(commit), "b" * 64, "2026-10-09T00:00:00Z")
    snap = json.loads(c.get_code_snapshot())
    assert snap["commit"] == commit and snap["contract_hash"] == "b" * 64


def test_store_evidence_is_for_the_parties_and_must_match_the_amount():
    c = _delivered()
    payload = {
        "dealUrl": "https://provider.example/delivery",
        "signature": "0x" + "ab" * 32,
        "amount": str(GEN),
        "condition_met": True,
        "metadata": {"deal_id": D},
    }
    gl.message.sender_address = OWNER
    with pytest.raises(Exception, match="only deal parties"):
        c.store_evidence(D, json.dumps(payload))
    gl.message.sender_address = PROVIDER
    with pytest.raises(Exception, match="must match deal amount"):
        c.store_evidence(D, json.dumps({**payload, "amount": "5"}))
    with pytest.raises(Exception, match="must be a boolean"):
        c.store_evidence(D, json.dumps({**payload, "condition_met": "yes"}))
    c.store_evidence(D, json.dumps(payload))
    stored = json.loads(c.get_evidence(D))
    assert stored["condition_met"] is True and stored["submitter"] == PROVIDER
    assert _deal(c)["evidence_payload_hash"] == stored["payload_hash"]


def test_cross_check_flags_a_page_that_changed_after_freezing():
    c = _delivered()
    c.cross_check(D)
    deal = _deal(c)
    assert deal["tampered_listing"] is False and deal["tampered_delivery"] is False
    gl.pages["https://provider.example/delivery"] = "Something else entirely"
    c.cross_check(D)
    deal = _deal(c)
    assert deal["tampered_delivery"] is True and deal["tampered_listing"] is False
    assert deal["checks"] == 2 and json.loads(c.get_stats())["tampered"] == 1


def test_the_schedule_view_says_which_step_is_accepted():
    c = _created()
    s = json.loads(c.get_schedule(D))
    assert s["can_fund"] is True and s["can_deliver"] is False and s["escrow"] == "0"
    gl.message.sender_address = CLIENT
    pay(gl, c.fund, GEN, D)
    s = json.loads(c.get_schedule(D))
    assert (
        s["can_deliver"] is True
        and s["can_reclaim"] is False
        and s["escrow"] == str(GEN)
    )
    advance(gl, DAY)
    s = json.loads(c.get_schedule(D))
    assert s["can_deliver"] is False and s["can_reclaim"] is True
