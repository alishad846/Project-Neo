import { useEffect, useMemo, useState } from "react";
import { PRODUCTS, PRICE_ROWS, PRICE_RULES } from "./data.ts";
import { useReveal, useScrollY } from "./hooks.ts";

/* ------------------------------------------------------------------ NAV --- */
function Nav() {
  const y = useScrollY();
  const scrolled = y > 40;
  const onDark = typeof window !== "undefined" && y < window.innerHeight - 120;
  const cls = ["nav", scrolled ? "scrolled" : "", onDark ? "on-dark" : ""].join(" ");
  return (
    <nav className={cls}>
      <a className="brand" href="#top">
        <span className="brand-mark">N</span>
        <span>Neo</span>
      </a>
      <div className="nav-links">
        <a href="#problem">The problem</a>
        <a href="#compile">Compiler</a>
        <a href="#safety">Reversible</a>
        <a href="#extension">Extension</a>
        <a className="nav-cta" href="#get">Get early access</a>
      </div>
    </nav>
  );
}

/* ----------------------------------------------------------------- HERO --- */
function Hero() {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 80);
    return () => clearTimeout(t);
  }, []);
  const g = (i: number) => ({ transitionDelay: `${i * 90}ms` });
  return (
    <header className="hero" id="top">
      <div className="hero-grid-bg" />
      <div className="hero-glow" />
      <div className="shell hero-inner">
        <div className={`fade ${go ? "go" : ""}`} style={g(0)}>
          <span className="eyebrow hero-eyebrow">For Meesho · Amazon · Flipkart sellers</span>
        </div>
        <h1 aria-label="Neo compiles your catalogue.">
          <span className="line">
            <span className={`enter ${go ? "go" : ""}`} style={g(1)}>Neo compiles</span>
          </span>
          <span className="line">
            <span className={`enter ${go ? "go" : ""}`} style={g(2)}>
              your <em>catalogue.</em>
            </span>
          </span>
        </h1>
        <p className={`hero-sub fade ${go ? "go" : ""}`} style={g(4)}>
          One canonical product record. Every marketplace wants it in a different shape —
          so we made the translation a program, not your afternoon.
        </p>
        <div className={`hero-actions fade ${go ? "go" : ""}`} style={g(5)}>
          <a className="btn btn-primary" href="#get">Get early access</a>
          <a className="btn btn-ghost" href="#compile">See it compile</a>
        </div>
      </div>
      <div className={`hero-marquee fade ${go ? "go" : ""}`} style={g(6)}>
        <div className="track" aria-hidden="true">
          <span>Product Genome</span><span className="dot">/</span>
          <span>Meesho Adapter</span><span className="dot">/</span>
          <span>Reversible transactions</span><span className="dot">/</span>
          <span>Dry-run before commit</span><span className="dot">/</span>
          <span>Amazon SP-API</span><span className="dot">/</span>
          <span>Flipkart Seller API</span><span className="dot">/</span>
          <span>Your data stays on device</span><span className="dot">/</span>
          <span>Product Genome</span><span className="dot">/</span>
          <span>Meesho Adapter</span><span className="dot">/</span>
          <span>Reversible transactions</span><span className="dot">/</span>
          <span>Dry-run before commit</span><span className="dot">/</span>
          <span>Amazon SP-API</span><span className="dot">/</span>
          <span>Flipkart Seller API</span><span className="dot">/</span>
          <span>Your data stays on device</span><span className="dot">/</span>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------- PROBLEM --- */
function Problem() {
  const ref = useReveal<HTMLDivElement>();
  const chores = [
    ["Retype the same fields into every listing form", "again"],
    ["React to competitor prices by gut feel", "daily"],
    ["Crop and rename shipping labels", "per order"],
    ["Re-fix listings rejected for duplicate content", "weekly"],
    ["Chase payment discrepancies across settlements", "monthly"],
  ];
  return (
    <section className="section problem" id="problem">
      <div className="shell" ref={ref}>
        <div className="section-head reveal">
          <span className="eyebrow">The tax on selling online</span>
        </div>
        <div className="stat-row">
          <div className="big-stat reveal">
            <em>25–38</em>
            <span className="unit">hours a week lost to work that creates nothing new — repeated once per marketplace.</span>
          </div>
          <div className="problem-copy reveal" style={{ transitionDelay: "120ms" }}>
            <p>A seller with a few hundred SKUs isn&rsquo;t short on hustle. They&rsquo;re short on hours — spent being the human translator between three marketplaces that each want the same product described differently.</p>
            <p>Existing tools are clipboards with a memory: one marketplace, identical text on every listing (penalised as duplicate content), and no undo — so they refuse to auto-submit.</p>
            <div className="problem-list">
              {chores.map(([c, w]) => (
                <div className="row" key={c}>
                  <span>{c}</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- COMPILE DEMO --- */
function CompileDemo() {
  const ref = useReveal<HTMLDivElement>();
  const [idx, setIdx] = useState(0);
  const product = PRODUCTS[idx];
  // key changes force the staggered field animation to replay on switch
  const stamp = useMemo(() => `${idx}`, [idx]);

  return (
    <section className="section compile" id="compile">
      <div className="hero-grid-bg" />
      <div className="shell" ref={ref}>
        <div className="section-head reveal">
          <span className="eyebrow">The core idea</span>
          <h2>A compiler, not a form filler.</h2>
          <p>
            Every marketplace wants the same product in a different shape. One genome on the left,
            three marketplace-ready listings on the right — watch the same fact get three names.
          </p>
        </div>

        <div className="product-switch reveal">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.genome.id}
              className={i === idx ? "active" : ""}
              onClick={() => setIdx(i)}
            >
              {p.genome.name}
            </button>
          ))}
        </div>

        <div className="compile-stage reveal">
          {/* Genome */}
          <div className="panel genome-panel">
            <div className="panel-label"><span className="pip" />Product Genome</div>
            <div className="genome-name">{product.genome.name}</div>
            <div className="genome-sku">{product.genome.sku}</div>
            <div className="genome-hero">{product.genome.hero}</div>
            <div className="stagger" key={`g-${stamp}`}>
              {product.genome.fields.map((f, i) => (
                <div className="genome-field" style={{ animationDelay: `${i * 45}ms` }} key={f.label}>
                  <span className="k">{f.label}</span>
                  <span className="v">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="compile-arrow">
            <div className="rail" />
            <div className="verb">compile()</div>
          </div>

          {/* Adapters */}
          <div className="adapters">
            {product.outputs.map((out, oi) => (
              <div className="adapter" key={out.marketplace}>
                <div className="adapter-head">
                  <span className="adapter-name">{out.marketplace}</span>
                  <span className="adapter-transport">{out.transport}</span>
                </div>
                <div className="adapter-body stagger" key={`a-${oi}-${stamp}`}>
                  {out.fields.map((f, i) => (
                    <div className="cfield" style={{ animationDelay: `${(oi * 3 + i) * 40}ms` }} key={f.key}>
                      <div className="cfield-row">
                        <span className="k">{f.key}</span>
                        <span className="v">{f.value}</span>
                      </div>
                      {f.note && <span className="note">↳ {f.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- SAFETY --- */
const PRINCIPLES = [
  ["01", "Every mutation is reversible", "Adapter write methods return a transaction. We snapshot the previous state before touching anything live — undo is a type-system guarantee, not a feature we add later."],
  ["02", "Dry-run before commit, always", "Bulk operations show a per-SKU diff — old price, new price, estimated margin impact — before a single change happens. You confirm, then it executes."],
  ["03", "Fail safe, never fail wrong", "If a field can&rsquo;t be resolved with confidence, we stop and tell you what was and wasn&rsquo;t done. Silently writing a wrong value into a live catalogue is the one unforgivable bug."],
  ["04", "We never touch your passwords", "Neo works inside your own logged-in session. Marketplace OAuth tokens stay server-side and encrypted — never in the extension."],
];

function Safety() {
  const ref = useReveal<HTMLDivElement>();
  const [state, setState] = useState<"preview" | "applied">("preview");
  const total = PRICE_ROWS.reduce((s, r) => s + (r.newPrice - r.oldPrice), 0);
  const blocked = PRICE_ROWS.filter((r) => !r.breakeven).length;

  return (
    <section className="section safety" id="safety">
      <div className="shell" ref={ref}>
        <div className="section-head reveal">
          <span className="eyebrow">Why we can auto-submit when others can&rsquo;t</span>
          <h2>Reversible by construction.</h2>
        </div>
        <div className="safety-grid">
          <div className="principle-list reveal">
            {PRINCIPLES.map(([n, h, p]) => (
              <div className="principle" key={n}>
                <span className="num">{n}</span>
                <div>
                  <h4>{h}</h4>
                  <p dangerouslySetInnerHTML={{ __html: p }} />
                </div>
              </div>
            ))}
          </div>

          {/* Interactive dry-run diff */}
          <div className="dryrun reveal" style={{ transitionDelay: "120ms" }}>
            <div className="dryrun-head">
              <span className="rule"><span className="q">rule › </span>{PRICE_RULES[0]}</span>
              <span className="dryrun-tag">{state === "preview" ? "Dry run" : "Applied"}</span>
            </div>
            <div className="dryrun-table">
              <div className="dryrun-row head">
                <span>SKU</span><span>Was</span><span>New</span><span>Margin</span>
              </div>
              {PRICE_ROWS.map((r) => (
                <div className={`dryrun-row ${r.breakeven ? "" : "blocked"}`} key={r.sku}>
                  <span className="name">{r.name}<small>{r.sku}</small></span>
                  <span className="old">₹{r.oldPrice}</span>
                  <span className="new">{r.breakeven ? `₹${r.newPrice}` : "—"}</span>
                  <span className={`m ${r.breakeven ? "ok" : "bad"}`}>
                    {r.breakeven ? `${r.margin}%` : "below BE"}
                  </span>
                </div>
              ))}
            </div>
            <div className="dryrun-foot">
              <span className="impact">
                {state === "preview"
                  ? <>impact <strong>₹{total}</strong> across {PRICE_ROWS.length - blocked} SKUs</>
                  : <>applied · <strong style={{ color: "var(--signal)" }}>reversible</strong></>}
              </span>
              <div className="dryrun-actions">
                {state === "preview" ? (
                  <button className="mini-btn solid" onClick={() => setState("applied")}>Confirm &amp; apply</button>
                ) : (
                  <button className="mini-btn warned" onClick={() => setState("preview")}>Previous</button>
                )}
              </div>
            </div>
            <div className="dryrun-note blocked-note">
              {blocked > 0 && `↳ ${blocked} SKU held back — the new price would fall below break-even.`}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ EXTENSION --- */
function Extension() {
  const ref = useReveal<HTMLDivElement>();
  const feats = [
    ["Lives in the side panel", "A real side panel, not a popup — it stays open through a long bulk job instead of closing the moment you click away."],
    ["Reads your live catalogue", "Connect your session and Neo renders your real SKUs in seconds. No CSV export, no copy-paste."],
    ["Bulk Price Manager", "Write a rule, preview a per-SKU diff, apply, and undo with one click. The whole loop is snapshot-backed."],
    ["Resumable by design", "The job queue survives a killed service worker and a dropped connection, because it&rsquo;s persisted, not held in memory."],
  ];
  return (
    <section className="section ext" id="extension">
      <div className="hero-grid-bg" />
      <div className="shell" ref={ref}>
        <div className="section-head reveal">
          <span className="eyebrow">The live extension</span>
          <h2>Runs where you already work.</h2>
        </div>
        <div className="ext-grid">
          <div className="ext-features reveal">
            {feats.map(([h, p]) => (
              <div className="ext-feature" key={h}>
                <h4><span className="tick">▸</span>{h}</h4>
                <p dangerouslySetInnerHTML={{ __html: p }} />
              </div>
            ))}
          </div>

          {/* Side panel mock */}
          <div className="panel-mock reveal" style={{ transitionDelay: "120ms" }}>
            <div className="panel-mock-top">
              <span className="brand-mark">N</span>
              <span className="t">Neo</span>
              <span className="badge">connected</span>
            </div>
            <div className="panel-tabs">
              <span className="tab on">Catalogue</span>
              <span className="tab">Price Manager</span>
              <span className="tab">Composer</span>
            </div>
            <div className="panel-mock-body">
              {[
                ["Printed Cotton Kurti", "KURTI-001", "₹699"],
                ["Banarasi Silk Saree", "SAREE-014", "₹1,499"],
                ["Cotton Crop Top", "TOP-003", "₹349"],
                ["Floral Midi Dress", "DRESS-011", "₹899"],
              ].map(([t, s, p]) => (
                <div className="mock-card" key={s}>
                  <span className="mock-thumb" />
                  <div>
                    <div className="mc-t">{t}</div>
                    <div className="mc-s">{s}</div>
                  </div>
                  <span className="mc-p">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- ROADMAP --- */
function Roadmap() {
  const ref = useReveal<HTMLDivElement>();
  const cards = [
    ["live", "Meesho", "Beachhead", "No open API means enterprise OMS players stay out. We drive the Supplier Panel in your own browser — read the catalogue, compose listings, manage prices."],
    ["next", "Amazon India", "Adapter #2", "SP-API is mature and public. The MVP is scoped to avoid restricted PII roles entirely — catalogue and pricing don&rsquo;t need them."],
    ["next", "Flipkart", "Adapter #3", "Marketplace Seller API v3, registered as a third-party partner — never asking a seller to paste self-access keys that would risk their account."],
  ];
  return (
    <section className="section roadmap">
      <div className="shell" ref={ref}>
        <div className="section-head reveal">
          <span className="eyebrow">Add a marketplace = write one adapter</span>
          <h2>Built to expand, not rebuild.</h2>
          <p>The product is compiled once and shaped many times. That&rsquo;s the whole point of the abstraction — a new marketplace is one more adapter, never a new product.</p>
        </div>
        <div className="rm-grid">
          {cards.map(([status, name, role, body]) => (
            <div className="rm-card reveal" key={name}>
              <span className={`status ${status}`}>{status === "live" ? "Live now" : "Next"}</span>
              <h3>{name}</h3>
              <div className="role">{role}</div>
              <p dangerouslySetInnerHTML={{ __html: body }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- FINAL --- */
function Final() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <>
      <section className="final" id="get">
        <div className="hero-glow" />
        <div className="shell" ref={ref}>
          <div className="reveal">
            <h2>Stop translating.<br /><em>Start compiling.</em></h2>
            <p>Neo is in active build for Meesho sellers. Get early access and put your catalogue on the compiler.</p>
            <a className="btn btn-primary" href="mailto:hello@projectneo.in?subject=Neo%20early%20access">Get early access</a>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="footer-inner">
          <span>Neo — a compiler for catalogue work.</span>
          <span>Meesho · Amazon India · Flipkart</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}

/* ------------------------------------------------------------------ APP --- */
export function App() {
  return (
    <>
      <Nav />
      <Hero />
      <Problem />
      <CompileDemo />
      <Safety />
      <Extension />
      <Roadmap />
      <Final />
    </>
  );
}
