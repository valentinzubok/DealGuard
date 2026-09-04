#!/usr/bin/env python3
"""Compute / verify DealGuard CODE_SNAPSHOT.json (git HEAD + contract source)."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_PATH = ROOT / "CODE_SNAPSHOT.json"
CONTRACT_PATH = ROOT / "contracts" / "DealGuard.py"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return sha256_bytes(text.encode("utf-8"))


def git_head() -> str:
    return (
        subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT)
        .decode()
        .strip()
        .lower()
    )


def build_snapshot(commit: str | None = None) -> dict:
    c = (commit or git_head()).lower()
    contract_hash = sha256_bytes(CONTRACT_PATH.read_bytes())
    return {
        "commit": c,
        "evidence_hash": sha256_text(c),
        "evidence_hash_algo": "sha256(git_rev_parse_HEAD)",
        "contract_hash": contract_hash,
        "contract_hash_algo": "sha256(contracts/DealGuard.py)",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": "Pinned code snapshot for Agent Tank validators",
    }


def write_snapshot(path: Path = SNAPSHOT_PATH) -> dict:
    snap = build_snapshot()
    path.write_text(json.dumps(snap, indent=2) + "\n")
    return snap


def verify_snapshot(path: Path = SNAPSHOT_PATH, require_head: bool = False) -> None:
    if not path.exists():
        raise SystemExit(f"missing {path}")
    pinned = json.loads(path.read_text())
    live_contract = sha256_bytes(CONTRACT_PATH.read_bytes())
    errors = []
    commit = str(pinned.get("commit", "")).lower()
    expected_eh = sha256_text(commit)
    if pinned.get("evidence_hash") != expected_eh:
        errors.append("evidence_hash must equal sha256(snapshot.commit)")
    if pinned.get("contract_hash") != live_contract:
        errors.append(
            "contract_hash drift — contracts/DealGuard.py changed; run: "
            "python3 scripts/update_code_snapshot.py update"
        )
    if require_head:
        head = git_head()
        if commit != head:
            errors.append(
                f"commit != HEAD (snapshot={commit} head={head}); "
                "run update before release"
            )
    if errors:
        print("CODE SNAPSHOT CHECK FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        raise SystemExit(1)
    print("CODE SNAPSHOT OK")
    print(json.dumps(pinned, indent=2))


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("command", choices=["update", "verify", "print"])
    p.add_argument(
        "--require-head",
        action="store_true",
        help="Also require snapshot.commit == git rev-parse HEAD (releases)",
    )
    args = p.parse_args()
    if args.command == "update":
        snap = write_snapshot()
        print(json.dumps(snap, indent=2))
    elif args.command == "verify":
        verify_snapshot(require_head=args.require_head)
    else:
        print(json.dumps(build_snapshot(), indent=2))


if __name__ == "__main__":
    main()
