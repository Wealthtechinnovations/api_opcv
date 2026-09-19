# DOCUMENT_INTEGRATION_MATRIX — AfricaFunds API

> Boucle : `AF-GOV-REGULATORY-PLUS-001`.

| Famille Regulatory | Existant AfricaFunds | Action | Autorité finale |
|---|---|---|---|
| point d’entrée/gouvernance | déjà présent | `ENRICH_EXISTING` | canons racine existants |
| état/loop/handoff | principalement SUIVI | `CREATE_REGISTER` | rôles complémentaires |
| décisions/ADR | GOV-006 et docs dispersés | `CREATE_INDEX + ADR` | `docs/DECISIONS.md` + historique |
| architecture | diagnostics + GOV-006 runtime model | `CREATE_INDEX/ADAPTER` | canons historiques + index |
| data | modèles/migrations/docs métier | `ENRICH/INDEX` | code + sources spécialisées |
| development/quality | règles dispersées | `CREATE_SPECIALIZED` | docs spécialisés |
| delivery/operations | workflows et procédures existants | `CREATE_ADAPTER/SPECIALIZED` | workflows/scripts réels + docs |
| security | règles existantes | `CREATE_SPECIALIZED` | politique spécialisée |
| AI | AGENTS/CLAUDE/GPT/MCP_AUTONOMY | `KEEP + SPECIALIZE` | `AGENTS.md` + adaptateurs |
| templates | absent/partiel | `CREATE_TEMPLATE` | modèles sans données réelles |
| optional | selon preuve d’applicabilité | `CREATE_CONDITIONAL` | aucune activation implicite |
| règles métier prospectus Regulatory | non applicables | `NOT_APPLICABLE` | non importées |

Invariants : `DELETE=0`, `REPLACE=0`, `RENAME=0`, aucune perte de connaissance, aucune autorité parallèle.