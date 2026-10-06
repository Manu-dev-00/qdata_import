import { useState, useEffect } from "react"
import Upload from "./pages/Upload.jsx"
import Review from "./pages/Review.jsx"
import Records from "./pages/Records.jsx"
import Dashboard from "./pages/Dashboard.jsx"

const API = "http://localhost:8000"

export default function App() {
  const [page, setPage]   = useState("upload")
  const [stats, setStats] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchStats()
    const t = setInterval(fetchStats, 8000)
    return () => clearInterval(t)
  }, [])

  async function fetchStats() {
    try {
      const r = await fetch(`${API}/stats`)
      if (r.ok) setStats(await r.json())
    } catch {}
  }

  function notify(msg, type = "ok") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const nav = [
    { id: "upload",   label: "Uploader une fiche" },
    { id: "review",   label: "Vérifier / Corriger" },
    { id: "records",  label: "Historique" },
    { id: "dashboard",label: "Tableau de bord" },
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-main">QData Import</div>
          <div className="logo-sub">STATIONS MÉTÉO</div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(n => (
            <button
              key={n.id}
              className={`nav-btn ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}
            >
              {n.label}
              {n.id === "review" && stats?.avec_anomalies > 0 && (
                <span className="nav-dot" title={`${stats.avec_anomalies} à corriger`} />
              )}
            </button>
          ))}
        </nav>

        {stats && (
          <div className="sidebar-stats">
            {[
              ["Stations config.", stats.total_stations_configurees],
              ["Fiches traitées", stats.total_fiches_traitees],
              ["Prêtes", stats.pretes],
              ["Avec anomalies", stats.avec_anomalies],
            ].map(([l, v]) => (
              <div className="s-stat" key={l}>
                <span className="s-stat-label">{l}</span>
                <span className="s-stat-val">{v}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="main">
        {page === "upload"    && <Upload    API={API} onNotify={notify} onNavigate={setPage} />}
        {page === "review"    && <Review    API={API} onNotify={notify} />}
        {page === "records"   && <Records   API={API} onNotify={notify} onNavigate={setPage} />}
        {page === "dashboard" && <Dashboard API={API} stats={stats} onNavigate={setPage} />}
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  )
}
