# DealGuard — Studio Dev (chain 61997) deploy record

| | |
|---|---|
| **Network** | GenLayer Studio Dev / Studio Next — chain `61997`, GenVM `v0.3.0-rc7` |
| **RPC** | `https://studio-dev.genlayer.com/api` (alias `https://studio-next.genlayer.com/api`) |
| **Studio UI** | https://studio-dev.genlayer.com/run-debug |
| **Contract** | [`0x0e4619B776f849F0527B32DA86c0ED13c8841AB6`](https://explorer-studio-dev.genlayer.com/address/0x0e4619B776f849F0527B32DA86c0ED13c8841AB6) |
| **Owner** | `0x6f6077eC587f2964d30aCE8D803Edc27988046e3` (after `transfer_ownership`) |
| **Source** | [`contracts/DealGuard.py`](contracts/DealGuard.py) — runner `py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng` |
| **Source sha256** | `d69a3444de6b99bb6a919c11003d69d6900681943f00b8d081cc037a52f996ad` (= `contract_hash` in [`CODE_SNAPSHOT.json`](CODE_SNAPSHOT.json)) |
| **App** | https://valentinzubok.github.io/DealGuard/console/ |

## Verify the source yourself

The code stored on chain is byte-identical to `contracts/DealGuard.py`:

```bash
curl -s -X POST https://studio-dev.genlayer.com/api -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"gen_getContractCode","params":["0x0e4619B776f849F0527B32DA86c0ED13c8841AB6"]}' \
  | python3 -c "import sys,json,base64,hashlib; print(hashlib.sha256(base64.b64decode(json.load(sys.stdin)['result'])).hexdigest())"
shasum -a 256 contracts/DealGuard.py
# both print d69a3444de6b99bb6a919c11003d69d6900681943f00b8d081cc037a52f996ad
```

## On-chain lifecycle (all `ACCEPTED`, execution `SUCCESS`)

| # | Step | Tx |
|---|------|----|
| 0 | deploy (`owner_address` = deployer) | `0xf6fd682b9139a237da7486525d0b645f5946b604df945dae6830a2ef868e9278` |
| 1 | `credit(client, 1000)` | `0x80f52fe61118f0d47499194a78812af32e90b600aa77ddc2fac0a12a864535ef` |
| 2 | `create_deal(demo-1)` — listing frozen, sha256 `c0535e4b…` | `0xbc7ac6935b47135537f8f2e5efc2d476668c3592e459c79b67411808a7fbe712` |
| 3 | `fund(demo-1)` | `0xc2ca7c71fe0edad1c026c238436bf8f8caed814dca8e24dbcfa317bba0845f6e` |
| 4 | `submit_delivery(demo-1)` (provider) — delivery frozen | `0xe5f5e4cf4ae4982aa06c69367842a56a1762790bf2c9a46c9a39eed090b1f253` |
| 5 | `release(demo-1)` → `completed` | `0xa729ba6145051688c0c3ccce68a58e35265d547092e6c85c8107f4ff97d8321a` |
| 6 | `create_deal(demo-2)` | `0x731da0bbe9bd4640c5ab04f25b6ca5ebe920ee7ba6333fa57f8873c69ab33421` |
| 7 | `fund(demo-2)` | `0x94376a2b6e6ad00fb2ae084849d90e3aaf3333b8f121bf1d771a6e98ab217985` |
| 8 | `submit_delivery(demo-2)` (provider) | `0x35fc825bfce5f395698383e1cecbc827bce013ee2b86c57e64e14755c967e459` |
| 9 | `dispute(demo-2, …)` | `0x6253c62bf760d1b63bf0f21e304b2f773eb9d29cc48d1739e9e9d50d1cbb64e6` |
| 10 | `adjudicate(demo-2)` — LLM validators on frozen evidence → `settled_pay` | `0x05c7755b12873a09dc9941bd9703d1f51d0e00a9a229aacc1a9b843d6b600c39` |
| 11 | `credit(0x6f60…46e3, 1000)` | `0x5c7daac69f6da339e8e7e221c3a902689358eab1817a06eb4256fa48f405dccd` |
| 12 | `transfer_ownership(0x6f60…46e3)` | `0x38b1fa35640dc75be50b5cfe01a494c3d9def80696eecc8b6e7cb0632359cbbc` |

Resulting state after these steps (`get_stats`): `{"deals":2,"by_status":{"completed":1,"settled_pay":1},"tampered":0}`. Later deals (`demo-3`, `demo-4`) were created from the app itself while recording the demo video.

## Reproducible app path

1. Open https://valentinzubok.github.io/DealGuard/console/ (or run `cd web && npm install && npm run dev` → http://localhost:3010/console/).
2. The page reads `get_owner`, `get_stats`, `list_deals`, `get_deal` from the contract above with no wallet — this is live chain state.
3. **Connect MetaMask** → the app adds/switches to chain 61997 (`GenLayer Studio Dev`).
4. **Get test GEN** (Studio faucet, `sim_fundAccount`) — Studio Dev charges a fee deposit on every tx.
5. Owner: `credit(client, 1000)`. Client: `create_deal` → `fund`. Switch MetaMask to the provider account: `submit_delivery`.
6. `release`, or `dispute` → `adjudicate`. **Refresh on-chain** shows the new status, frozen sha256 hashes and verdict.

## Demo video

[`assets/demo/dealguard-demo.mp4`](https://github.com/valentinzubok/DealGuard/blob/main/assets/demo/dealguard-demo.mp4): 2:45 screen recording of the live app at /console/ on Studio Dev (61997), with no mocks: create_deal → fund → submit_delivery → dispute → adjudicate (LLM) on deal `demo-4`, plus the tx on the explorer. For an unattended recording, a small EIP-1193 wallet signing with test keys is injected in place of the MetaMask popup ([`scripts/record_demo.cjs`](scripts/record_demo.cjs)); the app code path is the same as with MetaMask. Consensus waits are sped up 8x and rate-limit pauses are cut.

## Notes on Studio Dev

- Studio Dev runs GenVM v0.3 and rejects older runner hashes (`invalid_contract runner malformed`); the header must be
  `# v0.3.0` followed by the pinned `Depends` line with no other comment lines in between.
- Transactions without a fee deposit revert (`FeesDistributionMissing` / `FeeValueMustBeNonZero`). The app uses
  `genlayer-js@2.0.0-rc.1` (`studioDevnet` chain + `estimateTransactionFees`).
- The earlier Studionet (61999) deploy `0xe8D6d1D1…B02D` is kept in [`DEPLOY.md`](DEPLOY.md) for history only.
