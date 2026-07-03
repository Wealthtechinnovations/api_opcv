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
