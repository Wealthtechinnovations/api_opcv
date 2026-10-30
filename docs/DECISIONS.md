# DECISIONS — Registre AfricaFunds

## DEC-AF-001 — Une application, deux dépôts
Statut : `ACTIVE`. AfricaFunds est une application logique unique composée de `api_opcv` et `front_end_opcvm`, avec deux historiques Git indépendants.

## DEC-AF-002 — Branches canoniques
Statut : `ACTIVE`. Les deux dépôts utilisent `claude/code-review-improvements-ikvuj`; le préfixe `claude/` est historique et n’accorde aucune exclusivité à un agent.

## DEC-AF-003 — Mémoire et checkpoint
Statut : `ACTIVE`. Git et les artefacts versionnés constituent la mémoire durable ; `front_end_opcvm/SUIVI.md` reste le checkpoint historique/opérationnel global. Les nouveaux registres de boucle sont complémentaires.

## DEC-AF-004 — Regulatory Plus
Statut : `ACTIVE`. Les mécanismes génériques utiles de `chainsolutions-wealthtech/Regulatory` sont intégrés dans AfricaFunds par `KEEP/ENRICH/ADAPT/CREATE`, sans suppression ni réécriture de l’existant.

## DEC-AF-005 — GitHub / S2 / runtime
Statut : `ACTIVE`. GitHub est l’autorité Git ; S2 est projection/runtime. GOV-006 et ses preuves restent normatifs pour la réconciliation.

## DEC-AF-006 — Périmètre GitHub exclusif (mandat du 2026-10-30)
Statut : `ACTIVE`. Les travaux concernent **exclusivement** `Wealthtechinnovations/api_opcv` et `Wealthtechinnovations/front_end_opcvm`, branche `claude/code-review-improvements-ikvuj`.

`africafunds-market-data-pipeline` et `chainsolutions-wealthtech/front` **ne sont pas des sources de vérité** pour ce chantier et ne doivent pas être substitués aux deux dépôts canoniques.

Mesures du 2026-10-30 qui motivent cette clôture :
- `chainsolutions-wealthtech/front` : **1 seul fichier**, un README du 2026-07-08 déclarant un « dépôt cible préparé pour recevoir la migration ». La migration n'a jamais eu lieu ; la production tourne depuis `front_end_opcvm`.
- `Patricked-code/africafunds-market-data-pipeline` : **inaccessible** depuis cette session (« you don't have access »).

Conséquence : aucune migration de dépôt n'est engagée, et aucun accès externe n'est requis.

## DEC-AF-007 — Sources de taux sans risque UEMOA / CEMAC
Statut : `ACTIVE`. BCEAO et BEAC sont les institutions prioritaires. UMOA-Titres est retenu en complément souverain.

Règles normatives, reprises du mandat : aucune valeur inventée ; aucune donnée absente remplacée silencieusement ; aucune constante en dur tenue pour un taux publié ; dates d'observation et de publication **distinctes** ; provenance, devise, maturité et fréquence conservées ; historique cible de dix ans **lorsque les données officielles existent réellement** ; observations manquantes identifiées comme telles.

**Interdiction** : ne pas remplacer un taux monétaire par un rendement obligataire sans justification méthodologique, et ne pas écraser les valeurs actuellement utilisées avant confrontation aux calculs existants.

Registre de mesure : `docs/REGISTRE_SOURCES_MARCHE.md` (23 sources sur 25 répondent au 2026-10-30).

## DEC-AF-008 — Engagement F4 / M2, pilote Maroc / MONIA
Statut : `ACTIVE`. Correction **structurelle** autorisée, et non un contournement de la comparaison de dates.

**Interdiction explicite du mandat** : ne jamais supprimer la condition `iso !== targetDate` sans corriger la date utilisée à l'insertion — cela attribuerait à une date une valeur financière qui ne lui appartient pas.

Vérification du préalable, faite le 2026-10-30 : **M1 n'avait jamais été exécuté** (`benchmark_series` absent de tout le code ; 6 migrations, aucune benchmark ; `BENCHMARKS_V2_ENABLED` présent dans le seul document F3). M1 est donc le premier lot livré — `src/db/migrations/20261030000001-create-benchmark-series-and-mapping.js`, strictement additif.

`BENCHMARKS_V2_ENABLED` reste **désactivé par défaut** jusqu'à validation.

Toute nouvelle décision structurante doit être ajoutée ici et détaillée par ADR lorsque nécessaire.