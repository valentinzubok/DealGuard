"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

type Snap = {
  commit: string;
  evidence_hash: string;
  contract_hash: string;
  timestamp: string;
  note?: string;
};

const LOG = [
  {
    version: "0.1.0 · Studionet",
    date: "2026-09-04",
    items: [
      "Deployed DealGuard.py to Studionet 0xe8D6d1D1…B02D",
      "pin_code_snapshot FINALIZED (commit f7b12fc…)",
      "demo-1 create_deal + store_evidence (condition_met true)",
      "Site: how-it-works, quickstart, evidence-explorer, features, use-cases, API, security",
    ],
  },
  {
    version: "0.1.0-rc · Agent Tank pack",
    date: "2026-09-04",
    items: [
      "CODE_SNAPSHOT + condition_met schemas + CI",
      "CLI + /evidence UI",
      "GitHub Pages static export",
    ],
  },
];

export default function ChangelogPage() {
  const [snap, setSnap] = useState<Snap | null>(null);
  useEffect(() => {
    fetch(withBase("/CODE_SNAPSHOT.json"))
      .then((r) => r.json())
      .then(setSnap)
      .catch(() => undefined);
  }, []);

  return (
    <PageShell
      active="/changelog/"
      title="Changelog"
      lead="Release notes tied to CODE_SNAPSHOT.json — the same pin stewards verify on-chain."
    >
      {snap && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Current CODE_SNAPSHOT</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }}>
            commit {snap.commit}
            <br />
            evidence_hash {snap.evidence_hash}
            <br />
            contract_hash {snap.contract_hash}
            <br />
            timestamp {snap.timestamp}
          </p>
        </div>
      )}

      <div className="flow">
        {LOG.map((e) => (
          <div className="flow-step" key={e.version}>
            <div className="n">·</div>
            <div>
              <strong>
                {e.version}{" "}
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>{e.date}</span>
              </strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem", color: "var(--muted)" }}>
                {e.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
