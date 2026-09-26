# TODO DEPLOY - OPCVM Platform (Ionos)

> ## DOCUMENT PERIME — NE PAS UTILISER COMME ETAT COURANT
> Ce fichier decrit une bascule vers une architecture microservices (gateway, 8 process PM2).
> **La production tourne en monolithe** (`api-monolith`, `ecosystem.production.config.js`) ;
> `ecosystem.config.js` et `start.sh` ne sont pas utilises. Les 7 services `services/*/routes.js`
> sont des stubs, et #9 tranche : documenter comme roadmap, **ne pas activer**.
> Non coches et encore valables : D10 (variables d'env production), D12 (verifier la connexion BDD).
> **Etat courant : `../front_end_opcvm/SUIVI.md` > BACKLOG CONSOLIDE UNIQUE.**


> Fichier de suivi persistant. Après chaque tâche, cocher [x], commit et push.
> Pour reprendre : lire ce fichier, attaquer la première tâche non cochée.

---

## État des lieux - API (`api_opcv`)

### Services (7 + gateway + shared)

| Service | index.js | routes.js | État |
|---|---|---|---|
| gateway | ✅ | serviceRegistry.js ✅ | Fonctionnel |
| auth | ✅ | ✅ (11 routes) | Stubs TODO |
| funds | ✅ | ✅ (32 routes) | Stubs TODO - créé cette session |
| performance | ✅ | ✅ (9 routes) | Stubs TODO |
| portfolio | ✅ | ✅ (24 routes) | Stubs TODO - créé cette session |
| analytics | ✅ | ✅ (14 routes) | Stubs TODO |
| reference | ✅ | ✅ (17 routes) | Stubs TODO |
| notification | ✅ | ✅ (12 routes) | Stubs TODO |
| shared | db.js ✅ middleware.js ✅ utils.js ✅ cache.js ✅ | — | Complet |

### Commits cette session (branche `claude/code-review-improvements-ikvuj`)
- `9fda952` feat: complete fund route stubs and clean ghost routes from gateway
- `906bc92` feat: add 7 more fund route stubs (search, charge, data)
- `e3e7b2f` feat: add funds service routes.js with auth-protected stubs
- `d3665ec` feat: add analytics service routes
- `6220f0d` feat: complete performance service routes

### Fichiers clés
- `app.js` — monolithe original (~11,375 lignes dans routes_vl.js, 113 endpoints)
- `package.json` — ✅ scripts microservices ajoutés, main → gateway
- `.env.example` — ✅ ports/URLs microservices ajoutés
- `ecosystem.config.js` — ✅ créé (8 services PM2)
- `start.sh` — ✅ script de démarrage PM2

---

## État des lieux - Frontend (`front_end_opcvm`)

### Stores Zustand (créés mais non importés dans les pages)
- `useAuthStore.ts` — auth state
- `usePortfolioStore.ts` — ✅ corrigé (endpoints + auth headers)
- `useFavoritesStore.ts` — favoris
- `useUIStore.ts` — UI state
- `index.ts` — barrel export

### Panels (3)
- **Admin** : 16 pages (login, home, fonds, frais, anomalies, users, profile, API)
- **Portefeuille (User)** : 38 pages (login, home, KYC, questionnaires, robot advisor, reconstitution, favoris)
- **Société de gestion** : 22 pages (login, home, fonds, documents, personnel, reporting, anomalies, chat)

### Commits cette session (branche `claude/code-review-improvements-ikvuj`)
- `baab72c` fix: auth header, error display and loading state on portfolio creation
- `b4f72f3` fix: align portfolio store with real API endpoints and add auth

### Problèmes identifiés (tous résolus)
- ~~Pas de `middleware.ts`~~ → ✅ Créé avec protection routes /panel/* + vérification JWT
- ~~IDOR : userId passé via URL query param `?id=`~~ → ✅ Corrigé sur TOUTES les pages (portefeuille, admin, societegestion, payspanel, questionnaire, pages publiques)
- ~~Stores Zustand jamais importés~~ → ✅ usePortfolioStore intégré dans home portefeuille
- ~~Multi-select fonds désactivé~~ → ✅ Réactivé dans ajoutportefeuille
- ~~Magic SDK dependency~~ → ✅ Supprimé de tous les fichiers (magic.js, callback, login, payspanel, societegestion)
- ~~next/router imports~~ → ✅ Tous migrés vers next/navigation
- ~~Dead code (testpanel, api/login.js)~~ → ✅ Supprimé
- ~~Hardcoded credentials ClickHouse/MySQL~~ → ✅ Migrés vers variables d'environnement
- ~~console.log excessifs~~ → ✅ ~600 supprimés

---

## Checklist de déploiement

### BLOQUANTS CRITIQUES

- [x] **B1** Créer `services/portfolio/routes.js` (24 routes stubs)
- [x] **B2** Ajouter scripts npm microservices dans `package.json`

### IMPORTANTS

- [x] **I3** Ajouter ports/URLs microservices dans `.env.example`
- [x] **I4** Créer `ecosystem.config.js` (PM2)
- [x] **I5** Décider monolithe vs microservices — `main` pointe vers gateway, `app.js` conservé comme fallback, PM2 lance les 8 services

### FRONTEND

- [x] **F6** Créer `src/middleware.ts` (protection routes /panel/*) + sync cookies dans les 3 login pages
- [x] **F7** Corriger IDOR — hook `useUserId` + toutes les 46 pages portefeuille migrées (home, ajout, reconstitution sub-pages, KYC x9, questionnaire x19, robotadvisor sub-pages x3, profile, favoris, fondsselected, sidebar)
- [x] **F8** Migrer home portefeuille vers `usePortfolioStore` (fetchPortfolios + portfolios array)
- [x] **F9** Réactiver multi-select fonds dans ajoutportefeuille (fetch `/api/recherchefonds`, Select react-select)

### SÉCURITÉ (Priorité 1)

- [x] **S14** Ajouter `typeusers_id` au JWT
- [x] **S15** Activer `authorize()` sur routes admin (activate-user, getusersbyadmin)
- [x] **S16** Activer `authorize('admin', 'socGest')` sur routes fonds write + uploads
- [x] **S17** Activer `authorize()` sur routes notification (actualite, personnel)
- [x] **S18** Frontend middleware: vérification du type d'utilisateur via JWT decoded
- [x] **S19** Login pages: stocker le JWT en cookie pour le middleware

### QUALITÉ FRONTEND (Priorité 2-3)

- [x] **Q20** Intégrer `PageHeader` + `LoadingSpinner` dans pages panel (home portefeuille + home admin)
- [x] **Q21** Créer `error.tsx` + `loading.tsx` + `not-found.tsx` (global + panel)
- [x] **Q23** Nettoyer imports morts (next-auth signIn/useSession)
- [x] **Q24** Fix logout (clear tokenEnCours + cookies)
- [x] **Q25** Google OAuth via NextAuth (bouton + API route + SessionProvider)
- [x] **Q26** Supprimer pages/api obsolète (remplacé par app/api)
- [x] **Q27** Supprimer magic-sdk des pages portefeuille (sidebar, home, profile, ajout, robotadvisor sub-pages)
- [x] **Q28** Remplacer sidebars inline par composant Sidebar partagé (robotadvisor/ajoutsimulation, portefeuillerobot, roboadvisor)
- [x] **Q29** Corriger IDOR — toutes les pages société de gestion (22 pages) + sidebar
- [x] **Q30** Corriger IDOR — toutes les pages admin (15 pages) + sidebar
- [x] **Q31** Supprimer magic-sdk de TOUTES les pages restantes (auth/login, payspanel login/pagehome/actualite, societegestion forgot/reset-password, callback)
- [x] **Q32** Corriger IDOR — toutes les pages payspanel (10 pages + 2 detailsfond + 2 updatefond)
- [x] **Q33** Corriger IDOR — toutes les pages questionnaire (21 pages)
- [x] **Q34** Corriger IDOR — toutes les pages publiques (Opcvm, pays, Fundmanager, Outils, accueil, contact, Header, Headermenu)
- [x] **Q35** Migrer tous next/router imports vers next/navigation
- [x] **Q36** Supprimer dead code : testpanel, magic.js, api/login.js, next.config.js test rewrite
- [x] **Q37** Supprimer ~600 console.log + dead next/head imports
- [x] **Q38** Convertir auth/login de Magic Link vers email/password standard

### SÉCURITÉ API (Priorité 1)

- [x] **SA39** Migrer credentials ClickHouse hardcodés vers .env (apigestionsavequotidien.js, migrate.js)
- [x] **SA40** Migrer credentials MySQL hardcodés vers .env (agenda.js, migrate.js)
- [x] **SA41** Ajouter ClickHouse config à .env.example
- [x] **SA42** Ajouter warning JWT_SECRET manquant dans middleware

### BASE DE DONNÉES (Priorité 4)

- [x] **DB22** Script `scripts/init-db.js` (`npm run db:init` / `db:init:alter` / `db:init:force`)

### DÉPLOIEMENT IONOS

- [ ] **D10** Configurer variables d'environnement production (copier `.env.example` → `.env` sur le serveur Ionos)
- [x] **D11** Configurer CORS — gateway lit `ALLOWED_ORIGINS` depuis env + credentials:true
- [ ] **D12** Vérifier connexion BDD production (`npm run db:init` depuis le serveur)
- [x] **D13** Script de démarrage `start.sh` + `ecosystem.config.js` PM2
