# CURRENT_ITERATION — AfricaFunds API

## AF-GOV-FINAL-CERT-20260911-01 — FINAL_ATTESTATION

Le programme Regulatory Plus / Loop Engineering n'est plus en phase d'installation. Les fonctions centrales sont en service et testées.

### Terminé

- reconstruction déterministe Claude/ChatGPT depuis l'un ou l'autre repo ;
- découverte croisée API ↔ frontend ;
- certification exhaustive des Markdown ;
- branch drift CI ;
- SSH GitHub Actions→S2 indépendant du bridge MCP ;
- GOV-006 partagé ;
- fallbacks API/frontend safe path ;
- détachement du vrai `.env` de Git sans changer son chemin runtime ;
- rotation DB ;
- rotation JWT + révocation de l'ancienne clé.

### Actif

`AF-TASK-011` : synchronisation finale des registres, du `SUIVI.md` global et de S2, puis attestation finale.

### Externes

SMTP/EMAIL provider rotation, Magic provider rotation, OOB host-key verification et GitHub native rulesets.
