"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

type Template = {
  example: {
    dealUrl: string;
    signature: string;
    amount: string;
    condition_met: boolean;
    metadata?: Record<string, string>;
  };
};

const LIVE = {
  contract: "0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D",
  deal_id: "demo-1",
  listing_hash: "c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb7df31ad9e51a",
  payload_hash: "6c9c208f88439fb1f76519c9b6bbce22092be0be192495398d5073e92f565512",
  dealUrl: "https://test-server.genlayer.com/static/genvm/hello.html",
};

const FAV_KEY = "dealguard.demo.favorites";

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function DemoPage() {
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    dealUrl: LIVE.dealUrl,
    signature: `0x${"ab".repeat(32)}`,
    amount: "100",
    condition_met: true,
    deal_id: LIVE.deal_id,
  });
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavorites(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }

    fetch(withBase("/deal_evidence.json"))
      .then(async (r) => {
        if (!r.ok) throw new Error(`Template HTTP ${r.status}`);
        return r.json() as Promise<Template>;
      })
      .then((j) => {
        setForm({
          dealUrl: j.example.dealUrl,
          signature: j.example.signature,
          amount: j.example.amount,
          condition_met: j.example.condition_met,
          deal_id: j.example.metadata?.deal_id || LIVE.deal_id,
        });
        setLoading(false);
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load template");
        setLoading(false);
      });
  }, []);

  const payload = useMemo(
    () => ({
      dealUrl: form.dealUrl,
      signature: form.signature,
      amount: form.amount,
      condition_met: form.condition_met,
      metadata: { deal_id: form.deal_id, note: "demo visualizer" },
    }),
    [form],
  );

  function loadLiveFixture() {
    setForm({
      dealUrl: LIVE.dealUrl,
      signature: `0x${"ab".repeat(32)}`,
      amount: "100",
      condition_met: true,
      deal_id: LIVE.deal_id,
    });
    setHash(LIVE.payload_hash);
    setStatus("Loaded Studionet demo-1 fixture (read-only pitch values).");
  }

  async function compute() {
    setBusy(true);
    setStatus("");
    try {
      const core = {
        amount: Number(form.amount),
        condition_met: form.condition_met,
        dealUrl: form.dealUrl,
        signature: form.signature,
      };
      const compact = JSON.stringify(core, ["amount", "condition_met", "dealUrl", "signature"]);
      const h = await sha256Hex(compact);
      setHash(h);
      setStatus("Local payload_hash ready — paste JSON into Studio store_evidence.");
    } catch (e) {
      setStatus(`Hash failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(false);
    }
  }

  function saveFavorite() {
    const label = `${form.deal_id} · ${form.dealUrl.slice(0, 48)}`;
    const next = [label, ...favorites.filter((x) => x !== label)].slice(0, 8);
    setFavorites(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    setStatus("Saved to local favorites.");
  }

  return (
    <PageShell
      active="/demo/"
      title="Demo visualizer"
      lead="Fill condition_met shape, compute payload_hash locally, then store_evidence in Studio. Demo mode uses the live Studionet fixture."
    >
      <div className="cta-row" style={{ marginBottom: "1rem" }}>
        <button className="btn btn-primary" type="button" onClick={loadLiveFixture}>
          Demo mode · demo-1
        </button>
        <a
          className="btn btn-ghost"
          href={`https://explorer-studio.genlayer.com/address/${LIVE.contract}`}
          target="_blank"
          rel="noreferrer"
        >
          Live contract
        </a>
        <a className="btn btn-ghost" href={withBase("/evidence/")}>
          Evidence desk
        </a>
      </div>

      {loading && <p className="status-line">Loading template…</p>}
      {loadError && <p className="status-line error">Error: {loadError}</p>}

      <div className="grid-3" style={{ marginTop: "1.25rem" }}>
        {(
          [
            ["dealUrl", form.dealUrl],
            ["signature", form.signature],
            ["amount", form.amount],
          ] as const
        ).map(([key, val]) => (
          <label className="card" key={key}>
            {key}
            <input
              style={inputStyle}
              value={val}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>

      <label className="card" style={{ display: "block", marginTop: "1rem" }}>
        condition_met
        <select
          style={inputStyle}
          value={String(form.condition_met)}
          onChange={(e) => setForm({ ...form, condition_met: e.target.value === "true" })}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>

      <div className="cta-row" style={{ marginTop: "1rem" }}>
        <button className="btn btn-primary" type="button" onClick={compute} disabled={busy}>
          {busy ? "Computing…" : "Compute hash snapshot"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={saveFavorite}>
          Save favorite
        </button>
      </div>

      {status && <p className="status-line ok">{status}</p>}
      {hash && (
        <p style={{ color: "var(--teal)", marginTop: "0.75rem" }}>
          payload_hash: <code>{hash}</code>
          {hash === LIVE.payload_hash ? " · matches on-chain demo-1" : ""}
        </p>
      )}

      {favorites.length > 0 && (
        <>
          <h2 style={{ fontFamily: "Syne, sans-serif", marginTop: "1.5rem" }}>Favorites</h2>
          <ul style={{ color: "var(--muted)", paddingLeft: "1.1rem" }}>
            {favorites.map((f) => (
              <li key={f}>
                <code>{f}</code>
              </li>
            ))}
          </ul>
        </>
      )}

      <pre className="code" style={{ marginTop: "1.25rem" }}>
        {JSON.stringify(payload, null, 2)}
      </pre>

      <p className="tip-callout" style={{ marginTop: "1rem" }}>
        On-chain listing hash for demo-1: <code>{LIVE.listing_hash}</code>. Pitch views: get_deal /
        get_evidence — no MetaMask signature required for reads.
      </p>
    </PageShell>
  );
}

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.5rem",
  padding: "0.65rem 0.75rem",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "#050b10",
  color: "var(--ink)",
};
