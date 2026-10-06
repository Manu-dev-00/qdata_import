# ============================================================
#  LISTE DES STATIONS — À COMPLÉTER
#  Format : {"id": "ID_QDATA", "nom": "Nom de la station"}
#  Ajouter les 240 stations ici
# ============================================================

STATIONS = [
    # ── EXEMPLE DE FORMAT — Remplacer par vos vraies stations ──
     {"id": "TG1M001S", "nom": "Lomé Aéro"},
     {"id": "TG1M002S", "nom": "Tabligbo"},
     {"id": "TG1M003S", "nom": "Station pilote"},
     {"id": "TG1P003S", "nom": "Atakpamé"},
     {"id": "TG1P004S", "nom": "Kouma Konda"},
     {"id": "TG1P010S", "nom": "Notsé"},
     {"id": "TG1S008S", "nom": "Mango"},
     {"id": "TG1S009S", "nom": "Dapaong"},
     {"id": "TG1S012S", "nom": "Mandouri"},
    # ... (240 stations au total)
]

def get_station(station_id: str):
    for s in STATIONS:
        if s["id"] == station_id:
            return s
    return None

def get_all_stations():
    return STATIONS
