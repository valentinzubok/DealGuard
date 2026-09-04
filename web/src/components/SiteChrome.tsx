"use client";

import type { ReactNode } from "react";
import { withBase } from "@/lib/basePath";

const LINKS = [
  { href: "/how-it-works/", label: "How it works" },
  { href: "/quickstart/", label: "Quickstart" },
  { href: "/evidence-explorer/", label: "Explorer" },
  { href: "/features/", label: "Features" },
  { href: "/use-cases/", label: "Use cases" },
  { href: "/docs/", label: "Docs" },
];

export function SiteNav({ active }: { active?: string }) {
  return (
    <header className="wrap nav">
      <a className="brand" href={withBase("/")}>
        <img src={withBase("/logo.png")} alt="DealGuard" />
        DealGuard
      </a>
      <nav className="nav-links">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={withBase(l.href)}
            style={
              active === l.href
                ? { color: "var(--teal)", fontWeight: 600 }
                : undefined
            }
          >
            {l.label}
          </a>
        ))}
        <a
          className="btn btn-ghost"
          href="https://studio.genlayer.com/contracts"
          target="_blank"
          rel="noreferrer"
        >
          Studio
        </a>
      </nav>
    </header>
  );
}

export function PageShell({
  title,
  lead,
  active,
  children,
}: {
  title: string;
  lead: string;
  active?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteNav active={active} />
      <main className="wrap" style={{ padding: "1.5rem 0 4rem" }}>
        <p>
          <a href={withBase("/")} style={{ color: "var(--muted)" }}>
            ← Home
          </a>
        </p>
        <h1 style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        <p className="lead">{lead}</p>
        {children}
      </main>
    </>
  );
}
