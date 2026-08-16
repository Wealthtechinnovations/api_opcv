# Diagnostics a la demande — sortie de production

> Genere par `doc-drift.yml` a partir des scripts presents dans
> `scripts/diag/ondemand/`. **Lecture seule** : ces scripts n executent que des SELECT.
> Ne pas modifier a la main.

Derniere execution : **2026-08-16 08:27 UTC**

```
########## scripts/diag/ondemand/diag_preflight_contrat.js ##########

============================================================
 PRE-VOL DU CONTRAT D ECRITURE (avant le cron Nigeria)
 Genere le 2026-08-16T08:27:36.997Z — LECTURE SEULE
============================================================

## Contexte

   Node du serveur : v14.16.0

## A. Chargement et comportement du contrat

   [OK   ] module vl_contract charge
   [OK   ] mesure conforme acceptee
   [OK   ] NGN sur fonds USD refuse (le cas #73)
   [OK   ] devise absente non bloquante en mode warn
   [OK   ] aucune devise inventee
   [OK   ] fonds sans devise declaree ne bloque pas
   [OK   ] identifiant de lot horodate

## B. Validite syntaxique sur le Node du serveur

   [OK   ] scripts/import/import_vl_nigeria_sec.js
   [OK   ] src/lib/vl_contract.js

## C. Colonnes de l INSERT confrontees au schema reel

   [OK   ] 35 colonnes declarees dans l INSERT  — attendu 35, trouve 35
   [OK   ] toutes les colonnes existent en base  — 35 verifiees
   [OK   ] les 7 colonnes du contrat sont dans l INSERT
   [OK   ] tuples VALUES a 35 valeurs  — 2 tuple(s) conforme(s) sur 3 candidat(s)

## D. Lecture de la devise de reference

   [OK   ] devise du fonds 1141 lisible  — dev_libelle = NGN

   Simulation sur le fonds 1141 tel qu il est EN BASE :
      mesure NGN + fonds NGN -> ACCEPTEE (OK)
      NOTE : le referentiel dit encore NGN pour ce fonds dollar.
      Tant que l etape 0 n est pas faite, le contrat ne peut pas
      detecter la contradiction sur ce fonds. C est attendu.

============================================================
 PRE-VOL OK — le cron du lundi peut tourner sans risque nouveau.
============================================================


```
