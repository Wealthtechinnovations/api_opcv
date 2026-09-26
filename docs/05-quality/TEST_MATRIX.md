# TEST_MATRIX — AfricaFunds API

| Type de changement | Contrôles minimum |
|---|---|
| API/service | unit/intégration + contrat |
| modèle/migration | schema + migration + intégrité data |
| calcul financier | cas représentatifs + non-régression historique |
| import/cron | dry-run/audit + bornage + idempotence/logs |
| auth/security | tests d’accès + secret scan pertinent |
| docs/gouvernance | cohérence liens/rôles + HEAD remote |
| production | smoke/HTTP/runtime + attestation |
