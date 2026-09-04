"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { PageShell } from "@/components/SiteChrome";
import { withBase } from "@/lib/basePath";

type Snap = {
  commit: string;
  evidence_hash: string;
  contract_hash: string;
  timestamp: string;
  note?: string;
};

type Pack = {
  name: string;
  generated_at?: string;
  pin_code_snapshot_args?: Snap;
  files?: Record<string, { sha256?: string; content?: Snap }>;
  checks?: string[];
  note?: string;
  studio?: { method: string; contract: string };
};

const FAV_KEY = "dealguard.explorer.notes";

export default function EvidenceExplorerPage() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [note, setNote] = useState("Agent Tank integrity pack");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [built, setBuilt] = useState<Pack | null>(null);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setSavedNotes(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }

    Promise.all([
      fetch(withBase("/CODE_SNAPSHOT.json")).then(async (r) => {
        if (!r.ok) throw new Error(`CODE_SNAPSHOT HTTP ${r.status}`);
        return r.json() as Promise<Snap>;
      }),
      fetch(withBase("/integrity-pack.json")).then(async (r) => {
        if (!r.ok) throw new Error(`integrity-pack HTTP ${r.status}`);
        return r.json() as Promise<Pack>;
      }),
    ])
      .then(([s, p]) => {
        setSnap(s);
        setPack(p);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load snapshot");
        setLoading(false);
      });
  }, []);

  const preview = useMemo(() => {
    if (!snap) return null;
    return {
      name: "DealGuard integrity pack",
      note,
      generated_at: new Date().toISOString(),
      pin_code_snapshot_args: {
        commit: snap.commit,
        evidence_hash: snap.evidence_hash,
        contract_hash: snap.contract_hash,
        timestamp: snap.timestamp,
      },
      studio: {
        method: "pin_code_snapshot",
        contract: "0xe8D6d1D1f81790e17C5Bd3436C5277E8C401B02D",
      },
      checks: pack?.checks || [
        "python3 scripts/update_code_snapshot.py verify",
        "python3 scripts/validate_schemas.py",
        "python3 -m pytest -q",
      ],
      files: pack?.files
        ? Object.fromEntries(
            Object.entries(pack.files).map(([k, v]) => [k, { sha256: v.sha256 }]),
          )
        : undefined,
    };
  }, [snap, note, pack]);

  function build() {
    if (!preview) {
      setError("Snapshot not loaded yet.");
      return;
    }
    setBusy(true);
    setError("");
    window.setTimeout(() => {
      setBuilt(preview as Pack);
      setStatus("Integrity pack assembled from CODE_SNAPSHOT + schemas.");
      setBusy(false);
    }, 280);
  }

  function download() {
    const data = built || preview;
    if (!data) {
      setError("Nothing to download — wait for snapshot load.");
      return;
    }
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dealguard-integrity-pack.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded dealguard-integrity-pack.json");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  }

  function saveNote() {
    const next = [note, ...savedNotes.filter((n) => n !== note)].slice(0, 6);
    setSavedNotes(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    setStatus("Note saved locally.");
  }

  return (
    <PageShell
      active="/evidence-explorer/"
      title="Evidence explorer"
      lead="Interactive integrity pack builder: load the pinned CODE_SNAPSHOT, annotate, preview pin_code_snapshot args, download the steward artifact."
    >
      {loading && <p className="status-line">Loading CODE_SNAPSHOT + integrity pack…</p>}
      {error && <p className="status-line error">Error: {error}</p>}
      {status && <p className="status-line ok">{status}</p>}

      <div className="grid-3">
        <label className="card">
          Commit (pinned)
          <input readOnly value={snap?.commit || "—"} style={inputStyle} />
        </label>
        <label className="card">
          evidence_hash
          <input readOnly value={snap?.evidence_hash || "—"} style={inputStyle} />
        </label>
        <label className="card">
          contract_hash
          <input readOnly value={snap?.contract_hash || "—"} style={inputStyle} />
        </label>
      </div>

      <label className="card" style={{ display: "block", marginTop: "1rem" }}>
        Pack note
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </label>

      {savedNotes.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {savedNotes.map((n) => (
            <button
              key={n}
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.65rem" }}
              onClick={() => setNote(n)}
            >
              {n.slice(0, 40)}
              {n.length > 40 ? "…" : ""}
            </button>
          ))}
        </div>
      )}

      <div className="cta-row" style={{ marginTop: "1rem" }}>
        <button className="btn btn-primary" type="button" onClick={build} disabled={!preview || busy}>
          {busy ? "Generating…" : "Generate integrity pack"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={download} disabled={!preview}>
          Download JSON
        </button>
        <button className="btn btn-ghost" type="button" onClick={saveNote}>
          Save note
        </button>
        <a
          className="btn btn-ghost"
          href="https://explorer-studio.genlayer.com/tx/0x0d17d1effc69a47718283014b3d0b941a174cb9db896db7aa239c3ac01d45c11"
          target="_blank"
          rel="noreferrer"
        >
          On-chain pin tx
        </a>
      </div>

      <h2 style={{ fontFamily: "Syne, sans-serif", marginTop: "2rem" }}>Result</h2>
      <pre className="code">
        {loading ? "// loading…" : JSON.stringify(built || preview, null, 2)}
      </pre>

      <h2 style={{ fontFamily: "Syne, sans-serif", marginTop: "2rem" }}>Live deal evidence</h2>
      <p className="lead">
        Also explore <code>store_evidence</code> on{" "}
        <a href={withBase("/evidence/")} style={{ color: "var(--teal)" }}>
          /evidence/
        </a>{" "}
        and the demo visualizer on{" "}
        <a href={withBase("/demo/")} style={{ color: "var(--teal)" }}>
          /demo/
        </a>
        .
      </p>
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
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.8rem",
};
