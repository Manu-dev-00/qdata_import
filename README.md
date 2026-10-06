# QData Import 🌦
### Numérisation des fiches météo → Excel → CSV → Job Qdata
**240 stations · Station par station**

---

## Architecture — 3 modules

```
qdata_import/
├── backend/
│   ├── main.py          # API FastAPI — routes upload, export, correction
│   ├── stations.py      # ← AJOUTER VOS 240 STATIONS ICI
│   ├── cleaner.py       # Module 2 — Nettoyage . , - x X calme → 0
│   ├── excel_csv.py     # Module 3 — Génération Excel + CSV Qdata
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Upload.jsx    # Sélection station + upload image
        │   ├── Review.jsx    # Grille vérification + correction manuelle
        │   ├── Records.jsx   # Historique + progression 240 stations
        │   └── Dashboard.jsx # Tableau de bord + règles nettoyage
        └── styles/global.css
```

---

## Installation

### 1. Ajouter vos 240 stations

Ouvrir `backend/stations.py` et compléter :

```python
STATIONS = [
    {"id": "TG1M001S", "nom": "Lomé Aéro"},
    {"id": "TG1M002S", "nom": "Tabligbo"},
    # ... vos 240 stations
]
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Lancer
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Utilisation — Flux station par station

### Étape 1 — Upload
1. Ouvrir l'application → **"Uploader une fiche"**
2. Sélectionner la station dans la liste (ID + Nom)
3. Choisir le mois et l'année
4. Déposer la photo ou le scan
5. Cliquer **"Lancer l'extraction"**

### Étape 2 — Vérification automatique
PaddleOCR (en local, sans clé API) lit l'image et extrait les valeurs.

**Règles de conversion automatique :**
| Caractère lu | Converti en |
|---|---|
| `.` `,` `-` `_` | `0` |
| `x` `X` `/` | `0` |
| `calme` `traces` | `0` |
| `3X` `4X` | `0` |
| `—` `–` `?` | `0` |
| Vide / espace | `0` |

### Étape 3 — Révision manuelle
- Aller dans **"Vérifier / Corriger"**
- **Cellules rouges** = valeur suspecte → cliquer pour corriger
- **Cellules jaunes** = 0 converti automatiquement → à vérifier si besoin
- **Télécharger Excel** → vérifier dans Excel avec les cellules colorées
- **Générer CSV Qdata** → fichier prêt pour le job

### Étape 4 — Export CSV
Format CSV généré (station par station) :
```
DATE;TN;TX;TMOY;RR 06:00;EVP 06:00;HR;INSOLATION
2026-01-01;25.8;33.5;29.7;0;18;92;8.2
2026-01-02;24.1;32.0;28.1;0;17;94;7.8
```

### Étape 5 — Job Qdata
Déposer le CSV dans le dossier surveillé par le job.
Le job importe automatiquement les données dans la base.

---

## API Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/stations` | Liste toutes les stations |
| POST | `/upload` | Upload image + extraction OCR |
| GET | `/records/{id}/status` | Statut du traitement |
| GET | `/records/{id}` | Données complètes |
| PATCH | `/records/{id}/cell` | Correction manuelle d'une cellule |
| GET | `/records/{id}/export/excel` | Export Excel formaté |
| GET | `/records/{id}/export/csv` | Export CSV Qdata |
| GET | `/rapport/global` | Rapport Excel toutes stations |
| GET | `/stats` | Statistiques globales |

---

## Format CSV attendu par Qdata

```
DATE;TN;TX;TMOY;RR 06:00;EVP 06:00;HR;INSOLATION
```

- **Séparateur** : `;`
- **Format date** : `YYYY-MM-DD`
- **Valeurs manquantes** : `0`
- **Pas d'ID station** dans le fichier (configuré dans le job)

---

*Développé pour l'import des données météo vers Qdata/CleanSock — 240 stations Togo*
