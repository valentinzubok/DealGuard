# Agent Tank — DealGuard submission pack

Full operator guide: [`docs/AGENT_TANK.md`](docs/AGENT_TANK.md)

## Identity

| Field | Value |
|---|---|
| Track | **Agentic Commerce Infrastructure** |
| Project name | `DealGuard` |
| Logo | `assets/logo.jpg` |
| GitHub | https://github.com/valentinzubok/DealGuard |
| Website | https://web-ten-self-75.vercel.app *(disable Vercel Deployment Protection if 403)* · Evidence UI `/evidence` |

## One-liner (≤180)

```text
Agentic commerce escrow on GenLayer: freeze listing + delivery URLs, LLM-adjudicate frozen evidence, pin code snapshot + condition_met proofs.
```

## Description (≤1000)

```text
DealGuard is shared infrastructure for agent-to-agent commerce. Agents dispute from the open web, but pages change before adjudication (URL rot).

create_deal freezes listing URLs under SHA-256 consensus. fund locks escrow. submit_delivery freezes delivery. release or dispute+adjudicate settles via GenLayer LLMs on FROZEN snapshots only. cross_check proves drift. pin_code_snapshot (onlyOwner) stores sha256(git HEAD)+contract hash for validators. store_evidence attaches PromptRegistry-style payloads: dealUrl, signature, amount, condition_met.

CI verifies CODE_SNAPSHOT.json on every push. CLI + /evidence UI build and validate proofs offline before Studio submit. Not another wrapper agent — commerce settlement infrastructure.
```

## How-to

1. **Open Studio** — paste `contracts/DealGuard.py`, deploy with your `0x` as owner.
2. **Pin integrity** — `python3 scripts/cli.py studio-calls` then call `pin_code_snapshot(...)`.
3. **Bootstrap** — `credit(you, "1000")` → create/fund/deliver per `examples/demo_flow.md`.
4. **Evidence** — UI `/evidence` or `python3 scripts/cli.py evidence generate` → `store_evidence(deal_id, json)`.
5. **Verify** — `get_code_snapshot`, `get_evidence`, `get_criteria_template`, optional `cross_check`.

## Expected verification outcome

```text
get_code_snapshot returns commit + evidence_hash (=sha256(commit)) + contract_hash; store_evidence accepts template JSON with condition_met bool; get_criteria_template lists dealUrl/signature/amount/condition_met; deal lifecycle reaches completed or settled_*; CI green on CODE_SNAPSHOT verify + pytest.
```

## Security notes for stewards

- `pin_code_snapshot`, `credit`, `transfer_ownership` → onlyOwner
- GenLayer Python IC (not Solidity/OZ) — equivalent access control
- `npm audit` in CI; https-only evidence URLs
