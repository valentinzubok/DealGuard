# DealGuard Studio smoke

## Deploy

1. https://studio.genlayer.com/contracts
2. Paste `contracts/DealGuard.py`
3. Constructor: your wallet `0x…`

## Happy path

```text
create_deal(
  "demo-1",
  provider_0x,
  "Provider must deliver a page that contains the word Hello",
  '["https://test-server.genlayer.com/static/genvm/hello.html"]',
  "1000000000000000000",   # 1 GEN in wei
  "3600"                   # delivery window, seconds
)
fund("demo-1")            # payable: send 1 GEN as the value
# switch to provider wallet
submit_delivery("demo-1", '["https://test-server.genlayer.com/static/genvm/hello.html"]')
# switch to client
release("demo-1")           # the provider's wallet receives 1 GEN
get_deal("demo-1")  → status completed, paid_to = provider
```

## Dispute path

After `submit_delivery`:

```text
dispute("demo-1", "Delivery does not match listing terms")
adjudicate("demo-1")        # GEN goes to the provider, or back to the client
cross_check("demo-1")
get_reputation(provider)
get_stats()
```
