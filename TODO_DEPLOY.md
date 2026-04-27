# TODO DEPLOY - OPCVM Platform (Ionos)

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

### Problèmes identifiés
- Pas de `middleware.ts` (routes /panel/* non protégées)
- IDOR : userId passé via URL query param `?id=` au lieu du JWT
- Stores Zustand créés mais jamais importés dans les pages
- Multi-select fonds désactivé dans ajoutportefeuille

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
- [x] **F7** Corriger IDOR — hook `useUserId` + 7 pages portefeuille migrées (home, ajout, reconstitution, profile, favoris, fondsselected, robotadvisor)
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

### BASE DE DONNÉES (Priorité 4)

- [x] **DB22** Script `scripts/init-db.js` (`npm run db:init` / `db:init:alter` / `db:init:force`)

### DÉPLOIEMENT IONOS

- [ ] **D10** Configurer variables d'environnement production (copier `.env.example` → `.env` sur le serveur Ionos)
- [x] **D11** Configurer CORS — gateway lit `ALLOWED_ORIGINS` depuis env + credentials:true
- [ ] **D12** Vérifier connexion BDD production (`npm run db:init` depuis le serveur)
- [x] **D13** Script de démarrage `start.sh` + `ecosystem.config.js` PM2
