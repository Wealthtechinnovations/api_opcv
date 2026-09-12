# DEPLOYMENT_PRODUCTION.md -- Backend API (api_opcv)

> Procedure de deploiement et maintenance en production pour l'API Africafunds.
> Ce document est la reference unique pour toutes les operations de deploiement backend.

---

## Informations generales

| Element | Valeur |
|---------|--------|
| Serveur | Ionos VPS, Ubuntu 22.04 |
| IP | 217.160.249.254 |
| Domaine | africafunds.chainsolutions.fr |
| API URL publique | https://africafunds.chainsolutions.fr/api/ |
| Port API | 3005 |
| Processus PM2 | api-monolith |
| Reverse proxy | Nginx (`/api/` -> port 3005) |
| Node.js | 18.20.8 |
| Base de donnees | MySQL, base `fund_opcvm` (host 127.0.0.1, user fund_opcvm) |
| Credentials DB | Voir fichier `.env` sur le serveur |
| Branche Git | `claude/code-review-improvements-ikvuj` |
| Chemin serveur | `/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api` |
| Config PM2 production | `ecosystem.production.config.js` (api-monolith, fork, 500M max) |
| Logs PM2 | `./logs/api-error.log`, `./logs/api-out.log` |

---

## 1. Checklist pre-deploiement

Avant tout deploiement, verifier systematiquement :

### 1.1 Verification locale (poste de developpement)

```bash
# Verifier l'etat Git local
cd /home/user/api_opcv
git status
git log --oneline -5

# Verifier la syntaxe des fichiers modifies
node --check src/routes/apigestionsavequotidien.js && echo "SYNTAX OK"
node --check src/routes/apigestionfonds.js && echo "SYNTAX OK"
node --check src/routes/apigestionperformance.js && echo "SYNTAX OK"
node --check src/routes/apigestionratios.js && echo "SYNTAX OK"
node --check src/routes/apigestionquartile.js && echo "SYNTAX OK"
node --check app.js && echo "SYNTAX OK"
```

### 1.2 Verification de l'etat de production

```bash
# Verifier le snapshot production (genere automatiquement par sync_production.sh)
cat PRODUCTION_STATE.json | python3 -m json.tool | head -50

# Verifier que l'API repond actuellement
curl -s http://localhost:3005/api/getactualite | head -5

# Verifier le statut PM2
pm2 status api-monolith

# Verifier les logs recents (pas d'erreurs critiques)
pm2 logs api-monolith --lines 20 --nostream
```

### 1.3 Verification base de donnees

```bash
# Verifier que MySQL est operationnel (credentials : voir .env)
mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SELECT COUNT(*) FROM fond_investissements;"
```

### 1.4 Points de vigilance

- Ne JAMAIS deployer pendant l'execution d'un cron (verifier l'heure)
- Horaires cron a eviter : 19h00-19h30 (Tunisie), 19h30-20h00 (BRVM), 20h00-21h30 (daily update), 21h30-22h00 (EUR/USD), 22h00 (health check)
- Ne pas deployer si des modifications de base de donnees sont en cours
- S'assurer que le build frontend est compatible avec les changements API

---

## 2. Procedure de deploiement standard

### 2.1 Deploiement pas a pas

```bash
# Se placer dans le repertoire de production
cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api

# Sauvegarder les modifications locales eventuelles
git stash

# Recuperer les derniers changements
git pull --rebase origin claude/code-review-improvements-ikvuj

# Restaurer les modifications locales (ignorer si rien a restaurer)
git stash pop 2>/dev/null || true

# Verifier la syntaxe du fichier principal modifie
node --check src/routes/apigestionsavequotidien.js && echo "SYNTAX OK"

# Redemarrer l'API
pm2 restart api-monolith

# Attendre que le processus soit pret
sleep 10

# Verification rapide de sante
curl -s http://localhost:3005/api/getactualite | head -5
```

### 2.2 Commande en une ligne (deploiement rapide)

```bash
cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && git stash && git pull --rebase origin claude/code-review-improvements-ikvuj && git stash pop 2>/dev/null || true && node --check src/routes/apigestionsavequotidien.js && echo "SYNTAX OK" && pm2 restart api-monolith && sleep 10 && curl -s http://localhost:3005/api/getactualite | head -5
```

---

## 3. Verification post-deploiement

Apres chaque deploiement, executer ces verifications dans l'ordre :

### 3.1 Sante generale de l'API

```bash
# Verifier que PM2 indique "online"
pm2 status api-monolith

# Verifier que le port 3005 est ecoute
ss -tlnp | grep 3005

# Verifier les logs (pas d'erreur au demarrage)
pm2 logs api-monolith --lines 30 --nostream
```

### 3.2 Routes critiques a tester

```bash
# Actualites (test basique de connectivite)
curl -s http://localhost:3005/api/getactualite | head -5

# VL d'un fonds (devise locale)
curl -s http://localhost:3005/api/valLiq/1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('VL count:', len(d.get('data',{}).get('vl',[])))"

# VL d'un fonds (EUR, base 100)
curl -s http://localhost:3005/api/valLiqdev/1/EUR | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('data') else 'ERREUR')"

# Performances d'un fonds (devise locale)
curl -s "http://localhost:3005/api/performanceswithdate/fond/1/$(date +%Y-%m-%d)" | head -5

# Performances EUR
curl -s http://localhost:3005/api/performancesdev/fond/1/EUR | head -5

# Performances USD
curl -s http://localhost:3005/api/performancesdev/fond/1/USD | head -5

# Ratios (devise locale)
curl -s "http://localhost:3005/api/ratiosnew/$(date +%Y)/1" | head -5

# Ratios EUR
curl -s "http://localhost:3005/api/ratiosnewdev/$(date +%Y)/1/EUR" | head -5

# Classement + quartile (devise locale)
curl -s http://localhost:3005/api/classementquartile/fond/1 | head -5

# Classement EUR
curl -s http://localhost:3005/api/classementquartiledev/fond/1/EUR | head -5

# Liste des fonds par societe de gestion
curl -s http://localhost:3005/api/listeproduitsociete/1 | head -5

# Performances par categorie (devise locale)
curl -s "http://localhost:3005/api/performancescategorie/fond/1" | head -5

# Performances par categorie (EUR)
curl -s "http://localhost:3005/api/performancesdevcategorie/fond/1/EUR" | head -5
```

### 3.3 Verification via URL publique

```bash
# Tester depuis l'exterieur via Nginx
curl -s https://africafunds.chainsolutions.fr/api/getactualite | head -5
curl -s https://africafunds.chainsolutions.fr/api/valLiq/1 | head -5
```

---

## 4. Procedure de rollback

En cas de probleme apres deploiement :

### 4.1 Rollback rapide (revenir au commit precedent)

```bash
cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api

# Identifier le commit precedent
git log --oneline -5

# Revenir au commit precedent
git checkout HEAD~1

# Redemarrer
pm2 restart api-monolith
sleep 10

# Verifier
curl -s http://localhost:3005/api/getactualite | head -5
pm2 status api-monolith
```

### 4.2 Rollback vers un commit specifique

```bash
cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api

# Identifier le commit cible (dernier connu stable)
git log --oneline -20

# Revenir au commit cible
git checkout <commit_hash>

# Redemarrer
pm2 restart api-monolith
sleep 10

# Verifier
curl -s http://localhost:3005/api/getactualite | head -5
```

### 4.3 En cas de crash total

```bash
# Verifier les logs PM2
pm2 logs api-monolith --lines 100 --nostream

# Si le processus ne demarre pas du tout
pm2 delete api-monolith
pm2 start ecosystem.production.config.js
pm2 save

# Si le probleme persiste, verifier:
# - Node.js: node --version (doit etre 18.x)
# - Dependances: npm ls --depth=0 (pas de missing)
# - .env present et correct
# - MySQL accessible: mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SELECT 1;"
```

---

## 5. Crons actifs en production

### 5.1 Tableau recapitulatif

| Schedule | Script | Description | Logs |
|----------|--------|-------------|------|
| `0 19 * * 1-5` | `scripts/cron/cron_tunisie_daily.sh` | Import quotidien VL CMF Tunisie | `data/tunisie_cmf/logs/` |
| `30 19 * * 1-5` | `scripts/cron/cron_brvm_daily.sh` | Import quotidien VL BRVM (BOC PDF) | `data/brvm_boc/logs/` |
| `0 20 * * 1-5` | `scripts/cron/cron_daily_update.sh` | Mise a jour quotidienne principale (9 etapes) | `/var/log/africafunds_daily_YYYYMMDD.log` |
| `30 21 * * *` | `scripts/cron/cron_daily_eur_usd.sh` | Perf EUR/USD + classements EUR/USD | `/var/log/cron_eur_usd.log` |
| `0 10 * * 1` | `scripts/cron/cron_nigeria_weekly.sh` | Import hebdomadaire SEC Nigeria | `/var/log/africafunds_nigeria_YYYYMMDD.log` |
| `0 22 * * *` | `scripts/cron/cron_health_check.sh` | Verification de sante post-crons | `/var/log/africafunds_health_YYYYMMDD.log` |
| `0 * * * *` | `scripts/deploy/sync_production.sh` | Snapshot horaire etat production | PRODUCTION_STATE.json |

### 5.2 Ordre chronologique quotidien (jours ouvres)

1. **19h00** -- Import VL Tunisie (CMF) -- `cron_tunisie_daily.sh`
2. **19h30** -- Import VL BRVM (BOC PDF) -- `cron_brvm_daily.sh`
3. **20h00** -- Mise a jour principale -- `cron_daily_update.sh` (9 etapes : ASFIM scrape + forex + taux EUR/USD + VL ajustees + performances locale 3 lots + perf EUR/USD + classements)
4. **21h30** -- Perf EUR/USD + classements EUR/USD -- `cron_daily_eur_usd.sh`
5. **22h00** -- Verification de sante -- `cron_health_check.sh`
6. **Chaque heure** -- Snapshot production -- `sync_production.sh`

### 5.3 Cron hebdomadaire

- **Lundi 10h00** -- Import Nigeria (SEC Nigeria publie les VL le vendredi) -- `cron_nigeria_weekly.sh`

### 5.4 Verifier la crontab active

```bash
crontab -l
```

### 5.5 Verifier les logs des derniers crons

```bash
# Dernier cron quotidien
tail -50 /var/log/africafunds_daily_$(date +%Y%m%d).log

# Dernier cron EUR/USD
tail -30 /var/log/cron_eur_usd.log

# Dernier cron Nigeria (lundi)
ls -la /var/log/africafunds_nigeria_*.log | tail -1

# Dernier health check
tail -30 /var/log/africafunds_health_$(date +%Y%m%d).log

# Tunisie
ls -la data/tunisie_cmf/logs/ | tail -5

# BRVM
ls -la data/brvm_boc/logs/ | tail -5
```

---

## 6. Regeneration des classements

Les classements comparent les fonds entre eux par categorie. Trois devises : locale, EUR, USD.

### 6.1 Classement en devise locale

```bash
# Via API (route batch)
curl -s http://localhost:3005/api/classementmysql --max-time 300
```

Cette route recalcule les classements pour tous les fonds en devise locale et met a jour la table `classementfonds`.

### 6.2 Classement EUR

```bash
curl -s http://localhost:3005/api/classementeur --max-time 300
```

Met a jour la table `classementfonds_eurs`.

### 6.3 Classement USD

```bash
curl -s http://localhost:3005/api/classementusd --max-time 300
```

Met a jour la table `classementfonds_usds`.

### 6.4 Regeneration complete des trois classements

```bash
echo "--- Classement LOCAL ---"
curl -s http://localhost:3005/api/classementmysql --max-time 300
echo ""
echo "--- Classement EUR ---"
curl -s http://localhost:3005/api/classementeur --max-time 300
echo ""
echo "--- Classement USD ---"
curl -s http://localhost:3005/api/classementusd --max-time 300
```

**Attention** : chaque classement peut prendre plusieurs minutes. Ne pas interrompre.

---

## 7. Recalcul des performances

### 7.1 Performances en devise locale

```bash
cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api

# Recalcul pour tous les fonds (par lots)
node scripts/fix/fix_populate_performances.js
```

Ce script calcule directement les performances (YTD, 1M, 3M, 6M, 1A, 3A, 5A, depuis creation) via SQL et met a jour la table `performences`.

### 7.2 Performances EUR et USD

```bash
# Recalcul EUR + USD
node scripts/fix/fix_populate_performances_eur_usd.js --devise BOTH
```

Met a jour les tables `performences_eurs` et `performences_usds`.

### 7.3 Recalcul VL ajustees (Total Return NAV)

Les VL ajustees integrent les dividendes reinvestis. Necessaire avant le recalcul des performances.

```bash
node scripts/fix/fix_valorisations_eur_usd.js
```

### 7.4 Recalcul taux EUR/USD dans les valorisations

```bash
node scripts/fix/fix_valorisations_eur_usd.js
```

**Rappel** : la conversion se fait par DIVISION (`valeur_locale / taux`), jamais par multiplication.

### 7.5 Ordre recommande pour un recalcul complet

1. Recalculer les taux EUR/USD dans les valorisations
2. Recalculer les VL ajustees
3. Recalculer les performances locale
4. Recalculer les performances EUR/USD
5. Regenerer les classements (locale, EUR, USD)

---

## 8. Problemes courants et depannage

### 8.1 L'API ne demarre pas

```bash
# Verifier les logs
pm2 logs api-monolith --lines 50 --nostream

# Causes frequentes :
# - Erreur de syntaxe dans un fichier route
node --check app.js
node --check src/routes/apigestionsavequotidien.js
node --check src/routes/apigestionperformance.js

# - Module manquant
npm ls --depth=0 2>&1 | grep "MISSING"

# - Port 3005 deja utilise
ss -tlnp | grep 3005
# Si un autre processus occupe le port :
# kill <PID> puis pm2 restart api-monolith

# - Fichier .env absent ou corrompu
ls -la .env
```

### 8.2 L'API demarre mais certaines routes echouent

```bash
# Verifier la connexion MySQL
mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SELECT 1;"

# Verifier que les tables existent
mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SHOW TABLES;"

# Verifier le nombre de fonds
mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SELECT COUNT(*) as nb_fonds FROM fond_investissements;"

# Verifier les valorisations recentes
mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SELECT MAX(date) as derniere_vl FROM valorisations;"
```

### 8.3 Les classements ou performances sont vides

```bash
# Verifier les tables
mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SELECT COUNT(*) FROM classementfonds;"
mysql -u fund_opcvm -p -h 127.0.0.1 fund_opcvm -e "SELECT COUNT(*) FROM performences;"

# Si vide, regenerer (voir sections 6 et 7)
```

### 8.4 Conflit Git au deploiement

```bash
cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api

# Voir l'etat
git status

# Si conflit apres stash pop
git checkout --theirs .  # Prendre la version du depot (ignorer le local)
# OU
git checkout --ours .    # Garder la version locale

# En dernier recours : reset complet (ATTENTION : perte des modifications locales)
git stash drop
git reset --hard origin/claude/code-review-improvements-ikvuj
pm2 restart api-monolith
```

### 8.5 Memoire insuffisante (PM2 restart en boucle)

```bash
# Verifier la memoire
pm2 monit

# Verifier le seuil max_memory_restart dans ecosystem.production.config.js
# Actuellement : 500M

# Si besoin, augmenter temporairement
pm2 delete api-monolith
PORT=3005 NODE_ENV=production pm2 start app.js --name api-monolith --max-memory-restart 800M
pm2 save
```

### 8.6 Nginx ne proxy plus vers l'API

```bash
# Verifier la config Nginx
nginx -t

# Verifier que le bloc /api/ pointe vers localhost:3005
grep -A5 "location /api" /etc/nginx/sites-enabled/*

# Recharger Nginx si modification
sudo systemctl reload nginx
```

### 8.7 Les crons ne s'executent pas

```bash
# Verifier la crontab
crontab -l

# Verifier les permissions des scripts
ls -la scripts/cron/*.sh

# Rendre executables si necessaire
chmod +x scripts/cron/*.sh

# Executer manuellement pour debug
bash scripts/cron/cron_health_check.sh
```

---

## 9. Routes importantes pour verification

### 9.1 Routes publiques principales

| Route | Methode | Description |
|-------|---------|-------------|
| `/api/getactualite` | GET | Actualites (test de base) |
| `/api/valLiq/:id` | GET | VL + graphique devise locale |
| `/api/valLiqdev/:id/:devise` | GET | VL + graphique EUR ou USD (base 100) |
| `/api/performanceswithdate/fond/:id/:date` | GET | Performances a une date |
| `/api/performancesdev/fond/:id/:devise` | GET | Performances EUR/USD |
| `/api/performancescategorie/fond/:id` | GET | Performances categorie locale |
| `/api/performancesdevcategorie/fond/:id/:devise` | GET | Performances categorie EUR/USD |
| `/api/ratiosnew/:year/:id` | GET | Ratios devise locale |
| `/api/ratiosnewdev/:year/:id/:devise` | GET | Ratios EUR/USD |
| `/api/classementquartile/fond/:id` | GET | Classement + quartile local |
| `/api/classementquartiledev/fond/:id/:devise` | GET | Classement EUR/USD |
| `/api/listeproduitsociete/:id` | GET | Fonds par societe de gestion |

### 9.2 Routes batch (recalcul)

| Route | Methode | Description |
|-------|---------|-------------|
| `/api/classementmysql` | GET | Regeneration classements locale |
| `/api/classementeur` | GET | Regeneration classements EUR |
| `/api/classementusd` | GET | Regeneration classements USD |
| `/api/saveperfdatemysql` | GET | Sauvegarde performances quotidiennes |

### 9.3 Routes d'import

| Route | Methode | Description |
|-------|---------|-------------|
| `/api/savevl` | POST | Import VL unitaire |
| `/api/uploadsfilevl` | POST | Import VL par fichier |
| `/api/ajoutVL` | POST | Ajout VL manuelle |

---

## 10. Fichiers de configuration cles

| Fichier | Role |
|---------|------|
| `.env` | Variables d'environnement (DB credentials, secrets) -- NE PAS COMMITTER |
| `ecosystem.production.config.js` | Configuration PM2 production (api-monolith) |
| `app.js` | Point d'entree de l'application Express |
| `PRODUCTION_STATE.json` | Snapshot automatique de l'etat production (genere par sync_production.sh) |
| `src/routes/*.js` | Fichiers de routes API |
| `src/models/*.js` | Modeles Sequelize (ORM) |
| `scripts/cron/*.sh` | Scripts de crons automatises |
| `scripts/fix/*.js` | Scripts de maintenance et recalcul |

---

## 11. Contacts et references

- Fichier de suivi operationnel : `../front_end_opcvm/SUIVI.md`
- Regles permanentes backend : `CLAUDE.md` (ce depot)
- Regles permanentes frontend : `../front_end_opcvm/CLAUDE.md`
- Snapshot production : `PRODUCTION_STATE.json` (genere automatiquement)

---

*Derniere mise a jour : 2026-06-18*
