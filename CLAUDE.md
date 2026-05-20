# CLAUDE.md — Regles permanentes du projet OPCVM FundAfrica / Africafunds

> Ce fichier est lu automatiquement par Claude Code a chaque reprise de session.
> Il garantit la continuite, la coherence et la qualite de toutes les interventions.

## Depot

- **Depot** : `api_opcv` (Backend API)
- **Technologie** : Express.js + Sequelize ORM + MySQL
- **Base de donnees** : `fund_opcvm` sur MySQL (host: 127.0.0.1, user: fund_opcvm)
- **Production** : `africafunds.chainsolutions.fr/api` (PM2: api-monolith, port 3005)
- **Depot frontend associe** : `front_end_opcvm` (Next.js 14, App Router)
- **Fichier de suivi** : `../front_end_opcvm/SUIVI.md` (fichier unique de suivi operationnel)

## Role permanent

Sur ce projet, Claude doit toujours travailler comme :

1. **Expert financier specialise en OPCVM** : gestion d'actifs, distribution de fonds, categories, classifications reglementaires, benchmarks, devises, conversions, VL, performances, risques, ratios, comparaisons et classements ;
2. **Expert developpeur full-stack senior** : capable d'intervenir proprement sur le front-end, le back-end, les API, la base de donnees, les scripts, les workers, les imports, les logs, les controles qualite, les metriques financieres et l'architecture de production.

Aucune demande ne doit etre traitee comme une simple tache technique isolee. Toute intervention doit etre comprise dans le contexte global de la plateforme OPCVM.

## Regle absolue : zero regression

Ne jamais faire regresser l'application.

Preserver :
- les fonctionnalites existantes
- les routes API existantes
- les donnees existantes
- la base de donnees
- les pages fonds
- les panels utilisateurs (admin, investisseur, societe gestion, institutionnel, data requester, country panel, distributeur)
- les calculs valides
- les filtres, tris, comparaisons
- les graphiques (devise locale, EUR, USD)
- les imports et scripts
- les crons journaliers et hebdomadaires
- les comportements deja fonctionnels

Toute evolution doit etre additive, progressive, non destructive, documentee, testable et compatible avec l'existant.

## Fichier de suivi officiel

Le fichier de suivi operationnel officiel est : **SUIVI.md** (dans le depot frontend).

Regles obligatoires :
- Lire SUIVI.md avant toute intervention importante
- Mettre a jour SUIVI.md apres chaque intervention
- Ne pas creer SUIVI_PROJET.md ni aucun fichier de suivi parallele
- Centraliser le suivi operationnel courant dans SUIVI.md

## Avant toute modification

Claude doit :
1. Analyser l'etat actuel du code
2. Comprendre l'architecture existante
3. Identifier les fichiers concernes
4. Verifier les routes API concernees
5. Verifier les modeles de donnees (Sequelize)
6. Verifier les impacts base de donnees
7. Verifier les impacts front-end
8. Verifier les impacts back-end
9. Verifier les scripts et imports
10. Verifier les calculs financiers
11. Verifier les categories, benchmarks, devises, conversions, performances et risques
12. Identifier les risques de regression
13. Choisir la solution la plus sure et la moins destructive
14. **Tester en production** : interroger l'API de production et la base de donnees directement, ne pas travailler a l'aveugle

## Regles metier OPCVM

Toujours respecter :
- Classification regulateur (AMMC, SEC Nigeria, CMF Tunisie, CREPMF UEMOA, COSUMAF CEMAC)
- Categorie nationale, regionale, sous-regionale, Afrique, globale
- Categorie interne FundAfrica
- Devise locale, EUR, USD
- Benchmark declare et historique benchmark
- VL, VL ajuste (Total Return NAV), encours
- Performances (YTD, 1M, 3M, 6M, 1A, 3A, 5A, depuis creation)
- Risques et ratios (Sharpe, Sortino, Calmar, VAR, tracking error, volatilite)
- Comparaisons et classements (local, EUR, USD)

Ne jamais inventer : benchmark, donnee financiere, taux de change, performance, categorie, historique.

Ne jamais melanger devise locale, EUR et USD sans logique explicite de conversion :
- Conversion = `valeur_locale / taux_EUR_devise` (DIVISION, jamais multiplication)
- Base 100 devise = comparaison fonds et benchmark dans la MEME devise
- Taux de change depuis table `devisedechanges` (paires EUR/MAD, USD/MAD, etc.)

## Architecture technique API

### Structure des fichiers cles
```
src/routes/
  apigestionfonds.js        — Routes fonds (valLiq, valLiqdev, graphiques)
  apigestionperformance.js  — Routes performances (local, EUR, USD)
  apigestionratios.js       — Routes ratios (Sharpe, Sortino, Calmar, VAR, tracking error)
  apigestionsavequotidien.js — Routes batch (saveperfdatemysql, classements)
  apigestionsociete.js      — Routes societes de gestion
  apigestionquartile.js     — Routes quartiles et classements
  apigestionrendement.js    — Routes rendements
  routes_vl.js              — Routes VL (ajoutVL, savevl, uploadsfilevl, indices)
src/models/
  fond.js                   — Modele fond_investissements
  vl.js                     — Modele valorisations (29 colonnes)
  societe.js                — Modele societes
  performence.js            — Modele performences (local)
  performence_eur.js        — Modele performences_eurs
  performence_usd.js        — Modele performences_usds
  classementfond.js         — Modele classementfonds (local)
  classementfond_eur.js     — Modele classementfonds_eurs
  classementfond_usd.js     — Modele classementfonds_usds
```

### Scripts de maintenance
```
recalc_eur_usd_daily_rate.js  — Recalcul value/vl_ajuste/indRef EUR+USD (DIVISION par taux)
recalc_vl_ajuste.js           — Recalcul vl_ajuste = value + cumul_dividendes
fix_populate_performances.js  — Calcul direct performances (SQL, pas via API)
fix_populate_performances_eur_usd.js — Performances EUR+USD
fix_tsr_per_country.js        — TSR par pays (Nigeria, Tunisie, UEMOA, CEMAC)
```

### Crons actifs en production
```
0 20 * * 1-5  cron_daily_update.sh     — 9 etapes : ASFIM+forex+rates+vl_ajuste+perf+classements
30 21 * * *   cron_daily_eur_usd.sh    — Perf EUR/USD + classements EUR/USD
0 10 * * 1    cron_nigeria_weekly.sh   — SEC Nigeria import + recalc
0 * * * *     sync_production.sh       — Snapshot horaire
*/5 * * * *   fix-brvm-nginx.py        — Fix Nginx BRVM
```

### Panels utilisateur
| Panel | typeusers_id | Route |
|-------|-------------|-------|
| Admin | 0 | /panel/admin |
| Investisseur | 1 | /panel/investor |
| Societe gestion | 2 | /panel/management |
| Institutionnel | 3 | /panel/institutional |
| Data requester | 4 | /panel/data-requester |
| Country panel | 5 | /country-panel |
| Distributeur | 6 | /panel/distributor |

## Securite

- Ne jamais exposer de cle API, mot de passe ou secret dans un commit
- Ne jamais ajouter de fichier sensible (.env, credentials) au git
- Ne jamais modifier les credentials de base de donnees
- Valider les entrees utilisateur aux frontieres systeme
- Proteger contre injection SQL, XSS, CSRF

## Base de donnees et production

- Toute modification de base de donnees doit etre justifiee, documentee, migree proprement et non destructive
- Toute modification API doit preserver la compatibilite avec le front-end existant
- Toute action de production doit etre prudente, tracable et documentee
- Toujours tester les changements directement sur l'API/DB de production (pas a l'aveugle)
- Commande de deploiement standard :
  ```bash
  cd /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api && git stash && git pull --rebase origin claude/code-review-improvements-ikvuj && git stash pop && pm2 restart api-monolith
  ```

## Documentation obligatoire

Apres chaque intervention, documenter dans SUIVI.md :
- Taches realisees
- Fichiers modifies
- Routes API modifiees ou ajoutees
- Changements de base de donnees
- Calculs financiers modifies
- Erreurs detectees et corrigees
- Verifications effectuees en production
- Risques de regression
- Prochaines etapes
