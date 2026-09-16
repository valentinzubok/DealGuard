# DealGuard — steward Action needed (Sep 2026)

## What stewards asked

1. Connect the DealGuard **app** to its **real** contract and show on-chain state (not local JSON / Studio paste).
2. Provide a **Studio Next (chain 61997)** address that source-verifies there.
3. Provide a **demo video** (mandatory for Agent Tank / this review).

## What is in the repo now

- Live wallet console: `/console/` (`web/src/app/console/page.tsx`)
- Reads: `list_deals`, `get_deal`, `get_stats`, `get_owner`, `get_balance`
- Writes: `credit`, `create_deal`, `fund`, `submit_delivery`
- Network defaults: Studio Next RPC `https://studio-next.genlayer.com/api`, chain `61997`, explorer `https://explorer-studio-dev.genlayer.com`

## YOU must do (Studio + video)

### A. Deploy on Studio Next

1. Open Studio Next (studio-next / studio-dev UI for chain 61997).
2. Paste `contracts/DealGuard.py`.
3. Constructor = your wallet.
4. Deploy → copy **contract address**.
5. Smoke: `credit(you, "1000")` → `create_deal("demo-1", "0x1111…1111", "Deliver hello", '["https://test-server.genlayer.com/static/genvm/hello.html"]', "100")` → `fund("demo-1")`.
6. Confirm on https://explorer-studio-dev.genlayer.com/address/YOUR_ADDRESS

### B. Point the app at that address

```bash
cd web
# local
echo 'NEXT_PUBLIC_DEALGUARD_ADDRESS=0xYOUR_STUDIO_NEXT_ADDRESS' > .env.local
npm run dev

# production (Vercel)
# set NEXT_PUBLIC_DEALGUARD_ADDRESS in project env, redeploy
```

### C. Demo video (required)

Record 1–3 min showing:
1. Open `/console/`
2. Connect MetaMask (Studio Next)
3. Refresh → on-chain owner/stats
4. credit → create_deal → fund
5. Refresh → deal status funded
Upload to YouTube → paste URL in Portal **Demo video** field.

## Portal Resubmit text

```text
Connected DealGuard web app to live GenLayer reads/writes via /console (MetaMask + genlayer-js). Refresh shows list_deals/get_deal/get_stats from chain — not local JSON. App targets Studio Next chain 61997 (RPC studio-next.genlayer.com). Studio Next address: REPLACE_ADDRESS. Demo video: REPLACE_YOUTUBE_URL. Reproducible path: open /console → Connect → Refresh → credit → create_deal(demo-1) → fund → Refresh shows status funded.
```

## Evidence

1. GitHub https://github.com/valentinzubok/DealGuard
2. Website /console URL
3. Studio Next explorer address (61997)
4. Demo video YouTube
5. contracts/DealGuard.py blob
