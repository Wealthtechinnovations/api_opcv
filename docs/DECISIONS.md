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

Toute nouvelle décision structurante doit être ajoutée ici et détaillée par ADR lorsque nécessaire.