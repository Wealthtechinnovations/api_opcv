# CANONICAL_DATA_DICTIONARY_V1 — AfricaFunds

Ce document indexe le dictionnaire de données sans remplacer modèles/migrations/sources existants. Pour chaque champ gouverné : identifiant, définition, type, unité/devise, nullabilité, source, fréquence, règle de validation, calcul éventuel, consommateurs, sensibilité et version.

Invariants : `null != 0`, `observed != calculated`, `unknown != invented`. Le schéma réel doit être observé avant toute migration.