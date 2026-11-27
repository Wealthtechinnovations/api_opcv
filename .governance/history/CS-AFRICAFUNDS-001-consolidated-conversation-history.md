# CS-AFRICAFUNDS-001 — Historique conversationnel consolidé AfricaFunds

> Statut : `HISTORICAL_CONSOLIDATED_MEMORY`
> Projet / continuité : `CS-AFRICAFUNDS-001`
> Produit : **AfricaFunds**
> Dépôts : `Wealthtechinnovations/api_opcv` + `Wealthtechinnovations/front_end_opcvm`
> Branche canonique des deux dépôts : `claude/code-review-improvements-ikvuj`
> Date de consolidation : **2026-11-26**
> Nature : mémoire historique consolidée, **non autoritaire pour l’exécution**.
> Autorités live supérieures : task queue, claims, HEADs, production mesurée, gouvernance et projections Programme Director en vigueur.

## 0. Objet de ce document

Ce document consolide, sous le même identifiant `CS-AFRICAFUNDS-001`, les sujets, décisions, directives, constats, chantiers, phases et points de continuité retrouvés dans les échanges AfricaFunds depuis le lancement de la gouvernance du projet, ainsi que les états versionnés qui en sont issus.

Il a été créé parce que l’historique existait déjà sous de nombreuses formes — `WORK_LOG.md`, `PROJECT_CONTEXT.md`, `SUIVI.md`, task queue, requirements, evidence, incidents, matrices W1/W2, Allocation et Programme Director — mais **pas encore sous la forme d’une seule mémoire consolidée de conversation**.

Ce document :
- ne crée **aucune seconde queue** ;
- ne crée **aucun nouvel identifiant de continuité concurrent** ;
- ne remplace ni `.governance/loop/task-queue.json`, ni les claims actifs, ni le `SUIVI.md` global frontend ;
- ne donne aucune autorisation implicite de modifier production, DB, secrets, crons, branches, protections ou données ;
- sert à empêcher qu’un sujet déjà discuté, analysé ou décidé soit perdu lors d’une nouvelle conversation ou d’un changement d’agent.

Il s’agit d’une consolidation **sémantique complète des sujets et décisions retrouvables**, pas d’une transcription verbatim de chaque phrase de chat.

---

## 1. Identité et périmètre canonique

Identité stable acceptée depuis septembre 2026 :

```text
PROJECT_UID  = CS-AFRICAFUNDS-001
PROJECT_ID   = chainsolutions.africafunds
PROJECT_NAME = AfricaFunds
```

AfricaFunds est une application unique répartie sur deux historiques Git indépendants :

- API : `Wealthtechinnovations/api_opcv`
- Frontend : `Wealthtechinnovations/front_end_opcvm`

Les deux dépôts utilisent la branche canonique / default / source de production :

```text
claude/code-review-improvements-ikvuj
```

Ne pas réintroduire `main`, `master` ou `server` comme branches canoniques, ne pas créer de monorepo et ne pas inventer de SHA global unique.

Modèle d’état retenu :

```text
GIT_STATE  = {API_SHA, FRONTEND_SHA}
FUND_STATE = {API_SHA, FRONTEND_SHA, SUIVI_CHECKPOINT, PRODUCTION_ATTESTATION}
```

Production actuelle du projet : S2 / `africafunds.chainsolutions.fr`, avec API et frontend déployés depuis leurs checkouts séparés.

Les anciens noms `FundAfrica` ou chemins `fundafrica` restent historiques lorsqu’ils décrivent du code, des chemins ou de l’infrastructure réellement existants.

---

## 2. Directives permanentes issues des échanges utilisateur

Les demandes répétées du propriétaire ont construit un contrat de travail constant :

1. **Ne jamais recommencer depuis zéro** lorsqu’un chantier existe déjà.
2. **Réobserver les deux HEAD live avant toute écriture**.
3. Ne pas mélanger AfricaFunds avec MCP, UAES, SadiaAF / `africafunds-market-data-pipeline`, BRVM Chainsolutions séparé, Stablecoin ou tout autre projet.
4. Ne pas créer de seconde queue, de seconde autorité, de second Fund Master, de second moteur Allocation, de second stockage documentaire ou de seconde gouvernance.
5. Conserver l’existant utile et appliquer l’ordre :
   `RÉUTILISER → CORRIGER → RENFORCER → ÉTENDRE → MIGRER COMPATIBLEMENT`.
6. Zéro force-push, reset destructif, nettoyage aveugle ou écrasement du travail concurrent.
7. Respecter les claims et le **Single Writer** par surface.
8. Ne pas se limiter aux rapports : lorsqu’une tranche est admise, **agir, coder, corriger, tester, intégrer, déployer si les gates sont satisfaits, certifier puis continuer**.
9. Privilégier des unités techniques **courtes, persistantes, cumulatives et vérifiables** plutôt que répéter le mandat à chaque passage.
10. Ne pas déclarer `DONE`, `PASS`, `aligné production` ou `autonome` sans preuve mesurée.
11. Les tests qui nécessitent un environnement doivent privilégier les GitHub Actions et les mécanismes déjà présents.
12. Depuis le 26 novembre 2026 : **mode d’exécution par défaut = ChatGPT + fonctions GitHub directes**.
13. Codex n’est pas utilisé par défaut. Il ne doit être envisagé que sur demande explicite ou si une capacité indispensable n’est réellement disponible ni via GitHub direct, ni via Actions, ni via les autres outils autorisés.
14. Une source réglementaire, une taxonomie, un TODO ou un ancien plan **n’est jamais une preuve d’implémentation**.
15. Un manque de preuve = `UNKNOWN / NOT_VERIFIED`, jamais `DONE`.

---

## 3. Fondation gouvernance — septembre 2026

### 3.1 Regulatory Plus et Loop Engineering

AfricaFunds a repris les mécanismes transversaux de gouvernance de Regulatory sans importer son métier prospectus.

Éléments consolidés :
- `00_START_HERE.md`
- `GOVERNANCE.md`
- `SOURCE_OF_TRUTH.md`
- `AGENTS.md`
- `LOOP_ENGINEERING.md`
- Operational Memory
- requirements / evidence / traceability
- Single Writer
- contrôle bi-repository
- GOV-006 GitHub→S2
- reprise multi-agent

Décision fondamentale : enrichir l’existant au lieu de reconstruire une gouvernance parallèle.

### 3.2 Source de vérité et état bi-repository

Le frontend `SUIVI.md` reste l’historique/checkpoint global.

Le dépôt API contient sa mémoire locale, les matrices et les contrôles de gouvernance.

Les faits production mesurés ont priorité sur les textes périmés.

---

## 4. Réconciliation S2, sécurité et secrets — 11 au 13 septembre 2026

Les échanges et travaux ont couvert :

- dérive entre task queue et projections humaines ;
- réconciliation GitHub→S2 via GOV-006 ;
- fallback GitHub Actions→SSH S2 avec `StrictHostKeyChecking=yes` ;
- observation S2, DB et HTTP ;
- préservation des fichiers untracked runtime ;
- séparation du vrai `.env` runtime du Git courant ;
- rotation `DB_PASSWORD` avec rollback et test préalable ;
- rotation `JWT_SECRET`, dual-key, readiness polling, puis révocation de l’ancienne clé ;
- conservation des rotations externes `EMAIL_PASSWORD` et `MAGIC_SECRET_KEY` comme gaps fournisseur ;
- attestation API/frontend/S2 sans inventer d’état unique.

Principe conservé : aucune valeur de secret ne doit être écrite dans Git ou les preuves.

---

## 5. Production MariaDB / OOM — AF-OPS-003

Un chantier RCA important a occupé plusieurs conversations.

État historique consolidé :
- plusieurs A/B jemalloc courts ont déjà été exécutés ;
- ils ont été rollbackés proprement ;
- ils n’ont pas permis de prouver à eux seuls la cause racine ;
- il ne faut **pas rejouer ces A/B courts** simplement parce qu’une nouvelle session démarre ;
- l’état de gouvernance avait un temps dérivé en continuant à parler de `ALLOCATOR_A_B_REQUIRED / BLOCKED_HUMAN_APPROVAL` alors que les A/B avaient déjà eu lieu ;
- une cause technique forte a ensuite été identifiée autour du churn de prepared statements provoqué par de gros `UPDATE ... CASE` dynamiques utilisés avec `mysql2.execute()` ;
- la correction bornée a consisté à utiliser `query()` pour ces statements dynamiques, sans changer les SELECTs stables ;
- la correction a été testée RED→GREEN et déployée ;
- la production est restée saine après correction, mais la **RCA exacte de l’OOM reste historiquement non clôturée** tant que les preuves longues et comparatives ne suffisent pas.

`AF-OPS-001` reste une opération MariaDB Restart distincte soumise à son approbation propre.

Ne pas confondre :
- stabilité observée,
- correction d’un mécanisme plausible,
- et preuve définitive de cause racine.

---

## 6. Data Quality, données dérivées et intégrité

Les échanges ont établi une chaîne de priorité :

```text
intégrité/fraîcheur des VL
→ performances dérivées
→ rankings/classements
→ écrans/allocations/rapports
```

Chantiers canoniques :
- `AF-OPS-007` — scale breaks / performances absurdes / intégrité ;
- `AF-OPS-008` — orphan/stale performance ;
- `AF-OPS-009` — fiabilité pipelines Nigeria/Tunisie et pays.

Contrôles historiques importants :
- C2 : performances orphelines ;
- C3 : performances absurdes ;
- C7 : ruptures d’échelle / unités / devises ;
- C8 : fraîcheur performances vs VL.

Décision : une donnée dérivée ne doit jamais être « réparée » avant sa donnée source si le problème amont reste ouvert.

---

## 7. Pipelines pays existants

### Maroc
- ASFIM comme source principale de VL ;
- MASI et benchmark associés ;
- fallback MASI via source alternative déjà mis en place ;
- gap historique MASI distinct de la fraîcheur courante ;
- documents officiels à identifier par ISIN/Maroclear → page officielle → href réel, sans inventer de filename/URL.

### Nigeria
- SEC Weekly NAV ;
- archives historiques importantes ;
- risques de champ `Unit Price / Bid / Offer / Net Assets` et de devise ;
- contrat de qualification / provenance plus riche que les autres pays ;
- W1 a montré que l’extracteur contient déjà une grande partie de la provenance mais que l’importeur courant peut la perdre.

### Tunisie
- CMF ;
- ingestion quotidienne et tables d’audit/quarantaine ;
- archives/recherche importantes ;
- source file/sheet/row existant dans les étapes amont mais pas encore relié de façon générique au canonical row.

### UEMOA
- BRVM BOC ;
- staging fort avec URL PDF, hash, page, raw line, matching, qualité ;
- le staging UEMOA est un modèle à réutiliser, pas à reconstruire.

### CEMAC
- BVMAC BOC ;
- 34 fonds canoniques historiquement présents ;
- pipeline candidat BVMAC existant ;
- W2 a prouvé source/parsing/mapping read-only mais n’a pas autorisé à lui seul un cron/staging/import production.

---

## 8. Cartographie produit exhaustive et Programme Director

Une demande importante de l’utilisateur était de ne plus avoir seulement une liste de bugs ou de tâches ponctuelles, mais une **cartographie du produit AfricaFunds de bout en bout**.

Chaîne cible :

```text
Sources
→ acquisition/raw
→ normalisation
→ Fund/Organization masters
→ historique
→ API/view models
→ analytics/quality
→ frontend/pages
→ espaces utilisateurs
→ Allocation / institutionnel
→ SEO / Schema.org
→ observabilité
→ utilisateurs finaux
```

La task queue canonique contient 37 tâches.

Pour éviter d’y pousser des idées non qualifiées, plusieurs couches non autoritaires ont été créées :
- 37 intakes produit/tech/data ;
- Gap Harvester ;
- qualification des 125 marqueurs bruts ;
- matrice de couverture des capacités ;
- 27 propositions structurées de tâches/epics ;
- W1/W2 et matrices associées.

Règle : ces matrices préparent la promotion ; elles **ne sont jamais la queue**.

---

## 9. Gap Harvester et 125 marqueurs

Le Gap Harvester avait détecté 125 candidats TODO/FIXME/HACK/XXX.

La qualification a montré qu’ils ne représentent pas 125 tâches.

Classes principales :
- faux positifs générés par le scanner lui-même ;
- code Bootstrap/vendor ;
- vieux thème frontend ;
- scaffolds microservices inactifs ;
- commentaires TODO sans exigence ;
- un petit nombre de vrais sujets à qualifier.

Décision : `1 marker ≠ 1 task`.

Les 56 placeholders `services/funds` / `services/portfolio` ne doivent pas être activés ou transformés en 56 fonctionnalités simplement pour faire disparaître des TODO.

---

## 10. Allocation — programme AF-ALLOC-001

Programme existant : `AF-TASK-012 → AF-TASK-023`.

Décisions structurantes :
- moteur canonique Node/JavaScript ;
- ne pas créer un second moteur Python ;
- API contract V2 ;
- préparation data ;
- moteur d’allocation canonique ;
- contraintes ;
- validation numérique ;
- backtesting ;
- analytics/explainability ;
- Portfolio Lab ;
- Model Portfolios / Mandate Engine ;
- rollout / observabilité / retraite legacy.

`AF-TASK-017` reste actuellement `IN_PROGRESS` sur :
- `src/services/allocation/constraints/**`
- `tests/allocation-constraints.test.js`
- `.github/workflows/governance-allocation-constraints.yml`

Objectif : compilateur de contraintes séparant strictement rendement et poids, avec feasibility pre-check avant solveur.

Ne jamais recréer `AF-ALLOC-002` ou un moteur parallèle.

---

## 11. W1 — fondations canoniques

W1 a été mené comme une grosse opération read-only/qualification avant toute refonte.

### Principales découvertes
- `fond_investissements` reste le Fund Master de fait ;
- `societes` reste l’autorité manager/SGO ;
- pas de modèle canonique explicitement certifié SubFund/ShareClass ;
- 71 fonds sans `societe_id` au checkpoint W1 ;
- ISIN absent de manière très dépendante du marché, donc ne pas l’inventer ;
- 15 colonnes additives existent live dans `valorisations` mais n’étaient pas exposées dans `src/models/vl.js` ;
- provenance canonical-row très inégale par pays ;
- cinq tables de référentiel FundAfrica existent live ;
- analytics fragmentés ;
- view-model boundary nécessaire avant Atomic Design.

### Benchmark look-ahead
W1 a mesuré 2 027 lignes à forte confiance affectées par un benchmark futur :
- Maroc : 1 919 ;
- UEMOA : 108 ;
- 685 fonds ;
- 10 dates.

Cause : logique `nearest +/- 7 days` avec `Math.abs` dans les chemins de propagation de benchmark.

Règle cible déjà décidée historiquement : exact, sinon dernière valeur `<= date cible`, jamais future.

### Nigeria provenance
Le CSV/extracteur SEC pouvait porter la source et le type de prix, mais le chemin import pouvait perdre ces métadonnées.

Un constat important : un grand nombre de lignes courantes étaient `offer_price_fallback`.

Décision : renseigner la provenance ne doit **jamais** transformer un Bid/Offer fallback en `OK` silencieux. Ces mesures restent explicites et reviewables.

### FX
Le helper legacy `getRate()` possède un comportement contracté qui peut tomber sur le premier taux futur avant l’historique.

Décision : ne pas casser brutalement `getRate()` ; créer un helper strict `as-of/no-lookahead` et migrer les consommateurs sensibles progressivement.

### Les 8 deltas W1
1. Benchmark temporal integrity.
2. Nigeria provenance/type transport.
3. Fund/SGO identity reconciliation.
4. Generic lineage bridge.
5. ORM/live-schema parity.
6. Reference-table schema governance.
7. Stable view models before Atomic Design.
8. Strict FX as-of helper.

Checkpoint : `.governance/matrices/africafunds-w1-checkpoint.json`.

---

## 12. W2 — pays, sources et expansion panafricaine

W2 a introduit une échelle de readiness :

```text
L0 REFERENCE_ONLY
L1 REGULATOR_OR_SOURCE_SURFACE_IDENTIFIED
L2 REGULATOR_UNIVERSE_REPRODUCIBLE
L3 REPRESENTATIVE_PRICE_SOURCE_FEASIBILITY_PROVEN
L4 TECHNICAL_FETCH_MAPPING_DRYRUN_PROVEN
L5 CONNECTOR_PROMOTION_READY
L6 ACTIVE_PRODUCTION_PIPELINE
```

Cette échelle empêche qu’un pays simplement présent dans une taxonomie soit confondu avec un connecteur prêt.

### État historique W2
- Maroc : L6.
- Nigeria : L6.
- Tunisie : L6.
- UEMOA : L6.
- CEMAC : L3 au checkpoint W2, source/parsing/mapping prouvés mais dry-run complet encore attendu.
- Ghana : pilote L3.
- Kenya : pilote L3.
- Égypte / Afrique du Sud / Maurice / Botswana / Namibie / Éthiopie : découverte L1.
- autres marchés : L0 tant qu’une preuve actuelle n’existe pas.

### CEMAC/BVMAC
Préflight historique W2 :
- 802 références index ;
- BOC BVMAC 2026-10-05 accessible ;
- 23 lignes OPCVM parsées ;
- 0 parse failure ;
- 19 quality OK ;
- 4 `SUSPECT_VARIATION` ;
- 18 matches exacts ;
- 1 fuzzy ;
- 4 unmatched.

Règle : cette preuve autorise l’étape dry-run, pas l’activation d’un cron ou d’un staging.

### Ghana
Pilotes structurés autour de :
- EDC ;
- CAL Asset Management ;
- Brassica ;
- SDC Capital ;
- Databank.

### Kenya
Pilotes :
- NCBA ;
- Etica ;
- Britam ;
- CIC ;
- KCB.

NCBA avait le signal source quotidien le plus direct dans le checkpoint W2.

### Les 7 deltas W2
1. Country Operations auth/RBAC/ownership.
2. Legacy FX writer + credential retirement.
3. CEMAC/BVMAC.
4. Country pipeline lineage.
5. Country Panel governed import.
6. Ghana/Kenya source feasibility.
7. Country pipeline observability.

Checkpoint : `.governance/matrices/africafunds-w2-checkpoint.json`.

Important : W2 est une **mémoire historique de découverte** ; toujours revalider ses marchés contre le HEAD et les sources live avant promotion.

---

## 13. Fund Master, SGO, ShareClass et lineage

Concepts cibles évoqués depuis les premières analyses :

```text
Fund
→ SubFund
→ ShareClass
```

avec :
- Organization / SGO ;
- Document ;
- Event ;
- Observation ;
- Benchmark ;
- Market Data ;
- FX ;
- Data Quality ;
- Lineage.

Mais le projet ne doit pas créer ces entités par théorie.

Décisions :
- Fund ≠ UI Template.
- observed ≠ calculated.
- missing ≠ zero.
- aucune ShareClass/SubFund inventée depuis un nom.
- conserver `fond_investissements` comme compatibilité tant qu’un modèle plus fin n’est pas prouvé.
- conserver `societes` comme autorité SGO.
- lier lineage/provenance aux preuves réelles, ne jamais les fabriquer.

---

## 14. Frontend, Design System et Atomic Design

La vision discutée pour le frontend suit :

```text
Atoms
→ Molecules
→ Organisms
→ Templates
→ Pages
```

Mais la refonte doit rester incrémentale.

Principe W1 :
- stabiliser les view models/API contracts ;
- ajouter des adapters/clients partagés ;
- migrer un organisme/template à la fois ;
- préserver URLs, SSR, métadonnées, calculs et navigation ;
- retirer une route legacy uniquement après zéro consommateur prouvé.

Organisms fonctionnels évoqués pour les pages fonds :
- Header / Navigation ;
- Overview / Key Figures ;
- NAV ;
- Performance ;
- Risk ;
- Benchmark ;
- Portfolio / Allocation / Holdings ;
- Income ;
- Fees ;
- ShareClasses ;
- Investment Policy ;
- ESG ;
- Documents ;
- Events ;
- Organizations ;
- Data Quality ;
- Actions.

Les organisms doivent consommer des view models stables, pas des tables SQL brutes.

---

## 15. Espaces utilisateurs

Espaces historiques présents ou prévus :
- Admin ;
- Investor ;
- Management / SGO ;
- Institutional ;
- Data Requester ;
- Country Panel ;
- Distributor.

Décision : ne pas confondre présence d’une route/panel avec couverture fonctionnelle complète.

Le travail futur doit produire une matrice rôle → écran → API → permission → ownership → état de couverture.

---

## 16. Due Diligence / Institutionnel

La Due Diligence doit être une extension native d’AfricaFunds, pas une application ou base parallèle.

Chaîne cible discutée :

```text
Mandates
→ Eligibility / Hard Gates
→ Screening
→ Long List
→ Quantitative Analysis
→ DDQ
→ ODD
→ Findings
→ Short List
→ RFP
→ Clarifications
→ Technical Evaluation
→ Financial Evaluation
→ Investment Committee
→ Approve / Reject
→ Monitoring
→ Periodic Review / Re-underwriting
```

Règles :
- réutiliser Fund Master ;
- réutiliser SGO ;
- réutiliser Documents ;
- réutiliser analytics/risk ;
- réutiliser auth/users ;
- aucune copie parallèle des fonds ou documents ;
- décisions humaines séparées des scores calculés ;
- snapshots/versioning pour rendre une décision reconstructible.

Les anciens identifiants conceptuels institutionnels ne sont pas automatiquement des IDs de task queue.

---

## 17. SEO, Schema.org, sémantique et accessibilité

La directive produit couvre :
- URLs ;
- profondeur de navigation ;
- liens crawlables ;
- title ;
- meta description ;
- canonical ;
- robots ;
- sitemap ;
- headings ;
- OpenGraph ;
- Twitter metadata ;
- hreflang si pertinent ;
- SSR ;
- Core Web Vitals ;
- duplication ;
- pagination ;
- indexability/crawlability ;
- pages orphelines.

Schema.org / JSON-LD doit être un graphe cohérent, pas une collection de blocs isolés.

Entités candidates historiques :
- Organization ;
- WebSite ;
- WebPage ;
- BreadcrumbList ;
- Article ;
- Dataset ;
- Person ;
- entités financières lorsque sémantiquement adaptées.

Règle : stable `@id`, publisher/isPartOf/mainEntity/about/author/provider cohérents.

Atomic Design, SEO, Schema.org, accessibilité et performance doivent être testés comme un ensemble de non-régression frontend.

---

## 18. Programme Director — AF-TASK-024 à AF-TASK-028

Le Programme Director a été construit pour éviter que le projet repose sur la mémoire d’une conversation.

Phases :
- AF-TASK-024 : projection drift fail-closed ;
- AF-TASK-025 : projections humaines déterministes ;
- AF-TASK-026 : managed blocks ;
- AF-TASK-027 : writeback engine ;
- AF-TASK-028 : workflow manuel gouverné / admission vers publication réelle.

Principes :
- queue unique ;
- claims task-local ;
- projections générées, non écrites manuellement comme source de vérité ;
- exact HEAD ;
- invariants ;
- marker drift fail-closed ;
- no-change = no commit ;
- API et frontend gardent leurs commits séparés.

---

## 19. AF-TASK-028 — progression 25–26 novembre 2026

### AF-EVD-073
Recette CI-equivalent du workflow manuel :
- dry-run ;
- recheck ;
- apply local ;
- no-change/no-commit sur miroirs isolés.

### AF-EVD-074
Leases/fencing task-local :
- 7 tests ;
- concurrence Git réelle locale ;
- aucun claim historique migré ;
- aucun verrou distant encore activé.

### AF-EVD-075
Publication préparée bi-repository :
- validation parent/diff/bloc ;
- confirmation ;
- recheck avant CAS ;
- receipt partiel ;
- reprise sans rollback destructif.

### AF-EVD-076
Recette intégrée :
- wiring PASS ;
- leases/fencing PASS ;
- publication PASS ;
- projections exactes ;
- pas de mutation distante.

### AF-EVD-077
Transport distant observé depuis le runner GitHub :
- IDs repos ;
- HEADs ;
- run/attempt ;
- acteur ;
- horloge ;
- gate d’écriture resté fermé.

État consolidé :
- le mécanisme de writeback et les contrats sont avancés ;
- identité/transport write minimal et handoff claim restent à qualifier ;
- les claims historiques actifs n’ont pas encore été transférés vers un lease gouverné ;
- le moteur codeur autonome n’est pas encore certifié comme raccordé de bout en bout ;
- deux cycles planifiés productifs réels avec commits non vides, CI et reprise n’ont pas encore été certifiés ;
- ne pas appeler cela « autonomie complète » tant que ces preuves manquent.

---

## 20. CAS / claims / leases / fencing — 26 novembre 2026

Les commits live du 26 novembre ont encore renforcé la frontière d’écriture :
- conditional CAS writer fail-closed ;
- test du vrai boundary CAS au lieu d’un simple texte documentaire ;
- observation de la readiness réelle d’un claim task-local sur runner CUG ;
- protection contre une horloge forgée au boundary live.

Dernier HEAD API observé lors de cette consolidation :

```text
d27c083dd4909890959cc38a4c76f6b032bd6197
fix(governance): prevent forged lease clock at live CAS write boundary
```

Dernier HEAD frontend observé :

```text
7e82ecc6bd2f1c51d4137662951699584e7a6a3a
docs(SUIVI): record live remote preflight and remaining writer admission gates
```

Claims actifs au moment de la consolidation :
- `AF-TASK-017`
- `AF-TASK-028`

---

## 21. Mode d’exécution GitHub direct

Directive propriétaire du 26 novembre 2026 :

```text
MODE PAR DEFAUT = ChatGPT + fonctions GitHub directes
```

Conséquences :
- lire HEAD/branches/commits/PR/CI via GitHub direct ;
- lire et modifier les fichiers avec les fonctions GitHub exposées ;
- utiliser GitHub Actions pour les tests nécessitant un environnement ;
- ne pas lancer Codex par défaut ;
- ne jamais basculer silencieusement vers Codex ;
- si Codex devient réellement indispensable, expliquer d’abord la capacité manquante.

Cette directive s’ajoute à la gouvernance existante ; elle ne réduit ni les tests, ni la traçabilité, ni les rechecks, ni le contrôle anti-régression.

---

## 22. Productivité autonome et stagnation

Le propriétaire a explicitement refusé que l’automatisation se limite à produire des rapports.

Mandat d’exécution :
- observer ;
- diagnostiquer ;
- corriger ;
- programmer ;
- tester ;
- intégrer ;
- déployer lorsque les gates sont remplies ;
- certifier ;
- sélectionner le prochain travail.

À la suite de périodes de stagnation, la règle a été renforcée :
- arrêter de répéter intégralement le mandat à chaque cycle ;
- choisir une unité technique courte ;
- la rendre persistante ;
- produire une preuve vérifiable ;
- continuer cumulativement.

L’autonomie ne doit cependant jamais contourner :
- claims ;
- leases ;
- fencing ;
- CAS ;
- branches ;
- droits GitHub ;
- CI ;
- sécurité ;
- production gates.

---

## 23. Exclusions de périmètre

Ne pas mélanger ce continuum avec :
- `Patricked-code/MCP` ;
- UAES ;
- SadiaAF / `Patricked-code/africafunds-market-data-pipeline` ;
- Workers Director global ;
- Stablecoin ;
- BRVM Chainsolutions séparé ;
- Regulatory métier prospectus.

Les patterns de gouvernance ou outils peuvent être réutilisés comme références, mais leurs queues, états, tâches et identifiants ne deviennent jamais ceux d’AfricaFunds.

---

## 24. Carte des principaux artefacts déjà issus de ces échanges

### Contexte / continuité
- `PROJECT_CONTEXT.md`
- `WORK_LOG.md`
- `00_START_HERE.md`
- `SOURCE_OF_TRUTH.md`
- `LOOP_ENGINEERING.md`
- `docs/adr/ADR-AF-0002-operational-memory-and-loop.md`

### Programme Director
- `.governance/loop/task-queue.json`
- `.governance/loop/handoff.json`
- `.governance/knowledge/evidence.json`
- `.governance/knowledge/requirements.json`
- `scripts/governance/program_*.py`
- workflows Programme Director / projection writeback

### Cartographie produit
- `.governance/matrices/africafunds-product-intake-matrix.json`
- `.governance/matrices/africafunds-gap-qualification-matrix.json`
- `.governance/matrices/africafunds-capability-coverage-matrix.json`
- `.governance/matrices/africafunds-task-promotion-plan.json`

### W1
- `.governance/matrices/africafunds-w1-checkpoint.json`
- matrices `africafunds-w1-*.json`

### W2
- `.governance/matrices/africafunds-w2-checkpoint.json`
- matrices `africafunds-w2-*.json`

### Production / incidents
- `.governance/incidents/registry.json`
- `docs/ETAT_PRODUCTION_VERIFIE.md`
- runbooks GOV-006 / MariaDB / diagnostics

---

## 25. Ce qui était incomplet avant cette consolidation

Avant ce document, l’information était riche mais fragmentée :
- une partie dans `SUIVI.md` ;
- une partie dans `WORK_LOG.md` ;
- une partie dans les matrices W1/W2 ;
- une partie dans la queue / evidence ;
- une partie uniquement dans les échanges de conversation.

Les sujets les plus exposés à la perte de contexte étaient :
- lien entre la vision produit globale et les tâches ;
- raison d’existence des 37 intakes / 27 propositions ;
- relation W1/W2 avec la queue ;
- règles de non-duplication ;
- vision Atomic Design ;
- institutionnel / Due Diligence ;
- SEO / Schema.org ;
- distinction source/régulateur/connecteur ;
- décisions de temporal integrity ;
- mode GitHub direct / Codex exception ;
- exigence de productivité autonome réelle plutôt que rapport répétitif.

Ce document ferme ce gap de mémoire.

---

## 26. Règle de reprise à partir de cette mémoire

Tout agent reprenant AfricaFunds doit :

1. lire les autorités live dans l’ordre défini par `00_START_HERE.md` ;
2. lire ce document comme **mémoire historique consolidée** ;
3. réobserver les deux HEAD ;
4. relire la queue et les claims ;
5. vérifier les travaux terminés depuis le dernier checkpoint historique mentionné ici ;
6. ne jamais réutiliser un SHA historique comme état actuel sans recheck ;
7. dédupliquer tout nouveau sujet avec :
   - queue ;
   - Programme Director ;
   - intakes ;
   - task promotion plan ;
   - W1/W2 ;
   - incidents ;
   - requirements/evidence ;
8. ne promouvoir ou coder qu’une tranche admise et non revendiquée ;
9. persister une nouvelle preuve/checkpoint avant de passer à la suite.

---

## 27. État live au moment de la consolidation

Observé directement sur GitHub le 26 novembre 2026 :

```text
API HEAD      d27c083dd4909890959cc38a4c76f6b032bd6197
FRONTEND HEAD 7e82ecc6bd2f1c51d4137662951699584e7a6a3a
BRANCHE       claude/code-review-improvements-ikvuj

CLAIMS ACTIFS
AF-TASK-017
AF-TASK-028
```

`AF-TASK-028` reste `IN_PROGRESS / MANUAL_WRITEBACK_WORKFLOW_PREFLIGHT`.

Son next action live demande encore :
- identité least-privilege ;
- transport authentifié ;
- handoff/reconciliation du claim historique ;
- activation leases/fencing seulement après admission ;
- raccordement du moteur codeur réel ;
- deux runs planifiés productifs distincts ;
- commits code non vides ;
- CI ;
- preuves de recovery.

Aucun ancien état W1/W2 ne doit être utilisé pour écraser ce state live.

---

## 28. Conclusion de continuité

Le fil rouge de tous les échanges AfricaFunds est désormais rattaché explicitement à :

```text
CS-AFRICAFUNDS-001
```

La mémoire historique est consolidée, mais l’exécution continue de dépendre des autorités live.

Principe final :

```text
HISTORIQUE CONSOLIDÉ
        +
HEADS LIVE
        +
QUEUE / CLAIMS LIVE
        +
PREUVES / PRODUCTION
        ↓
RECONCILE
        ↓
SELECT NEXT ADMISSIBLE WORK
        ↓
IMPLEMENT
        ↓
TEST / CI
        ↓
PERSIST EVIDENCE
        ↓
CONTINUE
```

---

## 29. Delta de continuité — RCA / CMF / DB-auth de septembre 2026

Ce complément persiste des faits précis retrouvés dans la séquence de conversation opérationnelle qui avait suivi la réconciliation post-A/B.

### AF-OPS-003 — état post-A/B et corrélation mémoire

- Les A/B allocateur courts glibc/jemalloc ont été exécutés et rollbackés ; ils sont **non discriminants pour la dérive RSS multi-heures**. Ils ne doivent pas être rejoués comme simple étape de reprise.
- L’écart massif entre `Memory_used` MariaDB et le RSS anonyme/privé reste un fait observé ; la cause racine ne doit pas être déclarée à partir de ce seul écart.
- Les contextes OOM reconstruits couvrent plusieurs workloads lourds différents ; un job unique n’est donc pas une condition commune prouvée.
- La corrélation longue durée doit relier RSS/RssAnon/Private_Dirty, uptime/PID MariaDB, compteurs de tables temporaires/connexions, crons, batchs, timeouts client, continuation réelle des handlers Node et activité SQL.
- Le label kernel `npm start invoked oom-killer` n’identifie pas un build frontend : API et frontend possèdent tous deux un script `start`, tandis que le build frontend est distinct.
- `AF-OPS-001` reste séparé de la RCA : une politique de redémarrage améliore la résilience mais ne prouve ni ne corrige la cause racine.

### AF-OPS-009 — dérive de contrat source CMF/Tunisie

Un diagnostic GitHub Actions en lecture seule a montré que la page publique CMF était actuelle, mais que le collecteur historique rejetait les nouveaux noms de fichiers.

Familles effectivement observées :

```text
vl_du_16_septembre_2026.xlsx
vl_du_14-09-26.xlsx
vl_10_09_2026.xlsx
vl09092026.xlsx
```

Le collecteur n’acceptait historiquement que la famille `valeurs_liquidatives*.xls[x]`. En plus, un parsing générique de six chiffres pouvait mal interpréter un nom compact comme `vl09092026.xlsx`.

Correctif borné :
- commit API `37dd9c58cb3b77dc3c4124cd3c08d4f7eda53546` ;
- découverte élargie aux familles CMF historiques et courantes ;
- parsing explicite des formats observés ;
- tests dédiés ;
- dry-run GitHub Actions `35161092905` : SUCCESS ;
- 269 fichiers CMF découverts, 11 fichiers sélectionnés sur la fenêtre septembre, 11 téléchargés, 1 408 lignes NAV et 759 dividendes parsés, 0 erreur de parsing.

Ce dry-run ne disposait pas de la base/mapping de production : `clean_nav=0` et `no_match=1408` ne constituent donc pas une preuve d’échec du correctif de découverte. Aucune écriture DB de production n’a été effectuée dans ce lot.

La fraîcheur Nigeria doit rester distinguée : lors de cette investigation, la source SEC publique observée ne proposait pas de publication plus récente que le 28 août 2026. La Tunisie était un défaut de collecteur malgré une source actuelle ; le Nigeria relevait alors d’un retard amont observé.

### AF-OPS-005 — refus DB post-rotation

Les preuves disponibles établissent :
- des `Access denied for user 'fund_opcvm'@'localhost'` intermittents après rotation ;
- le `.env` runtime courant correspond au credential actif ;
- `.env.production` et `.env.production.plan-b` portent des credentials anciens/différents ;
- aucun consommateur actif précis n’était encore causalement attribué au moment du checkpoint ;
- aucune nouvelle rotation DB ni restart MariaDB n’était justifiée.

Le diagnostic read-only a été renforcé au commit `8d6e234eca6d2dd9ec9ba3ff7b7bdf18523f7d4d` pour examiner loaders, références aux fichiers stale, PM2, systemd, open file descriptors, processus et logs sans exposer de secrets. Le run GitHub Actions `35162750904` a terminé `SUCCESS`. Ce succès prouve l’exécution sûre du diagnostic ; il ne doit pas être transformé en attribution causale non observée.

### Correction documentaire frontend

Le commit frontend `3205e6c8619523150307903cdf4ed001621d0553` a réaligné le `SUIVI.md` sur les preuves RCA persistées, notamment la corrélation OOM/workload et l’ambiguïté de `npm start`.

---

## 30. Couverture des sources conversationnelles disponibles

La consolidation sémantique a été rapprochée des instantanés de conversation/projet disponibles suivants :

- `Analyse du projet AfricaFunds.txt` ;
- `Branche · RepoAFricafunds Amelioration.txt` ;
- `RepoAFricafunds Amelioration.txt` ;
- `Point sur la RCA.txt` ;
- `Souvenir du projet FundAfrica.txt` ;
- `Branche · b1Outil de due diligence.txt`.

Ces instantanés couvrent notamment identité produit, modèle Fund/SubFund/ShareClass, provenance/lineage, Atomic Design, analytics/benchmarks, collecte/automatisation, Tunisie, Nigeria, Maroc, Openfunds comme référence séparée, Regulatory Plus, Loop Engineering, GOV-006, S2, secrets, task queue, cartographie exhaustive, Due Diligence institutionnelle, autonomie, conditions d’arrêt, RCA MariaDB et règles anti-duplication.

Ils sont traités comme **sources historiques de consolidation**, jamais comme autorité live. Les valeurs de secrets, données privées non nécessaires et transcriptions verbatim de chat ne sont pas copiées dans Git.

---

## 31. Intégration mécanique dans la reprise multi-agent

La mémoire consolidée ne doit plus dépendre d’un agent qui « pense à la lire ».

Le mécanisme de reprise doit donc :
- charger le manifeste JSON et le document humain depuis Git ;
- vérifier `project_uid == continuity_key == CS-AFRICAFUNDS-001` ;
- calculer leurs empreintes SHA-256 ;
- exposer dans le contexte reconstruit que la mémoire historique Git a été chargée ;
- conserver `conversation_memory_used = false` : l’agent reprend depuis Git, pas depuis sa mémoire de chat ;
- faire échouer le gate si la mémoire consolidée est absente ou incohérente ;
- continuer à faire primer HEADs, queue, claims, preuves et production live sur tout checkpoint historique.

Règle de communication opérationnelle issue des échanges : les messages de progression ne sont jamais des work gates. L’agent doit privilégier des séquences de travail plus longues et ne s’interrompre que pour un blocage réel, une décision irréversible/risquée nécessitant autorisation, ou un lot substantiel terminé.

---

## 32. Décisions historiques complémentaires à ne pas reperdre

### Openfunds

Un chantier Openfunds a existé comme **référence architecturale et d’interopérabilité**, avec l’idée d’un modèle AfricaFunds plus riche et de mappings import/export. La décision ultérieure est cependant explicite : Openfunds ne partage ni queue, ni runtime, ni gouvernance opérationnelle avec AfricaFunds. Les tâches `OF-*`, branches ou PR Openfunds ne deviennent jamais automatiquement des tâches `CS-AFRICAFUNDS-001`. Toute idée réutilisée doit être requalifiée, dédupliquée puis promue dans la queue AfricaFunds existante.

### Portfolio Allocation

Les échanges sur `lequant40/portfolio_allocation_js` ont confirmé que le chantier Allocation AfricaFunds devait être compris, reconstruit et renforcé **dans la continuité du code JavaScript/Node existant**, pas remplacé par un moteur Python parallèle. Cette décision est aujourd’hui matérialisée par le programme `AF-ALLOC-001` / `AF-TASK-012..023`.

### Mémoire de décision institutionnelle

La cible Due Diligence/Institutionnel doit rendre une décision reconstructible dans le temps. Une décision d’approbation/rejet doit pouvoir référencer, selon ce qui existe réellement, la version du mandat, le snapshot de données, la version Fund Master, les mesures performance/risque/AUM, les hard gates, le fit mandat, la version DDQ, les findings, les évaluations RFP et la décision comité. Cette exigence ne justifie aucune base parallèle : elle doit étendre les autorités Fund/SGO/Documents/analytics/auth existantes.

### Conditions d’arrêt de l’autonomie gouvernée

Un agent ne s’arrête pas parce qu’un audit est terminé s’il reste un travail sûr, indépendant et admissible. Les vrais gates historiques incluent notamment :
- approbation humaine requise pour une opération explicitement gated ;
- permission indispensable absente ;
- dépendance fournisseur externe ;
- opération destructive/irréversible exigeant autorisation ;
- writer concurrent non réconcilié ;
- gate sécurité ;
- source obligatoire indisponible.

Même lorsqu’un gate persiste, le système doit persister le checkpoint, poursuivre les tâches indépendantes admissibles et laisser un handoff déterministe.

### Décisions de gouvernance supersédées ou interdites

Ne pas réintroduire :
- un second `SUIVI`, une seconde queue ou une mémoire seulement conversationnelle ;
- S2 comme autorité Git concurrente ;
- l’obligation du bridge MCP comme seul moyen d’observer S2 lorsque le fallback GitHub Actions→SSH existe ;
- la création libre de branches agent/Codex/ChatGPT ;
- un inventaire Markdown manuel complet à chaque reprise ;
- le vrai `.env` suivi par Git ;
- Openfunds comme même programme opérationnel qu’AfricaFunds ;
- des extractions Nigeria/Tunisie supposées intégrées au Fund Master sans preuve ;
- un module institutionnel autonome dupliquant Fund/SGO/Documents/analytics ;
- un statut `FULLY_GOVERNED` lorsqu’un gap externe vérifié subsiste.

### Chaîne historique S2/GOV-006

Les échanges ont établi et testé :
- observation S2 en lecture seule ;
- fallback GitHub Actions→SSH avec pin strict ;
- GOV-006 pour réconcilier GitHub ↔ S2 sans reset destructif ni suppression d’untracked ;
- fallbacks API/frontend ;
- inventaires secrets et préflights ;
- séparation Git / déploiement / runtime.

Ces éléments sont des actifs historiques à réutiliser ; ils ne doivent pas être reconstruits comme si le projet repartait de zéro.



---

## 33. Delta de continuité — constats C2/C8 et directives de la conversation consolidante

> Classification : `HISTORICAL_CHAT_OBSERVATION_REQUIRES_LIVE_RECHECK`
> Intégration : 2026-11-26
> Continuité : `CS-AFRICAFUNDS-001`
> Autorité : mémoire historique uniquement. Les HEAD, la queue, les claims, les preuves et la production live restent supérieurs.

Cette conversation de reprise a confirmé plusieurs règles et produit un diagnostic data read-only suffisamment précis pour ne plus être perdu, tout en étant désormais à réconcilier avec l'état live plus récent de novembre.

### 33.1 Séparation stricte AfricaFunds / MCP

Le propriétaire a réaffirmé explicitement que **AfricaFunds et `Patricked-code/MCP` sont deux projets distincts**. Le MCP peut servir de transport/outillage d'accès, mais ses tâches, sa queue, ses statuts, ses registres et son programme ne deviennent jamais ceux d'AfricaFunds.

Conséquences :
- aucune tâche MCP ne doit être promue dans la queue AfricaFunds par assimilation ;
- aucune autorité MCP ne remplace le Programme Director `CS-AFRICAFUNDS-001` ;
- le projet AfricaFunds conserve sa queue unique, ses claims, ses deux dépôts et son `FUND_STATE`.

### 33.2 Système queue / tâches / autonomie

La conversation a confirmé que la queue, le state, le handoff, le Programme Director et les mécanismes de reprise existent déjà et doivent être **étendus**, jamais recréés.

Le modèle d'autonomie retenu reste :

```text
TRIGGER
→ RECONNECT
→ READ STATE / QUEUE / HANDOFF
→ REOBSERVE REALITY
→ SELECT NEXT SAFE TASK
→ EXECUTE IF AUTHORIZED
→ VERIFY
→ PERSIST / CHECKPOINT
→ NEXT
```

Cette autonomie est celle du système déclenché par agent/workflow/cron/scheduler ; elle ne signifie pas qu'une conversation ChatGPT continue à travailler hors session.

### 33.3 Snapshot C2 — performances orphelines

Pendant cette conversation, une mesure SQL read-only avait observé :
- `performences` : **14 fonds** dont la dernière performance ne possédait aucune VL à la même date ;
- `performences_eurs` : **23 fonds** ;
- `performences_usds` : **23 fonds**.

Les 14 cas locaux identifiés étaient :

**Maroc**
- 638 — SG TRESOR PLUS ;
- 649 — SG ACTIONS PLUS ;
- 652 — SCR RENDEMENT ;
- 798 — FCP CAPITAL TAALIM ;
- 840 — FCP AVENIR LONG TERME ;
- 883 — ELAN SOLIDARITE ;
- 976 — CAT OBLI FRONTIERES ;
- 1048 — AXA EPARGNE ;
- 1051 — AVENIR RENDEMENT ;
- 2683 — CMKD CROISSANCE ;
- 2685 — CAPITAL SUR ;
- 2686 — CFG PERSPECTIVES.

**UEMOA**
- 1540 — SOAGA EPARGNE SERENITE ;
- 1543 — SOAGA EPARGNE ACTIVE.

Douze cas avaient le profil « performance orpheline postérieure à la dernière VL, avec une performance antérieure encore alignée sur cette dernière VL ».

Deux cas nécessitaient un traitement distinct parce que la série VL avait ensuite avancé :
- **798 FCP CAPITAL TAALIM** : performance orpheline 2026-06-09 ; dernière performance avec VL 2026-06-05 ; dernière VL observée 2026-09-11 ;
- **1048 AXA EPARGNE** : performance orpheline 2026-05-28 ; dernière performance avec VL 2026-05-22 ; dernière VL observée 2026-09-11.

Conclusion historique : pour ces deux fonds, retirer une ligne orpheline ne suffirait pas ; la couche dérivée devait ensuite être recalculée depuis les VL validées.

### 33.4 Pattern Nigeria EUR/USD — 23 fonds communs

Les **23 mêmes fonds Nigeria** apparaissaient à la fois dans les orphelines EUR et USD :

```text
1141  AFRINVEST DOLLAR FUND
1154  ARM EUROBOND FUND
1158  AVA GAM FIXED INCOME DOLLAR FUND
1160  AXA MANSARD DOLLAR BOND FUND
1168  NIGERIA DOLLAR INCOME FUND
1170  NORRENBERGER DOLLAR FUND
1175  CORDROS DOLLAR FUND
1189  EDC DOLLAR FUND
1196  EMERGING AFRICA EUROBOND FUND
1213  FSDH DOLLAR FUND
1214  FUTUREVIEW DOLLAR FUND
1239  NOVA DOLLAR FIXED INCOME FUND
1244  PACAM EUROBOND FUND
1257  STANBIC IBTC DOLLAR FUND
1274  UNITED CAPITAL GLOBAL FIXED INCOME FUND
2764  AIICO EUROBOND FUND
2767  COWRY EUROBOND FUND
2768  FSL EUROBOND FUND
2856  LEAD DOLLAR FIXED INCOME FUND
2857  RMBN DOLLAR FIXED INCOME FUND
2858  ARM SPECIALIZED DOLLAR FUND
2861  ARM SHORT-TERM EUROBOND FUND
2866  United Capital Nigerian Eurobond Fund
```

Pour chacun de ces 23 fonds, le snapshot observé était cohérent sur quatre champs :

```text
datejour              = 2026-07-10
dernière VL réelle    = 2026-07-10
performance locale    = 2026-07-10
performance EUR       = 2026-07-24
performance USD       = 2026-07-24
```

La table historique `bak_valorisations_ng_20260801_122943` avait elle aussi une VL maximale au **2026-07-10** pour ces fonds et **aucune VL 2026-07-24**. Cela avait fortement affaibli l'hypothèse « des VL du 24/07 ont existé puis ont été supprimées ».

La piste de travail issue de cette observation était donc : auditer le chemin de calcul/persistance EUR/USD qui a pu enregistrer une date sans VL source correspondante, avant toute réparation de données.

Cette observation historique **n'autorise pas** à restaurer artificiellement une VL 2026-07-24 : une telle VL ne peut être admise que si une source Nigeria officielle la prouve.

### 33.5 Snapshot C8 et fraîcheur associé

Le même diagnostic read-only avait mesuré l'alignement « dernière performance locale = dernière VL » :

```text
CEMAC    34 / 34    retard moyen 0,0 j
MAROC     8 / 644   retard moyen 108,3 j
NIGERIA 297 / 330   retard moyen 6,8 j
TUNISIE   8 / 131   retard moyen 89,7 j
UEMOA    36 / 111   retard moyen 26,8 j
```

Fraîcheur maximale des VL dans ce snapshot :

```text
CEMAC   2024-12-12
MAROC   2026-09-11
NIGERIA 2026-08-28
TUNISIE 2026-08-28
UEMOA   2026-09-11
```

Le 34/34 CEMAC n'était donc pas une preuve de fraîcheur : performances et VL étaient cohérentes entre elles, mais la VL elle-même était ancienne.

Ces chiffres sont **historiques** et ne doivent jamais être réutilisés comme état courant sans nouvelle mesure.

### 33.6 Règles correctives déduites de ce diagnostic

Le fil a fixé les garde-fous suivants :
1. corriger la **cause de génération** avant de nettoyer ses produits dérivés ;
2. ne jamais faire de `DELETE` massif des performances orphelines sans attribution fonds par fonds et sauvegarde ;
3. ne recalculer une performance qu'à partir d'une VL validée et avec une date cohérente avec la VL réellement utilisée ;
4. ne jamais inventer une VL Nigeria ou un champ source ;
5. après correction, remesurer C2/C8 avant de recalculer les classements ;
6. conserver C7/C3 en amont lorsque l'intégrité de VL peut expliquer une performance aberrante.

### 33.7 Réconciliation avec la queue live de novembre

Ce delta **ne crée aucune nouvelle tâche**. L'autorité live actuelle possède déjà :
- `AF-OPS-007` pour C7/C3 ;
- `AF-OPS-008` pour C2/C8, actuellement dependency-gated ;
- `AF-OPS-009` pour la fraîcheur/pipelines.

Les constats ci-dessus enrichissent donc la mémoire et le contexte d'investigation de `AF-OPS-008` ; ils ne contournent ni ses dépendances, ni ses claims, ni ses gates.

### 33.8 Cartographie exhaustive : état conceptuel à conserver

La conversation a aussi rappelé que l'objectif n'est pas seulement de corriger les anomalies ponctuelles : il faut que toute capacité, lacune ou idée vérifiée puisse être dédupliquée contre les matrices/intakes et, lorsque les gates sont satisfaits, être promue **dans la queue unique existante**.

Les travaux plus récents du Programme Director, des 37 intakes, du Gap Harvester, des matrices de couverture et du plan de promotion supersèdent donc l'ancien constat de septembre « backlog non encore totalement matérialisé », sans autoriser la promotion automatique de chaque idée.

### 33.9 Contrat de ce delta

Ce delta :
- utilise uniquement `CS-AFRICAFUNDS-001` ;
- ne crée aucune seconde continuité ;
- ne modifie ni queue, ni claim, ni SUIVI, ni production ;
- doit être chargé par le mécanisme de reconstruction déjà raccordé à cette mémoire ;
- reste inférieur aux autorités live et exige revalidation avant exécution.

---

## 34. Delta de continuité — conversation courante raccordée le 27 novembre 2026

> Classification : `HISTORICAL_CONVERSATION_DELTA_WITH_LIVE_PREWRITE_OBSERVATION`  
> Continuité : `CS-AFRICAFUNDS-001`  
> Publication : delta explicitement autorisé par l’utilisateur dans la conversation courante.  
> Autorité : mémoire historique uniquement ; HEADs, queue, claims, preuves et production live restent supérieurs.

### 34.1 Mandat de reprise porté par ce fil

La conversation courante a été ouverte comme continuation directe du travail gouverné AfricaFunds, avec interdiction explicite de rejouer Regulatory Plus, l’inventaire Markdown initial, Loop Engineering, le système multi-agent, le fallback GitHub Actions→SSH S2, les rotations DB/JWT et `AF-TASK-001→009`.

Le point historique remis au fil ciblait `AF-TASK-011` / attestation finale bi-repository et imposait :

```text
RECONNECT
→ REOBSERVE BOTH GITHUB HEADS
→ READ GOVERNED STATE
→ RECONCILE CURRENT REALITY
→ CONTINUE ONLY THE STILL-OPEN TASK
```

Cette séquence est conservée comme histoire du fil. Elle ne réactive pas `AF-TASK-011` ni `AF-TASK-003` lorsque les autorités plus récentes les déclarent terminées ou supersédées.

### 34.2 Travaux et constats techniques effectivement produits dans la séquence historique

Le fil a exécuté ou vérifié, dans son contexte historique :

- relecture des deux repositories, branches et autorités de reprise ;
- détection d’un drift API et préservation du travail concurrent ;
- analyse des `Access denied for user 'fund_opcvm'@'localhost'` sans nouvelle rotation DB ;
- examen de `db_readonly()`, `db_auth_diagnostic()`, crons, PM2, workers, fichiers `.env*`, workflows GitHub et logique de retry Sequelize ;
- confirmation que DB, PM2 et probes HTTP restaient sains aux observations concernées ;
- réconciliation GOV-006 protégée avec préflight, fast-forward borné et préservation des untracked ;
- persistance d’un checkpoint frontend `SUIVI.md` et de registres de clôture ;
- correction immédiate d’une régression syntaxique introduite dans `reconstruct_context.py`, puis retour de Multi-Agent Resume à PASS ;
- attestation post-documentation ;
- découverte ultérieure de quatre nouveaux refus MariaDB à `18:05:48`, `18:05:51`, `18:05:54`, `18:05:56 UTC`, empêchant une clôture artificielle du sous-diagnostic ;
- extension read-only de `s2_observe.py` vers une investigation cross-vhost afin de chercher des consommateurs DB hors du vhost canonique sans exposer de secret.

Références de checkpoints historiques mentionnées dans le fil, jamais à réutiliser comme HEAD actuels sans relecture :

```text
API:
8ae99556…
ceff72e0…
4a400dbd…
322d2778…
bd0699ec…
e61afe5b…
6434c369…
S2 observé ensuite dans le fil : 9f051c035…

Frontend:
38a512067…
```

Ces références décrivent la chronologie de ce fil, pas le `FUND_STATE` actuel.

### 34.3 Règle SSH S2 clarifiée par l’utilisateur

L’utilisateur a corrigé explicitement une dérive de méthode : `wealthtech_ssh_bridge` ne doit pas être une précondition pour travailler sur S2 dans AfricaFunds.

Le canal déjà construit et prouvé reste :

```text
GitHub Actions
→ SSH S2
→ StrictHostKeyChecking=yes
→ host key pin gouverné
→ S2
```

Donc :

```text
BRIDGE_FAILURE != S2_INACCESSIBLE
```

Le bridge peut être utilisé comme contrôle secondaire lorsqu’il est utile, mais le fallback SSH gouverné indépendant doit rester disponible et ne doit pas être reconstruit.

### 34.4 Mémoire du projet et référence de conversation fournie

Le propriétaire a demandé à plusieurs reprises de vérifier que le fil conserve la compréhension du projet et a fourni la référence ChatGPT suivante :

```text
https://chatgpt.com/g/g-p-6aa849c940508191a8d4fa2fa42dedc8/c/6aa45b77-95e8-83eb-b65b-c070d16a97db
```

Cette URL est conservée comme référence fournie par l’utilisateur. Le contenu verbatim complet de cette conversation n’a pas été réouvert et vérifié dans ce delta ; il est donc interdit de lui attribuer une transcription ou des faits précis non démontrés.

Les thèmes métier/data déjà persistés dans les autres sources du programme — document maître, indices/taux, architecture N1–N6, allocation, pays, institutionnel — restent des contributions distinctes à rapprocher selon leur provenance. Ils ne deviennent pas des réalisations nouvelles de ce fil.

### 34.5 État live observé immédiatement avant cette publication

Observation GitHub directe effectuée avant écriture :

```text
API repository      = Wealthtechinnovations/api_opcv
API branch          = claude/code-review-improvements-ikvuj
API pre-write HEAD  = dae4c590c73318df43c11a58bc8571ceb94b6f00

Frontend repository = Wealthtechinnovations/front_end_opcvm
Frontend branch     = claude/code-review-improvements-ikvuj
Frontend HEAD       = 1640ad2277cb913b53782ca0a428a0b9ca44e4a6
```

Le présent changement n’ajoute aucun identifiant de continuité, aucune queue, aucun claim, aucune branche et aucune autorité parallèle.

### 34.6 Portée exacte de la publication

L’ancienne candidate globale de révision 5 préparée lors du chantier de convergence documentaire reste hors de cette publication en bloc.

Le message explicite de l’utilisateur dans cette conversation autorise ici uniquement l’intégration append-only du delta vérifié de ce fil dans les historiques canoniques et le journal inter-conversations.

Aucune modification de Task Queue, claims/leases, S2, secrets, données métier, configuration runtime, automatisations ou production n’est réalisée par ce delta.

### 34.7 Contrat de reprise après intégration

À toute reprise future :

1. lire les instructions permanentes et le journal inter-conversations ;
2. lire ces historiques Git comme mémoire, pas comme état live ;
3. réobserver les deux HEAD, la queue, les claims et les preuves ;
4. ne jamais réactiver `AF-TASK-011` ou un ancien diagnostic à partir de cette section seule ;
5. dédupliquer tout nouvel apport contre les historiques, matrices, `SUIVI`, evidence et Task Queue existants ;
6. continuer exclusivement la première tâche encore admissible.
