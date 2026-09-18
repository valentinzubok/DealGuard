// Records the DealGuard demo: live Pages console, real Studio Dev (61997) txs.
// A small EIP-1193 wallet is injected in place of MetaMask; it signs with local test keys.
// Usage: npm i playwright viem && DEAL=demo-N node scripts/record_demo.cjs
// Keys: ~/.genlayer/dealguard-studio-next-keys.json ({"owner": "0x…", "provider": "0x…"} test keys, never committed).
const fs = require("fs");
const { chromium } = require("playwright");
const { privateKeyToAccount } = require("viem/accounts");

const RPC = "https://studio-dev.genlayer.com/api";
const SITE = process.env.SITE || "https://valentinzubok.github.io/DealGuard/console/";
const CONTRACT = "0x0e4619B776f849F0527B32DA86c0ED13c8841AB6";
const EXPLORER = `https://explorer-studio-dev.genlayer.com/address/${CONTRACT}`;
const DEAL = process.env.DEAL || "demo-3";
const CHROME = process.env.HOME +
  "/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

const keys = JSON.parse(fs.readFileSync(process.env.HOME + "/.genlayer/dealguard-studio-next-keys.json", "utf8"));
const wallets = { client: privateKeyToAccount(keys.owner), provider: privateKeyToAccount(keys.provider) };
let current = wallets.client;
let connected = false; // like MetaMask: eth_accounts is empty until the user connects

const t0 = Date.now();
const waits = []; // [startSec, endSec] of consensus waits, sped up in post
const cuts = []; // rate-limit cooldowns (Studio Dev: 30 req/min), removed in post
const now = () => (Date.now() - t0) / 1000;

async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const b = await r.json();
  if (b.error) throw new Error(b.error.message);
  return b.result;
}

async function walletRequest(method, params = []) {
  switch (method) {
    case "eth_requestAccounts":
      connected = true;
      return [current.address];
    case "eth_accounts":
      return connected ? [current.address] : [];
    case "eth_chainId":
      return "0xf22d";
    case "wallet_switchEthereumChain":
    case "wallet_addEthereumChain":
      return null;
    case "eth_sendTransaction": {
      const p = params[0];
      const signed = await current.signTransaction({
        type: "legacy", chainId: 61997, to: p.to, data: p.data,
        value: BigInt(p.value || 0), gas: BigInt(p.gas), nonce: Number(BigInt(p.nonce)),
        gasPrice: BigInt(p.gasPrice || 0),
      });
      return rpc("eth_sendRawTransaction", [signed]);
    }
    default:
      return rpc(method, params);
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: "video", size: { width: 1280, height: 800 } },
  });
  await context.exposeFunction("__walletRequest", (m, p) => walletRequest(m, p));
  await context.addInitScript(() => {
    const listeners = {};
    window.__walletEmit = (ev, arg) => (listeners[ev] || []).forEach((h) => h(arg));
    window.ethereum = {
      isMetaMask: false,
      request: ({ method, params }) => window.__walletRequest(method, params || []),
      on: (ev, h) => { (listeners[ev] = listeners[ev] || []).push(h); },
      removeListener: (ev, h) => { listeners[ev] = (listeners[ev] || []).filter((x) => x !== h); },
    };
  });
  const page = await context.newPage();

  const caption = async (text, ms = 3500) => {
    await page.evaluate((t) => {
      let el = document.getElementById("__cap");
      if (!el) {
        el = document.createElement("div");
        el.id = "__cap";
        el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:1100px;" +
          "background:rgba(17,24,39,.92);color:#fff;font:600 20px/1.4 system-ui,sans-serif;padding:14px 22px;" +
          "border-radius:12px;z-index:99999;box-shadow:0 6px 24px rgba(0,0,0,.35);text-align:center";
        document.body.appendChild(el);
      }
      el.textContent = t;
    }, text);
    await page.waitForTimeout(ms);
  };
  const scrollTo = async (selector) => {
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  };
  const tx = async (label, button) => {
    const cs = now();
    await page.waitForTimeout(45000);
    cuts.push([cs + 0.5, now() - 0.5]);
    await page.getByRole("button", { name: button, exact: true }).click();
    const start = now();
    await page.waitForFunction((l) => {
      const ok = [...document.querySelectorAll("p.ok")].some((p) => p.textContent === `${l} OK`);
      const err = document.querySelector("p.err");
      return ok || err;
    }, label, { timeout: 600000 });
    const err = await page.locator("p.err").count();
    if (err) throw new Error(`${label}: ` + (await page.locator("p.err").first().textContent()));
    const end = now();
    if (end - start > 8) waits.push([start + 3, end - 2]);
    console.log(`${label} OK in ${(end - start).toFixed(1)}s`);
  };
  const showDeal = async (text) => {
    await page.getByRole("button", { name: "Refresh on-chain" }).click();
    await page.waitForTimeout(2500);
    await scrollTo(`li:has-text("${DEAL}")`);
    await caption(text, 4500);
  };

  // 1. Contract on the explorer
  await page.goto(EXPLORER, { waitUntil: "networkidle" }).catch(() => undefined);
  await caption("DealGuard is live on GenLayer Studio Dev (chain 61997): " + CONTRACT, 5000);
  await caption("On-chain code sha256 = contracts/DealGuard.py in the repo (see STUDIO_DEV_DEPLOY.md)", 4500);

  // 2. App reads real chain state before any wallet is connected
  await page.goto(SITE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=owner 0x", { timeout: 60000 });
  await caption("The DealGuard app talks to that contract directly: no local JSON, no manual Studio steps", 5000);
  await scrollTo("text=On-chain state");
  await caption("Loaded from chain: owner, stats, deals, frozen sha256 snapshots, LLM verdicts", 5500);

  // 3. Connect wallet (client)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Connect MetaMask" }).click();
  await page.waitForSelector("text=your escrow balance", { timeout: 60000 });
  await caption("Wallet connected on chain 61997 as the CLIENT. Test wallet injected for this recording (signs like MetaMask).", 5500);

  // 4. create_deal freezes the listing
  await scrollTo("text=1 · Client: create_deal + fund");
  await page.getByLabel("deal_id").fill(DEAL);
  await caption(`Client opens deal "${DEAL}": terms + listing URL. Validators fetch and freeze the page under SHA-256 consensus.`, 5000);
  await caption("Waiting for GenLayer consensus…", 0);
  await tx("create_deal", "create_deal (freeze listing)");
  await showDeal("Deal is OPEN on chain, listing frozen with its sha256 hash");

  // 5. fund
  await scrollTo("text=1 · Client: create_deal + fund");
  await caption("Client funds the escrow", 2500);
  await caption("Waiting for GenLayer consensus…", 0);
  await tx("fund", "fund");
  await showDeal("Deal is FUNDED: the amount is locked in escrow");

  // 6. provider delivers
  current = wallets.provider;
  await page.evaluate((a) => window.__walletEmit("accountsChanged", [a]), current.address);
  await page.waitForTimeout(1500);
  await scrollTo("text=2 · Provider: submit_delivery");
  await caption("Switch wallet to the PROVIDER. Provider submits the delivery URL, which is frozen as well.", 5000);
  await caption("Waiting for GenLayer consensus…", 0);
  await tx("submit_delivery", "submit_delivery (freeze delivery)");
  await showDeal("DELIVERED: listing and delivery snapshots are both frozen on chain");

  // 7. client disputes, validators adjudicate with LLMs on frozen evidence
  current = wallets.client;
  await page.evaluate((a) => window.__walletEmit("accountsChanged", [a]), current.address);
  await page.waitForTimeout(1500);
  await scrollTo("text=3 · Settle");
  await page.getByLabel("dispute claim").fill("Client claims the delivered page does not say Hello world");
  await caption("Back to the CLIENT, who disputes the delivery", 3500);
  await caption("Waiting for GenLayer consensus…", 0);
  await tx("dispute", "dispute");
  await showDeal("DISPUTED: escrow is frozen until adjudication");
  await scrollTo("text=3 · Settle");
  await caption("adjudicate: GenLayer validators run LLMs on the FROZEN snapshots only, not on live URLs that can change", 5500);
  await caption("Validators reaching consensus on the verdict…", 0);
  await tx("adjudicate", "adjudicate (LLM on frozen evidence)");
  await showDeal("Settled by consensus: verdict pay_provider is stored on chain");

  // 8. last tx on the explorer
  await page.evaluate(() => window.scrollTo(0, 0));
  await caption("Every step is a real Studio Dev transaction; the hash links to the explorer", 4500);
  const href = await page.locator('a[href*="/tx/"]').first().getAttribute("href");
  if (href) {
    await page.goto(href, { waitUntil: "networkidle" }).catch(() => undefined);
    await caption("Transaction on the Studio Dev explorer", 5000);
  }
  await page.goto(SITE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=owner 0x", { timeout: 60000 });
  await caption("DealGuard: freeze the deal, settle the truth. github.com/valentinzubok/DealGuard", 5000);

  const video = page.video();
  await context.close();
  await browser.close();
  const path = await video.path();
  fs.writeFileSync("video/meta.json", JSON.stringify({ path, waits, cuts }, null, 2));
  console.log("VIDEO", path, "waits", JSON.stringify(waits));
})().catch((e) => { console.error("ERR", e); process.exit(1); });
