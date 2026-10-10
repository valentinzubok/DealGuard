# Milestone: v2 — the escrow holds native GEN

**What changed since the accepted project:** v1 moved bookkeeping units the owner minted with
`credit()`, and the owner could release or dispute any deal. v2 escrows real GEN and has no
operator.

| | |
|---|---|
| Code diff | https://github.com/valentinzubok/DealGuard/compare/f51e920a2cc1a525b9dc4d06977c698f12916f06...9ad7e8f099d9d8583ce58fe7dc6decc27312670e |
| Base (accepted project) | `f51e920a2cc1a525b9dc4d06977c698f12916f06` |
| Milestone commit | `9ad7e8f099d9d8583ce58fe7dc6decc27312670e` |
| Contract | https://github.com/valentinzubok/DealGuard/blob/9ad7e8f099d9d8583ce58fe7dc6decc27312670e/contracts/DealGuard.py |
| Money tests | https://github.com/valentinzubok/DealGuard/blob/9ad7e8f099d9d8583ce58fe7dc6decc27312670e/tests/test_escrow.py |
| New deployment | [`0x5acb72C8B75A03D198044Ef450ccF5b253665FCC`](https://explorer-studio-dev.genlayer.com/address/0x5acb72C8B75A03D198044Ef450ccF5b253665FCC) — code sha256 `eb986d73…1f9a` |
| On-chain run | [`STUDIO_DEV_DEPLOY.md`](../STUDIO_DEV_DEPLOY.md): 22 transactions, 8 GEN in, 8 GEN out |

## New contract functionality

- `fund(deal_id)` is payable. The deal amount sits in the contract's balance.
- `release` pays the provider's wallet; `adjudicate` pays the provider or refunds the client.
- `reclaim(deal_id)`: no delivery inside the committed `delivery_window`, the client takes the escrow back.
- `withdraw_credit()`: a `fund()` the contract refuses never reverts with value attached; the amount is credited and withdrawn here.
- `get_schedule`, `get_credit`, `get_escrow_balance` views.

## Removed

- `credit()` and `get_balance` (owner-minted units).
- The owner's ability to release or dispute other people's deals. `release` is client-only, `dispute` is parties-only.

## Checked

- 54 tests (`python3 -m pytest -q`), 24 of them about money in [`tests/test_escrow.py`](../tests/test_escrow.py).
- CI verifies that `CODE_SNAPSHOT.json` matches `contracts/DealGuard.py`.
- On chain: a payout, a refund by verdict, a reclaim after a missed deadline, a refused funding returned, and five refused calls (early reclaim, late delivery, a stranger disputing, the provider releasing, a stranger funding).
