import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

function sha256(buf: Buffer | string) {
  return createHash("sha256").update(buf).digest("hex");
}

function repoRoot() {
  // Prefer monorepo root (../..) when running from web/
  const candidates = [
    join(process.cwd(), ".."),
    process.cwd(),
    join(process.cwd(), "../.."),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "CODE_SNAPSHOT.json"))) return c;
  }
  return join(process.cwd(), "..");
}

export async function GET() {
  const root = repoRoot();
  const snapPath = join(root, "CODE_SNAPSHOT.json");
  if (!existsSync(snapPath)) {
    return NextResponse.json({ error: "CODE_SNAPSHOT.json not found" }, { status: 404 });
  }
  const snap = JSON.parse(readFileSync(snapPath, "utf8"));
  const files = [
    "CODE_SNAPSHOT.json",
    "schemas/code_snapshot.schema.json",
    "schemas/condition_met.schema.json",
    "templates/deal_evidence.json",
    ".github/workflows/ci.yml",
    "contracts/DealGuard.py",
  ];
  const fileMeta: Record<string, { sha256: string }> = {};
  for (const f of files) {
    const p = join(root, f);
    if (existsSync(p)) fileMeta[f] = { sha256: sha256(readFileSync(p)) };
  }
  const pack = {
    name: "DealGuard integrity pack",
    generated_at: new Date().toISOString(),
    files: {
      ...Object.fromEntries(
        Object.entries(fileMeta).map(([k, v]) => [
          k,
          k === "CODE_SNAPSHOT.json" ? { ...v, content: snap } : v,
        ]),
      ),
    },
    pin_code_snapshot_args: {
      commit: snap.commit,
      evidence_hash: snap.evidence_hash,
      contract_hash: snap.contract_hash,
      timestamp: snap.timestamp,
    },
    checks: [
      "python3 scripts/update_code_snapshot.py verify",
      "python3 scripts/validate_schemas.py",
      "python3 -m pytest -q",
    ],
  };
  return NextResponse.json(pack, {
    headers: {
      "Content-Disposition": 'attachment; filename="integrity-pack.json"',
    },
  });
}
