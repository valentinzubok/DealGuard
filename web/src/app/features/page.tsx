"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

const GROUPS = [
  {
    title: "Commerce lifecycle",
    blurb: "Freeze listing → fund escrow → freeze delivery → release or LLM settle.",
    methods: ["create_deal", "fund", "submit_delivery", "release", "dispute", "adjudicate"],
  },
  {
    title: "Integrity & Agent Tank",
    blurb: "Pin the exact commit stewards audit; store condition_met evidence on a deal.",
    methods: ["pin_code_snapshot", "store_evidence", "get_code_snapshot", "get_evidence"],
  },
  {
    title: "Tamper proof",
    blurb: "Re-fetch URLs later and compare SHA-256 to the frozen snapshot.",
    methods: ["cross_check"],
  },
];

const ROWS = [
  {
    method: "create_deal",
    kind: "write",
    why: "Locks listing pages so adjudication cannot chase a swapped URL.",
    args: "deal_id, provider, terms, listing_urls_json, amount",
    out: "state: open + listing_items SHA-256",
    example: `create_deal("demo-1", "0x1111…", "Deliver hello", '["https://…/hello.html"]', "100")`,
  },
  {
    method: "fund",
    kind: "write",
    why: "Moves client bookkeeping units into escrow for this deal.",
    args: "deal_id",
    out: "status: funded; escrowed += amount",
    example: `fund("demo-1")`,
  },
  {
    method: "submit_delivery",
    kind: "write",
    why: "Provider freezes delivery URLs the same way as listing.",
    args: "deal_id, delivery_urls_json",
    out: "status: delivered + delivery_items",
    example: `submit_delivery("demo-1", '["https://…/hello.html"]')`,
  },
  {
    method: "release",
    kind: "write",
    why: "Happy path: client accepts and pays the provider.",
    args: "deal_id",
    out: "status: completed; pay provider",
    example: `release("demo-1")`,
  },
  {
    method: "dispute",
    kind: "write",
    why: "Opens a claim; natural-language claim is stored for adjudicators.",
    args: "deal_id, claim",
    out: "status: disputed",
    example: `dispute("demo-1", "Check delivery against terms")`,
  },
  {
    method: "adjudicate",
    kind: "write",
    why: "LLM judges frozen listing+delivery vs terms — never live-only pages.",
    args: "deal_id",
    out: "settled_pay | settled_refund",
    example: `adjudicate("demo-1")`,
  },
  {
    method: "cross_check",
    kind: "write",
    why: "Proves later drift / tamper on listing or delivery hashes.",
    args: "deal_id",
    out: "tampered_* flags; checks++",
    example: `cross_check("demo-1")`,
  },
  {
    method: "pin_code_snapshot",
    kind: "write · onlyOwner",
    why: "Agent Tank integrity: commit + contract file hash on-chain.",
    args: "commit, evidence_hash, contract_hash, timestamp",
    out: "get_code_snapshot JSON",
    example: `pin_code_snapshot(commit, eh, ch, ts)`,
  },
  {
    method: "store_evidence",
    kind: "write",
    why: "Attaches condition_met JSON + payload hash to a deal id.",
    args: "deal_id, evidence_json",
    out: "condition_met + payload_hash",
    example: `store_evidence("demo-1", '{"dealUrl":"https://…","condition_met":true,…}')`,
  },
  {
    method: "get_* views",
    kind: "view",
    why: "Read path for jury demos and dashboards.",
    args: "see API reference",
    out: "JSON / bool / address",
    example: `get_deal · get_evidence · get_criteria_template · get_code_snapshot`,
  },
];

export default function FeaturesPage() {
  return (
    <PageShell
      active="/features/"
      title="Features"
      lead="Every DealGuard capability: commerce lifecycle, integrity pin, and PromptRegistry-style evidence."
    >
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h3 style={{ fontFamily: "Syne, sans-serif", marginTop: 0 }}>{g.title}</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 0.5rem" }}>{g.blurb}</p>
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              {g.methods.map((m) => (
                <code key={m} style={{ marginRight: "0.4rem" }}>
                  {m}
                </code>
              ))}
            </p>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table className="api-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Kind</th>
              <th>Why</th>
              <th>Args → result</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.method}>
                <td>
                  <code>{r.method}</code>
                </td>
                <td>{r.kind}</td>
                <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{r.why}</td>
                <td style={{ fontSize: "0.8rem" }}>
                  {r.args}
                  <br />
                  <span style={{ color: "var(--teal)" }}>→ {r.out}</span>
                </td>
                <td>
                  <code style={{ fontSize: "0.75rem" }}>{r.example}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cta-row" style={{ marginTop: "1.25rem" }}>
        <a className="btn btn-primary" href={withBase("/api-reference/")}>
          Full API reference
        </a>
        <a className="btn btn-ghost" href={withBase("/quickstart/")}>
          Quickstart
        </a>
        <a className="btn btn-ghost" href={withBase("/how-it-works/")}>
          How it works
        </a>
      </div>
    </PageShell>
  );
}
