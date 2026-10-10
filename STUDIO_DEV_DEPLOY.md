# DealGuard v2 — Studio Dev (chain 61997) deploy record

| | |
|---|---|
| **Network** | GenLayer Studio Dev / Studio Next — chain `61997` |
| **RPC** | `https://studio-dev.genlayer.com/api` |
| **Contract (v2, native GEN escrow)** | [`0x5acb72C8B75A03D198044Ef450ccF5b253665FCC`](https://explorer-studio-dev.genlayer.com/address/0x5acb72C8B75A03D198044Ef450ccF5b253665FCC) |
| **Owner** | `0xc6eD15D41ea18a5Dfc2D0c34Ee8ae7C779011be2` — can pin the code snapshot and transfer ownership, nothing else |
| **Source** | [`contracts/DealGuard.py`](contracts/DealGuard.py) — runner `py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng` |
| **Source sha256** | `eb986d73740000d7756fa71c43837154616f473bfe73a007e21e387594d31f9a` (= `contract_hash` in [`CODE_SNAPSHOT.json`](CODE_SNAPSHOT.json)) |
| **App** | https://valentinzubok.github.io/DealGuard/console/ |
| **v1 (bookkeeping units, superseded)** | `0x0e4619B776f849F0527B32DA86c0ED13c8841AB6` |

## Verify the source yourself

```bash
curl -s -X POST https://studio-dev.genlayer.com/api -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"gen_getContractCode","params":["0x5acb72C8B75A03D198044Ef450ccF5b253665FCC"]}' \
  | python3 -c "import sys,json,base64,hashlib; print(hashlib.sha256(base64.b64decode(json.load(sys.stdin)['result'])).hexdigest())"
shasum -a 256 contracts/DealGuard.py
# both print eb986d73740000d7756fa71c43837154616f473bfe73a007e21e387594d31f9a
```

## The run: 8 GEN in, 8 GEN out

Three fresh accounts, each given 100 test GEN by the faucet:

| Role | Address |
|---|---|
| client | `0x8a29d2dbe90913cAc0F36CA9F12A2853B58dc778` |
| provider | `0xe6189378f4f2c90BFe4d7096424329300b2eAf07` |
| stranger | `0x5a5Fc1909D42CeFe4581cB1E22F35cE5c04Cc133` |

The listing page is `https://test-server.genlayer.com/static/genvm/hello.html`. The delivery pages are
files in this repository, fetched at a pinned commit:
[`delivery-ok.html`](https://github.com/valentinzubok/DealGuard/blob/9ad7e8f099d9d8583ce58fe7dc6decc27312670e/web/public/fixtures/delivery-ok.html)
and
[`delivery-placeholder.html`](https://github.com/valentinzubok/DealGuard/blob/9ad7e8f099d9d8583ce58fe7dc6decc27312670e/web/public/fixtures/delivery-placeholder.html)
(a polite "coming soon" page that contains none of what the terms ask for).

Terms of every deal: *"The provider must deliver a report page for the order. The delivered page
must contain the greeting Hello and three completed sections: scope, findings and recommendations."*

Every transaction is listed, including the five that were refused. Wallet balances are
`eth_getBalance` read before the call and after it finalized; they also move by a fraction of a
GEN in fees, which is why they are not round.

| # | Call | Sender | Result | What happened | Tx |
|---|------|--------|--------|---------------|----|
| 1 | `create_deal(pay-1, 2 GEN, window 3600)` | client | SUCCESS | listing frozen | [`0x7efb035c…f5269e`](https://explorer-studio-dev.genlayer.com/tx/0x7efb035cb12dc9edb8e8c35059321fe0109a1e4cc75c76f39dd29e01faf5269e) |
| 2 | `create_deal(refund-1, 3 GEN, window 3600)` | client | SUCCESS |  | [`0xe9aa8360…d24ffb`](https://explorer-studio-dev.genlayer.com/tx/0xe9aa836057e709d12ab05a47a80e75a70e7fc8e47b7a43340a926fc94ed24ffb) |
| 3 | `create_deal(late-1, 1 GEN, window 60)` | client | SUCCESS |  | [`0x9fb7f473…682696`](https://explorer-studio-dev.genlayer.com/tx/0x9fb7f473403cc8afa44d4867a249dee3815abba334c3ea916cb1053c72682696) |
| 4 | `fund(late-1) value 1 GEN` | client | SUCCESS | escrow 1 | [`0x1525f047…48f8c0`](https://explorer-studio-dev.genlayer.com/tx/0x1525f0478f9963ce8231ad585382d9e16c720e407deb1feaf9935de55d48f8c0) |
| 5 | `fund(pay-1) value 2 GEN` | client | SUCCESS | escrow 3 | [`0x641c0d15…2fc55e`](https://explorer-studio-dev.genlayer.com/tx/0x641c0d15612f711234835c200d7dba282c4b5d6ac35a21903c1e043b032fc55e) |
| 6 | `fund(refund-1) value 3 GEN` | client | SUCCESS | escrow 6 | [`0x6fb4a2ab…5ac8ae`](https://explorer-studio-dev.genlayer.com/tx/0x6fb4a2ab5c4075633ab4abbc3524e8ce46078f0178d5c42f34683d7c675ac8ae) |
| 7 | `fund(pay-1) value 1 GEN` | **stranger** | SUCCESS, **refused** | not escrowed; 1 GEN booked as the stranger's credit. Contract balance 7 = 6 escrow + 1 credit | [`0xea8e4cb8…e507bf`](https://explorer-studio-dev.genlayer.com/tx/0xea8e4cb837bffa8a047c837397baf4c60d156a63d5391c78d545eb01a6e507bf) |
| 8 | `submit_delivery(pay-1, delivery-ok.html)` | provider | SUCCESS | delivery frozen | [`0x38986137…fb00dd`](https://explorer-studio-dev.genlayer.com/tx/0x389861373b415a249e1812f22c0924d173e6b1b2f62d85e9aff5512070fb00dd) |
| 9 | `submit_delivery(refund-1, delivery-placeholder.html)` | provider | SUCCESS | delivery frozen | [`0x7064ed62…9a24d6`](https://explorer-studio-dev.genlayer.com/tx/0x7064ed622c5a472ad7c47d887bcb9fe322ea55e697b44055bd1ee329589a24d6) |
| 10 | `submit_delivery(late-1, delivery-ok.html)` | provider | SUCCESS | inside the 60 s window | [`0x227b8ba4…ffe290`](https://explorer-studio-dev.genlayer.com/tx/0x227b8ba408302b7c224b167d5fd2ac6c9150ac805abc4ee2b8a323b7efffe290) |
| 11 | `create_deal(late-2, 1 GEN, window 60)` | client | SUCCESS |  | [`0xd34d1ca3…be3ce2`](https://explorer-studio-dev.genlayer.com/tx/0xd34d1ca35702cb60d0b061dac83feb8f5afeb9d6645692a3ffec1e3b87be3ce2) |
| 12 | `fund(late-2) value 1 GEN` | client | SUCCESS | escrow 7 | [`0x5b951bed…909d69`](https://explorer-studio-dev.genlayer.com/tx/0x5b951bed54e262e6d1159103d9040dfe543d0df9651f81b4acd823393d909d69) |
| 13 | `reclaim(late-2)` | client | **ERROR** | too early: the deadline has not passed | [`0x1a4b0f26…c8eef6`](https://explorer-studio-dev.genlayer.com/tx/0x1a4b0f26dbf13f5036e45d4c8aaa607388684dc2f6a84178d8f9a3cc2bc8eef6) |
| 14 | `release(pay-1)` | client | SUCCESS, FINALIZED | provider wallet 99.9997 → 101.9997 | [`0x769098f0…b56af9`](https://explorer-studio-dev.genlayer.com/tx/0x769098f0792e088e3e51309481c1edbb15764146382c8337a714fd9647b56af9) |
| 15 | `dispute(refund-1)` | **stranger** | **ERROR** | only parties may dispute | [`0x50c542b5…d0da9a`](https://explorer-studio-dev.genlayer.com/tx/0x50c542b5c3b2c0f687d2fd16ff28f8bb04beec1c7c567f28671f47b27bd0da9a) |
| 16 | `release(refund-1)` | **provider** | **ERROR** | only client may release | [`0x55de8286…b492c3`](https://explorer-studio-dev.genlayer.com/tx/0x55de82867fe99e28190d85b86d8967f85467c43f601aec0845572dd8f6b492c3) |
| 17 | `dispute(refund-1, "…coming soon. Nothing was delivered.")` | client | SUCCESS |  | [`0x7c081285…60cfc2`](https://explorer-studio-dev.genlayer.com/tx/0x7c0812858a20b3f55a546d664bfc2551cd8d2c4ae5d0063e8727735f3f60cfc2) |
| 18 | `adjudicate(refund-1)` | stranger | SUCCESS, FINALIZED | validators: do not pay. `settled_refund`; client wallet 92.8992 → 95.9991 | [`0x6816592b…8e8cdc`](https://explorer-studio-dev.genlayer.com/tx/0x6816592b6a6269661bed3fc3f2ed857162414b4736a1d9fa1c217d42278e8cdc) |
| 19 | `submit_delivery(late-2)` | provider | **ERROR** | 75 s after funding: the delivery deadline has passed | [`0x4eb5169f…f838a9`](https://explorer-studio-dev.genlayer.com/tx/0x4eb5169f77aa96be4b6ea7d6ec505e4399a8683e3f09ee7c52c577d5e3f838a9) |
| 20 | `reclaim(late-2)` | client | SUCCESS, FINALIZED | `reclaimed`; client wallet 95.9991 → 96.9990 | [`0xc3643526…0b1a3d`](https://explorer-studio-dev.genlayer.com/tx/0xc3643526001191b5a02bd20e108994b51ca355f393449fd1186f9cd1f00b1a3d) |
| 21 | `adjudicate(late-1)` | stranger | SUCCESS, FINALIZED | no dispute, validators: pay. `settled_pay`; provider wallet 101.9996 → 102.9996 | [`0x41a864d0…3a0d6c`](https://explorer-studio-dev.genlayer.com/tx/0x41a864d0de8f47e5df8b201f609c746db069f113f0945d668ca3a295fb3a0d6c) |
| 22 | `withdraw_credit()` | stranger | SUCCESS, FINALIZED | stranger wallet 98.9996 → 99.9995; contract balance 0 | [`0x121142d8…d81f8a`](https://explorer-studio-dev.genlayer.com/tx/0x121142d833be75df2db800e068e3aeefc35bd4c1841b54df90fae585d8d81f8a) |

### Where the money went

| Deal | Amount | Path | Paid to |
|---|---|---|---|
| `pay-1` | 2 GEN | delivered → `release` by the client | provider |
| `refund-1` | 3 GEN | placeholder delivery → `dispute` → `adjudicate` | **client** (refund) |
| `late-1` | 1 GEN | delivered → `adjudicate` with no dispute | provider |
| `late-2` | 1 GEN | no delivery in 60 s → `reclaim` | **client** (refund) |
| refused `fund` | 1 GEN | stranger tried to fund someone else's deal → credit → `withdraw_credit` | stranger |

End state, read from chain:

```
get_stats           {"deals":4,"by_status":{"completed":1,"settled_pay":1,"settled_refund":1,"reclaimed":1},"tampered":0,"escrowed":"0","paid_out":"7000000000000000000"}
get_escrow_balance  0
contract balance    0
client              100 → 96.9990   (paid 3 GEN for the two deals the provider won, got 4 back)
provider            100 → 102.9996  (+3 GEN)
stranger            100 → 99.9995   (the refused 1 GEN came back)
```

Two things in this table are the reason v2 exists. Row 7: a `fund()` that the contract refuses
still completes, because value attached to a reverting call is not returned on this network; the
1 GEN was booked as a credit and left in row 22. Rows 14, 18, 20, 21, 22: the wallets actually
moved, because payouts are external transfers, not internal messages.

## Reproducible app path

1. Open https://valentinzubok.github.io/DealGuard/console/ — deals, deadlines and the escrow balance are read from chain with no wallet.
2. **Connect MetaMask** (the app switches to chain 61997) and **Get test GEN**.
3. Client: `create_deal` (amount in GEN, delivery window in seconds) → `fund` (the amount is sent as the transaction value).
4. Provider account: `submit_delivery` before the deadline.
5. Client: `release`, or `dispute` → anyone: `adjudicate`. With no delivery by the deadline: `reclaim`.

## Notes on Studio Dev

- The header must be `# v0.3.0` followed by the pinned `Depends` line.
- Every transaction carries a fee deposit (`genlayer-js@2.0.0-rc.1`, `studioDevnet`, `estimateTransactionFees`).
- A payout reaches the wallet when the transaction is finalized, not when it is accepted.
- The v1 lifecycle on `0x0e4619B7…1AB6` and the demo video in `assets/demo/` show the earlier, unit-based contract.
