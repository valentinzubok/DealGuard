#!/usr/bin/env python3
"""Validate CODE_SNAPSHOT.json and evidence fixtures against JSON Schemas."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(path: Path):
    return json.loads(path.read_text())


def _validate(instance: dict, schema: dict, label: str) -> list[str]:
    """Minimal Draft-2020 subset validator (no external deps)."""
    errors: list[str] = []
    required = schema.get("required", [])
    props = schema.get("properties", {})
    for key in required:
        if key not in instance:
            errors.append(f"{label}: missing required field '{key}'")
    if schema.get("additionalProperties") is False:
        for key in instance:
            if key not in props:
                errors.append(f"{label}: unexpected field '{key}'")
    import re

    for key, rules in props.items():
        if key not in instance:
            continue
        val = instance[key]
        t = rules.get("type")
        if t == "string" and not isinstance(val, str):
            errors.append(f"{label}.{key}: expected string")
            continue
        if t == "boolean" and not isinstance(val, bool):
            errors.append(f"{label}.{key}: expected boolean")
            continue
        if t == "object" and not isinstance(val, dict):
            errors.append(f"{label}.{key}: expected object")
            continue
        if "const" in rules and val != rules["const"]:
            errors.append(f"{label}.{key}: expected const {rules['const']!r}")
        if "pattern" in rules and isinstance(val, str):
            if not re.match(rules["pattern"], val):
                errors.append(f"{label}.{key}: does not match {rules['pattern']}")
        if "minLength" in rules and isinstance(val, str):
            if len(val) < rules["minLength"]:
                errors.append(f"{label}.{key}: shorter than minLength")
    return errors


def main() -> None:
    snap = _load(ROOT / "CODE_SNAPSHOT.json")
    snap_schema = _load(ROOT / "schemas" / "code_snapshot.schema.json")
    errors = _validate(snap, snap_schema, "CODE_SNAPSHOT")

    # Cross-link: evidence template example must satisfy condition_met schema
    tmpl = _load(ROOT / "templates" / "deal_evidence.json")
    example = tmpl.get("example", tmpl)
    cond_schema = _load(ROOT / "schemas" / "condition_met.schema.json")
    errors.extend(_validate(example, cond_schema, "deal_evidence.example"))

    # Integrity: CODE_SNAPSHOT.evidence_hash must be sha256(commit)
    import hashlib

    commit = str(snap.get("commit", ""))
    expected = hashlib.sha256(commit.encode()).hexdigest()
    if snap.get("evidence_hash") != expected:
        errors.append("CODE_SNAPSHOT.evidence_hash != sha256(commit)")

    if errors:
        print("SCHEMA CHECK FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        raise SystemExit(1)
    print("SCHEMA CHECK OK (CODE_SNAPSHOT + condition_met example)")


if __name__ == "__main__":
    main()
