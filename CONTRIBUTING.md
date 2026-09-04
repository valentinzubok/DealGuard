# Contributing to DealGuard

Thanks for helping improve agentic commerce infrastructure. Keep changes focused and jury-readable.

## Before you start

1. Read [`README.md`](README.md) and [`DEPLOY.md`](DEPLOY.md) (live Studionet contract).
2. Prefer small PRs: docs, tests, or one UX surface on the static site.
3. Do **not** overwrite `CODE_SNAPSHOT.json` unless you intend to re-pin on Studio (`pin_code_snapshot`). The on-chain pin must stay aligned with the file used for Agent Tank.

## Dev setup

```bash
# Contract / integrity
python3 -m pip install -r requirements-dev.txt
python3 scripts/update_code_snapshot.py verify
python3 scripts/validate_schemas.py
python3 -m pytest -q

# Website
cd web && npm install && npm run typecheck && npm run dev
```

## PR checklist

- [ ] `python3 scripts/update_code_snapshot.py verify` passes (unless intentionally updating + documenting a re-pin)
- [ ] `python3 -m pytest -q` passes for contract changes
- [ ] `cd web && npm run build` passes for site changes
- [ ] README / CHANGELOG updated if user-facing
- [ ] No secrets, private keys, or `.env` files committed

## What to work on (high value)

| Area | Examples |
|------|----------|
| Docs | Studio steps, clearer error notes (MetaMask reject, provider≠client) |
| Site | Quickstart screenshots, Evidence explorer UX, a11y |
| Tests | Lifecycle edge cases in `tests/` |
| Integrity | Schema examples, CLI polish |

Lower priority for this track: i18n, dark theme, Vercel (Pages already deploys), genlayer-js SPA wrappers.

## Issues

Use the GitHub issue templates when available. Include: expected vs actual, Studio network, tx hash if on-chain.

## License

By contributing you agree your work is released under the MIT License ([`LICENSE.md`](LICENSE.md)).
