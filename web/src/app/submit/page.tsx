"use client";

import { useState } from "react";
import { PageShell } from "@/components/SiteChrome";

const FIELDS = [
  {
    label: "Track",
    value: "Agentic Commerce Infrastructure",
  },
  {
    label: "Project name",
    value: "DealGuard",
  },
  {
    label: "GitHub",
    value: "https://github.com/valentinzubok/DealGuard",
  },
  {
    label: "Website",
    value: "https://valentinzubok.github.io/DealGuard/",
  },
  {
    label: "Contract",
    value:
      "https://explorer-studio.genlayer.com/address/0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D",
  },
  {
    label: "One-liner",
    value:
      "Agentic commerce escrow on GenLayer: freeze listing + delivery URLs, LLM-adjudicate frozen evidence, pin code snapshot + condition_met proofs.",
  },
  {
    label: "Description",
    value: `DealGuard is shared infrastructure for agent-to-agent commerce. Agents dispute from the open web, but pages change before adjudication (URL rot).

create_deal freezes listing URLs under SHA-256 consensus. fund locks escrow. submit_delivery freezes delivery. release or dispute+adjudicate settles via GenLayer LLMs on FROZEN snapshots only. cross_check proves drift. pin_code_snapshot (onlyOwner) stores sha256(git HEAD)+contract hash for validators. store_evidence attaches PromptRegistry-style payloads: dealUrl, signature, amount, condition_met.

Live on Studionet: 0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D — pin_code_snapshot, create_deal(demo-1), store_evidence verified. Site + CI integrity pack included. Not another wrapper agent — commerce settlement infrastructure.`,
  },
];

export default function SubmitPage() {
  const [copied, setCopied] = useState("");

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied(`Failed: ${label}`);
    }
  }

  return (
    <PageShell
      active="/submit/"
      title="Portal paste kit"
      lead="Copy fields into the Agent Tank submission form. Full checklist lives in SUBMIT.md on GitHub."
    >
      {copied && <p className="status-line ok">Copied: {copied}</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {FIELDS.map((f) => (
          <div key={f.label} className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <strong>{f.label}</strong>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                onClick={() => copy(f.label, f.value)}
              >
                Copy
              </button>
            </div>
            <pre className="code" style={{ margin: 0, maxHeight: 220, overflow: "auto" }}>
              {f.value}
            </pre>
          </div>
        ))}
      </div>

      <p className="tip-callout" style={{ marginTop: "1.25rem" }}>
        Logo: assets/logo.jpg · Evidence links: GitHub, Website, Contract explorer, deploy + pin +
        create_deal + store_evidence txs (see SUBMIT.md).
      </p>
    </PageShell>
  );
}
