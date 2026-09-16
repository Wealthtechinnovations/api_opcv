# RUNBOOK — AfricaFunds API

Index opérationnel, sans duplication des runbooks spécialisés.

- Incidents : `docs/07-operations/INCIDENT_RESPONSE.md`
- Registre machine incidents : `.governance/incidents/registry.json`
- Postmortems : `docs/07-operations/incidents/`
- MariaDB : `docs/OPS_MARIADB.md`, `.github/workflows/ops-mariadb-recover.yml`
- GitHub↔S2 : `docs/runbooks/GITHUB_S2_RECONCILIATION_RUNBOOK.md`
- Déploiement : `DEPLOYMENT_PRODUCTION.md` + workflows gouvernés
- Mesure production : `docs/ETAT_PRODUCTION_VERIFIE.md`

Toujours suivre le runbook le plus spécifique réellement maintenu. Un restart ou rollback réussi ne clôture pas un incident récurrent : mettre à jour le registre, la task queue et le postmortem.
