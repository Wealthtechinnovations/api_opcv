#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RECENSEMENT de la serie hebdomadaire BCEAO « Operations par maturite ».
LECTURE SEULE : requetes GET sur un portail public. Aucune ecriture, ni en base,
ni dans le depot.

POURQUOI CE SCRIPT EXISTE. Le registre des sources affirme « ≈531 documents sur
27 pages, 2017-10 → 2026-10 ». Ce chiffre vient d une extrapolation : 27 pages a
~20 liens. **Quatre documents avaient ete ouverts sur les ≈531.** Avant de
construire une collecte sur neuf ans, il faut savoir si la serie est reellement
continue ou si elle a des trous — un trou de six mois ne se voit pas dans un
total, il se voit dans une distribution.

Ce script repond a trois questions, par des chiffres :
  1. combien de documents DISTINCTS le listing offre-t-il reellement ?
  2. comment se distribuent-ils par annee, et **y a-t-il des trous** ?
  3. la forme du tableau tient-elle hors de 2026 ? (echantillon ouvert par annee)

CE QU IL NE FAIT PAS : il ne conclut pas que la serie est exploitable. Il
imprime la distribution ; la lacune, s il y en a une, se lit dessus.

DEUX PIEGES DEJA PAYES, traites ici :

1. **Les PDF de barre laterale sont presents sur CHAQUE page.** Les « Rapport sur
   la politique monetaire » ne font pas partie de la serie, mais ils apparaissent
   27 fois. Un comptage naif les compte 27 fois et gonfle le total. Ils sont
   identifies par leur presence sur une large majorite des pages — pas par leur
   nom, qui ne dit rien de fiable (piege 1 du registre). C est ce meme defaut qui
   avait fait echouer l extracteur sur cinq documents a sa premiere execution.

2. **Le nom de fichier ne porte pas la date de facon fiable.** Le recensement
   classe donc par annee quand le nom la porte, et compte separement les
   documents dont l annee est **indeterminable depuis le nom**. Ce compteur
   n est pas un detail : s il est eleve, la distribution par annee ne vaut rien
   et seul le contenu peut trancher. Le script le dit au lieu de le taire.

Usage :
    python3 scripts/diag/recensement_bceao_interbancaire.py [--pages 27]
    python3 scripts/diag/recensement_bceao_interbancaire.py --echantillon 6
"""
import argparse, os, re, subprocess, sys, tempfile
from collections import Counter, defaultdict

LISTING = ("https://www.bceao.int/fr/documents/"
           "operations-effectuees-sur-le-marche-interbancaire-de-lumoa-0")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/125.0.0.0 Safari/537.36")


def curl(url, dest=None, timeout=90):
    """Telecharge, et quand `dest` est fourni rend `(ok, code_http)`.

    LE CODE HTTP EST RENDU, et ce n est pas cosmetique. Ma premiere version
    rendait `returncode == 0`, qui vaut VRAI sur un 404 : curl a bien fait son
    travail, c est le serveur qui a refuse. Trois URL `.pdf` du portail BCEAO
    rendent **HTTP 404 avec une page HTML** « Page non trouvee ! ». Elles
    etaient donc classees PDF_ILLISIBLE — un diagnostic qui aurait fait
    chercher un probleme d OCR la ou il y a trois liens morts a la source.
    « Document illisible » et « lien mort » n appellent pas la meme action.
    """
    cmd = ["curl", "-s", "-L", "--compressed", "--max-time", str(timeout),
           "-H", f"User-Agent: {UA}", "-H", "Accept-Language: fr-FR,fr;q=0.9"]
    if dest:
        cmd += ["-o", dest, "-w", "%{http_code}"]
    cmd.append(url)
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=timeout + 20)
    except subprocess.TimeoutExpired:
        return (False, 0) if dest else None
    sortie = r.stdout.decode("utf-8", "replace")
    if not dest:
        return sortie
    try:
        code = int(sortie.strip()[-3:])
    except ValueError:
        code = 0
    return (r.returncode == 0 and code == 200, code)


def liens_pdf(page):
    url = LISTING if page == 0 else f"{LISTING}?page={page}"
    html = curl(url)
    if not html:
        return None
    out = set()
    for h in re.findall(r'href="([^"]+\.pdf[^"]*)"', html, re.I):
        # Le schema peut manquer. Ne pas le prefixer avait fait conclure a tort
        # que toute une annee etait inaccessible chez UMOA-Titres.
        if h.startswith("//"):
            h = "https:" + h
        elif h.startswith("/"):
            h = "https://www.bceao.int" + h
        if h.startswith("http"):
            out.add(h)
    return out


def annee_du_nom(url):
    """L annee si le NOM la porte, sinon None. Le nom n est pas fiable : c est
    precisement pourquoi les None sont comptes et affiches."""
    nom = re.sub(r"%[0-9A-Fa-f]{2}", " ", os.path.basename(url))
    ans = re.findall(r"(20[0-2]\d)", nom)
    return ans[-1] if ans else None


def texte_pdf(chemin):
    try:
        r = subprocess.run(["pdftotext", "-layout", chemin, "-"],
                           capture_output=True, timeout=60)
        return r.stdout.decode("utf-8", "replace")
    except Exception:
        return ""


def est_de_la_serie(t):
    """Signature du document, lue DANS le contenu. Le nom mentant sur le type
    autant que sur la date, c est le seul critere qui tienne."""
    bas = t.lower().replace("é", "e").replace("è", "e")
    return "operations par maturit" in bas and "semaine du" in bas


MOIS = {"janvier": 1, "fevrier": 2, "février": 2, "mars": 3, "avril": 4,
        "mai": 5, "juin": 6, "juillet": 7, "aout": 8, "août": 8,
        "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12,
        "décembre": 12}


def mois_tolerant(mot):
    """Le numero du mois, en tolerant les FAUTES DE L EMETTEUR.

    Mesure du 2026-10-30 : quatre documents de fevrier 2025 ecrivent
    « fevriérr » — « fevrier » mal orthographie a la source. Une correspondance
    exacte les rejette, et quatre semaines consecutives disparaissent de la
    serie : exactement la forme d un faux trou d un mois.

    La tolerance est BORNEE : accents retires, puis on retient la cle la plus
    longue dont le mot est un PREFIXE etendu. Aucun nom de mois francais n est
    prefixe d un autre, la levee d ambiguite est donc sans risque — et un mot
    qui ne commence par aucun mois rend toujours None, plutot qu un mois
    devine.
    """
    if not mot:
        return None
    norm = (mot.lower().strip()
            .replace("é", "e").replace("è", "e").replace("ê", "e")
            .replace("û", "u").replace("ù", "u").replace("ô", "o")
            .replace("î", "i").replace("ï", "i").replace("à", "a"))
    if norm in MOIS:
        return MOIS[norm]
    cles = sorted({k.replace("é", "e").replace("û", "u").replace("ô", "o")
                   for k in MOIS}, key=len, reverse=True)
    for k in cles:
        if norm.startswith(k):
            return MOIS.get(k) or MOIS.get(k.replace("fevrier", "février"))
    return None


def semaine_du_contenu(t):
    """Fin de la semaine de reference, lue DANS le texte. C est `as_of_date`.

    Mesure du 2026-10-30 : la date de PUBLICATION (« Dakar, le … ») n existe que
    sur les documents anciens — zero occurrence sur ceux de 2026. On ne lit donc
    ici que la periode de reference, qui est presente partout.
    """
    m = re.search(r"[Ss]emaine\s+du\s+(\d{1,2})\s*(?:er)?\s*"
                  r"([A-Za-zéèûôA-ZÀ-ſ]+)?\s*"
                  # `au\s*` et non `au\s+` : un document de janvier 2026 ecrit
                  # « Semaine du 6 au12 janvier 2026 », sans espace apres « au ».
                  r"(?:\d{4})?\s*au\s*(\d{1,2})\s*(?:er)?\s*"
                  # `\s*` et non `\s+` avant l annee : les documents de 2019
                  # ecrivent « au 1er juillet2019 », SANS espace. Avec `\s+`,
                  # 5 documents sur les 150 premiers etaient classes
                  # SERIE_DATE_ILLISIBLE — une perte de 3 % qui aurait creuse
                  # un faux trou dans la serie, du fait de MA lecture.
                  r"([A-Za-zéèûôA-ZÀ-ſ]+)\s*(\d{4})", t)
    if not m:
        return None
    _, _, jf, mf, an = m.groups()
    mois = mois_tolerant(mf)
    if not mois:
        return None
    try:
        return f"{int(an):04d}-{mois:02d}-{int(jf):02d}"
    except ValueError:
        return None


def passe_contenu(cache, debut, fin):
    """Ouvre chaque document candidat et releve sa semaine de reference.
    REPRENABLE : ce qui est deja dans le TSV n est pas retelecharge."""
    liste = os.path.join(cache, "candidats.txt")
    tsv = os.path.join(cache, "dates.tsv")
    if not os.path.exists(liste):
        print("Liste des candidats absente du cache. Lancer d abord le "
              "recensement avec --cache.")
        return 1
    with open(liste, encoding="utf-8") as f:
        cands = [l.strip() for l in f if l.strip()]
    deja = {}
    if os.path.exists(tsv):
        with open(tsv, encoding="utf-8") as f:
            for l in f:
                p = l.rstrip("\n").split("\t")
                if len(p) >= 3:
                    deja[p[0]] = p
    fin = min(fin if fin > 0 else len(cands), len(cands))
    print(f"=== Dates lues DANS LE CONTENU — documents {debut} a {fin - 1} "
          f"sur {len(cands)} — LECTURE SEULE ===")
    tmp = tempfile.mkdtemp(prefix="bceao_contenu_")
    d = os.path.join(tmp, "x.pdf")
    n_new = 0
    with open(tsv, "a", encoding="utf-8") as sortie:
        for i in range(debut, fin):
            u = cands[i]
            if u in deja:
                continue
            ok, code = curl(u, dest=d, timeout=60)
            if not ok:
                # Un 404 n est pas un echec de telechargement : c est un lien
                # mort a la SOURCE, et le dire ainsi evite de chercher un
                # probleme d OCR qui n existe pas.
                etat = (f"HTTP_{code}_LIEN_MORT" if code
                        else "TELECHARGEMENT_ECHOUE")
                date = ""
            else:
                t = texte_pdf(d)
                if not t.strip():
                    etat, date = "PDF_ILLISIBLE", ""
                elif not est_de_la_serie(t):
                    etat, date = "HORS_SERIE", ""
                else:
                    date = semaine_du_contenu(t) or ""
                    etat = "SERIE" if date else "SERIE_DATE_ILLISIBLE"
            sortie.write(f"{u}\t{etat}\t{date}\n")
            sortie.flush()
            n_new += 1
            if n_new % 20 == 0:
                print(f"  ... {n_new} nouveaux documents ouverts")
    print(f"  {n_new} nouveau(x) document(s) ouvert(s) ; "
          f"{len(deja)} deja en cache. Total TSV : {len(deja) + n_new}")
    return 0


def bilan(cache):
    """Ce que les dates LUES disent de la continuite de la serie."""
    tsv = os.path.join(cache, "dates.tsv")
    if not os.path.exists(tsv):
        print("Aucun TSV : lancer --dates-du-contenu d abord.")
        return 1
    etats, dates = Counter(), []
    with open(tsv, encoding="utf-8") as f:
        for l in f:
            p = l.rstrip("\n").split("\t")
            if len(p) < 3:
                continue
            etats[p[1]] += 1
            if p[1] == "SERIE" and p[2]:
                dates.append(p[2])
    total = sum(etats.values())
    print(f"=== BILAN sur {total} document(s) ouvert(s) — LECTURE SEULE ===\n")
    for e, n in etats.most_common():
        print(f"  {e:24s} {n:4d}   {100.0 * n / total:5.1f} %")

    uniques = sorted(set(dates))
    print(f"\n  semaines DISTINCTES datees : {len(uniques)}")
    if len(dates) != len(uniques):
        print(f"  !! {len(dates) - len(uniques)} doublon(s) de semaine : deux "
              f"fichiers portent la meme semaine de reference.")
        print("     La cle unique uq_benchmark_series_point les rend inoffensifs")
        print("     a l insertion, mais il faut savoir qu ils existent.")
    if not uniques:
        return 0
    print(f"  couverture                 : {uniques[0]} -> {uniques[-1]}")

    par_an = Counter(d[:4] for d in uniques)
    print("\n  Semaines datees par annee (hebdomadaire => ~52) :")
    for an in sorted(par_an):
        n = par_an[an]
        alerte = "   << INCOMPLET" if n < 40 else ""
        print(f"    {an} : {n:3d}  {'#' * min(n, 52)}{alerte}")

    # Un trou se lit entre deux semaines consecutives, jamais sur un total.
    from datetime import date as _d
    def j(s):
        y, m, dd = (int(x) for x in s.split("-"))
        return _d(y, m, dd)
    trous = []
    for i in range(1, len(uniques)):
        ecart = (j(uniques[i]) - j(uniques[i - 1])).days
        if ecart > 14:
            trous.append((uniques[i - 1], uniques[i], ecart))
    print(f"\n  TROUS de plus de 14 jours entre deux semaines : {len(trous)}")
    for a_, b_, e in trous[:25]:
        print(f"    {a_} -> {b_}  :  {e} jours  ({e // 7} semaines)")
    if len(trous) > 25:
        print(f"    ... et {len(trous) - 25} autre(s)")
    if not trous:
        print("    aucun : la serie datee est CONTINUE a la semaine pres.")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", type=int, default=27)
    ap.add_argument("--cache", default="",
                    help="repertoire de cache ; rend le travail REPRENABLE")
    ap.add_argument("--dates-du-contenu", action="store_true",
                    help="ouvre les documents et lit leur semaine de reference")
    ap.add_argument("--debut", type=int, default=0)
    ap.add_argument("--fin", type=int, default=0)
    ap.add_argument("--bilan", action="store_true",
                    help="continuite de la serie d apres les dates LUES")
    ap.add_argument("--echantillon", type=int, default=0,
                    help="nombre de documents a OUVRIR par annee pour verifier "
                         "la forme du tableau (0 = recensement seul)")
    a = ap.parse_args()

    if a.bilan:
        return bilan(a.cache or ".")
    if a.dates_du_contenu:
        return passe_contenu(a.cache or ".", a.debut, a.fin)

    print("=== RECENSEMENT BCEAO « Operations par maturite » — LECTURE SEULE ===\n")

    par_page, pages_ko = {}, []
    for p in range(a.pages):
        liens = liens_pdf(p)
        if liens is None:
            pages_ko.append(p)
            continue
        par_page[p] = liens
        print(f"  page {p:2d} : {len(liens):3d} lien(s) PDF")

    if pages_ko:
        print(f"\n  !! {len(pages_ko)} page(s) sans reponse : {pages_ko}")
    if not par_page:
        print("\nAUCUNE page n a repondu. Rien ne peut etre conclu du listing.")
        return 1

    # Un lien present sur la grande majorite des pages est un lien de barre
    # laterale, pas un document de la serie.
    presence = Counter()
    for liens in par_page.values():
        for u in liens:
            presence[u] += 1
    seuil = max(2, int(0.6 * len(par_page)))
    laterale = {u for u, n in presence.items() if n >= seuil}
    serie = [u for u in presence if u not in laterale]

    print(f"\n--- Deduplication sur {len(par_page)} page(s) interrogee(s) ---")
    print(f"  liens PDF distincts, toutes pages      : {len(presence)}")
    print(f"  dont presents sur >= {seuil} pages (barre laterale) : {len(laterale)}")
    for u in sorted(laterale):
        print(f"      [{presence[u]:2d}x] {os.path.basename(u)[:78]}")
    print(f"  DOCUMENTS CANDIDATS DE LA SERIE         : {len(serie)}")

    if a.cache:
        os.makedirs(a.cache, exist_ok=True)
        with open(os.path.join(a.cache, "candidats.txt"), "w",
                  encoding="utf-8") as f:
            f.write("\n".join(sorted(serie)) + "\n")
        print(f"  liste ecrite dans {os.path.join(a.cache, 'candidats.txt')} "
              f"(hors depot) — la passe par le contenu est reprenable")

    print("\n--- Distribution par annee, d apres le NOM de fichier ---")
    par_an = defaultdict(list)
    for u in serie:
        par_an[annee_du_nom(u)].append(u)
    annees = sorted([x for x in par_an if x])
    if annees:
        total_date = sum(len(par_an[x]) for x in annees)
        for an in annees:
            n = len(par_an[an])
            print(f"  {an} : {n:3d}  {'#' * min(n, 60)}")
        indet = len(par_an.get(None, []))
        print(f"\n  annee lisible dans le nom   : {total_date}")
        print(f"  annee INDETERMINABLE du nom : {indet}")
        if indet > total_date * 0.1:
            print("  >> ATTENTION : la part d indetermines est telle que la")
            print("     distribution ci-dessus ne vaut PAS comme recensement")
            print("     chronologique. Seul le contenu peut trancher.")
        # Un trou se lit sur la distribution, pas sur un total.
        manquantes = [str(x) for x in range(int(annees[0]), int(annees[-1]) + 1)
                      if str(x) not in par_an]
        print(f"  annees ABSENTES de l intervalle {annees[0]}-{annees[-1]} : "
              f"{manquantes if manquantes else 'aucune'}")
        faibles = [an for an in annees if len(par_an[an]) < 30]
        print(f"  annees a MOINS de 30 documents (hebdomadaire => ~52) : "
              f"{faibles if faibles else 'aucune'}")
    else:
        print("  aucune annee lisible dans les noms de fichiers.")

    if a.echantillon:
        print(f"\n--- Forme du tableau : {a.echantillon} document(s) ouvert(s) "
              f"par annee ---")
        tmp = tempfile.mkdtemp(prefix="bceao_recens_")
        conformes = Counter()
        hors = Counter()
        for an in annees:
            for u in sorted(par_an[an])[:a.echantillon]:
                d = os.path.join(tmp, "x.pdf")
                ok, code = curl(u, dest=d)
                if not ok:
                    hors[an] += 1
                    print(f"  {an}  HTTP {code or 'ECHEC':>4}  "
                          f"{os.path.basename(u)[:58]}")
                    continue
                t = texte_pdf(d)
                if est_de_la_serie(t):
                    conformes[an] += 1
                    mats = sum(1 for m in ("UN JOUR", "UNE SEMAINE", "UN MOIS",
                                           "TROIS MOIS", "DOUZE MOIS")
                               if m in t.upper())
                    print(f"  {an}  SERIE OK   {mats}/5 maturites temoins   "
                          f"{os.path.basename(u)[:52]}")
                else:
                    hors[an] += 1
                    print(f"  {an}  HORS SERIE {os.path.basename(u)[:60]}")
        print("\n  Par annee — conformes / hors serie ou illisibles :")
        for an in annees:
            print(f"    {an} : {conformes[an]} / {hors[an]}")
        if sum(hors.values()):
            print("  >> Des documents HORS SERIE subsistent apres deduplication :")
            print("     le listing melange plusieurs types. Le filtre de CONTENU")
            print("     de l extracteur est donc indispensable, pas optionnel.")

    print("\nLECTURE SEULE : aucune ecriture effectuee.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
