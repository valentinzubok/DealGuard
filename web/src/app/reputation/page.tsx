"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/SiteChrome";

type Rep = {
  address: string;
  wins: number;
  losses: number;
  completed: number;
  disputed: number;
  score: number;
};

const SEED: Rep[] = [
  {
    address: "0x6f6077eC587f2964d30aCE8D803Edc27988046e3",
    wins: 0,
    losses: 0,
    completed: 0,
    disputed: 0,
    score: 0,
  },
  {
    address: "0x1111111111111111111111111111111111111111",
    wins: 0,
    losses: 0,
    completed: 0,
    disputed: 0,
    score: 0,
  },
  {
    address: "0xaaaa…bbbb",
    wins: 3,
    losses: 1,
    completed: 4,
    disputed: 1,
    score: 5,
  },
];

export default function ReputationPage() {
  const [rows, setRows] = useState<Rep[]>(SEED);
  const [address, setAddress] = useState("");
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.score - a.score),
    [rows],
  );

  function importJson() {
    setError("");
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRows(parsed);
        setStatus(`Imported ${parsed.length} rows.`);
        return;
      }
      if (parsed && typeof parsed === "object" && parsed.address) {
        setRows((prev) => {
          const rest = prev.filter((r) => r.address !== parsed.address);
          return [...rest, parsed as Rep];
        });
        setStatus(`Upserted ${parsed.address}`);
        return;
      }
      setError("Expected object with address or an array of reputation rows.");
    } catch {
      setError("Invalid JSON — paste get_reputation / get_stats style objects.");
    }
  }

  function lookup() {
    setError("");
    const hit = rows.find((r) => r.address.toLowerCase().includes(address.toLowerCase()));
    if (!hit) {
      setError("No local row — after Studio settle, paste get_reputation(address) JSON below.");
      setStatus("");
      return;
    }
    setStatus(
      `${hit.address} · score=${hit.score} wins=${hit.wins} losses=${hit.losses}`,
    );
  }

  return (
    <PageShell
      active="/reputation/"
      title="Reputation panel"
      lead="On-chain scores come from get_reputation(address) and get_stats() after deals settle. Preview ranking locally or paste Studio view JSON."
    >
      {error && <p className="status-line error">Error: {error}</p>}
      {status && <p className="status-line ok">{status}</p>}

      <div className="cta-row" style={{ marginTop: "0.5rem" }}>
        <input
          placeholder="0x address filter"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "0.75rem 1rem",
            borderRadius: 999,
            border: "1px solid var(--line)",
            background: "#050b10",
            color: "var(--ink)",
          }}
        />
        <button className="btn btn-primary" type="button" onClick={lookup}>
          Lookup
        </button>
      </div>

      <div className="grid-3" style={{ marginTop: "1.5rem" }}>
        {sorted.map((r) => (
          <article className="card" key={r.address}>
            <h3 style={{ fontFamily: "Syne, sans-serif", marginTop: 0, fontSize: "0.95rem" }}>
              {r.address}
            </h3>
            <p>
              score <strong style={{ color: "var(--teal)" }}>{r.score}</strong>
            </p>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              wins {r.wins} · losses {r.losses} · completed {r.completed} · disputed{" "}
              {r.disputed}
            </p>
          </article>
        ))}
      </div>

      <h2 style={{ fontFamily: "Syne, sans-serif", marginTop: "2rem" }}>Paste Studio JSON</h2>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={6}
        style={{
          width: "100%",
          borderRadius: 16,
          border: "1px solid var(--line)",
          background: "#050b10",
          color: "var(--ink)",
          padding: "1rem",
          fontFamily: "ui-monospace, monospace",
        }}
        placeholder='{"address":"0x…","wins":1,"losses":0,"completed":1,"disputed":0,"score":2}'
      />
      <div className="cta-row" style={{ marginTop: "0.75rem" }}>
        <button className="btn btn-ghost" type="button" onClick={importJson}>
          Import reputation row
        </button>
      </div>
    </PageShell>
  );
}
