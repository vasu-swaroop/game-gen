import Link from "next/link";

export default function Home() {
  return (
    <main className="full-page" style={{ background: "var(--bg-void)" }}>
      {/* ── NAV ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">⚔ D&D Simulator</span>
          <nav className="app-nav">
            <Link href="/campaigns" className="btn btn-ghost btn-sm">
              My Campaigns
            </Link>
            <Link href="/campaigns/new" className="btn btn-primary btn-sm">
              New Campaign
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ flex: 1 }}>
        <div className="hero-bg" />
        <div className="hero-content animate-fade-in-up">
          <p className="hero-eyebrow">AI-Powered Tabletop Adventure</p>
          <h1 className="hero-title">
            Dungeons<br />&amp; Dragons
            <br />Simulator
          </h1>
          <p className="hero-subtitle">
            Forge your legend across countless realms. An AI Dungeon Master
            awaits to narrate your story, track your battles, and remember
            every choice you make.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/campaigns/new" className="btn btn-primary btn-lg">
              ⚔ Begin New Adventure
            </Link>
            <Link href="/campaigns" className="btn btn-ghost btn-lg">
              📜 View My Campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-deep)" }}>
        <div className="page-container">
          <div className="rune-line" style={{ justifyContent: "center", marginBottom: "48px", fontSize: "0.9rem", fontFamily: "var(--font-display)", letterSpacing: "0.1em", color: "var(--gold-mid)" }}>
            Features
          </div>

          <div className="grid-3 stagger">
            {[
              {
                icon: "🧙",
                title: "AI Dungeon Master",
                desc: "A locally-hosted LLM narrates your story in real-time, responding to every action with vivid, coherent storytelling.",
              },
              {
                icon: "⚔️",
                title: "D&D 5e Rules",
                desc: "Combat, skill checks, and encounters follow official 5th edition mechanics — dice rolls, HP tracking, and more.",
              },
              {
                icon: "📜",
                title: "Persistent Campaigns",
                desc: "Your story is saved between sessions. Return to your campaign anytime — every decision shapes the world.",
              },
              {
                icon: "🗺️",
                title: "Rich World-Building",
                desc: "From dungeon depths to ancient cities, your DM paints vivid environments and populates them with memorable NPCs.",
              },
              {
                icon: "🛡️",
                title: "Character Creation",
                desc: "Build your hero from the ground up — choose class, background, and ability scores to define your playstyle.",
              },
              {
                icon: "🎲",
                title: "Full D&D Classes",
                desc: "Choose from Barbarian, Wizard, Rogue, Cleric, Ranger and more — each class shapes how the DM responds.",
              },
            ].map((feature) => (
              <div key={feature.title} className="card animate-fade-in-up">
                <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>{feature.icon}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    color: "var(--gold-bright)",
                    marginBottom: "8px",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="page-container">
          <div
            style={{
              background: "linear-gradient(135deg, var(--rune-dim), var(--bg-card))",
              border: "1px solid var(--rune-mid)",
              borderRadius: "var(--radius-xl)",
              padding: "60px 40px",
              boxShadow: "var(--shadow-glow-rune)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", marginBottom: "16px" }}>
              Ready, Adventurer?
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1.15rem", color: "var(--text-secondary)", marginBottom: "36px", maxWidth: 480, margin: "0 auto 36px" }}>
              Your tale of glory awaits. Pick up your dice and step into the realm.
            </p>
            <Link href="/campaigns/new" className="btn btn-primary btn-lg">
              ⚔ Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border-dim)", padding: "24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-ui)" }}>
          Powered by Ollama · Built with Next.js · D&D 5e SRD
        </p>
      </footer>
    </main>
  );
}
