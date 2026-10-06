import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# OCR Direct
from paddleocr import PaddleOCR
import pandas as pd

# Tes modules
from stations import STATIONS, get_station, get_all_stations
from cleaner import clean_dataset
from excel_csv import generate_excel, excel_to_csv, generate_batch_report, QDATA_COLUMNS

# Configuration
UPLOAD_DIR = Path("./uploads")
EXPORT_DIR = Path("./exports")
UPLOAD_DIR.mkdir(exist_ok=True)
EXPORT_DIR.mkdir(exist_ok=True)

app = FastAPI(title="QData Import — Stations météo (OCR Local)", version="1.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_store: dict[str, dict] = {}

# Initialisation PaddleOCR
paddle_ocr = PaddleOCR(
    lang='fr',
    use_angle_cls=False,
    show_log=False
)

print("✅ PaddleOCR chargé avec succès (lang=fr)")

@app.get("/")
def root():
    return {"app": "QData Import", "version": "1.3.0", "ocr": "PaddleOCR Direct", "status": "running"}


@app.get("/stations")
def list_stations():
    return {"total": len(STATIONS), "stations": get_all_stations()}


@app.get("/stations/{station_id}")
def get_station_detail(station_id: str):
    s = get_station(station_id)
    if not s:
        raise HTTPException(404, f"Station {station_id} non trouvée")
    return s


@app.post("/upload")
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    station_id: str = Form(...),
    mois: str = Form(...),
    annee: int = Form(...),
):
    station = get_station(station_id)
    if not station:
        raise HTTPException(400, f"Station '{station_id}' inconnue")

    record_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1].lower()
    file_path = UPLOAD_DIR / f"{record_id}.{ext}"

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    _store[record_id] = {
        "id": record_id,
        "station_id": station_id,
        "station_nom": station["nom"],
        "mois": mois,
        "annee": annee,
        "file_path": str(file_path),
        "status": "processing",
        "message": "OCR en cours..."
    }

    background_tasks.add_task(_process_image_local, record_id, str(file_path), station, mois, annee)

    return {"record_id": record_id, "status": "processing"}


async def _process_image_local(record_id: str, file_path: str, station: dict, mois: str, annee: int):
    try:
        print(f"[INFO] OCR lancé pour {station.get('nom', station.get('id', 'inconnu'))}")

        # OCR avec PaddleOCR
        result = paddle_ocr.ocr(str(file_path), cls=False)

        # Extraction du texte
        extracted_text = []
        if result and result[0]:
            for line in result[0]:
                if len(line) > 1:
                    extracted_text.append(line[1][0])

        donnees_brutes = [{"raw_text": "\n".join(extracted_text)}]

        donnees_nettoyees, anomalies = clean_dataset(donnees_brutes)

        _store[record_id].update({
            "status": "ready",
            "donnees_brutes": donnees_brutes,
            "donnees_nettoyees": donnees_nettoyees,
            "anomalies": anomalies,
            "message": f"OCR terminé - {len(extracted_text)} lignes de texte détectées"
        })

        print(f"[SUCCESS] Record {record_id} traité")

    except Exception as e:
        print(f"[ERROR] {record_id}: {e}")
        _store[record_id]["status"] = "error"
        _store[record_id]["error"] = str(e)


# Routes utilitaires
@app.get("/records/{record_id}/status")
def get_status(record_id: str):
    r = _store.get(record_id)
    if not r:
        raise HTTPException(404, "Enregistrement non trouvé")
    return r


@app.get("/records")
def list_records(station_id: Optional[str] = None):
    records = list(_store.values())
    if station_id:
        records = [r for r in records if r["station_id"] == station_id]
    return {"total": len(records), "records": records}