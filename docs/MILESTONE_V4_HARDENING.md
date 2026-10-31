# Milestone 3: v4 — a deadline that splits time in two, and no refund from a partial reading

**What changed since milestone 2 (v3, a verdict is a ruling):** v3 made one consensus round unable to
move money on its own. Three things were still open: a delivery nobody ruled on stayed `delivered`
for ever; the client could release while a stranger forced a refund, so ordering could decide the
outcome; and a refund could rest on a model that had read only part of the delivery page. v4 closes
all three, keeps every round on chain, removes the registry size limits and moves the contract to the
runner Studio Dev accepts today.

| | |
|---|---|
| Base (milestone 2, accepted) | `66cdd10c06a91405d3557ba4c772e59dc6306660` |
| Code diff | `https://github.com/valentinzubok/DealGuard/compare/66cdd10c06a91405d3557ba4c772e59dc6306660...milestone-hardening-v4` |
| New deployment | [`0x9d2F35936528981aab4D3095a1eE93878C7D4E63`](https://explorer-studio-dev.genlayer.com/address/0x9d2F35936528981aab4D3095a1eE93878C7D4E63) — code sha256 `f3e462f6…9c74` |
| On-chain run | [`STUDIO_DEV_DEPLOY.md`](../STUDIO_DEV_DEPLOY.md): 23 transactions, 5 of them refused, 4 GEN in and 4 GEN out |
| Tests | [`tests/test_v4.py`](../tests/test_v4.py): 36 new, 122 in total; `genvm-lint` clean in CI |

## New contract functionality

- `expire_review(deal_id)`: anyone, from the committed review deadline on. A delivered or disputed deal
  nobody ruled on is refunded to the client; an appealed deal keeps its first ruling.
- `create_deal(..., review_window)`: 120 s to 30 days, default 7 days, fixed at creation, no setter. The
  review deadline is set when the delivery is frozen, and again, as a fresh window, when an appeal is filed.
- `release`, `dispute`, `adjudicate` and `adjudicate_appeal` are accepted only before the review
  deadline; `get_schedule` reports `review_deadline` and `can_expire_review` and never offers both paths.
- A refund decided while the judge saw only part of a readable delivery page is `inconclusive`: no
  ruling, escrow unchanged, round kept. A payment decided from the excerpts it did see still counts.
- `get_round(deal_id, n)`: every round (kind, time, model answer, verdict, completeness, the hash and
  characters read of each page, the listing hashes, the hash of the appeal grounds).
- A registry with no cap: deals, credits, reputation, evidence and events in `TreeMap`s with a
  `DynArray` index. `list_deals(offset, limit)`, `get_events(offset, limit)`, `count_deals`,
  `count_events` are paged; `get_stats` is a running counter instead of a scan.

## What it closes

- **Ordering decides the outcome.** At the deadline the client's `release` and a stranger's
  `expire_review` used to be two different payouts racing each other. Now only one of them is accepted at
  any second (on chain: rows 7 and 19–22; in tests: every second of the window).
- **A refund from a partial reading.** A 8 338-character delivery, 1 200 characters read, a model answer of
  refund: the contract records an inconclusive round and moves nothing (row 8).
- **A deal that hangs.** After the review deadline `expire_review` ends it (rows 22–23).
- **A registry that cannot grow.** The whole registry was one JSON string rewritten by every call and the
  event log kept 200 entries. Every call now touches only its own entries.
- **Linter and runner.** Every refusal is `gl.vm.UserError`; the header names the runner Studio Dev accepts.

## What was deliberately not changed

- The owner keeps `pin_code_snapshot` and `transfer_ownership` and nothing else; neither touches a deal.
  v3 was accepted with exactly this.
- The appeal window, the second round and `settle` work as in v3.
- A payment from partial evidence still counts: positive evidence in the excerpts is concrete, absence is not.

## How it was checked

1. `python3 -m pytest -q` — 122 tests (the 86 from v3 still pass unchanged apart from the API of
   `list_deals`; the 36 new ones are in `tests/test_v4.py`).
2. `sh scripts/lint_current_sdk.sh` — `genvm-lint lint`, `check`, `typecheck`.
3. `python3 scripts/verify_deployment.py` — on-chain code equals the repo file (in CI).
4. The 23-transaction run in [`STUDIO_DEV_DEPLOY.md`](../STUDIO_DEV_DEPLOY.md), including every refusal
   with its message, and the honest list of what it did not show.
5. The console (`/console/`) reads one page of deals at a time, shows the review deadline and has an
   `expire_review` button.
