# AFRICAFUNDS — CORRECTIONS & AMÉLIORATIONS
> Fichier de suivi généré le 30 avril 2026  
> Serveur : 217.160.249.254 | Domaine : africafunds.chainsolutions.fr

---

## STATUT GLOBAL

| Composant | Statut |
|-----------|--------|
| API (Express) — port 3005 | ✅ Online |
| Frontend (Next.js) — port 3000 | ✅ Online |
| Base de données MySQL | ✅ Online (1011 fonds) |
| Nginx / Plesk | ✅ Configuré |
| ClickHouse | ❌ Non installé |
| Email (Gmail SMTP) | ❌ Credentials invalides |

---

## 1. BASE DE DONNÉES

### 1.1 Colonnes manquantes dans `fond_investissements`
- **Problème** : Le modèle Sequelize définit des colonnes (`classification`, `type_investissement`, `pays`, `region`, `periodicite`, `structure_fond`, `categorie_globale`, `categorie_national`, `categorie_regional`, `affectation`, `description`, `strategie_politique_invest`, `philosophie_fond`, `horizonplacement`, `date_agrement`, `active`, `depositaire`, `teneur_registre`, `valorisateur`, `centralisateur`, `agent_transfert`, `agent_payeur`, `delai_reglement`, `souscripteur`, `regulateur`, `pays_one`, `dividende`, `nombre_part`, `banque`, `IBAN`, `RIB`) qui n'existent pas encore dans la DB.
- **Conséquence** : La route `/api/listeopcvm` échoue (SequelizeDatabaseError).
- **FIX** :
```bash
# Activer temporairement
sed dans /api/.env : DB_SYNC_ALTER=false → DB_SYNC_ALTER=true
pm2 restart api-monolith
# Attendre 10s le temps que Sequelize ajoute les colonnes
# Désactiver
sed dans /api/.env : DB_SYNC_ALTER=true → DB_SYNC_ALTER=false
pm2 restart api-monolith
```
- **Statut** : 🔄 En cours

### 1.2 Types de colonnes incompatibles
- **Problème** : `frais_gestion`, `frais_entree`, `frais_sortie`, `frais_souscription`, `frais_rachat`, `minimum_investissement` sont `VARCHAR` en DB mais `DOUBLE` dans le modèle.
- **Conséquence** : Conversion silencieuse (peut perdre données non-numériques).
- **FIX** : Adapter le modèle Sequelize en `DataTypes.STRING` pour ces champs, ou nettoyer les données et migrer en DOUBLE.
- **Statut** : ⏳ À faire

### 1.3 `date_cloture` type mismatch
- **Problème** : `date_cloture` est `VARCHAR(255)` en DB mais `DATEONLY` dans le modèle.
- **FIX** : Changer dans le modèle : `DataTypes.DATEONLY` → `DataTypes.STRING`.
- **Statut** : ⏳ À faire

---

## 2. API (Express.js)

### 2.1 CORS — requêtes server-side bloquées
- **Problème** : Les appels Next.js SSR (sans Origin header) étaient bloqués en production.
- **FIX appliqué** :
```javascript
// app.js ligne 54
// AVANT : if (!origin && process.env.NODE_ENV !== 'production')
// APRÈS :
if (!origin)
```
- **Statut** : ✅ Corrigé

### 2.2 Authentification sur routes publiques
- **Problème** : Des routes publiques (liste des fonds, données de référence) ont le middleware `authenticate` qui exige un JWT valide, bloquant les visiteurs non connectés.
- **FIX** : Retirer `authenticate` des routes de consultation publique.
- **CMD diagnostic** :
```bash
grep -rn "authenticate" /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/routes/
```
- **Statut** : ⏳ À faire

### 2.3 Mot de passe dans l'URL (sécurité critique)
- **Problème** : `GET /api/userlogin?email=xxx&password=xxx` — le mot de passe est visible dans les logs et l'historique du navigateur.
- **FIX** : Passer en `POST /api/userlogin` avec body JSON `{ email, password }`.
- **Statut** : ⏳ À faire

### 2.4 Email Gmail — credentials invalides
- **Problème** : `535 5.7.8 Username and Password not accepted` — Gmail bloque les mots de passe directs.
- **FIX** : Créer un "App Password" Google :
  1. Compte Google → Sécurité → Validation en 2 étapes (activer)
  2. Sécurité → Mots de passe des applications → Générer
  3. Mettre à jour dans `/api/.env` : `EMAIL_PASSWORD=<app_password_16_chars>`
- **Statut** : ⏳ À faire

### 2.5 Route `/api/auth/_log` → 404
- **Problème** : NextAuth.js envoie des logs internes à `/api/auth/_log` qui allait vers Express (404).
- **FIX appliqué** : Nginx route `/api/auth/` → Next.js (port 3000).
- **Fichier** : `/var/www/vhosts/system/africafunds.chainsolutions.fr/conf/vhost_nginx.conf`
- **Statut** : ✅ Corrigé

### 2.6 Routing Nginx `/api/auth/`
- **Problème** : Toutes les routes `/api/` allaient vers Express, y compris les routes NextAuth.
- **FIX appliqué** : Bloc `location /api/auth/` ajouté avant `location /api/` dans vhost_nginx.conf.
- **Statut** : ✅ Corrigé

---

## 3. FRONTEND (Next.js)

### 3.1 NEXTAUTH_SECRET
- **Problème** : `.env.production` avait un placeholder.
- **FIX appliqué** : Secret généré et mis dans `.env.local` et `.env.production`.
- **Statut** : ✅ Corrigé

### 3.2 Google OAuth — non configuré
- **Problème** : `GOOGLE_CLIENT_ID=CHANGER_GOOGLE_CLIENT_ID` — Google OAuth non fonctionnel.
- **FIX** : Créer les credentials sur https://console.cloud.google.com/apis/credentials
  - Type : "OAuth 2.0 Client ID" → Application web
  - URI de redirection : `https://africafunds.chainsolutions.fr/api/auth/callback/google`
  - Mettre à jour `.env.local` avec les vraies valeurs
- **Statut** : ⏳ À faire (optionnel si Google OAuth pas nécessaire)

### 3.3 Magic.link — clé configurée
- `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_F1AB148D6AA92662` ✅
- **Statut** : ✅ OK

---

## 4. NGINX / INFRASTRUCTURE

### 4.1 Architecture de routing
```
Browser → Nginx:443
  ├── /api/auth/  → Next.js:3000  (NextAuth) ✅
  ├── /api/       → Express:3005  (API) ✅
  ├── /_next/     → Next.js:3000  ✅
  ├── /uploads/   → Express:3005  ✅
  └── /           → Apache:7081 → Next.js:3000 ✅
```

### 4.2 HTTP → HTTPS redirect
- Nginx redirige 80 → 443 ✅
- SSL via Plesk (certificat Let's Encrypt) ✅

---

## 5. CLICKHOUSE (Analytics)

### 5.1 Non installé
- **Statut actuel** : L'API détecte l'absence de ClickHouse et désactive les analytics (mode dégradé gracieux).
- **FIX optionnel** : Installer ClickHouse pour activer les analytics avancées.
```bash
# Installation ClickHouse
curl https://clickhouse.com/ | sh
sudo ./clickhouse install
sudo systemctl start clickhouse-server
# Puis créer la DB :
clickhouse-client --query "CREATE DATABASE fund_analytics"
# Puis redémarrer l'API avec CLICKHOUSE_PASSWORD configuré
```
- **Statut** : ⏳ Optionnel (non bloquant)

---

## 6. SÉCURITÉ & HARDENING

### 6.1 Clés d'API (x-api-key)
- Des routes utilisent un middleware de vérification de clé API.
- **Pour le développement** : Retirer ou bypass ce middleware pour faciliter les tests.
- **CMD** :
```bash
grep -rn "x-api-key\|apikey\|api_key\|apigestionapikey" /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/routes/
```
- **Statut** : ⏳ À investiguer

### 6.2 JWT_SECRET
- Clé JWT de 128 caractères hex configurée dans `.env` ✅
- **Statut** : ✅ OK

---

## 7. PM2 — PROCESSUS EN COURS

| ID | Nom | Port | Statut |
|----|-----|------|--------|
| 7 | api-monolith | 3005 | ✅ Online |
| 8 | fundafrique-frontend | 3000 | ✅ Online |
| 9 | ttyd | 7681 | ✅ Online |
| 0 | wealthtech-api (iso20022) | 5000 | ✅ Online (autre projet) |

---

## 8. ORDRE DE PRIORITÉ DES CORRECTIONS

1. 🔴 **CRITIQUE** : Colonnes manquantes DB → `/api/listeopcvm` cassée (données fonds invisibles)
2. 🔴 **CRITIQUE** : Clés API qui bloquent les requêtes → pages sans données
3. 🟡 **IMPORTANT** : Email Gmail → inscription sans confirmation email
4. 🟡 **IMPORTANT** : Types de colonnes (VARCHAR vs DOUBLE) → risque corruption
5. 🟢 **NORMAL** : Google OAuth → optionnel selon besoin
6. 🟢 **NORMAL** : Mot de passe dans URL → sécurité à terme
7. 🔵 **OPTIONNEL** : ClickHouse → analytics avancées

---

## COMMANDES UTILES

```bash
# Voir tous les processus
pm2 status

# Logs API en temps réel
pm2 logs api-monolith --lines 0

# Logs Frontend en temps réel  
pm2 logs 8 --lines 0

# Tester l'API
curl -s http://localhost:3005/health
curl -s http://localhost:3005/api/searchFunds?q=test

# Redémarrer tout
pm2 restart all

# Base de données
mysql -u fund_opcvm -p'66G41zes~' fund_opcvm
```
