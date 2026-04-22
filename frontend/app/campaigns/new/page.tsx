"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCampaign } from "../../../lib/api";

// ── D&D Classes ────────────────────────────────────────────────────────────────
const DND_CLASSES = [
  { id: "Barbarian", icon: "⚔️", label: "Barbarian" },
  { id: "Bard", icon: "🎸", label: "Bard" },
  { id: "Cleric", icon: "✝️", label: "Cleric" },
  { id: "Druid", icon: "🌿", label: "Druid" },
  { id: "Fighter", icon: "🛡️", label: "Fighter" },
  { id: "Monk", icon: "👊", label: "Monk" },
  { id: "Paladin", icon: "⚜️", label: "Paladin" },
  { id: "Ranger", icon: "🏹", label: "Ranger" },
  { id: "Rogue", icon: "🗡️", label: "Rogue" },
  { id: "Sorcerer", icon: "✨", label: "Sorcerer" },
  { id: "Warlock", icon: "👁️", label: "Warlock" },
  { id: "Wizard", icon: "🔮", label: "Wizard" },
];

const BACKGROUNDS = [
  "Acolyte", "Charlatan", "Criminal", "Entertainer", "Folk Hero",
  "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage",
  "Sailor", "Soldier", "Urchin",
];

const ABILITY_NAMES: Record<string, string> = {
  STR: "Strength",
  DEX: "Dexterity",
  CON: "Constitution",
  INT: "Intelligence",
  WIS: "Wisdom",
  CHA: "Charisma",
};

function abilityMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="steps-indicator" style={{ gap: 0 }}>
      {steps.map((label, idx) => (
        <div key={label} className="step-item" style={{ flex: idx < steps.length - 1 ? 1 : "none", alignItems: "center", display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div
              className={`step-circle ${idx < current ? "done" : idx === current ? "active" : ""}`}
            >
              {idx < current ? "✓" : idx + 1}
            </div>
            <span
              style={{
                fontSize: "0.65rem",
                color: idx === current ? "var(--gold-bright)" : "var(--text-muted)",
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`step-line ${idx < current ? "done" : ""}`}
              style={{ margin: "0 8px", marginBottom: "20px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── State ─────────────────────────────────────────────────────────────────────

interface FormState {
  // Step 0 — Campaign
  campaignName: string;
  description: string;
  dmName: string;
  systemInstructions: string;
  // Step 1 — Character
  charName: string;
  charClass: string;
  charBackground: string;
  charDescription: string;
  // Step 2 — Stats
  abilities: Record<string, number>;
  currentHp: number;
  maxHp: number;
}

const DEFAULT_ABILITIES: Record<string, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    campaignName: "Test Adventure",
    description: "A deep dungeon exploration for testing.",
    dmName: "AI DM",
    systemInstructions: "",
    charName: "Test Hero",
    charClass: "Fighter",
    charBackground: "Soldier",
    charDescription: "A brave warrior testing the simulator.",
    abilities: { ...DEFAULT_ABILITIES },
    currentHp: 10,
    maxHp: 10,
  });

  function set(key: keyof FormState, value: FormState[keyof FormState]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setAbility(key: string, value: number) {
    setForm((prev) => ({
      ...prev,
      abilities: { ...prev.abilities, [key]: value },
    }));
  }

  const steps = ["Campaign", "Character", "Stats & HP", "Summary"];

  // ── Validation ──────────────────────────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 0) return form.campaignName.trim().length > 0;
    if (step === 1) return form.charName.trim().length > 0 && form.charClass.length > 0;
    return true;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const campaign = await createCampaign({
        name: form.campaignName.trim(),
        description: form.description.trim() || undefined,
        dm_name: form.dmName.trim() || undefined,
        system_instructions: form.systemInstructions.trim() || undefined,
        player_character: form.charName.trim()
          ? {
              name: form.charName.trim(),
              description: form.charDescription.trim() || undefined,
              class_type: form.charClass || undefined,
              background: form.charBackground || undefined,
              ability_scores: form.abilities,
              current_hp: form.currentHp,
              max_hp: form.maxHp,
            }
          : undefined,
      });
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
      setSubmitting(false);
    }
  }

  // ── Step Panels ─────────────────────────────────────────────────────────────

  function renderStep0() {
    return (
      <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="form-group">
          <label className="form-label">Campaign Name *</label>
          <input
            className="form-input"
            placeholder="e.g. The Lost Mines of Phandelver…"
            value={form.campaignName}
            onChange={(e) => set("campaignName", e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Backstory / Description</label>
          <textarea
            className="form-textarea"
            placeholder="Describe the world, the campaign's premise, or any lore the DM should know…"
            rows={5}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Dungeon Master Name (optional)</label>
          <input
            className="form-input"
            placeholder="Your name as DM…"
            value={form.dmName}
            onChange={(e) => set("dmName", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">System Instructions / AI DM Prompting</label>
          <textarea
            className="form-textarea"
            placeholder="Configure how the AI DM behaves (e.g. 'Use old-english', 'Be very lethal', 'Focus on stealth')…"
            rows={4}
            value={form.systemInstructions}
            onChange={(e) => set("systemInstructions", e.target.value)}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
            This overrides the default DM personality. Leave blank for the standard experience.
          </p>
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="form-group">
            <label className="form-label">Character Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Theron Brightblade…"
              value={form.charName}
              onChange={(e) => set("charName", e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Background</label>
            <select
              className="form-select"
              value={form.charBackground}
              onChange={(e) => set("charBackground", e.target.value)}
            >
              <option value="">— Choose Background —</option>
              {BACKGROUNDS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Class *</label>
          <div className="class-grid">
            {DND_CLASSES.map((cls) => (
              <div
                key={cls.id}
                className={`class-card ${form.charClass === cls.id ? "selected" : ""}`}
                onClick={() => set("charClass", cls.id)}
              >
                <span className="class-icon">{cls.icon}</span>
                <span className="class-name">{cls.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Character Description (optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Appearance, personality, motivations, backstory…"
            rows={3}
            value={form.charDescription}
            onChange={(e) => set("charDescription", e.target.value)}
          />
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <label className="form-label" style={{ marginBottom: "14px" }}>Ability Scores</label>
          <div className="stat-grid">
            {Object.entries(form.abilities).map(([key, val]) => (
              <div key={key} className="stat-box">
                <span className="stat-name">{key}</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={val}
                  onChange={(e) => setAbility(key, parseInt(e.target.value) || 10)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    textAlign: "center",
                    fontFamily: "var(--font-display)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--gold-bright)",
                  }}
                />
                <span className="stat-mod">{abilityMod(val)}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "10px", fontFamily: "var(--font-ui)" }}>
            Standard array: 15, 14, 13, 12, 10, 8. Point buy or custom values also work.
          </p>
        </div>

        <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="form-group">
            <label className="form-label">Current HP</label>
            <input
              type="number"
              min={1}
              max={9999}
              className="form-input"
              value={form.currentHp}
              onChange={(e) => set("currentHp", parseInt(e.target.value) || 10)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max HP</label>
            <input
              type="number"
              min={1}
              max={9999}
              className="form-input"
              value={form.maxHp}
              onChange={(e) => set("maxHp", parseInt(e.target.value) || 10)}
            />
          </div>
        </div>

        {/* HP bar preview */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>HP Preview</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "var(--font-ui)", fontWeight: 600 }}>
              {form.currentHp} / {form.maxHp}
            </span>
          </div>
          <div className="hp-bar-wrapper">
            <div
              className="hp-bar-fill"
              style={{ width: `${Math.min(100, (form.currentHp / Math.max(form.maxHp, 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderStep3() {
    const cls = DND_CLASSES.find((c) => c.id === form.charClass);
    return (
      <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Campaign summary */}
        <div className="card card-accent-gold">
          <p className="panel-section-title">Campaign</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: "6px" }}>
            {form.campaignName}
          </p>
          {form.description && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {form.description}
            </p>
          )}
          {form.dmName && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "8px" }}>
              🧙 DM: {form.dmName}
            </p>
          )}
        </div>

        {/* Character summary */}
        {form.charName && (
          <div className="card card-accent-rune">
            <p className="panel-section-title">Character</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "2rem" }}>{cls?.icon ?? "🎭"}</span>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700 }}>
                  {form.charName}
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {form.charClass}
                  {form.charBackground ? ` · ${form.charBackground}` : ""}
                </p>
              </div>
            </div>

            {/* HP */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>HP</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {form.currentHp} / {form.maxHp}
                </span>
              </div>
              <div className="hp-bar-wrapper">
                <div
                  className="hp-bar-fill"
                  style={{ width: `${Math.min(100, (form.currentHp / Math.max(form.maxHp, 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="stat-grid">
              {Object.entries(form.abilities).map(([key, val]) => (
                <div key={key} className="stat-box">
                  <span className="stat-name">{key}</span>
                  <span className="stat-value">{val}</span>
                  <span className="stat-mod">{abilityMod(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="alert alert-error">⚠ {error}</div>}
      </div>
    );
  }

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3][step];

  return (
    <div className="full-page">
      {/* ── header ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/" className="app-logo">
            ⚔ D&D Simulator
          </Link>
          <nav className="app-nav">
            <Link href="/campaigns" className="btn btn-ghost btn-sm">
              ← My Campaigns
            </Link>
          </nav>
        </div>
      </header>

      {/* ── main ── */}
      <main style={{ flex: 1, padding: "48px 24px" }}>
        <div className="page-container" style={{ maxWidth: "700px" }}>
          {/* Title */}
          <div style={{ marginBottom: "40px" }}>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--gold-mid)",
                marginBottom: "8px",
              }}
            >
              New Adventure
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                fontWeight: 900,
              }}
            >
              Create Campaign
            </h1>
          </div>

          {/* Step indicator */}
          <div style={{ marginBottom: "40px" }}>
            <StepIndicator steps={steps} current={step} />
          </div>

          {/* Card */}
          <div className="card" style={{ marginBottom: "28px" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                color: "var(--gold-mid)",
                marginBottom: "24px",
              }}
            >
              Step {step + 1}: {steps[step]}
            </h2>
            {stepContent()}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div>
              {step > 0 && (
                <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
                  ← Back
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {step < steps.length - 1 ? (
                <>
                  {step === 1 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                      onClick={() => {
                        set("charName", "");
                        set("charClass", "");
                        setStep(3);
                      }}
                    >
                      Skip character
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canProceed()}
                  >
                    Continue →
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner spinner-sm" /> Creating…
                    </>
                  ) : (
                    "⚔ Begin Adventure!"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
