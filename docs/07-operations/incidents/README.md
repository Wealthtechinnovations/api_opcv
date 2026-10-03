# Incidents AfricaFunds

Ce dossier contient les postmortems humains. Le registre machine canonique est `/.governance/incidents/registry.json`.

Règles :
- historique append-only dans le sens ; corriger une erreur par nouvelle preuve, pas par effacement silencieux ;
- aucune valeur de secret ;
- aucune clôture sans preuve ;
- toute action exécutable renvoie à la task queue AfricaFunds existante.
