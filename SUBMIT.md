# Agent Tank — DealGuard submission pack

## Identity

| Field | Value |
|---|---|
| Track | **Agentic Commerce Infrastructure** |
| Project name | `DealGuard` |
| Logo | `assets/logo.jpg` (1024², <2MB) |
| GitHub | `https://github.com/valentinzubok/DealGuard` *(create + push first)* |
| Website | Vercel URL after `cd web && vercel --prod` |

## One-liner (≤180)

```text
Agentic commerce escrow on GenLayer: freeze listing + delivery URLs, LLM-adjudicate frozen evidence, cross_check drift before payout.
```

## Description (≤1000)

```text
DealGuard is shared infrastructure for agent-to-agent commerce. Agents already buy and dispute from the open web — but listings and delivery pages change before adjudication (URL rot).

create_deal freezes listing URLs under validator SHA-256 consensus. fund locks bookkeeping escrow. submit_delivery freezes delivery evidence. release covers the happy path; dispute + adjudicate run GenLayer LLMs against FROZEN snapshots only (prompt_comparative on pay_provider). cross_check proves later drift. Reputation scores update from outcomes.

Built for agent marketplaces, freelance agents, and escrow apps that need settlement tied to web evidence — not another wrapper agent. Studio-deployable Intelligent Contract in-repo with a public product site.
```

## How-to

1. **Open Studio** — https://studio.genlayer.com/contracts → paste `contracts/DealGuard.py` → Deploy with your `0x` wallet as owner.
2. **Bootstrap** — `credit(your_address, "1000")`.
3. **Create + fund** — `create_deal` with GenLayer hello fixture URL, then `fund`.
4. **Deliver** — from provider wallet call `submit_delivery` with the same fixture.
5. **Settle** — `dispute` then `adjudicate`, or `release`. Optional `cross_check`.

## Expected verification outcome

```text
After Studio deploy: credit succeeds; create_deal stores listing_items with 64-hex SHA-256 and status ok; fund moves units to escrowed; submit_delivery stores delivery_items; adjudicate or release reaches settled_pay/settled_refund or completed; get_stats shows deals ≥ 1; cross_check sets checks ≥ 1 without error on static fixture.
```

## Contract links

Add Studionet explorer URL after first deploy.

## Why this beats the tank field

| Build | Gap DealGuard fills |
|---|---|
| DomainRiskManager | Conflict detection without frozen evidence settlement |
| Verdict | Reputation registry without escrow lifecycle |
| AgentMandate | Permissions without web-evidence adjudication |
| RainGuard / forgeContract | Different tracks — not commerce escrow |

## Create GitHub + site

```bash
cd /Users/valandelon/Desktop/DealGuard
gh repo create valentinzubok/DealGuard --public --source=. --remote=origin --push
cd web && npm install && npm run build
vercel --prod
```
