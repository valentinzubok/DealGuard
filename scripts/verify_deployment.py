#!/usr/bin/env python3
"""Fail the build if the deployed DealGuard bytes stop matching contracts/DealGuard.py."""

import base64
import hashlib
import json
import pathlib
import sys
import urllib.request

RPC = "https://studio-dev.genlayer.com/api"
ADDRESS = "0x9d2F35936528981aab4D3095a1eE93878C7D4E63"
SOURCE = pathlib.Path(__file__).resolve().parents[1] / "contracts" / "DealGuard.py"


def on_chain_sha256() -> str:
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": "gen_getContractCode", "params": [ADDRESS]}
    ).encode()
    request = urllib.request.Request(
        RPC,
        data=payload,
        headers={"content-type": "application/json", "user-agent": "dealguard-ci"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        body = json.load(response)
    if "result" not in body:
        raise SystemExit(f"RPC error: {body.get('error')}")
    return hashlib.sha256(base64.b64decode(body["result"])).hexdigest()


def main() -> int:
    local = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    remote = on_chain_sha256()
    if local != remote:
        print("MISMATCH: redeploy this exact source before submitting")
        print("local  ", local)
        print("on-chain", remote)
        return 1
    print("local   ", local)
    print("on-chain", remote)
    print("match")
    return 0


if __name__ == "__main__":
    sys.exit(main())
