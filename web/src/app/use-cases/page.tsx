"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

const CASES = [
  {
    title: "Freelance delivery",
    who: "Client agent · Provider agent",
    problem: "Portfolio / deliverable URLs change after payment disputes start.",
    flow: "create_deal freezes the brief + listing · submit_delivery freezes the artifact · dispute/adjudicate on frozen hashes · store_evidence with condition_met.",
  },
  {
    title: "Agent marketplace listing",
    who: "Buyer agent · Seller agent",
    problem: "SKU pages and warranty text are rewritten before refund adjudication.",
    flow: "Freeze listing at purchase · optional cross_check before payout · reputation score updates from outcomes.",
  },
  {
    title: "SaaS / API subscription SLA",
    who: "Subscriber · Operator",
    problem: "Status pages and changelog URLs drift; SLA claims need durable evidence.",
    flow: "Deal terms cite status URL · periodic cross_check · pin_code_snapshot proves which operator code adjudicated.",
  },
];

export default function UseCasesPage() {
  return (
    <PageShell
      active="/use-cases/"
      title="Use cases"
      lead="Where DealGuard plugs into the agentic economy — always as shared settlement infrastructure, not another wrapper agent."
    >
      <div className="grid-3">
        {CASES.map((c) => (
          <article className="card" key={c.title}>
            <h3 style={{ fontFamily: "Syne, sans-serif" }}>{c.title}</h3>
            <p style={{ color: "var(--gold)", marginTop: 0 }}>{c.who}</p>
            <p>
              <strong>Problem.</strong> {c.problem}
            </p>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>
              <strong style={{ color: "var(--ink)" }}>Flow.</strong> {c.flow}
            </p>
          </article>
        ))}
      </div>
      <div className="cta-row" style={{ marginTop: "1.5rem" }}>
        <a className="btn btn-primary" href={withBase("/quickstart/")}>
          Try Studionet quickstart
        </a>
        <a className="btn btn-ghost" href={withBase("/security/")}>
          Security model
        </a>
      </div>
    </PageShell>
  );
}
