# { "Depends": "py-genlayer:15qfivjvy80800rh998pcxmd2m8va1wq2qzqhz850n8ggcr4i9q0" }

from genlayer import *
import hashlib
import json
import re

# DealGuard — agentic commerce escrow with frozen web evidence + LLM settlement.
# Copyright (c) 2026 Valentyn Zubok. MIT License.
#
# Lifecycle:
#   credit → create_deal (freeze listings) → fund → submit_delivery (freeze)
#   → release (happy path) | dispute → adjudicate (LLM on FROZEN evidence)
#   → cross_check (prove URL rot / tamper)
#   → pin_code_snapshot / store_evidence (Agent Tank integrity + deal proofs)
#
# Balances are bookkeeping units for Studionet demos (not native GL transfer).
# Adjudication compares ONLY the boolean/string decision fields under consensus.
# Admin writes (credit, pin_code_snapshot, transfer_ownership) are onlyOwner.

MAX_ID_LEN = 64
MAX_TERMS_LEN = 1500
MAX_CLAIM_LEN = 800
MAX_URLS = 6
MAX_AMOUNT = 1_000_000_000
PREVIEW_CHARS = 280
HASH_ALGO = "sha256"
MAX_EVENTS = 200

STATUS_OPEN = "open"
STATUS_FUNDED = "funded"
STATUS_DELIVERED = "delivered"
STATUS_COMPLETED = "completed"
STATUS_DISPUTED = "disputed"
STATUS_SETTLED_PAY = "settled_pay"
STATUS_SETTLED_REFUND = "settled_refund"

ADDR_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")
HTTPS_URL_RE = re.compile(r"^https://[^\s<>\"']+$", re.IGNORECASE)


def _normalize_id(deal_id: str) -> str:
    did = str(deal_id).strip()
    if not did:
        raise Exception("deal_id is required")
    if len(did) > MAX_ID_LEN:
        raise Exception("deal_id exceeds 64 chars")
    for ch in did:
        ok = ("a" <= ch.lower() <= "z") or ("0" <= ch <= "9") or ch in "-_/"
        if not ok:
            raise Exception("deal_id: only a-z, 0-9, -, _, /")
    return did


def _require_address(label: str, value: str) -> str:
    addr = str(value).strip()
    if not ADDR_RE.match(addr):
        raise Exception(f"{label} must be a 0x address")
    return addr


def _parse_amount(amount) -> int:
    try:
        amt = int(str(amount).strip())
    except Exception:
        raise Exception("amount must be a positive integer")
    if amt <= 0:
        raise Exception("amount must be positive")
    if amt > MAX_AMOUNT:
        raise Exception("amount exceeds max")
    return amt


def _sanitize_text(label: str, text: str, max_len: int) -> str:
    cleaned = " ".join(str(text).split())
    if not cleaned:
        raise Exception(f"{label} is required")
    if len(cleaned) > max_len:
        raise Exception(f"{label} exceeds {max_len} chars")
    return cleaned


def _normalize(text: str) -> str:
    return " ".join(str(text).split())


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _parse_urls(urls_json: str) -> list:
    try:
        parsed = json.loads(urls_json)
    except Exception:
        raise Exception("urls_json must be a JSON array of https URL strings")
    if not isinstance(parsed, list) or len(parsed) == 0:
        raise Exception("provide at least one URL")
    if len(parsed) > MAX_URLS:
        raise Exception(f"max {MAX_URLS} URLs")
    urls = []
    for u in parsed:
        if not isinstance(u, str) or not HTTPS_URL_RE.match(u.strip()):
            raise Exception("each URL must be https:// with no whitespace")
        if len(u) > 2048:
            raise Exception("URL exceeds 2048 chars")
        urls.append(u.strip())
    return urls


def _capture_urls(urls: list) -> str:
    items = []
    for url in urls:
        entry = {
            "url": url,
            "content_hash": "",
            "hash_algo": HASH_ALGO,
            "preview": "",
            "byte_len": 0,
            "status": "error",
        }
        try:
            raw = gl.get_webpage(url, mode="text")
            if raw is None or str(raw).strip() == "":
                raw = gl.get_webpage(url, mode="html")
            normalized = _normalize(raw if raw is not None else "")
            if normalized == "":
                entry["status"] = "empty"
            else:
                entry["content_hash"] = _hash_text(normalized)
                entry["preview"] = normalized[:PREVIEW_CHARS]
                entry["byte_len"] = len(normalized)
                entry["status"] = "ok"
        except Exception as exc:
            entry["preview"] = str(exc)[:120]
            entry["status"] = "error"
        items.append(entry)
    return json.dumps({"items": items}, sort_keys=True, separators=(",", ":"))


def _freeze_urls(urls: list) -> list:
    def leader_fn() -> str:
        return _capture_urls(urls)

    snap_json = gl.eq_principle_strict_eq(leader_fn)
    payload = json.loads(snap_json)
    items = payload.get("items", [])
    if len(items) != len(urls):
        raise Exception("snapshot item count mismatch")
    any_ok = any(i.get("status") == "ok" for i in items)
    if not any_ok:
        raise Exception("all URL fetches failed or empty — use stable https pages")
    return items


def _previews_blob(items: list, limit: int = 900) -> str:
    parts = []
    for i in items:
        parts.append(
            f"[{i.get('status','')}] {i.get('url','')}\n"
            f"hash={i.get('content_hash','')}\n"
            f"{i.get('preview','')}"
        )
    blob = "\n---\n".join(parts)
    return blob[:limit]


def _judge_deal(terms: str, claim: str, listing_blob: str, delivery_blob: str) -> str:
    """LLM settlement decision — consensus compares only `pay_provider` bool."""
    judge = (
        "You are a GenLayer agentic-commerce arbiter.\n"
        "Decide if the PROVIDER fulfilled the deal terms based ONLY on FROZEN evidence "
        "(listing + delivery snapshots). Ignore live web changes.\n"
        f"Deal terms:\n{terms}\n"
        f"Dispute claim (may be empty on voluntary adjudicate):\n{claim or '(none)'}\n"
        f"FROZEN listing evidence:\n{listing_blob}\n"
        f"FROZEN delivery evidence:\n{delivery_blob}\n"
        "Set pay_provider=true only if frozen delivery clearly satisfies the terms "
        "relative to the listing. If evidence is empty/irrelevant or delivery fails "
        "the terms, pay_provider=false (refund client).\n"
        'Return JSON with exactly one field: {"pay_provider": true} or {"pay_provider": false}\n'
        "No other keys. No reasoning."
    )
    try:
        result = gl.nondet.exec_prompt(judge, response_format="json")
    except Exception:
        try:
            result = gl.exec_prompt(judge)
        except Exception:
            return json.dumps({"pay_provider": False}, sort_keys=True, separators=(",", ":"))

    if isinstance(result, str):
        try:
            result = json.loads(result)
        except Exception:
            result = {"pay_provider": False}
    if not isinstance(result, dict):
        result = {"pay_provider": False}
    return json.dumps(
        {"pay_provider": bool(result.get("pay_provider", False))},
        sort_keys=True,
        separators=(",", ":"),
    )


# PromptRegistry-style criteria: what validators expect in store_evidence payloads.
CRITERIA_TEMPLATE = {
    "id": "dealguard/v1/condition-met",
    "title": "DealGuard deal evidence",
    "description": (
        "Validators check dealUrl (HTTPS listing or delivery page), signature "
        "(0x hex attestation), amount (uint string matching escrow), metadata, "
        "and condition_met (bool). condition_met=true only when frozen evidence "
        "supports payout to the provider under deal terms."
    ),
    "required_fields": [
        "dealUrl",
        "signature",
        "amount",
        "condition_met",
    ],
    "fields": {
        "dealUrl": {
            "type": "string",
            "format": "https-url",
            "what": "Canonical HTTPS URL of the deal listing or delivery page",
        },
        "signature": {
            "type": "string",
            "format": "0x-hex",
            "what": "Party attestation signature over deal_id|dealUrl|amount",
        },
        "amount": {
            "type": "string",
            "format": "uint256-decimal",
            "what": "Escrow amount as decimal integer string (bookkeeping units)",
        },
        "condition_met": {
            "type": "boolean",
            "what": "True if delivery satisfies terms for provider payout",
        },
        "metadata": {
            "type": "object",
            "what": "Optional extras: deal_id, commit, notes, listing_hash",
        },
    },
    "example": {
        "dealUrl": "https://test-server.genlayer.com/static/genvm/hello.html",
        "signature": "0x" + ("ab" * 32),
        "amount": "100",
        "condition_met": True,
        "metadata": {
            "deal_id": "demo-1",
            "note": "Delivery page contains Hello",
        },
    },
}


def _require_hex_sig(sig: str) -> str:
    s = str(sig).strip()
    if not s.startswith("0x") or len(s) < 10:
        raise Exception("signature must be 0x-hex")
    body = s[2:]
    if len(body) > 132 or any(c not in "0123456789abcdefABCDEF" for c in body):
        raise Exception("signature hex invalid")
    return s


def _parse_evidence_payload(evidence_json: str) -> dict:
    try:
        data = json.loads(evidence_json)
    except Exception:
        raise Exception("evidence_json must be JSON object")
    if not isinstance(data, dict):
        raise Exception("evidence_json must be an object")
    deal_url = str(data.get("dealUrl", "")).strip()
    if not HTTPS_URL_RE.match(deal_url):
        raise Exception("dealUrl must be https://")
    sig = _require_hex_sig(str(data.get("signature", "")))
    amount = _parse_amount(data.get("amount", "0"))
    if "condition_met" not in data or not isinstance(data.get("condition_met"), bool):
        raise Exception("condition_met must be a boolean")
    meta = data.get("metadata", {})
    if meta is None:
        meta = {}
    if not isinstance(meta, dict):
        raise Exception("metadata must be an object")
    return {
        "dealUrl": deal_url,
        "signature": sig,
        "amount": amount,
        "condition_met": bool(data["condition_met"]),
        "metadata": meta,
        "payload_hash": _hash_text(
            json.dumps(
                {
                    "dealUrl": deal_url,
                    "signature": sig,
                    "amount": amount,
                    "condition_met": bool(data["condition_met"]),
                },
                sort_keys=True,
                separators=(",", ":"),
            )
        ),
    }


class DealGuard(gl.Contract):
    owner: str
    balances_json: str
    deals_json: str
    order_json: str
    reputation_json: str
    events_json: str
    seq: str
    # Appended fields (Agent Tank integrity + structured deal evidence)
    code_snapshot_json: str
    evidences_json: str

    def __init__(self, owner_address: str):
        self.owner = _require_address("owner_address", owner_address)
        self.balances_json = "{}"
        self.deals_json = "{}"
        self.order_json = "[]"
        self.reputation_json = "{}"
        self.events_json = "[]"
        self.seq = "0"
        self.code_snapshot_json = "{}"
        self.evidences_json = "{}"

    def _only_owner(self):
        if str(gl.message.sender_address) != self.owner:
            raise Exception("only owner")

    def _load_balances(self):
        return json.loads(self.balances_json)

    def _save_balances(self, balances):
        self.balances_json = json.dumps(balances, sort_keys=True, separators=(",", ":"))

    def _load_deals(self):
        return json.loads(self.deals_json)

    def _save_deals(self, deals):
        self.deals_json = json.dumps(deals, sort_keys=True, separators=(",", ":"))

    def _load_order(self):
        return json.loads(self.order_json)

    def _save_order(self, order):
        self.order_json = json.dumps(order, separators=(",", ":"))

    def _load_reputation(self):
        return json.loads(self.reputation_json)

    def _save_reputation(self, rep):
        self.reputation_json = json.dumps(rep, sort_keys=True, separators=(",", ":"))

    def _balance_of(self, balances, user: str) -> dict:
        key = str(user)
        if key not in balances:
            balances[key] = {"available": 0, "escrowed": 0}
        return balances[key]

    def _rep_of(self, rep, user: str) -> dict:
        key = str(user)
        if key not in rep:
            rep[key] = {
                "wins": 0,
                "losses": 0,
                "completed": 0,
                "disputed": 0,
                "score": 0,
            }
        return rep[key]

    def _append_event(self, kind: str, payload: dict):
        events = json.loads(self.events_json)
        events.append({"kind": kind, **payload})
        if len(events) > MAX_EVENTS:
            events = events[-MAX_EVENTS:]
        self.events_json = json.dumps(events, separators=(",", ":"))

    def _bump_rep(self, client: str, provider: str, pay_provider: bool, disputed: bool):
        rep = self._load_reputation()
        c = self._rep_of(rep, client)
        p = self._rep_of(rep, provider)
        c["completed"] = int(c.get("completed", 0)) + 1
        p["completed"] = int(p.get("completed", 0)) + 1
        if disputed:
            c["disputed"] = int(c.get("disputed", 0)) + 1
            p["disputed"] = int(p.get("disputed", 0)) + 1
        if pay_provider:
            p["wins"] = int(p.get("wins", 0)) + 1
            c["losses"] = int(c.get("losses", 0)) + 1
            p["score"] = int(p.get("score", 0)) + 2
            c["score"] = int(c.get("score", 0)) - 1
        else:
            c["wins"] = int(c.get("wins", 0)) + 1
            p["losses"] = int(p.get("losses", 0)) + 1
            c["score"] = int(c.get("score", 0)) + 2
            p["score"] = int(p.get("score", 0)) - 1
        rep[client] = c
        rep[provider] = p
        self._save_reputation(rep)

    def _pay_out(self, deals, deal, pay_provider: bool):
        amt = int(deal["amount"])
        client = deal["client"]
        provider = deal["provider"]
        balances = self._load_balances()
        crow = self._balance_of(balances, client)
        crow["escrowed"] = max(0, int(crow.get("escrowed", 0)) - amt)
        if pay_provider:
            prow = self._balance_of(balances, provider)
            prow["available"] = int(prow.get("available", 0)) + amt
            balances[provider] = prow
        else:
            crow["available"] = int(crow.get("available", 0)) + amt
        balances[client] = crow
        self._save_balances(balances)

    @gl.public.write
    def transfer_ownership(self, new_owner: str) -> None:
        self._only_owner()
        self.owner = _require_address("new_owner", new_owner)
        self._append_event("OwnershipTransferred", {"to": self.owner})

    @gl.public.write
    def pin_code_snapshot(
        self,
        commit: str,
        evidence_hash: str,
        contract_hash: str,
        timestamp: str,
    ) -> None:
        """Owner-only: pin git HEAD evidence hash + contract source hash for validators.

        evidence_hash MUST be sha256(git rev-parse HEAD) hex.
        contract_hash MUST be sha256(contracts/DealGuard.py) hex.
        CI rejects pushes where CODE_SNAPSHOT.json drifts without updating these pins.
        """
        self._only_owner()
        c = str(commit).strip().lower()
        if len(c) != 40 or any(ch not in "0123456789abcdef" for ch in c):
            raise Exception("commit must be 40-char lowercase git SHA")
        eh = str(evidence_hash).strip().lower()
        chash = str(contract_hash).strip().lower()
        if len(eh) != 64 or len(chash) != 64:
            raise Exception("hashes must be 64-char sha256 hex")
        for h in (eh, chash):
            if any(ch not in "0123456789abcdef" for ch in h):
                raise Exception("hash must be hex")
        expected = _hash_text(c)
        if eh != expected:
            raise Exception("evidence_hash must equal sha256(commit)")
        ts = _sanitize_text("timestamp", timestamp, 64)
        snap = {
            "commit": c,
            "evidence_hash": eh,
            "contract_hash": chash,
            "timestamp": ts,
            "hash_algo": HASH_ALGO,
            "pinned_by": str(gl.message.sender_address),
        }
        self.code_snapshot_json = json.dumps(snap, sort_keys=True, separators=(",", ":"))
        self._append_event("CodeSnapshotPinned", {"commit": c, "evidence_hash": eh})

    @gl.public.write
    def store_evidence(self, deal_id: str, evidence_json: str) -> None:
        """Attach structured PromptRegistry-style evidence to a deal (parties or owner)."""
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did not in deals:
            raise Exception("unknown deal_id")
        deal = deals[did]
        caller = str(gl.message.sender_address)
        if caller not in (deal["client"], deal["provider"], self.owner):
            raise Exception("only deal parties or owner may store evidence")
        parsed = _parse_evidence_payload(evidence_json)
        if int(parsed["amount"]) != int(deal["amount"]):
            raise Exception("evidence amount must match deal amount")
        evidences = json.loads(self.evidences_json)
        evidences[did] = {
            **parsed,
            "deal_id": did,
            "submitter": caller,
        }
        self.evidences_json = json.dumps(evidences, sort_keys=True, separators=(",", ":"))
        deal["evidence_payload_hash"] = parsed["payload_hash"]
        deal["condition_met"] = parsed["condition_met"]
        deals[did] = deal
        self._save_deals(deals)
        self._append_event(
            "EvidenceStored",
            {
                "id": did,
                "condition_met": parsed["condition_met"],
                "payload_hash": parsed["payload_hash"],
                "submitter": caller,
            },
        )

    @gl.public.write
    def credit(self, user: str, amount: str) -> None:
        """Owner mints bookkeeping units for demos / steward smoke."""
        self._only_owner()
        addr = _require_address("user", user)
        amt = _parse_amount(amount)
        balances = self._load_balances()
        row = self._balance_of(balances, addr)
        row["available"] = int(row.get("available", 0)) + amt
        balances[addr] = row
        self._save_balances(balances)
        self._append_event("Credited", {"user": addr, "amount": amt})

    @gl.public.write
    def create_deal(
        self,
        deal_id: str,
        provider: str,
        terms: str,
        listing_urls_json: str,
        amount: str,
    ) -> None:
        """Client opens a deal and freezes listing URLs under SHA-256 consensus."""
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did in deals:
            raise Exception("deal_id already exists")

        client = str(gl.message.sender_address)
        provider_addr = _require_address("provider", provider)
        if provider_addr == client:
            raise Exception("provider cannot be the client")
        terms_txt = _sanitize_text("terms", terms, MAX_TERMS_LEN)
        amt = _parse_amount(amount)
        urls = _parse_urls(listing_urls_json)
        items = _freeze_urls(urls)

        deals[did] = {
            "deal_id": did,
            "client": client,
            "provider": provider_addr,
            "terms": terms_txt,
            "amount": amt,
            "status": STATUS_OPEN,
            "listing_urls": urls,
            "listing_items": items,
            "delivery_urls": [],
            "delivery_items": [],
            "claim": "",
            "tampered_listing": False,
            "tampered_delivery": False,
            "checks": 0,
            "outcome": "",
            "pay_provider": False,
        }
        self._save_deals(deals)
        order = self._load_order()
        order.append(did)
        self._save_order(order)
        self._append_event(
            "DealCreated",
            {
                "id": did,
                "client": client,
                "provider": provider_addr,
                "amount": amt,
            },
        )

    @gl.public.write
    def fund(self, deal_id: str) -> None:
        """Client locks bookkeeping units into escrow."""
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did not in deals:
            raise Exception("unknown deal_id")
        deal = deals[did]
        if deal.get("status") != STATUS_OPEN:
            raise Exception("deal is not open")
        client = str(gl.message.sender_address)
        if client != deal["client"]:
            raise Exception("only client may fund")

        amt = int(deal["amount"])
        balances = self._load_balances()
        row = self._balance_of(balances, client)
        available = int(row.get("available", 0))
        if available < amt:
            raise Exception("insufficient balance — ask owner to credit")
        row["available"] = available - amt
        row["escrowed"] = int(row.get("escrowed", 0)) + amt
        balances[client] = row
        self._save_balances(balances)

        deal["status"] = STATUS_FUNDED
        deals[did] = deal
        self._save_deals(deals)
        self._append_event("DealFunded", {"id": did, "amount": amt, "client": client})

    @gl.public.write
    def submit_delivery(self, deal_id: str, delivery_urls_json: str) -> None:
        """Provider freezes delivery URLs — adjudication uses this snapshot, not live pages."""
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did not in deals:
            raise Exception("unknown deal_id")
        deal = deals[did]
        if deal.get("status") != STATUS_FUNDED:
            raise Exception("deal must be funded")
        caller = str(gl.message.sender_address)
        if caller != deal["provider"]:
            raise Exception("only provider may submit delivery")

        urls = _parse_urls(delivery_urls_json)
        items = _freeze_urls(urls)
        deal["delivery_urls"] = urls
        deal["delivery_items"] = items
        deal["status"] = STATUS_DELIVERED
        deals[did] = deal
        self._save_deals(deals)
        self._append_event("DeliverySubmitted", {"id": did, "provider": caller})

    @gl.public.write
    def release(self, deal_id: str) -> None:
        """Happy path: client accepts delivery and pays provider."""
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did not in deals:
            raise Exception("unknown deal_id")
        deal = deals[did]
        if deal.get("status") != STATUS_DELIVERED:
            raise Exception("deal must be delivered")
        caller = str(gl.message.sender_address)
        if caller != deal["client"] and caller != self.owner:
            raise Exception("only client or owner may release")

        self._pay_out(deals, deal, True)
        deal["status"] = STATUS_COMPLETED
        deal["outcome"] = "release"
        deal["pay_provider"] = True
        deals[did] = deal
        self._save_deals(deals)
        self._bump_rep(deal["client"], deal["provider"], True, False)
        self._append_event("DealReleased", {"id": did, "caller": caller})

    @gl.public.write
    def dispute(self, deal_id: str, claim: str) -> None:
        """Client or provider opens a dispute before LLM adjudication."""
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did not in deals:
            raise Exception("unknown deal_id")
        deal = deals[did]
        if deal.get("status") != STATUS_DELIVERED:
            raise Exception("deal must be delivered to dispute")
        caller = str(gl.message.sender_address)
        if caller not in (deal["client"], deal["provider"], self.owner):
            raise Exception("only parties or owner may dispute")
        claim_txt = _sanitize_text("claim", claim, MAX_CLAIM_LEN)
        deal["claim"] = claim_txt
        deal["status"] = STATUS_DISPUTED
        deals[did] = deal
        self._save_deals(deals)
        self._append_event("DealDisputed", {"id": did, "caller": caller})

    @gl.public.write
    def adjudicate(self, deal_id: str) -> None:
        """Validators judge FROZEN listing+delivery vs terms; settle escrow by consensus.

        Uses prompt_comparative on pay_provider bool only (stable decision field).
        """
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did not in deals:
            raise Exception("unknown deal_id")
        deal = deals[did]
        if deal.get("status") not in (STATUS_DISPUTED, STATUS_DELIVERED):
            raise Exception("deal must be delivered or disputed")
        if not deal.get("delivery_items"):
            raise Exception("no delivery snapshot")

        terms = deal.get("terms", "")
        claim = deal.get("claim", "")
        listing_blob = _previews_blob(deal.get("listing_items", []))
        delivery_blob = _previews_blob(deal.get("delivery_items", []))

        def leader_fn() -> str:
            return _judge_deal(terms, claim, listing_blob, delivery_blob)

        try:
            verdict_json = gl.eq_principle.prompt_comparative(
                leader_fn,
                principle="boolean field pay_provider must be identical across validators",
            )
        except Exception:
            verdict_json = gl.eq_principle_strict_eq(leader_fn)

        verdict = json.loads(verdict_json) if isinstance(verdict_json, str) else verdict_json
        if not isinstance(verdict, dict):
            verdict = {"pay_provider": False}
        pay = bool(verdict.get("pay_provider", False))

        self._pay_out(deals, deal, pay)
        deal["pay_provider"] = pay
        deal["outcome"] = "adjudicate_pay" if pay else "adjudicate_refund"
        deal["status"] = STATUS_SETTLED_PAY if pay else STATUS_SETTLED_REFUND
        disputed = bool(deal.get("claim"))
        deals[did] = deal
        self._save_deals(deals)
        self._bump_rep(deal["client"], deal["provider"], pay, disputed)
        self._append_event(
            "DealAdjudicated",
            {
                "id": did,
                "pay_provider": pay,
                "status": deal["status"],
                "caller": str(gl.message.sender_address),
            },
        )

    @gl.public.write
    def cross_check(self, deal_id: str) -> None:
        """Re-fetch listing + delivery URLs; flag tampered if SHA-256 digests drifted."""
        did = _normalize_id(deal_id)
        deals = self._load_deals()
        if did not in deals:
            raise Exception("unknown deal_id")
        deal = deals[did]

        def compare_set(urls: list, frozen_items: list) -> bool:
            if not urls:
                return True
            frozen = {i["url"]: i for i in frozen_items}

            def leader_fn() -> str:
                live_json = _capture_urls(urls)
                live = json.loads(live_json)["items"]
                all_match = True
                report = []
                for item in live:
                    prev = frozen.get(item["url"], {})
                    match = (
                        item.get("status") == prev.get("status")
                        and item.get("content_hash") == prev.get("content_hash")
                        and item.get("hash_algo", HASH_ALGO)
                        == prev.get("hash_algo", HASH_ALGO)
                    )
                    if not match:
                        all_match = False
                    report.append(
                        {
                            "url": item["url"],
                            "matches": match,
                            "frozen_hash": prev.get("content_hash", ""),
                            "live_hash": item.get("content_hash", ""),
                        }
                    )
                return json.dumps(
                    {"all_match": all_match, "report": report},
                    sort_keys=True,
                    separators=(",", ":"),
                )

            check_json = gl.eq_principle_strict_eq(leader_fn)
            check = json.loads(check_json)
            return bool(check.get("all_match"))

        listing_ok = compare_set(deal.get("listing_urls", []), deal.get("listing_items", []))
        delivery_ok = compare_set(
            deal.get("delivery_urls", []), deal.get("delivery_items", [])
        )
        if not listing_ok:
            deal["tampered_listing"] = True
        if not delivery_ok:
            deal["tampered_delivery"] = True
        deal["checks"] = int(deal.get("checks", 0)) + 1
        deals[did] = deal
        self._save_deals(deals)
        self._append_event(
            "CrossChecked",
            {
                "id": did,
                "listing_ok": listing_ok,
                "delivery_ok": delivery_ok,
            },
        )

    @gl.public.view
    def get_deal(self, deal_id: str) -> str:
        deals = self._load_deals()
        did = str(deal_id).strip()
        if did not in deals:
            return json.dumps({"error": "unknown deal_id"})
        return json.dumps(deals[did], sort_keys=True)

    @gl.public.view
    def list_deals(self) -> str:
        return self.order_json

    @gl.public.view
    def get_balance(self, user: str) -> str:
        balances = self._load_balances()
        row = balances.get(str(user).strip(), {"available": 0, "escrowed": 0})
        return json.dumps(row, separators=(",", ":"))

    @gl.public.view
    def get_reputation(self, user: str) -> str:
        rep = self._load_reputation()
        row = rep.get(
            str(user).strip(),
            {"wins": 0, "losses": 0, "completed": 0, "disputed": 0, "score": 0},
        )
        return json.dumps(row, separators=(",", ":"))

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner

    @gl.public.view
    def get_stats(self) -> str:
        deals = self._load_deals()
        total = len(deals)
        by_status = {}
        tampered = 0
        for d in deals.values():
            st = d.get("status", "?")
            by_status[st] = int(by_status.get(st, 0)) + 1
            if d.get("tampered_listing") or d.get("tampered_delivery"):
                tampered += 1
        return json.dumps(
            {"deals": total, "by_status": by_status, "tampered": tampered},
            separators=(",", ":"),
        )

    @gl.public.view
    def get_events(self) -> str:
        return self.events_json

    @gl.public.view
    def get_code_snapshot(self) -> str:
        """Pinned git commit + evidence/contract hashes for Agent Tank validators."""
        if not self.code_snapshot_json or self.code_snapshot_json == "{}":
            return json.dumps({"error": "code snapshot not pinned"})
        return self.code_snapshot_json

    @gl.public.view
    def get_evidence(self, deal_id: str) -> str:
        evidences = json.loads(self.evidences_json)
        did = str(deal_id).strip()
        if did not in evidences:
            return json.dumps({"error": "no evidence for deal_id"})
        return json.dumps(evidences[did], sort_keys=True)

    @gl.public.view
    def get_criteria_template(self) -> str:
        """PromptRegistry-style template: dealUrl, signature, amount, condition_met."""
        return json.dumps(CRITERIA_TEMPLATE, sort_keys=True)
