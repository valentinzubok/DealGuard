"use client";

import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

export default function SecurityPage() {
  return (
    <PageShell
      active="/security/"
      title="Security"
      lead="How DealGuard turns non-deterministic web + LLM work into auditable GenLayer consensus."
    >
      <div className="grid-3">
        <article className="card">
          <h3>SHA-256 freezes</h3>
          <p>
            <code>open_case</code>-style capture via <code>gl.get_webpage</code>, normalize
            whitespace, hash with SHA-256, agree under <code>eq_principle_strict_eq</code>.
            Listing hash on demo-1: <code>c0535e4b…e51a</code>.
          </p>
        </article>
        <article className="card">
          <h3>LLM adjudication</h3>
          <p>
            <code>adjudicate</code> uses <code>prompt_comparative</code> and compares only the
            stable decision field <code>pay_provider</code> — not free-form prose.
          </p>
        </article>
        <article className="card">
          <h3>cross_check</h3>
          <p>
            Re-fetch live URLs later; if digests diverge, set{" "}
            <code>tampered_listing</code> / <code>tampered_delivery</code>. Drift is proven,
            not assumed.
          </p>
        </article>
        <article className="card">
          <h3>Schema validation</h3>
          <p>
            CI validates <code>CODE_SNAPSHOT.json</code> and{" "}
            <code>condition_met</code> evidence against JSON Schemas. Invalid packs fail the
            pipeline.
          </p>
        </article>
        <article className="card">
          <h3>onlyOwner gates</h3>
          <p>
            <code>pin_code_snapshot</code>, <code>credit</code>,{" "}
            <code>transfer_ownership</code> — owner only. Deal writes gated by client/provider
            roles.
          </p>
        </article>
        <article className="card">
          <h3>Code pin</h3>
          <p>
            On-chain <code>evidence_hash = sha256(commit)</code> and{" "}
            <code>contract_hash = sha256(DealGuard.py)</code> so stewards can match Studio
            deploy to GitHub.
          </p>
        </article>
      </div>
      <div className="cta-row" style={{ marginTop: "1.5rem" }}>
        <a className="btn btn-primary" href={withBase("/evidence-explorer/")}>
          Explore integrity pack
        </a>
        <a className="btn btn-ghost" href={withBase("/docs/DEPLOY.md")}>
          Deploy record
        </a>
      </div>
    </PageShell>
  );
}
