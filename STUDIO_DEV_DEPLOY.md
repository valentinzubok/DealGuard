# DealGuard v3 — Studio Dev (chain 61997) deploy record

| | |
|---|---|
| **Network** | GenLayer Studio Dev / Studio Next — chain `61997` |
| **RPC** | `https://studio-dev.genlayer.com/api` |
| **Contract (v3, appeal before payment)** | [`0xEB22D050b78024c2f5e6BfBD8BF3E6952BF54c85`](https://explorer-studio-dev.genlayer.com/address/0xEB22D050b78024c2f5e6BfBD8BF3E6952BF54c85) |
| **Deploy tx** | [`0x41c9f58e…056f99`](https://explorer-studio-dev.genlayer.com/tx/0x41c9f58ed2e7e7f9a24eefa3e43faed7bdb621061c64013df8e73c5de2056f99) |
| **Owner** | `0x42F132a0519Ee2702A97f1f1f3Fe0E8041A2d542` — can pin the code snapshot and transfer ownership, nothing else |
| **Source** | [`contracts/DealGuard.py`](contracts/DealGuard.py) — runner `py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng` |
| **Source sha256** | `193d295fcd4f3eeab046820f0769f30b926b4ef31a83624b316c72fb5e67a4a7` (= `contract_hash` in [`CODE_SNAPSHOT.json`](CODE_SNAPSHOT.json)) |
| **App** | https://valentinzubok.github.io/DealGuard/console/ |
| **v2 (no appeal, superseded)** | `0x5acb72C8B75A03D198044Ef450ccF5b253665FCC` — [its run](docs/STUDIO_DEV_V2_RUN.md) |
| **v1 (bookkeeping units, superseded)** | `0x0e4619B776f849F0527B32DA86c0ED13c8841AB6` |

## Verify the source yourself

```bash
curl -s -X POST https://studio-dev.genlayer.com/api -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"gen_getContractCode","params":["0xEB22D050b78024c2f5e6BfBD8BF3E6952BF54c85"]}' \
  | python3 -c "import sys,json,base64,hashlib; print(hashlib.sha256(base64.b64decode(json.load(sys.stdin)['result'])).hexdigest())"
shasum -a 256 contracts/DealGuard.py
# both print 193d295fcd4f3eeab046820f0769f30b926b4ef31a83624b316c72fb5e67a4a7
```

## The run: a ruling waits, an appeal gets a second round

Three fresh accounts, each given 100 test GEN by the faucet:

| Role | Address |
|---|---|
| client | `0x54A5Cd828DCFcE0028451a2bFd44Ad914Ec368E6` |
| provider | `0xE7708C8fe58389d6F95AB9Cc834B96b0aC7BdA39` |
| stranger | `0x48862176bcaA10AED63963CBFadB059f1ED7eD18` |

The listing page is `https://test-server.genlayer.com/static/genvm/hello.html`. The delivery pages
are files in this repository, fetched at a pinned commit:
[`delivery-ok.html`](https://github.com/valentinzubok/DealGuard/blob/9ad7e8f099d9d8583ce58fe7dc6decc27312670e/web/public/fixtures/delivery-ok.html)
and
[`delivery-placeholder.html`](https://github.com/valentinzubok/DealGuard/blob/9ad7e8f099d9d8583ce58fe7dc6decc27312670e/web/public/fixtures/delivery-placeholder.html).

Terms of every deal: *"The provider must deliver a report page for the order. The delivered page
must contain the greeting Hello and three completed sections: scope, findings and recommendations."*

Every transaction is listed, including the ten that were refused. Wallet balances are
`eth_getBalance`; they also move by a fraction of a GEN in fees.

| # | Call | Sender | Result | What happened | Tx |
|---|------|--------|--------|---------------|----|
| 1 | `create_deal(settle-1)` | client | SUCCESS | listing frozen. 2 GEN, delivery window 3600 s, appeal window 150 s | [`0xc6beae50…b17f49`](https://explorer-studio-dev.genlayer.com/tx/0xc6beae5034af2ad7479f69f02e78bd2a6f2486b014ab18dd9e9596ae7eb17f49) |
| 2 | `create_deal(appeal-1)` | client | SUCCESS | 3 GEN, appeal window 150 s | [`0x0b7f545b…4eb480`](https://explorer-studio-dev.genlayer.com/tx/0x0b7f545b1206ed0f74ad2bb708a94619b9719560d92f5f4aa51d6728f24eb480) |
| 3 | `create_deal(release-1)` | client | SUCCESS | 1 GEN, appeal window 150 s | [`0x58106dea…39b31c`](https://explorer-studio-dev.genlayer.com/tx/0x58106dea08b7bceee2fbe9de0141c21cacaad627bfe8e646dcbcbcf62139b31c) |
| 4 | `fund(settle-1) value 2 GEN` | client | SUCCESS | escrow 2 | [`0xe7dd03ca…3020a8`](https://explorer-studio-dev.genlayer.com/tx/0xe7dd03ca5fa0621fa2053681e15dbe6fdd2a44eacfbafe89f4875158f13020a8) |
| 5 | `fund(appeal-1) value 3 GEN` | client | SUCCESS | escrow 5 | [`0x85a90bd9…c65bc8`](https://explorer-studio-dev.genlayer.com/tx/0x85a90bd9b5a1919bc3fb26e5de4fd9f044b8a7c9a80df3d54313ef461ec65bc8) |
| 6 | `fund(release-1) value 1 GEN` | client | SUCCESS | escrow 6 | [`0x0046c8f6…460332`](https://explorer-studio-dev.genlayer.com/tx/0x0046c8f6067a34af65a13831181743f1007e99616dbd66dc15311ccd59460332) |
| 7 | `submit_delivery(settle-1)` | provider | SUCCESS | `delivery-ok.html` frozen | [`0xa75ea30d…b879cc`](https://explorer-studio-dev.genlayer.com/tx/0xa75ea30db2951d1fd9017821d1792e498f8c2db22831c4aa7c435a6afdb879cc) |
| 8 | `submit_delivery(appeal-1)` | provider | SUCCESS | `delivery-placeholder.html` frozen | [`0x9121caf4…64f3c1`](https://explorer-studio-dev.genlayer.com/tx/0x9121caf40339935c7b39a564249c4fae72ce028555f8fbc39896e7fd7064f3c1) |
| 9 | `submit_delivery(release-1)` | provider | SUCCESS | `delivery-ok.html` frozen | [`0xb43f1fd0…6058bf`](https://explorer-studio-dev.genlayer.com/tx/0xb43f1fd0993743a77e1b1b50f4604203127815a7334c8fa9c62e06f6e26058bf) |
| 10 | `adjudicate(settle-1)` | **provider** | SUCCESS | the provider rules on its own deal the moment it is delivered. Validators: pay. Status `ruled`, escrow still 2 GEN, nothing paid | [`0x78ddd635…9fcaa4`](https://explorer-studio-dev.genlayer.com/tx/0x78ddd6358d1864557eb1d1f466c39183dcabf0828b53d9bfec5944cd3a9fcaa4) |
| 11 | `settle(settle-1)` | **provider** | **ERROR** | **refused**: the appeal window is still open | [`0x38853af5…0930e2`](https://explorer-studio-dev.genlayer.com/tx/0x38853af53f99edbf069d02a72de5e5eac8b25375f04309de28f078c8830930e2) |
| 12 | `appeal(settle-1)` | **provider** | **ERROR** | **refused**: only the party the ruling went against may appeal | [`0xa3a4d0c3…1b7917`](https://explorer-studio-dev.genlayer.com/tx/0xa3a4d0c38f598491b30ba7b52d53d9cbc8e669d1fcc3bca68bb91368d91b7917) |
| 13 | `appeal(settle-1)` | **stranger** | **ERROR** | **refused**: only the party the ruling went against may appeal | [`0xa6154fc4…c17312`](https://explorer-studio-dev.genlayer.com/tx/0xa6154fc4251fb7002eeb385b0b3db1b7be50451f7776918e287d844de3c17312) |
| 14 | `release(settle-1)` | client | **ERROR** | **refused**: a ruled deal is not released | [`0xc0297f24…434a76`](https://explorer-studio-dev.genlayer.com/tx/0xc0297f24e8afeee685782cf89393176f9b6e12b149475564319943ebd0434a76) |
| 15 | `dispute(appeal-1)` | client | SUCCESS | dispute: "The page says the report is coming soon. Nothing was delivered." | [`0x558b0b1f…07dea3`](https://explorer-studio-dev.genlayer.com/tx/0x558b0b1f95f7aabb8bce740aae7d69255d7c034deaba81470fa7beaae707dea3) |
| 16 | `adjudicate(appeal-1)` | stranger | SUCCESS | validators: do not pay. Status `ruled`, escrow still 3 GEN | [`0x4db48bcd…7a8d08`](https://explorer-studio-dev.genlayer.com/tx/0x4db48bcdf2c8472ce00ae71a85ff5850e5f693ee449a8bb9db70b30f357a8d08) |
| 17 | `appeal(appeal-1)` | **client** | **ERROR** | **refused**: the client won this ruling and cannot appeal it | [`0xcc7f57d3…9417f2`](https://explorer-studio-dev.genlayer.com/tx/0xcc7f57d3e567cb3f1c3c85cebaf0aa763d790af187cd587ffaa70c5d9c9417f2) |
| 18 | `appeal(appeal-1)` | provider | SUCCESS | the losing side appeals: "The page exists and the order is in progress, so the work should be paid." Status `appealed` | [`0x38eaf380…e37124`](https://explorer-studio-dev.genlayer.com/tx/0x38eaf380ada31b216079645062c456d25a23f15264954cbc0565ba06b8e37124) |
| 19 | `appeal(appeal-1)` | provider | **ERROR** | **refused**: there is one appeal | [`0x6534d5d3…a020c9`](https://explorer-studio-dev.genlayer.com/tx/0x6534d5d3a7e28468289fbc84b848280d4711958e6b185175926e65313ca020c9) |
| 20 | `settle(appeal-1)` | stranger | **ERROR** | **refused**: an appealed ruling cannot be settled | [`0x8a5ca869…a7240d`](https://explorer-studio-dev.genlayer.com/tx/0x8a5ca869280c1fcb92e181fb5ce06f36eba0f06a3e4341f104801cd56ea7240d) |
| 21 | `adjudicate_appeal(appeal-1)` | stranger | SUCCESS | second round, FINALIZED. Validators again: do not pay. Appeal **upheld**, `settled_refund`; the client's 3 GEN came back (wallet 93.8994 → 96.8992 by the next read) | [`0x0c21ea04…bf5dfe`](https://explorer-studio-dev.genlayer.com/tx/0x0c21ea0495dc88d64b5e96c44cbfc2050104544fe3177ec9b06825fa3fbf5dfe) |
| 22 | `adjudicate_appeal(appeal-1)` | stranger | **ERROR** | **refused**: the appeal verdict is final | [`0xbbeb43be…bd83d2`](https://explorer-studio-dev.genlayer.com/tx/0xbbeb43bed4358f820819f160190f90fbd0a4effe4fbd6530510515545fbd83d2) |
| 23 | `release(release-1)` | client | SUCCESS | FINALIZED. The client accepts `release-1`; provider +1 GEN | [`0x2f6b16a1…f49981`](https://explorer-studio-dev.genlayer.com/tx/0x2f6b16a17750466da408fbfc9885c695bc4aceeaac6d4c2e8c0f8fd660f49981) |
| 24 | `appeal(settle-1)` | **client** | **ERROR** | **refused**: 160 s after the ruling the appeal window has closed | [`0x393e55eb…2a58ca`](https://explorer-studio-dev.genlayer.com/tx/0x393e55eba92bc254b0a15492f9226d68f259e4a0d24d42d6b812b1a9922a58ca) |
| 25 | `settle(settle-1)` | stranger | SUCCESS | FINALIZED. The unappealed ruling is paid: provider wallet 100.9993 → 102.9993, contract balance 0 | [`0x4338a0e8…4a4f7a`](https://explorer-studio-dev.genlayer.com/tx/0x4338a0e88b1bb1d9048684473070d0f393e7f7490c8e79e98e5bfd70674a4f7a) |
| 26 | `settle(settle-1)` | stranger | **ERROR** | **refused**: already paid | [`0x3a70a970…a221ae`](https://explorer-studio-dev.genlayer.com/tx/0x3a70a9705845bac9a58af5fecedb5b297587558b18560be55b32662bf7a221ae) |

### What this shows

| Deal | Amount | Path | Paid to |
|---|---|---|---|
| `settle-1` | 2 GEN | provider calls `adjudicate` at once → ruling *pay* → cannot settle, cannot be appealed by the winner or a stranger → window passes → `settle` | provider, **160 s after the ruling and not before** |
| `appeal-1` | 3 GEN | placeholder delivery → `dispute` → ruling *refund* → the provider appeals → second round upholds | **client** (refund), decided by two independent rounds |
| `release-1` | 1 GEN | client accepts | provider |

Row 10 is the case v2 could not handle: the provider asked for a verdict on its own deal as soon
as the delivery was frozen. In v2 that one round would have paid it in the same transaction. Here
the ruling moved nothing (row 11 is the provider trying to collect), and the client had the
whole window to object.

Rows 18 and 21 are the appeal: the losing side stated its grounds, and a second consensus round
looked at the same frozen evidence again, with those grounds in view as an argument and without
being told what the first round decided.

End state, read from chain:

```
get_stats           {"deals":3,"by_status":{"settled_pay":1,"settled_refund":1,"completed":1},"tampered":0,"escrowed":"0","paid_out":"6000000000000000000"}
get_escrow_balance  0
contract balance    0
client              100 → 96.9991   (6 GEN escrowed, 3 GEN refunded by the appeal round)
provider            100 → 102.9993  (+3 GEN: one settled ruling, one release)
```

## Reproducible app path

1. Open https://valentinzubok.github.io/DealGuard/console/ — deals, rulings, appeal deadlines and the escrow balance are read from chain with no wallet.
2. **Connect MetaMask** (the app switches to chain 61997) and **Get test GEN**.
3. Client: `create_deal` (amount in GEN, delivery window and appeal window in seconds) → `fund`.
4. Provider account: `submit_delivery` before the deadline.
5. Client: `release`. Or anyone: `adjudicate` → a ruling. Then the losing side: `appeal` → anyone: `adjudicate_appeal`. With no appeal: `settle` once the window has closed.

## Notes on Studio Dev

- The header must be `# v0.3.0` followed by the pinned `Depends` line.
- Every transaction carries a fee deposit (`genlayer-js@2.0.0-rc.1`, `studioDevnet`, `estimateTransactionFees`).
- A payout reaches the wallet when the transaction is finalized, not when it is accepted.
- The demo video in `assets/demo/` was recorded against v1 and shows the earlier, unit-based contract.
