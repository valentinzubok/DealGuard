"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

const METHODS = [
  {
    name: "create_deal",
    type: "write",
    in: "deal_id: str, provider: 0x, terms: str, listing_urls_json: str, amount: str",
    out: "null · stores deal with listing_items[{url,content_hash,preview,status}]",
  },
  {
    name: "fund",
    type: "write",
    in: "deal_id: str",
    out: "null · moves amount available→escrowed",
  },
  {
    name: "submit_delivery",
    type: "write",
    in: "deal_id: str, delivery_urls_json: str",
    out: "null · stores delivery_items freeze",
  },
  {
    name: "release / dispute / adjudicate / cross_check",
    type: "write",
    in: "deal_id (+ claim for dispute)",
    out: "settlement status / tamper flags",
  },
  {
    name: "pin_code_snapshot",
    type: "write · onlyOwner",
    in: "commit, evidence_hash, contract_hash, timestamp",
    out: "null · readable via get_code_snapshot",
  },
  {
    name: "store_evidence",
    type: "write",
    in: 'deal_id, evidence_json: {dealUrl, signature, amount, condition_met, metadata?}',
    out: "null · get_evidence → payload_hash",
  },
  {
    name: "get_deal / get_evidence / get_code_snapshot / get_criteria_template",
    type: "view",
    in: "deal_id where needed",
    out: "JSON string",
  },
  {
    name: "get_balance / get_reputation / get_stats / list_deals / get_owner",
    type: "view",
    in: "user for balance/reputation",
    out: "JSON / address / array",
  },
];

export default function ApiReferencePage() {
  return (
    <PageShell
      active="/api-reference/"
      title="API reference"
      lead="Intelligent Contract surface for DealGuard.py — Studio / genlayer-js compatible."
    >
      <p className="lead">
        Live:{" "}
        <a
          href="https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D"
          style={{ color: "var(--teal)" }}
          target="_blank"
          rel="noreferrer"
        >
          0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D
        </a>{" "}
        · Method map also in{" "}
        <a
          href="https://github.com/valentinzubok/DealGuard/blob/main/contracts/README.md"
          style={{ color: "var(--teal)" }}
          target="_blank"
          rel="noreferrer"
        >
          contracts/README.md
        </a>
        .
      </p>
      <div className="table-wrap">
        <table className="api-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Type</th>
              <th>Input</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map((m) => (
              <tr key={m.name}>
                <td>
                  <code>{m.name}</code>
                </td>
                <td>{m.type}</td>
                <td>{m.in}</td>
                <td>{m.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cta-row" style={{ marginTop: "1.25rem" }}>
        <a className="btn btn-ghost" href={withBase("/features/")}>
          Features + examples
        </a>
        <a className="btn btn-ghost" href={withBase("/openapi.json")}>
          OpenAPI JSON
        </a>
        <a className="btn btn-ghost" href={withBase("/quickstart/")}>
          Quickstart
        </a>
      </div>
    </PageShell>
  );
}
