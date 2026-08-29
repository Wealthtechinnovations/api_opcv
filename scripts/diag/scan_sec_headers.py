#!/usr/bin/env python3
"""
La SEC Nigeria publie-t-elle une colonne en dollars, et depuis quand ?

POURQUOI CE SCRIPT
------------------
La devise emise par l extracteur passe de 0 % de dollars en 2022, 2023, 2024 et
2025 a 51 % en 2026, sans aucun degrade. Deux causes possibles, qui n appellent
pas le meme remede :

  - la SEC a commence a publier une colonne dollar en 2026 : alors l historique
    ancien n en contient pas, et rien ne peut le rendre dollar sans fabriquer
    des valeurs que personne n a publiees ;
  - ou l extracteur ne sait lire que le format 2026 : alors la donnee dollar
    existe dans les fichiers anciens, et amputer la serie detruirait du
    recuperable.

Trois fichiers regardes a la main donnaient tous des en-tetes « (N) », y compris
celui de 2026 — mais c etait le fichier du 10 avril, deja connu pour n avoir
aucune colonne dollar. L echantillon designait precisement le cas particulier.
Conclure la-dessus serait refaire l erreur que ce chantier paie depuis des mois.

Ce script ouvre TOUS les fichiers et compte, par annee, combien portent au moins
un en-tete en dollars. Il ne juge pas les valeurs : seulement la presence d une
colonne. C est la source qui repond.

LECTURE SEULE : aucun fichier n est modifie, aucune base n est touchee.

USAGE
  python3 scripts/diag/scan_sec_headers.py [repertoire]     # defaut : sec_ng_downloads
"""

import collections
import glob
import os
import re
import sys

try:
    from openpyxl import load_workbook
except ImportError:
    print("openpyxl indisponible — ce balayage ne peut pas s executer.")
    sys.exit(0)

# « ($) », « (USD) », « (US$) ». Le symbole seul ne suffit pas : un montant
# « $1,234 » dans une cellule de texte n est pas un en-tete de colonne. La
# parenthese est ce qui distingue l en-tete de la donnee, comme dans « (N) ».
MARQUEUR_USD = re.compile(r"\(\s*(?:\$|USD|US\$)\s*\)", re.I)
MARQUEUR_NGN = re.compile(r"\(\s*(?:N|NGN|NAIRA)\s*\)", re.I)

# Les en-tetes vivent dans les toutes premieres lignes ; lire au-dela couterait
# du temps sans rien apprendre.
LIGNES_ENTETE = 4


def entetes_du_fichier(chemin):
    """Les cellules non vides des premieres lignes de chaque feuille."""
    cellules = []
    wb = load_workbook(chemin, read_only=True, data_only=True)
    try:
        for ws in wb.worksheets:
            for ligne in ws.iter_rows(min_row=1, max_row=LIGNES_ENTETE, values_only=True):
                for cel in ligne:
                    if cel is not None and str(cel).strip():
                        cellules.append(str(cel))
    finally:
        wb.close()
    return cellules


def main():
    racine = sys.argv[1] if len(sys.argv) > 1 else "sec_ng_downloads"
    motif = os.path.join(racine, "*", "*.xlsx")
    fichiers = sorted(glob.glob(motif))

    if not fichiers:
        print(f"Aucun fichier .xlsx sous {motif}")
        return

    print(f"\n=== EN-TETES SEC — {len(fichiers)} fichiers sous {racine} ===\n")

    stats = collections.defaultdict(lambda: {"total": 0, "usd": 0, "ngn": 0, "erreurs": 0})
    exemples_usd = []
    premiers_usd = {}

    for chemin in fichiers:
        parties = chemin.split(os.sep)
        annee = parties[1] if len(parties) > 2 else "?"
        b = stats[annee]
        b["total"] += 1
        try:
            cellules = entetes_du_fichier(chemin)
        except Exception:
            b["erreurs"] += 1
            continue

        a_usd = False
        a_ngn = False
        for c in cellules:
            if not a_usd and MARQUEUR_USD.search(c):
                a_usd = True
                if len(exemples_usd) < 8:
                    exemples_usd.append(f"{os.path.basename(chemin)} — « {c.strip()[:58]} »")
            if not a_ngn and MARQUEUR_NGN.search(c):
                a_ngn = True
            if a_usd and a_ngn:
                break

        if a_usd:
            b["usd"] += 1
            nom = os.path.basename(chemin)
            if annee not in premiers_usd:
                premiers_usd[annee] = nom
        if a_ngn:
            b["ngn"] += 1

    print(f"  {'annee':6} {'fichiers':>9} {'avec ($)':>9} {'avec (N)':>9} {'illisibles':>11}   part dollar")
    print(f"  {'-'*6} {'-'*9} {'-'*9} {'-'*9} {'-'*11}   -----------")
    for annee in sorted(stats):
        b = stats[annee]
        lisibles = b["total"] - b["erreurs"]
        pct = (b["usd"] / lisibles * 100) if lisibles else 0
        print(f"  {annee:6} {b['total']:9} {b['usd']:9} {b['ngn']:9} {b['erreurs']:11}   {pct:.1f} %")

    total = sum(b["total"] for b in stats.values())
    total_usd = sum(b["usd"] for b in stats.values())
    print(f"\n  Total : {total_usd} fichier(s) sur {total} portent au moins un en-tete en dollars.")

    if premiers_usd:
        print("\n  Premier fichier a colonne dollar, par annee :")
        for annee in sorted(premiers_usd):
            print(f"    {annee} : {premiers_usd[annee]}")

    if exemples_usd:
        print("\n  Exemples d en-tetes en dollars :")
        for e in exemples_usd:
            print(f"    {e}")
    else:
        print("\n  AUCUN en-tete en dollars dans aucun fichier.")
        print("  Consequence : l historique ne peut pas devenir dollar sans fabriquer")
        print("  des valeurs. Seule la periode ou la SEC en publie est concernee.")

    print()


if __name__ == "__main__":
    main()
