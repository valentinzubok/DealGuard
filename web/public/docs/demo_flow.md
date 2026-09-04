# DealGuard Studio smoke

## Deploy

1. https://studio.genlayer.com/contracts
2. Paste `contracts/DealGuard.py`
3. Constructor: your wallet `0x…`

## Happy path

```text
credit(your_address, "1000")
create_deal(
  "demo-1",
  provider_0x,
  "Provider must deliver a page that contains the word Hello",
  '["https://test-server.genlayer.com/static/genvm/hello.html"]',
  "100"
)
fund("demo-1")
# switch to provider wallet
submit_delivery("demo-1", '["https://test-server.genlayer.com/static/genvm/hello.html"]')
# switch to client
release("demo-1")
get_deal("demo-1")  → status completed
```

## Dispute path

After `submit_delivery`:

```text
dispute("demo-1", "Delivery does not match listing terms")
adjudicate("demo-1")
cross_check("demo-1")
get_reputation(provider)
get_stats()
```
