# Diagnostic architecture hybride, workers, ttyd-agent, ClickHouse et moteur de recalcul historique

> Date du diagnostic : 2026-05-21
> Auteur : Claude Code (expert OPCVM + dev full-stack)
> Statut : DIAGNOSTIC EN LECTURE SEULE — aucun code modifie, aucune table modifiee, aucune route modifiee
> Regle : zero regression. Toute evolution doit etre additive, progressive, non destructive, documentee, testable et compatible avec l'existant.

---

## A. Lecture du fichier de suivi actuel

### Taches deja faites (resume)
- Phase 1 DB : audit + corrections fondamentales (orphelins, FK societe_id, VL BRIDGE, forex)
- Phase 2 DB : enrichissement statique (structure_fond, categories, dates, actif_net)
- Import VL : Maroc (ASFIM CSV+XLSX+quotidien), UEMOA (BRVM XLSX), Nigeria (SEC weekly pipeline)
- Forex historique : 21 paires, 2000-2026, cron quotidien actif
- Nettoyage VL : 535K doublons + pics + erreurs + indRef parasites
- Performances : locale (57K lignes/1186 fonds), EUR (1951/1185), USD (2184/1185)
- Classements : local 3 types (national/regional/Afrique), EUR 3 types, USD 3 types
- Rendements : 1.09M lignes / 1185 fonds (3 devises)
- TSR par pays : Nigeria 27.5%, Tunisie 8%, UEMOA 3.5%, CEMAC 5%, Maroc 2.75%
- Referentiel FundAfrica : 5 tables ref_* creees, 1178/1189 fonds mappes (99.1%)
- Crons : cron_daily_update.sh (9 etapes, lun-ven 20h), cron_daily_eur_usd.sh (21h30), cron_nigeria_weekly.sh (lundi 10h)
- Frontend : classementType3, graphiques datetime, SEO, null-safety, base 100 EUR/USD
- Securite : helmet, CORS, rate limiting, input sanitization

### Taches restantes (du suivi)
- [ ] Tunisie reimport VL avec dividendes (200-220 Mo, fichiers attendus)
- [ ] LOT 5 : import historiques indices (S&P payant, BVMAC inaccessible)
- [ ] LOT 6 : API et frontend referentiel (routes /api/ref/*)
- [ ] LOT 7 : controles qualite referentiel
- [ ] 11 fonds sans classification (NULL)
- [ ] Panel admin cockpit (gestion rattachements, CRUD, dashboard)
- [ ] Panel societe de gestion (import-nav, documents, staff, reporting)
- [ ] Panel portfolio (bugs serialisation JSON)
- [ ] Anomalies : detection automatique, historique corrections, alertes email
- [ ] Tests automatises (aucun actuellement)
- [ ] Securite : audit endpoints API (auth, CORS, injection)
- [ ] Monitoring crons (alerte si echec)
- [ ] Contraintes FK reelles MySQL
- [ ] Optimisation table classementfonds (30+ colonnes -> table pivot)

### Ce qui doit etre enrichi avec cette analyse
- Systeme de classement date par date (refonte majeure)
- Architecture hybride monolithe + workers
- Moteur de recalcul historique
- ClickHouse pour donnees analytiques
- ttyd-agent securise
- Gestion PM2 progressive

---

## B. Etat actuel reel de l'application

### Stack detectee
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Frontend | Next.js (App Router) | 14.2.3 |
| Backend API | Express.js + Sequelize | Express 4.18, Sequelize 6.32 |
| Base de donnees | MySQL 8.0 (Ubuntu) | 8.0.45 |
| ORM | Sequelize | 6.32.1 |
| Graphiques | Highcharts (frontend) | - |
| Process manager | PM2 | - |
| Reverse proxy | Nginx | - |
| Analytics (non actif) | ClickHouse | @clickhouse/client 1.6 |
| Job queue (non actif) | Bull 4.12 + Agenda 5.0 | declares mais non utilises |
| Cache (non actif) | node-cache 5.1 + ioredis 5.4 | declares mais non utilises |
| Cron bash | crontab Linux | 3 scripts .sh |
| Python (scraping) | Python 3 | sec_ng_nav_extractor_v6.py |

### Arborescence importante
```
api_opcv/
  app.js                           ← Point d'entree monolithe (169 lignes, UTILISE EN PROD)
  ecosystem.config.js              ← Config PM2 microservices (NON UTILISE en prod)
  ecosystem.production.config.js   ← Config PM2 monolithe (UTILISE: api-monolith port 3005)
  start.sh                         ← Lance ecosystem.config.js (microservices, NON UTILISE)
  src/
    routes/                        ← 16 fichiers routes (28K lignes total)
      routes_vl.js                 ← 11 326 lignes (!) — VL, imports, scraping, indices
      apigestionratios.js          ← 7 196 lignes — calculs risque (Sharpe, Sortino, etc.)
      apigestionperformance.js     ← 3 204 lignes — performances local/EUR/USD
      apigestionsavequotidien.js   ← 2 353 lignes — batch perf + classements
      apigestionfonds.js           ← 844 lignes — fiche fonds + graphiques
      [+ 11 autres fichiers]
    models/                        ← 37 modeles Sequelize (3K lignes total)
    db/
      sequelize.js                 ← Init DB + associations (305 lignes)
      clickhouse.js                ← Init ClickHouse + 3 tables (NON ACTIF en prod)
      config.js                    ← Config Sequelize CLI
    middleware/
      validate.js                  ← Sanitisation, rate limiting, validation
      auth.js                      ← Authentification JWT
      pagination.js                ← Pagination
    config/
      agenda.js                    ← Config Agenda (ERREUR: utilise MongoDB mais DB = MySQL)
    services/
      clickhouse-sync.js           ← Sync MySQL->ClickHouse (NON ACTIF)
  services/                        ← Architecture microservices PREPAREE mais NON UTILISEE
    gateway/                       ← Gateway avec proxy (NON UTILISE)
    auth/                          ← Service auth (NON UTILISE)
    funds/                         ← Service fonds (NON UTILISE)
    performance/                   ← Service perf (NON UTILISE)
    portfolio/                     ← Service portfolio (NON UTILISE)
    analytics/                     ← Service analytics (NON UTILISE)
    reference/                     ← Service reference (NON UTILISE)
    notification/                  ← Service notification (NON UTILISE)
    shared/                        ← DB+cache+middleware partagees
  [40+ scripts fix/import/recalc]  ← Scripts one-shot et batch
  [3 scripts cron .sh]             ← Crons actifs via crontab
```

### PM2 en production (constate)
| Process | PM2 ID | Port | Config | Statut |
|---------|--------|------|--------|--------|
| api-monolith | 10 | 3005 | ecosystem.production.config.js | ACTIF |
| fundafrique-frontend | 11 | 3000 | - | ACTIF |
| wealthtech-api | ? | ? | ? | A VERIFIER |
| ttyd | ? | ? | ? | A VERIFIER |

### Points sensibles detectes
1. **routes_vl.js = 11 326 lignes** — fichier monolithique geant melant VL, imports ASFIM, scraping, indices, graphiques, dividendes, anomalies, uploads. Tres fragile, impossible a tester unitairement.
2. **Pas de tests** — zero test unitaire, zero test d'integration, zero test e2e.
3. **Agenda.js configure avec MongoDB** alors que la DB est MySQL — code mort, non fonctionnel.
4. **Bull et ioredis declares** dans package.json mais jamais importes — code mort.
5. **Architecture microservices preparee** (services/) mais jamais activee — doublon de code avec le monolithe.
6. **cron.schedule importe dans 13 fichiers routes** mais jamais appele (aucun cron.schedule() detecte) — import mort.
7. **ClickHouse connecte dans app.js** mais non disponible sur le serveur — analytics routes retournent 503.
8. **Classements calcules en snapshot unique** — pas de classement par date historique.
9. **Performances batch via curl interne** (saveperfdatemysql) — l'API s'appelle elle-meme, lent et fragile.
10. **40+ scripts one-shot** dans la racine — pas de repertoire scripts/, pas de conventions.

---

## C. Diagnostic du monolithe actuel

### Est-ce un monolithe propre, modulaire ou desorganise ?
**Monolithe semi-organise avec dette technique significative.**

Points positifs :
- Separation routes/modeles/db/middleware
- Modeles Sequelize bien definis
- Middleware de validation present
- Helmet + CORS + rate limiting

Points negatifs :
- routes_vl.js = mega-fichier de 11K lignes sans decoupe
- Logique metier melangee dans les routes (pas de couche service)
- Pas de separation commande/requete (meme route fait read+write)
- Scripts one-shot eparpilles a la racine
- Pas de logging structure (console.log/error)
- Pas de monitoring applicatif
- Pas de health check detaille (juste /health basique)

### Ou se trouve quoi
| Element | Fichier(s) | Lignes |
|---------|-----------|--------|
| Routes VL/imports/scraping/indices | routes_vl.js | 11 326 |
| Calculs de risque (Sharpe/Sortino/Calmar/VAR) | apigestionratios.js | 7 196 |
| Performances locale/EUR/USD | apigestionperformance.js | 3 204 |
| Batch perf + classements | apigestionsavequotidien.js | 2 353 |
| Fiche fonds + graphiques | apigestionfonds.js | 844 |
| Societes de gestion | apigestionsociete.js | 749 |
| Pays | apigestionpays.js | 791 |
| Quartiles/classements lecture | apigestionquartile.js | 186 |
| Rendements | apigestionrendement.js | 244 |
| Auth | apigestionauth.js | 140 |
| API keys | apigestionapikey.js | 178 |
| Analytics ClickHouse | analytics.js | 391 |
| Robot advisor | apigestionrobotadvisor.js | 43 |
| Portefeuille | apigestionportefeuille.js | 42 |
| Panel societe | apigestionsocietepanel.js | 42 |

### Modules qui DOIVENT rester dans l'API principale
- Routes de lecture (fiche fonds, listes, recherche, comparaison, classements, graphiques)
- Auth/JWT
- CRUD utilisateurs, panels
- Middleware (validation, rate limiting)
- Routes admin CRUD

### Modules candidats pour extraction en workers
| Module | Raison | Priorite |
|--------|--------|----------|
| saveperfdatemysql / processFundmysql | Calcul batch 1200 fonds, appels HTTP internes, 5-15 min | HAUTE |
| classementmysql / classementeur / classementusd | Calcul batch classements 3 types x 3 devises | HAUTE |
| recalc_vl_ajuste.js | Recalcul 700K+ VL, 3-5 min | HAUTE |
| recalc_eur_usd_daily_rate.js | Recalcul 700K+ VL EUR/USD | HAUTE |
| fix_populate_performances_eur_usd.js | Perf EUR/USD batch 1185 fonds | HAUTE |
| scrape_asfim_import.js | Scraping ASFIM (reseau, lent) | MOYENNE |
| scrape_forex_import.js | Scraping forex Yahoo/FRED | MOYENNE |
| import_vl_nigeria_sec.js | Import Nigeria hebdomadaire | MOYENNE |
| import_indices_excel.js | Import indices batch | BASSE |
| fix_populate_rendements.js | Rendements batch 1185 fonds | BASSE |

### Modules candidats pour services separes (plus tard seulement)
- auth-service : si federation d'identites ou SSO
- payment-service : si monetisation de l'acces
- kyc-service : si onboarding reglemente
- market-data-service : si multi-source real-time
- portfolio-service : si gestion de portefeuille avancee

**Ne PAS creer ces services maintenant — le monolithe suffit avec des workers.**

---

## D. Proposition d'architecture hybride

### Court terme (Phase 1-3, 1-3 mois)
```
PM2 processes :
  api-monolith          ← API Express (lecture + CRUD), port 3005
  fundafrique-frontend  ← Next.js, port 3000
  worker-recalculation  ← Nouveau: recalculs batch (perf, classements, VL ajuste)
  worker-data-import    ← Nouveau: imports (ASFIM, Nigeria, forex, indices)
  ttyd-agent            ← Remplace ttyd: terminal securise avec menu
```

### Moyen terme (Phase 4-5, 3-6 mois)
```
PM2 processes :
  api-monolith          ← API principale
  fundafrique-frontend  ← Front
  worker-recalculation  ← Recalculs + moteur de dependances
  worker-data-import    ← Imports + scraping
  worker-scheduler      ← Remplace crontab: node-cron centralise
  worker-reporting      ← Generation PDF/Excel/reporting
  ttyd-agent            ← Terminal securise
  [ClickHouse]          ← Base analytique
```

### Long terme (Phase 6, 6-12 mois)
```
  + worker-ai-analysis  ← Analyses IA (si fonctionnalite ajoutee)
  + notification-worker  ← Alertes email/SMS anomalies
  + Eventuellement microservices si le volume justifie
```

### Pourquoi ne pas passer directement en microservices
1. **L'architecture microservices est deja preparee** (services/) mais n'a jamais ete activee — signe que la complexite supplementaire n'est pas justifiee au stade actuel.
2. **Un seul serveur** — pas de benefice de scaling horizontal.
3. **Une seule base MySQL** — pas de separation de donnees entre services.
4. **Equipe reduite** — le cout operationnel de N services (deploy, monitoring, logs, debug) est disproportionne.
5. **Le monolithe fonctionne** — les problemes sont dans les calculs batch (bloquants), pas dans l'API read.
6. **La priorite** est la fiabilite des calculs et la completude des donnees, pas l'architecture.

---

## E. Diagnostic ttyd et proposition ttyd-agent

### Usage actuel de ttyd
- **Statut**: A verifier sur le serveur (process PM2 visible mais non confirme dans cette session)
- **Risque potentiel**: Si ttyd est expose en HTTP sans auth, c'est un shell root ouvert sur internet

### Risques actuels
1. **Acces shell complet** — n'importe qui avec l'URL peut executer n'importe quelle commande
2. **Pas d'authentification native** dans ttyd (sauf --credential)
3. **Exposition des secrets** — .env, mots de passe DB, cles API visibles
4. **Commandes destructrices** — rm -rf, DROP TABLE, pm2 delete, etc.
5. **Pas de journalisation** — aucune trace de qui a fait quoi

### Architecture ttyd-agent recommandee
```
Nginx reverse proxy (HTTPS)
  → /terminal/ (auth required: Basic auth + IP whitelist)
    → ttyd (--port 7681 --interface 127.0.0.1)
      → /usr/local/bin/ttyd-agent-menu.sh (pas /bin/bash)
```

**Script ttyd-agent-menu.sh** (a creer) :
```bash
#!/bin/bash
# Menu controle — pas de shell libre
echo "=== AFRICAFUNDS AGENT ==="
echo "1. PM2 status"
echo "2. Logs API (derniers 100 lignes)"
echo "3. Logs Frontend (derniers 100 lignes)"
echo "4. Logs cron (aujourd'hui)"
echo "5. Etat base de donnees (tables + counts)"
echo "6. Etat forex (dernieres MAJ)"
echo "7. Health check API"
echo "8. Diagnostic fonds sans VL recentes"
echo "9. Relancer classements (avec confirmation)"
echo "0. Quitter"
# Chaque option execute une commande predeterminee, pas de shell libre
```

**Configuration Nginx** :
```nginx
location /terminal/ {
    # IP whitelist
    allow <IP_ADMIN>;
    deny all;
    
    # Auth Basic
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    proxy_pass http://127.0.0.1:7681/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

**Regles de securite** :
- Utilisateur Linux dedie `ttyd-agent` (pas root)
- PATH restreint
- Commandes autorisees : pm2 status/logs/restart, cat logs, mysql read-only, curl health
- Commandes interdites : rm, DROP, TRUNCATE, DELETE, git push, vim .env, passwd
- Journalisation : chaque commande enregistree dans /var/log/ttyd-agent.log
- Protection .env : chmod 600, pas lisible par l'utilisateur ttyd-agent

**Plan de migration sans coupure** :
1. Creer utilisateur ttyd-agent
2. Creer le script menu
3. Configurer Nginx avec auth + IP whitelist
4. Tester en parallele de l'ancien ttyd
5. Basculer quand valide
6. Supprimer l'ancien ttyd

---

## F. Diagnostic ClickHouse

### Etat actuel
- **@clickhouse/client** installe (package.json)
- **3 tables definies** dans clickhouse.js : fund_performance, fund_rankings, market_analytics
- **Sync MySQL→ClickHouse** codee dans clickhouse-sync.js (incremental pour VL, truncate+reload pour rankings)
- **4 routes analytics** codees dans analytics.js (performance, market overview, top rankings, risk metrics)
- **ClickHouse NON INSTALLE** sur le serveur de production → initClickHouse() echoue silencieusement, `clickhouseAvailable = false`, toutes les routes analytics retournent 503

### Ce qui DOIT rester dans MySQL (source de verite transactionnelle)
| Donnee | Raison |
|--------|--------|
| fond_investissements | Reference, CRUD, FK partout |
| users | Auth, sessions, droits |
| societes | Reference, CRUD |
| pays_regulateurs | Reference, rarement modifie |
| devisedechanges | Reference, utilise par les calculs |
| dividendes | Donnee source, peu volumineuse |
| portefeuilles + transactions | Transactionnel, ACID requis |
| tsrhistos | Reference, peu volumineuse |
| actualites | CRUD editeur |
| ref_* (referentiel FundAfrica) | Reference, rarement modifie |
| documents, personnel | CRUD panels |
| apikeys, favorisfonds | CRUD |

### Ce qui PEUT aller dans ClickHouse (donnees analytiques volumineuses)
| Donnee | Volume actuel | Croissance | Interet ClickHouse |
|--------|--------------|------------|---------------------|
| valorisations (VL) | ~700K lignes | +500/jour | Series temporelles, aggregation rapide |
| rendements | ~1.1M lignes | +1200/jour | Calculs glissants, GROUP BY date |
| performences (3 tables) | ~60K lignes | Recalcul quotidien | Historisation par date |
| classementfonds (3 tables) | ~7K lignes | Recalcul quotidien | Historisation par date |
| **classement_historique** (NOUVEAU) | 0 → millions | +N fonds x 3 types/jour | Classements dates, requetes temporelles |
| **performances_historique** (NOUVEAU) | 0 → millions | Idem | Performances datees |
| indice_references | ~25K lignes | +5/jour | Series temporelles |
| logs analytiques | 0 | Variable | Audit, tracing |
| snapshots portefeuille | 0 | Variable | Historisation valorisation |

### Ce qui ne DOIT PAS aller dans ClickHouse
- Donnees transactionnelles (INSERT/UPDATE/DELETE frequents, ACID)
- Donnees de reference peu volumineuses (pays, societes, referentiels)
- Auth, sessions, droits utilisateurs
- Tout ce qui necessite des JOINs complexes avec la base transactionnelle

### Plan d'integration progressif ClickHouse
1. **Phase 0** — Installer ClickHouse sur le serveur, valider la connexion
2. **Phase 1** — Activer le sync VL existant (clickhouse-sync.js fonctionne deja)
3. **Phase 2** — Creer les tables classement_historique et performance_historique
4. **Phase 3** — Basculer les routes analytics existantes (deja codees, retournent 503)
5. **Phase 4** — Ajouter des requetes analytiques complexes (comparaison inter-dates, tendances)
6. **Phase 5** — Dashboard ClickHouse (admin) pour monitoring des recalculs

---

## G. Diagnostic du moteur de recalcul historique

### Etat actuel : AUCUN moteur de recalcul structure
Le systeme actuel fonctionne comme suit :
1. Les crons bash executent des scripts Node.js sequentiellement
2. Chaque script recalcule TOUT (pas incremental, pas selective)
3. Aucun event log metier
4. Aucune table de jobs de recalcul
5. Aucune table de dependances
6. Aucune table d'audit
7. Aucun mecanisme d'invalidation
8. Aucun verrouillage (2 recalculs concurrents possibles)
9. Aucune trace de POURQUOI un recalcul a ete declenche
10. Aucun statut de recalcul consultable

### Probleme fondamental du classement actuel
Le classement actuel prend **MAX(date) par fonds** dans la table `performences` et compare tous les fonds ensemble, MEME si leurs dates de derniere VL sont differentes. Un fonds avec sa derniere VL au 2024-03-21 (UEMOA inactif) est compare a un fonds avec sa VL du 2026-05-20 (Maroc actif). Les performances 3M, 6M, 1A sont calculees sur des periodes calendaires differentes.

**Consequence** : Le classement "3M" du fonds Maroc (mars-mai 2026) est compare au "3M" du fonds UEMOA (dec 2023-mars 2024). C'est financierement incorrect.

### Classement date par date : logique cible

Pour chaque date calendaire D :
1. Identifier les fonds ayant une VL a la date D (ou dans une tolerance de ±2 jours ouvres)
2. Pour chaque horizon (3M, 6M, 1A, 3A, 5A, YTD) :
   a. Verifier que le fonds a aussi une VL a la date D-horizon (±tolerance)
   b. Si oui, calculer la performance = (VL(D) - VL(D-horizon)) / VL(D-horizon)
   c. Si non, le fonds est EXCLU du classement pour cet horizon
3. Classer les fonds eligibles par categorie (nationale, regionale, globale)
4. Stocker le classement (rang, total, quartile) pour cette date D

**Impact volumetrique** :
- ~1200 fonds x ~250 jours ouvres/an x 3 types x 6 horizons = ~5.4M lignes/an dans classement_historique
- Sur 10 ans d'historique : ~54M lignes
- ClickHouse est parfaitement adapte a ce volume (MergeTree, compression colonnaire)

### Evenements metier a tracer (event log)
| Evenement | Impact | Recalculs necessaires |
|-----------|--------|----------------------|
| Ajout VL (import quotidien) | Performances depuis date VL | perf + classements a cette date |
| Correction VL ancienne | TOUT l'historique depuis la date | vl_ajuste + perf + classements + rendements + ratios + graphiques |
| Ajout/correction dividende | TOUT depuis la date du dividende | vl_ajuste + perf + ratios |
| Correction devise/taux FX | Toutes les conversions EUR/USD depuis cette date | value_EUR/USD + vl_ajuste_EUR/USD + perf EUR/USD + classements EUR/USD |
| Changement categorie fonds | Classements depuis la date | classements national + regional + global |
| Fusion fonds / correction ID | Historique complet du fonds | tout |
| Ajout/correction indice | Comparaisons fonds vs benchmark depuis la date | indRef + graphiques base 100 + tracking error |
| Correction pays/societe | Metadata, pas de recalcul | -  |

### Dependances entre donnees (graphe de recalcul)
```
VL brute (valorisations.value)
  → vl_ajuste = value + cumul_dividendes
    → rendements journaliers = (vl_ajuste[t] - vl_ajuste[t-1]) / vl_ajuste[t-1]
      → performances glissantes (3M, 6M, 1A, 3A, 5A, YTD)
        → classements par categorie + date
          → quartiles
      → volatilite, max drawdown
        → Sharpe = (perf - TSR) / volatilite
        → Sortino, Calmar, VAR, tracking error
    → value_EUR = value / taux_EUR_devise(date)
    → value_USD = value / taux_USD_devise(date)
      → vl_ajuste_EUR, vl_ajuste_USD
        → rendements EUR/USD
          → performances EUR/USD
            → classements EUR/USD
        → graphiques base 100 EUR/USD

Dividende
  → cumul_dividendes → vl_ajuste → (meme cascade)

Taux de change (devisedechanges)
  → value_EUR, value_USD → (meme cascade EUR/USD)

Indice de reference (indRef)
  → indRef_EUR, indRef_USD → graphique base 100 → tracking error
```

### Proposition de modele : tables de recalcul

**Table `recalc_events`** (event log metier) :
```sql
CREATE TABLE recalc_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type ENUM('VL_INSERT','VL_UPDATE','VL_DELETE','DIVIDEND_INSERT','DIVIDEND_UPDATE',
    'FX_UPDATE','CATEGORY_CHANGE','INDEX_UPDATE','FUND_MERGE','BENCHMARK_CHANGE','FULL_REBUILD'),
  fond_id INT NULL,
  impact_date DATE NOT NULL,
  description VARCHAR(500),
  triggered_by VARCHAR(100),  -- 'cron_daily', 'admin_manual', 'import_asfim', etc.
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_event_date (impact_date),
  INDEX idx_event_fund (fond_id)
);
```

**Table `recalc_jobs`** (file d'attente de recalcul) :
```sql
CREATE TABLE recalc_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  job_type ENUM('VL_AJUSTE','RENDEMENTS','PERF_LOCALE','PERF_EUR','PERF_USD',
    'CLASSEMENT_LOCAL','CLASSEMENT_EUR','CLASSEMENT_USD','RATIOS','GRAPHIQUES',
    'INDREF','FX_CONVERSION','FULL_REBUILD'),
  fond_id INT NULL,
  date_from DATE NOT NULL,
  date_to DATE NULL,
  status ENUM('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED') DEFAULT 'PENDING',
  priority TINYINT DEFAULT 5,  -- 1=urgent, 5=normal, 9=low
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  error_message TEXT NULL,
  rows_affected INT DEFAULT 0,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_job_status (status),
  INDEX idx_job_fund (fond_id),
  INDEX idx_job_priority (priority, created_at)
);
```

**Table `recalc_dependencies`** (graphe de dependances) :
```sql
CREATE TABLE recalc_dependencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL,  -- 'VL_AJUSTE', 'RENDEMENTS', etc.
  target_type VARCHAR(50) NOT NULL,
  description VARCHAR(200)
);
-- Ex: VL_AJUSTE -> RENDEMENTS -> PERF_LOCALE -> CLASSEMENT_LOCAL
```

**Table `recalc_audit`** (audit complet) :
```sql
CREATE TABLE recalc_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT NOT NULL,
  fond_id INT NULL,
  action VARCHAR(100),
  detail TEXT,
  before_value TEXT NULL,
  after_value TEXT NULL,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_audit_job (job_id),
  INDEX idx_audit_fund (fond_id)
);
```

### Logique de recalcul proposee

1. **Evenement** → INSERT dans `recalc_events`
2. **Propagation** → Pour chaque event, consulter `recalc_dependencies` et creer les `recalc_jobs` necessaires (avec date_from = date d'impact)
3. **Execution** → Le worker-recalculation poll les jobs PENDING par priorite, execute, met a jour le statut
4. **Verrouillage** → Un seul job par fond_id+job_type a la fois (SELECT FOR UPDATE)
5. **Idempotence** → Chaque job peut etre relance sans effet de bord (recalcul complet depuis date_from)
6. **Recalcul incremental** → Si date_from = aujourd'hui, ne recalcule que le jour. Si date_from = ancienne, recalcule depuis cette date.
7. **Recalcul complet** → event_type = FULL_REBUILD : recree tous les jobs pour tous les fonds depuis la date d'impact
8. **Interface admin** → Page de suivi : jobs en cours, echoues, statistiques
9. **Logs** → Chaque etape loguee dans recalc_audit

### Table cible pour classements historiques (ClickHouse)

```sql
-- ClickHouse MergeTree
CREATE TABLE classement_historique (
  date_classement Date,
  fond_id UInt32,
  type_classement UInt8,      -- 1=national, 2=regional, 3=global
  devise Enum8('LOCAL'=1, 'EUR'=2, 'USD'=3),
  categorie String,
  -- Rangs par horizon
  rang_3m Nullable(UInt16),
  total_3m Nullable(UInt16),
  rang_6m Nullable(UInt16),
  total_6m Nullable(UInt16),
  rang_1an Nullable(UInt16),
  total_1an Nullable(UInt16),
  rang_3ans Nullable(UInt16),
  total_3ans Nullable(UInt16),
  rang_5ans Nullable(UInt16),
  total_5ans Nullable(UInt16),
  rang_ytd Nullable(UInt16),
  total_ytd Nullable(UInt16),
  -- Quartiles
  quartile_3m Nullable(UInt8),
  quartile_6m Nullable(UInt8),
  quartile_1an Nullable(UInt8),
  quartile_3ans Nullable(UInt8),
  quartile_5ans Nullable(UInt8),
  quartile_ytd Nullable(UInt8),
  -- Meta
  calculated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(calculated_at)
ORDER BY (date_classement, fond_id, type_classement, devise)
PARTITION BY toYYYYMM(date_classement);
```

**Volume estime** : ~1200 fonds x 250 jours/an x 3 types x 3 devises = ~2.7M lignes/an
Sur 10 ans : ~27M lignes — parfaitement gerable par ClickHouse (<1 Go compresse)

---

## H. Modele cible des donnees

### Couches de donnees
| Couche | Description | Stockage | Exemples |
|--------|-------------|----------|----------|
| **Sources brutes** | Donnees importees sans transformation | MySQL | valorisations.value, dividendes, indice_references |
| **Reference** | Donnees de reference stables | MySQL | fond_investissements, societes, pays_regulateurs, ref_* |
| **Nettoyees** | Sources apres nettoyage (doublons, pics, erreurs) | MySQL (meme table, flags) | valorisations apres fix_vl_cleanup_all |
| **Ajustees** | Donnees avec ajustement financier | MySQL | vl_ajuste, vl_ajuste_EUR, vl_ajuste_USD |
| **Converties** | Donnees en devises alternatives | MySQL | value_EUR, value_USD, indRef_EUR, indRef_USD |
| **Calculees** | Resultats de calculs financiers | MySQL + ClickHouse | rendements, performences, ratios |
| **Classement** | Rankings par categorie | MySQL (courant) + ClickHouse (historique) | classementfonds, classement_historique |
| **Agregees** | Statistiques pays/categorie/societe | ClickHouse | market_analytics, stats par categorie |
| **Portefeuille** | Valorisation portefeuille investisseur | MySQL | portefeuille_base100s, transactions |
| **Audit** | Traces de recalcul | MySQL | recalc_events, recalc_jobs, recalc_audit |
| **Reporting** | Donnees pre-calculees pour exports | ClickHouse | fiches fonds PDF, tableaux Excel |

### Tables a creer (progressivement, apres validation)
| Table | Stockage | Phase | Description |
|-------|----------|-------|-------------|
| recalc_events | MySQL | 4 | Event log metier |
| recalc_jobs | MySQL | 4 | File d'attente recalculs |
| recalc_dependencies | MySQL | 4 | Graphe de dependances |
| recalc_audit | MySQL | 4 | Audit complet |
| classement_historique | ClickHouse | 5 | Classements dates |
| performance_historique | ClickHouse | 5 | Performances datees |
| vl_historique_audit | ClickHouse | 5 | Snapshots VL pour tracking |

---

## I. Risques fonctionnels et techniques

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| 1 | **Casser l'existant** en modifiant les routes ou modeles | Haute | Critique | Approche additive, nouvelles routes, tests avant deploiement |
| 2 | **Doublons de fonds** cross-pays (meme nom, pays different) | Moyenne | Haute | Toujours filtrer par pays dans les requetes |
| 3 | **Mauvais rattachement fonds/categorie** | Moyenne | Haute | Referentiel ref_categories, controles lot 7 |
| 4 | **Historique incoherent** (VL corrigees sans recalcul cascade) | Haute | Critique | Moteur de recalcul avec event log |
| 5 | **Performance degradee** si classements historiques calcules naïvement | Haute | Moyenne | ClickHouse pour stockage, batch processing |
| 6 | **Recalcul incomplet** (oubli d'une etape dans la cascade) | Haute | Haute | Graphe de dependances + jobs automatiques |
| 7 | **Donnees incohérentes** entre MySQL et ClickHouse | Moyenne | Haute | Sync unidirectionnelle MySQL→ClickHouse, MySQL = source de verite |
| 8 | **Dette technique routes_vl.js** (11K lignes) | Certaine | Moyenne | Decoupage progressif en modules, sans casser les routes |
| 9 | **Securite ttyd** (shell ouvert) | Haute | Critique | ttyd-agent securise en priorite |
| 10 | **Microservices prematures** (services/ non utilise) | Faible | Faible | Ne pas activer, documenter comme futur |
| 11 | **Concurrence recalculs** (2 crons simultanes) | Moyenne | Moyenne | Verrouillage dans recalc_jobs |
| 12 | **Agenda.js configure avec MongoDB** | Deja present | Nulle (code mort) | Supprimer ou remplacer par bull/BullMQ+Redis |

---

## J. Plan d'action progressif

### Phase 0 — Audit sans modification (FAIT — ce document)
- [x] Lire et documenter l'etat actuel
- [x] Cartographier l'architecture
- [x] Identifier les risques
- [x] Ne rien casser

### Phase 1 — Stabilisation (1-2 semaines)
- [ ] **1.1** Ajouter endpoint `/health/detailed` (etat DB, tables, derniere VL, dernier classement, ClickHouse status)
- [ ] **1.2** Clarifier wealthtech-api (process PM2 : est-il actif ? utilise ? doublon ?)
- [ ] **1.3** Documenter PM2 : creer fichier `PM2_PROCESSES.md` listant tous les processes
- [ ] **1.4** Securisation minimale ttyd : au minimum auth Basic + IP whitelist via Nginx
- [ ] **1.5** Ajouter monitoring crons : script sentinel qui verifie les logs du jour
- [ ] **1.6** Nettoyer imports morts : `require('node-cron')` dans 13 fichiers routes (jamais utilise)
- [ ] **1.7** Nettoyer agenda.js (configure avec MongoDB, jamais utilise)
- [ ] **1.8** Completer les 11 fonds sans classification

### Phase 2 — Modularisation du monolithe (2-4 semaines)
- [ ] **2.1** Creer couche service : `src/services/` avec logique metier extraite des routes
  - `src/services/performance.service.js` — logique de calcul perf extraite de apigestionsavequotidien.js
  - `src/services/ranking.service.js` — logique classement
  - `src/services/vl.service.js` — logique VL/recalcul extraite de routes_vl.js
  - `src/services/forex.service.js` — logique conversion devise
- [ ] **2.2** Reorganiser scripts : deplacer les 40+ scripts dans `scripts/` avec sous-dossiers (import/, fix/, recalc/, diag/)
- [ ] **2.3** Ajouter premiers tests unitaires sur les services extraits
- [ ] **2.4** Separer routes_vl.js en modules (sans changer les URL de routes)

### Phase 3 — Workers (2-4 semaines)
- [ ] **3.1** Creer `worker-recalculation/` : process PM2 dedie, consume les taches via table recalc_jobs ou BullMQ
- [ ] **3.2** Migrer les calculs batch (saveperfdatemysql, classements, vl_ajuste) vers le worker
- [ ] **3.3** Creer `worker-data-import/` : process PM2 pour imports (ASFIM, Nigeria, forex)
- [ ] **3.4** Migrer les crons bash vers un worker-scheduler Node.js centralise (remplace crontab)
- [ ] **3.5** Creer ttyd-agent securise (script menu + Nginx auth + utilisateur dedie)

### Phase 4 — Moteur de recalcul (4-6 semaines)
- [ ] **4.1** Creer les tables MySQL : recalc_events, recalc_jobs, recalc_dependencies, recalc_audit
- [ ] **4.2** Implementer le graphe de dependances (VL→vl_ajuste→rendements→perf→classements)
- [ ] **4.3** Implementer la propagation : un evenement genere automatiquement les jobs dependants
- [ ] **4.4** Implementer le verrouillage par fond_id+job_type
- [ ] **4.5** Implementer le recalcul incremental (depuis date_from) et complet (FULL_REBUILD)
- [ ] **4.6** Interface admin de suivi des recalculs
- [ ] **4.7** Alertes en cas d'echec de job (email ou notification)

### Phase 5 — ClickHouse + Classements historiques (4-8 semaines)
- [ ] **5.1** Installer ClickHouse sur le serveur de production
- [ ] **5.2** Activer la sync MySQL→ClickHouse existante (clickhouse-sync.js)
- [ ] **5.3** Creer la table classement_historique dans ClickHouse
- [ ] **5.4** Implementer le calcul de classement date par date (logique decrite section G)
- [ ] **5.5** Backfill historique : calculer les classements pour toutes les dates passees
- [ ] **5.6** Modifier l'API : /api/classementquartilemysql retourne le classement A LA DATE du dernier VL du fonds
- [ ] **5.7** Modifier le frontend : afficher la date du classement ("Classement au 20/05/2026")
- [ ] **5.8** Activer les routes analytics ClickHouse (deja codees, retournent 503 actuellement)

### Phase 6 — Services separes eventuels (uniquement si justifie)
- A evaluer apres Phase 5
- Ne creer que si le volume, la performance ou l'equipe le justifient
- auth-service, payment-service, kyc-service : seulement si fonctionnalites ajoutees

---

## K. Backlog actionnable

| ID | Priorite | Action | Objectif | Fichiers | Risque | Complexite | Dependance | Statut | Quand | Validation |
|----|----------|--------|----------|----------|--------|------------|------------|--------|-------|------------|
| K01 | P0 | Securiser ttyd | Empecher shell libre en prod | Nginx, ttyd config | Critique si non fait | Faible | Aucune | A faire | Immediat | Oui |
| K02 | P0 | Clarifier wealthtech-api | Eviter confusion/doublon | pm2 list | Faible | Faible | Aucune | A faire | Immediat | Oui |
| K03 | P1 | Health check detaille | Monitoring proactif | app.js | Nul | Faible | Aucune | A faire | Phase 1 | Non |
| K04 | P1 | Monitoring crons | Detecter echecs cron | Nouveau script | Nul | Faible | Aucune | A faire | Phase 1 | Non |
| K05 | P1 | Nettoyer imports morts (cron) | Proprete code | 13 fichiers routes | Nul | Trivial | Aucune | A faire | Phase 1 | Non |
| K06 | P1 | 11 fonds sans classification | Completude donnees | DB + script | Faible | Faible | Aucune | A faire | Phase 1 | Oui |
| K07 | P2 | Couche service (performance) | Separation logique/route | Nouveau dossier | Faible | Moyenne | Aucune | A faire | Phase 2 | Oui |
| K08 | P2 | Organiser scripts/ | Proprete projet | Renommage fichiers | Nul | Faible | Aucune | A faire | Phase 2 | Non |
| K09 | P2 | Premiers tests unitaires | Confiance recalculs | Nouveau dossier test/ | Nul | Moyenne | K07 | A faire | Phase 2 | Non |
| K10 | P2 | Decouper routes_vl.js | Maintenabilite | routes_vl.js → modules | Moyen | Haute | K07 | A faire | Phase 2 | Oui |
| K11 | P3 | Worker recalculation | Decouplage calculs/API | Nouveau process PM2 | Moyen | Haute | K07 | A faire | Phase 3 | Oui |
| K12 | P3 | Worker data import | Decouplage imports/API | Nouveau process PM2 | Moyen | Haute | K07 | A faire | Phase 3 | Oui |
| K13 | P3 | Worker scheduler | Remplace crontab | Nouveau process PM2 | Moyen | Moyenne | K11, K12 | A faire | Phase 3 | Oui |
| K14 | P3 | ttyd-agent | Terminal securise | Script + Nginx | Faible | Moyenne | K01 | A faire | Phase 3 | Oui |
| K15 | P4 | Tables recalc (events/jobs) | Moteur de recalcul | DB migration | Faible | Moyenne | K11 | A faire | Phase 4 | Oui |
| K16 | P4 | Graphe dependances | Propagation auto | recalc_dependencies | Faible | Haute | K15 | A faire | Phase 4 | Oui |
| K17 | P4 | Interface admin recalcul | Visibilite | Frontend + API | Nul | Moyenne | K15 | A faire | Phase 4 | Non |
| K18 | P5 | Installer ClickHouse | Infrastructure | Serveur | Moyen | Moyenne | Aucune | A faire | Phase 5 | Oui |
| K19 | P5 | Classement historique CH | Classement date/date | ClickHouse + worker | Moyen | Haute | K11, K18 | A faire | Phase 5 | Oui |
| K20 | P5 | Backfill classements historiques | Completude historique | ClickHouse batch | Faible | Haute | K19 | A faire | Phase 5 | Non |
| K21 | P5 | API classement par date VL | Affichage correct | apigestionquartile.js | Moyen | Moyenne | K19 | A faire | Phase 5 | Oui |
| K22 | P5 | Frontend date classement | UX correct | FundView/FundSubView | Faible | Faible | K21 | A faire | Phase 5 | Non |

---

## L. Regles de non-regression

### Pour chaque modification
1. **Avant** : git stash + git status clean
2. **Pendant** : modifier un seul module a la fois
3. **Apres** :
   - `curl https://africafunds.chainsolutions.fr/api/valLiq/1131` → doit retourner HTTP 200 + données
   - `curl https://africafunds.chainsolutions.fr/api/classementquartilemysql/1131` → 3 types OK
   - `curl https://africafunds.chainsolutions.fr/api/valLiqdev/1131/EUR` → HTTP 200
   - `curl https://africafunds.chainsolutions.fr/health` → {"status":"ok"}
   - Build frontend : `npm run build` → 0 erreur
   - PM2 : `pm2 status` → api-monolith online, fundafrique-frontend online
4. **Rollback** : `git stash pop` ou `git revert HEAD` + `pm2 restart`

### Endpoints critiques a verifier
| Endpoint | Attendu |
|----------|---------|
| /api/valLiq/:id | HTTP 200 + nomFonds + VL |
| /api/valLiqdev/:id/EUR | HTTP 200 + graphique EUR |
| /api/valLiqdev/:id/USD | HTTP 200 + graphique USD |
| /api/classementquartilemysql/:id | 3 types non-null |
| /api/classementquartiledev/fond/:id/EUR | 3 types |
| /api/getPaysall | Liste pays + count fonds > 0 |
| /api/getCategories | Categories dynamiques |
| /api/performanceswithdate/fond/:id/:date | Perf locale |
| /api/listeproduitsociete/:id | Fonds par societe |
| /health | {"status":"ok"} |

### Donnees a sauvegarder avant migration
- `mysqldump fond_opcvm > backup_YYYYMMDD.sql` avant toute modification schema
- Exporter `classementfonds` + `performences` avant refonte classement
- Snapshot `PRODUCTION_STATE.json` (sync_production.sh)

---

## M. Conclusion operationnelle

### A faire immediatement
1. **Valider ce diagnostic** avec l'utilisateur avant toute action
2. Securiser ttyd (auth Nginx + IP whitelist = 30 min de travail)
3. Clarifier wealthtech-api (pm2 list sur le serveur)
4. Completer les 11 fonds sans classification

### A NE PAS faire maintenant
- Ne pas activer l'architecture microservices (services/)
- Ne pas installer ClickHouse (Phase 5)
- Ne pas deplacer du code entre fichiers sans tests
- Ne pas modifier les routes API existantes
- Ne pas modifier les tables existantes
- Ne pas supprimer agenda.js/bull/ioredis (code mort inoffensif)
- Ne pas creer de workers tant que la couche service n'est pas extraite

### A preparer
- Schema des tables recalc_events/recalc_jobs (Phase 4)
- Script d'installation ClickHouse (Phase 5)
- Prototype de classement date par date (Phase 5)
- Tests unitaires sur les calculs financiers (Phase 2)

### Decisions techniques a valider
1. **ClickHouse ou MySQL pour classement_historique ?** — Recommandation : ClickHouse (volume, lecture rapide, partitionnement). Si ClickHouse trop complexe a installer, MySQL avec bon indexage suffit pour 1-2 ans.
2. **BullMQ+Redis ou table MySQL pour la file de jobs ?** — Recommandation : table MySQL (plus simple, pas de dependance Redis). BullMQ si besoin de concurrence avancee.
3. **Tolerance de date pour classement** — ±2 jours ouvres ? ±5 jours ? A definir selon les donnees reelles.
4. **Granularite classement historique** — Chaque jour ouvre ? Chaque semaine ? Chaque fin de mois ? Recommandation : chaque jour ouvre (volume gerable).
5. **wealthtech-api** — A garder, fusionner ou supprimer ? Necessite inspection sur le serveur.

### Questions restantes
- ClickHouse est-il installable sur le serveur actuel (RAM, disque) ?
- Quel est le process wealthtech-api exactement ?
- Quelle tolerance de date est acceptable financierement pour les classements ?
- Faut-il un classement historique pour les 10 dernieres annees ou seulement depuis aujourd'hui ?
- Quel budget temps/effort pour la Phase 5 (classements historiques) ?
