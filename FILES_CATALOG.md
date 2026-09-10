# FILES_CATALOG — AfricaFunds API

> Catalogue des rôles ; `SOURCE_OF_TRUTH.md` définit l’autorité.

| Famille | Rôle | Statut |
|---|---|---|
| fichiers historiques racine/docs | connaissance, diagnostics, procédures et preuves existantes | `PRESERVED` |
| `00_START_HERE`/`GOVERNANCE`/`SOURCE_OF_TRUTH`/`AGENTS` | autorités transversales existantes | `CANONICAL` |
| `SUIVI.md` API | pointeur/mémoire locale | `ADAPTER` |
| `front_end_opcvm/SUIVI.md` | checkpoint global AfricaFunds | `CANONICAL_GLOBAL` |
| registres `STATUS/LOOP/WORK_LOG/HANDOFF/NEXT_ACTION` | vues complémentaires de continuité | `OPERATIONAL` |
| `docs/01-governance` | politiques spécialisées | `SPECIALIZED` |
| `docs/09-loop` | preuves, erreurs, apprentissages, métriques | `OPERATIONAL/EVIDENCE` |
| `docs/10-ai` | gouvernance IA | `SPECIALIZED` |
| `.governance/` | connaissance structurée machine-readable | `MACHINE_READABLE` |

Aucun recouvrement de nom ne constitue à lui seul une duplication. Lire le contenu, le rôle et l’historique avant toute dépréciation.