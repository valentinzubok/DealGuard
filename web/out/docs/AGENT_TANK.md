# Agent Tank submission & operator guide

Also available as [`AGENTTANK.md`](AGENTTANK.md) (same content).

## Stack note

DealGuard is a **GenLayer Intelligent Contract (Python)**, not Solidity.
Owner gating uses `_only_owner()` (same role as OpenZeppelin `onlyOwner`).
There is no OpenZeppelin dependency — GenLayer Studio deploys the single `.py` file.

---

## Build the integrity pack (required)

The **integrity pack** is the set of files stewards/validators use to prove the
repo, schema, and CI gate match what you pin on-chain.

### Pack contents

| File | Role |
|------|------|
| [`CODE_SNAPSHOT.json`](../CODE_SNAPSHOT.json) | Hash snapshot: `commit`, `evidence_hash=sha256(commit)`, `contract_hash` |
| [`schemas/code_snapshot.schema.json`](../schemas/code_snapshot.schema.json) | JSON Schema for `CODE_SNAPSHOT.json` |
| [`schemas/condition_met.schema.json`](../schemas/condition_met.schema.json) | JSON Schema for deal evidence / `condition_met` |
| [`templates/deal_evidence.json`](../templates/deal_evidence.json) | PromptRegistry-style template + example payload |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | CI that verifies snapshot + schemas + unit tests |
| [`contracts/DealGuard.py`](../contracts/DealGuard.py) | Source whose `sha256` must equal `contract_hash` |
| `artifacts/integrity-pack.json` | Generated bundle (script / website button) |

### Steps (5 minutes)

```bash
# 1) After any contract edit, refresh the hash snapshot
python3 scripts/update_code_snapshot.py update

# 2) Verify snapshot ↔ live contract file
python3 scripts/update_code_snapshot.py verify

# 3) Validate CODE_SNAPSHOT.json against schemas/code_snapshot.schema.json
#    and templates/deal_evidence.json example against condition_met.schema.json
python3 scripts/validate_schemas.py

# 4) Generate evidence fixture + run unit tests (incl. create_deal/fund/…)
python3 scripts/build_evidence.py generate -o artifacts/evidence.json
python3 -m pytest -q

# 5) Emit the integrity-pack artifact (snapshot + schema refs + CI stamp)
python3 scripts/generate_integrity_pack.py

# 6) Commit CODE_SNAPSHOT.json if it changed, then push (CI must stay green)
```

### On-chain pin

```text
pin_code_snapshot(commit, evidence_hash, contract_hash, timestamp)  # onlyOwner
get_code_snapshot()
```

Copy args via: `python3 scripts/cli.py studio-calls`

---

## 1. Code snapshot fields

| Field | Meaning |
|-------|---------|
| `commit` | `git rev-parse HEAD` at pin time (40-char hex) |
| `evidence_hash` | `sha256(commit)` — validators compare this |
| `contract_hash` | `sha256(contracts/DealGuard.py)` |
| `timestamp` | ISO UTC when snapshot was written |

---

## 2. Evidence template (PromptRegistry-style)

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

On-chain: `store_evidence(deal_id, evidence_json)` · `get_evidence` · `get_criteria_template`

---

## 3. Local run

```bash
python3 -m pytest -q
python3 scripts/cli.py snapshot verify
cd web && npm ci && npm run dev   # http://localhost:3010
# /evidence  /demo  /reputation  /docs
```

---

## 4. Studio deploy path

1. https://studio.genlayer.com/contracts → paste `contracts/DealGuard.py`
2. Constructor = your wallet `0x…`
3. `pin_code_snapshot` with values from `CODE_SNAPSHOT.json`
4. Run [`examples/demo_flow.md`](../examples/demo_flow.md)
5. `store_evidence` with generated JSON
6. Paste explorer address into Agent Tank **Contract link**

---

## 5. Portal fields

See [`SUBMIT.md`](../SUBMIT.md).

---

## 6. Security

- `credit`, `pin_code_snapshot`, `transfer_ownership` → **onlyOwner**
- `store_evidence` → deal parties or owner
- Deal lifecycle writes gated by role (client/provider)
- CI: schema validation + `npm audit --audit-level=high`
- https-only URLs; SHA-256 digests for freezes + code pin
