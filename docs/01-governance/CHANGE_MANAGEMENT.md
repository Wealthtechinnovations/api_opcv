# CHANGE_MANAGEMENT — AfricaFunds

Chaque changement définit scope, baseline, impacts, compatibilité, preuves, rollback et autorité. Les modifications cross-repository sont une transaction logique : API et frontend restent deux commits/historiques mais leur compatibilité et leur `FUND_STATE` sont vérifiés ensemble.

Aucun changement de branche canonique, source de vérité, schéma destructif ou production n’est implicite.