#!/usr/bin/env python3
"""Assemble artifacts/integrity-pack.json for Agent Tank stewards."""

from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "integrity-pack.json"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    snap = json.loads((ROOT / "CODE_SNAPSHOT.json").read_text())
    pack = {
        "name": "DealGuard integrity pack",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "files": {
            "CODE_SNAPSHOT.json": {
                "sha256": sha256_file(ROOT / "CODE_SNAPSHOT.json"),
                "content": snap,
            },
            "schemas/code_snapshot.schema.json": {
                "sha256": sha256_file(ROOT / "schemas" / "code_snapshot.schema.json"),
            },
            "schemas/condition_met.schema.json": {
                "sha256": sha256_file(ROOT / "schemas" / "condition_met.schema.json"),
            },
            "templates/deal_evidence.json": {
                "sha256": sha256_file(ROOT / "templates" / "deal_evidence.json"),
            },
            ".github/workflows/ci.yml": {
                "sha256": sha256_file(ROOT / ".github" / "workflows" / "ci.yml"),
            },
            "contracts/DealGuard.py": {
                "sha256": sha256_file(ROOT / "contracts" / "DealGuard.py"),
            },
        },
        "pin_code_snapshot_args": {
            "commit": snap["commit"],
            "evidence_hash": snap["evidence_hash"],
            "contract_hash": snap["contract_hash"],
            "timestamp": snap["timestamp"],
        },
        "checks": [
            "python3 scripts/update_code_snapshot.py verify",
            "python3 scripts/validate_schemas.py",
            "python3 -m pytest -q",
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(pack, indent=2) + "\n")
    print(json.dumps({"ok": True, "path": str(OUT), "commit": snap["commit"]}, indent=2))


if __name__ == "__main__":
    main()
