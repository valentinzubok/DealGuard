"use client";

import { useState } from "react";
import { withBase } from "@/lib/basePath";

export default function HomePage() {
  const [packStatus, setPackStatus] = useState("");

  async function downloadIntegrityPack() {
    setPackStatus("Building…");
    try {
      const res = await fetch(withBase("/integrity-pack.json"));
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
          <img src={withBase("/logo.png")} alt="DealGuard" />
          DealGuard
        </div>
        <nav className="nav-links">
          <a href={withBase("/how-it-works/")}>How it works</a>
          <a href={withBase("/quickstart/")}>Quickstart</a>
          <a href={withBase("/evidence-explorer/")}>Explorer</a>
          <a href={withBase("/features/")}>Features</a>
          <a href={withBase("/use-cases/")}>Use cases</a>
          <a href={withBase("/docs/")}>Docs</a>
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
                Open GenLayer Studio
              </a>
              <a className="btn btn-ghost" href={withBase("/evidence-explorer/")}>
                Evidence explorer
              </a>
              <a className="btn btn-ghost" href={withBase("/quickstart/")}>
                Quickstart
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <img src={withBase("/cover.png")} alt="DealGuard product cover" />
          </div>
        </section>

        <section className="wrap section" id="why">
          <h2>Why DealGuard</h2>
          <p className="lead">
            Agents already trade from the open web. Escrow that points at live URLs
            loses when the seller rewrites the page. DealGuard freezes evidence at
            deal open and delivery, then settles with GenLayer consensus.
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

        <section className="wrap section" id="product">
          <h2>Product pages</h2>
          <p className="lead">Built for Agent Tank jurors — architecture, guided Studio path, interactive integrity pack.</p>
          <div className="grid-3">
            <a className="card" href={withBase("/how-it-works/")}>
              <h3>How it works</h3>
              <p>Sequence diagram of freeze → escrow → adjudicate → cross_check.</p>
            </a>
            <a className="card" href={withBase("/quickstart/")}>
              <h3>Quickstart</h3>
              <p>Studio steps with mock screenshots and live contract links.</p>
            </a>
            <a className="card" href={withBase("/evidence-explorer/")}>
              <h3>Evidence explorer</h3>
              <p>Interactive integrity pack builder from CODE_SNAPSHOT.</p>
            </a>
            <a className="card" href={withBase("/features/")}>
              <h3>Features</h3>
              <p>create_deal, fund, dispute, pin, store_evidence — with examples.</p>
            </a>
            <a className="card" href={withBase("/use-cases/")}>
              <h3>Use cases</h3>
              <p>Freelance, marketplace, SaaS SLA scenarios.</p>
            </a>
            <a className="card" href={withBase("/api-reference/")}>
              <h3>API · Security · Changelog</h3>
              <p>
                <span style={{ color: "var(--teal)" }}>/api-reference</span> ·{" "}
                <span style={{ color: "var(--teal)" }}>/security</span> ·{" "}
                <span style={{ color: "var(--teal)" }}>/changelog</span>
              </p>
            </a>
          </div>
          <div className="cta-row" style={{ marginTop: "1rem" }}>
            <button className="btn btn-ghost" type="button" onClick={downloadIntegrityPack}>
              Download integrity pack
            </button>
            {packStatus && <span style={{ color: "var(--teal)" }}>{packStatus}</span>}
          </div>
        </section>

        <section className="wrap section" id="studio">
          <h2>What to do in GenLayer Studio</h2>
          <p className="lead">
            Full RU guide:{" "}
            <a href={withBase("/docs/STUDIO.md")} style={{ color: "var(--teal)" }}>
              docs/STUDIO.md
            </a>
          </p>
          <div className="flow">
            {[
              ["1", "Deploy", "Paste DealGuard.py · constructor = your 0x"],
              ["2", "Pin", "pin_code_snapshot from CODE_SNAPSHOT.json"],
              ["3", "Credit", "credit(client, \"1000\") as owner"],
              ["4", "Deal", "create_deal → fund → submit_delivery"],
              ["5", "Settle", "release or dispute → adjudicate → cross_check"],
              ["6", "Evidence", "store_evidence with condition_met JSON"],
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
          <div className="cta-row" style={{ marginTop: "1.25rem" }}>
            <a
              className="btn btn-primary"
              href="https://studio.genlayer.com/contracts"
              target="_blank"
              rel="noreferrer"
            >
              studio.genlayer.com
            </a>
            <a className="btn btn-ghost" href={withBase("/demo/")}>
              Template demo
            </a>
            <a className="btn btn-ghost" href={withBase("/docs/")}>
              Docs
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
