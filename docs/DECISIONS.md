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

## DEC-AF-009 — Proxy sans risque UEMOA : le taux moyen pondéré **au jour le jour**

Statut : `PROPOSEE` — fondée sur la mesure, applicable sans écriture tant que M1
n'est pas appliquée, donc révisable sans coût. DEC-AF-007 exigeait que ce choix
soit « documenté comme tel » ; voici la mesure qui le documente.

**Mesure du 2026-10-30** : les 388 documents BCEAO exploitables extraits, soit
3 104 points sur 379 semaines distinctes (2017-11-06 → 2026-10-19). Couverture
par maturité :

| maturité | semaines cotées | couverture | médiane | écart-type |
|---|---|---|---|---|
| **1 jour** | **379** | **100 %** | 4,42 % | 1,26 |
| 1 semaine | 379 | 100 % | 4,36 % | 1,29 |
| 2 semaines | 379 | 100 % | 5,32 % | 1,02 |
| 1 mois | 379 | 100 % | 5,30 % | 1,08 |
| 3 mois | 370 | 97,6 % | 5,43 % | 1,12 |
| 6 mois | 264 | 69,7 % | 4,91 % | 1,31 |
| 9 mois | 95 | 25,1 % | 4,58 % | 1,32 |
| **12 mois** | **25** | **6,6 %** | 4,62 % | 1,38 |

**Ce que la mesure élimine.** Un proxy adossé au **12 mois** aurait été absent
**93 % du temps** — et son absence serait apparue non pas comme une erreur mais
comme un trou de données. Le 9 mois (25 %) et le 6 mois (70 %) sont également
inexploitables comme série continue. Le choix est donc borné aux quatre
maturités à 100 % : 1 jour, 1 semaine, 2 semaines, 1 mois.

**Retenu : le 1 jour**, pour trois raisons et non par défaut.

1. **Couverture intégrale** sur les 379 semaines mesurées.
2. **Cohérence de convention entre zones.** Le taux au jour le jour est la
   convention de tous les taux sans risque modernes, et c'est exactement la
   nature de **MONIA**, déjà la référence marocaine de la plateforme. Adopter le
   1 jour pour l'UEMOA met les deux zones sur la **même convention** — ce qui
   compte directement, la plateforme comparant les fonds entre zones en EUR et
   en USD. Un 1 mois UEMOA face à un MONIA au jour le jour introduirait un écart
   de convention dans un classement présenté comme homogène.
3. C'est la maturité la plus proche d'un actif réellement sans risque.

**Ce que ce choix coûte, et qu'il faut dire.** Le 1 jour est le plus volatil des
quatre (écart-type 1,26 contre 1,02 pour le 2 semaines), et sa médiane est
**88 points de base sous** celle du 1 mois (4,42 % contre 5,30 %). Un Sharpe
calculé sur le 1 jour est donc **structurellement plus élevé** que sur le
1 mois. Le choix n'est pas neutre sur les ratios affichés : il doit être
**documenté à l'affichage**, pas seulement ici.

**Second indicateur retenu, distinct du premier** : le **1 mois** comme
benchmark monétaire (`category = MONETAIRE`) des fonds monétaires, lui aussi à
100 %. Il ne remplace pas le taux sans risque et ne doit pas être confondu avec
lui — DEC-AF-007 interdit de substituer un rendement à un taux monétaire sans
justification ; la réciproque vaut aussi.

**Deux réserves de nature, à ne pas perdre.**

- La série est **hebdomadaire**, et le taux publié est un **taux moyen pondéré
  sur la semaine**, non une observation ponctuelle. Ce n'est pas un taux au jour
  le jour quotidien : c'est sa moyenne hebdomadaire pondérée par les volumes.
  L'`indicator_name` doit le dire.
- La série **n'est pas continue** : 15 trous de plus de 14 jours, le plus long de
  **49 jours**. La règle « dernière valeur à une date ≤ date cible » peut donc
  servir un taux vieux de sept semaines. `as_of_date` et le statut
  `OK_PREVIOUS_AVAILABLE_DATE` doivent être portés jusqu'à l'affichage.

**Codes d'indicateur : toujours non canoniques.** F3 ne nomme aucun indicateur
pour les taux interbancaires UMOA par maturité. `UMOA_INTERBANK_WAR_1D` et ses
variantes restent une **proposition** de l'extracteur. Cette décision porte sur
la **maturité retenue**, pas sur son identifiant.

Toute nouvelle décision structurante doit être ajoutée ici et détaillée par ADR lorsque nécessaire.