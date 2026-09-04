# Agent Tank submission & operator guide

## Stack note

DealGuard is a **GenLayer Intelligent Contract (Python)**, not Solidity.
Owner gating uses `_only_owner()` (same role as OpenZeppelin `onlyOwner`).
There is no OpenZeppelin dependency — GenLayer Studio deploys the single `.py` file.

## 1. Code snapshot (EvidenceSnapshot-style integrity)

File: [`CODE_SNAPSHOT.json`](../CODE_SNAPSHOT.json)

| Field | Meaning |
|-------|---------|
| `commit` | `git rev-parse HEAD` at pin time |
| `evidence_hash` | `sha256(commit)` — validators compare this |
| `contract_hash` | `sha256(contracts/DealGuard.py)` |
| `timestamp` | ISO UTC when snapshot was written |

```bash
python3 scripts/update_code_snapshot.py update   # refresh after contract edits
python3 scripts/update_code_snapshot.py verify   # CI gate
python3 scripts/cli.py studio-calls              # print pin_code_snapshot args
```

On-chain (owner only):

```text
pin_code_snapshot(commit, evidence_hash, contract_hash, timestamp)
get_code_snapshot()
```

## 2. Evidence template (PromptRegistry-style)

Schema: [`schemas/condition_met.schema.json`](../schemas/condition_met.schema.json)  
Example: [`templates/deal_evidence.json`](../templates/deal_evidence.json)  
On-chain: `get_criteria_template()`

Required fields in `condition_met` / `store_evidence` payload:

| Field | Type | What validators check |
|-------|------|------------------------|
| `dealUrl` | https string | Listing/delivery page URL |
| `signature` | 0x hex | Party attestation |
| `amount` | uint string | Must match deal escrow amount |
| `condition_met` | bool | True ⇒ support provider payout |
| `metadata` | object | Optional deal_id / notes |

```bash
python3 scripts/build_evidence.py generate -o artifacts/evidence.json
python3 scripts/build_evidence.py validate artifacts/evidence.json
```

On-chain:

```text
store_evidence(deal_id, evidence_json)
get_evidence(deal_id)
```

## 3. Local run

```bash
# Python checks
python3 -m pytest -q
python3 scripts/cli.py snapshot verify

# Website
cd web && npm ci && npm run dev   # http://localhost:3010
# Evidence UI: http://localhost:3010/evidence
```

## 4. Studio deploy path

1. https://studio.genlayer.com/contracts → paste `contracts/DealGuard.py`
2. Constructor = your wallet `0x…`
3. `pin_code_snapshot` with values from `CODE_SNAPSHOT.json`
4. Run [`examples/demo_flow.md`](../examples/demo_flow.md)
5. `store_evidence` with generated JSON
6. Paste explorer address into Agent Tank **Contract link**

## 5. Agent Tank portal fields

See [`SUBMIT.md`](../SUBMIT.md).

## 6. Security

- `credit`, `pin_code_snapshot`, `transfer_ownership` → **onlyOwner**
- `store_evidence` → deal parties or owner
- Deal lifecycle writes gated by role (client/provider)
- CI runs `npm audit --audit-level=high` on the web app
- Prefer https-only URLs; SHA-256 digests for freezes + code pin
