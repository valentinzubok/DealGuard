# Changelog

All notable product and pin changes. On-chain integrity is anchored by [`CODE_SNAPSHOT.json`](CODE_SNAPSHOT.json) + `pin_code_snapshot` (see [`DEPLOY.md`](DEPLOY.md)).

## [0.2.0] — 2026-09-04 · Product site for Agent Tank jury

| Area | Change |
|------|--------|
| Site | `/how-it-works/` sequence (freeze → escrow → adjudicate → cross_check) |
| Site | `/quickstart/` Studio steps with mock screenshots + live contract links |
| Site | `/evidence-explorer/` interactive integrity pack builder |
| Site | `/features/`, `/use-cases/`, `/api-reference/`, `/security/`, `/changelog/` |
| Docs | README Getting Started, CONTRIBUTING, issue/PR templates |
| CI | Web `tsc --noEmit` in GitHub Actions |

## [0.1.0] — 2026-09-04 · Studionet deploy

| Area | Change |
|------|--------|
| Contract | Deployed `DealGuard.py` → `0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D` |
| Integrity | `pin_code_snapshot` FINALIZED (commit `f7b12fc…`, timestamp `2026-09-04T10:27:47Z`) |
| Demo | `create_deal(demo-1)` + `store_evidence` (`condition_met: true`) |
| Site | GitHub Pages static export + Studio operator guide |

### Current CODE_SNAPSHOT (pinned)

| Field | Value |
|-------|-------|
| `commit` | `f7b12fc26209eb3259c43b64c62060209f517f66` |
| `evidence_hash` | `0d9c1a110981ef729b07e651dccd13a9c6aebabc0737bb888dcd52f8b29c97e5` |
| `contract_hash` | `66bee33605a6e151c2ded2860b7624ac17c1865815911d05b21b5b43dfe78791` |
| `timestamp` | `2026-09-04T10:27:47Z` |

## [0.1.0-rc] — 2026-09-04 · Agent Tank pack

| Area | Change |
|------|--------|
| Pack | `CODE_SNAPSHOT` + `condition_met` schemas + integrity pack generator |
| CI | Snapshot verify, schema validate, pytest, web build |
| Tools | CLI + `/evidence` UI |
