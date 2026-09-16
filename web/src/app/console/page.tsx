"use client";

import { DealGuardConsole } from "@/components/DealGuardConsole";
import { WalletProvider } from "@/components/WalletProvider";
import { withBase } from "@/lib/basePath";

export default function ConsolePage() {
  return (
    <>
      <header className="wrap nav">
        <div className="brand">
          <img src={withBase("/logo.png")} alt="DealGuard" />
          DealGuard
        </div>
        <nav className="nav-links">
          <a href={withBase("/")}>Home</a>
          <a href={withBase("/quickstart/")}>Quickstart</a>
          <a href={withBase("/console/")}>Console</a>
          <a
            href="https://github.com/valentinzubok/DealGuard"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>
      <main className="wrap" style={{ paddingBottom: "3rem" }}>
        <WalletProvider>
          <DealGuardConsole />
        </WalletProvider>
      </main>
    </>
  );
}
