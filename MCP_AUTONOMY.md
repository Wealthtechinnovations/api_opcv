# MCP AUTONOMY — FundAfrica API OPCVM

Ce fichier est une consigne persistante pour toutes les sessions Claude Code travaillant sur ce projet.

## Projet

Nom : FundAfrica API OPCVM  
MCP project key : api_opcv  
Chemin serveur S2 : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api  

Branches Claude connues : claude/code-review-improvements-ikvuj, claude/review-previous-work-Ps4eJ

Déploiement : PM2 api-monolith via deploy_project_s2.

## Règles d'autonomie

Claude peut travailler en autonomie via le MCP WealthTech sur ce projet, sans redemander d'autorisation manuelle pour chaque commande.

Le MCP gère automatiquement :
- git status
- logs dans .mcp_logs/
- git stash
- git pull --rebase
- git stash pop
- build
- restart PM2 ou déploiement Docker selon le projet

## Règles obligatoires sans régression

1. Travailler uniquement dans ce projet et son environnement.
2. Ne jamais sortir du chemin serveur déclaré.
3. Ne jamais faire de régression fonctionnelle.
4. Lire les fichiers .md avant intervention :
   - CLAUDE.md
   - GPT.md si présent
   - SUIVI.md
   - README.md
   - README_DEV.md
   - ROADMAP.md
   - TODO.md
   - TASKS.md
   - CODE_REVIEW.md
   - CHANGELOG.md
   - DEPLOYMENT_PRODUCTION.md
   - PRODUCTION_STATE.json si présent
5. Mettre à jour la documentation après intervention :
   - SUIVI.md
   - CHANGELOG.md
   - TASKS.md
   - CODE_REVIEW.md
6. Vérifier build, logs, PM2/Docker et URL publique après modification.
7. En cas de conflit Git, erreur build ou risque de régression : arrêter l'action dangereuse, documenter, puis corriger proprement.
8. Ne jamais supprimer un fichier ou une donnée sans justification documentée.
9. Ne jamais exposer ou committer de secrets, tokens, clés SSH ou contenu .env.
10. Toujours documenter les décisions importantes.

## Outils MCP autorisés

- git_status_project_s2
- git_pull_project_s2
- deploy_project_s2
- deploy_brvm_s2 si projet BRVM
- exec_repo_script_s2
- run_sql_readonly_s2 pour les vérifications SQL SELECT uniquement

## Première action obligatoire à chaque session

1. Lire ce fichier MCP_AUTONOMY.md.
2. Lire CLAUDE.md.
3. Lire SUIVI.md si présent.
4. Vérifier l'état Git avec l'outil MCP.
5. Continuer le travail sans régression.

---

## CONNEXION MCP DURABLE (mis a jour 2026-07-11)

URL MCP Claude a conserver : https://mcp.wealthtechinnovations.com/mcp
(le serveur accepte aussi les alias avec/sans slash et sans /mcp — correctif f92f621)

Projets MCP du chantier FundAfrica :
- api_opcv       — /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api (PM2 api-monolith)
- front_end_opcvm — /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend (PM2 fundafrique-frontend)

Hors perimetre chantier FundAfrica : BRVMCHAINSOLUTION, Patricked-code/MCP
(citables pour comprendre le bridge, jamais comme cible de travail).

### Verification obligatoire au demarrage de session
1. ping → attendre "wealthtech_ssh_bridge_ok"
2. get_write_tools_context
3. git_status_project_s2 project=api_opcv
4. git_status_project_s2 project=front_end_opcvm

### Si les outils MCP sont absents ou disparaissent : MODE RELAIS MCP EXTERNE
- Ne PAS bloquer le chantier, ne pas repeter "MCP absent" en boucle, pas de STOP sauf risque reel.
- Preparer UNE action MCP externe verifiable a la fois (outil + parametres exacts).
- L'utilisateur la transmet (ChatGPT/MCP), colle le resultat ; Claude analyse et donne l'etape suivante.

### Non-regression (permanent)
- Ne JAMAIS committer : logs.txt, le fichier `0`, sec_ng_downloads/, .env, secrets, tokens, cles.
- Pas de git reset, git clean, ecrasement ; ne perdre aucun commit serveur (snapshots horaires sync_production.sh → reconcilier par stash + pull --rebase + stash pop).
- Pas de pull si divergence non comprise ; pas de push/deploiement/migration sans validation explicite.

### Documentation (permanent)
Relire avant toute action importante : MCP_AUTONOMY.md, CLAUDE.md, SUIVI.md, CHANGELOG.md,
TASKS.md, CODE_REVIEW.md, DEPLOYMENT_PRODUCTION.md (+ GPT.md et PRODUCTION_STATE.json si presents).
Mettre a jour SUIVI.md (POINT DE REPRISE COURANT) apres chaque lot.

### Regle MCP globale
Respecter les fichiers .md du depot MCP : NO_REGRESSION_POLICY.md, MCP_PERMISSIONS_MODEL.md,
MCP_GITHUB_GOVERNANCE.md, MCP_ANTI_DISPERSION_GOVERNANCE.md, SOURCE_OF_TRUTH.md, PROJECT_RULES.md.
