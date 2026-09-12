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


## Remédiation exécutée — 2026-09-12

Aucune valeur sensible n'est reproduite ici.

### Git/runtime

- le vrai `.env` n'est plus suivi dans le HEAD courant ;
- S2 conserve le fichier au même chemin runtime, local, ignoré par Git, permissions `0600` ;
- le secret gate CI est vert sur le tree courant.

### DB_PASSWORD

Rotation transactionnelle exécutée via GitHub Actions→SSH S2 :
- nouvelle valeur générée uniquement sur S2 ;
- connexion avec la nouvelle valeur : PASS ;
- ancien credential : rejeté ;
- trois processus backend concernés : online ;
- API locale : HTTP 200 ;
- aucune modification de schéma ou de donnée métier.

### JWT_SECRET

Rotation gouvernée exécutée :
- helper de rotation testé (6/6 tests Jest) ;
- nouvelle clé de signature active ;
- phase transitoire dual-key validée ;
- ancienne clé historiquement exposée ensuite désactivée ;
- token courant valide ;
- token signé par l'ancienne clé rejeté ;
- anciennes sessions révoquées comme mesure d'incident ;
- API locale : HTTP 200.

### Rotations externes restantes

`EMAIL_PASSWORD` et `MAGIC_SECRET_KEY` sont utilisés par le runtime mais ne peuvent pas être rotatés uniquement depuis Git/S2 : le nouveau credential doit être émis/révoqué chez le fournisseur correspondant. Les outils actuellement disponibles n'exposent pas ces surfaces d'administration.

```text
TRACKED_REAL_ENV_CURRENT_HEAD = RESOLVED
DB_PASSWORD_ROTATION = PASS
JWT_SECRET_ROTATION = PASS
OLD_JWT_KEY_REVOCATION = PASS
EMAIL_PASSWORD_ROTATION = BLOCKED_EXTERNAL_PROVIDER
MAGIC_SECRET_KEY_ROTATION = BLOCKED_EXTERNAL_PROVIDER
HISTORY_REWRITE = NOT_AUTHORIZED
```
