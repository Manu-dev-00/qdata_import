import { useState, useEffect } from "react"

export default function Review({ API, onNotify }) {
  const [records, setRecords] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]   = useState(null)
  const [editingCell, setEditingCell] = useState(null) // {date, champ}
  const [editVal, setEditVal] = useState("")
  const [exporting, setExporting] = useState(false)

  useEffect(() => { fetchList() }, [])
  useEffect(() => { if (selected) fetchDetail(selected) }, [selected])

  async function fetchList() {
    try {
      const r = await fetch(`${API}/records`)
      if (r.ok) {
        const d = await r.json()
        setRecords(d.records.filter(r => r.status === "ready"))
      }
    } catch {}
  }

  async function fetchDetail(id) {
    try {
      const r = await fetch(`${API}/records/${id}`)
      if (r.ok) setDetail(await r.json())
    } catch {}
  }

  async function saveCell(date, champ, valeur) {
    try {
      await fetch(`${API}/records/${selected}/cell`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, champ, valeur: parseFloat(valeur) || 0 })
      })
      onNotify("Valeur corrigée", "ok")
      fetchDetail(selected)
    } catch { onNotify("Erreur correction", "err") }
    setEditingCell(null)
  }

  async function downloadExcel() {
    if (!selected) return
    const r = await fetch(`${API}/records/${selected}/export/excel`)
    if (r.ok) {
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url
      a.download = `QDATA_${detail?.station_id}_${detail?.mois}_${detail?.annee}.xlsx`
      a.click(); URL.revokeObjectURL(url)
      onNotify("Excel téléchargé — vérifiez les cellules rouges", "ok")
    }
  }

  async function downloadCSV(force = false) {
    if (!selected) return
    setExporting(true)
    const url = `${API}/records/${selected}/export/csv${force ? "?valide=true" : ""}`
    const r = await fetch(url)
    if (r.ok) {
      const blob = await r.blob()
      const dl = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = dl
      a.download = `QDATA_${detail?.station_id}_${detail?.mois}_${detail?.annee}.csv`
      a.click(); URL.revokeObjectURL(dl)
      onNotify("CSV prêt pour le job Qdata", "ok")
    } else {
      const err = await r.json()
      onNotify(err.detail || "Erreur CSV", "warn")
    }
    setExporting(false)
  }

  // Construire les colonnes depuis les données
  const cols = detail?.donnees_nettoyees?.length > 0
    ? Object.keys(detail.donnees_nettoyees[0]).filter(k => k !== "DATE")
    : []

  const suspectsTotal = detail
    ? Object.values(detail.suspects_map || {}).reduce((acc, v) => acc + v.length, 0)
    : 0

  function cellClass(date, champ, val) {
    const suspects = detail?.suspects_map?.[String(date)] || []
    if (suspects.includes(champ)) return "cell-suspect"
    if (val === 0) return "cell-zero"
    return "cell-ok"
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, height: "calc(100vh - 56px)", overflow: "hidden" }}>

      {/* Liste des fiches */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        <div>
          <div className="page-title" style={{ fontSize: 18 }}>Vérifier</div>
          <div className="page-sub">Module 2 — Correction manuelle</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchList} style={{ alignSelf: "flex-start" }}>↻ Rafraîchir</button>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
          {records.length === 0 ? (
            <div className="empty"><div className="empty-icon">◎</div><p>Aucune fiche prête</p></div>
          ) : records.map(r => (
            <div key={r.id} onClick={() => setSelected(r.id)}
              style={{
                padding: "10px 12px", borderRadius: "var(--r2)", cursor: "pointer",
                border: `1px solid ${selected === r.id ? "var(--accent)" : "var(--border)"}`,
                background: selected === r.id ? "var(--accent-dim)" : "var(--bg2)",
                transition: "all .12s"
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink3)" }}>{r.mois} {r.annee}</span>
                {r.anomalies > 0
                  ? <span className="badge badge-warn">{r.anomalies} suspectes</span>
                  : <span className="badge badge-ok">Propre</span>
                }
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>{r.station_id}</div>
              <div style={{ fontSize: 11, color: "var(--ink3)" }}>{r.station_nom}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grille de vérification */}
      <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 12 }}>
        {!selected ? (
          <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="empty"><div className="empty-icon">◎</div><p>Sélectionnez une fiche</p></div>
          </div>
        ) : !detail ? (
          <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="card" style={{ padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600 }}>
                    {detail.station_id} — {detail.station_nom}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink3)", fontFamily: "var(--mono)", marginTop: 2 }}>
                    {detail.mois} {detail.annee} · {detail.donnees_nettoyees?.length} jours extraits
                    {suspectsTotal > 0 && (
                      <span style={{ marginLeft: 10, color: "var(--danger)" }}>
                        · {suspectsTotal} cellule(s) à vérifier (rouge)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={downloadExcel}>
                    Télécharger Excel
                  </button>
                  <button className="btn btn-success btn-sm" onClick={() => downloadCSV(false)} disabled={exporting}>
                    {exporting ? <div className="spinner" style={{ width: 13, height: 13 }} /> : "Générer CSV Qdata"}
                  </button>
                  {suspectsTotal > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={() => downloadCSV(true)}>
                      Forcer CSV
                    </button>
                  )}
                </div>
              </div>

              {/* Légende */}
              <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 11, fontFamily: "var(--mono)" }}>
                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#fddede", border: "1px solid #ccc", marginRight: 4 }} />Rouge = suspect — cliquer pour corriger</span>
                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#fffbe6", border: "1px solid #ccc", marginRight: 4 }} />Jaune = 0 converti automatiquement</span>
                <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f0faf2", border: "1px solid #ccc", marginRight: 4 }} />Vert = valeur valide</span>
              </div>
            </div>

            {/* Grille données */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ background: "#0d2a4a", position: "sticky", left: 0, zIndex: 2 }}>Jour</th>
                    {cols.map(c => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(detail.donnees_nettoyees || []).map(row => {
                    const date = row.DATE
                    return (
                      <tr key={date}>
                        <td className="day-cell" style={{ position: "sticky", left: 0, background: "var(--bg3)", zIndex: 1 }}>
                          {String(date).split("-").pop()}
                        </td>
                        {cols.map(champ => {
                          const val = row[champ]
                          const cls = cellClass(date, champ, val)
                          const isEditing = editingCell?.date === date && editingCell?.champ === champ

                          return (
                            <td key={champ} className={`${cls} ${isEditing ? "cell-edit" : ""}`}
                              onClick={() => {
                                if (!isEditing) {
                                  setEditingCell({ date, champ })
                                  setEditVal(String(val))
                                }
                              }}>
                              {isEditing ? (
                                <input
                                  autoFocus
                                  value={editVal}
                                  onChange={e => setEditVal(e.target.value)}
                                  onBlur={() => saveCell(date, champ, editVal)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") saveCell(date, champ, editVal)
                                    if (e.key === "Escape") setEditingCell(null)
                                  }}
                                />
                              ) : val}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
