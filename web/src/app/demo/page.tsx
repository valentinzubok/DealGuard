"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Template = {
  example: {
    dealUrl: string;
    signature: string;
    amount: string;
    condition_met: boolean;
    metadata?: Record<string, string>;
  };
};

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function DemoPage() {
  const [tmpl, setTmpl] = useState<Template | null>(null);
  const [form, setForm] = useState({
    dealUrl: "",
    signature: "",
    amount: "100",
    condition_met: true,
    deal_id: "demo-1",
  });
  const [hash, setHash] = useState("");

  useEffect(() => {
    fetch("/deal_evidence.json")
      .then((r) => r.json())
      .then((j: Template) => {
        setTmpl(j);
        setForm({
          dealUrl: j.example.dealUrl,
          signature: j.example.signature,
          amount: j.example.amount,
          condition_met: j.example.condition_met,
          deal_id: j.example.metadata?.deal_id || "demo-1",
        });
      });
  }, []);

  const payload = useMemo(
    () => ({
      dealUrl: form.dealUrl,
      signature: form.signature,
      amount: form.amount,
      condition_met: form.condition_met,
      metadata: { deal_id: form.deal_id, note: "demo visualizer" },
    }),
    [form],
  );

  async function compute() {
    const core = {
      amount: Number(form.amount),
      condition_met: form.condition_met,
      dealUrl: form.dealUrl,
      signature: form.signature,
    };
    const compact = JSON.stringify(core, ["amount", "condition_met", "dealUrl", "signature"]);
    setHash(await sha256Hex(compact));
  }

  return (
    <main className="wrap" style={{ padding: "2rem 0 4rem" }}>
      <p>
        <a href="/">← DealGuard</a>
      </p>
      <h1 style={{ fontFamily: "Syne, sans-serif" }}>Demo visualizer</h1>
      <p style={{ color: "var(--muted)", maxWidth: "40rem" }}>
        Fill the <code>templates/deal_evidence.json</code> shape, compute a local{" "}
        <code>payload_hash</code>, then submit the JSON via Studio{" "}
        <code>store_evidence</code>.
      </p>

      {!tmpl && <p>Loading template…</p>}

      <div className="grid-3" style={{ marginTop: "1.25rem" }}>
        {(
          [
            ["dealUrl", form.dealUrl],
            ["signature", form.signature],
            ["amount", form.amount],
          ] as const
        ).map(([key, val]) => (
          <label className="card" key={key}>
            {key}
            <input
              style={inputStyle}
              value={val}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>

      <label className="card" style={{ display: "block", marginTop: "1rem" }}>
        condition_met
        <select
          style={inputStyle}
          value={String(form.condition_met)}
          onChange={(e) => setForm({ ...form, condition_met: e.target.value === "true" })}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>

      <div className="cta-row" style={{ marginTop: "1rem" }}>
        <button className="btn btn-primary" type="button" onClick={compute}>
          Compute hash snapshot
        </button>
        <a className="btn btn-ghost" href="/evidence">
          Open evidence desk
        </a>
      </div>

      {hash && (
        <p style={{ color: "var(--teal)", marginTop: "1rem" }}>
          payload_hash: <code>{hash}</code>
        </p>
      )}

      <pre className="code" style={{ marginTop: "1.25rem" }}>
        {JSON.stringify(payload, null, 2)}
      </pre>
    </main>
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
