"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

const ROWS = [
  {
    method: "create_deal",
    kind: "write",
    args: "deal_id, provider, terms, listing_urls_json, amount",
    out: "state: open + listing_items SHA-256",
    example: `create_deal("demo-1", "0x1111…", "Deliver hello", '["https://…/hello.html"]', "100")`,
  },
  {
    method: "fund",
    kind: "write",
    args: "deal_id",
    out: "status: funded; escrowed += amount",
    example: `fund("demo-1")`,
  },
  {
    method: "submit_delivery",
    kind: "write",
    args: "deal_id, delivery_urls_json",
    out: "status: delivered + delivery_items",
    example: `submit_delivery("demo-1", '["https://…/hello.html"]')`,
  },
  {
    method: "release",
    kind: "write",
    args: "deal_id",
    out: "status: completed; pay provider",
    example: `release("demo-1")`,
  },
  {
    method: "dispute",
    kind: "write",
    args: "deal_id, claim",
    out: "status: disputed",
    example: `dispute("demo-1", "Check delivery against terms")`,
  },
  {
    method: "adjudicate",
    kind: "write",
    args: "deal_id",
    out: "settled_pay | settled_refund",
    example: `adjudicate("demo-1")`,
  },
  {
    method: "cross_check",
    kind: "write",
    args: "deal_id",
    out: "tampered_* flags; checks++",
    example: `cross_check("demo-1")`,
  },
  {
    method: "pin_code_snapshot",
    kind: "write · onlyOwner",
    args: "commit, evidence_hash, contract_hash, timestamp",
    out: "get_code_snapshot JSON",
    example: `pin_code_snapshot(commit, eh, ch, ts)`,
  },
  {
    method: "store_evidence",
    kind: "write",
    args: "deal_id, evidence_json",
    out: "condition_met + payload_hash",
    example: `store_evidence("demo-1", '{"dealUrl":"https://…","condition_met":true,…}')`,
  },
  {
    method: "get_* views",
    kind: "view",
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
      <div className="table-wrap">
        <table className="api-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Kind</th>
              <th>Args</th>
              <th>Result</th>
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
                <td>{r.args}</td>
                <td>{r.out}</td>
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
        <a className="btn btn-ghost" href={withBase("/how-it-works/")}>
          How it works
        </a>
      </div>
    </PageShell>
  );
}
