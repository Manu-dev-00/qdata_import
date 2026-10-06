import { useState, useRef, useEffect } from "react"

const MOIS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
]

export default function Upload({ API, onNotify, onNavigate }) {
  const [stations, setStations] = useState([])
  const [stationId, setStationId] = useState("")
  const [mois, setMois] = useState("Janvier")
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [file, setFile]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recordId, setRecordId]   = useState(null)
  const [pollStatus, setPollStatus] = useState(null)
  const inputRef = useRef()
  const pollRef  = useRef()

  useEffect(() => {
    fetch(`${API}/stations`).then(r => r.json()).then(d => {
      setStations(d.stations || [])
      if (d.stations?.length > 0) setStationId(d.stations[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!recordId) return
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API}/records/${recordId}/status`)
        const d = await r.json()
        setPollStatus(d)
        if (d.status === "ready" || d.status === "error") {
          clearInterval(pollRef.current)
          if (d.status === "ready") {
            onNotify(`Extraction terminée — ${d.jours_extraits} jours, ${d.anomalies_count} anomalie(s)`, "ok")
            setTimeout(() => onNavigate("review"), 1200)
          } else {
            onNotify("Erreur lors de l'extraction", "err")
          }
        }
      } catch {}
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [recordId])

  function onDrop(e) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFileAndPreview(f)
  }

  function setFileAndPreview(f) {
    setFile(f)
    if (f.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  async function handleUpload() {
    if (!file || !stationId) return
    setUploading(true)
    setPollStatus(null)
    setRecordId(null)

    const fd = new FormData()
    fd.append("file", file)
    fd.append("station_id", stationId)
    fd.append("mois", mois)
    fd.append("annee", annee)

    try {
      const r = await fetch(`${API}/upload`, { method: "POST", body: fd })
      if (!r.ok) {
        const err = await r.json()
        onNotify(err.detail || "Erreur upload", "err")
        setUploading(false)
        return
      }
      const d = await r.json()
      setRecordId(d.record_id)
      onNotify("Image envoyée — extraction en cours…", "ok")
    } catch {
      onNotify("Impossible de joindre le serveur", "err")
    }
    setUploading(false)
  }

  const selectedStation = stations.find(s => s.id === stationId)

  return (
    <>
      <div>
        <div className="page-title">Uploader une fiche</div>
        <div className="page-sub">Module 1 — Sélectionner la station · choisir le fichier · lancer l'extraction</div>
      </div>

      {/* Sélection station */}
      <div className="card">
        <div className="card-title">Station</div>
        {stations.length === 0 ? (
          <div style={{ padding: "16px 0", color: "var(--warn)", fontFamily: "var(--mono)", fontSize: 13 }}>
            Aucune station configurée — ajoutez vos stations dans backend/stations.py
          </div>
        ) : (
          <div className="form-row form-row-3">
            <div className="form-group" style={{ gridColumn: "1 / 3" }}>
              <label className="form-label">Station</label>
              <select className="form-control" value={stationId} onChange={e => setStationId(e.target.value)}>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.id} — {s.nom}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ID Station</label>
              <input className="form-control" value={stationId} readOnly
                style={{ fontFamily: "var(--mono)", background: "var(--bg3)" }} />
            </div>
          </div>
        )}

        {selectedStation && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--accent-dim)", borderRadius: "var(--r)", fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>
            Station sélectionnée : <strong>{selectedStation.id}</strong> — {selectedStation.nom}
          </div>
        )}
      </div>

      {/* Période */}
      <div className="card">
        <div className="card-title">Période</div>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">Mois</label>
            <select className="form-control" value={mois} onChange={e => setMois(e.target.value)}>
              {MOIS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Année</label>
            <input className="form-control" type="number" value={annee}
              onChange={e => setAnnee(+e.target.value)} min={1950} max={2100} />
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="card">
        <div className="card-title">Image de la fiche</div>
        <div
          className={`dropzone ${dragging ? "over" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 6, marginBottom: 8 }} />
          ) : (
            <div className="dropzone-icon">⊕</div>
          )}
          <div className="dropzone-title">
            {file ? file.name : "Déposer ou cliquer pour sélectionner"}
          </div>
          <div className="dropzone-sub">JPG · PNG · PDF · Photo smartphone ou scan</div>
          <input ref={inputRef} type="file" hidden accept=".jpg,.jpeg,.png,.pdf"
            onChange={e => e.target.files[0] && setFileAndPreview(e.target.files[0])} />
        </div>

        {file && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink3)", fontFamily: "var(--mono)" }}>
            {file.name} · {(file.size / 1024).toFixed(0)} Ko
          </div>
        )}
      </div>

      {/* Statut extraction */}
      {pollStatus && (
        <div className="card">
          <div className="card-title">Statut extraction</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {pollStatus.status === "processing" && <div className="spinner" />}
            <div style={{ fontFamily: "var(--mono)", fontSize: 13 }}>
              {pollStatus.status === "processing" && "Claude Vision analyse l'image…"}
              {pollStatus.status === "ready" && (
                <span style={{ color: "var(--success)" }}>
                  Extraction terminée — {pollStatus.jours_extraits} jours · {pollStatus.anomalies_count} anomalie(s)
                </span>
              )}
              {pollStatus.status === "error" && (
                <span style={{ color: "var(--danger)" }}>Erreur : {pollStatus.error}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || !stationId || uploading || !!recordId}
        >
          {uploading
            ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Envoi…</>
            : "Lancer l'extraction IA"
          }
        </button>
      </div>
    </>
  )
}
