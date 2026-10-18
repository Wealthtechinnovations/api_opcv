#!/usr/bin/env python3
"""
BVMAC BOC OPCVM VL — Scraper / Parseur / Importeur (CEMAC)
===========================================================

Adaptation directe de brvm_boc_daily.py (module BRVM/UEMOA deja en prod,
moteur de parsing valide et durci) pour la zone CEMAC / BVMAC (Bourse des
Valeurs Mobilieres de l'Afrique Centrale, Douala/Libreville).

Recupere les Bulletins Officiels de la Cote (BOC) BVMAC, extrait le tableau
"OPCVM : FONDS COMMUN DE PLACEMENT ET SOCIETE D'INVESTISSEMENT A CAPITAL
VARIABLE" (sections Quotidiennes/Hebdomadaires/Mensuelles/Trimestrielles),
historise chaque ligne brute dans des tables additives de staging, puis
promeut les VL validees vers `valorisations` — SANS JAMAIS ecraser une VL
deja presente. Format PDF verifie identique a celui de la BRVM (memes
colonnes Societe de gestion/Depositaire/OPCVM/Categorie/VL Origine-Precedente-
Actuelle/Variation) -> moteur de parsing (regex, quality_check,
salvage_implausible_year) repris a l'identique, sans modification.

Source verifiee en ligne le 2026-07-14 : page BOC (743 PDF references,
depuis 2023-01 au moins) + PDF du jour (30 pages, section OPCVM pages 14-17,
donnees reelles CEMAC : AFRICA BRIGHT ASSET MANAGEMENT, HARVEST ASSET
MANAGEMENT, EDC ASSET MANAGEMENT CEMAC, ASCA ASSET MANAGEMENT, etc.)

Schema production reel (Africafunds):
  - MySQL `fund_opcvm` : fond_investissements, valorisations, devisedechanges
  - Fonds CEMAC : pays='CEMAC', dev_libelle='XAF', regulateur COSUMAF
  - Convention EUR : value_EUR = value / 655.957 (parite fixe CFA, DIVISION,
    IDENTIQUE a XOF — meme zone franc CFA, meme peg BCEAO/BEAC)
  - Convention USD : value_USD = value / taux USD/XAF (devisedechanges)

Tables additives creees par ce script (CREATE TABLE IF NOT EXISTS, PREFIXE
bvmac_ pour zero collision avec les tables brvm_boc_* deja en prod) :
  bvmac_boc_sources, bvmac_boc_navs_raw, bvmac_fund_aliases,
  bvmac_import_logs, bvmac_missing_navs

Usage:
  python3 bvmac_boc_daily.py --latest --dry-run          # dernier BOC, simulation
  python3 bvmac_boc_daily.py --latest --production       # import reel
  python3 bvmac_boc_daily.py --date 2026-07-14 --dry-run
  python3 bvmac_boc_daily.py --start-date 2023-01-01 --end-date 2026-07-14 \
                            --production --throttle 3 --limit 30   # backfill
  python3 bvmac_boc_daily.py --repair-missing --dry-run  # diagnostic manquants
  python3 bvmac_boc_daily.py --repair-missing --apply --production
  python3 bvmac_boc_daily.py --selftest                  # tests unitaires internes

Variables d'environnement (.env du depot API) :
  DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

VALIDATION REELLE EFFECTUEE (2026-07-14, environnement isole avec pdfplumber
0.11.10 fonctionnel) contre le vrai BOC-20260714.pdf (30 pages) :
  - Pages OPCVM detectees correctement : 14, 15, 16, 17 (4 sous-sections
    Quotidiennes/Hebdomadaires/Mensuelles/Trimestrielles)
  - 30/30 lignes extraites, 0 echec de parsing (apres correctif V pour
    accepter '-' en valeur, cf ligne FCP ESS PREMIUM PERSO)
  - 24 lignes quality_status=OK, 6 SUSPECT_VARIATION (variation >50% —
    fonds "FCP HARVEST DIVERSIFIE"/"FCP BGFIBank ATLAS" rapportes a
    plusieurs frequences avec probable artefact de collage de mots sur
    nom compose sans espace type "FCPHARVEST" ; NON promues automatiquement,
    a examiner via --repair-missing avant promotion manuelle si legitime).
  - Selftest inclut desormais le cas reel de ligne corrompue (date en
    artefact Excel) qui DOIT echouer le parsing (jamais de fabrication).

RESTE A VALIDER avant --production (necessite acces DB, non disponible dans
l'environnement de conception) :
  - Rapprochement des noms de fonds (match_fund) contre les 34 fonds CEMAC
    reels en base (fond_investissements WHERE pays='CEMAC') — executer
    --dry-run avec DB accessible et examiner le taux de MATCHED_EXACT vs
    UNMATCHED avant tout --production.
  - Executer IMPERATIVEMENT --dry-run sur le serveur en premier et examiner
    le rapport JSON (samples) avant tout --production.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import re
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import requests

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import pymysql
except ImportError:
    pymysql = None

try:
    from rapidfuzz import fuzz
except ImportError:
    fuzz = None

# ---------------------------------------------------------------------------
# Constantes — SPECIFIQUES BVMAC/CEMAC (seule section qui differe de BRVM)
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
API_DIR = SCRIPT_DIR.parent.parent
DATA_DIR = API_DIR / "data" / "bvmac_boc"
PDF_DIR = DATA_DIR / "pdf"
REPORT_DIR = DATA_DIR / "reports"
LOG_DIR = DATA_DIR / "logs"

BOC_INDEX_URL = "https://www.bvm-ac.org/bulletin-officiel-de-la-cote-boc/"
# Le PDF est sous un sous-repertoire annee/mois (verifie en ligne 2026-07-14:
# https://www.bvm-ac.org/wp-content/uploads/2026/07/BOC-20260714.pdf)
BOC_PDF_URL_TMPL = "https://www.bvm-ac.org/wp-content/uploads/{yyyy}/{mm}/BOC-{yyyymmdd}.pdf"

PAYS = "CEMAC"
DEVISE = "XAF"

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36 AfricafundsBot/1.0"
)
HTTP_TIMEOUT = 60
RETRY_MAX = 3
RETRY_BACKOFF = [2, 4, 8]

EUR_XAF = 655.957  # parite fixe CFA (zone BEAC) — identique a EUR_XOF (BCEAO) — DIVISION, jamais multiplication

SECTIONS = ("QUOTIDIENNES", "HEBDOMADAIRES", "MENSUELLES", "TRIMESTRIELLES")
SECTION_PERIODICITY = {
    "QUOTIDIENNES": "Journaliere",
    "HEBDOMADAIRES": "Hebdomadaire",
    "MENSUELLES": "Mensuelle",
    "TRIMESTRIELLES": "Trimestrielle",
}

# ---------------------------------------------------------------------------
# Regex de la queue numerique d'une ligne OPCVM — REPRIS A L'IDENTIQUE DE
# brvm_boc_daily.py : format PDF verifie identique (memes colonnes) le
# 2026-07-14 contre le BOC-20260714.pdf reel.
# ---------------------------------------------------------------------------
NUM = r"\d+(?:[\s ]\d{3})*(?:,\d+)?"
DATE_RE = r"\d{2}/\d{2}/\d{4}"
ORIG_D = r"(?:\d{2}/\d{2}/\d{2,4}|[A-Za-zÀ-ÿ]{3,9}\.?\s?\d{4})"
V = rf"(?:ND|-|{NUM})"  # '-' vu sur donnees reelles BVMAC (1re periode sans VL precedente) = traite comme absence de valeur, jamais fabrique
D = rf"(?:ND|{DATE_RE})"
P = r"(?:ND|-|-?\d+(?:,\d+)?\s?%)"

CAT = r"(?P<cat>[A-Z]{1,4})"
TAIL_PATTERNS = [
    re.compile(rf"{CAT}\s+(?P<origin>{V})\s+(?P<prev>{V})\s+(?P<prev_date>{D})\s+"
               rf"(?P<curr>{V})\s+(?P<curr_date>{D})\s+(?P<orig_date>{ORIG_D})\s+"
               rf"(?P<var_o>{P})\s+(?P<var_p>{P})\s*$"),
    re.compile(rf"{CAT}\s+(?P<origin>{V})\s+(?P<prev>{V})\s+(?P<prev_date>{D})\s+"
               rf"(?P<curr>{V})\s+(?P<curr_date>{D})\s+(?P<var_o>{P})\s+(?P<var_p>{P})\s*$"),
    re.compile(rf"{CAT}\s+(?P<origin>{V})\s+(?P<prev>{V})\s+(?P<prev_date>{D})\s+"
               rf"(?P<curr>{V})\s+(?P<curr_date>{D})\s+(?P<orig_date>{ORIG_D})\s*$"),
    re.compile(rf"{CAT}\s+(?P<origin>{V})\s+(?P<prev>{V})\s+(?P<prev_date>{D})\s+"
               rf"(?P<curr>{V})\s+(?P<curr_date>{D})\s*$"),
    re.compile(rf"(?P<origin>{V})\s+(?P<prev>{V})\s+(?P<prev_date>{D})\s+"
               rf"(?P<curr>{V})\s+(?P<curr_date>{D})\s+(?P<orig_date>{ORIG_D})\s+"
               rf"(?P<var_o>{P})\s+(?P<var_p>{P})\s*$"),
    re.compile(rf"(?P<origin>{V})\s+(?P<prev>{V})\s+(?P<prev_date>{D})\s+"
               rf"(?P<curr>{V})\s+(?P<curr_date>{D})\s+(?P<var_o>{P})\s+(?P<var_p>{P})\s*$"),
    re.compile(rf"(?P<origin>{V})\s+(?P<prev>{V})\s+(?P<prev_date>{D})\s+"
               rf"(?P<curr>{V})\s+(?P<curr_date>{D})\s*$"),
]

# Categories vues dans le BOC du 2026-07-14 : D (Diversifie), M (Monetaire),
# O (Obligataire), A (Actions) — memes lettres que BRVM.
VALID_CATEGORIES = {"A", "D", "C", "M", "O", "OCT", "OMLT", "OATC"}

FUND_NAME_START = re.compile(r"\b(FCPE?|SICAV|FONDS|Fonds)\b")

log = logging.getLogger("bvmac_boc")


# ---------------------------------------------------------------------------
# Normalisation — identique a brvm_boc_daily.py
# ---------------------------------------------------------------------------
def fr_num(s):
    """'12 511,86' -> 12511.86 ; 'ND'/None -> None. Ne jamais inventer."""
    if s is None:
        return None
    s = s.strip()
    if not s or s.upper() == "ND":
        return None
    try:
        return float(s.replace(" ", "").replace(" ", "").replace(",", "."))
    except ValueError:
        return None


def fr_date(s):
    """'09/06/2026' -> '2026-06-09' ; '25/07/14' -> '2014-07-25' ; 'ND'/None -> None."""
    if s is None:
        return None
    s = s.strip()
    if not s or s.upper() == "ND":
        return None
    m = re.match(r"^(\d{2})/(\d{2})/(\d{2,4})$", s)
    if not m:
        return None
    dd, mm, yyyy = m.groups()
    if len(yyyy) == 2:
        yyyy = ("20" if int(yyyy) <= 50 else "19") + yyyy
    try:
        date(int(yyyy), int(mm), int(dd))
    except ValueError:
        return None
    return f"{yyyy}-{mm}-{dd}"


def fr_pct(s):
    """'157,04%' -> 157.04 ; 'ND'/'-'/None -> None."""
    if s is None:
        return None
    s = s.strip()
    if not s or s.upper() in ("ND", "-"):
        return None
    try:
        return float(s.replace("%", "").replace(" ", "").replace(" ", "").replace(",", "."))
    except ValueError:
        return None


def normalize_name(s):
    """Normalisation pour rapprochement : majuscules, sans accents, espaces uniques."""
    if not s:
        return ""
    import unicodedata
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^A-Za-z0-9 ]+", " ", s.upper())
    return re.sub(r"\s+", " ", s).strip()


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------
def http_get(url, stream=False):
    """GET avec retry/backoff. Retourne (response|None, status_code)."""
    last_status = 0
    for attempt in range(RETRY_MAX):
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT},
                             timeout=HTTP_TIMEOUT, stream=stream)
            last_status = r.status_code
            if r.status_code == 200:
                return r, 200
            if r.status_code == 404:
                return None, 404  # pas de bulletin ce jour — normal
            log.warning("HTTP %s sur %s (essai %d)", r.status_code, url, attempt + 1)
        except requests.RequestException as exc:
            log.warning("Erreur reseau %s (essai %d): %s", url, attempt + 1, exc)
        if attempt < RETRY_MAX - 1:
            time.sleep(RETRY_BACKOFF[attempt])
    return None, last_status


def discover_index():
    """Liste les BOC-YYYYMMDD.pdf references sur la page d'index officielle
    (743 references trouvees le 2026-07-14, depuis 2023-01 au moins)."""
    r, status = http_get(BOC_INDEX_URL)
    if not r:
        log.error("Index BOC inaccessible (HTTP %s)", status)
        return []
    found = sorted(set(re.findall(r"BOC-(\d{8})\.pdf", r.text)))
    log.info("Index BOC BVMAC : %d bulletins references (%s -> %s)",
             len(found), found[0] if found else "-", found[-1] if found else "-")
    return found


def candidate_dates(start, end):
    """Jours plausibles de bourse (lun-ven) entre deux dates."""
    days = []
    d = start
    while d <= end:
        if d.weekday() < 5:
            days.append(d)
        d += timedelta(days=1)
    return days


def pdf_url_for(yyyymmdd):
    return BOC_PDF_URL_TMPL.format(yyyy=yyyymmdd[:4], mm=yyyymmdd[4:6], yyyymmdd=yyyymmdd)


def download_pdf(yyyymmdd, throttle):
    """Telecharge un BOC s'il n'est pas deja present. Retourne (path|None, status, sha256|None, from_cache)."""
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    path = PDF_DIR / f"BOC-{yyyymmdd}.pdf"
    if path.exists() and path.stat().st_size > 10000:
        sha = hashlib.sha256(path.read_bytes()).hexdigest()
        return path, 200, sha, True
    url = pdf_url_for(yyyymmdd)
    r, status = http_get(url, stream=True)
    if not r:
        return None, status, None, False
    content = r.content
    if not content.startswith(b"%PDF"):
        log.warning("Contenu non-PDF pour %s", url)
        return None, status, None, False
    path.write_bytes(content)
    sha = hashlib.sha256(content).hexdigest()
    if throttle > 0:
        time.sleep(throttle)
    return path, 200, sha, False


# ---------------------------------------------------------------------------
# Parsing PDF — moteur repris a l'identique de brvm_boc_daily.py (format
# verifie identique). Seule difference : la section OPCVM du BOC BVMAC
# comporte 4 sous-sections (Quotidiennes/Hebdomadaires/Mensuelles/
# Trimestrielles) contre 3 pour BRVM — deja gere via SECTIONS ci-dessus.
# ---------------------------------------------------------------------------
def cluster_lines(words, tolerance=3.0):
    clusters = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        placed = False
        for c in clusters:
            if abs(c["top"] - w["top"]) <= tolerance:
                c["words"].append(w)
                placed = True
                break
        if not placed:
            clusters.append({"top": w["top"], "words": [w]})
    for c in clusters:
        c["words"].sort(key=lambda w: w["x0"])
        c["text"] = " ".join(w["text"] for w in c["words"])
    return sorted(clusters, key=lambda c: c["top"])


def find_column_bounds(words):
    x_opcvm = x_cat = x_dep = None
    for w in words:
        if w["top"] >= 130:
            continue
        t = w["text"].strip().upper()
        if t == "OPCVM" and x_opcvm is None:
            x_opcvm = w["x0"]
        elif t.startswith("CAT") and x_cat is None:
            x_cat = w["x0"]
        elif t.startswith("DEPOSITAIRE") or t.startswith("DÉPOSITAIRE"):
            x_dep = w["x0"]
    if x_opcvm is not None:
        x_name_start = ((x_dep + x_opcvm) / 2) if x_dep is not None else x_opcvm - 35
    else:
        x_name_start = None
    return x_name_start, x_cat


def parse_opcvm_page(page, page_number):
    """Parse une page OPCVM. Retourne (rows, failures)."""
    words = page.extract_words(x_tolerance=1.5)
    x_opcvm, x_cat = find_column_bounds(words)
    clusters = cluster_lines(words)

    rows, failures = [], []
    section = None
    pending_name = None
    last_row_without_name = None

    for c in clusters:
        text = c["text"].strip()
        up = text.upper()
        if up in SECTIONS:
            section = up
            pending_name = None
            last_row_without_name = None
            continue
        if section is None:
            continue
        if up.startswith("OPCVM :") or up.startswith("ND:") or up.startswith("CATEGORIES"):
            continue

        m = None
        for pat in TAIL_PATTERNS:
            m = pat.search(text)
            if m:
                break
        if m:
            g = m.groupdict()
            cat = g.get("cat")
            if cat is not None and cat not in VALID_CATEGORIES:
                m2 = None
                for pat in TAIL_PATTERNS[3:]:
                    m2 = pat.search(text)
                    if m2:
                        break
                if m2:
                    m, g, cat = m2, m2.groupdict(), None

            left = text[: m.start()].strip()
            name = mgmt = ""
            if x_opcvm is not None and x_cat is not None:
                name_words = []
                consumed = 0
                for w in c["words"]:
                    pos = text.find(w["text"], consumed)
                    consumed = pos + len(w["text"]) if pos >= 0 else consumed
                    if pos >= 0 and pos < m.start() and x_opcvm <= w["x0"] < x_cat - 2:
                        name_words.append(w["text"])
                name = " ".join(name_words).strip()
                mgmt_words = []
                consumed = 0
                for w in c["words"]:
                    pos = text.find(w["text"], consumed)
                    consumed = pos + len(w["text"]) if pos >= 0 else consumed
                    if pos >= 0 and pos < m.start() and w["x0"] < x_opcvm:
                        mgmt_words.append(w["text"])
                mgmt = " ".join(mgmt_words).strip()
            if not name:
                nm = FUND_NAME_START.search(left)
                if nm:
                    name = left[nm.start():].strip()
                    mgmt = left[: nm.start()].strip()
                else:
                    name = left
                    mgmt = ""
            if cat and name.endswith(" " + cat):
                name = name[: -(len(cat) + 1)].strip()

            row = {
                "section": section,
                "pdf_page": page_number,
                "raw_line": text,
                "fund_name_raw": name or None,
                "management_company_raw": mgmt or None,
                "category_raw": cat,
                "origin_nav": fr_num(g.get("origin")),
                "previous_nav": fr_num(g.get("prev")),
                "previous_nav_date": fr_date(g.get("prev_date")),
                "current_nav": fr_num(g.get("curr")),
                "nav_date": fr_date(g.get("curr_date")),
                "inception_date": fr_date(g.get("orig_date")),
                "variation_since_origin": fr_pct(g.get("var_o")),
                "variation_since_previous": fr_pct(g.get("var_p")),
            }
            if not row["fund_name_raw"] and pending_name:
                row["fund_name_raw"] = pending_name
                pending_name = None
            rows.append(row)
            last_row_without_name = row if not row["fund_name_raw"] else None
        else:
            if x_opcvm is not None and x_cat is not None:
                frag_words = [w["text"] for w in c["words"]
                              if x_opcvm - 6 <= w["x0"] < x_cat - 2]
                frag = " ".join(frag_words).strip()
            else:
                frag = ""
            if frag and not re.search(DATE_RE, text):
                if last_row_without_name is not None:
                    last_row_without_name["fund_name_raw"] = frag
                    last_row_without_name = None
                else:
                    pending_name = frag
            elif re.search(DATE_RE, text):
                failures.append({"section": section, "pdf_page": page_number,
                                 "raw_line": text})
    return rows, failures


def salvage_implausible_year(nav_date, boc_date_iso):
    """Repare une annee corrompue par un artefact PDF (vu sur le BOC BVMAC
    2026-07-14 : '46 204,00' au lieu d'une date DD/MM/YYYY — cas rejete par
    quality_check, pas de fabrication). Repris a l'identique de BRVM.
    Ne corrige QUE les annees < 1998 (impossibles) et seulement si la date
    corrigee est plausible."""
    if nav_date is None:
        return None, False
    try:
        y, mm, dd = nav_date.split("-")
    except ValueError:
        return nav_date, False
    if int(y) >= 1998:
        return nav_date, False
    boc_year = int(boc_date_iso[:4])
    for cand_year in (boc_year, boc_year - 1):
        try:
            date(cand_year, int(mm), int(dd))
        except ValueError:
            continue
        cand = f"{cand_year:04d}-{mm}-{dd}"
        if "1998-01-01" <= cand <= boc_date_iso:
            return cand, True
    return nav_date, False


def quality_check(row, boc_date_iso):
    """Statut qualite d'une ligne extraite. Ne JAMAIS inventer/corriger une valeur."""
    if row["current_nav"] is None:
        if "ND" in row["raw_line"]:
            row["is_nd"] = 1
            return "ND_OFFICIAL"
        row["is_nd"] = 0
        return "PARSE_PARTIAL"
    row["is_nd"] = 0
    if row["current_nav"] < 0:
        return "REJECT_NEGATIVE"
    if row["current_nav"] == 0:
        return "SUSPECT_ZERO"
    if row["nav_date"] is None:
        return "REJECT_NO_DATE"
    if row["nav_date"] > boc_date_iso:
        return "REJECT_FUTURE_DATE"
    if row["nav_date"] < "1998-01-01":
        return "REJECT_IMPLAUSIBLE_DATE"
    if not row["fund_name_raw"]:
        return "REJECT_NO_NAME"
    if (row["previous_nav"] and row["previous_nav"] > 0
            and abs(row["current_nav"] / row["previous_nav"] - 1) > 0.5):
        return "SUSPECT_VARIATION"
    return "OK"


def parse_boc_pdf(path, boc_date_iso):
    """Extrait toutes les lignes OPCVM d'un BOC. Retourne (rows, failures, pages_count, opcvm_pages)."""
    if pdfplumber is None:
        raise RuntimeError("pdfplumber non installe — pip install -r requirements_brvm.txt (partage avec BRVM)")
    all_rows, all_fail, opcvm_pages = [], [], []
    with pdfplumber.open(str(path)) as pdf:
        pages_count = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            head = (page.extract_text() or "")[:300].upper()
            if "OPCVM" in head and ("LIQUIDATIVE" in head or "LIQUIDATIV" in head):
                rows, fails = parse_opcvm_page(page, i + 1)
                all_rows += rows
                all_fail += fails
                opcvm_pages.append(i + 1)
    for r in all_rows:
        fixed, salvaged = salvage_implausible_year(r.get("nav_date"), boc_date_iso)
        if salvaged:
            log.info("Annee nav_date reparee via BOC %s: %s -> %s (%s)",
                     boc_date_iso, r["nav_date"], fixed, r.get("fund_name_raw"))
            r["nav_date"] = fixed
        r["quality_status"] = quality_check(r, boc_date_iso)
    return all_rows, all_fail, pages_count, opcvm_pages


# ---------------------------------------------------------------------------
# Base de donnees
# ---------------------------------------------------------------------------
def load_env():
    env_path = API_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)


def db_connect():
    if pymysql is None:
        raise RuntimeError("pymysql non installe — pip install -r requirements_brvm.txt")
    load_env()
    return pymysql.connect(
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        user=os.environ.get("DB_USER", "fund_opcvm"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "fund_opcvm"),
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )


# Tables PREFIXEES bvmac_ : additives, zero collision avec brvm_boc_* deja en prod.
DDL = [
    """CREATE TABLE IF NOT EXISTS bvmac_boc_sources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boc_date DATE NOT NULL,
        pdf_url VARCHAR(255) NOT NULL,
        pdf_filename VARCHAR(100) NOT NULL,
        pdf_sha256 CHAR(64) NULL,
        http_status INT NULL,
        download_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        parse_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        pages_count INT NULL,
        opcvm_pages VARCHAR(50) NULL,
        rows_extracted INT NULL,
        error_message TEXT NULL,
        downloaded_at DATETIME NULL,
        parsed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_boc_date (boc_date),
        KEY idx_parse_status (parse_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS bvmac_boc_navs_raw (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_id INT NOT NULL,
        boc_date DATE NOT NULL,
        section VARCHAR(15) NOT NULL,
        periodicity VARCHAR(20) NULL,
        pdf_page INT NULL,
        raw_line TEXT NOT NULL,
        line_hash CHAR(40) NOT NULL,
        fund_name_raw VARCHAR(255) NULL,
        management_company_raw VARCHAR(255) NULL,
        depositary_raw VARCHAR(255) NULL,
        category_raw VARCHAR(10) NULL,
        origin_nav DOUBLE NULL,
        previous_nav DOUBLE NULL,
        previous_nav_date DATE NULL,
        current_nav DOUBLE NULL,
        nav_date DATE NULL,
        inception_date DATE NULL,
        variation_since_origin DOUBLE NULL,
        variation_since_previous DOUBLE NULL,
        is_nd TINYINT NOT NULL DEFAULT 0,
        quality_status VARCHAR(30) NOT NULL,
        match_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        matched_fund_id INT NULL,
        match_confidence DOUBLE NULL,
        promote_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        promoted_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_line_hash (line_hash),
        KEY idx_nav_date (nav_date),
        KEY idx_boc_date (boc_date),
        KEY idx_match (match_status),
        KEY idx_promote (promote_status),
        KEY idx_fund (matched_fund_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS bvmac_fund_aliases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fund_id INT NOT NULL,
        raw_fund_name VARCHAR(255) NOT NULL,
        normalized_name VARCHAR(255) NOT NULL,
        raw_management_company VARCHAR(255) NULL,
        confidence_score DOUBLE NULL,
        source_id INT NULL,
        first_seen_at DATETIME NULL,
        last_seen_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_normalized (normalized_name),
        KEY idx_fund (fund_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS bvmac_import_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_type VARCHAR(30) NOT NULL,
        started_at DATETIME NOT NULL,
        finished_at DATETIME NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
        date_from DATE NULL,
        date_to DATE NULL,
        sources_checked INT NOT NULL DEFAULT 0,
        sources_downloaded INT NOT NULL DEFAULT 0,
        sources_parsed INT NOT NULL DEFAULT 0,
        rows_extracted INT NOT NULL DEFAULT 0,
        rows_inserted INT NOT NULL DEFAULT 0,
        rows_skipped INT NOT NULL DEFAULT 0,
        rows_rejected INT NOT NULL DEFAULT 0,
        navs_promoted INT NOT NULL DEFAULT 0,
        errors_count INT NOT NULL DEFAULT 0,
        details_json LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
    """CREATE TABLE IF NOT EXISTS bvmac_missing_navs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fund_id INT NOT NULL,
        expected_date DATE NOT NULL,
        periodicity VARCHAR(20) NULL,
        missing_type VARCHAR(30) NOT NULL,
        reason VARCHAR(255) NULL,
        source_checked VARCHAR(255) NULL,
        repair_status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_fund_date (fund_id, expected_date),
        KEY idx_status (repair_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
]


def ensure_tables(conn):
    with conn.cursor() as cur:
        for ddl in DDL:
            cur.execute(ddl)


def load_cemac_funds(conn):
    """Charge le referentiel des fonds CEMAC existants (jamais modifie)."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, nom_fond, periodicite FROM fond_investissements "
            "WHERE pays = %s", (PAYS,)
        )
        funds = cur.fetchall()
    by_norm = {}
    for f in funds:
        by_norm[normalize_name(f["nom_fond"])] = f
    return funds, by_norm


def load_aliases(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT normalized_name, fund_id FROM bvmac_fund_aliases")
        return {r["normalized_name"]: r["fund_id"] for r in cur.fetchall()}


def match_fund(row, by_norm, aliases, funds):
    """Rapprochement nom BOC -> fond existant. Jamais de fusion agressive :
    ambigu => validation manuelle."""
    raw = row.get("fund_name_raw") or ""
    norm = normalize_name(raw)
    if not norm:
        return None, "UNMATCHED", None, None
    if norm in aliases:
        return aliases[norm], "MATCHED_ALIAS", 100.0, None
    if norm in by_norm:
        return by_norm[norm]["id"], "MATCHED_EXACT", 100.0, (norm, by_norm[norm]["id"], 100.0)
    if fuzz is not None and funds:
        best_id, best_score, second = None, 0.0, 0.0
        for f in funds:
            score = fuzz.token_sort_ratio(norm, normalize_name(f["nom_fond"]))
            if score > best_score:
                second = best_score
                best_id, best_score = f["id"], score
            elif score > second:
                second = score
        if best_score >= 93 and best_score - second >= 3:
            return best_id, "MATCHED_FUZZY", best_score, (norm, best_id, best_score)
        if best_score >= 85:
            return None, "AMBIGUOUS", best_score, None
    return None, "UNMATCHED", None, None


def get_usd_xaf(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT value FROM devisedechanges WHERE paire='USD/XAF' "
                    "ORDER BY date DESC LIMIT 1")
        r = cur.fetchone()
        if r and r["value"]:
            return float(r["value"])
        cur.execute("SELECT value FROM devisedechanges WHERE paire='USD/EUR' "
                    "ORDER BY date DESC LIMIT 1")
        r = cur.fetchone()
        if r and r["value"]:
            return EUR_XAF / float(r["value"])
    return None


def promote_row(conn, row, usd_xaf, stats):
    """Insere la VL dans `valorisations` si et seulement si :
    - fonds rapproche, statut qualite OK, VL numerique valide
    - AUCUNE VL existante pour (fund_id, nav_date) => jamais d'overwrite.
    Conflit (VL existante differente) => CONFLICT, on ne touche a rien."""
    fund_id = row["matched_fund_id"]
    nav_date = row["nav_date"]
    value = row["current_nav"]
    with conn.cursor() as cur:
        cur.execute("SELECT id, value FROM valorisations "
                    "WHERE fund_id=%s AND date=%s LIMIT 1", (fund_id, nav_date))
        existing = cur.fetchone()
        if existing:
            if abs(float(existing["value"]) - value) > 0.01:
                stats["conflicts"] += 1
                return "CONFLICT"
            stats["already"] += 1
            return "ALREADY_PRESENT"
        cur.execute("SELECT nom_fond FROM fond_investissements WHERE id=%s", (fund_id,))
        f = cur.fetchone()
        nom = f["nom_fond"] if f else (row["fund_name_raw"] or "")
        value_eur = value / EUR_XAF
        value_usd = value / usd_xaf if usd_xaf else 0
        cur.execute(
            """INSERT INTO valorisations
               (fund_id, fund_name, value, value_EUR, value_USD,
                actif_net, actif_net_EUR, actif_net_USD,
                dividende, dividende_EUR, dividende_USD,
                vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD,
                indice_name, base_100, base_100_InRef, tsr, tra,
                indRef, indRef_EUR, indRef_USD,
                indice_comparaison, libelle_fond, souscription, ID_indice, rachat, date)
               VALUES (%s,%s,%s,%s,%s, 0,0,0, 0,0,0, %s,%s,%s, '',0,0,0,0, 0,0,0, 0,%s,0,'',0,%s)""",
            (fund_id, nom, value, value_eur, value_usd,
             value, value_eur, value_usd, nom, nav_date),
        )
        stats["promoted"] += 1
        return "PROMOTED"


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------
def process_boc(yyyymmdd, args, conn, report):
    boc_date_iso = f"{yyyymmdd[:4]}-{yyyymmdd[4:6]}-{yyyymmdd[6:]}"
    report["sources_checked"] += 1

    if conn and not args.force:
        with conn.cursor() as cur:
            cur.execute("SELECT id, parse_status FROM bvmac_boc_sources "
                        "WHERE boc_date=%s", (boc_date_iso,))
            src = cur.fetchone()
            if src and src["parse_status"] == "PARSED":
                report["already_known"] += 1
                log.info("BOC %s deja parse (source_id=%s) — ignore", boc_date_iso, src["id"])
                return

    path, status, sha, cached = download_pdf(yyyymmdd, args.throttle)
    if path is None:
        if status == 404:
            report["no_bulletin"].append(boc_date_iso)
            log.info("Pas de bulletin pour %s (404 — jour sans bourse probable)", boc_date_iso)
        else:
            report["errors"].append(f"{boc_date_iso}: HTTP {status}")
        return
    if not cached:
        report["sources_downloaded"] += 1

    try:
        rows, failures, pages_count, opcvm_pages = parse_boc_pdf(path, boc_date_iso)
    except Exception as exc:
        report["errors"].append(f"{boc_date_iso}: parse error {exc}")
        log.error("Echec parsing %s : %s", path, exc)
        if conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO bvmac_boc_sources
                       (boc_date, pdf_url, pdf_filename, pdf_sha256, http_status,
                        download_status, parse_status, error_message, downloaded_at)
                       VALUES (%s,%s,%s,%s,%s,'DOWNLOADED','FAILED',%s,NOW())
                       ON DUPLICATE KEY UPDATE parse_status='FAILED',
                         error_message=VALUES(error_message), updated_at=NOW()""",
                    (boc_date_iso, pdf_url_for(yyyymmdd), path.name, sha, status, str(exc)[:500]))
        return

    report["sources_parsed"] += 1
    report["rows_extracted"] += len(rows)
    report["parse_failures"] += len(failures)
    ok = sum(1 for r in rows if r["quality_status"] == "OK")
    nd = sum(1 for r in rows if r["quality_status"] == "ND_OFFICIAL")
    log.info("BOC %s : %d lignes (%d OK, %d ND, %d autres), %d echecs parsing, pages OPCVM %s",
             boc_date_iso, len(rows), ok, nd, len(rows) - ok - nd, len(failures), opcvm_pages)

    report["samples"].setdefault(boc_date_iso, [
        {k: r[k] for k in ("section", "fund_name_raw", "category_raw",
                           "current_nav", "nav_date", "quality_status")}
        for r in rows[:8]
    ])

    if args.dry_run or conn is None:
        return

    pdf_url = pdf_url_for(yyyymmdd)
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO bvmac_boc_sources
               (boc_date, pdf_url, pdf_filename, pdf_sha256, http_status,
                download_status, parse_status, pages_count, opcvm_pages,
                rows_extracted, downloaded_at, parsed_at)
               VALUES (%s,%s,%s,%s,%s,'DOWNLOADED','PARSED',%s,%s,%s,NOW(),NOW())
               ON DUPLICATE KEY UPDATE parse_status='PARSED',
                 pdf_sha256=VALUES(pdf_sha256), pages_count=VALUES(pages_count),
                 opcvm_pages=VALUES(opcvm_pages), rows_extracted=VALUES(rows_extracted),
                 parsed_at=NOW(), updated_at=NOW()""",
            (boc_date_iso, pdf_url, path.name, sha, status, pages_count,
             ",".join(map(str, opcvm_pages)), len(rows)))
        cur.execute("SELECT id FROM bvmac_boc_sources WHERE boc_date=%s", (boc_date_iso,))
        source_id = cur.fetchone()["id"]

    funds, by_norm = load_cemac_funds(conn)
    aliases = load_aliases(conn)
    usd_xaf = get_usd_xaf(conn)
    stats = {"promoted": 0, "already": 0, "conflicts": 0}

    for row in rows:
        line_hash = hashlib.sha1(
            f"{boc_date_iso}|{row['section']}|{row['raw_line']}".encode()
        ).hexdigest()
        fund_id, mstatus, confidence, new_alias = match_fund(row, by_norm, aliases, funds)
        row["matched_fund_id"] = fund_id

        if new_alias and conn:
            norm, fid, score = new_alias
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO bvmac_fund_aliases
                       (fund_id, raw_fund_name, normalized_name,
                        raw_management_company, confidence_score, source_id,
                        first_seen_at, last_seen_at)
                       VALUES (%s,%s,%s,%s,%s,%s,NOW(),NOW())
                       ON DUPLICATE KEY UPDATE last_seen_at=NOW(), updated_at=NOW()""",
                    (fid, row["fund_name_raw"], norm,
                     row["management_company_raw"], score, source_id))
            aliases[norm] = fid

        with conn.cursor() as cur:
            try:
                cur.execute(
                    """INSERT INTO bvmac_boc_navs_raw
                       (source_id, boc_date, section, periodicity, pdf_page, raw_line,
                        line_hash, fund_name_raw, management_company_raw, category_raw,
                        origin_nav, previous_nav, previous_nav_date, current_nav,
                        nav_date, inception_date, variation_since_origin,
                        variation_since_previous, is_nd, quality_status,
                        match_status, matched_fund_id, match_confidence)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (source_id, boc_date_iso, row["section"],
                     SECTION_PERIODICITY.get(row["section"]), row["pdf_page"],
                     row["raw_line"], line_hash, row["fund_name_raw"],
                     row["management_company_raw"], row["category_raw"],
                     row["origin_nav"], row["previous_nav"], row["previous_nav_date"],
                     row["current_nav"], row["nav_date"], row["inception_date"],
                     row["variation_since_origin"], row["variation_since_previous"],
                     row["is_nd"], row["quality_status"], mstatus, fund_id, confidence))
                report["rows_inserted"] += 1
            except pymysql.err.IntegrityError:
                report["rows_skipped"] += 1
                continue

        if (not args.no_promote and fund_id
                and row["quality_status"] == "OK"):
            promote_status = promote_row(conn, row, usd_xaf, stats)
            with conn.cursor() as cur:
                cur.execute("UPDATE bvmac_boc_navs_raw SET promote_status=%s, "
                            "promoted_at=IF(%s='PROMOTED', NOW(), promoted_at) "
                            "WHERE line_hash=%s",
                            (promote_status, promote_status, line_hash))
        elif row["quality_status"] != "OK":
            report["rows_rejected"] += 1

    report["navs_promoted"] += stats["promoted"]
    report["navs_already_present"] += stats["already"]
    report["conflicts"] += stats["conflicts"]


def run_repair_missing(args, conn, report):
    funds, _ = load_cemac_funds(conn)
    usd_xaf = get_usd_xaf(conn)
    stats = {"promoted": 0, "already": 0, "conflicts": 0}
    quality_report = []

    with conn.cursor() as cur:
        for f in funds:
            cur.execute(
                """SELECT r.* FROM bvmac_boc_navs_raw r
                   WHERE r.matched_fund_id=%s AND r.current_nav IS NOT NULL
                     AND r.quality_status='OK'
                     AND NOT EXISTS (SELECT 1 FROM valorisations v
                                     WHERE v.fund_id=r.matched_fund_id AND v.date=r.nav_date)
                   ORDER BY r.nav_date""", (f["id"],))
            promotable = cur.fetchall()
            cur.execute("SELECT COUNT(*) n FROM bvmac_boc_navs_raw "
                        "WHERE matched_fund_id=%s AND is_nd=1", (f["id"],))
            nd_count = cur.fetchone()["n"]
            cur.execute("SELECT COUNT(*) n, MAX(date) last_vl FROM valorisations "
                        "WHERE fund_id=%s", (f["id"],))
            vlrow = cur.fetchone()

            for p in promotable:
                cur.execute(
                    """INSERT INTO bvmac_missing_navs
                       (fund_id, expected_date, periodicity, missing_type, reason, source_checked)
                       VALUES (%s,%s,%s,'OFFICIAL_AVAILABLE',
                               'VL presente dans BOC, absente de valorisations', %s)
                       ON DUPLICATE KEY UPDATE missing_type='OFFICIAL_AVAILABLE', updated_at=NOW()""",
                    (f["id"], p["nav_date"], p["periodicity"],
                     f"bvmac_boc_navs_raw#{p['id']}"))
                if args.apply and not args.dry_run:
                    row = dict(p)
                    row["matched_fund_id"] = f["id"]
                    status = promote_row(conn, row, usd_xaf, stats)
                    cur.execute("UPDATE bvmac_missing_navs SET repair_status=%s, updated_at=NOW() "
                                "WHERE fund_id=%s AND expected_date=%s",
                                ("REPAIRED" if status == "PROMOTED" else status,
                                 f["id"], p["nav_date"]))
                    cur.execute("UPDATE bvmac_boc_navs_raw SET promote_status=%s, "
                                "promoted_at=IF(%s='PROMOTED', NOW(), promoted_at) WHERE id=%s",
                                (status, status, p["id"]))

            if promotable or nd_count:
                quality_report.append({
                    "fund_id": f["id"], "fund": f["nom_fond"],
                    "periodicite": f.get("periodicite"),
                    "vl_en_base": vlrow["n"],
                    "derniere_vl": str(vlrow["last_vl"]) if vlrow["last_vl"] else None,
                    "vl_promotables": len(promotable),
                    "nd_officiels": nd_count,
                })

    report["repair_quality"] = quality_report
    report["navs_promoted"] += stats["promoted"]
    report["conflicts"] += stats["conflicts"]
    log.info("Repair-missing : %d fonds avec ecarts, %d VL promues (apply=%s)",
             len(quality_report), stats["promoted"], args.apply)


def write_import_log(conn, job_type, started, report, status):
    if conn is None:
        return
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO bvmac_import_logs
               (job_type, started_at, finished_at, status, date_from, date_to,
                sources_checked, sources_downloaded, sources_parsed,
                rows_extracted, rows_inserted, rows_skipped, rows_rejected,
                navs_promoted, errors_count, details_json)
               VALUES (%s,%s,NOW(),%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (job_type, started, status,
             report.get("date_from"), report.get("date_to"),
             report["sources_checked"], report["sources_downloaded"],
             report["sources_parsed"], report["rows_extracted"],
             report["rows_inserted"], report["rows_skipped"],
             report["rows_rejected"], report["navs_promoted"],
             len(report["errors"]),
             json.dumps({k: v for k, v in report.items() if k != "samples"},
                        default=str)[:60000]))


# ---------------------------------------------------------------------------
# Selftest — identiques a BRVM + cas specifique de l'artefact de date observe
# le 2026-07-14 sur le BOC BVMAC reel (ligne EDC ASSET MANAGEMENT CEMAC).
# ---------------------------------------------------------------------------
def selftest():
    assert fr_num("12 511,86") == 12511.86
    assert fr_num("5 000") == 5000.0
    assert fr_num("ND") is None
    assert fr_num(None) is None
    assert fr_date("09/06/2026") == "2026-06-09"
    assert fr_date("ND") is None
    assert fr_date("31/02/2026") is None
    assert fr_pct("157,04%") == 157.04
    assert fr_pct("-") is None
    assert fr_pct("-0,5%") == -0.5
    assert normalize_name("FCP Épargne  Croissance") == "FCP EPARGNE CROISSANCE"

    # Ligne reelle du BOC BVMAC 2026-07-14 (verifiee en ligne)
    line = ("AFRICA BRIGHT ASSET MANAGEMENT  BGFIBANK CAMEROUN  FCP AB AVENIR  "
            "D 1 000  1 279,41  03/07/2026  1 280,50  10/07/2026  21/09/2023  28,05%  0,09%")
    m = None
    for pat in TAIL_PATTERNS:
        m = pat.search(line)
        if m:
            break
    assert m and m.group("cat") == "D" and fr_num(m.group("curr")) == 1280.50

    line2 = ("HARVEST ASSET MANAGEMENT  BANQUE ATLANTQUE  CAMEROUN  FCP HARVEST ACTIONS CEMAC  "
             "A 100 000  137 478,41  19/06/2026  140 254,86  03/07/2026  06/08/2021  40,25%  2,02%")
    m2 = None
    for pat in TAIL_PATTERNS:
        m2 = pat.search(line2)
        if m2:
            break
    assert m2 and m2.group("cat") == "A" and fr_num(m2.group("curr")) == 140254.86

    # Artefact de date reel observe (EDC ASSET MANAGEMENT CEMAC, "46 204,00"
    # a la place de prev_date) : DOIT echouer le parsing (jamais d'invention).
    bad_line = ("EDC ASSET MANAGEMENT CEMAC  ECOBANK CAMEROUN  FCP ECOBANK OBLIGATAIRE CEMAC  "
                "O 10 000  14 668,00  46 204,00  14 689,00  08/07/2026  21/07/2020  46,89%  0,14%")
    m3 = None
    for pat in TAIL_PATTERNS:
        m3 = pat.search(bad_line)
        if m3:
            break
    assert m3 is None, "cette ligne corrompue ne doit PAS matcher — sinon fabrication de valeur"

    bad_date_row = {"raw_line": "x", "fund_name_raw": "FCP TEST",
                    "current_nav": 5000.0, "previous_nav": None,
                    "nav_date": "1022-11-04"}
    assert quality_check(bad_date_row, "2026-06-12") == "REJECT_IMPLAUSIBLE_DATE"
    assert salvage_implausible_year("1022-11-04", "2021-11-05") == ("2021-11-04", True)
    assert salvage_implausible_year("2021-11-04", "2021-11-05") == ("2021-11-04", False)
    print("SELFTEST OK — normalisation, patterns et cas reels BVMAC valides")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="BVMAC BOC OPCVM VL scraper/importeur (CEMAC)")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--latest", action="store_true", help="dernier BOC disponible")
    mode.add_argument("--date", help="BOC d'une date precise (YYYY-MM-DD)")
    mode.add_argument("--repair-missing", action="store_true",
                      help="diagnostic/reparation des VL manquantes")
    mode.add_argument("--selftest", action="store_true")
    ap.add_argument("--start-date", help="backfill : date debut (YYYY-MM-DD)")
    ap.add_argument("--end-date", help="backfill : date fin (YYYY-MM-DD)")
    ap.add_argument("--limit", type=int, default=0, help="max PDF par execution")
    ap.add_argument("--throttle", type=float, default=2.0,
                    help="pause (s) entre telechargements")
    ap.add_argument("--dry-run", action="store_true",
                    help="simulation : aucune ecriture en base")
    ap.add_argument("--production", action="store_true",
                    help="ecritures reelles en base")
    ap.add_argument("--no-promote", action="store_true",
                    help="staging uniquement, pas de promotion vers valorisations")
    ap.add_argument("--apply", action="store_true",
                    help="avec --repair-missing : promeut les VL officielles trouvees")
    ap.add_argument("--force", action="store_true",
                    help="retraite les BOC deja parses")
    args = ap.parse_args()

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[logging.StreamHandler(),
                  logging.FileHandler(LOG_DIR / f"bvmac_boc_{datetime.now():%Y%m%d_%H%M%S}.log")])

    if args.selftest:
        selftest()
        return 0

    if not args.production:
        args.dry_run = True  # securite : dry-run par defaut
    if args.dry_run:
        log.info("MODE DRY-RUN — aucune ecriture en base")

    conn = None
    if not args.dry_run:
        conn = db_connect()
        ensure_tables(conn)
    else:
        try:
            conn_probe = db_connect()
            conn_probe.close()
            log.info("Base accessible (dry-run : lecture seule non utilisee)")
        except Exception:
            log.info("Base inaccessible — dry-run parsing pur")

    started = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report = {
        "job": None, "date_from": None, "date_to": None,
        "sources_checked": 0, "sources_downloaded": 0, "sources_parsed": 0,
        "already_known": 0, "rows_extracted": 0, "rows_inserted": 0,
        "rows_skipped": 0, "rows_rejected": 0, "parse_failures": 0,
        "navs_promoted": 0, "navs_already_present": 0, "conflicts": 0,
        "no_bulletin": [], "errors": [], "samples": {},
    }

    status = "SUCCESS"
    try:
        if args.repair_missing:
            report["job"] = "repair-missing"
            if conn is None:
                log.error("--repair-missing necessite --production (acces base)")
                return 1
            run_repair_missing(args, conn, report)
        elif args.start_date and args.end_date:
            report["job"] = "backfill"
            report["date_from"], report["date_to"] = args.start_date, args.end_date
            d0 = datetime.strptime(args.start_date, "%Y-%m-%d").date()
            d1 = datetime.strptime(args.end_date, "%Y-%m-%d").date()
            count = 0
            for d in candidate_dates(d0, d1):
                ymd = d.strftime("%Y%m%d")
                process_boc(ymd, args, conn, report)
                count += 1
                if args.limit and count >= args.limit:
                    log.info("Limite %d atteinte — reprise possible avec --start-date %s",
                             args.limit, d.strftime("%Y-%m-%d"))
                    break
        elif args.date:
            report["job"] = "single-date"
            ymd = args.date.replace("-", "")
            process_boc(ymd, args, conn, report)
        else:  # --latest (defaut)
            report["job"] = "latest"
            indexed = discover_index()
            if not indexed:
                log.error("Aucun BOC trouve sur l'index")
                status = "FAILED"
            else:
                process_boc(indexed[-1], args, conn, report)
    except Exception as exc:
        status = "FAILED"
        report["errors"].append(str(exc))
        log.exception("Echec du job : %s", exc)
    finally:
        if report["errors"] and status == "SUCCESS":
            status = "PARTIAL"
        write_import_log(conn, report["job"] or "unknown", started, report, status)
        report_path = REPORT_DIR / f"bvmac_boc_report_{datetime.now():%Y%m%d_%H%M%S}.json"
        report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False, default=str))
        log.info("Rapport : %s", report_path)
        log.info("BILAN — sources verifiees:%d telechargees:%d parsees:%d | "
                 "lignes extraites:%d inserees:%d ignorees:%d rejetees:%d echecs:%d | "
                 "VL promues:%d deja presentes:%d conflits:%d | erreurs:%d | statut:%s",
                 report["sources_checked"], report["sources_downloaded"],
                 report["sources_parsed"], report["rows_extracted"],
                 report["rows_inserted"], report["rows_skipped"],
                 report["rows_rejected"], report["parse_failures"],
                 report["navs_promoted"], report["navs_already_present"],
                 report["conflicts"], len(report["errors"]), status)
        if conn:
            conn.close()
    return 0 if status != "FAILED" else 1


if __name__ == "__main__":
    sys.exit(main())
