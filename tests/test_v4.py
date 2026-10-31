"""v4: what a steward can check without trusting the model.

Grouped by property: a review deadline that splits time in two (release, dispute and the
adjudications before it, expire_review from it), a refund that cannot rest on a partial reading,
every round kept on chain, a registry with no cap, and code the linter accepts.
"""

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from conftest import load_contract, pay, reset  # noqa: E402

mod = load_contract(ROOT)
gl = sys.modules["genlayer"]
UserError = gl.vm.UserError

OWNER = "0x1111111111111111111111111111111111111111"
CLIENT = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
PROVIDER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
OTHER = "0xcccccccccccccccccccccccccccccccccccccccc"
LISTING = "https://shop.example/listing"
DELIVERY_URL = "https://provider.example/delivery"
URLS = json.dumps([LISTING])
DELIVERY = json.dumps([DELIVERY_URL])
TERMS = "Provider must deliver a page that contains the word Hello"
GEN = 10**18
HOUR = 3600
DAY = 86400
D = "demo-1"
PAY = '{"pay_provider": true}'
REFUND = '{"pay_provider": false}'
SOURCE = (ROOT / "contracts" / "DealGuard.py").read_text(encoding="utf-8")
SHORT = "Hello from the provider: the page is delivered."
LONG = "Hello. " + ("This sentence is filler about unrelated things. " * 200)


@pytest.fixture(autouse=True)
def _fresh():
    reset(gl)
    gl.pages = {LISTING: "Listing: a page that says Hello", DELIVERY_URL: SHORT}
    yield


def as_(who):
    gl.message.sender_address = who


def new():
    as_(OWNER)
    return mod.DealGuard(OWNER)


def funded(c, deal_id=D, window="3600", review="3600", appeal="3600"):
    as_(CLIENT)
    c.create_deal(deal_id, PROVIDER, TERMS, URLS, str(GEN), "86400", appeal, review)
    pay(gl, c.fund, GEN, deal_id)


def delivered(c=None, **kw):
    c = c or new()
    funded(c, **kw)
    as_(PROVIDER)
    c.submit_delivery(kw.get("deal_id", D), DELIVERY)
    return c


def deal(c, deal_id=D):
    return json.loads(c.get_deal(deal_id))


def sched(c, deal_id=D):
    return json.loads(c.get_schedule(deal_id))


def review_deadline(c):
    return int(deal(c)["review_deadline"])


# -- the review deadline: release/dispute/adjudicate vs expire_review -----------------


def test_the_review_deadline_is_committed_at_creation_and_set_at_delivery():
    c = delivered()
    d = deal(c)
    assert (
        d["review_window"] == 3600 and d["review_deadline"] == d["delivered_at"] + 3600
    )


def test_the_default_review_window_is_seven_days():
    c = new()
    as_(CLIENT)
    c.create_deal(D, PROVIDER, TERMS, URLS, str(GEN))
    assert deal(c)["review_window"] == 7 * DAY


@pytest.mark.parametrize("bad", ["59", "119", "2592001", "abc", "-5", ""])
def test_a_review_window_out_of_range_is_refused(bad):
    c = new()
    as_(CLIENT)
    with pytest.raises(UserError, match="review_window"):
        c.create_deal(D, PROVIDER, TERMS, URLS, str(GEN), "86400", "3600", bad)


def test_one_second_before_the_deadline_the_party_actions_work_and_expire_review_does_not():
    c = delivered()
    gl.clock = review_deadline(c) - 1
    s = sched(c)
    assert s["can_release"] and s["can_dispute"] and s["can_adjudicate"]
    assert not s["can_expire_review"]
    as_(OTHER)
    with pytest.raises(UserError, match="opens at"):
        c.expire_review(D)
    as_(CLIENT)
    c.dispute(D, "the delivery is thin")


def test_at_the_deadline_release_dispute_and_adjudicate_are_refused_and_expire_review_works():
    c = delivered()
    gl.clock = review_deadline(c)
    s = sched(c)
    assert s["can_expire_review"]
    assert not (s["can_release"] or s["can_dispute"] or s["can_adjudicate"])
    as_(CLIENT)
    with pytest.raises(UserError, match="only expire_review"):
        c.release(D)
    with pytest.raises(UserError, match="only expire_review"):
        c.dispute(D, "too late")
    as_(OTHER)
    gl.llm_reply = PAY
    with pytest.raises(UserError, match="only expire_review"):
        c.adjudicate(D)
    out = json.loads(c.expire_review(D))
    assert out["pay_provider"] is False and out["to"] == CLIENT


def test_a_delivered_deal_nobody_ruled_on_refunds_the_client_after_the_deadline():
    c = delivered()
    gl.clock = review_deadline(c)
    as_(OTHER)
    c.expire_review(D)
    d = deal(c)
    assert d["status"] == "settled_refund" and d["outcome"] == "review_expired_refund"
    assert gl.transfers == [(CLIENT, GEN)] and gl.balance == 0


def test_a_disputed_deal_nobody_ruled_on_also_refunds_the_client():
    c = delivered()
    as_(PROVIDER)
    c.dispute(D, "I delivered")
    gl.clock = review_deadline(c)
    as_(OTHER)
    c.expire_review(D)
    assert deal(c)["outcome"] == "review_expired_refund" and gl.transfers == [
        (CLIENT, GEN)
    ]


def test_competing_calls_at_the_deadline_reach_only_one_outcome():
    c = delivered()
    gl.clock = review_deadline(c)
    as_(CLIENT)
    results = []
    for call in (
        lambda: c.release(D),
        lambda: c.expire_review(D),
        lambda: c.release(D),
        lambda: c.adjudicate(D),
    ):
        try:
            call()
            results.append("ok")
        except UserError:
            results.append("refused")
    assert results == ["refused", "ok", "refused", "refused"]
    assert gl.transfers == [(CLIENT, GEN)]


def test_the_schedule_never_offers_a_party_action_together_with_expire_review():
    c = delivered()
    start, end = int(deal(c)["delivered_at"]), review_deadline(c)
    for t in range(start, end + 120, 71):
        gl.clock = t
        s = sched(c)
        assert not (
            s["can_expire_review"]
            and (s["can_release"] or s["can_adjudicate"] or s["can_dispute"])
        )
    for t in (end - 1, end, end + 1):
        gl.clock = t
        assert sched(c)["can_expire_review"] == (t >= end)


def test_expire_review_is_refused_on_a_deal_that_is_not_waiting_for_a_ruling():
    c = new()
    funded(c)
    as_(OTHER)
    with pytest.raises(UserError, match="delivered, disputed or appealed"):
        c.expire_review(D)
    as_(PROVIDER)
    c.submit_delivery(D, DELIVERY)
    as_(OTHER)
    gl.llm_reply = PAY
    c.adjudicate(D)  # now ruled: the appeal window, not the review deadline, governs it
    gl.clock = review_deadline(c) + 1
    with pytest.raises(UserError, match="delivered, disputed or appealed"):
        c.expire_review(D)


def test_a_ruling_inside_the_deadline_still_settles_after_it_when_nobody_appeals():
    c = delivered()
    gl.llm_reply = PAY
    as_(OTHER)
    c.adjudicate(D)
    gl.clock = review_deadline(c) + 10 * HOUR
    c.settle(D)
    assert deal(c)["status"] == "settled_pay" and gl.transfers == [(PROVIDER, GEN)]


def test_an_appeal_gets_its_own_review_deadline_and_cannot_be_decided_after_it():
    c = delivered()
    gl.llm_reply = PAY
    as_(OTHER)
    c.adjudicate(D)
    as_(CLIENT)
    c.appeal(D, "this is not what the terms asked for")
    appeal_due = review_deadline(c)
    assert appeal_due == gl.clock + 3600
    gl.clock = appeal_due
    s = sched(c)
    assert s["can_expire_review"] and not s["can_adjudicate_appeal"]
    as_(OTHER)
    gl.llm_reply = REFUND
    with pytest.raises(UserError, match="only expire_review"):
        c.adjudicate_appeal(D)


def test_an_appeal_nobody_decided_in_time_keeps_the_first_ruling():
    c = delivered()
    gl.llm_reply = PAY
    as_(OTHER)
    c.adjudicate(D)
    as_(CLIENT)
    c.appeal(D, "the page is thin")
    gl.clock = review_deadline(c)
    as_(OTHER)
    c.expire_review(D)
    d = deal(c)
    assert d["outcome"] == "review_expired_pay" and gl.transfers == [(PROVIDER, GEN)]


def test_one_second_before_the_appeal_deadline_the_appeal_can_still_be_decided():
    c = delivered()
    gl.llm_reply = PAY
    as_(OTHER)
    c.adjudicate(D)
    as_(CLIENT)
    c.appeal(D, "the page is thin")
    gl.clock = review_deadline(c) - 1
    gl.llm_reply = REFUND
    as_(OTHER)
    out = json.loads(c.adjudicate_appeal(D))
    assert out["final"] is True and out["to"] == CLIENT


# -- a refund cannot rest on a partial reading ------------------------------------------


def long_delivery():
    gl.pages[DELIVERY_URL] = LONG
    return delivered()


def test_a_refund_from_a_page_the_judge_only_partly_saw_is_inconclusive():
    c = long_delivery()
    gl.llm_reply = REFUND
    as_(OTHER)
    out = json.loads(c.adjudicate(D))
    assert out == {"final": False, "round": 1, "ruling": "inconclusive"}
    d = deal(c)
    assert d["status"] == "delivered" and d["escrow"] == str(GEN) and gl.transfers == []
    r = json.loads(c.get_round(D, 1))
    assert (
        r["verdict"] == "inconclusive"
        and r["delivery_complete"] is False
        and r["model_pay"] is False
    )


def test_an_inconclusive_round_leaves_the_deal_open_and_the_deadline_returns_the_money():
    c = long_delivery()
    gl.llm_reply = REFUND
    as_(OTHER)
    c.adjudicate(D)
    as_(CLIENT)
    c.dispute(D, "I think the delivery is thin")
    gl.clock = review_deadline(c)
    as_(OTHER)
    c.expire_review(D)
    assert deal(c)["outcome"] == "review_expired_refund"


def test_a_payment_decided_from_a_partial_page_is_still_a_ruling():
    c = long_delivery()
    gl.llm_reply = PAY
    as_(OTHER)
    out = json.loads(c.adjudicate(D))
    assert out["pay_provider"] is True and out["final"] is False
    assert json.loads(c.get_round(D, 1))["verdict"] == "pay"


def test_a_refund_from_a_whole_short_page_is_a_real_ruling():
    c = delivered()
    gl.llm_reply = REFUND
    as_(OTHER)
    out = json.loads(c.adjudicate(D))
    assert out["pay_provider"] is False and out["final"] is False
    assert json.loads(c.get_round(D, 1))["delivery_complete"] is True


def test_a_delivery_page_with_nothing_readable_cannot_even_be_frozen():
    gl.pages[DELIVERY_URL] = ""
    c = new()
    funded(c)
    as_(PROVIDER)
    with pytest.raises(UserError):
        c.submit_delivery(D, DELIVERY)


def test_an_inconclusive_appeal_round_keeps_the_deal_appealed_and_the_first_ruling_stands():
    c = long_delivery()
    gl.llm_reply = PAY
    as_(OTHER)
    c.adjudicate(D)
    as_(CLIENT)
    c.appeal(D, "the page is thin")
    gl.llm_reply = REFUND  # a refund from a partial reading of the long page
    as_(OTHER)
    out = json.loads(c.adjudicate_appeal(D))
    assert out == {"appeal": "inconclusive", "final": False, "round": 2}
    assert deal(c)["status"] == "appealed" and gl.transfers == []
    assert json.loads(c.get_round(D, 2))["kind"] == "appeal"
    gl.clock = review_deadline(c)
    c.expire_review(D)
    assert deal(c)["outcome"] == "review_expired_pay" and gl.transfers == [
        (PROVIDER, GEN)
    ]


def test_the_completeness_helper_tells_whole_from_partial_pages():
    whole = [{"status": "ok", "total_chars": 5, "excerpts": [{"text": "Hello"}]}]
    partial = [{"status": "ok", "total_chars": 50, "excerpts": [{"text": "Hello"}]}]
    unreadable = [{"status": "empty", "total_chars": 0, "excerpts": []}]
    assert mod.view_is_complete(whole) and mod.view_is_complete(unreadable)
    assert not mod.view_is_complete(partial)


# -- every round is kept ------------------------------------------------------------------


def test_every_round_is_kept_with_the_hashes_of_what_the_judge_read():
    c = delivered()
    gl.llm_reply = PAY
    as_(OTHER)
    c.adjudicate(D)
    as_(CLIENT)
    c.appeal(D, "thin")
    gl.llm_reply = REFUND
    as_(OTHER)
    c.adjudicate_appeal(D)
    r1, r2 = json.loads(c.get_round(D, 1)), json.loads(c.get_round(D, 2))
    assert (r1["kind"], r2["kind"]) == ("ruling", "appeal")
    assert r1["delivery_read"][0]["sha256"] == mod._hash_text(SHORT)
    assert r1["delivery_read"][0]["chars_shown"] == len(SHORT)
    assert r1["listing_sha256"] and r2["grounds_sha256"] == mod._hash_text("thin")
    assert deal(c)["rounds"] == 2


def test_an_unknown_round_is_reported_not_raised():
    c = delivered()
    assert "error" in json.loads(c.get_round(D, 9))


def test_the_round_log_survives_the_live_page_changing():
    c = delivered()
    gl.llm_reply = PAY
    as_(OTHER)
    c.adjudicate(D)
    gl.pages[DELIVERY_URL] = "something else entirely"
    assert json.loads(c.get_round(D, 1))["delivery_read"][0][
        "sha256"
    ] == mod._hash_text(SHORT)


# -- registry capacity ----------------------------------------------------------------------


def test_there_is_no_global_cap_and_storage_is_indexed():
    assert "MAX_EVENTS" not in SOURCE and "MAX_DEALS" not in SOURCE
    assert "TreeMap[str, str]" in SOURCE and "DynArray[str]" in SOURCE
    assert "deals_json" not in SOURCE and "events_json" not in SOURCE


def test_deals_keep_being_created_far_past_the_old_event_cap_and_events_are_paged():
    c = new()
    as_(CLIENT)
    for i in range(260):
        c.create_deal(f"d{i}", PROVIDER, TERMS, URLS, "1000", "86400")
    assert c.count_deals() == 260 and c.count_events() == 260
    page = json.loads(c.get_events(250, 50))
    assert (
        page["total"] == 260
        and len(page["items"]) == 10
        and page["items"][0]["n"] == 250
    )
    assert (
        json.loads(c.get_events(0, 1000))["items"].__len__() == 50
    )  # capped page size


def test_deals_are_listed_page_by_page():
    c = new()
    as_(CLIENT)
    for i in range(7):
        c.create_deal(f"p{i}", PROVIDER, TERMS, URLS, "1000", "86400")
    page = json.loads(c.list_deals(0, 3))
    assert page["total"] == 7 and [i[0] for i in page["items"]] == ["p0", "p1", "p2"]
    assert [i[0] for i in json.loads(c.list_deals(6, 50))["items"]] == ["p6"]
    assert json.loads(c.list_deals(60, 5))["items"] == []
    assert json.loads(c.list_deals(0, 2))["items"][0] == ["p0", "open"]


def test_the_stats_are_running_counters_that_match_the_money():
    c = new()
    funded(c)
    assert json.loads(c.get_stats()) == {
        "deals": 1,
        "tampered": 0,
        "escrowed": str(GEN),
        "paid_out": "0",
    }
    as_(PROVIDER)
    c.submit_delivery(D, DELIVERY)
    as_(CLIENT)
    c.release(D)
    assert json.loads(c.get_stats()) == {
        "deals": 1,
        "tampered": 0,
        "escrowed": "0",
        "paid_out": str(GEN),
    }


def test_the_escrow_counter_always_equals_what_the_contract_holds():
    c = new()
    for i in range(5):
        funded(c, deal_id=f"m{i}")
    assert int(json.loads(c.get_stats())["escrowed"]) == gl.balance == 5 * GEN
    gl.clock += 10 * DAY
    as_(CLIENT)
    c.reclaim("m0")
    assert int(json.loads(c.get_stats())["escrowed"]) == gl.balance == 4 * GEN


# -- code hygiene (what stewards lint) --------------------------------------------------------


def test_errors_are_user_errors_and_no_method_is_static():
    assert "raise Exception" not in SOURCE
    assert "@staticmethod" not in SOURCE and "@classmethod" not in SOURCE
    assert SOURCE.count("gl.vm.UserError") > 40


def test_the_runner_in_the_header_is_the_current_one():
    first = SOURCE.splitlines()[:2]
    assert first[0] == "# v0.3.0" and "py-genlayer:babwp9t3" in first[1]
