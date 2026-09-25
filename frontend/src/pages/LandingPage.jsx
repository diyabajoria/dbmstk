import { Link } from "react-router-dom";
import Brand, { APP_NAME } from "../components/Brand";
import useReveal from "../hooks/useReveal";

const FEATURES = [
  { icon: "🧺", title: "Smart Pantry", desc: "Track groceries, toiletries and medicines with the brands and units you actually use." },
  { icon: "⏳", title: "Expiry Tracking (FEFO)", desc: "First-Expire-First-Out logic automatically uses the right batch, so nothing goes bad." },
  { icon: "📋", title: "Auto Shopping List", desc: "A restock list built from what's running low and how fast your family uses it." },
  { icon: "₹", title: "Spending Insights", desc: "Every rupee tracked — monthly trends, category breakdowns and money lost to waste." },
  { icon: "📈", title: "Usage Patterns", desc: "See how quickly your household goes through staples, dairy and produce." },
  { icon: "🏠", title: "Room-by-Room", desc: "Kitchen, pantry, fridge, bathroom — organise by where things actually live." },
];

const BARS = [42, 58, 50, 72, 64, 88, 76];

function trackMouse(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export default function LandingPage() {
  useReveal();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <Brand className="brand-name" />
        <div className="nav-actions">
          <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-sm">Get started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />

        <div className="hero-pill"><span className="live" /> Your whole home, organised</div>
        <h1>
          Know what you have.<br />
          <span className="gradient-text">Before you buy more.</span>
        </h1>
        <p className="subtitle">
          Organise your household inventory, track spending in ₹, cut waste and never miss an expiry date again.
        </p>
        <div className="landing-cta-row">
          <Link to="/register" className="btn btn-gradient btn-lg">Get started free →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Explore the demo home</Link>
        </div>

        <div className="mock-dashboard">
          <div className="mock-bar"><span /><span /><span /></div>
          <strong>Good evening, Anita — here's your household today.</strong>
          <div className="stats-grid stagger" style={{ marginTop: 14, marginBottom: 0 }}>
            <div className="stat-card"><div className="label">Inventory Value</div><div className="value">₹18,240</div></div>
            <div className="stat-card tone-info"><div className="label">Items Tracked</div><div className="value">48</div></div>
            <div className="stat-card tone-warning"><div className="label">Expiring Soon</div><div className="value warning">6</div></div>
            <div className="stat-card tone-danger"><div className="label">Expired</div><div className="value danger">2</div></div>
          </div>
          <div className="mock-chart">
            {BARS.map((h, i) => (
              <div key={i} style={{ height: `${h}%`, animationDelay: `${0.6 + i * 0.08}s` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="reveal">Everything your home needs</h2>
        <p className="section-sub reveal">One calm place for groceries, cleaning supplies, toiletries and medicines.</p>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-card reveal" style={{ transitionDelay: `${i * 0.06}s` }} onMouseMove={trackMouse}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-benefits reveal">
          <h2>Save up to ₹3,500 every month</h2>
          <p style={{ opacity: 0.9, maxWidth: 540, margin: "0 auto 24px" }}>
            By preventing spoilage and avoiding duplicate purchases, households cut waste noticeably within the first month.
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: "#fff", color: "var(--primary)" }}>Start saving →</Link>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="reveal">How it works</h2>
        <p className="section-sub reveal">Three steps. Two minutes a day.</p>
        <div className="how-it-works">
          {[
            ["Stock", "Log purchases as you shop — one tap for common items."],
            ["Track", "Record what you use; the oldest batch is used first automatically."],
            ["Save", "Get restock and expiry alerts before it's too late."],
          ].map(([t, d], i) => (
            <div className="how-step reveal" key={t} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="num">{i + 1}</div>
              <h3>{t}</h3>
              <p className="muted" style={{ fontSize: "0.9rem", margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        {APP_NAME} — Know what you have. Know what you need. Waste less. Spend smarter.
      </footer>
    </div>
  );
}
