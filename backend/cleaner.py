import re
from typing import Any

# ============================================================
#  MODULE 2 — NETTOYEUR DE CARACTÈRES SPÉCIAUX
#  Convertit en 0 : . , - _ x X calme traces / blancs 3X 4X
# ============================================================

# Valeurs textuelles à remplacer par 0
ZERO_VALUES = {
    ".", ",", "-", "_",
    "x", "X", "/",
    "calme", "CALME", "Calme",
    "traces", "TRACES", "Traces", "trace", "Trace", "TRACE",
    "nul", "NUL", "Nul",
    "néant", "NÉANT", "neant", "NEANT",
    "—", "–", "−",
    "nd", "ND", "n/d", "N/D",
    "nr", "NR", "n/r", "N/R",
    "*", "#", "?",
}

# Patterns regex à remplacer par 0
ZERO_PATTERNS = [
    r"^\d+[xX]$",        # 3X, 4X, 2x, etc.
    r"^[xX]+$",          # x, X, xx, XX
    r"^\s*$",            # vide / espaces
    r"^[-_./,]+$",       # combinaisons de séparateurs
    r"^[<>]\s*\d+$",     # <0.1, >100
    r"^tr\.?$",          # tr, tr.  (traces)
    r"^t\.?r\.?$",       # t.r.
]


def clean_value(val: Any) -> Any:
    """
    Nettoie une valeur individuelle.
    - Si texte spécial → retourne 0
    - Si numérique → retourne la valeur telle quelle
    - Si None/vide → retourne 0
    """
    if val is None:
        return 0

    # Déjà un nombre valide
    if isinstance(val, (int, float)):
        return val

    s = str(val).strip()

    # Vide
    if not s:
        return 0

    # Vérifie les valeurs textuelles connues
    if s in ZERO_VALUES:
        return 0

    # Vérifie les patterns regex
    for pattern in ZERO_PATTERNS:
        if re.match(pattern, s, re.IGNORECASE):
            return 0

    # Tente conversion numérique
    # Gère la virgule comme séparateur décimal
    s_num = s.replace(",", ".").replace(" ", "")
    try:
        return float(s_num)
    except ValueError:
        pass

    # Valeur non reconnue → 0 (et sera signalée comme suspecte)
    return 0


def is_suspicious(val: Any) -> bool:
    """
    Retourne True si la valeur originale est suspecte
    (non numérique et non dans la liste des valeurs connues).
    Utilisé pour colorer les cellules en rouge dans Excel.
    """
    if val is None:
        return False
    if isinstance(val, (int, float)):
        return False
    s = str(val).strip()
    if not s or s in ZERO_VALUES:
        return False
    for pattern in ZERO_PATTERNS:
        if re.match(pattern, s, re.IGNORECASE):
            return False
    try:
        float(s.replace(",", ".").replace(" ", ""))
        return False
    except ValueError:
        return True


def clean_row(row: dict) -> tuple[dict, list[str]]:
    """
    Nettoie toutes les valeurs d'une ligne.
    Retourne (ligne_nettoyée, liste_champs_suspects).
    """
    cleaned = {}
    suspects = []
    for key, val in row.items():
        if key == "DATE":
            cleaned[key] = val
            continue
        if is_suspicious(val):
            suspects.append(key)
        cleaned[key] = clean_value(val)
    return cleaned, suspects


def clean_dataset(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Nettoie un jeu de données complet.
    Retourne (données_nettoyées, rapport_anomalies).
    """
    cleaned_rows = []
    anomalies = []
    for row in rows:
        cleaned, suspects = clean_row(row)
        cleaned_rows.append(cleaned)
        if suspects:
            anomalies.append({
                "date": row.get("DATE", "?"),
                "champs_suspects": suspects,
                "valeurs_originales": {k: row[k] for k in suspects}
            })
    return cleaned_rows, anomalies
