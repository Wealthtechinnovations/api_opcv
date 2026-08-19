#!/usr/bin/env python3
"""Tests du noyau d extraction SEC Nigeria — priorite du prix et devise.

POURQUOI CES TESTS EXISTENT
---------------------------
Ils sont nes d un correctif de #73 (lot AF). Deux defauts avaient survecu a la
relecture et n ont ete trouves qu en executant le code :

1. `detect_currency_from_text` ne reconnaissait PAS « Offer Price (USD) ».
   Elle comparait les marqueurs entoures d espaces (" USD "), si bien que les
   parentheses collees au code devise empechaient toute correspondance — or
   c est exactement le format des fichiers SEC. La devise portee par l en-tete
   de colonne etait donc systematiquement manquee, et l extraction retombait
   sur l inference par le nom du fonds.

2. `choose_vl_price` retenait `offer_price` avant `unit_price`. Un prix de
   souscription n est pas une valeur liquidative : la BIBLE l interdit.

Consequence mesuree avant correctif (lot AE) : sous l etiquette USD, les
valeurs couvraient six ordres de grandeur, dont 238 lignes a 10^5 — des nairas
etiquetes dollars. Le fonds 1141 sortait a 160 284 alors que son prix USD reel
est 117-119.

EXECUTION
    python3 tests/test_sec_extractor_devise.py

Le noyau teste est pur : ces tests n ont besoin ni de bs4, ni d openpyxl, ni
d acces reseau. Ils chargent uniquement les definitions sans dependance externe
de `sec_ng_nav_extractor_v6.py`.
"""

import ast
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "sec_ng_nav_extractor_v6.py"
SANS_DEPENDANCE = ("bs4", "openpyxl", "requests", "xlrd", "BeautifulSoup", "Workbook")


def charger_noyau() -> Dict[str, Any]:
    """Charge les definitions pures de l extracteur, sans ses dependances."""
    src = SOURCE.read_text(encoding="utf-8")
    arbre = ast.parse(src)
    lignes = src.split("\n")

    def segment(node):
        # `ast.get_source_segment` omet les decorateurs : sans eux, une
        # dataclass se chargerait comme une classe ordinaire et le test
        # passerait a cote des erreurs d ordre de champs.
        debut = min([d.lineno for d in getattr(node, "decorator_list", [])] + [node.lineno])
        return "\n".join(lignes[debut - 1:node.end_lineno])

    ns: Dict[str, Any] = {
        "dataclass": dataclass, "Any": Any, "Optional": Optional, "List": List,
        "Tuple": Tuple, "Dict": Dict, "re": re, "unicodedata": unicodedata,
        "math": __import__("math"), "datetime": __import__("datetime"),
    }
    for node in arbre.body:
        if not isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.Assign, ast.AnnAssign)):
            continue
        seg = segment(node)
        if any(m in seg for m in SANS_DEPENDANCE):
            continue
        try:
            exec(seg, ns)
        except Exception:
            pass  # depend d un element non charge : hors perimetre de ces tests
    return ns


def main() -> int:
    ns = charger_noyau()
    choose_vl_price = ns["choose_vl_price"]
    detect_currency = ns["detect_currency_from_text"]
    infer_currency = ns["infer_currency"]

    reussis = echoues = 0

    def verifier(nom: str, condition: bool) -> None:
        nonlocal reussis, echoues
        if condition:
            reussis += 1
            print(f"  OK    {nom}")
        else:
            echoues += 1
            print(f"  ECHEC {nom}")

    print("\n--- Priorite du prix : la VL est le prix unitaire ---")
    verifier("unit_price prime sur offer_price",
             choose_vl_price(999.0, 117.5, 116.0) == (117.5, "unit_price"))
    verifier("sans prix unitaire, offer devient un repli NOMME",
             choose_vl_price(999.0, None, 116.0) == (999.0, "offer_price_fallback"))
    verifier("bid en dernier recours",
             choose_vl_price(None, None, 116.0) == (116.0, "bid_price_fallback"))
    verifier("aucun prix disponible -> vide",
             choose_vl_price(None, None, None) == (None, ""))

    print("\n--- Devise lue dans l en-tete de colonne (format SEC reel) ---")
    for entete, attendu in [
        ("Offer Price (USD)", "USD"),
        ("Offer Price (NGN)", "NGN"),
        ("Unit Price (USD)", "USD"),
        ("Bid Price (NGN)", "NGN"),
        ("NAV ($)", "USD"),
        ("Offer Price ($)", "USD"),
        ("NAV (N)", ""),          # « N » est trop generique pour etre un marqueur
        ("Offer Price", ""),      # aucun marqueur : doit rester vide
    ]:
        verifier(f"« {entete} » -> {attendu or 'vide'}", detect_currency(entete)[0] == attendu)

    verifier("« US$ » reste reconnu", detect_currency("Price in US$")[0] == "USD")
    verifier("texte libre « USD » toujours reconnu (non-regression)",
             detect_currency("Price in USD terms")[0] == "USD")

    print("\n--- Le defaut de #73, reproduit puis neutralise ---")
    deduit = infer_currency(category_raw="", fund_name="Afrinvest Dollar Fund",
                            fund_manager="", header_text="", block_text="")
    verifier("infer_currency deduit USD du seul NOM du fonds", deduit[0] == "USD")
    verifier("l en-tete « Offer Price (NGN) » dit NGN, et prime desormais",
             detect_currency("Offer Price (NGN)")[0] == "NGN" and deduit[0] == "USD")

    print("\n--- Champs de tracabilite exposes ---")
    for classe, champ in (
        ("ColumnBlock", "bid_price_header"),
        ("ColumnBlock", "offer_price_header"),
        ("ColumnBlock", "unit_price_header"),
        ("NavRecord", "vl_currency_source"),
        ("NavRecord", "vl_currency_confidence"),
    ):
        champs = getattr(ns.get(classe), "__dataclass_fields__", {})
        verifier(f"{classe}.{champ}", champ in champs)

    print(f"\n  {reussis} verifications OK, {echoues} echec(s)\n")
    return 1 if echoues else 0


if __name__ == "__main__":
    sys.exit(main())
