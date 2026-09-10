# SYSTEM_CONTEXT — AfricaFunds

Système : navigateur/utilisateurs ↔ frontend `front_end_opcvm` ↔ API `api_opcv` ↔ DB/pipelines/sources. GitHub porte code et gouvernance ; S2 exécute les deux applications et leurs processus autorisés.

Les sources externes, imports et crons sont des dépendances explicites ; ils ne deviennent pas sources de vérité sans qualification.