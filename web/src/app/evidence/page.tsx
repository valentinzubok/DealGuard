"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

type Evidence = {
  dealUrl: string;
  signature: string;
  amount: string;
  condition_met: boolean;
  metadata: { deal_id: string; note: string };
};

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function validate(e: Evidence): string[] {
  const errors: string[] = [];
  if (!/^https:\/\//i.test(e.dealUrl)) errors.push("dealUrl must be https://");
  if (!/^0x[0-9a-fA-F]{8,130}$/.test(e.signature)) errors.push("signature must be 0x-hex");
  if (!/^[0-9]+$/.test(e.amount) || Number(e.amount) <= 0) errors.push("amount must be positive uint");
  return errors;
}

export default function EvidencePage() {
  const [form, setForm] = useState<Evidence>({
    dealUrl: "https://test-server.genlayer.com/static/genvm/hello.html",
    signature: `0x${"ab".repeat(32)}`,
    amount: "100",
    condition_met: true,
    metadata: { deal_id: "demo-1", note: "Delivery page contains Hello" },
  });
  const [payloadHash, setPayloadHash] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const errors = useMemo(() => validate(form), [form]);
  const json = useMemo(() => JSON.stringify(form, null, 2), [form]);

  async function onHash() {
    setError("");
    if (errors.length) {
      setError(errors.join("; "));
      setStatus("");
      return;
    }
    setBusy(true);
    try {
      const core = {
        dealUrl: form.dealUrl,
        signature: form.signature,
        amount: Number(form.amount),
        condition_met: form.condition_met,
      };
      const compact = JSON.stringify(core, ["amount", "condition_met", "dealUrl", "signature"]);
      const h = await sha256Hex(compact);
      setPayloadHash(h);
      setStatus("Payload validated. Copy JSON into Studio store_evidence(deal_id, json).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hash failed");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dealguard-evidence.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded dealguard-evidence.json");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  }

  return (
    <PageShell
      active="/evidence/"
      title="Evidence desk"
      lead="Build a condition_met payload, verify locally, submit via Studio store_evidence. Validators use the same schema from get_criteria_template."
    >
      {error && <p className="status-line error">Error: {error}</p>}
      {status && <p className="status-line ok">{status}</p>}

      <div className="grid-3" style={{ marginTop: "0.5rem" }}>
        <label className="card">
          dealUrl
          <input
            style={inputStyle}
            value={form.dealUrl}
            onChange={(e) => setForm({ ...form, dealUrl: e.target.value })}
          />
        </label>
        <label className="card">
          amount
          <input
            style={inputStyle}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <label className="card">
          condition_met
          <select
            style={inputStyle}
            value={String(form.condition_met)}
            onChange={(e) =>
              setForm({ ...form, condition_met: e.target.value === "true" })
            }
          >
            <option value="true">true (pay provider)</option>
            <option value="false">false (refund client)</option>
          </select>
        </label>
      </div>

      <label className="card" style={{ display: "block", marginTop: "1rem" }}>
        signature (0x hex)
        <input
          style={inputStyle}
          value={form.signature}
          onChange={(e) => setForm({ ...form, signature: e.target.value })}
        />
      </label>

      <label className="card" style={{ display: "block", marginTop: "1rem" }}>
        metadata.deal_id
        <input
          style={inputStyle}
          value={form.metadata.deal_id}
          onChange={(e) =>
            setForm({
              ...form,
              metadata: { ...form.metadata, deal_id: e.target.value },
            })
          }
        />
      </label>

      <div className="cta-row" style={{ marginTop: "1.25rem" }}>
        <button className="btn btn-primary" type="button" onClick={onHash} disabled={busy}>
          {busy ? "Hashing…" : "Validate + hash"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={download}>
          Download JSON
        </button>
        <a className="btn btn-ghost" href={withBase("/demo/")}>
          Demo mode
        </a>
        <a
          className="btn btn-ghost"
          href="https://studio.genlayer.com/contracts"
          target="_blank"
          rel="noreferrer"
        >
          Open Studio
        </a>
      </div>

      {payloadHash && (
        <p style={{ color: "var(--muted)", marginTop: "0.75rem" }}>
          payload_hash: <code>{payloadHash}</code>
        </p>
      )}

      <h2 style={{ fontFamily: "Syne, sans-serif", marginTop: "2rem" }}>JSON payload</h2>
      <pre className="code">{json}</pre>

      <h2 style={{ fontFamily: "Syne, sans-serif", marginTop: "2rem" }}>CLI</h2>
      <pre className="code">{`python3 scripts/cli.py evidence generate --deal-id demo-1
python3 scripts/cli.py evidence validate artifacts/evidence.json
python3 scripts/cli.py snapshot verify
python3 scripts/cli.py studio-calls`}</pre>
    </PageShell>
  );
}

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: "0.5rem",
  padding: "0.65rem 0.75rem",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "#050b10",
  color: "var(--ink)",
};
