# DEPENDENCIES — AfricaFunds API

## Dépendances structurantes

- frontend : `Wealthtechinnovations/front_end_opcvm` ;
- production : S2 ;
- base de données et migrations versionnées ;
- sources financières/réglementaires propres aux pays et pipelines ;
- scripts, imports, crons et workers existants ;
- workflows GitHub Actions existants.

Toute évolution API doit analyser les consommateurs frontend et toute dépendance data/DB/runtime concernée. Les versions détaillées restent dans les manifests/package files techniques existants.