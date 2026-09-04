"use client";

import { useMemo, useState } from "react";

const DOCS = [
  {
    id: "integrity",
    title: "Integrity pack",
    body: "CODE_SNAPSHOT.json + schemas + CI. Build with python3 scripts/generate_integrity_pack.py or the button on the home page.",
  },
  {
    id: "snapshot",
    title: "Code snapshot",
    body: "evidence_hash = sha256(git HEAD). contract_hash = sha256(DealGuard.py). Pin on-chain with pin_code_snapshot (onlyOwner).",
  },
  {
    id: "evidence",
    title: "condition_met schema",
    body: "Required: dealUrl, signature, amount, condition_met. See schemas/condition_met.schema.json and templates/deal_evidence.json.",
  },
  {
    id: "demo",
    title: "Studio demo flow",
    body: "credit → create_deal → fund → submit_delivery → release|dispute → adjudicate → cross_check. Full steps in examples/demo_flow.md.",
  },
  {
    id: "ci",
    title: "CI gates",
    body: "GitHub Actions runs snapshot verify, validate_schemas.py (CODE_SNAPSHOT + condition_met), pytest lifecycle tests, web build.",
  },
  {
    id: "security",
    title: "Security",
    body: "onlyOwner for pin/credit/ownership. Parties-only store_evidence. https URLs. MIT license in LICENSE.md.",
  },
];

export default function DocsPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return DOCS;
    return DOCS.filter(
      (d) =>
        d.title.toLowerCase().includes(needle) ||
        d.body.toLowerCase().includes(needle) ||
        d.id.includes(needle),
    );
  }, [q]);

  return (
    <main className="wrap" style={{ padding: "2rem 0 4rem" }}>
      <p>
        <a href="/">← DealGuard</a>
      </p>
      <h1 style={{ fontFamily: "Syne, sans-serif" }}>Docs</h1>
      <p style={{ color: "var(--muted)" }}>
        Quick search across Agent Tank topics. Full guide:{" "}
        <a href="/docs/AGENT_TANK.md" style={{ color: "var(--teal)" }}>
          AGENT_TANK.md
        </a>
        .
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search: snapshot, schema, dispute, CI…"
        style={{
          width: "100%",
          marginTop: "1rem",
          padding: "0.85rem 1rem",
          borderRadius: 14,
          border: "1px solid var(--line)",
          background: "#050b10",
          color: "var(--ink)",
        }}
      />

      <div className="grid-3" style={{ marginTop: "1.25rem" }}>
        {filtered.map((d) => (
          <article className="card" key={d.id} id={d.id}>
            <h3 style={{ fontFamily: "Syne, sans-serif", marginTop: 0 }}>{d.title}</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>{d.body}</p>
          </article>
        ))}
      </div>

      <h2 style={{ fontFamily: "Syne, sans-serif", marginTop: "2.5rem" }}>demo_flow.md</h2>
      <p style={{ color: "var(--muted)" }}>
        <a href="/docs/demo_flow.md" style={{ color: "var(--teal)" }}>
          Open examples/demo_flow.md
        </a>
      </p>
      <pre className="code">{`credit(you, "1000")
create_deal("demo-1", provider, "Must contain Hello",
  '["https://test-server.genlayer.com/static/genvm/hello.html"]', "100")
fund("demo-1")
submit_delivery("demo-1", '["https://test-server.genlayer.com/static/genvm/hello.html"]')
dispute("demo-1", "Check delivery against terms")
adjudicate("demo-1")
cross_check("demo-1")`}</pre>
    </main>
  );
}
