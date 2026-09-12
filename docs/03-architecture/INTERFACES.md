# INTERFACES — AfricaFunds

Interfaces gouvernées : frontend↔API, API↔DB, importers↔sources externes, crons/workers↔services, scripts↔runtime. Chaque évolution d’interface analyse compatibilité, consommateurs et erreurs. Les interfaces historiques restent supportées tant qu’une migration explicite ne les déprécie pas.