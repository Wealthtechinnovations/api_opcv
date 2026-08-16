# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-16 08:06 UTC**

```
########## scripts/diag/ondemand/diag_frontend_logs.js ##########

============================================================
 INCIDENT FRONTEND — LOGS PM2
 Genere le 2026-08-16T08:06:00.221Z — LECTURE SEULE
============================================================


## fundafrique-frontend-error.log  (32317.4 Ko, modifie 2026-08-16T08:04:21.114Z)

   ReferenceError: document is not defined
       at /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/.next/server/app/funds/summary-eur/[fondId]/page.js:1:4341
       at v (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/.next/server/app/funds/summary-eur/[fondId]/page.js:1:5287)
       at nj (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:46251)
       at nM (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:47571)
       at nM (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:61546)
       at nN (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:64546)
       at nB (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:67538)
       at nD (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:66680)
       at nN (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:64853)
       at nB (/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:67538) {
     digest: '1313471132'
   }
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.
   You are using Node.js 14.16.0. For Next.js, Node.js version >= v18.17.0 is required.

## fundafrique-frontend-out.log  (12.5 Ko, modifie 2026-08-16T08:04:21.054Z)

   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start
   > demo-app@0.1.0 start
   > next start

## Etat du repertoire de build .next

   BUILD_ID                   present  21 octets  2026-08-16T08:04:03.286Z
   build-manifest.json        present  969 octets  2026-08-16T08:03:55.598Z
   prerender-manifest.json    present  65803 octets  2026-08-16T08:04:12.338Z
   routes-manifest.json       present  41376 octets  2026-08-16T08:03:36.542Z
   server                     present  (repertoire)  2026-08-16T08:04:03.270Z
   static                     present  (repertoire)  2026-08-16T08:03:55.694Z

   BUILD_ID : RtXg6Kf1b86V2m5XduBFx

============================================================
 FIN — aucune ecriture.
============================================================


########## scripts/diag/ondemand/diag_node_runtimes.js ##########

============================================================
 RUNTIMES NODE.JS DISPONIBLES SUR LE SERVEUR
 Genere le 2026-08-16T08:06:00.404Z — LECTURE SEULE
============================================================

## A. Runtime qui execute ce script

   process.version : v14.16.0
   process.execPath: /usr/local/bin/node
   PATH            : /usr/local/sbin  /usr/local/bin  /usr/sbin  /usr/bin  /sbin  /bin  /usr/games  /usr/local/games  /snap/bin

## B. Emplacements standards

   /usr/bin/node                      v12.22.9
   /usr/local/bin/node                v14.16.0
   /opt/node/bin/node                 absent
   /usr/local/n/versions/node         repertoire : 14.16.0

## C. Node livre par Plesk (le chemin /var/www/vhosts indique un Plesk)

   /opt/plesk/node/12/bin/node                    v12.22.12
   /opt/plesk/node/14/bin/node                    v14.21.3
   /opt/plesk/node/16/bin/node                    v16.20.2
   /opt/plesk/node/18/bin/node                    v18.20.8
   /opt/plesk/node/19/bin/node                    v19.9.0
   /opt/plesk/node/20/bin/node                    v20.20.2
   /opt/plesk/node/21/bin/node                    v21.7.3

## D. nvm

   /root/.nvm/versions/node/v16.20.2/bin/node                 non executable
   /root/.nvm/versions/node/v18.18.2/bin/node                 non executable
   /root/.nvm/versions/node/v18.20.8/bin/node                 v18.20.8
   /root/.nvm/versions/node/v20.20.2/bin/node                 v20.20.2
   /root/.nvm/versions/node/v20.9.0/bin/node                  non executable

## E. Avec quel interpreteur PM2 lance-t-il chaque process ?

   (source : le fichier de configuration PM2 du depot, pas le process en cours)

   ecosystem.production.config.js
      process declares : api-monolith
      interpreter      : (non precise — PM2 utilise le node du PATH)
   ecosystem.config.js
      process declares : gateway, auth-service, fund-service, performance-service, portfolio-service, analytics-service, reference-service, notification-service, worker-scheduler, worker-recalculation, worker-data-import, ttyd-agent
      interpreter      : (non precise — PM2 utilise le node du PATH)

## F. Contrainte declaree par le frontend

   name           : demo-app@0.1.0
   engines        : {"node":">=18.17.0"}
   next           : ^14.2.3
   script build   : bash ./scripts/build.sh

============================================================
 FIN — aucune ecriture, aucune modification de configuration.
============================================================


########## scripts/diag/ondemand/diag_pm2_interpreters.js ##########

============================================================
 INTERPRETEURS REELS DES PROCESS PM2
 Genere le 2026-08-16T08:06:00.609Z — LECTURE SEULE
============================================================

## A. Definition enregistree (dump PM2)

   source : /root/.pm2/dump.pm2

   api-monolith            
      script           : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/app.js
      cwd              : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api
      interpreter      : /root/.nvm/versions/node/v18.20.8/bin/node
      node_args        : []
      PATH (node)      : /root/.nvm/versions/node/v18.20.8/bin

   fundafrique-frontend    
      script           : /root/.nvm/versions/node/v18.20.8/bin/npm
      cwd              : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend
      interpreter      : /root/.nvm/versions/node/v18.20.8/bin/node
      node_args        : []
      PATH (node)      : /root/.nvm/versions/node/v18.20.8/bin

   worker-recalculation    
      script           : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/worker-recalculation.js
      cwd              : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api
      interpreter      : node
      node_args        : []
      PATH (node)      : /root/.nvm/versions/node/v18.20.8/bin

   worker-data-import      
      script           : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/worker-data-import.js
      cwd              : /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api
      interpreter      : node
      node_args        : []
      PATH (node)      : /root/.nvm/versions/node/v18.20.8/bin

## B. Binaire reellement execute par les process vivants

   (lecture de /proc/<pid>/exe — la verite du systeme, pas une declaration)

   pid 2100145  exe : /usr/local/bin/node
                cmd : next-server (v

   pid 2707730  exe : /root/.nvm/versions/node/v18.20.8/bin/node -> Node 18.20.8
                cmd : node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/wo

   pid 2707737  exe : /root/.nvm/versions/node/v18.20.8/bin/node -> Node 18.20.8
                cmd : node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/src/workers/wo

   pid 856050   exe : /root/.nvm/versions/node/v18.20.8/bin/node -> Node 18.20.8
                cmd : node /var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api/app.js

## C. Configuration PM2 cote frontend

   ecosystem.config.js              interpreter=(non precise)
   ecosystem.production.config.js   absent
   .nvmrc                           absent
   package.json                     engines={"node":">=18.17.0"}  start=next start

============================================================
 FIN — aucune ecriture, aucun redemarrage.
============================================================


```
