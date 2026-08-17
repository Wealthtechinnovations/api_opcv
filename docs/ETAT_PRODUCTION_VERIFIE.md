# Etat de production verifie automatiquement

> **Fichier genere par le workflow `doc-drift.yml`. Ne pas modifier a la main.**
> Il contient l'etat de la production **mesure**, pas l'etat **affirme** par la
> documentation. En cas de contradiction avec un autre .md, c'est ce fichier qui
> fait foi : les autres decrivent ce qu'on croyait vrai a leur date de redaction.

Derniere verification : **2026-08-17 18:27 UTC**

```
Erreur fatale : Unexpected end of JSON input
```

## Comment lire ce rapport

- `OK` : l'invariant tient.
- `ECHEC` : contradiction **critique** entre la production et ce qui est documente.
  Corriger l'un ou l'autre, puis consigner dans `SUIVI.md` > POINT DE REPRISE COURANT.
- `ALERTE` : ecart connu et tolere (CEMAC sans pipeline, Nigeria tributaire du
  rythme de publication de la SEC). A surveiller, pas a corriger dans l'urgence.

Detail des controles et seuils : `scripts/diag/check_doc_drift.js`.
