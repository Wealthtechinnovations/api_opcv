#!/usr/bin/env python3
"""
scrape_brvm_index.py — Extraction de l'indice BRVM Composite (et BRVM 30)
depuis le Bulletin Officiel de la Cote (BOC) quotidien de la BRVM.

Source officielle (regulateur CREPMF) : le BOC PDF du jour, dont la DATE est
encodee dans le nom de fichier (la "compilation par date") :
    https://bfin.brvm.org/boc/BOC_JOUR/BOC_YYYYMMDD.pdf

Ce script REUTILISE la meme source et la meme librairie (pdfplumber) que le
parseur de VL existant `brvm_boc_daily.py`. Il NE TOUCHE PAS la base de
donnees : il imprime un JSON sur stdout, et c'est le scraper Node
`scrape_indices_daily.js` qui gere l'insertion en base (logique centralisee).

Comportement :
  - HTTP 404  -> jour non ouvre (week-end / ferie)        -> {"status":"no_session"}
  - HTTP 200  -> extrait BRVM COMPOSITE de la PAGE 1 seule -> {"status":"ok", ...}
  - autre     -> {"status":"error", ...}

Usage :
  python3 scrape_brvm_index.py --date 2026-06-24
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys

try:
    import requests
except ImportError:
    requests = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

BOC_PDF_URL = "https://bfin.brvm.org/boc/BOC_JOUR/BOC_{yyyymmdd}.pdf"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
HTTP_TIMEOUT = 30


def to_num(s):
    """Parse a French/European number: '442,87' or '1 234,56' -> float."""
    if not s:
        return None
    s = s.replace(" ", " ").replace(" ", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def emit(obj):
    sys.stdout.write(json.dumps(obj))
    sys.stdout.write("\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="Date cible YYYY-MM-DD")
    args = ap.parse_args()

    if requests is None:
        emit({"status": "error", "error": "python module 'requests' indisponible"})
        return
    if pdfplumber is None:
        emit({"status": "error", "error": "python module 'pdfplumber' indisponible"})
        return

    yyyymmdd = args.date.replace("-", "")
    url = BOC_PDF_URL.format(yyyymmdd=yyyymmdd)

    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT)
    except Exception as e:  # noqa: BLE001
        emit({"status": "error", "error": f"requete: {e}", "source": url})
        return

    if resp.status_code == 404:
        emit({"status": "no_session", "date": args.date, "source": url})
        return
    if resp.status_code != 200:
        emit({"status": "error", "error": f"HTTP {resp.status_code}", "source": url})
        return

    # Parser la PAGE 1 uniquement (en-tete des indices) — rapide meme sur PDF lourd.
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            if pdf.pages:
                text = pdf.pages[0].extract_text() or ""
    except Exception as e:  # noqa: BLE001
        emit({"status": "error", "error": f"pdf parse: {e}", "source": url})
        return

    def grab(label):
        m = re.search(label + r"\s+([0-9][0-9  ]*,[0-9]+)", text, re.IGNORECASE)
        return to_num(m.group(1)) if m else None

    composite = grab(r"BRVM\s*COMPOSITE")
    brvm30 = grab(r"BRVM\s*30")

    if composite is None:
        emit({"status": "not_found", "date": args.date, "source": url})
        return

    emit({
        "status": "ok",
        "date": args.date,
        "brvm_composite": composite,
        "brvm_30": brvm30,
        "source": url,
    })


if __name__ == "__main__":
    main()
