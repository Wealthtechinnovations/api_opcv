#!/usr/bin/env python3
"""
Registre des sources institutionnelles de marche — teste chaque URL, ne suppose rien.

LIVRABLE 1 du mandat du 2026-10-30 : « un registre des sources officielles
UEMOA/CEMAC et Maroc, avec URL, format, frequence, historique accessible et
statut de collecte ».

POURQUOI UN SCRIPT ET NON UNE LISTE. Une liste d URL affirme ; un script mesure.
Le mandat insiste lui-meme : « la publication d une archive ne suffit pas a
certifier que toutes ses annees ont ete extraites ou normalisees », et
« la presence d un schema SQL ou d un script de deploiement ne prouve pas que la
base fonctionne en production ». Le registre doit donc etre REJOUABLE, et porter
la date de sa derniere mesure.

A REJOUER DEPUIS S2. Le reseau du serveur de production peut differer de celui
d une session : `BENCHMARKS_F3_MAPPING_SCHEMA.md` note deja une source
« injoignable datacenter ». Une source accessible ici n est pas forcement
accessible la ou tourne la collecte. Deposer ce script dans
`scripts/diag/ondemand/` pour l executer sur S2, ou l appeler depuis un cron.

CE QUE LE SCRIPT NE PROUVE PAS, et il faut le dire :
  - un code 200 prouve l accessibilite, pas la presence des donnees voulues ;
  - le comptage de tableaux, de liens CSV/XLS et de PDF mesure la STRUCTURE
    offerte, pas la profondeur d historique reellement extractible ;
  - la plage d annees detectee vient des dates visibles dans le HTML : elle
    indique un ordre de grandeur, jamais une couverture certifiee.

La profondeur d historique par serie exige une sonde par source, instrument et
maturite. C est l etape suivante du livrable 2, pas celle-ci.

LECTURE SEULE : requetes HTTP GET sur des portails publics. Aucune ecriture.

USAGE  python3 scripts/diag/registre_sources_marche.py
"""
import json, subprocess, sys, re

SOURCES = [
 # zone, famille, fournisseur, libelle, url
 ("UEMOA","monetaire","BCEAO","Portail","https://www.bceao.int/"),
 ("UEMOA","monetaire","BCEAO","Evolution marche interbancaire","https://www.bceao.int/fr/documents/evolution-du-marche-interbancaire-de-luemoa"),
 ("UEMOA","monetaire","BCEAO","Operations marche interbancaire","https://www.bceao.int/fr/documents/operations-effectuees-sur-le-marche-interbancaire-de-lumoa-0"),
 ("UEMOA","obligataire","UMOA-Titres","Portail","https://www.umoatitres.org/fr/"),
 ("UEMOA","obligataire","UMOA-Titres","Courbe des taux","https://www.umoatitres.org/fr/ressources-2/courbe-des-taux/"),
 ("UEMOA","actions","BRVM","Portail","https://www.brvm.org/"),
 ("UEMOA","actions","BRVM","Indices","https://www.brvm.org/fr/indices"),
 ("UEMOA","obligataire","BRVM","Marche des obligations","https://www.brvm.org/fr/marche-des-obligations"),
 ("UEMOA","actions","BRVM","Donnees fin de journee","https://www.brvm.org/fr/donnees-de-fin-de-journee"),
 ("UEMOA","actions","BRVM","Base financiere bfin","https://bfin.brvm.org/"),
 ("CEMAC","monetaire","BEAC","Portail","https://www.beac.int/"),
 ("CEMAC","monetaire","BEAC","Stats marche monetaire","https://www.beac.int/economie-stats/statistiques-marche-monetaire/"),
 ("CEMAC","monetaire","BEAC","Base BDEMF (presentation)","https://www.beac.int/economie-stats/base-de-donnees-economiques-monetaires-financieres/"),
 ("CEMAC","monetaire","BEAC","Base BDEMF (acces)","https://www.beac.int/bdemfcemac"),
 ("CEMAC","obligataire","BEAC","Stats titres publics","https://www.beac.int/economie-stats/statistiques-titres-publics/"),
 ("CEMAC","obligataire","BEAC","Marche des titres publics","https://www.beac.int/m-des-titres-publics/"),
 ("CEMAC","obligataire","BEAC","Annonces et communiques","https://www.beac.int/m-des-titres-publics/annonces-et-communiques"),
 ("CEMAC","actions","BVMAC","Portail","https://www.bvm-ac.org/"),
 ("MAROC","monetaire","BKAM","MONIA","https://www.bkam.ma/en/Markets/Key-indicators/Money-market/Monia-index-moroccan-overnight-index-average"),
 ("MAROC","monetaire","BKAM","Marche monetaire interbancaire","https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-monetaire/Marche-monetaire-interbancaire"),
 ("MAROC","obligataire","BKAM","Methodologie courbe BDT (PDF)","https://www.bkam.ma/content/download/781174/8708255/M%C3%A9thodologie%20de%20calcul%20de%20la%20courbe%20des%20taux%20de%20r%C3%A9f%C3%A9rence%20BDT.pdf"),
 ("MAROC","actions","Casablanca","Indices (market-data)","https://www.casablanca-bourse.com/market-data/indices"),
 ("MAROC","actions","Casablanca","Indices (live-market)","https://www.casablanca-bourse.com/live-market/indices"),
 ("MAROC","macro","MEF","Portail","https://www.finances.gov.ma/"),
 ("MAROC","macro","HCP","Portail","https://www.hcp.ma/"),
]
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

def sonde(url):
    cmd = ["curl","-s","-L","--compressed","--max-time","40","-o","/tmp/_p.bin",
           "-w","%{http_code}|%{content_type}|%{size_download}|%{time_total}|%{url_effective}",
           "-H",f"User-Agent: {UA}","-H","Accept-Language: fr-FR,fr;q=0.9,en;q=0.8", url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        code,ctype,size,t,eff = (r.stdout.split("|") + [""]*5)[:5]
    except Exception as e:
        return {"code":"000","note":f"echec: {str(e)[:40]}"}
    o = {"code":code,"type":(ctype or "").split(";")[0],"octets":int(size or 0),
         "secondes":round(float(t or 0),1),"redirige": eff.rstrip("/") != url.rstrip("/")}
    try:
        b = open("/tmp/_p.bin","rb").read()
        txt = b.decode("utf-8","replace")
        o["tables"] = txt.lower().count("<table")
        o["liens_csv_xls"] = len(re.findall(r'href="[^"]+\.(?:csv|xlsx?|xls)', txt, re.I))
        o["liens_pdf"] = len(re.findall(r'href="[^"]+\.pdf', txt, re.I))
        d = re.findall(r"\b\d{2}/\d{2}/(20\d{2})\b|\b(20\d{2})-\d{2}-\d{2}\b", txt)
        ans = sorted({x for p in d for x in p if x})
        o["annees_vues"] = f"{ans[0]}-{ans[-1]}" if ans else "—"
    except Exception:
        pass
    return o

print(f"{'zone':<7}{'famille':<12}{'fournisseur':<13}{'libelle':<34}{'code':>5}{'octets':>10}{'s':>6}  {'type':<26}{'tbl':>4}{'csv':>4}{'pdf':>4}  annees")
reg = []
for zone, fam, four, lib, url in SOURCES:
    r = sonde(url)
    reg.append({"zone":zone,"famille":fam,"fournisseur":four,"libelle":lib,"url":url,**r})
    print(f"{zone:<7}{fam:<12}{four:<13}{lib[:33]:<34}{r.get('code','?'):>5}"
          f"{r.get('octets',0):>10}{r.get('secondes',0):>6}  {r.get('type','')[:25]:<26}"
          f"{r.get('tables',0):>4}{r.get('liens_csv_xls',0):>4}{r.get('liens_pdf',0):>4}  {r.get('annees_vues','—')}")
json.dump(reg, open("/tmp/claude-0/-home-user/2dbded44-7fed-52ca-9e5f-785045282b27/scratchpad/registre_sources.json","w"), indent=1, ensure_ascii=False)
ok = sum(1 for r in reg if r.get("code") == "200")
print(f"\n{ok}/{len(reg)} sources repondent 200 depuis CETTE session.")
print("Le reseau du serveur S2 peut differer : le registre devra etre rejoue depuis S2.")
