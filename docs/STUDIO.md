# GenLayer Studio — что делать (DealGuard)

Сайт (после Pages): https://valentinzubok.github.io/DealGuard/  
Контракт: [`contracts/DealGuard.py`](../contracts/DealGuard.py)

---

## 0. Подготовка (2 минуты)

1. Открой https://studio.genlayer.com/contracts  
2. Подключи **MetaMask** (сеть Studionet / как в Studio).  
3. Скопируй адрес кошелька `0x…` — это будет **owner** и обычно **client**.  
4. Для полного демо нужен **второй** адрес (provider). Можно:
   - второй аккаунт MetaMask, или  
   - временно тот же flow только до `create_deal` / views, а deliver сделать с другого кошелька.

---

## 1. Deploy контракта

1. **New contract** → вставь весь файл `contracts/DealGuard.py` из репо.  
2. Constructor arg: **твой** `0x…` (owner).  
3. **Deploy** → дождись SUCCESS.  
4. Скопируй **contract address** → это поле Contract link в Agent Tank  
   (`https://explorer-studio.genlayer.com/address/0x…`).

---

## 2. Pin integrity (только owner)

В Studio вызови `pin_code_snapshot` с аргументами из `CODE_SNAPSHOT.json`
или командой:

```bash
python3 scripts/cli.py studio-calls
```

Поля:

| Arg | Откуда |
|-----|--------|
| `commit` | `CODE_SNAPSHOT.json` → `commit` |
| `evidence_hash` | `evidence_hash` (= sha256(commit)) |
| `contract_hash` | `contract_hash` (= sha256(DealGuard.py)) |
| `timestamp` | `timestamp` |

Проверка: `get_code_snapshot()` → тот же commit/hash.

---

## 3. Деньги для демо (owner)

```text
credit(<client_0x>, "1000")
```

`client_0x` = кошелёк, который будет открывать сделку.

---

## 4. Создать и профинансировать сделку (client)

Переключи MetaMask на **client**, затем:

```text
create_deal(
  "demo-1",
  "<provider_0x>",
  "Provider must deliver a page that contains the word Hello",
  "[\"https://test-server.genlayer.com/static/genvm/hello.html\"]",
  "100"
)
fund("demo-1")
```

Проверка: `get_deal("demo-1")` → `status: funded`, в `listing_items` есть `content_hash` (64 hex).

---

## 5. Delivery (provider)

Переключи MetaMask на **provider**:

```text
submit_delivery(
  "demo-1",
  "[\"https://test-server.genlayer.com/static/genvm/hello.html\"]"
)
```

Проверка: `status: delivered`.

---

## 6a. Happy path (client) — или 6b dispute

**6a Release:**
```text
release("demo-1")
```
→ `status: completed`

**6b Dispute + adjudicate:**
```text
dispute("demo-1", "Check delivery against terms")
adjudicate("demo-1")
cross_check("demo-1")
```
→ `settled_pay` или `settled_refund`

---

## 7. Evidence (condition_met)

С сайта `/demo` или `/evidence` скачай JSON, либо:

```bash
python3 scripts/cli.py evidence generate --deal-id demo-1
```

В Studio (client/provider/owner):

```text
store_evidence("demo-1", <вставь JSON одной строкой>)
get_evidence("demo-1")
get_criteria_template()
```

---

## 8. Что сохранить для Portal

1. Contract explorer URL  
2. Tx hashes: deploy, `pin_code_snapshot`, `create_deal`, `fund`, `submit_delivery`, `adjudicate`/`release`  
3. Website: https://valentinzubok.github.io/DealGuard/  
4. GitHub: https://github.com/valentinzubok/DealGuard  

Чеклист: [`SUBMIT.md`](../SUBMIT.md)
