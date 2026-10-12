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
  adjudicateAppeal,
  appeal,
  settle,
  createDeal,
  dispute,
  fund,
  getCredit,
  getDeal,
  getEscrowBalance,
  getOwner,
  getStats,
  listDeals,
  reclaim,
  release,
  submitDelivery,
  withdrawCredit,
  type DealRow,
} from "@/lib/contracts";
import { fundWithTestGen, getNativeBalance } from "@/lib/genlayer";
import { useWallet } from "./WalletProvider";

type FrozenItem = { url?: string; content_hash?: string; preview?: string; status?: string };

/** Wei as GEN, trimmed: 1500000000000000000 -> "1.5". */
function fmtGen(wei: string | number | undefined) {
  let v: bigint;
  try {
    v = BigInt(wei || 0);
  } catch {
    return "0";
  }
  const whole = v / BigInt(10 ** 18);
  const frac = (v % BigInt(10 ** 18)).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac.slice(0, 6)}` : `${whole}`;
}

/** GEN typed by a person as wei, or "" when it is not a number. */
function toWei(text: string) {
  const m = /^(\d+)(?:\.(\d{1,18}))?$/.exec(text.trim());
  if (!m) return "";
  return (BigInt(m[1]) * BigInt(10 ** 18) + BigInt((m[2] || "").padEnd(18, "0") || "0")).toString();
}

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
  const [credit, setCredit] = useState("0");
  const [held, setHeld] = useState("0");
  const [gen, setGen] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [tx, setTx] = useState("");

  const [dealId, setDealId] = useState("my-deal-1");
  const [providerAddr, setProviderAddr] = useState<string>(DEFAULT_PROVIDER);
  const [terms, setTerms] = useState("Deliver a page that contains the word Hello and the delivered report");
  const [amount, setAmount] = useState("1");
  const [deliveryWindow, setDeliveryWindow] = useState("600");
  const [appealWindow, setAppealWindow] = useState("120");
  const [grounds, setGrounds] = useState("The frozen delivery does contain what the terms ask for");
  const [listingUrl, setListingUrl] = useState(DEMO_URL);
  const [deliveryUrl, setDeliveryUrl] = useState(DEMO_URL);
  const [claim, setClaim] = useState("Delivered page does not match the listing");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ids, o, s, h] = await Promise.all([
        listDeals(),
        getOwner(),
        getStats(),
        getEscrowBalance(),
      ]);
      setOwner(o);
      setHeld(h);
      setStats(JSON.stringify(s, null, 2));
      const loaded = await Promise.all(ids.map((id) => getDeal(id)));
      setRows((loaded.filter(Boolean) as DealRow[]).reverse());
      if (address) {
        const [cr, g] = await Promise.all([getCredit(address), getNativeBalance(address)]);
        setCredit(cr);
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
  const amountWei = toWei(amount);
  const selected = rows.find((r) => r.deal_id === dealId);
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
        <p className="muted">
          The contract holds <strong>{fmtGen(held)} GEN</strong> right now: every funded deal plus
          every credit. owner {owner || "—"} — the owner can pin the code snapshot and nothing
          else; it cannot release, dispute, reclaim or mint.
        </p>
        <pre>{stats || "—"}</pre>
        {address && credit !== "0" && (
          <p className="muted">
            The contract holds <strong>{fmtGen(credit)} GEN</strong> for you that it could not put
            into a deal (an overpaid or refused funding).{" "}
            <button
              type="button"
              className="btn btn-ghost"
              disabled={disabled}
              onClick={() => void run("withdraw_credit", () => withdrawCredit(acct, provider))}
            >
              take it back
            </button>
          </p>
        )}
        {address && (
          <p className="muted">
            your wallet <code>{gen || "—"}</code> GEN{" "}
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
              <strong>{r.status}</strong> · price {fmtGen(r.amount)} GEN · in escrow{" "}
              <strong>{fmtGen(r.escrow)} GEN</strong> · client {short(r.client)} · provider{" "}
              {short(r.provider)}
              {r.paid_to && ` · paid ${fmtGen(r.paid_amount)} GEN to ${short(r.paid_to)}`}
              {r.status === "funded" &&
                ` · delivery due ${new Date(r.delivery_due_at * 1000)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 16)} UTC`}
              {r.status.startsWith("settled") &&
                ` · verdict pay_provider=${String(r.pay_provider)}`}
              {(r.status === "ruled" || r.status === "appealed") &&
                ` · RULING pay_provider=${String(r.ruling_pay)}, not paid yet · appeal until ${new Date(
                  (r.appeal_until || 0) * 1000,
                )
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 16)} UTC`}
              {r.status === "appealed" && ` · appealed by ${short(r.appellant || "")}`}
              {r.appeal_result && ` · appeal ${r.appeal_result}`}
              <Frozen label="listing frozen" items={r.listing_items} />
              <Frozen label="delivery frozen" items={r.delivery_items} />
            </li>
          ))}
        </ul>
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
          price (GEN)
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label>
          delivery window (seconds from funding)
          <input value={deliveryWindow} onChange={(e) => setDeliveryWindow(e.target.value)} />
        </label>
        <label>
          appeal window, seconds a ruling waits before it can be paid (60 – 2592000)
          <input value={appealWindow} onChange={(e) => setAppealWindow(e.target.value)} />
        </label>
        <p className="muted">
          fund sends the price as real GEN with the transaction and the contract holds it. It
          leaves only to the provider (you release, or validators rule for them) or back to you
          (validators rule for you, or no delivery arrives before the window ends and you reclaim).
        </p>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled || amountWei === ""}
            onClick={() =>
              void run("create_deal", () =>
                createDeal(
                  acct,
                  provider,
                  dealId,
                  providerAddr,
                  terms,
                  listingJson,
                  amountWei,
                  deliveryWindow,
                  appealWindow,
                ),
              )
            }
          >
            create_deal (freeze listing)
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled || !selected || selected.status !== "open"}
            onClick={() =>
              void run("fund", () => fund(acct, provider, dealId, selected?.amount || "0"))
            }
          >
            fund {selected ? `· send ${fmtGen(selected.amount)} GEN` : ""}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled || !selected || selected.status !== "funded"}
            onClick={() => void run("reclaim", () => reclaim(acct, provider, dealId))}
          >
            reclaim (no delivery by the deadline)
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
            adjudicate (consensus on frozen evidence → a ruling, not a payment)
          </button>
        </div>
      </section>

      <section className="card">
        <h2>4 · A ruling waits: appeal, or settle after the window</h2>
        <p style={{ color: "var(--muted)" }}>
          One consensus round never moves the escrow. The side the ruling went against can appeal
          once while the window is open; a second, independent round then decides and pays. With
          no appeal, anyone can settle once the window has closed.
        </p>
        <label>
          appeal grounds (an argument for the second round, not evidence)
          <input value={grounds} onChange={(e) => setGrounds(e.target.value)} />
        </label>
        <div className="row">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled || !selected || selected.status !== "ruled"}
            onClick={() => void run("appeal", () => appeal(acct, provider, dealId, grounds))}
          >
            appeal (losing side only)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled || !selected || selected.status !== "appealed"}
            onClick={() =>
              void run("adjudicate_appeal", () => adjudicateAppeal(acct, provider, dealId))
            }
          >
            adjudicate_appeal (second round, final)
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={disabled || !selected || selected.status !== "ruled"}
            onClick={() => void run("settle", () => settle(acct, provider, dealId))}
          >
            settle (after the appeal window)
          </button>
        </div>
      </section>
    </div>
  );
}
