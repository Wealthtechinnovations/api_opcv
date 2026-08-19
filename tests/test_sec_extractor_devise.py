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
from dataclasses import dataclass, field
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
        # `field` est indispensable : ColumnBlock declare un default_factory.
        # Sans lui, la dataclass echouait a se charger EN SILENCE et les
        # verifications de champs passaient a cote.
        "dataclass": dataclass, "field": field,
        "Any": Any, "Optional": Optional, "List": List,
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

    print("\n--- Devise dans un en-tete de colonne SEC reel ---")
    # Structure mesuree le 2026-08-19 sur le fichier du 24 juillet 2026 :
    #   c6 « Bid Price ($) » = 119,9184   c7 « Bid Price (N) » = 165 509,54
    # Les deux devises occupent des colonnes separees ; « N » entre parentheses
    # designe le naira, ce qui est univoque dans un en-tete de prix alors que
    # « N » seul serait bien trop generique.
    dcch = ns["detect_currency_in_column_header"]
    for entete, attendu in [
        ("Bid Price ($)", "USD"),
        ("Bid Price (N)", "NGN"),
        ("Offer Price ($)", "USD"),
        ("Offer Price (N)", "NGN"),
        ("NAV ($)", "USD"),
        ("NAV (N)", "NGN"),
        ("Unit Price (USD)", "USD"),
        ("Unit Price (NGN)", "NGN"),
        ("Offer Price", ""),
    ]:
        verifier(f"en-tete « {entete} » -> {attendu or 'vide'}", dcch(entete) == attendu)

    print("\n--- Choix de la colonne : le cas Afrinvest, en entier ---")
    choose_col = ns["choose_price_column"]
    # Le bloc reel : six colonnes de prix, deux devises.
    colonnes = [
        ("bid_price", 6, "USD"), ("bid_price", 7, "NGN"),
        ("offer_price", 8, "USD"), ("offer_price", 9, "NGN"),
    ]
    valeurs = {6: 119.9184, 7: 165509.54092848, 8: 119.9184, 9: 165509.54092848}

    prix, src, dev, prov = choose_col(valeurs, colonnes, "USD")
    verifier("fonds USD -> retient la colonne dollar (119,92)", prix == 119.9184)
    verifier("  et l etiquette est USD", dev == "USD")
    verifier("  provenance : en-tete correspondant au fonds", prov == "column_header_matched_fund")

    prix_n, _, dev_n, _ = choose_col(valeurs, colonnes, "NGN")
    verifier("fonds NGN -> retient la colonne naira (165 509)", prix_n == 165509.54092848)
    verifier("  et l etiquette est NGN", dev_n == "NGN")

    # Un prix unitaire explicite doit primer sur Bid et Offer, meme en 2e position.
    colonnes_unit = colonnes + [("unit_price", 12, "USD")]
    valeurs_unit = dict(valeurs); valeurs_unit[12] = 118.5
    prix_u, src_u, _, _ = choose_col(valeurs_unit, colonnes_unit, "USD")
    verifier("le prix unitaire prime sur offer et bid", prix_u == 118.5 and src_u == "unit_price")

    # Devise du fonds inconnue : on prend une colonne exploitable, mais on
    # l etiquette avec SA devise, jamais avec celle supposee du fonds.
    prix_x, _, dev_x, prov_x = choose_col(valeurs, colonnes, "")
    verifier("devise du fonds inconnue -> etiquetee par la colonne",
             dev_x in ("USD", "NGN") and prov_x == "column_header")

    # La colonne demandee est vide (N/A) : repli sur une autre, honnetement etiquetee.
    valeurs_na = {7: 165509.54, 9: 165509.54}
    prix_na, _, dev_na, prov_na = choose_col(valeurs_na, colonnes, "USD")
    verifier("colonne dollar absente -> repli naira etiquete NGN",
             prix_na == 165509.54 and dev_na == "NGN" and prov_na == "column_header")

    verifier("aucune colonne exploitable -> vide", choose_col({}, colonnes, "USD")[0] is None)

    print("\n--- Champs de tracabilite exposes ---")
    for classe, champ in (
        ("ColumnBlock", "bid_price_header"),
        ("ColumnBlock", "offer_price_header"),
        ("ColumnBlock", "unit_price_header"),
        ("NavRecord", "vl_currency_source"),
        ("NavRecord", "vl_currency_confidence"),
        ("ColumnBlock", "price_columns"),
    ):
        champs = getattr(ns.get(classe), "__dataclass_fields__", {})
        verifier(f"{classe}.{champ}", champ in champs)

    print(f"\n  {reussis} verifications OK, {echoues} echec(s)\n")
    return 1 if echoues else 0


if __name__ == "__main__":
    sys.exit(main())
