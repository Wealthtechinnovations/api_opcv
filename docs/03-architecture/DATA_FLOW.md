# DATA_FLOW — AfricaFunds

Flux général : source identifiée → collecte/import → validation/normalisation → persistance → calculs/agrégations → API → frontend/export. À chaque frontière conserver provenance, date, devise/unité, statut de validation et erreurs.

Un fallback ne doit jamais transformer une donnée inconnue en valeur valide silencieusement.