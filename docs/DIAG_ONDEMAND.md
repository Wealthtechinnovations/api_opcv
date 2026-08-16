# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-16 07:57 UTC**

```
########## scripts/diag/ondemand/diag_node_runtimes.js ##########

============================================================
 RUNTIMES NODE.JS DISPONIBLES SUR LE SERVEUR
 Genere le 2026-08-16T07:57:32.580Z — LECTURE SEULE
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
   engines        : {}
   next           : ^14.2.3
   script build   : next build

============================================================
 FIN — aucune ecriture, aucune modification de configuration.
============================================================


```
