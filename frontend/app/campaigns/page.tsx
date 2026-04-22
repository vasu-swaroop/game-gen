"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Campaign, getCampaigns } from "../../lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <div className="card campaign-card animate-fade-in-up" style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Left content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {campaign.name}
            </h2>
            <span className="badge badge-gold">#{campaign.id}</span>
          </div>

          {campaign.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.05rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: "16px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {campaign.description}
            </p>
          )}

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {campaign.dm_name && (
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-ui)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                🧙 DM: <strong style={{ color: "var(--text-secondary)" }}>{campaign.dm_name}</strong>
              </span>
            )}
            <span
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-ui)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              📅 {formatDate(campaign.created_at)}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div style={{ flexShrink: 0 }}>
          <Link href={`/campaigns/${campaign.id}`} className="btn btn-primary">
            ⚔ Continue
          </Link>
        </div>
      </div>

      {/* Decorative gold rule */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent, var(--gold-dim), transparent)",
          opacity: 0,
          transition: "opacity 0.3s",
        }}
        className="campaign-card-rule"
      />
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCampaigns()
      .then(setCampaigns)
      .catch((err) => setError(err.message ?? "Failed to load campaigns"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="full-page">
      {/* ── header ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/" className="app-logo">
            ⚔ D&D Simulator
          </Link>
          <nav className="app-nav">
            <span className="nav-link active">My Campaigns</span>
            <Link href="/campaigns/new" className="btn btn-primary btn-sm">
              + New Campaign
            </Link>
          </nav>
        </div>
      </header>

      {/* ── main ── */}
      <main style={{ flex: 1, padding: "48px 24px" }}>
        <div className="page-container">
          {/* Page title */}
          <div style={{ marginBottom: "48px" }}>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--gold-mid)",
                marginBottom: "10px",
              }}
            >
              Your Chronicles
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 900,
                color: "var(--text-primary)",
              }}
            >
              My Campaigns
            </h1>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "24px" }}>
              ⚠ {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                padding: "80px 0",
              }}
            >
              <div className="spinner" />
              <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "1.05rem" }}>
                Consulting the ancient scrolls…
              </p>
            </div>
          ) : campaigns.length === 0 ? (
            /* Empty state */
            <div className="empty-state">
              <span className="empty-state-icon">🗺️</span>
              <h2 className="empty-state-title">No Adventures Yet</h2>
              <p className="empty-state-text">
                Your legend is yet to be written. Forge a new campaign and let
                the Dungeon Master guide you into the unknown.
              </p>
              <Link href="/campaigns/new" className="btn btn-primary btn-lg" style={{ marginTop: "8px" }}>
                ⚔ Begin Your First Quest
              </Link>
            </div>
          ) : (
            /* Campaign list */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="stagger">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}

              {/* Add more */}
              <div className="divider" />
              <div style={{ textAlign: "center" }}>
                <Link href="/campaigns/new" className="btn btn-rune">
                  + Start a New Campaign
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-dim)",
          padding: "20px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontFamily: "var(--font-ui)" }}>
          D&D Simulator · Powered by Ollama
        </p>
      </footer>
    </div>
  );
}
