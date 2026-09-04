"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

const STEPS = [
  { actor: "Client", action: "create_deal(terms, listing_urls)", note: "Freeze listing" },
  { actor: "Validators", action: "get_webpage + SHA-256", note: "strict_eq consensus" },
  { actor: "Client", action: "fund(deal_id)", note: "Lock escrow units" },
  { actor: "Provider", action: "submit_delivery(urls)", note: "Freeze delivery" },
  { actor: "Client", action: "dispute / release", note: "Claim or happy path" },
  { actor: "Validators", action: "adjudicate → pay_provider", note: "LLM on frozen evidence" },
  { actor: "Anyone", action: "cross_check", note: "Prove URL drift" },
];

export default function HowItWorksPage() {
  return (
    <PageShell
      active="/how-it-works/"
      title="How it works"
      lead="Architecture for agentic commerce: freeze web evidence first, settle with GenLayer consensus — never against a rotting live URL."
    >
      <section className="section" style={{ paddingTop: 0 }}>
        <h2 style={{ fontFamily: "Syne, sans-serif" }}>Sequence</h2>
        <div className="seq">
          {STEPS.map((s, i) => (
            <div className="seq-row" key={s.action}>
              <div className="seq-n">{String(i + 1).padStart(2, "0")}</div>
              <div className="seq-actor">{s.actor}</div>
              <div className="seq-body">
                <code>{s.action}</code>
                <span>{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 style={{ fontFamily: "Syne, sans-serif" }}>Layers</h2>
        <div className="grid-3">
          <article className="card">
            <h3>Intelligent Contract</h3>
            <p>
              <code>DealGuard.py</code> on Studionet — escrow, freezes, LLM adjudication,
              reputation, code snapshot pin.
            </p>
          </article>
          <article className="card">
            <h3>Integrity pack</h3>
            <p>
              <code>CODE_SNAPSHOT.json</code> + JSON Schemas + CI. On-chain pin must match
              repo hashes.
            </p>
          </article>
          <article className="card">
            <h3>Product surface</h3>
            <p>Quickstart, evidence explorer, API reference — Studio for writes.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2 style={{ fontFamily: "Syne, sans-serif" }}>Live Studionet</h2>
        <p className="lead">
          Contract{" "}
          <a
            href="https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D"
            style={{ color: "var(--teal)" }}
            target="_blank"
            rel="noreferrer"
          >
            0xe8D6d1D1…B02D
          </a>
          . Deal <code>demo-1</code> has frozen listing + <code>condition_met</code> evidence.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href={withBase("/quickstart/")}>
            Quickstart
          </a>
          <a className="btn btn-ghost" href={withBase("/evidence-explorer/")}>
            Evidence explorer
          </a>
        </div>
      </section>
    </PageShell>
  );
}
