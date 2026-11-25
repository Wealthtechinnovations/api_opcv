# WORK_LOG — AfricaFunds API

## 2026-10-30 — Mandat du propriétaire : D1 sources, D2 F4/M2 pilote Maroc, D3 frontend

**Réconciliation d'abord, conformément à l'instruction finale du mandat.**

- HEAD des deux dépôts relus avant et immédiatement avant écriture, concordants
  (api `7303413`, front `dbb9733`) — Single Writer, étapes 1 et 4.
- Lecture de `SOURCE_OF_TRUTH.md`, `GOVERNANCE.md` (Single Writer, protocole
  bi-repository), `docs/BENCHMARKS_F3_MAPPING_SCHEMA.md` §2.1-2.2 et §127.
- `chainsolutions-wealthtech/front` attaché et cloné : **1 fichier**, README du
  2026-07-08, migration jamais effectuée. `africafunds-market-data-pipeline` :
  **accès refusé**. Les deux écartés par DEC-AF-006.

**Livrables.**

- `docs/REGISTRE_SOURCES_MARCHE.md` + `scripts/diag/registre_sources_marche.py` :
  25 sources institutionnelles testées, **23 répondent 200**. UMOA-Titres porte
  **702 fichiers `.xlsx`** de courbes de taux, **2019-2026** — huit années, pas
  dix. Structure vérifiée par téléchargement : **8 feuilles par État émetteur**,
  colonnes `Maturité` / `Zero Coupon` / `Taux Après Lissage`, maturités 1 mois à
  17 ans. Casablanca Bourse : seul échec, déjà contourné (MASI via FT).
- `src/db/migrations/20261030000001-create-benchmark-series-and-mapping.js` :
  **M1**, strictement additif, deux `CREATE TABLE`, aucune ligne écrite, aucune
  table existante touchée. **Non appliquée** — l'application relève du
  propriétaire.

**Preuves de non-régression.** Aucune écriture en base, aucun déploiement dans
ce lot. `node --check` sur la migration ; convention identique aux six
précédentes ; schéma repris littéralement de sa source canonique F3.

**Ce qui n'a pas été fait, et pourquoi.** M2 n'est pas engagé : il écrit dans
`benchmark_series`, qui n'existe pas avant application de M1. Enchaîner aurait
produit un collecteur écrivant dans le vide.

## 2026-09-10 — AF-GOV-REGULATORY-PLUS-001

- comparaison directe de `chainsolutions-wealthtech/Regulatory` via GitHub ;
- lecture des autorités Regulatory : `00_START_HERE`, `GOVERNANCE`, `SOURCE_OF_TRUTH`, `AGENTS`, `LOOP_ENGINEERING`, `FILES_CATALOG`, `MANIFEST`, `DOCUMENT_INTEGRATION_MATRIX` ;
- lecture de l’arbre API AfricaFunds sur la branche canonique ;
- confirmation du socle AfricaFunds existant et de GOV-006 ;
- décision : enrichir l’existant et créer uniquement les rôles manquants ;
- aucune suppression, aucun rename, aucun force-push, aucun changement de données ou production.

Les preuves Git supplémentaires sont enregistrées par les commits et contrôles GitHub du lot.

## 2026-09-10 — lots CI et gouvernance (suite de AF-GOV-REGULATORY-PLUS-001)

- check `governance` en echec (`NONCANONICAL_PRODUCT_NAME`) : diagnostic — le commit
  632c954 livrait d un bloc la regle interdisant « FundAfrica » et la phrase qui
  l explique. Correctif redige puis **abandonne** au rebase : une session parallele
  avait deja resolu la cause autrement (`3f5c80a`), verifiee vert. Rien impose ;
- check `FundAfrica governance contract` en echec : derive miroir reelle. Deux des
  neuf fichiers avaient ete refondus cote API sans propagation. Verification de
  non-perte par normalisation Unicode et comparaison de sections — la version API
  est un sur-ensemble reformule — puis propagation. 9/9 identiques sur origin ;
- `authority-map.json` : 9 domaines reels ajoutes, dont `production_measured_state`
  qui manquait alors que les deux CLAUDE.md le declarent source de verite n°1 ;
  preseance explicite ajoutee ;
- `requirements.json` / `traceability.json` / `evidence.json` : les six echecs
  critiques mesures sont traces (`AF-REQ-011` a `AF-REQ-015`, `AF-EVD-011`) ;
- aucune suppression, aucun rename, aucun force-push, aucune ecriture de donnees,
  aucun deploiement. `FILES_DELETED = 0`.


## 2026-09-11 — AF-GOV-FINAL-CERT-20260911-01

- directive propriétaire : exécuter le programme final de certification sans nouvelle branche ni architecture parallèle ;
- connexion GitHub authentifiée confirmée sur `Wealthtechinnovations/api_opcv` et `Wealthtechinnovations/front_end_opcvm` ;
- default branch des deux dépôts confirmée : `claude/code-review-improvements-ikvuj` ;
- baseline avant write : API `b2753cd860e2f466f53ddc5e8651c80c62d41d12`, frontend `c4c3fba5bf90f3be1c2ebaeadb8fcd0f1d5b1d6d` ;
- drift confirmé : task queue plus récente que `LOOP_STATE.md`, `HANDOFF.md`, `.governance/loop/state.json` et `.governance/loop/handoff.json` ;
- décision : réconcilier les registres avant toute nouvelle capacité ;
- l'ancienne action MariaDB reste conservée comme opération distincte à approbation humaine ; aucune mutation production dans ce lot.


## 2026-09-11 — réconciliation du point de reprise après reprise de session

- HEAD réobservés : API `d2cdcec6f3fbf8e1e1a01f57b61457de4e7f5a08`, frontend `1a0e52c22e19d3d29916a9bc1a689dfc6dd7fdae`.
- Drift détecté : la task queue et les projections humaines étaient restées sur AF-TASK-004 malgré les preuves ultérieures.
- AF-TASK-004 et AF-TASK-005 classées DONE à partir des CI/artefacts existants.
- AF-TASK-006 devient tâche courante ; AF-TASK-010 (secrets) et AF-TASK-011 (attestation finale) ajoutées explicitement.
- Aucun canal wealthtech_ssh_bridge n'est exposé dans la session actuelle ; aucun travail serveur n'est supposé.
- Recherche Git d'une empreinte S2 historique indépendante : aucune empreinte vérifiable trouvée.
- Stratégie : TOFU borné possible pour débloquer l'observation, mais son statut reste distinct d'une vérification OOB.


## 2026-09-12 — AF-TASK-006→011 : SSH fallback, secrets et certification finale

- canal GitHub Actions→SSH S2 prouvé sans bridge MCP, `StrictHostKeyChecking=yes`, pin TOFU versionné ;
- observation S2 live PASS, DB PASS, HTTP public/local 200 ;
- GOV-006 réconciliation live PASS, untracked API préservés ;
- fallbacks API/frontend safe path + attestation S2 PASS ;
- vrai `.env` détaché du Git courant et conservé runtime local 0600 sans changement de chemin ;
- DB_PASSWORD : première primitive SQL rejetée, rollback PASS ; primitive testée sur compte MariaDB temporaire puis rotation réelle PASS, ancien mot de passe rejeté ;
- JWT : helper dual-key testé par 6 tests Jest ; première rotation rollbackée sur readiness trop courte, observation S2 a prouvé API saine ; readiness polling ajouté ; rotation PASS ; ancienne clé ensuite révoquée volontairement car historiquement exposée ;
- aucune valeur de secret/token inscrite dans Git ou les preuves ;
- EMAIL_PASSWORD et MAGIC_SECRET_KEY restent des rotations fournisseur externes ;
- GitHub native rulesets et OOB host-key restent gaps externes ;
- tâche courante basculée vers AF-TASK-011 final attestation.

## 2026-09-13 — clôture AF-TASK-011

- reprise effectuée depuis les autorités Git/S2 live, sans rejouer AF-TASK-001→009 ;
- drift GitHub constaté et préservé : API avait avancé à `8ae99556ac5142590ccacdcba9ea1343a78c150e`, frontend à `55191a74c8d581adb383123ce1d9f5bea98dc267` ;
- analyse des `Access denied` MariaDB terminée sans nouvelle rotation : DB actuelle PASS, diagnostic/observer non causal, workers/crons/workflows/env stale persistants écartés ; deux observations successives ont conservé comme dernier refus `2026-09-13 17:36:56 UTC` ; attribution historique exacte impossible avec general_log/performance_schema/audit désactivés ;
- GOV-006 run `34773189857` : fast-forward API/frontend PASS, sauvegarde `/var/backups/fundafrica-governance/20260913T175849Z`, untracked API préservés, tracked clean ;
- attestation : API `ceff72e0e0dad7a7522835940a9537662b16f844`, frontend `55191a74c8d581adb383123ce1d9f5bea98dc267`, PM2 online, DB PASS, HTTP public/local 200 ;
- Regulatory Plus sur `ceff72e0e0dad7a7522835940a9537662b16f844` : PASS ;
- frontend SUIVI global avancé à `38a5120677ec76dcc65b5d799a5f24f8ce236328` pour consigner la clôture ;
- persistance finale des registres dans ce commit ; une dernière réconciliation post-documentation est requise conformément à GOV-006 ;
- `FILES_DELETED = 0` ; aucune donnée métier C2/C3/C4/C7/C8 modifiée.


## 2026-11-25 — AF-TASK-028 : préflight manuel et recette bornée

- Projet CS-AFRICAFUNDS-001, branche canonique inchangée, frontend observé `8d8dcfd50e8a1cc7ad981aa2bb406be85074c247`.
- API `ab3353b2532940d9fa7a4e87c4edd37a3981653f` : workflow manuel de préflight publié ; dry-run par défaut, confirmation explicite pour apply-local, permissions contents:read, HEAD exacts et recheck distant, claims, invariants, génération déterministe, moteur local existant. Aucun push de projections ni S2.
- Regulatory Plus run 45612928544 : SUCCESS sur ce SHA. Syntaxe YAML/Bash et 11 cas de dispatch simulés PASS localement ; contrat ajouté à la CI du Programme Director dans le présent commit, résultat CI à observer.
- AF-TASK-028 reste IN_PROGRESS : recette workflow_dispatch réelle, identité et publication bi-repository gouvernée non attestées. Exécuteur IA horaire dédié non activé ; claims observe-only, ne pas déclarer exclusion atomique. Aucun changement de queue, de branche, de données ou de production.
- NEXT_ACTION : contrôler la CI exacte du présent commit, exécuter le dry-run manuel via surface autorisée, qualifier une identité d'écriture minimale et le raccordement à la queue existante. Ne pas activer de publication ou de déploiement sans gates.


## 2026-11-25 — AF-TASK-028 : recette CI équivalente et admission candidate

- AF-EVD-073 : Programme Director run 45641152852 / job 139299835505 SUCCESS sur API `2a3bfb5ce79dff0e9bd9d7175802d84282d88e49`, frontend `09c3cf780a8200f56c2b39f095f3cb0a1ea4873e`. Les vrais blocs du workflow manuel ont passé dry-run, recheck, apply local et no-change/no-commit sur miroirs Git isolés. Aucun dispatch réel, publication distante ni S2 attestés.
- Nouvelle tranche : contrat de proposition de leases/fencing task-local (queue existante), legacy fail-closed, conflits et dépendances, horloge/identité explicites, CAS Git local concurrent dans les tests. CI à vérifier sur le commit de cette tranche. Ce contrat n'est pas un verrou distant ni un exécuteur ; aucune migration des claims actifs et aucun passage global d'observe-only à enforcement.
- NEXT_ACTION : contrôler CI exacte, puis raccorder identité/horloge fiables et publication atomique au périmètre réel ; ne pas déclarer DONE avant preuve de publication gouvernée et récupération des effets partiels. Aucun changement métier/DB/S2, nouvelle branche ou seconde queue.


## 2026-11-25 — AF-TASK-028 : leases et publication bi-repository

- AF-EVD-074 : run 45641587680 SUCCESS, 7 tests de lease/fencing dont concurrence Git réelle en local ; 6/6 projections exactes, 0 candidat. Aucun claim actif historique migré, aucun verrou distant activé.
- Ajout du contrat de publication préparée : validation parents/diff/bloc, confirmation du plan, recheck avant chaque CAS, receipt partiel et reprise sans rollback. Tests sur deux refs Git isolées, CI à contrôler. Aucun transport authentifié distant activé.
- NEXT_ACTION : preuve CI exacte puis raccordement d'un transport de publication et de l'exécuteur avec identité/horloge/fencing vérifiés. Pas de DONE ni d'autonomie déclarée sur la seule recette locale.


## 2026-11-25 — AF-TASK-028 : publication validée et raccordement du plan

- AF-EVD-075 : run 45641963101 SUCCESS sur 4d6e1d34, cinq tests Git réels isolés ; aucune mutation distante.
- Le workflow manuel produit maintenant un plan de publication vérifié à partir des six blocs et des deux HEAD, sans déplacement de référence. Dry-run sans objet de commit ; apply-local confirmé peut préparer des candidats non référencés dans le checkout isolé. Test de raccordement ajouté ; attendre CI exacte. Aucun transport distant activé.


## 2026-11-25 — AF-TASK-028 : recette intégrée verte et checkpoint

- Run initial 45642469718 FAILURE : recette checkout dans un worktree modifié ; corrigée sans force avec worktree séparé dans `371b742e6f1b773f163921bee99ed762f3a9eff8`.
- AF-EVD-076 : [45642729957](https://github.com/Wealthtechinnovations/api_opcv/actions/runs/45642729957), job 139305436077 SUCCESS ; wiring PASS, 7/7 leases/fencing, 6/6 publication, recette manuelle CI-equivalent PASS, 6/6 projections exactes. Frontend de recette 09c3cf780a8200f56c2b39f095f3cb0a1ea4873e ; checkpoint frontend `b2d924a52f34b55b7a97605a3fa474b7941ad61d`.
- Automatisation ChatGPT dédiée active ; productivité autonome non démontrée. AF-TASK-028 reste IN_PROGRESS : qualification du transport distant, identité/horloge/fencing effectifs et raccordement moteur codeur. Aucune nouvelle branche, queue, mutation S2 ni claim legacy transféré.
