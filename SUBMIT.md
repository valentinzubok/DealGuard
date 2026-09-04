# Agent Tank — DealGuard submission pack

Operator guide: [`docs/AGENT_TANK.md`](docs/AGENT_TANK.md) · alias [`docs/AGENTTANK.md`](docs/AGENTTANK.md)

## Pre-submit checklist (do in order)

- [ ] **1. Snapshot** — `python3 scripts/update_code_snapshot.py update && python3 scripts/update_code_snapshot.py verify`
- [ ] **2. Schema** — `python3 scripts/validate_schemas.py`  
      (`CODE_SNAPSHOT.json` ↔ `schemas/code_snapshot.schema.json`;  
      evidence example ↔ `schemas/condition_met.schema.json`)
- [ ] **3. Test** — `python3 -m pytest -q` (create_deal, fund, submit_delivery, dispute, …)
- [ ] **4. Integrity pack** — `python3 scripts/generate_integrity_pack.py` → `artifacts/integrity-pack.json`
- [ ] **5. Deploy** — Studio paste `contracts/DealGuard.py` → `pin_code_snapshot` → demo flow
- [ ] **6. Portal** — fill form below; Website public (no Vercel 403); GitHub = this repo only

```text
snapshot  →  schema  →  pytest  →  integrity pack  →  Studio deploy  →  Portal submit
```

## Identity

| Field | Value |
|---|---|
| Track | **Agentic Commerce Infrastructure** |
| Project name | `DealGuard` |
| Logo | `assets/logo.jpg` |
| GitHub | https://github.com/valentinzubok/DealGuard |
| Website | **https://valentinzubok.github.io/DealGuard/** · `/demo/` · `/docs/` · `/evidence/` · `/reputation/` |
| License | [`LICENSE.md`](LICENSE.md) |

## One-liner (≤180)

```text
Agentic commerce escrow on GenLayer: freeze listing + delivery URLs, LLM-adjudicate frozen evidence, pin code snapshot + condition_met proofs.
```

## Description (≤1000)

```text
DealGuard is shared infrastructure for agent-to-agent commerce. Agents dispute from the open web, but pages change before adjudication (URL rot).

create_deal freezes listing URLs under SHA-256 consensus. fund locks escrow. submit_delivery freezes delivery. release or dispute+adjudicate settles via GenLayer LLMs on FROZEN snapshots only. cross_check proves drift. pin_code_snapshot (onlyOwner) stores sha256(git HEAD)+contract hash for validators. store_evidence attaches PromptRegistry-style payloads: dealUrl, signature, amount, condition_met.

CI verifies CODE_SNAPSHOT.json (+ JSON Schemas) on every push. CLI + web UI build and validate proofs offline before Studio submit. Not another wrapper agent — commerce settlement infrastructure.
```

## How-to (steward path)

1. **Open Studio** — paste `contracts/DealGuard.py`, deploy with your `0x` as owner.
2. **Pin integrity** — `python3 scripts/cli.py studio-calls` → `pin_code_snapshot(...)`.
3. **Bootstrap** — `credit` → create/fund/deliver per `examples/demo_flow.md`.
4. **Evidence** — `/evidence` or CLI → `store_evidence(deal_id, json)`.
5. **Verify** — `get_code_snapshot`, `get_evidence`, `get_criteria_template`, optional `cross_check`.

## Expected verification outcome

```text
get_code_snapshot returns commit + evidence_hash (=sha256(commit)) + contract_hash; store_evidence accepts template JSON with condition_met bool; get_criteria_template lists dealUrl/signature/amount/condition_met; deal lifecycle reaches completed or settled_*; CI green on CODE_SNAPSHOT verify + schema validate + pytest.
```

## Security notes for stewards

- `pin_code_snapshot`, `credit`, `transfer_ownership` → onlyOwner
- GenLayer Python IC (not Solidity/OZ) — equivalent access control
- `npm audit` in CI; https-only evidence URLs
- License: MIT — see `LICENSE.md`
