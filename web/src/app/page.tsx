"use client";

import { useState } from "react";

export default function HomePage() {
  const [packStatus, setPackStatus] = useState("");

  async function downloadIntegrityPack() {
    setPackStatus("Building…");
    try {
      const res = await fetch("/api/integrity-pack");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dealguard-integrity-pack.json";
      a.click();
      URL.revokeObjectURL(url);
      setPackStatus(`Pack ready · commit ${data.pin_code_snapshot_args?.commit?.slice(0, 8)}…`);
    } catch (e) {
      setPackStatus(`Failed: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return (
    <>
      <header className="wrap nav">
        <div className="brand">
          <img src="/logo.png" alt="DealGuard" />
          DealGuard
        </div>
        <nav className="nav-links">
          <a href="#why">Why</a>
          <a href="/demo">Demo</a>
          <a href="/reputation">Reputation</a>
          <a href="/docs">Docs</a>
          <a href="/evidence">Evidence</a>
          <a
            className="btn btn-ghost"
            href="https://github.com/valentinzubok/DealGuard"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main>
        <section className="wrap hero">
          <div className="hero-copy">
            <h1>
              Freeze the deal.
              <br />
              <span>Settle the truth.</span>
            </h1>
            <p>
              Agentic commerce escrow on GenLayer. Snapshot listing and delivery
              URLs at the moment that matters, then let validators adjudicate
              frozen evidence — not a page that rewrote itself overnight.
            </p>
            <div className="cta-row">
              <a
                className="btn btn-primary"
                href="https://studio.genlayer.com/contracts"
                target="_blank"
                rel="noreferrer"
              >
                One-click Studio deploy
              </a>
              <button className="btn btn-ghost" type="button" onClick={downloadIntegrityPack}>
                Generate integrity pack
              </button>
            </div>
            {packStatus && (
              <p style={{ color: "var(--teal)", marginTop: "0.75rem" }}>{packStatus}</p>
            )}
          </div>
          <div className="hero-visual">
            <img src="/cover.png" alt="DealGuard product cover" />
          </div>
        </section>

        <section className="wrap section" id="why">
          <h2>Why DealGuard</h2>
          <p className="lead">
            Agents already trade from the open web. Escrow that points at live URLs
            loses when the seller rewrites the page. DealGuard freezes evidence at
            deal open and delivery, then settles with GenLayer consensus — the
            missing commerce primitive next to registries and permission receipts.
          </p>
          <div className="grid-3">
            <article className="card">
              <h3>URL rot kills disputes</h3>
              <p>Listings change between purchase and adjudication. Freeze first.</p>
            </article>
            <article className="card">
              <h3>LLM on frozen facts</h3>
              <p>Validators judge snapshots + terms, not a moving target.</p>
            </article>
            <article className="card">
              <h3>Integrity pack</h3>
              <p>CODE_SNAPSHOT + schemas + CI artifact for Agent Tank stewards.</p>
            </article>
          </div>
        </section>

        <section className="wrap section" id="features">
          <h2>Built for agent-to-agent commerce</h2>
          <p className="lead">
            Settlement that survives URL rot. Infrastructure other marketplaces compose.
          </p>
          <div className="grid-3">
            <article className="card">
              <h3>Evidence freeze</h3>
              <p>SHA-256 digests under strict equivalence at deal open and delivery.</p>
            </article>
            <article className="card">
              <h3>LLM adjudication</h3>
              <p>Consensus on pay_provider from frozen listing + delivery only.</p>
            </article>
            <article className="card">
              <h3>Drift proof</h3>
              <p>cross_check flags tampered listing or delivery before narratives rewrite history.</p>
            </article>
          </div>
        </section>

        <section className="wrap section" id="flow">
          <h2>Lifecycle</h2>
          <p className="lead">One deal. Six state transitions. Zero rotting links.</p>
          <div className="flow">
            {[
              ["01", "create_deal", "Client freezes listing URLs + terms."],
              ["02", "fund", "Client locks bookkeeping units into escrow."],
              ["03", "submit_delivery", "Provider freezes delivery evidence."],
              ["04", "release or dispute", "Happy path payout — or open a claim."],
              ["05", "adjudicate", "Validators LLM-judge frozen snapshots only."],
              ["06", "cross_check", "Prove drift. Update reputation scores."],
            ].map(([n, title, body]) => (
              <div className="flow-step" key={n}>
                <div className="n">{n}</div>
                <div>
                  <strong>{title}</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--muted)" }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section" id="studio">
          <h2>GenLayer Studio</h2>
          <p className="lead">
            Paste <code>contracts/DealGuard.py</code>, deploy with your wallet as owner,
            pin <code>CODE_SNAPSHOT</code>, then run the demo flow.
          </p>
          <div className="code">{`# See examples/demo_flow.md
credit → create_deal → fund → submit_delivery → dispute → adjudicate`}</div>
          <div className="cta-row" style={{ marginTop: "1.25rem" }}>
            <a
              className="btn btn-primary"
              href="https://studio.genlayer.com/contracts"
              target="_blank"
              rel="noreferrer"
            >
              Open Studio
            </a>
            <a className="btn btn-ghost" href="/docs">
              Docs search
            </a>
            <a className="btn btn-ghost" href="/demo">
              Template demo
            </a>
          </div>
        </section>
      </main>

      <footer className="wrap footer">
        <div>DealGuard · Agent Tank · Agentic Commerce Infrastructure</div>
        <div>
          <a href="https://github.com/valentinzubok/DealGuard/blob/main/LICENSE.md">
            MIT License
          </a>{" "}
          · © 2026 Valentyn Zubok
        </div>
      </footer>
    </>
  );
}
