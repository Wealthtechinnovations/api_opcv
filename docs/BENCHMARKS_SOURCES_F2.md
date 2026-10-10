# CHANTIER BENCHMARKS — F2 : Matrice de verification des sources (EN LIGNE)

> Genere le 2026-07-09/10. Phase F2 du chantier « architecture benchmarks 3 couches ».
> Verification en ligne reelle (WebFetch/WebSearch). Niveaux de validation (complement obligatoire) :
> (1) identifiee · (2) techniquement accessible · (3) backfillable · (4) integrable-cron.
> Aucune donnee financiere inventee ; erreurs HTTP rapportees telles quelles.

## NIGERIA

| Source | HTTP / format reel | Historique backfill | Licence | Niveau |
|---|---|---|---|---|
| NGX ASI API `doclib.ngxgroup.com/REST/api/chartdata/ASI` | **200 JSON** : `currentPrice`, `currentDateTime`=2026-07-08 (live), `IndiciesData`=[[ts_ms,val]] | Debut ~1996. **A REVERIFIER** : queue de tableau rapportee a 2011 (probable artefact lecture) | Libre (deja en prod) | **4** |
| NGX `/indices/` + `/historical-data/` | 200 HTML vitrine | Historique derriere licence (X-DataPortal) | **Payant** | 1-2 |
| CBN NOFR `NOF_Rates.html` | 200 HTML : Date, Volume, Weighted Average Rate + « Export to Excel » | Oui via Excel | Libre | **3** (scraping HTML/Excel fragile) |
| CBN NFEM FX `ExchRateByCurrency.html` | 200 HTML : NFEM ₦/US$ high/low/close/VWA + Export Excel | Oui. **USD/NGN seulement — pas d'EUR/NGN** (cross a faire) | Libre | **3** |
| FMDQ `/exchange/` | 200 HTML : NIBOR, NITTY, NTB, FGN yields + **S&P/FMDQ Nigeria Sovereign Bond Index 932.18 @2026-07-08 (gratuit)**. Pas de JSON direct | Historique via portail emarkets (licence probable) ; **factsheet PDF gratuit** | Live gratuit / hist restreint | **2** |
| DMO `fgn-bonds` | 200 HTML + PDF + spreadsheets (Eurobonds prices/yields, auctions) | Partiel (XLS/PDF Eurobonds) | Libre | 2-3 |

## AFRIQUE (S&P DJI) — verrou licence

| Source | HTTP / format | Sans licence ? | Niveau |
|---|---|---|---|
| S&P All Africa | **403 (Akamai anti-bot, PAS paywall)** | Niveau du jour + factsheet mensuel PDF publics via headless ; historique quotidien complet = licence | **2** (headless) |
| S&P Africa 40 / All-Africa ex-SA | **403** | idem | **2** |
| S&P Africa Sovereign Bond (+ ex-SA) | **403** | idem ; ETF miroir « EasyETFs S&P Sovereign Africa Bond » (NAV publique) = proxy exploitable | **2** |
| Methodologie PDF Africa Sovereign | 403 en fetch direct mais document public | **13 pays** confirmes : Botswana, Egypte, Ghana, Kenya, Maurice, **Maroc**, Namibie, **Nigeria**, Afrique du Sud, Tanzanie, **Tunisie**, Ouganda, Zambie. Rebal mensuel, ponderation valeur de marche, devise locale | **2** |

## BCE (pont EUR/USD)

| Source | HTTP / format | Historique | Niveau |
|---|---|---|---|
| ECB euro reference rates | 200. **URLs stables** : quotidien `/stats/eurofxref/eurofxref-daily.xml` ; CSV `/stats/eurofxref/eurofxref.zip` ; **hist complet** `/stats/eurofxref/eurofxref-hist.zip` (+ `-hist.xml`, `-hist-90d.xml`, `-sdmx.xml`). Publie ~16h CET jours ouvres | Depuis **1999-01-04**, ~30-42 devises. **NGN non couvert** (EUR/USD direct OK ; EUR/NGN = cross via CBN) | **4** (pleinement industrialisable) |

## Synthese Nigeria/Afrique/BCE

**Afrique sans licence** : valeur du jour = oui (headless, fragile + risque juridique) ; factsheet mensuel PDF = oui (notamment **S&P/FMDQ Nigeria Sovereign gratuit sur fmdqgroup.com**) ; **historique quotidien complet = NON sans licence S&P DJI** = vrai verrou pour le backfill couche Afrique.

**Fallback si S&P verrouille** : proxy Afrique maison a partir d'indices pays libres (NGX ASI gratuit deja en cron + BRVM/UEMOA, EGX Egypte, JSE, MASI, TUNINDEX) pondere selon cle documentee ; et/ou NAV publique de l'ETF EasyETFs S&P Sovereign Africa Bond comme proxy obligataire. Additif, sans licence.

**3 risques** :
1. Blocage bot S&P (403) → cron dependrait d'un headless fragile + risque licence sur la redistribution des niveaux.
2. Scraping HTML CBN/FMDQ (pas d'API JSON stable) → casse au moindre redesign.
3. Chaine devise : BCE ne fournit pas EUR/NGN → cross EUR/USD(BCE) × USD/NGN(CBN), dependance en cascade + risque de desync des dates.

**A lever avant integration** : reconfirmer la profondeur reelle de `IndiciesData` (NGX ASI) — brique deja en cron.

## MAROC

| Source | HTTP reel | Methode | Historique / backfill | Licence | Niveau |
|---|---|---|---|---|---|
| casablanca-bourse.com `/composition-and-history-indices` | **503** (WebFetch) / curl http=000 corps vide | WAF (Imperva/Akamai), bloque depuis IP datacenter → headless + IP residentielle | Non evaluable | WAF | **1** |
| Flash Quotidien PDF Casablanca | Non recuperable (meme domaine WAF) ; motif `flash_quotidien_YYYYMMDD.pdf` non confirme | Alternatives : casabourse.ma, ou medias24 (#MASI) | — | WAF | **1** |
| bkam.ma **MONIA** | curl defaut **403** ; **avec User-Agent navigateur = 200** ✅ | **Le 403 vient du User-Agent.** Page HTML server-side (tableau des seances). Lien `/export/blockcsv/566622/…` mais **export = size=0** meme avec cookie+referer | Tableau HTML ≈ 1 mois (jusqu'au 09/07/2026). Backfill profond non automatisable via CSV | Publique | **2** (daily scrape HTML), backfill partiel |
| bkam.ma **Taux ref BDT (courbe)** | **200** avec UA navigateur | HTML server-side, tableau maturites (…3 ans, 4 ans…). Lien blockcsv (probablement vide idem) | Derniere courbe en HTML ; backfill par scrape quotidien | Publique | **2→3** |
| apihelpdesk.centralbankofmorocco.ma `/apis` | **200** | Portail API BKAM reel mais **APIs non listees sans login** (bouton SE CONNECTER) | Inscription requise, gratuite non confirmee | Auth | **1** (a souscrire) |
| medias24.com `getMasiHistory` | **200** (curl+UA ; 403 via WebFetch = filtrage UA) | **JSON** `{result:{labels:[ts_s], prices:[]}}` | **122 points, 2026-01-09 → 2026-07-09 (aujourd'hui)**. ⚠️ param `periode` **IGNORE** (fenetre fixe ≈6 mois) → backfill profond impossible | Publique (deja en cron) | **4** daily, backfill **non** |

## TUNISIE

| Source | HTTP reel | Methode | Historique / backfill | Licence | Niveau |
|---|---|---|---|---|---|
| bvmt.com.tn `/rest_api/rest/history/TN0009050014` | **200** | **JSON** `indexHistorys[]` (`lAST`, `sEANCE`), pas d'OHLC | **58 points, 13/04→08/07/2026** (~3 mois glissants) | Publique | **4** daily, backfill **court** |
| tunis-stockexchange.com `/historique-devises?tab=tunindex` | **200** | **HTML statique** (pas de XHR). Colonnes Date, **TND, USD, EUR** pour TUNINDEX + TUNINDEX20 | **Pagination ~139 pages** → plusieurs annees. **CRUCIAL pages EUR/USD** (series officielles en devise) | Publique | **3** (scrape pagine) → **4** (page 1 daily) |
| ilboursa.com `/marches/download/PX1` | **403 Cloudflare** (« Just a moment », challenge managed JS+cookies) | Bloque sans resolveur CF / headless | Non evaluable | Anti-bot CF | **1** |
| cmf.tn `/courbes-des-taux` + tunisiayieldcurve.tn | CMF **200** ; tunisiayieldcurve.tn **503/000** (injoignable depuis datacenter) | CMF = page nav : portail live + **archive CMF 2007-2017** (format non confirme, probable PDF/Excel) | Portail live inaccessible IP datacenter ; archive a explorer | Publique | **1→2** |
| bct.gov.tn `/bct/siteprod/index.jsp?la=AN` | **200** (105 KB) | **HTML statique JSP**. Home : **TM quotidien** (09/07), **TMM mensuel** (juin 2026), **change** (08/07), taux directeur | Valeurs courantes scrapeables ; historique via sous-pages `id=…` a cartographier | Publique | **3→4** daily |
| biat.com.tn `/tunisian-bond-index` | **200** | Reportings **PDF hebdo** `/sites/default/files/YEAR-MONTH/TBI-Reporting-DATE.pdf` | **Archive ~2003**. Sous-indices **TBI global/CT/MT/MLT/LT dans les PDF** (extraction requise) | Publique | **3** (parse PDF) → **4** hebdo |

## Synthese Maroc/Tunisie

**(a) Pretes pour cron immediat** : medias24 MASI (JSON, daily incremental) ; BVMT Tunindex (JSON, daily) ; tunis-stockexchange TUNINDEX TND/USD/EUR (scrape page 1 daily — cle pour pages EUR/USD) ; MONIA + BDT (scrape HTML avec UA navigateur, PAS via CSV) ; BCT (scrape HTML home).

**(b) Necessitent travail** : Casablanca indices + Flash Quotidien (headless + IP residentielle, ou casabourse.ma/medias24) ; ilboursa PX1 (headless/solveur CF) ; courbe taux tunisienne (headless/IP TN ; archive CMF 2007-2017 manuelle) ; BIAT TBI (parsing PDF hebdo) ; API BKAM (souscription) ; backfill profond MONIA/BDT (blockcsv vide → headless ou API BKAM).

**(c) 3 risques** : (1) fenetres d'historique COURTES sur les API JSON (medias24 ≈6 mois fixe ignore `periode` ; BVMT ~60 seances) → backfill long impossible sans source d'archive distincte (tunis-stockexchange OK Tunisie ; MASI long = aucune API officielle accessible identifiee) ; (2) WAF/anti-bot depuis IP datacenter (Casablanca 503, ilboursa CF) → cron serveur echoue silencieusement, prevoir monitoring ; (3) fragilite scraping HTML (MONIA/BDT/BCT/tunis-stockexchange), exports CSV officiels BKAM vides → pas de fallback propre.

**(d) MONIA — contournement 403 (ACTIONNABLE)** : le 403 vient du **User-Agent** (CloudFront devant bkam.ma filtre UA vide/curl). **UA navigateur desktop → HTTP 200 confirme.**
- Correctif : requete du cron avec `User-Agent: Mozilla/5.0 (…) Chrome/… Safari/537.36` + `Accept-Language`.
- Recuperation : **parser le tableau HTML** de la page (server-side), NE PAS dependre du `/export/blockcsv/566622/…` (renvoie size=0 en acces automatise).
- Backfill profond MONIA (depuis dec. 2018) : blockcsv via **navigateur headless** (Playwright execute le JS/nonce eZ-Publish) OU souscrire l'API BKAM (#helpdesk).
- NB : notre scraper actuel (scrapeMONIA) utilise deja un UA navigateur mais depend du blockcsv (vide) → **fix = basculer sur le parsing du tableau HTML**. A traiter en F4 (adapters). MONIA a `pays:[]` (non propage aux fonds) donc faible urgence.

## Conclusion F2 (transverse)

- **Series officielles deja en devise etrangere** : **TUNINDEX TND/USD/EUR** (tunis-stockexchange) = a preferer a toute conversion maison pour les pages EUR/USD tunisiennes (regle FX du chantier).
- **Pont EUR/USD** : BCE, industrialisable (URLs stables, hist 1999). EUR/NGN et EUR/autres = cross via FX banque centrale locale.
- **Couche Afrique (S&P)** : verrou licence sur l'historique → **fallback proxy maison** (indices pays libres ponderes) marque `is_synthetic=true`, ou NAV d'ETF replicant.
- **Backfill long** : seules tunis-stockexchange (Tunindex) et BCE offrent une profondeur ; MASI et NGX ASI n'ont pas de source d'archive officielle librement accessible → couche locale limitee a l'incremental daily + l'existant deja en base (BRVM/MASI/NSE/Tunindex ont deja 6000+ points historiques dans indice_references, acquis anterieurement).
- **Statuts structures** (complement obligatoire) confirmes necessaires : NO_VALUE_LICENSE_REQUIRED (S&P, NGX hist), NO_VALUE_DYNAMIC_PAGE_NEEDS_BROWSER (Casablanca, ilboursa, tunisiayieldcurve), SYNTHETIC_BENCHMARK_USED (Afrique proxy, cash composites), FX_MISSING (EUR/NGN).

