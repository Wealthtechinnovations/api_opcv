# STATUS — AfricaFunds API

> Nature : photographie courante, complémentaire au `SUIVI.md` global.
> Statut : `APPLICABLE`.
> Règle : les SHA inscrits ici sont des **checkpoints observés**. Le commit qui met à jour ce fichier avance nécessairement le HEAD ; toute nouvelle écriture doit donc réobserver GitHub au lieu de supposer que ce fichier contient le HEAD auto-référentiel du commit courant.

## Baseline historique Regulatory Plus

- Repository : `Wealthtechinnovations/api_opcv`.
- Branche canonique : `claude/code-review-improvements-ikvuj`.
- Baseline API avant intégration : `cd24305db790f4c0c3f663ef1cca037978145ef6`.
- Baseline frontend avant intégration : `5e6faa6eb68d0b9c9cabe99996fac1b9f6af4bd1`.
- Production : S2.
- GOV-006 : mécanisme GitHub ↔ S2 ↔ runtime existant et conservé.
- Runtime : les artefacts non suivis restent soumis à classification avant nettoyage.

Ces baselines restent historiques et ne doivent pas être réécrites pour ressembler aux HEAD actuels.

## Gouvernance actuelle

Le socle historique `00_START_HERE.md`, `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md` et `LOOP_ENGINEERING.md` est conservé et enrichi, jamais remplacé.

Sont maintenant également présents côté API central : mémoire persistante, `DOCUMENT_INTEGRATION_MATRIX.md`, `FILES_CATALOG.md`, `DOCUMENT_INDEX.md`, `MANIFEST.md`, décisions/ADR, `docs/01-governance/*` et couche machine-readable `.governance/*`.

Le frontend participe au même système par ses contrats racine, son `SUIVI.md` global et `governance-contract`; un second `.governance/` complet n’est pas créé tant qu’aucune fonction non couverte ne le justifie.

Le présent fichier n’est pas un second `SUIVI.md`. Il reste une vue courte de l’état et doit être mis à jour lorsqu’un changement rend cette photographie fausse.

## Checkpoint Git réobservé pendant la réconciliation du 2026-09-10

Avant les commits de réconciliation de cette boucle :

- API : `584793adc956831543b4daf995a30f774fcb9453` ;
- Frontend : `e2ac5996c4429910f378b1ddd8b111a08e2d96cf`.

Après réconciliation des registres et correction de l’identité du workflow, les commits observés sont :

- API gouvernance centrale : `ec4b43c3eb221f29024e21018fdecfffb9b4ea5e` ;
- API identité workflow : `e2b57fabf6af1cbc1870e31246881eab96989b3a` ;
- Frontend identité workflow : `bf0610bb90fbb7fd754d4013d24f37da180b1262`.

CI observée :

- API `Governance Regulatory Plus` sur `e2b57fab…` : `PASS` ;
- Frontend `governance-contract` sur `bf0610bb…` : `PASS`.

`GITHUB_ENFORCEMENT_STATUS = TARGET_NOT_ENFORCED` : les branches canoniques ont été observées non protégées ; `RULESET_TARGET.md` décrit la cible mais ne vaut pas preuve d’enforcement.

## État production mesuré au 2026-09-10 02:02 UTC

Source : `docs/ETAT_PRODUCTION_VERIFIE.md` (autorité `production_measured_state`).

**8/16 contrôles OK — 6 échecs critiques, 2 alertes.**

| Contrôle | État | Fait mesuré |
|---|---|---|
| C2 | ECHEC | performances orphelines : 14 local, 23 EUR, 23 USD |
| C3 | ECHEC | 3 performances > 500 % (1141 à 143 958 %) |
| C4.NIGERIA | ECHEC | dernière VL 27 j (budget 14) |
| C4.TUNISIE | ECHEC | dernière VL 13 j (budget 9) |
| C7 | ECHEC | 15 séries mélangeant deux échelles, facteur ~1500 |
| C8 | ECHEC | MAROC 1.4 %, TUNISIE 6.1 %, UEMOA 32.4 % de perf à jour |
| C4.CEMAC / C6.CEMAC | ALERTE | 637 j sans VL, 0 % de benchmark — aucun pipeline |

Ces échecs restent tracés dans les exigences/preuves gouvernées et ne sont pas masqués par la réussite des CI documentaires.

## Incident opérationnel prioritaire

`AF-EVD-012` documente l’OOM-kill de `mariadbd` du 2026-09-08 à 20:02:42 et l’absence de redémarrage automatique pendant environ 10 h 22.

La prochaine action opérationnelle canonique est `AF-OPS-003` selon `NEXT_ACTION.md` : poursuivre la RCA longue durée en lecture seule. `AF-OPS-001` (`Restart=on-failure`) reste une amélioration de résilience séparée sous `REQUIRED_HUMAN_APPROVAL` et n'est pas la root-cause fix.

## Écarts de gouvernance ouverts

- comparaison finale avec le `Regulatory/main` actuel à terminer sans importer son métier ;
- protections/rulesets GitHub à rapprocher du modèle cible après validation de compatibilité ;
- mentions historiques `FundAfrica` encore présentes dans certains documents courants à harmoniser progressivement vers `AfricaFunds` sans renommer les chemins/runtime historiques ;
- production S2 à réobserver séparément après toute opération qui prétend modifier son état.

## Règle de reprise

Un agent reprend par `00_START_HERE.md`, puis lit les autorités, `STATUS.md`, le `SUIVI.md` global, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `HANDOFF.md` et `NEXT_ACTION.md`. Il réobserve ensuite les deux HEAD avant toute écriture.


## Boucle finale de certification — 2026-09-11

Directive propriétaire : terminer la gouvernance de bout en bout sans créer de système parallèle. Baseline observée avant write : API `b2753cd860e2f466f53ddc5e8651c80c62d41d12`, frontend `c4c3fba5bf90f3be1c2ebaeadb8fcd0f1d5b1d6d`. Default/canonical branch des deux dépôts : `claude/code-review-improvements-ikvuj`.

Le nouveau programme exige : reconstruction de contexte avant travail, découverte croisée obligatoire, certification dynamique 100 % des Markdown, cohérence des registres, fallback GitHub Actions/SSH lorsque le bridge MCP est indisponible, enforcement GitHub au maximum et tests multi-agent avant toute déclaration `FULLY_GOVERNED`.

Les SHA ci-dessus restent des checkpoints observés ; l'état courant doit toujours être relu depuis GitHub.


## Certification finale en cours — 2026-09-12

La boucle a dépassé l'ancien checkpoint AF-TASK-006. Le fallback GitHub Actions→SSH S2 est opérationnel avec pin hôte strict ; GOV-006 et les chemins d'observation API/frontend ont des preuves live. Le vrai `.env` a été retiré du tree Git et reste un fichier runtime S2 local non suivi en mode 0600.

Remédiation sécurité exécutée sans exposition de valeur :
- DB_PASSWORD : rotation réelle PASS ; ancien credential rejeté ;
- JWT_SECRET : rotation réelle PASS ; ancienne clé compromise désactivée ; anciens tokens révoqués ;
- EMAIL_PASSWORD et MAGIC_SECRET_KEY : rotations fournisseur externes encore requises.

GitHub native rulesets restent absents ; le branch drift detector CI reste la protection disponible. Le verdict `FULLY_GOVERNED` est donc interdit tant que ces gaps externes subsistent.


### Trigger de certification Markdown finale — 2026-09-12

Le checkpoint global frontend a été avancé au commit `fbbb4e9586e7f2a0bc683832d26591224c14bdb3`. Le prochain audit Markdown central doit donc relire les deux repositories après ce commit avant l'attestation S2 finale.

## Clôture gouvernée AF-TASK-011 — 2026-09-13 17:59 UTC

- `AF-TASK-011 = DONE`.
- `AF-TASK-003 = DONE_WITH_EXTERNAL_GAPS`.
- Dernière attestation S2 avant persistance de ce checkpoint : API `ceff72e0e0dad7a7522835940a9537662b16f844`, frontend `55191a74c8d581adb383123ce1d9f5bea98dc267`, alignement exact, tracked clean, untracked API préservés, PM2 online, DB PASS, HTTP 200.
- Le checkpoint global frontend a ensuite avancé à `38a5120677ec76dcc65b5d799a5f24f8ce236328` pour consigner la clôture ; une réconciliation post-documentation GOV-006 est donc obligatoire et sera exécutée sans modifier le métier.
- Refus MariaDB : aucun consommateur stale persistant observé ; source historique exacte non attribuable avec la télémétrie MariaDB alors inactive. Aucune re-rotation DB.
- Verdict : `GOVERNED_WITH_EXTERNAL_GAPS`.
- Tâche gouvernée restante : `AF-TASK-010` (rotations fournisseurs externes), avec OOB host-key et GitHub native rulesets comme gaps externes.


## AF-OPS-003 — RCA mémoire MariaDB — réconciliation post-A/B 2026-09-15

Le mécanisme OOM reste PROVEN. Le large écart entre RSS anonyme privé multi-Gio et `Memory_used` MariaDB reste PROVEN, et les buffers/connexions ne suffisent pas à l'expliquer.

Le précédent candidat `PROBABLE SYSTEM_MALLOC_FRAGMENTATION_RETENTION` n'est plus une conclusion causale acceptable : les A/B courts ont été exécutés. Les runs `34908277049`, `34908496545`, `34908755786` et `34909181790` montrent respectivement un biais d'âge du processus, un contrôle frais proche, un stress synthétique défavorable à jemalloc et un dry-run EUR/USD pratiquement équivalent (~-1 % de croissance RSS).

La root cause exacte est donc `UNKNOWN` sous incident `RCA_PENDING`. Les preuves post-A/B sont `AF-EVD-041` à `AF-EVD-044`; `AF-EVD-040` reste historique.

Prochaine preuve : série longue durée read-only et corrélation RSS ↔ âge du processus ↔ crons ↔ batchs ↔ timeouts ↔ handlers Node ↔ activité MariaDB. Aucun quatrième A/B court n'est requis. `AF-OPS-001` reste un gate de résilience séparé.


## AF-OPS-003 — nouvelles preuves read-only — 2026-09-15 00:26 UTC

- `AF-EVD-045` : après rollback, RSS system-malloc ~127–130 MiB vers ~5 min puis ~247 MiB vers ~50 min d'uptime; plateau court ensuite. Croissance avec âge/workload observée, non causale.
- `AF-EVD-046` : les crons `saveperfdatemysql` ont un timeout client de 300 s, tandis que la route serveur n'a aucun hook d'annulation sur déconnexion. Timeout client != preuve de fin serveur.
- `AF-EVD-047` : le 14/09, `cron_nigeria_weekly.sh` démarre 10:00:01; import + FX terminent; l'étape 4 `recalc_vl_ajuste` est active lorsque l'OOM-killer tue `mariadbd` à 10:04:12. Le script échoue ensuite sur connexion DB fermée.

Ces faits renforcent la piste workload/overlap/rétention longue durée mais **ne prouvent pas encore la root cause générale**. Incident reste `RCA_PENDING`, root cause `UNKNOWN`.


## AF-OPS-003 / 005 — corrélation multi-incidents et auth post-restart — 2026-09-15 00:38 UTC

- `AF-EVD-048` : les contextes lourds diffèrent. 31/08 = correction/recalcul Nigeria, avec scraper indices également exécuté à partir de 18:30:20 ; 08/09 = `recalc_eur_usd_daily_rate` lors de la chute DB ; 14/09 = `recalc_vl_ajuste` Nigeria. Aucun job unique n'est une condition commune prouvée.
- 27/08 : le cron EUR/USD démarre à 21:30 avec MariaDB déjà en `ECONNREFUSED`; il ne peut donc pas être présenté comme déclencheur initial sur cette seule preuve.
- `AF-EVD-049` : six refus exacts `fund_opcvm@localhost` apparaissent après restart, de 23:36:29 à 23:38:56, puis cessent dans la fenêtre observée jusqu'à 00:38. Aucun cron AfricaFunds à ce moment. Consommateur intermittent prouvé, identité inconnue.
- `AF-EVD-050` : `npm start invoked oom-killer` ne prouve pas un build frontend. API et frontend ont tous deux un script `start`, et le build frontend est `npm run build`.

La root cause OOM reste `UNKNOWN / RCA_PENDING`. La prochaine discrimination est une série RSS longue traversant de vrais batchs, pas un nouveau test court d'allocateur.


## Production data-quality reconciliation — 2026-09-16 11:15 UTC

`AF-EVD-052` records the current measured production state: 8/16 controls OK, 6 critical failures (C2, C3, C4.NIGERIA, C4.TUNISIE, C7, C8) and 2 alerts (C4/C6 CEMAC).

These failures were already modeled as `AF-REQ-011..015`; they are now connected to canonical operational tasks:
- `AF-OPS-007`: C7/C3, VL scale integrity before derived metrics.
- `AF-OPS-009`: C4 Nigeria/Tunisia source/pipeline freshness.
- `AF-OPS-008`: C2/C8 orphan/stale performances, gated by 007+009.

No production data was modified by this reconciliation.

## AF-OPS-005 — stale config evidence

`AF-EVD-051`: active `.env` matches the current DB credential, while `.env.production` and `.env.production.plan-b` do not. No active process or explicit code path is yet proven to consume those files. Root cause remains UNKNOWN; no credential rotation/restart justified.
