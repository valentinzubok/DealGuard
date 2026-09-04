#!/usr/bin/env python3
"""Build / validate DealGuard store_evidence payloads (condition_met schema)."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTTPS_URL_RE = re.compile(r"^https://[^\s<>\"']+$", re.IGNORECASE)
HEX_RE = re.compile(r"^0x[0-9a-fA-F]{8,130}$")


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def validate_evidence(data: dict) -> dict:
    if not isinstance(data, dict):
        raise ValueError("payload must be object")
    deal_url = str(data.get("dealUrl", "")).strip()
    if not HTTPS_URL_RE.match(deal_url):
        raise ValueError("dealUrl must be https://")
    sig = str(data.get("signature", "")).strip()
    if not HEX_RE.match(sig):
        raise ValueError("signature must be 0x-hex")
    try:
        amount = int(str(data.get("amount", "")).strip())
    except Exception as exc:
        raise ValueError("amount must be uint") from exc
    if amount <= 0:
        raise ValueError("amount must be positive")
    if "condition_met" not in data or not isinstance(data["condition_met"], bool):
        raise ValueError("condition_met must be boolean")
    meta = data.get("metadata") or {}
    if not isinstance(meta, dict):
        raise ValueError("metadata must be object")
    core = {
        "dealUrl": deal_url,
        "signature": sig,
        "amount": amount,
        "condition_met": bool(data["condition_met"]),
    }
    return {
        **core,
        "metadata": meta,
        "payload_hash": sha256_text(
            json.dumps(core, sort_keys=True, separators=(",", ":"))
        ),
    }


def example_payload(deal_id: str = "demo-1", amount: str = "100") -> dict:
    return {
        "dealUrl": "https://test-server.genlayer.com/static/genvm/hello.html",
        "signature": "0x" + ("ab" * 32),
        "amount": amount,
        "condition_met": True,
        "metadata": {
            "deal_id": deal_id,
            "note": "Delivery page contains Hello",
        },
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("generate", help="Write example evidence JSON")
    g.add_argument("--deal-id", default="demo-1")
    g.add_argument("--amount", default="100")
    g.add_argument("-o", "--out", type=Path, default=ROOT / "artifacts" / "evidence.json")

    v = sub.add_parser("validate", help="Validate evidence JSON file")
    v.add_argument("path", type=Path)

    args = p.parse_args()
    if args.cmd == "generate":
        payload = example_payload(args.deal_id, args.amount)
        parsed = validate_evidence(payload)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(payload, indent=2) + "\n")
        print(json.dumps({"ok": True, "payload_hash": parsed["payload_hash"], "path": str(args.out)}, indent=2))
    else:
        raw = json.loads(args.path.read_text())
        parsed = validate_evidence(raw)
        print(json.dumps({"ok": True, **parsed}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
