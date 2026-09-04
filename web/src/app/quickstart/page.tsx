"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

const STEPS = [
  {
    title: "Open Studio",
    body: "Go to studio.genlayer.com/contracts and connect MetaMask (Studionet).",
    shot: `Studio · New contract
────────────────────────
Paste contracts/DealGuard.py
Constructor: 0x6f6077eC…046e3
[ Deploy ]`,
  },
  {
    title: "Pin integrity",
    body: "Call pin_code_snapshot with CODE_SNAPSHOT.json fields (or scripts/cli.py studio-calls).",
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
    body: "Owner credits client. Client create_deal with provider ≠ client (e.g. 0x1111…).",
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
    body: "store_evidence with condition_met JSON. Demo reads for the pitch.",
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
      lead="Get from zero to a pitch-ready Studionet demo in ~15 minutes. Full RU guide in docs/STUDIO.md."
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
      </div>

      <div className="flow">
        {STEPS.map((s, i) => (
          <div key={s.title} style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div className="flow-step">
              <div className="n">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <strong>{s.title}</strong>
                <p style={{ margin: "0.25rem 0 0", color: "var(--muted)" }}>{s.body}</p>
              </div>
            </div>
            <div className="studio-shot">
              <div className="studio-shot-bar">
                <span />
                <span />
                <span />
                Studio mock
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
          <a className="btn btn-ghost" href={withBase("/evidence-explorer/")}>
            Build integrity pack
          </a>
        </div>
      </section>
    </PageShell>
  );
}
