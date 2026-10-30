#!/usr/bin/env python3
"""
Extracteur des taux interbancaires UMOA publies par la BCEAO — DRY-RUN.

M2 du chantier Benchmarks V2, zone UEMOA. **N'ECRIT RIEN.** Il imprime les
lignes qu'il INSERERAIT dans `benchmark_series`, et s'arrete la.

POURQUOI UN DRY-RUN ET PAS UN COLLECTEUR. `benchmark_series` n'existe pas
encore : la migration M1 est livree mais **non appliquee** (verifie le
2026-10-30). Un collecteur qui ecrirait maintenant echouerait sur une table
absente. Le dry-run permet de valider le parsing, les dates, les conventions
numeriques et les statuts AVANT que la table existe — c'est-a-dire de separer
les erreurs de lecture des erreurs d'ecriture.

SOURCE QUALIFIEE (`docs/REGISTRE_SOURCES_MARCHE.md`, mesure du 2026-10-30) :
listing « Operations effectuees sur le marche interbancaire de l'UMOA »,
27 pages, ≈531 PDF hebdomadaires, **2017-10 → 2026-10**. Les huit maturites
publiees correspondent mot pour mot a celles que le mandat demande.

LES CINQ PIEGES MESURES, ET CE QUE LE CODE EN FAIT :

1. **Le nom de fichier ne porte NI la date NI le type.** Les documents anciens
   s'appellent `05-Situation des Prets interbancaires par maturites_0.pdf` — sans
   date — alors que leur contenu est bien « Operations par maturites effectuees ».
   → la date ET la nature sont lues **dans le texte du PDF**, jamais dans le nom.

2. **La date de PUBLICATION n'existe que sur les documents ANCIENS.** Mesure du
   2026-10-30 :
     document de 2017 : `Dakar, le 10 novembre 2017` → publication presente
     document de 2026 : **zero** occurrence de « Dakar » → publication ABSENTE
   Le format a change — la direction emettrice aussi (« Operations et Activites
   Fiduciaires » en 2017, « Economie et Monnaie » en 2026).
   → `publication_date` est renseignee quand elle existe, et laissee a `NULL`
   sinon. **Elle n'est PAS devinee depuis le chemin de stockage** de l'URL
   (`/sites/default/files/2026-07/`), qui porte un MOIS et non une date, et qui
   decrit ou le fichier est range, pas quand il a ete publie. Le mandat exige
   des « dates d'observation et de publication distinctes » : quand la seconde
   n'est pas publiee, la reponse honnete est `NULL`, pas une approximation.
   La periode de REFERENCE, elle, est presente partout :
   `Semaine du 31 octobre au 06 novembre 2017` → `as_of_date`.

3. **Le tiret « – » signifie AUCUNE TRANSACTION, jamais zero.** Les maturites 6,
   9 et 12 mois sont regulierement vides.
   → la ligne est emise avec `value = None` et
   `status = NO_VALUE_MARKET_CLOSED`. **Jamais un zero.** Ecrire 0 serait
   inventer un taux, ce que le mandat interdit explicitement.

4. **Pourcentages a VIRGULE decimale** (`4,21`) — convention OPPOSEE a celle de
   la BEAC, qui publie des fractions (`0.0325`). Un extracteur commun aux deux
   zones qui les confond se trompe d'un facteur 100.
   → la conversion est explicite et un garde-fou rejette toute valeur hors
   [0, 100].

5. **Au moins quatre nomenclatures** de nom de fichier, accents encodes en URL,
   separateurs melanges.
   → aucun filtre sur le nom ; on tente tous les PDF du listing et on classe
   par ce que le CONTENU dit.

CODES D'INDICATEUR — A VALIDER, NON CANONIQUES. `BENCHMARKS_F3_MAPPING_SCHEMA.md`
definit le schema de `benchmark_series` mais **ne nomme pas** d'indicateur pour
les taux interbancaires UMOA par maturite. Les codes ci-dessous sont donc une
PROPOSITION de ce script, signalee comme telle : le mandat impose de reprendre
les identifiants « depuis leur source canonique » et de ne pas en inventer la
signification. Ils doivent etre valides avant toute ecriture reelle.

CHOIX DE `as_of_date` POUR UNE SEMAINE. Une observation hebdomadaire couvre une
periode, pas un jour. La fin de semaine est retenue — c'est la date a laquelle
l'information est complete — et la periode entiere reste lisible dans
`indicator_name`. Convention a valider avec le choix des codes.

LECTURE SEULE : requetes HTTP GET sur un portail public, et `pdftotext`. Aucune
ecriture en base, aucun fichier du depot modifie.

USAGE
  python3 scripts/extract/extract_bceao_interbancaire.py            # 1 page, dry-run
  python3 scripts/extract/extract_bceao_interbancaire.py --pages 3  # 3 pages
  python3 scripts/extract/extract_bceao_interbancaire.py --json out.json
"""
import argparse, json, os, re, subprocess, sys, tempfile, urllib.parse

LISTING = ("https://www.bceao.int/fr/documents/"
           "operations-effectuees-sur-le-marche-interbancaire-de-lumoa-0")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/125.0.0.0 Safari/537.36")

# Les huit maturites publiees, dans l ordre du tableau. Les codes sont une
# PROPOSITION (voir l en-tete) : F3 ne les nomme pas.
MATURITES = [
    ("UN JOUR",       "UMOA_INTERBANK_WAR_1D",  "1 jour"),
    ("UNE SEMAINE",   "UMOA_INTERBANK_WAR_1W",  "1 semaine"),
    ("DEUX SEMAINES", "UMOA_INTERBANK_WAR_2W",  "2 semaines"),
    ("UN MOIS",       "UMOA_INTERBANK_WAR_1M",  "1 mois"),
    ("TROIS MOIS",    "UMOA_INTERBANK_WAR_3M",  "3 mois"),
    ("SIX MOIS",      "UMOA_INTERBANK_WAR_6M",  "6 mois"),
    ("NEUF MOIS",     "UMOA_INTERBANK_WAR_9M",  "9 mois"),
    ("DOUZE MOIS",    "UMOA_INTERBANK_WAR_12M", "12 mois"),
]
MOIS = {"janvier":1,"fevrier":2,"février":2,"mars":3,"avril":4,"mai":5,"juin":6,
        "juillet":7,"aout":8,"août":8,"septembre":9,"octobre":10,"novembre":11,
        "decembre":12,"décembre":12}


def curl(url, dest=None, timeout=90):
    cmd = ["curl", "-s", "-L", "--compressed", "--max-time", str(timeout),
           "-H", f"User-Agent: {UA}", "-H", "Accept-Language: fr-FR,fr;q=0.9"]
    cmd += ["-o", dest] if dest else []
    cmd.append(url)
    r = subprocess.run(cmd, capture_output=True, timeout=timeout + 20)
    return r.stdout.decode("utf-8", "replace") if not dest else (r.returncode == 0)


def liens_pdf(page):
    """Tous les PDF du listing. Aucun filtre sur le nom : il ne dit rien de fiable."""
    url = LISTING if page == 0 else f"{LISTING}?page={page}"
    html = curl(url)
    out = []
    for h in re.findall(r'href="([^"]+\.pdf[^"]*)"', html, re.I):
        # Le schema peut manquer : c est exactement le defaut qui avait fait
        # conclure a tort que l annee 2019 d UMOA-Titres etait inaccessible.
        if h.startswith("//"):
            h = "https:" + h
        elif h.startswith("/"):
            h = "https://www.bceao.int" + h
        if h.startswith("http"):
            out.append(h)
    return sorted(set(out))


def texte_pdf(chemin):
    try:
        r = subprocess.run(["pdftotext", "-layout", chemin, "-"],
                           capture_output=True, timeout=60)
        return r.stdout.decode("utf-8", "replace")
    except Exception:
        return ""


def iso(jour, mois_mot, annee):
    m = MOIS.get(mois_mot.lower())
    return f"{annee}-{m:02d}-{int(jour):02d}" if m else None


def dates_du_texte(t):
    """Periode de reference (fin de semaine) et date de publication."""
    ref = pub = None
    # « Semaine du 31 octobre au 06 novembre 2017 » — le mois du debut peut differer
    m = re.search(r"Semaine\s+du\s+(\d{1,2})\s+(\w+)?\s*(?:\d{4})?\s*au\s+(\d{1,2})\s+(\w+)\s+(\d{4})",
                  t, re.I)
    if m:
        ref = iso(m.group(3), m.group(4), m.group(5))      # FIN de semaine
    m2 = re.search(r"Dakar,?\s+le\s+(\d{1,2})\s+(\w+)\s+(\d{4})", t, re.I)
    if m2:
        pub = iso(m2.group(1), m2.group(2), m2.group(3))
    return ref, pub


def taux_du_texte(t):
    """Les trois lignes de taux, par maturite. Rend None pour « – »."""
    out = {}
    for etiquette, cle in (("Taux moyen pondéré", "moyen"),
                           ("Taux minimum", "min"), ("Taux maximum", "max")):
        m = re.search(re.escape(etiquette) + r"[^\n]*", t, re.I)
        if not m:
            out[cle] = None
            continue
        reste = m.group(0)
        # Le tiret est une ABSENCE, pas un zero : on le conserve comme tel.
        jetons = re.findall(r"(\d+[.,]\d+|\d+|[-–—])", reste.split(")", 1)[-1])
        vals = []
        for j in jetons:
            if j in "-–—":
                vals.append(None)
            else:
                v = float(j.replace(",", "."))
                # Garde-fou de convention : la BCEAO publie des POURCENTAGES.
                # Une valeur hors [0,100] signalerait une convention differente
                # — ou une colonne de volume prise pour un taux.
                vals.append(v if 0 <= v <= 100 else None)
        out[cle] = vals
    return out


def lignes_benchmark(url, t):
    ref, pub = dates_du_texte(t)
    if not ref:
        return [], "DATE_DE_REFERENCE_ILLISIBLE"
    taux = taux_du_texte(t)
    moyens = taux.get("moyen") or []
    lignes = []
    for i, (_, code, lib) in enumerate(MATURITES):
        v = moyens[i] if i < len(moyens) else None
        lignes.append({
            "indicator_code": code,
            "indicator_name": f"Taux interbancaire moyen pondere UMOA — {lib}",
            "country": "UEMOA",
            # Le 1 jour est le CANDIDAT au taux sans risque ; les autres sont des
            # taux monetaires par maturite. La distinction est a valider, le
            # mandat interdisant de confondre les natures.
            "category": "RFR" if code.endswith("_1D") else "MONETAIRE",
            "benchmark_scope": "national",
            "return_type": "rate",
            "original_currency": "XOF",
            "display_currency": "LOCAL",
            "value": v,
            "as_of_date": ref,
            "publication_date": pub,
            "source_name": "BCEAO — Operations par maturite sur le marche interbancaire de l UMOA",
            "source_url": url,
            "source_rank": 1,
            "is_official": True,
            "is_synthetic": False,
            "confidence_level": "high" if v is not None else "low",
            # Le statut dit POURQUOI il n y a pas de valeur, au lieu de la taire.
            "status": "OK_EXACT_DATE" if v is not None else "NO_VALUE_MARKET_CLOSED",
        })
    return lignes, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", type=int, default=1)
    ap.add_argument("--max-docs", type=int, default=6)
    ap.add_argument("--json")
    a = ap.parse_args()

    print("=== EXTRACTEUR BCEAO INTERBANCAIRE — DRY-RUN ===")
    print("AUCUNE ECRITURE. Les lignes ci-dessous seraient inserees dans")
    print("`benchmark_series`, qui n existe pas encore (M1 non appliquee).\n")

    urls = []
    for p in range(a.pages):
        l = liens_pdf(p)
        print(f"  page {p} : {len(l)} PDF")
        urls += l
    # NE PAS prendre les N premiers par ordre alphabetique : c est arbitraire, et
    # cela avait fait traiter cinq rapports de politique monetaire au lieu des
    # tableaux hebdomadaires. On privilegie les noms qui ressemblent a la serie,
    # sans s y fier — le contenu reste seul juge.
    def pertinence(u):
        n = urllib.parse.unquote(u.rsplit("/", 1)[-1]).lower()
        if "rapport" in n or "politique monetaire" in n or "politique monétaire" in n:
            return 2
        if "maturit" in n or "interbancaire" in n:
            return 0
        return 1
    urls = sorted(set(urls), key=lambda u: (pertinence(u), u))[: a.max_docs]
    print(f"\n{len(urls)} document(s) retenu(s) (plafond --max-docs)\n")

    toutes, echecs = [], []
    with tempfile.TemporaryDirectory() as d:
        for u in urls:
            f = os.path.join(d, "x.pdf")
            if not curl(u, f) or not os.path.getsize(f):
                echecs.append((u, "TELECHARGEMENT")); continue
            t = texte_pdf(f)
            # LE FILTRE DOIT PORTER SUR LA SIGNATURE DU DOCUMENT, pas sur un mot
            # qu il partage avec d autres. Ma premiere version acceptait tout PDF
            # contenant « interbancaire » : les « Rapport sur la politique
            # monetaire » — liens de barre laterale presents sur CHAQUE page du
            # listing — passaient donc le filtre et echouaient ensuite sur la
            # date. Ce sont eux, au passage, qui faisaient apparaitre « 2022 » et
            # « 2023 » sur toutes les pages dans la mesure du registre.
            bas = t.lower()
            if "operations par maturit" not in bas.replace("é", "e") \
               or "semaine du" not in bas:
                echecs.append((u, "AUTRE DOCUMENT (hors serie)")); continue
            lignes, err = lignes_benchmark(u, t)
            if err:
                echecs.append((u, err)); continue
            toutes += lignes
            ref = lignes[0]["as_of_date"]; pub = lignes[0]["publication_date"]
            vus = [f'{x["indicator_code"].split("_")[-1]}={x["value"]}' for x in lignes]
            print(f"  {ref}  (publie {pub or '?'})  " + " ".join(vus))

    print(f"\n=== {len(toutes)} ligne(s) seraient inserees ===")
    avec = [x for x in toutes if x["value"] is not None]
    print(f"  {len(avec)} avec valeur | {len(toutes)-len(avec)} en NO_VALUE_MARKET_CLOSED")
    print("  (ces dernieres portent `value = None`, JAMAIS zero : un zero serait")
    print("   un taux invente, ce que le mandat interdit)")
    if echecs:
        print(f"\n=== {len(echecs)} ECHEC(S) — rapportes, jamais tus ===")
        for u, r in echecs[:10]:
            print(f"  {r:<28} {urllib.parse.unquote(u.rsplit('/',1)[-1])[:62]}")
    if avec:
        x = avec[0]
        print("\n=== exemple de ligne complete ===")
        for k, v in x.items():
            print(f"  {k:<20} {v}")
    if a.json:
        json.dump(toutes, open(a.json, "w"), indent=1, ensure_ascii=False)
        print(f"\n{len(toutes)} ligne(s) ecrite(s) dans {a.json} (fichier local, pas la base)")
    print("\n=== FIN — aucune ecriture en base ===")


if __name__ == "__main__":
    main()
