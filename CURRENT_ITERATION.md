# CURRENT_ITERATION — AfricaFunds API

## AF-GOV-FINAL-CERT-20260911-01

Objectif inchangé : terminer la certification AfricaFunds sans système parallèle et sans régression.

### État courant

La phase Git/documentation/mémoire a franchi les gates principaux : reconstruction de contexte, découverte croisée, audit Markdown exhaustif, reprise Claude↔ChatGPT, branch drift et cohérence d'état sont installés et testés.

Le lot actif est désormais **AF-TASK-006 — S2 live observation sans bridge MCP**. Le bridge n'est pas disponible dans la présente session ; le fallback GitHub Actions→SSH doit donc être utilisé.

### Ordre de continuation

```text
AF-TASK-006 S2 OBSERVE
→ AF-TASK-007 FALLBACK LIVE PROOF
→ AF-TASK-010 SECRET RUNTIME MIGRATION / ROTATION
→ AF-TASK-008 ENFORCEMENT MAXIMAL
→ AF-TASK-009 FINAL RESUME/BRIDGE-DOWN TESTS
→ AF-TASK-011 FINAL SYNCHRONIZATION + ATTESTATION
```

Les opérations métier/data historiques restent hors scope de cette itération tant qu'elles ne sont pas nécessaires à la gouvernance finale.
