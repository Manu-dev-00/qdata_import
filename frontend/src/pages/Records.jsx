import { useState, useEffect } from "react"

export default function Records({ API, onNotify, onNavigate }) {
  const [records, setRecords] = useState([])
  const [filter, setFilter]   = useState("all")
  const [search, setSearch]   = useState("")
  const [downloading, setDownloading] = useState(null)

  useEffect(() => { fetchList() }, [])

  async function fetchList() {
    try {
      const r = await fetch(`${API}/records`)
      if (r.ok) {
        const d = await r.json()
        setRecords(d.records)
      }
    } catch {}
  }

  async function downloadExcel(id, stationId, mois, annee) {
    setDownloading(id)
    try {
      const r = await fetch(`${API}/records/${id}/export/excel`)
      if (r.ok) {
        const blob = await r.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `QDATA_${stationId}_${mois}_${annee}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
        onNotify("Excel téléchargé", "ok")
      }
    } catch { onNotify("Erreur téléchargement", "err") }
    setDownloading(null)
  }

  async function downloadCSV(id, stationId, mois, annee) {
    setDownloading(id)
    try {
      const r = await fetch(`${API}/records/${id}/export/csv?valide=true`)
      if (r.ok) {
        const blob = await r.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `QDATA_${stationId}_${mois}_${annee}.csv`
        a.click()
        URL.revokeObjectURL(url)
        onNotify("CSV Qdata téléchargé", "ok")
      }
    } catch { onNotify("Erreur téléchargement", "err") }
    setDownloading(null)
  }

  async function downloadGlobalReport() {
    try {
      const r = await fetch(`${API}/rapport/global`)
      if (r.ok) {
        const blob = await r.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `rapport_global_qdata.xlsx`
        a.click()
        URL.revokeObjectURL(url)
        onNotify("Rapport global téléchargé", "ok")
      }
    } catch { onNotify("Erreur rapport", "err") }
  }

  const filtered = records.filter(r => {
    const matchFilter =
      filter === "all" ? true :
      filter === "ok"  ? r.anomalies === 0 && r.status === "ready" :
      filter === "warn"? r.anomalies > 0 :
      filter === "err" ? r.status === "error" : true

    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.station_id.toLowerCase().includes(q) ||
      r.station_nom.toLowerCase().includes(q) ||
      r.mois.toLowerCase().includes(q) ||
      String(r.annee).includes(q)

    return matchFilter && matchSearch
  })

  const statusBadge = (r) => {
    if (r.status === "error")    return <span className="badge badge-danger">Erreur</span>
    if (r.status === "processing") return <span className="badge badge-info">En cours…</span>
    if (r.anomalies > 0) return <span className="badge badge-warn">{r.anomalies} suspect(s)</span>
    return <span className="badge badge-ok">Propre</span>
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Historique</div>
          <div className="page-sub">{records.length} fiche(s) traitée(s) · station par station</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchList}>↻ Rafraîchir</button>
          <button className="btn btn-secondary btn-sm" onClick={downloadGlobalReport}>
            Rapport global Excel
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="form-control"
            style={{ width: 220, fontSize: 12 }}
            placeholder="Rechercher station, mois…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {[
            ["all",  "Toutes"],
            ["ok",   "Sans anomalie"],
            ["warn", "Avec anomalies"],
            ["err",  "Erreurs"],
          ].map(([k, l]) => (
            <button
              key={k}
              className={`btn btn-sm ${filter === k ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(k)}
            >
              {l}
            </button>
          ))}
          <span style={{ fontSize: 12, color: "var(--ink3)", fontFamily: "var(--mono)", marginLeft: "auto" }}>
            {filtered.length} résultat(s)
          </span>
        </div>
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◈</div>
            <p>Aucune fiche dans cette catégorie</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station ID</th>
                  <th>Nom</th>
                  <th>Mois / Année</th>
                  <th>Jours extraits</th>
                  <th>Statut</th>
                  <th>Date traitement</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>
                        {r.station_id}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{r.station_nom}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                      {r.mois} {r.annee}
                    </td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 12, textAlign: "center" }}>
                      {r.jours}
                    </td>
                    <td>{statusBadge(r)}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink3)" }}>
                      {new Date(r.created_at).toLocaleString("fr-TG")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onNavigate("review")}
                          title="Vérifier et corriger"
                        >
                          Réviser
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => downloadExcel(r.id, r.station_id, r.mois, r.annee)}
                          disabled={r.status !== "ready" || downloading === r.id}
                          title="Télécharger Excel"
                        >
                          {downloading === r.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : "Excel"}
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => downloadCSV(r.id, r.station_id, r.mois, r.annee)}
                          disabled={r.status !== "ready" || downloading === r.id}
                          title="Télécharger CSV Qdata"
                        >
                          CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Progression 240 stations */}
      <div className="card">
        <div className="card-title">Progression — 240 stations</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Traitées",       val: records.filter(r => r.status === "ready").length,  color: "var(--success)" },
            { label: "Sans anomalie",  val: records.filter(r => r.status === "ready" && r.anomalies === 0).length, color: "var(--accent)" },
            { label: "Avec anomalies", val: records.filter(r => r.anomalies > 0).length,       color: "var(--warn)" },
            { label: "Restantes",      val: Math.max(0, 240 - records.filter(r => r.status === "ready").length), color: "var(--ink3)" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: "center", padding: "12px", background: "var(--bg)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (records.filter(r => r.status === "ready").length / 240) * 100).toFixed(1)}%` }}
          />
        </div>
        <div style={{ textAlign: "right", fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink3)", marginTop: 6 }}>
          {((records.filter(r => r.status === "ready").length / 240) * 100).toFixed(1)}% des 240 stations traitées
        </div>
      </div>
    </>
  )
}
