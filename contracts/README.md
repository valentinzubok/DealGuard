# DealGuard — method map

Intelligent Contract: [`DealGuard.py`](DealGuard.py)

| Method | Type | Args | Effect |
|--------|------|------|--------|
| `__init__` | ctor | `owner_address` | Bootstrap storage |
| `create_deal` | write | `deal_id`, `provider`, `terms`, `listing_urls_json`, `amount` (wei), `delivery_window` (s, default 86400) | Freeze listing URLs (SHA-256 + `eq_principle_strict_eq`) |
| `fund` | write · **payable** | `deal_id` | Client escrows the amount in native GEN. Never reverts with value attached; a refused amount is credited |
| `withdraw_credit` | write | — | Take back GEN `fund` could not escrow |
| `reclaim` | write | `deal_id` | Client only, funded deal with no delivery, after `delivery_due_at`: escrow returns to the client |
| `submit_delivery` | write | `deal_id`, `delivery_urls_json` | Provider freezes delivery evidence |
| `release` | write | `deal_id` | Client only: the provider's wallet is paid |
| `dispute` | write | `deal_id`, `claim` | Parties only |
| `adjudicate` | write | `deal_id` | LLM judges **frozen** evidence → GEN to the provider or back to the client (`prompt_comparative` on `pay_provider`) |
| `cross_check` | write | `deal_id` | Re-fetch URLs; flag listing/delivery tamper |
| `get_deal` | view | `deal_id` | Full deal JSON |
| `list_deals` | view | — | Deal id order |
| `get_schedule` | view | `deal_id` | Deadline, and which calls would be accepted now |
| `get_credit` | view | `user` | Wei owed to `user` from refused fundings |
| `get_escrow_balance` | view | — | `{balance, escrowed, credits}` in wei |
| `get_reputation` | view | `user` | wins/losses/score |
| `get_stats` | view | — | Aggregate counts |
| `get_events` | view | — | Recent events |
| `pin_code_snapshot` | write | `commit`, `evidence_hash`, `contract_hash`, `timestamp` | **onlyOwner** — pin `sha256(git HEAD)` + contract hash |
| `store_evidence` | write | `deal_id`, `evidence_json` | Parties/owner — PromptRegistry-style `condition_met` payload |
| `get_code_snapshot` | view | — | Pinned integrity snapshot |
| `get_evidence` | view | `deal_id` | Stored evidence JSON |
| `get_criteria_template` | view | — | Required fields + example |

## Status machine

```text
open → funded → delivered → completed
          ↘ reclaimed (no delivery by the deadline)
                         ↘ disputed → settled_pay | settled_refund
                         ↘ adjudicate (from delivered) → settled_*
```

## Studio demo URLs

Listing / delivery fixtures:

```json
["https://test-server.genlayer.com/static/genvm/hello.html"]
```
