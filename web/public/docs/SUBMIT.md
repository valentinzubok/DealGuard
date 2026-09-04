# Agent Tank — DealGuard submission pack

Operator guide: [`docs/AGENT_TANK.md`](docs/AGENT_TANK.md) · Studio: [`docs/STUDIO.md`](docs/STUDIO.md) · Live: [`DEPLOY.md`](DEPLOY.md)

## Pre-submit checklist

- [x] **1. Snapshot** — pinned on-chain (`commit=f7b12fc…`, see `CODE_SNAPSHOT.json` / `DEPLOY.md`)
- [x] **2. Schema** — `condition_met` + code snapshot schemas in repo
- [x] **3. Test** — `pytest` lifecycle suite in CI
- [x] **4. Integrity pack** — scripts + `/integrity-pack.json` on site
- [x] **5. Deploy** — Studionet `0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D`
- [ ] **6. Portal** — submit form (fill below)

## Identity

| Field | Value |
|---|---|
| Track | **Agentic Commerce Infrastructure** |
| Project name | `DealGuard` |
| Logo | `assets/logo.jpg` |
| GitHub | https://github.com/valentinzubok/DealGuard |
| Website | https://valentinzubok.github.io/DealGuard/ |
| Contract | https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D |
| License | [`LICENSE.md`](LICENSE.md) |

## One-liner (≤180)

```text
Agentic commerce escrow on GenLayer: freeze listing + delivery URLs, LLM-adjudicate frozen evidence, pin code snapshot + condition_met proofs.
```

## Description (≤1000)

```text
DealGuard is shared infrastructure for agent-to-agent commerce. Agents dispute from the open web, but pages change before adjudication (URL rot).

create_deal freezes listing URLs under SHA-256 consensus. fund locks escrow. submit_delivery freezes delivery. release or dispute+adjudicate settles via GenLayer LLMs on FROZEN snapshots only. cross_check proves drift. pin_code_snapshot (onlyOwner) stores sha256(git HEAD)+contract hash for validators. store_evidence attaches PromptRegistry-style payloads: dealUrl, signature, amount, condition_met.

Live on Studionet: 0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D — pin_code_snapshot, create_deal(demo-1), store_evidence verified. Site + CI integrity pack included. Not another wrapper agent — commerce settlement infrastructure.
```

## How-to (steward path)

1. Open explorer: https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D
2. Or Studio → paste `contracts/DealGuard.py` (matching `contract_hash` in `CODE_SNAPSHOT.json`).
3. Call views: `get_code_snapshot`, `get_criteria_template`, `get_deal("demo-1")`, `get_evidence("demo-1")`.
4. Optional redeploy: follow [`docs/STUDIO.md`](docs/STUDIO.md) / [`examples/demo_flow.md`](examples/demo_flow.md).

## Expected verification outcome

```text
get_code_snapshot → commit f7b12fc26209eb3259c43b64c62060209f517f66, evidence_hash 0d9c1a11…, contract_hash 66bee336…;
get_deal("demo-1") → listing content_hash c0535e4b…, amount 100;
get_evidence("demo-1") → condition_met true, payload_hash 6c9c208f…;
get_criteria_template → dealUrl/signature/amount/condition_met.
```

## Evidence links (attach in Portal)

1. https://github.com/valentinzubok/DealGuard
2. https://valentinzubok.github.io/DealGuard/
3. https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D
4. https://explorer-studio.genlayer.com/tx/0x09b84e3ba39a88b1fbb2d2cdd8df994877f3444864827d88023caae83a67b5c3
5. https://explorer-studio.genlayer.com/tx/0x0d17d1effc69a47718283014b3d0b941a174cb9db896db7aa239c3ac01d45c11
6. https://explorer-studio.genlayer.com/tx/0xdb2e59803482ea0ff10d11bbc128f5b6323c131808d88d7a4bc2063a0d9310e7
7. https://explorer-studio.genlayer.com/tx/0x0cd0bd31256e670deb6e4418cd8d94d96b83452d4d2551500eee6337cdf224fc

## Security notes

- `pin_code_snapshot`, `credit`, `transfer_ownership` → onlyOwner
- GenLayer Python IC; MIT — `LICENSE.md`
