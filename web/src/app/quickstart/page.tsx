"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

const STEPS = [
  {
    title: "Open Studio (or use the live contract)",
    body: "Connect MetaMask to Studionet. Prefer the already-deployed address for the pitch — redeploy only if you need a fresh owner.",
    tip: "If MetaMask rejects a tx, check network = Studionet and that you have Studio gas. Provider must ≠ client when creating a deal.",
    shot: `Studio · Contracts
────────────────────────
Live: 0xe8D6d1D1…B02D
  or paste contracts/DealGuard.py
Constructor (new deploy): your 0x…
[ Open / Deploy ]`,
  },
  {
    title: "Pin integrity (owner only)",
    body: "Call pin_code_snapshot with fields from CODE_SNAPSHOT.json. Already FINALIZED on the live contract — re-pin only after intentional snapshot update.",
    tip: "Build a pack locally via Evidence explorer, then paste args into Studio.",
    shot: `pin_code_snapshot(
  "f7b12fc26209eb3259c43b64c62060209f517f66",
  "0d9c1a110981ef729b07e651dccd13a9c6aebabc…",
  "66bee33605a6e151c2ded2860b7624ac17c186…",
  "2026-09-04T10:27:47Z"
)
→ SUCCESS · FINALIZED`,
  },
  {
    title: "Credit + create deal",
    body: "Owner credits the client, then create_deal with a provider address that is not the client (placeholder 0x1111… is fine for listing freeze demo).",
    tip: "Listing URL fixture: https://test-server.genlayer.com/static/genvm/hello.html",
    shot: `credit(0x6f60…46e3, "1000")
create_deal(
  "demo-1",
  "0x1111111111111111111111111111111111111111",
  "Deliver hello page",
  '["https://test-server.genlayer.com/static/genvm/hello.html"]',
  "100"
)
→ listing hash c0535e4b…`,
  },
  {
    title: "Store evidence + verify reads",
    body: "store_evidence with condition_met JSON. For the jury pitch, call the four view methods below — no second wallet required.",
    tip: "Full fund → delivery → dispute path needs Account 2 as provider. Documented in DEPLOY.md.",
    shot: `store_evidence("demo-1", {…condition_met:true})
get_code_snapshot()
get_criteria_template()
get_deal("demo-1")
get_evidence("demo-1")
→ payload_hash 6c9c208f…`,
  },
];

export default function QuickstartPage() {
  return (
    <PageShell
      active="/quickstart/"
      title="Quickstart"
      lead="Zero → pitch-ready Studionet demo in ~15 minutes. Mock Studio panels below match the live deploy."
    >
      <div className="cta-row" style={{ marginBottom: "1.5rem" }}>
        <a
          className="btn btn-primary"
          href="https://studio.genlayer.com/contracts"
          target="_blank"
          rel="noreferrer"
        >
          Open GenLayer Studio
        </a>
        <a
          className="btn btn-ghost"
          href="https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D"
          target="_blank"
          rel="noreferrer"
        >
          Live contract
        </a>
        <a className="btn btn-ghost" href={withBase("/docs/STUDIO.md")}>
          STUDIO.md
        </a>
        <a className="btn btn-ghost" href={withBase("/evidence-explorer/")}>
          Integrity pack UI
        </a>
      </div>

      <div className="flow">
        {STEPS.map((s, i) => (
          <div key={s.title} style={{ display: "grid", gap: "0.75rem", marginBottom: "1.75rem" }}>
            <div className="flow-step">
              <div className="n">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <strong>{s.title}</strong>
                <p style={{ margin: "0.25rem 0 0", color: "var(--muted)" }}>{s.body}</p>
                <p className="tip-callout">{s.tip}</p>
              </div>
            </div>
            <div className="studio-shot">
              <div className="studio-shot-bar">
                <span />
                <span />
                <span />
                Studio · step {i + 1}
              </div>
              <div className="studio-shot-body">{s.shot}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="section">
        <h2 style={{ fontFamily: "Syne, sans-serif" }}>Pitch click path</h2>
        <p className="lead">Show these views live — no second wallet required.</p>
        <pre className="code">{`get_code_snapshot()
get_criteria_template()
get_deal("demo-1")
get_evidence("demo-1")
get_owner()`}</pre>
        <div className="cta-row" style={{ marginTop: "1rem" }}>
          <a className="btn btn-ghost" href={withBase("/how-it-works/")}>
            Architecture
          </a>
          <a className="btn btn-ghost" href={withBase("/features/")}>
            Method table
          </a>
        </div>
      </section>
    </PageShell>
  );
}
