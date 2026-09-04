# DealGuard — method map

Intelligent Contract: [`DealGuard.py`](DealGuard.py)

| Method | Type | Args | Effect |
|--------|------|------|--------|
| `__init__` | ctor | `owner_address` | Bootstrap storage |
| `credit` | write | `user`, `amount` | Owner mints bookkeeping units |
| `create_deal` | write | `deal_id`, `provider`, `terms`, `listing_urls_json`, `amount` | Freeze listing URLs (SHA-256 + `eq_principle_strict_eq`) |
| `fund` | write | `deal_id` | Client locks units into escrow |
| `submit_delivery` | write | `deal_id`, `delivery_urls_json` | Provider freezes delivery evidence |
| `release` | write | `deal_id` | Client happy-path payout to provider |
| `dispute` | write | `deal_id`, `claim` | Open dispute |
| `adjudicate` | write | `deal_id` | LLM judges **frozen** evidence → pay/refund (`prompt_comparative` on `pay_provider`) |
| `cross_check` | write | `deal_id` | Re-fetch URLs; flag listing/delivery tamper |
| `get_deal` | view | `deal_id` | Full deal JSON |
| `list_deals` | view | — | Deal id order |
| `get_balance` | view | `user` | `{available, escrowed}` |
| `get_reputation` | view | `user` | wins/losses/score |
| `get_stats` | view | — | Aggregate counts |
| `get_events` | view | — | Recent events |
| `get_owner` | view | — | Owner address |
| `transfer_ownership` | write | `new_owner` | Owner only |

## Status machine

```text
open → funded → delivered → completed
                         ↘ disputed → settled_pay | settled_refund
                         ↘ adjudicate (from delivered) → settled_*
```

## Studio demo URLs

Listing / delivery fixtures:

```json
["https://test-server.genlayer.com/static/genvm/hello.html"]
```
