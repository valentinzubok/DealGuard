"use client";

import { useMemo, useState } from "react";

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
    address: "0xaaaa…bbbb",
    wins: 3,
    losses: 1,
    completed: 4,
    disputed: 1,
    score: 5,
  },
  {
    address: "0x1111…2222",
    wins: 2,
    losses: 0,
    completed: 2,
    disputed: 0,
    score: 4,
  },
  {
    address: "0xcccc…dddd",
    wins: 1,
    losses: 2,
    completed: 3,
    disputed: 2,
    score: 0,
  },
];

export default function ReputationPage() {
  const [rows, setRows] = useState<Rep[]>(SEED);
  const [address, setAddress] = useState("");
  const [raw, setRaw] = useState("");

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.score - a.score),
    [rows],
  );

  function importJson() {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRows(parsed);
        return;
      }
      if (parsed && typeof parsed === "object" && parsed.address) {
        setRows((prev) => {
          const rest = prev.filter((r) => r.address !== parsed.address);
          return [...rest, parsed as Rep];
        });
      }
    } catch {
      alert("Invalid JSON — paste get_reputation / get_stats style objects");
    }
  }

  function lookup() {
    const hit = rows.find((r) => r.address.toLowerCase().includes(address.toLowerCase()));
    if (!hit) {
      alert("No local row — after Studio deploy, paste get_reputation(address) JSON below");
      return;
    }
    alert(`${hit.address}\nscore=${hit.score} wins=${hit.wins} losses=${hit.losses}`);
  }

  return (
    <main className="wrap" style={{ padding: "2rem 0 4rem" }}>
      <p>
        <a href="/">← DealGuard</a>
      </p>
      <h1 style={{ fontFamily: "Syne, sans-serif" }}>Reputation panel</h1>
      <p style={{ color: "var(--muted)", maxWidth: "42rem" }}>
        On-chain scores come from <code>get_reputation(address)</code> and{" "}
        <code>get_stats()</code> after deals settle. This panel previews ranking
        locally and lets you paste Studio view JSON.
      </p>

      <div className="cta-row" style={{ marginTop: "1rem" }}>
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
            <h3 style={{ fontFamily: "Syne, sans-serif", marginTop: 0 }}>{r.address}</h3>
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
    </main>
  );
}
