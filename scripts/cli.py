#!/usr/bin/env python3
"""DealGuard CLI — snapshot, evidence, and Studio call helpers (offline)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_evidence  # noqa: E402
import update_code_snapshot as snap  # noqa: E402


def cmd_snapshot(args: argparse.Namespace) -> None:
    if args.action == "update":
        print(json.dumps(snap.write_snapshot(), indent=2))
    elif args.action == "verify":
        snap.verify_snapshot()
    else:
        print(json.dumps(snap.build_snapshot(), indent=2))


def cmd_evidence(args: argparse.Namespace) -> None:
    if args.action == "generate":
        payload = build_evidence.example_payload(args.deal_id, args.amount)
        parsed = build_evidence.validate_evidence(payload)
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, indent=2) + "\n")
        print(json.dumps({"ok": True, "payload_hash": parsed["payload_hash"], "path": str(out)}, indent=2))
    else:
        raw = json.loads(Path(args.path).read_text())
        print(json.dumps(build_evidence.validate_evidence(raw), indent=2))


def cmd_studio_calls(args: argparse.Namespace) -> None:
    """Print Studio-ready call checklist (copy/paste)."""
    snap_data = snap.build_snapshot()
    evidence = build_evidence.example_payload(args.deal_id, args.amount)
    print(
        f"""# Studio call sheet (owner wallet first)

1) Deploy contracts/DealGuard.py with constructor = your 0x
2) pin_code_snapshot(
     "{snap_data['commit']}",
     "{snap_data['evidence_hash']}",
     "{snap_data['contract_hash']}",
     "{snap_data['timestamp']}"
   )
3) credit(your_0x, "1000")
4) create_deal / fund / submit_delivery (see examples/demo_flow.md)
5) store_evidence("{args.deal_id}", {json.dumps(evidence)})
6) get_code_snapshot() / get_evidence("{args.deal_id}") / get_criteria_template()
"""
    )


def main() -> None:
    p = argparse.ArgumentParser(prog="dealguard", description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("snapshot")
    s.add_argument("action", choices=["update", "verify", "print"])
    s.set_defaults(func=cmd_snapshot)

    e = sub.add_parser("evidence")
    e.add_argument("action", choices=["generate", "validate"])
    e.add_argument("--deal-id", default="demo-1")
    e.add_argument("--amount", default="100")
    e.add_argument("-o", "--out", default=str(ROOT / "artifacts" / "evidence.json"))
    e.add_argument("path", nargs="?", default=str(ROOT / "artifacts" / "evidence.json"))
    e.set_defaults(func=cmd_evidence)

    c = sub.add_parser("studio-calls")
    c.add_argument("--deal-id", default="demo-1")
    c.add_argument("--amount", default="100")
    c.set_defaults(func=cmd_studio_calls)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
