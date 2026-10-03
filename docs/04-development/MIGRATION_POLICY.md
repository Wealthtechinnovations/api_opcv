# MIGRATION_POLICY — AfricaFunds API

Préférer migrations additives et backward-compatible. Avant migration : schéma réel, données affectées, backup/rollback, compatibilité code/DB, durée/lock, tests. `DROP`, `TRUNCATE`, rename destructif ou conversion irréversible exigent décision explicite et preuve. Une migration écrite n’est pas une migration exécutée.