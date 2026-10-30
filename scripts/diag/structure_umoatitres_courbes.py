#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STRUCTURE des courbes de taux UMOA-Titres (`.xlsx`).
LECTURE SEULE : requetes GET sur un portail public. Aucune ecriture en base.

POURQUOI CE SCRIPT EXISTE. `docs/REGISTRE_SOURCES_MARCHE.md` affirme que les
402 classeurs partagent la meme structure — « un seul parseur suffit », huit
feuilles pays, trois colonnes, maturites de 1 mois a 17 ans. Cette affirmation
repose sur **neuf fichiers ouverts sur 402**. Construire un parseur unique
sur 2 % de la population, c'est decider par extrapolation ; et l'extrapolation
a deja coute une fois sur cette meme source — « ≈ 531 documents » BCEAO
valait en realite 391, et « 702 fichiers » UMOA-Titres valait 402.

Le script repond par des chiffres a quatre questions :
  1. les feuilles sont-elles les HUIT pays partout, ou varient-elles ?
  2. les en-tetes sont-ils stables (`Maturite`, `Zero Coupon`, `Taux Apres
     Lissage`) ?
  3. quelles MATURITES sont reellement cotees, et a quel taux de couverture ?
     C'est la question qui decide du benchmark obligataire, exactement comme la
     couverture par maturite a decide du proxy monetaire en DEC-AF-009 ;
  4. les valeurs sont-elles des pourcentages ou des fractions ? La BCEAO publie
     des pourcentages a virgule et la BEAC des fractions — un parseur commun qui
     ne distingue pas les deux se trompe d'un facteur 100.

DEPENDANCE : `openpyxl`. Elle n'est PAS garantie sur S2, donc ce script reste
dans `scripts/diag/` et **ne doit pas etre place dans `scripts/diag/ondemand/`**,
ou il echouerait sur l'import et casserait le tunnel partage des diagnostics.
Le script le dit au lieu de mourir sur une trace d'import.

DEUX PIEGES REPRIS DU REGISTRE, traites ici :
  - **55 liens sont protocole-relatifs** (`//www.umoatitres.org/...`) et portent
    toute l'annee 2019. Ne pas prefixer le schema rend HTTP 000 et perd l'annee
    la plus ancienne en entier — l'erreur exacte qui avait fait conclure a tort
    que « 2019 est inaccessible » ;
  - **au moins trois nomenclatures** de nom de fichier, dont une faute de
    l'emetteur (`COURBES-DES-TAUX`). Aucun filtre n'est applique sur le nom.

Usage :
    python3 scripts/diag/structure_umoatitres_courbes.py --lister
    python3 scripts/diag/structure_umoatitres_courbes.py --echantillon 30
    python3 scripts/diag/structure_umoatitres_courbes.py --tous
"""
import argparse, os, re, subprocess, sys, tempfile
from collections import Counter, defaultdict

LISTING = "https://www.umoatitres.org/fr/ressources-2/courbe-des-taux/"
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/125.0.0.0 Safari/537.36")

try:
    from openpyxl import load_workbook
except ImportError:
    load_workbook = None


def curl(url, dest=None, timeout=120):
    """Avec `dest`, rend `(ok, code_http)`. LE CODE HTTP EST VERIFIE : le code
    de retour de `curl` vaut 0 sur un 404, ce qui avait fait passer trois liens
    morts du portail BCEAO pour des documents illisibles."""
    cmd = ["curl", "-s", "-L", "--compressed", "--max-time", str(timeout),
           "-H", f"User-Agent: {UA}"]
    if dest:
        cmd += ["-o", dest, "-w", "%{http_code}"]
    cmd.append(url)
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=timeout + 20)
    except subprocess.TimeoutExpired:
        return (False, 0) if dest else ""
    out = r.stdout.decode("utf-8", "replace")
    if not dest:
        return out
    try:
        code = int(out.strip()[-3:])
    except ValueError:
        code = 0
    return (r.returncode == 0 and code == 200, code)


def liens_xlsx():
    """Tous les `.xlsx` du listing. AUCUN filtre sur le nom : au moins trois
    nomenclatures coexistent, dont une faute de l'emetteur."""
    html = curl(LISTING)
    out, relatifs = set(), set()
    for h in re.findall(r'href="([^"]+\.xlsx[^"]*)"', html, re.I):
        # Compter les FICHIERS UNIQUES, pas les `href` : la page repete les
        # memes liens, et compter les occurrences donnait 110 la ou le registre
        # mesurait 55 fichiers. Rapporter cet ecart comme une contradiction
        # aurait ete une erreur de MA metrique, pas un changement de la source.
        if h.startswith("//"):
            # Ces fichiers portent toute l'annee 2019. Sans le prefixe `https:`
            # ils rendent HTTP 000, et l'annee la plus ancienne est perdue en
            # entier — l'erreur exacte qui avait fait conclure « 2019
            # inaccessible ».
            h = "https:" + h
            relatifs.add(h)
        elif h.startswith("/"):
            h = "https://www.umoatitres.org" + h
        if h.startswith("http"):
            out.add(h)
    return sorted(out), len(relatifs)


def annee_du_nom(url):
    nom = re.sub(r"%[0-9A-Fa-f]{2}", " ", os.path.basename(url))
    ans = re.findall(r"(20[0-2]\d)", nom)
    return ans[-1] if ans else None


def lire_classeur(chemin):
    """Feuilles, en-tetes, maturites et valeurs. Rend un dict ou une erreur."""
    try:
        wb = load_workbook(chemin, read_only=True, data_only=True)
    except Exception as e:
        return {"erreur": f"OUVERTURE: {type(e).__name__} {str(e)[:60]}"}
    info = {"feuilles": list(wb.sheetnames), "pays": {}}
    for nom in wb.sheetnames:
        ws = wb[nom]
        lignes = []
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            lignes.append(row)
            if i >= 40:
                break
        # LE TABLEAU N'EST PAS EN COLONNE 0. Mesure du 2026-10-30 : l'en-tete
        # `Maturite | Zero Coupon | Taux Apres Lissage` est en **colonne 11**,
        # le titre du pays en colonne 6, et les colonnes A a K sont vides. Ma
        # premiere version lisait `r[0]` et trouvait donc « 0 maturite » sur
        # les 402 classeurs — un resultat manifestement faux, mais qui aurait
        # pu passer pour une propriete de la source si je ne l'avais pas
        # confronte au registre, qui avait bien vu des maturites.
        entete, idx, col = None, None, None
        for i, r in enumerate(lignes):
            for j, c in enumerate(r):
                if c is not None and "maturit" in str(c).lower():
                    entete = [str(x).strip() for x in r[j:j + 3]
                              if x is not None]
                    idx, col = i, j
                    break
            if idx is not None:
                break
        mats, vals = [], []
        if idx is not None:
            for r in lignes[idx + 1:]:
                if len(r) <= col:
                    continue
                etiq = r[col]
                if etiq is not None and str(etiq).strip():
                    mats.append(str(etiq).strip())
                    for c in r[col + 1:col + 3]:
                        if isinstance(c, (int, float)):
                            vals.append(float(c))
        info["pays"][nom] = {"entete": entete, "maturites": mats,
                             "valeurs": vals}
    wb.close()
    return info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lister", action="store_true")
    ap.add_argument("--echantillon", type=int, default=0,
                    help="N fichiers par annee, repartis — un echantillon "
                         "annonce comme tel, pas un recensement")
    ap.add_argument("--tous", action="store_true")
    a = ap.parse_args()

    print("=== STRUCTURE DES COURBES UMOA-TITRES — LECTURE SEULE ===\n")
    urls, relatifs = liens_xlsx()
    print(f"  {len(urls)} fichier(s) .xlsx distinct(s) sur le listing")
    print(f"  dont {relatifs} lien(s) PROTOCOLE-RELATIF(S) corrige(s) par "
          f"prefixe `https:`")
    par_an = defaultdict(list)
    for u in urls:
        par_an[annee_du_nom(u)].append(u)
    for an in sorted(x for x in par_an if x):
        print(f"    {an} : {len(par_an[an]):3d}")
    sans = len(par_an.get(None, []))
    if sans:
        print(f"    annee illisible dans le nom : {sans}")

    if a.lister:
        return 0
    if load_workbook is None:
        print("\n!! `openpyxl` absent : la structure ne peut pas etre lue.")
        print("   `python3 -m pip install openpyxl`, puis relancer.")
        print("   C est pourquoi ce script n est PAS dans scripts/diag/ondemand/ :")
        print("   il y echouerait a l import et casserait le tunnel partage.")
        return 2

    cibles = []
    if a.tous:
        cibles = urls
    elif a.echantillon:
        for an in sorted(x for x in par_an if x):
            lst = sorted(par_an[an])
            pas = max(1, len(lst) // a.echantillon)
            cibles += lst[::pas][: a.echantillon]
    else:
        print("\nRien a ouvrir : passer --echantillon N ou --tous.")
        return 0

    print(f"\n--- {len(cibles)} classeur(s) ouvert(s) "
          f"{'(TOUS)' if a.tous else '(ECHANTILLON, annonce comme tel)'} ---\n")

    feuilles_vues = Counter()
    nb_feuilles = Counter()
    entetes = Counter()
    maturites = Counter()
    bornes = []
    erreurs = []
    hors_plage = []
    forme = Counter()
    tmp = tempfile.mkdtemp(prefix="umoa_struct_")
    d = os.path.join(tmp, "x.xlsx")
    for n, u in enumerate(cibles, 1):
        ok, code = curl(u, dest=d)
        if not ok:
            erreurs.append((u, f"HTTP_{code}" if code else "TELECHARGEMENT"))
            continue
        info = lire_classeur(d)
        if "erreur" in info:
            erreurs.append((u, info["erreur"]))
            continue
        nb_feuilles[len(info["feuilles"])] += 1
        for f in info["feuilles"]:
            feuilles_vues[f] += 1
        for f, p in info["pays"].items():
            if p["entete"]:
                entetes[" | ".join(x for x in p["entete"] if x)[:70]] += 1
            for m in p["maturites"]:
                maturites[m] += 1
            if p["valeurs"]:
                bornes.append((min(p["valeurs"]), max(p["valeurs"])))
                # FRACTION OU POURCENTAGE ? C'est LA question qui decide d'un
                # parseur. Un controle « dans [0, 100] » ne discrimine rien :
                # 0,0597 et 5,97 y sont tous deux. La mesure qui tranche est la
                # part de valeurs STRICTEMENT INFERIEURES A 1.
                for v in p["valeurs"]:
                    forme["fraction" if abs(v) < 1 else "pourcentage"] += 1
                    if not (0 <= v <= 100):
                        hors_plage.append((os.path.basename(u)[:40], f, v))
        if n % 10 == 0:
            print(f"  ... {n}/{len(cibles)}")

    lus = len(cibles) - len(erreurs)
    print(f"\n--- {lus} classeur(s) lu(s), {len(erreurs)} en echec ---")
    print("\n  Nombre de feuilles par classeur :")
    for k, v in sorted(nb_feuilles.items()):
        print(f"    {k} feuille(s) : {v} classeur(s)")
    print("\n  Feuilles rencontrees (nom -> nombre de classeurs) :")
    for f, v in feuilles_vues.most_common():
        drapeau = "" if v == lus else "   << PAS DANS TOUS"
        print(f"    {f[:38]:38s} {v:4d}{drapeau}")
    print("\n  En-tetes distincts :")
    for e, v in entetes.most_common(8):
        print(f"    [{v:4d}] {e}")
    if len(entetes) > 8:
        print(f"    ... et {len(entetes) - 8} autre(s) forme(s) d en-tete")
    print(f"\n  Maturites distinctes : {len(maturites)}")
    for m, v in maturites.most_common(25):
        print(f"    {m[:24]:24s} {v:5d}")
    if bornes:
        # `.8g` et non `.6f` : un `.6f` affichait « 0.000000 » pour la plus
        # petite valeur, ce qui m'a fait croire a des zeros exacts — donc a des
        # absences ecrites en zero, le piege inverse du tiret BCEAO. Verification
        # faite : **zero valeur exactement nulle** sur 9 944 points, le vrai
        # minimum etant 0,0034 (0,34 %). Un format trop court avait fabrique
        # l'alerte. Il n'en fabriquera plus.
        print(f"\n  Valeurs numeriques : min global "
              f"{min(b[0] for b in bornes):.8g}"
              f" / max global {max(b[1] for b in bornes):.8g}")
    if forme:
        tot = sum(forme.values())
        print(f"\n  CONVENTION NUMERIQUE sur {tot} valeur(s) :")
        for k in ("fraction", "pourcentage"):
            n = forme[k]
            print(f"    {k:12s} (|v| {'<' if k == 'fraction' else '>='} 1) : "
                  f"{n:7d}   {100.0 * n / tot:5.1f} %")
        if forme["fraction"] and forme["pourcentage"]:
            print("    >> LES DEUX CONVENTIONS COEXISTENT dans la source : un")
            print("       parseur unique se tromperait d un facteur 100 sur")
            print("       l une des deux. A instruire fichier par fichier.")
        elif forme["fraction"]:
            print("    >> FRACTIONS. 0,0597 vaut 5,97 %. Les PDF hebdomadaires")
            print("       de la BCEAO, MEME ZONE, publient `4,21` pour 4,21 % :")
            print("       deux conventions OPPOSEES au sein de l UEMOA.")
    if hors_plage:
        print(f"\n  !! {len(hors_plage)} valeur(s) HORS [0, 100] — a instruire "
              f"avant tout parseur commun :")
        for f, s, v in hors_plage[:8]:
            print(f"    {f} / {s} : {v}")
    if erreurs:
        print(f"\n  ECHECS — rapportes, jamais tus :")
        for u, r in erreurs[:12]:
            print(f"    {r:<32} {os.path.basename(u)[:52]}")

    print("\nLECTURE SEULE : aucune ecriture effectuee.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
