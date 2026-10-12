# Milestone 2: v3 — a verdict is a ruling, not a payment

**What changed since milestone 1 (v2, native GEN escrow):** in v2 one consensus round moved the
escrow in the same transaction. Anyone could call `adjudicate` the moment a delivery was frozen,
the provider included, and a single wrong verdict was final. v3 separates ruling from payment and
gives the losing side an appeal decided by a second, independent round.

| | |
|---|---|
| Base (milestone 1, accepted) | `03103fd6475b1ca15e561d2f91e0213e7111b2b1` |
| Code diff | `https://github.com/valentinzubok/DealGuard/compare/03103fd6475b1ca15e561d2f91e0213e7111b2b1...milestone-appeal-v3` |
| New deployment | [`0xEB22D050b78024c2f5e6BfBD8BF3E6952BF54c85`](https://explorer-studio-dev.genlayer.com/address/0xEB22D050b78024c2f5e6BfBD8BF3E6952BF54c85) — code sha256 `193d295f…a4a7` |
| On-chain run | [`STUDIO_DEV_DEPLOY.md`](../STUDIO_DEV_DEPLOY.md): 26 transactions, 10 of them refused, 6 GEN in and 6 GEN out |
| Tests | [`tests/test_appeal.py`](../tests/test_appeal.py): 32 new, 86 in total |

## New contract functionality

- `adjudicate(deal_id)` records a ruling (`status: ruled`, `ruling_pay`, `appeal_until`) and pays nothing.
- `appeal(deal_id, grounds)`: only the party the ruling went against, once, while `now < appeal_until`.
- `adjudicate_appeal(deal_id)`: a second consensus round over the same frozen evidence. The grounds are in the prompt as a fenced argument; the first ruling is not. Its verdict is final and paid in the same call.
- `settle(deal_id)`: anyone, once the window has fully elapsed with no appeal.
- `create_deal(..., appeal_window)`: 60 s to 30 days, fixed at creation, no setter.
- `get_schedule` reports `can_appeal`, `can_settle`, `can_adjudicate_appeal`.

## What it closes

- **Rule and pay in one breath.** The provider could adjudicate its own deal and be paid before the client saw the delivery. Now `settle` reverts until the window has elapsed (on chain: rows 10 and 11).
- **One round is final.** A single consensus round is no longer enough to move money against an objection.
- **Appeal abuse.** The winner, a stranger and the owner cannot appeal; there is one appeal; a late appeal is refused; an appealed ruling cannot be settled (rows 12, 13, 17, 19, 20, 24).

## Unchanged, and still tested

The escrow rules from v2: payable `fund` that never reverts with value attached, external wallet
transfers after the books are updated, `reclaim` after a missed delivery deadline, no owner power
over any deal. A malformed answer, a model error or a consensus failure reverts in both rounds.
