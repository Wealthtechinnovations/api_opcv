# MANIFEST — AfricaFunds API Regulatory Plus

> Statut : `FINAL_CERTIFICATION_IN_PROGRESS` — boucle `AF-GOV-FINAL-CERT-20260911-01`.

## Source et continuité

- modèle de gouvernance initial : `chainsolutions-wealthtech/Regulatory` `main@483da3e11c30dd0b4f2a4cee114909d512a1b426` ;
- tête Regulatory réobservée pendant cette réconciliation : `4590be6800dd3dbb5c9dde106509967082e28afc` ;
- adaptation : AfricaFunds, sans import des règles métier Regulatory ;
- branche API canonique : `claude/code-review-improvements-ikvuj` ;
- baseline API historique avant intégration : `cd24305db790f4c0c3f663ef1cca037978145ef6` ;
- baseline frontend historique avant intégration : `5e6faa6eb68d0b9c9cabe99996fac1b9f6af4bd1` ;
- HEAD API observé avant le présent commit de réconciliation : `584793adc956831543b4daf995a30f774fcb9453` ;
- HEAD frontend observé au même checkpoint : `e2ac5996c4429910f378b1ddd8b111a08e2d96cf`.

Les HEAD ci-dessus sont des **checkpoints observés**, pas des valeurs auto-référentielles censées rester égales au commit qui modifie ce manifeste. Toute écriture ultérieure doit réobserver les branches.

## État d’intégration

- socle historique AfricaFunds : `PRESERVED` ;
- `00_START_HERE.md` / `GOVERNANCE.md` / `SOURCE_OF_TRUTH.md` / `AGENTS.md` / `LOOP_ENGINEERING.md` : `PRESENT_AND_ACTIVE` ;
- mémoire persistante `STATUS / SUIVI / TODO / WORK_LOG / HANDOFF / NEXT_ACTION / LOOP_STATE / CURRENT_ITERATION` : `PRESENT` ;
- `DOCUMENT_INTEGRATION_MATRIX.md` : `PRESENT` ;
- `FILES_CATALOG.md` / `DOCUMENT_INDEX.md` : `PRESENT` ;
- décisions `docs/DECISIONS.md` et ADR : `PRESENT` ;
- gouvernance `docs/01-governance/*` : `PRESENT` côté API central ;
- couche machine-readable `.governance/*` : `PRESENT` côté API central ;
- miroir des contrats racine côté frontend : `PRESENT` et contrôlé par CI ;
- GOV-006 GitHub ↔ S2 ↔ runtime : `PRESERVED` ;
- règles métier Regulatory : `NOT_IMPORTED`.

## Principe de centralisation bi-repository

Les registres partagés et la couche `.governance/` sont centralisés dans `Wealthtechinnovations/api_opcv`. Le frontend participe par ses fichiers racine miroir, son `SUIVI.md` global et ses workflows de contrôle. L’absence volontaire d’un second `.governance/` complet dans le frontend n’est pas un manque si le contrat central reste accessible, contrôlé et sans autorité concurrente.

## Préservation

- suppression documentaire pendant l’intégration : `0` ;
- renommage/move imposé par le nouveau socle : `0` ;
- documents historiques : conservés ;
- diagnostics et GOV-006 : conservés ;
- fichiers machine-readable historiques : conservés ;
- migration destructive : aucune autorisée par ce manifeste.

## Contrôles observés

- CI API `Governance Regulatory Plus` : `PASS` au checkpoint API `584793adc956831543b4daf995a30f774fcb9453` ;
- CI frontend `governance-contract` : `PASS` au checkpoint frontend `e2ac5996c4429910f378b1ddd8b111a08e2d96cf` ;
- branche canonique API : observée ;
- branche canonique frontend : observée ;
- branch protection GitHub : non enforced au moment de l’observation ; `RULESET_TARGET.md` reste une cible, pas une preuve d’enforcement.

## Écarts ouverts

1. confirmer la parité fonctionnelle avec le `Regulatory/main` actuel après les évolutions intervenues depuis le commit source historique ;
2. maintenir synchronisés les registres de boucle avec le travail opérationnel réel ;
3. rapprocher les rulesets/protections GitHub du modèle cible uniquement après validation de compatibilité ;
4. conserver distinctes l’attestation GitHub et l’attestation production S2 ; une production non réobservée reste `UNKNOWN/PENDING`, jamais `OK` supposé ;
5. harmoniser progressivement les mentions courantes historiques `FundAfrica` vers le nom canonique `AfricaFunds` sans réécrire les références historiques qui doivent rester traçables.

## Critère de clôture

Le statut `FULLY_GOVERNED` ne peut être déclaré qu’après :

- contrôle final de parité des mécanismes génériques ;
- cohérence de tous les registres d’état ;
- validations CI courantes ;
- absence de régression introduite ;
- attestation des gaps externes éventuels ;
- prochaine action déterministe persistée.


## Programme final de certification

Le propriétaire exige désormais une preuve déterministe de : reconstruction de contexte sans mémoire conversationnelle, découverte croisée des deux repos, exploitation certifiée de tous les Markdown, cohérence automatique des registres, reprise multi-agent, observation S2 même sans bridge MCP, fallback de déploiement gouverné et enforcement GitHub. `FULLY_GOVERNED` reste interdit tant qu'un de ces gates n'est pas vert.
