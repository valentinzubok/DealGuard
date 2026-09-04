# DealGuard — Studionet deploy record

**Network:** GenLayer Studio / Studionet  
**Contract:** [`0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D`](https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D)  
**Owner / client:** `0x6f6077eC587f2964d30aCE8D803Edc27988046e3`  
**Website:** https://valentinzubok.github.io/DealGuard/  
**Source:** [`contracts/DealGuard.py`](contracts/DealGuard.py)

## Successful transactions

| Step | Method | Result | Explorer |
|------|--------|--------|----------|
| Deploy | Contract Deployment | SUCCESS | [0x09b84e3b…](https://explorer-studio.genlayer.com/tx/0x09b84e3ba39a88b1fbb2d2cdd8df994877f3444864827d88023caae83a67b5c3) |
| Integrity | `pin_code_snapshot` | SUCCESS | [0x0d17d1ef…](https://explorer-studio.genlayer.com/tx/0x0d17d1effc69a47718283014b3d0b941a174cb9db896db7aa239c3ac01d45c11) |
| Bootstrap | `credit(owner, 1000)` | SUCCESS | [0xeb205cfb…](https://explorer-studio.genlayer.com/tx/0xeb205cfbc5681e295a96f1d0e9f8591e1d976f735dec4ac226c61fd73ce847ae) |
| Deal | `create_deal(demo-1, 0x1111…)` | SUCCESS | [0xdb2e5980…](https://explorer-studio.genlayer.com/tx/0xdb2e59803482ea0ff10d11bbc128f5b6323c131808d88d7a4bc2063a0d9310e7) |
| Evidence | `store_evidence(demo-1, …)` | SUCCESS | [0x0cd0bd31…](https://explorer-studio.genlayer.com/tx/0x0cd0bd31256e670deb6e4418cd8d94d96b83452d4d2551500eee6337cdf224fc) |

## On-chain pin (`get_code_snapshot`)

| Field | Value |
|-------|-------|
| `commit` | `f7b12fc26209eb3259c43b64c62060209f517f66` |
| `evidence_hash` | `0d9c1a110981ef729b07e651dccd13a9c6aebabc0737bb888dcd52f8b29c97e5` |
| `contract_hash` | `66bee33605a6e151c2ded2860b7624ac17c1865815911d05b21b5b43dfe78791` |
| `timestamp` | `2026-09-04T10:27:47Z` |
| `pinned_by` | `0x6f6077eC587f2964d30aCE8D803Edc27988046e3` |

## Deal `demo-1` (verified reads)

| Field | Value |
|-------|-------|
| Status | `open` (listing frozen; fund/delivery optional for pitch) |
| Provider | `0x1111111111111111111111111111111111111111` (placeholder ≠ client) |
| Amount | `100` |
| Listing hash | `c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb7df31ad9e51a` |
| Preview | `Hello world!` |
| `condition_met` | `true` (via `store_evidence`) |
| `payload_hash` | `6c9c208f88439fb1f76519c9b6bbce22092be0be192495398d5073e92f565512` |

## Failed txs (expected / documented)

| Tx | Method | Error | Note |
|----|--------|-------|------|
| [0xa48f4c40…](https://explorer-studio.genlayer.com/tx/0xa48f4c40fcdc2afd966a698dda73a4ba334f90f891e0d88b81a36163b785d515) | `create_deal` | `provider cannot be the client` | First attempt used self as provider |
| [0x708eea3e…](https://explorer-studio.genlayer.com/tx/0x708eea3ebb1611de2ab8d3c488be5a78999d583302af6cbf4eb37189f81e9e83) | `fund` | `unknown deal_id` | Cascaded before successful create |
| [0x1bac25e6…](https://explorer-studio.genlayer.com/tx/0x1bac25e6588ee9bc504ec518f7bafc10b0b57f8e1d44b1388a07c31b1ea887e1) | `submit_delivery` | `unknown deal_id` | Same cascade |

## Pitch read path (stewards)

```text
get_code_snapshot()
get_criteria_template()
get_deal("demo-1")
get_evidence("demo-1")
get_owner()
```

## Portal contract link

```text
https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D
```
