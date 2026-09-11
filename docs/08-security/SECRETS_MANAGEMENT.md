# SECRETS_MANAGEMENT — AfricaFunds

Aucun secret nouveau dans Git. Utiliser les mécanismes autorisés GitHub/serveur. Les fichiers de configuration déjà versionnés contenant potentiellement des valeurs sensibles doivent être audités sans exposer leurs contenus. Rotation si exposition confirmée ; ne jamais recopier un secret dans un rapport.

## Incident confirmé — 2026-09-11

L'audit gouverné a confirmé qu'un fichier `.env` suivi dans le repository public contient des valeurs **non-placeholder** pour des secrets utilisés par l'application : mot de passe DB, secret JWT, mot de passe e-mail et clé secrète Magic. Les valeurs ne sont jamais reproduites dans la documentation, les logs ou les preuves de gouvernance.

Les fichiers `.env.production` et `.env.production.plan-b` ont également été audités ; les champs sensibles principaux observés y sont des valeurs de remplacement/à changer. Ils restent néanmoins des fichiers de configuration suivis à normaliser dans le chantier sécurité.

Le code charge explicitement le `.env` racine via `dotenv` dans l'application et de nombreux scripts. Il est donc **interdit** de supprimer, vider ou remplacer ce fichier dans Git avant d'avoir préservé et migré l'environnement runtime S2 : une « correction » documentaire pourrait couper l'API, la DB, l'authentification ou les e-mails.

### SECURITY_GATE

```text
TRACKED_REAL_SECRET = CONFIRMED
PUBLIC_REPOSITORY_EXPOSURE = CONFIRMED
ROTATION_REQUIRED = TRUE
RUNTIME_SECRET_MIGRATION_REQUIRED = TRUE
HISTORY_REWRITE = NOT_AUTHORIZED
FULLY_GOVERNED = FORBIDDEN_UNTIL_RESOLVED
```

### Ordre de remédiation obligatoire

1. établir un canal S2 authentifié et vérifié (bridge MCP ou GitHub Actions/SSH avec host key épinglée) ;
2. observer le `.env` runtime sans en afficher les valeurs et confirmer les consommateurs PM2/cron/scripts ;
3. créer une sauvegarde serveur protégée, hors Git, permissions minimales ;
4. préparer la source de secrets runtime non suivie par Git ;
5. **rotater** les credentials exposés auprès des systèmes concernés (DB, JWT, SMTP/e-mail, Magic) ; le repo ayant été public, un simple retrait du fichier n'est pas une rotation ;
6. installer les nouveaux secrets uniquement dans la source runtime autorisée ;
7. vérifier DB, auth/JWT, e-mail, Magic et routes critiques ;
8. seulement après ces preuves, retirer le `.env` réel du suivi Git et conserver des templates sans secret ;
9. vérifier que GitHub/S2/runtime fonctionnent encore ;
10. évaluer l'historique Git. Toute réécriture d'historique exige une décision sécurité séparée ; la rotation des secrets reste obligatoire même si l'historique est réécrit.

### Contrôle continu

`scripts/governance/audit_tracked_secrets.py` et `governance-secret-gate.yml` doivent rester actifs. Leur sortie ne contient que le chemin et le nom de variable, jamais la valeur, un hash, une longueur ou un préfixe susceptible de faciliter la récupération du secret.
