import { useState, useEffect } from "react"

const CHAR_RULES = [
  { char: ".", label: "Point",          converted: "0" },
  { char: ",", label: "Virgule",        converted: "0" },
  { char: "-", label: "Tiret",          converted: "0" },
  { char: "_", label: "Underscore",     converted: "0" },
  { char: "x", label: "Lettre x",       converted: "0" },
  { char: "X", label: "Lettre X",       converted: "0" },
  { char: "/", label: "Slash",          converted: "0" },
  { char: "calme", label: "Calme",      converted: "0" },
  { char: "traces",label: "Traces",     converted: "0" },
  { char: "3X",    label: "3X, 4X…",   converted: "0" },
  { char: "—",     label: "Tiret long", converted: "0" },
  { char: "?",     label: "Illisible",  converted: "0 (suspect)" },
]

const PIPELINE = [
  { num: 1, label: "Upload image",        desc: "Photo smartphone ou scan",         color: "#4a6fa5" },
  { num: 2, label: "Claude Vision",       desc: "Lecture manuscrite intelligente",  color: "#7c4dbd" },
  { num: 3, label: "Nettoyage auto",      desc: ". , - x X calme → 0",             color: "#c07000" },
  { num: 4, label: "Export Excel",        desc: "Cellules suspectes en rouge",      color: "#1a6e3f" },
  { num: 5, label: "Révision manuelle",   desc: "Correction cellule par cellule",   color: "#1a3f6f" },
  { num: 6, label: "Conversion CSV",      desc: "Prêt pour le job Qdata",           color: "#1a6e3f" },
  { num: 7, label: "Job Qdata",           desc: "Import automatique base de données",color:"#0d2a4a" },
]

export default function Dashboard({ API, stats, onNavigate }) {
  const [records, setRecords] = useState([])

  useEffect(() => {
    fetch(`${API}/records`).then(r => r.json()).then(d => setRecords(d.records || [])).catch(() => {})
  }, [])

  const ready    = records.filter(r => r.status === "ready").length
  const clean    = records.filter(r => r.status === "ready" && r.anomalies === 0).length
  const withAnom = records.filter(r => r.anomalies > 0).length
  const pct      = ((ready / 240) * 100).toFixed(1)

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Tableau de bord</div>
          <div className="page-sub">Suivi de l'import Qdata — 240 stations météo</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate("upload")}>
          Uploader une fiche
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Stations configurées", val: stats?.total_stations_configurees ?? 0, color: "var(--accent)" },
          { label: "Fiches traitées",      val: ready,    color: "var(--success)" },
          { label: "Avec anomalies",       val: withAnom, color: "var(--warn)" },
          { label: "Progression",          val: `${pct}%`,color: "var(--ink)" },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ textAlign: "center", padding: "20px 16px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 6, fontFamily: "var(--mono)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barre progression 240 stations */}
      <div className="card">
        <div className="card-title">Progression — 240 stations</div>
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--mono)", color: "var(--ink3)" }}>
          <span>{ready} traitées</span>
          <span>{Math.max(0, 240 - ready)} restantes</span>
        </div>
        <div className="progress-track" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, +pct)}%` }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink3)", display: "flex", gap: 20 }}>
          <span style={{ color: "var(--success)" }}>✓ {clean} propres</span>
          <span style={{ color: "var(--warn)" }}>⚑ {withAnom} avec anomalies</span>
          <span style={{ color: "var(--danger)" }}>✕ {stats?.erreurs ?? 0} erreurs</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Pipeline visuel */}
        <div className="card">
          <div className="card-title">Pipeline de traitement</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PIPELINE.map((step, i) => (
              <div key={step.num} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: step.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                }}>
                  {step.num}
                </div>
                {i < PIPELINE.length - 1 && (
                  <div style={{ position: "absolute", marginLeft: 14, marginTop: 30, width: 2, height: 8, background: "var(--border2)" }} />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{step.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--mono)" }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Règles de nettoyage */}
        <div className="card">
          <div className="card-title">Règles de nettoyage automatique</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {CHAR_RULES.map(rule => (
              <div key={rule.char} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px", borderRadius: 6,
                background: "var(--bg)", border: "1px solid var(--border)",
                fontSize: 11,
              }}>
                <code style={{
                  fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700,
                  color: "var(--danger)", minWidth: 28, textAlign: "center",
                  background: "var(--danger-dim)", padding: "1px 5px", borderRadius: 4
                }}>
                  {rule.char}
                </code>
                <span style={{ color: "var(--ink3)", fontSize: 10 }}>{rule.label}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--success)" }}>
                  → {rule.converted}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink3)", fontFamily: "var(--mono)", padding: "8px 10px", background: "var(--warn-dim)", borderRadius: 6 }}>
            Les cellules converties en 0 apparaissent en jaune dans Excel.<br/>
            Les valeurs non reconnues apparaissent en rouge — à vérifier manuellement.
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card">
        <div className="card-title">Actions rapides</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("upload")}>
            Uploader une fiche
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("review")}>
            Réviser les anomalies
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("records")}>
            Voir l'historique complet
          </button>
        </div>
      </div>
    </>
  )
}
