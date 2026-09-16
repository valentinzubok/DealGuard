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
} from "@/lib/config";
import {
  createDeal,
  credit,
  fund,
  getBalance,
  getDeal,
  getOwner,
  getStats,
  listDeals,
  submitDelivery,
  type DealRow,
} from "@/lib/contracts";
import { useWallet } from "./WalletProvider";

export function DealGuardConsole() {
  const { address, provider, connect, error: walletError } = useWallet();
  const [rows, setRows] = useState<DealRow[]>([]);
  const [owner, setOwner] = useState("");
  const [stats, setStats] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [tx, setTx] = useState("");

  const [dealId, setDealId] = useState("demo-1");
  const [providerAddr, setProviderAddr] = useState<string>(DEFAULT_PROVIDER);
  const [terms, setTerms] = useState("Deliver hello page content");
  const [amount, setAmount] = useState("100");
  const [listingUrl, setListingUrl] = useState(DEMO_URL);
  const [deliveryUrl, setDeliveryUrl] = useState(DEMO_URL);
  const [creditUser, setCreditUser] = useState("");
  const [creditAmount, setCreditAmount] = useState("1000");

  const configured = Boolean(CONTRACT_ADDRESS && CONTRACT_ADDRESS.startsWith("0x"));

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      setMsg("Set NEXT_PUBLIC_DEALGUARD_ADDRESS to your Studio Next deploy");
      return;
    }
    setLoading(true);
    try {
      const [ids, o, s] = await Promise.all([listDeals(), getOwner(), getStats()]);
      setOwner(o);
      setStats(JSON.stringify(s, null, 2));
      const loaded = await Promise.all(ids.map((id) => getDeal(id)));
      setRows(loaded.filter(Boolean) as DealRow[]);
      if (address) {
        const bal = await getBalance(address);
        setBalance(JSON.stringify(bal, null, 2));
      }
      setMsg("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "read failed");
    } finally {
      setLoading(false);
    }
  }, [address, configured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (address && !creditUser) setCreditUser(address);
  }, [address, creditUser]);

  const run = async (label: string, fn: () => Promise<string>) => {
    if (!address || !provider) {
      setMsg("Connect MetaMask for writes");
      return;
    }
    setBusy(label);
    setMsg("");
    try {
      const hash = await fn();
      setTx(hash);
      setMsg(`${label} OK`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  };

  const isOwner =
    address && owner && address.toLowerCase() === owner.toLowerCase();
  const acct = address as `0x${string}`;
  const listingJson = JSON.stringify([listingUrl]);
  const deliveryJson = JSON.stringify([deliveryUrl]);

  return (
    <div className="console">
      <header className="console-header">
        <h1>DealGuard Console</h1>
        <p className="muted">
          Live Studio Next (chain {CHAIN_ID}) reads/writes — not local JSON.
          Freeze listing → fund → submit delivery on-chain.
        </p>
        <p className="muted">
          RPC <code>{RPC_URL}</code>
        </p>
        <p className="muted">
          Contract{" "}
          {configured ? (
            <a href={EXPLORER} target="_blank" rel="noreferrer">
              <code>{CONTRACT_ADDRESS}</code>
            </a>
          ) : (
            <strong>not configured — deploy on Studio Next then set env</strong>
          )}
        </p>
        <div className="row">
          {address ? (
            <span className="pill">
              {address.slice(0, 6)}…{address.slice(-4)}
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
          <a className="btn btn-ghost" href={GITHUB} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        {(msg || walletError) && (
          <p className={msg.includes("OK") ? "ok" : "err"}>{msg || walletError}</p>
        )}
        {tx && (
          <p className="muted">
            tx <code>{tx}</code>
          </p>
        )}
        {busy && <p className="muted">Busy: {busy}…</p>}
      </header>

      <section className="card">
        <h2>On-chain state</h2>
        <p className="muted">owner {owner || "—"}</p>
        <pre>{stats || "—"}</pre>
        <pre>{balance || "connect for balance"}</pre>
        <ul>
          {rows.length === 0 && <li className="muted">No deals yet (or address unset)</li>}
          {rows.map((r) => (
            <li key={r.deal_id}>
              <strong>{r.deal_id}</strong> · {r.status} · {r.amount}
              {Array.isArray(r.listing_items) && r.listing_items.length
                ? ` · listing frozen (${r.listing_items.length})`
                : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Owner credit (any client)</h2>
        <label>
          user
          <input value={creditUser} onChange={(e) => setCreditUser(e.target.value)} />
        </label>
        <label>
          amount
          <input
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!!busy || !isOwner || !configured}
          onClick={() =>
            void run("credit", () =>
              credit(acct, provider, creditUser.trim(), creditAmount),
            )
          }
        >
          credit(user, amount)
        </button>
      </section>

      <section className="card">
        <h2>Client: create_deal + fund</h2>
        <label>
          deal_id
          <input value={dealId} onChange={(e) => setDealId(e.target.value)} />
        </label>
        <label>
          provider
          <input
            value={providerAddr}
            onChange={(e) => setProviderAddr(e.target.value)}
          />
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
            disabled={!!busy || !configured}
            onClick={() =>
              void run("create_deal", () =>
                createDeal(
                  acct,
                  provider,
                  dealId,
                  providerAddr,
                  terms,
                  listingJson,
                  amount,
                ),
              )
            }
          >
            create_deal
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!!busy || !configured}
            onClick={() => void run("fund", () => fund(acct, provider, dealId))}
          >
            fund
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Provider: submit_delivery</h2>
        <label>
          delivery URL
          <input
            value={deliveryUrl}
            onChange={(e) => setDeliveryUrl(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!!busy || !configured}
          onClick={() =>
            void run("submit_delivery", () =>
              submitDelivery(acct, provider, dealId, deliveryJson),
            )
          }
        >
          submit_delivery
        </button>
      </section>
    </div>
  );
}
