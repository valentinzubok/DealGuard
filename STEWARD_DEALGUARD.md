# DealGuard — steward "Action needed" response (Sep 2026)

## What stewards asked → what is delivered

| Request | Delivered |
|---|---|
| Connect the app to its real contract and show on-chain state | `/console/` reads `get_owner` / `get_stats` / `list_deals` / `get_deal` live from chain and writes through MetaMask (`credit`, `create_deal`, `fund`, `submit_delivery`, `release`, `dispute`, `adjudicate`). No local JSON. |
| Current Studio Next (61997) address that source-verifies | `0x0e4619B776f849F0527B32DA86c0ED13c8841AB6` — on-chain code sha256 equals `contracts/DealGuard.py` (`d69a3444…96ad`). Command in [`STUDIO_DEV_DEPLOY.md`](STUDIO_DEV_DEPLOY.md). |
| Reproducible app path | [`STUDIO_DEV_DEPLOY.md` → Reproducible app path](STUDIO_DEV_DEPLOY.md#reproducible-app-path) |
| Demo video | see script below — link added to the Portal submission |

## Demo video script (2–3 min)

1. Show the README → contract address → explorer page on `explorer-studio-dev.genlayer.com`.
2. Open https://valentinzubok.github.io/DealGuard/console/ **before** connecting: state (owner, stats, `demo-1 completed`,
   `demo-2 settled_pay` with frozen sha256 hashes) is already loaded from chain.
3. Connect MetaMask (owner `0x6f60…46e3`) → chain 61997 → **Get test GEN** if the fee balance is 0.
4. `create_deal("demo-3", provider = MetaMask account #2, hello.html)` → confirm → status `open`, listing frozen.
5. `fund` → status `funded`, escrow balance moves.
6. Switch MetaMask to account #2 → **Get test GEN** → `submit_delivery` → status `delivered`, delivery frozen.
7. Switch back → `dispute` → `adjudicate` → status `settled_pay` / `settled_refund` with the LLM verdict.
8. Click the last tx link → explorer shows the transaction.

## Portal resubmit text

```text
DealGuard is now deployed on GenLayer Studio Dev / Studio Next (chain 61997, GenVM v0.3):
0x0e4619B776f849F0527B32DA86c0ED13c8841AB6
Source verification: gen_getContractCode on studio-dev.genlayer.com returns code whose sha256 is
d69a3444de6b99bb6a919c11003d69d6900681943f00b8d081cc037a52f996ad, identical to contracts/DealGuard.py in the repo
(also pinned as contract_hash in CODE_SNAPSHOT.json).

The web app is connected to this contract: https://valentinzubok.github.io/DealGuard/console/
It reads get_owner / get_stats / list_deals / get_deal directly from chain (no local JSON) and writes via MetaMask
with genlayer-js (studioDevnet chain, fee deposits): credit, create_deal, fund, submit_delivery, release, dispute, adjudicate.

On-chain state already present: demo-1 completed (create_deal → fund → submit_delivery → release) and demo-2 settled_pay
(dispute → adjudicate by LLM validators on the frozen listing/delivery snapshots). All tx hashes: STUDIO_DEV_DEPLOY.md.

Reproducible path: open /console → state loads from chain → Connect MetaMask (switches to 61997) → Get test GEN →
create_deal → fund → (provider account) submit_delivery → dispute → adjudicate → Refresh shows the new status and verdict.

Demo video: REPLACE_WITH_VIDEO_URL
```

## Evidence links

1. GitHub: https://github.com/valentinzubok/DealGuard
2. App: https://valentinzubok.github.io/DealGuard/console/
3. Contract: https://explorer-studio-dev.genlayer.com/address/0x0e4619B776f849F0527B32DA86c0ED13c8841AB6
4. Deploy record: https://github.com/valentinzubok/DealGuard/blob/main/STUDIO_DEV_DEPLOY.md
5. Demo video: REPLACE_WITH_VIDEO_URL
