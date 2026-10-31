# DealGuard v4 — Studio Dev (chain 61997) deploy record

| | |
|---|---|
| **Network** | GenLayer Studio Dev / Studio Next — chain `61997` |
| **RPC** | `https://studio-dev.genlayer.com/api` |
| **Contract (v4)** | [`0x9d2F35936528981aab4D3095a1eE93878C7D4E63`](https://explorer-studio-dev.genlayer.com/address/0x9d2F35936528981aab4D3095a1eE93878C7D4E63) |
| **Deploy tx** | [`0x98a52309…ddb1cf`](https://explorer-studio-dev.genlayer.com/tx/0x98a523098b81bb37e58cbe1d2e21612d1362653d45b654a4294f9fbe5eddb1cf) |
| **Owner** | `0x5f1C2ba2119001151cc3942A7B7a284bE22565b9` (the deployer) — can pin the code snapshot and transfer ownership, nothing else |
| **Source** | [`contracts/DealGuard.py`](contracts/DealGuard.py) — runner `py-genlayer:babwp9t37jw9g4j2bccgn14g6x7x9s1f7dsmh7emvz735pz4zxa0` |
| **Source sha256** | `f3e462f6b0563b52cb902864cc40ce9c4ba72de35e49004ad5fa8cc076c79c74` (= `contract_hash` in [`CODE_SNAPSHOT.json`](CODE_SNAPSHOT.json)) |
| **App** | https://valentinzubok.github.io/DealGuard/console/ |
| **v3 (superseded)** | `0xEB22D050…4c85` — [its run](docs/STUDIO_DEV_V3_RUN.md); Studio Dev no longer reads it |

## Verify the source yourself

```bash
curl -s -X POST https://studio-dev.genlayer.com/api -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"gen_getContractCode","params":["0x9d2F35936528981aab4D3095a1eE93878C7D4E63"]}' \
  | python3 -c "import sys,json,base64,hashlib; print(hashlib.sha256(base64.b64decode(json.load(sys.stdin)['result'])).hexdigest())"
shasum -a 256 contracts/DealGuard.py
# both print f3e462f6b0563b52cb902864cc40ce9c4ba72de35e49004ad5fa8cc076c79c74
```

CI runs the same comparison on every push (`scripts/verify_deployment.py`).

## Runner

Studio Dev stopped accepting the earlier runner `py-genlayer:5jycge4q8…` between 2026-10-20 and
2026-10-30: deploys fail with `invalid_contract runner malformed`, and so do reads of contracts
deployed before. v4 uses the runner listed as current on the
[official runners page](https://sdk.genlayer.com/main/executors/v0.3/python-sdk/available-runners.html)
(GenVM v0.3.0-rc10). Earlier deploy attempts with older runners failed before this one.

## Lint

`sh scripts/lint_current_sdk.sh` — `genvm-lint lint` on the file as deployed, then `check` and
`typecheck` on a copy whose header uses the runner bundled with the public linter (`1jb45aa8…`); the
linter cannot yet download the rc10 runner. The contract body is byte-identical. Passed, in CI.

## The run

Accounts (throwaway test keys): client `0xFC93eA9A607E50b9287317ff3A3ec86be47c693C`, provider
`0x7Bc84179793406B9aB817255186AC7633CE00279`, stranger `0x3F1ba839a1Aff90015d958Ec0C1Dc897bB5C9bB0`. The
listing is the GenLayer test page; the deliveries are files of this repository
([`delivery-ok.md`](web/public/fixtures/v4/delivery-ok.md), [`delivery-long.md`](web/public/fixtures/v4/delivery-long.md)).

| # | Call | Sender | Result | What happened | Tx |
|---|------|--------|--------|---------------|----|
| 1 | `create_deal(long-1)` | client | SUCCESS | `long-1`: terms ask for a final price in EUR; review window 120 s (the minimum), appeal window 60 s | [`0xa546396b…076c70`](https://explorer-studio-dev.genlayer.com/tx/0xa546396b32f4cb1e812b529a97c1fe9e0b110ad740a91ae55c612d23f1076c70) |
| 2 | `fund(long-1)` value 1 GEN | client | SUCCESS | FUNDED. 1 GEN escrowed | [`0xb4fcc163…73375c`](https://explorer-studio-dev.genlayer.com/tx/0xb4fcc16357fa3aa0864435f42929fc5c7b1de84093c6e547d3524ecf6973375c) |
| 3 | `submit_delivery(long-1)` | provider | SUCCESS | delivery frozen: `delivery-long.md`, 8 338 characters, no price in it. Review deadline = delivery + 120 s | [`0x00fc4e43…f16608`](https://explorer-studio-dev.genlayer.com/tx/0x00fc4e43527cbf838401072c21e6aedb6d4a6f4ec84b3b5121753e9dd4f16608) |
| 4 | `create_deal(late-1)` | client | SUCCESS | `late-1`: same, terms ask for Hello and the final price | [`0xe6680b31…8b9f68`](https://explorer-studio-dev.genlayer.com/tx/0xe6680b31ce94a92a0b529b2ff61a6c85d0941fc40cdcf3156c049672b38b9f68) |
| 5 | `fund(late-1)` value 1 GEN | client | SUCCESS | funded | [`0x85a6cc24…dbb1cb`](https://explorer-studio-dev.genlayer.com/tx/0x85a6cc24018abc006918aef96ce6719f756d388cee563407a66274ad25dbb1cb) |
| 6 | `submit_delivery(late-1)` | provider | SUCCESS | delivery frozen: `delivery-ok.md` (172 characters) | [`0x8b85d115…c286d4`](https://explorer-studio-dev.genlayer.com/tx/0x8b85d11531f8ec2e05924f4371f3c1ba89169bc2e074289926916e2e6ac286d4) |
| 7 | `expire_review(late-1)` | stranger | **ERROR** | `expire_review(late-1)` one step before the deadline: **UserError** `the review deadline has not passed; expire_review opens at 1793483729` | [`0xdba9e3d2…45fb64`](https://explorer-studio-dev.genlayer.com/tx/0xdba9e3d2fcabc9d7c32aff4da10dae78a8306c7aebd57dd92f55d1e44645fb64) |
| 8 | `adjudicate(long-1)` | stranger | SUCCESS | `adjudicate(long-1)`: the model answered `pay_provider=false`, but the judge read only 1 200 of 8 338 characters → round 1 is **inconclusive**, nothing is ruled, the escrow stays (`get_round`) | [`0x0d67fab5…62e121`](https://explorer-studio-dev.genlayer.com/tx/0x0d67fab5e11a56684c839d60a4fae81d1628a870fa56130eacd304d73c62e121) |
| 9 | `create_deal(rel-1)` | client | SUCCESS | `rel-1`: review window 600 s | [`0xa18ed588…fd56ea`](https://explorer-studio-dev.genlayer.com/tx/0xa18ed58879baadbe8d9eb903fe7c7d534d395705caff9693e4e9c20f14fd56ea) |
| 10 | `fund(rel-1)` value 1 GEN | client | SUCCESS | funded | [`0xb7dac96e…eb531b`](https://explorer-studio-dev.genlayer.com/tx/0xb7dac96e25ffd8d8684c399f51707782f796c83da856531dcd33399b7feb531b) |
| 11 | `submit_delivery(rel-1)` | provider | SUCCESS | delivery frozen | [`0x94cb02d5…105ae4`](https://explorer-studio-dev.genlayer.com/tx/0x94cb02d5eebbff5a107f4fa4171408507c04a06794261a5fbc77fd634f105ae4) |
| 12 | `release(rel-1)` | client | SUCCESS | FINALIZED. client releases: provider paid 1 GEN | [`0x5c066f21…04f372`](https://explorer-studio-dev.genlayer.com/tx/0x5c066f210d1bf5b8143f6acc9afb989071aed68614198ec66b7dea76f004f372) |
| 13 | `create_deal(app-1)` | client | SUCCESS | `app-1`: review window 600 s | [`0x321fc306…a0bbc1`](https://explorer-studio-dev.genlayer.com/tx/0x321fc306137c50cddc990e951af26440c1ec1f666e4754a1e89e6dd55aa0bbc1) |
| 14 | `fund(app-1)` value 1 GEN | client | SUCCESS | funded | [`0xf79c104d…a8769b`](https://explorer-studio-dev.genlayer.com/tx/0xf79c104d7f0a21843202f2494754e0ebedc2efa75ccea10d5719a17962a8769b) |
| 15 | `submit_delivery(app-1)` | provider | SUCCESS | delivery frozen | [`0xefd6302b…4ffecb`](https://explorer-studio-dev.genlayer.com/tx/0xefd6302bd4e4020af930b7867b087c0e2c525287f03ab023d7456526194ffecb) |
| 16 | `adjudicate(app-1)` | stranger | SUCCESS | `adjudicate(app-1)`: whole page read, ruling **pay**, not paid yet | [`0xd55d8fad…dbb702`](https://explorer-studio-dev.genlayer.com/tx/0xd55d8fad808eeea678f978ec26a0cae1291c85e3bab3253b653b9b3ebddbb702) |
| 17 | `appeal(app-1)` | client | SUCCESS | `appeal(app-1)`: opens a fresh review deadline for the second round | [`0xc2115521…1ed208`](https://explorer-studio-dev.genlayer.com/tx/0xc21155214e95375b706c9f3ab23550eec85b81c64fe009ba3f11462ce61ed208) |
| 18 | `adjudicate_appeal(app-1)` | stranger | SUCCESS | FINALIZED. `adjudicate_appeal`: second round **pay** → upheld, provider paid 1 GEN. `get_round` has both rounds | [`0x310d978b…b63a86`](https://explorer-studio-dev.genlayer.com/tx/0x310d978b6d7628447186736383322ebc8dd1570b38a6f0031685ac1a07b63a86) |
| 19 | `release(late-1)` | client | **ERROR** | `release(late-1)` at the deadline: **UserError** `the review deadline has passed at 1793483729; only expire_review is accepted, not release` | [`0xf45fd014…c675f5`](https://explorer-studio-dev.genlayer.com/tx/0xf45fd0144f0e1b130b302a1c92143e3ddf6bf0e648efa523de5516614cc675f5) |
| 20 | `adjudicate(late-1)` | stranger | **ERROR** | `adjudicate(late-1)` at the deadline: **UserError** `…only expire_review is accepted, not adjudicate` | [`0x5a1d2ee4…bbb9d9`](https://explorer-studio-dev.genlayer.com/tx/0x5a1d2ee410b1bf5ad2c5d7a68b9c118c4b959a3e143425c38c1a0bba73bbb9d9) |
| 21 | `dispute(late-1)` | client | **ERROR** | `dispute(late-1)` at the deadline: **UserError** `…only expire_review is accepted, not dispute` | [`0xec8b2b09…73fc9d`](https://explorer-studio-dev.genlayer.com/tx/0xec8b2b09c9bc968479c17c19a6a845bc09257146fdcbe8149bc55265be73fc9d) |
| 22 | `expire_review(late-1)` | stranger | SUCCESS | FINALIZED. `expire_review(late-1)`: client refunded 1 GEN | [`0x08807118…ec32e1`](https://explorer-studio-dev.genlayer.com/tx/0x088071184b8908165de7cf9970ce52e61dd2dbaa56b5e99942017f7c13ec32e1) |
| 23 | `expire_review(long-1)` | stranger | SUCCESS | FINALIZED. `expire_review(long-1)`: the deal nobody could rule on is refunded to the client | [`0xb0828a8e…904cd8`](https://explorer-studio-dev.genlayer.com/tx/0xb0828a8e3e73e67a5e2af9061db662cdd1522564d0ecc74f51e139e0db904cd8) |

### What the run shows

* **A refund never rests on a partial reading.** Tx 8: the model said refund, the judge had read 1 200
  of 8 338 characters, so `get_round("long-1", 1)` has `verdict: inconclusive`,
  `delivery_complete: false`, `model_pay: false`, and the deal stayed `delivered` with 1 GEN escrowed.
  A deal with no conclusive ruling does not hang: tx 23 refunds it after the review deadline.
* **The review deadline splits time in two.** Txs 7 and 19–22 on `late-1`: one step before the deadline
  only the party actions are open and `expire_review` is refused; at the deadline `release`,
  `adjudicate` and `dispute` are each refused with their own message and `expire_review` works.
  `get_schedule` at the deadline reads `can_expire_review: true` with `can_release`, `can_dispute` and
  `can_adjudicate` all false.
* **Every round is kept.** `get_round("app-1", 1)` (ruling) and `("app-1", 2)` (appeal) hold the time,
  the model's answer, the verdict, the completeness and the SHA-256 of the page that was read
  (`afa6ed64…`, 172 of 172 characters).
* **Money.** Four deals, 4 GEN in and 4 GEN out (provider 1 + 1, client 1 + 1 back); the contract
  holds 0. `get_stats` → `{"deals":4,"tampered":0,"escrowed":"0","paid_out":"4000000000000000000"}`.
* **Paged registry.** `list_deals(0, 10)` → `long-1 settled_refund`, `late-1 settled_refund`,
  `rel-1 completed`, `app-1 settled_pay`.

### What this run did not show

* The 260-deal registry, the 200-event cap that is gone and the event paging are covered by unit tests
  (`test_deals_keep_being_created_far_past_the_old_event_cap_and_events_are_paged` and neighbours), not
  by 260 transactions on chain.
* Whether the model answers refund for a given page is up to the model; the contract's rule (no
  refund from a partial reading) is what the run demonstrates, and `tests/test_v4.py` covers every other
  combination (whole page and refund, partial page and pay, inconclusive appeal).
