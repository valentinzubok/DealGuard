export default function HomePage() {
  return (
    <>
      <header className="wrap nav">
        <div className="brand">
          <img src="/logo.png" alt="DealGuard" />
          DealGuard
        </div>
        <nav className="nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#studio">Studio</a>
          <a
            className="btn btn-ghost"
            href="https://github.com/valentinzubok/DealGuard"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main>
        <section className="wrap hero">
          <div className="hero-copy">
            <h1>
              Freeze the deal.
              <br />
              <span>Settle the truth.</span>
            </h1>
            <p>
              Agentic commerce escrow on GenLayer. Snapshot listing and delivery
              URLs at the moment that matters, then let validators adjudicate
              frozen evidence — not a page that rewrote itself overnight.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#studio">
                Deploy in Studio
              </a>
              <a className="btn btn-ghost" href="#flow">
                See the lifecycle
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/cover.png" alt="DealGuard product cover" />
          </div>
        </section>

        <section className="wrap section" id="features">
          <h2>Built for agent-to-agent commerce</h2>
          <p className="lead">
            Domain registries and permission receipts are useful. Settlement
            that survives URL rot is mandatory. DealGuard is the escrow layer
            other agent marketplaces plug into.
          </p>
          <div className="grid-3">
            <article className="card">
              <h3>Evidence freeze</h3>
              <p>
                Validators fetch https pages independently and seal SHA-256
                digests under strict equivalence at deal open and delivery.
              </p>
            </article>
            <article className="card">
              <h3>LLM adjudication</h3>
              <p>
                Disputes judge frozen listing + delivery against natural-language
                terms. Consensus compares only the pay_provider decision.
              </p>
            </article>
            <article className="card">
              <h3>Drift proof</h3>
              <p>
                cross_check re-fetches live URLs later and flags tampered listing
                or delivery before reputation or payout narratives rewrite
                history.
              </p>
            </article>
          </div>
        </section>

        <section className="wrap section" id="flow">
          <h2>Lifecycle</h2>
          <p className="lead">One deal. Six state transitions. Zero rotting links.</p>
          <div className="flow">
            {[
              ["01", "create_deal", "Client freezes listing URLs + terms."],
              ["02", "fund", "Client locks bookkeeping units into escrow."],
              ["03", "submit_delivery", "Provider freezes delivery evidence."],
              ["04", "release or dispute", "Happy path payout — or open a claim."],
              ["05", "adjudicate", "Validators LLM-judge frozen snapshots only."],
              ["06", "cross_check", "Prove drift. Update reputation scores."],
            ].map(([n, title, body]) => (
              <div className="flow-step" key={n}>
                <div className="n">{n}</div>
                <div>
                  <strong>{title}</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--muted)" }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section" id="how">
          <h2>Product surface</h2>
          <p className="lead">Console mocks of the create and adjudicate paths.</p>
          <div className="shots">
            <figure className="shot">
              <img src="/feature-create-deal.png" alt="Create deal screen" />
              <figcaption>create_deal — freeze listing evidence at open</figcaption>
            </figure>
            <figure className="shot">
              <img src="/feature-adjudicate.png" alt="Adjudicate screen" />
              <figcaption>adjudicate — settle from frozen evidence</figcaption>
            </figure>
          </div>
        </section>

        <section className="wrap section" id="studio">
          <h2>Try it in GenLayer Studio</h2>
          <p className="lead">
            Paste <code>contracts/DealGuard.py</code>, deploy with your wallet as
            owner, then run the smoke path with the stable GenLayer hello fixture.
          </p>
          <div className="code">{`credit(you, "1000")
create_deal("demo-1", provider, "Must contain Hello",
  '["https://test-server.genlayer.com/static/genvm/hello.html"]', "100")
fund("demo-1")
submit_delivery("demo-1", '["https://test-server.genlayer.com/static/genvm/hello.html"]')
dispute("demo-1", "Check delivery against terms")
adjudicate("demo-1")
cross_check("demo-1")`}</div>
          <div className="cta-row" style={{ marginTop: "1.25rem" }}>
            <a
              className="btn btn-primary"
              href="https://studio.genlayer.com/contracts"
              target="_blank"
              rel="noreferrer"
            >
              Open Studio
            </a>
            <a
              className="btn btn-ghost"
              href="https://github.com/valentinzubok/DealGuard"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </div>
        </section>
      </main>

      <footer className="wrap footer">
        <div>DealGuard · Agent Tank · Agentic Commerce Infrastructure</div>
        <div>MIT © 2026 Valentyn Zubok · Built on GenLayer</div>
      </footer>
    </>
  );
}
