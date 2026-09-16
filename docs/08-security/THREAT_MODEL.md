# THREAT_MODEL — AfricaFunds

Actifs : comptes, données de fonds, historique, calculs, DB, secrets, GitHub, S2. Frontières : utilisateur↔frontend↔API↔DB/sources↔jobs. Menaces à analyser : accès non autorisé, injection, falsification data, fuite secret/PII, dépendance compromise, job incorrect, drift Git/runtime. Mettre à jour lorsqu’une frontière change.