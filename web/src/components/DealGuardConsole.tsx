"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONTRACT_ADDRESS,
  DEFAULT_PROVIDER,
  DEMO_URL,
  EXPLORER,
  GITHUB,
  CHAIN_ID,
  RPC_URL,
  STUDIO_URL,
  txUrl,
} from "@/lib/config";
import {
  adjudicate,
  createDeal,
  credit,
  dispute,
  fund,
  getBalance,
  getDeal,
  getOwner,
  getStats,
  listDeals,
  release,
  submitDelivery,
  type DealRow,
} from "@/lib/contracts";
import { fundWithTestGen, getNativeBalance } from "@/lib/genlayer";
import { useWallet } from "./WalletProvider";

type FrozenItem = { url?: string; content_hash?: string; preview?: string; status?: string };

function short(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

function Frozen({ label, items }: { label: string; items?: unknown[] }) {
  const list = (items || []) as FrozenItem[];
  if (!list.length) return null;
  return (
    <div className="muted">
      {label}:
      {list.map((it, i) => (
        <div key={i}>
          <code>sha256 {it.content_hash?.slice(0, 16)}…</code> · {it.status} · “{it.preview}”
        </div>
      ))}
    </div>
  );
}

export function DealGuardConsole() {
  const { address, provider, connect, error: walletError } = useWallet();
  const [rows, setRows] = useState<DealRow[]>([]);
  const [owner, setOwner] = useState("");
  const [stats, setStats] = useState("");
  const [balance, setBalance] = useState("");
  const [gen, setGen] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [tx, setTx] = useState("");

  const [dealId, setDealId] = useState("demo-3");
  const [providerAddr, setProviderAddr] = useState<string>(DEFAULT_PROVIDER);
  const [terms, setTerms] = useState("Deliver a page that says Hello world");
  const [amount, setAmount] = useState("100");
  const [listingUrl, setListingUrl] = useState(DEMO_URL);
  const [deliveryUrl, setDeliveryUrl] = useState(DEMO_URL);
  const [claim, setClaim] = useState("Delivered page does not match the listing");
  const [creditUser, setCreditUser] = useState("");
  const [creditAmount, setCreditAmount] = useState("1000");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ids, o, s] = await Promise.all([listDeals(), getOwner(), getStats()]);
      setOwner(o);
      setStats(JSON.stringify(s, null, 2));
      const loaded = await Promise.all(ids.map((id) => getDeal(id)));
      setRows((loaded.filter(Boolean) as DealRow[]).reverse());
      if (address) {
        const [bal, g] = await Promise.all([getBalance(address), getNativeBalance(address)]);
        setBalance(JSON.stringify(bal));
        setGen(g);
      }
      setMsg("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "read failed");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (address && !creditUser) setCreditUser(address);
  }, [address, creditUser]);

  const run = async (label: string, fn: () => Promise<string | void>) => {
    if (!address || !provider) {
      setMsg("Connect MetaMask for writes");
      return;
    }
    setBusy(label);
    setMsg("");
    try {
      const hash = await fn();
      if (hash) setTx(hash);
      setMsg(`${label} OK`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  };

  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const acct = address as `0x${string}`;
  const listingJson = JSON.stringify([listingUrl]);
  const deliveryJson = JSON.stringify([deliveryUrl]);
  const disabled = !!busy || !address;

  return (
    <div className="console">
      <header className="console-header">
        <h1>DealGuard Console</h1>
        <p className="muted">
          Live GenLayer Studio Dev (chain {CHAIN_ID}) reads and writes — every value below is
          read from the contract, not local JSON.
        </p>
        <p className="muted">
          Contract{" "}
          <a href={EXPLORER} target="_blank" rel="noreferrer">
            <code>{CONTRACT_ADDRESS}</code>
          </a>{" "}
          · RPC <code>{RPC_URL}</code>
        </p>
        <div className="row">
          {address ? (
            <span className="pill">
              {short(address)}
              {isOwner ? " · owner" : ""}
            </span>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => void connect()}>
              Connect MetaMask
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh on-chain"}
          </button>
          <a className="btn btn-ghost" href={EXPLORER} target="_blank" rel="noreferrer">
            Explorer
          </a>
          <a className="btn btn-ghost" href={STUDIO_URL} target="_blank" rel="noreferrer">
            Studio
          </a>
          <a className="btn btn-ghost" href={GITHUB} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        {(msg || walletError) && (
          <p className={msg.endsWith("OK") ? "ok" : "err"}>{msg || walletError}</p>
        )}
        {tx && (
          <p className="muted">
            last tx{" "}
            <a href={txUrl(tx)} target="_blank" rel="noreferrer">
              <code>{tx}</code>
            </a>
          </p>
        )}
        {busy && <p className="muted">Waiting for consensus: {busy}…</p>}
      </header>

      <section className="card">
        <h2>On-chain state</h2>
        <p className="muted">owner {owner || "—"}</p>
        <pre>{stats || "—"}</pre>
        {address && (
          <p className="muted">
            your escrow balance <code>{balance || "—"}</code> · test GEN for fees{" "}
            <code>{gen || "—"}</code>{" "}
            <button
              type="button"
              className="btn btn-ghost"
              disabled={disabled}
              onClick={() => void run("faucet", () => fundWithTestGen(acct))}
            >
              Get test GEN
            </button>
          </p>
        )}
        <ul>
          {rows.length === 0 && <li className="muted">No deals yet</li>}
          {rows.map((r) => (
            <li key={r.deal_id}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDealId(r.deal_id)}
              >
                {r.deal_id}
              </button>{" "}
              <strong>{r.status}</strong> · {r.amount} · client {short(r.client)} · provider{" "}
              {short(r.provider)}
              {r.status.startsWith("settled") &&
                ` · verdict pay_provider=${String(r.pay_provider)}`}
              <Frozen label="listing frozen" items={r.listing_items} />
              <Frozen label="delivery frozen" items={r.delivery_items} />
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Owner: credit escrow units</h2>
        <label>
          user
          <input value={creditUser} onChange={(e) => setCreditUser(e.target.value)} />
        </label>
        <label>
          amount
          <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || !isOwner}
          onClick={() =>
            void run("credit", () => credit(acct, provider, creditUser.trim(), creditAmount))
          }
        >
          credit(user, amount)
        </button>
      </section>

      <section className="card">
        <h2>1 · Client: create_deal + fund</h2>
        <label>
          deal_id
          <input value={dealId} onChange={(e) => setDealId(e.target.value)} />
        </label>
        <label>
          provider
          <input value={providerAddr} onChange={(e) => setProviderAddr(e.target.value)} />
        </label>
        <label>
          terms
          <input value={terms} onChange={(e) => setTerms(e.target.value)} />
        </label>
        <label>
          listing URL
          <input value={listingUrl} onChange={(e) => setListingUrl(e.target.value)} />
        </label>
        <label>
          amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={() =>
              void run("create_deal", () =>
                createDeal(acct, provider, dealId, providerAddr, terms, listingJson, amount),
              )
            }
          >
            create_deal (freeze listing)
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled}
            onClick={() => void run("fund", () => fund(acct, provider, dealId))}
          >
            fund
          </button>
        </div>
      </section>

      <section className="card">
        <h2>2 · Provider: submit_delivery</h2>
        <p className="muted">Switch MetaMask to the provider account for this step.</p>
        <label>
          delivery URL
          <input value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled}
          onClick={() =>
            void run("submit_delivery", () =>
              submitDelivery(acct, provider, dealId, deliveryJson),
            )
          }
        >
          submit_delivery (freeze delivery)
        </button>
      </section>

      <section className="card">
        <h2>3 · Settle: release or dispute → adjudicate</h2>
        <label>
          dispute claim
          <input value={claim} onChange={(e) => setClaim(e.target.value)} />
        </label>
        <div className="row">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled}
            onClick={() => void run("release", () => release(acct, provider, dealId))}
          >
            release
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled}
            onClick={() => void run("dispute", () => dispute(acct, provider, dealId, claim))}
          >
            dispute
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={() => void run("adjudicate", () => adjudicate(acct, provider, dealId))}
          >
            adjudicate (LLM on frozen evidence)
          </button>
        </div>
      </section>
    </div>
  );
}
