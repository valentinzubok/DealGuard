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

type Row = { area: string; change: string };

type Entry = {
  version: string;
  date: string;
  rows: Row[];
};

const LOG: Entry[] = [
  {
    version: "0.2.1 · Operator UX",
    date: "2026-09-04",
    rows: [
      { area: "Site", change: "Fix /demo/ basePath; loading/error status lines" },
      { area: "Site", change: "Demo mode fixture + favorites; /submit/ paste kit" },
      { area: "API", change: "Public openapi.json for Studio method map" },
    ],
  },
  {
    version: "0.2.0 · Product site",
    date: "2026-09-04",
    rows: [
      { area: "Site", change: "/how-it-works/ sequence + /quickstart/ Studio mocks" },
      { area: "Site", change: "/evidence-explorer/ interactive integrity pack" },
      { area: "Site", change: "/features/, /use-cases/, /api-reference/, /security/" },
      { area: "Docs", change: "README Getting Started, CONTRIBUTING, issue/PR templates" },
      { area: "CI", change: "web typecheck (tsc --noEmit) in GitHub Actions" },
    ],
  },
  {
    version: "0.1.0 · Studionet",
    date: "2026-09-04",
    rows: [
      { area: "Contract", change: "Deploy DealGuard.py → 0xe8D6d1D1…B02D" },
      { area: "Integrity", change: "pin_code_snapshot FINALIZED (commit f7b12fc…)" },
      { area: "Demo", change: "demo-1 create_deal + store_evidence (condition_met true)" },
      { area: "Site", change: "GitHub Pages export + STUDIO.md operator guide" },
    ],
  },
  {
    version: "0.1.0-rc · Agent Tank pack",
    date: "2026-09-04",
    rows: [
      { area: "Pack", change: "CODE_SNAPSHOT + condition_met schemas + integrity pack" },
      { area: "CI", change: "snapshot verify, schemas, pytest, web build" },
      { area: "Tools", change: "CLI + /evidence UI" },
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
          <h3 style={{ marginTop: 0 }}>Current CODE_SNAPSHOT (on-chain pin)</h3>
          <div className="table-wrap">
            <table className="api-table">
              <tbody>
                <tr>
                  <th>commit</th>
                  <td>
                    <code>{snap.commit}</code>
                  </td>
                </tr>
                <tr>
                  <th>evidence_hash</th>
                  <td>
                    <code>{snap.evidence_hash}</code>
                  </td>
                </tr>
                <tr>
                  <th>contract_hash</th>
                  <td>
                    <code>{snap.contract_hash}</code>
                  </td>
                </tr>
                <tr>
                  <th>timestamp</th>
                  <td>
                    <code>{snap.timestamp}</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ margin: "0.75rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
            Full history also in{" "}
            <a href="https://github.com/valentinzubok/DealGuard/blob/main/CHANGELOG.md" style={{ color: "var(--teal)" }}>
              CHANGELOG.md
            </a>
            .
          </p>
        </div>
      )}

      <div className="flow">
        {LOG.map((e) => (
          <div className="flow-step" key={e.version} style={{ alignItems: "flex-start" }}>
            <div className="n">·</div>
            <div style={{ width: "100%" }}>
              <strong>
                {e.version}{" "}
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>{e.date}</span>
              </strong>
              <div className="table-wrap" style={{ marginTop: "0.75rem" }}>
                <table className="api-table">
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>What changed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.rows.map((r) => (
                      <tr key={r.area + r.change}>
                        <td>{r.area}</td>
                        <td>{r.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
