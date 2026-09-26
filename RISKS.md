# RISKS — AfricaFunds API

## Risques gouvernance

- divergence entre deux dépôts ;
- documentation plus récente mais non déployée sur S2 ;
- double source de vérité documentaire ;
- agent travaillant sur un HEAD périmé ;
- suppression d’un artefact runtime non classifié.

## Risques métier/data

- données manquantes transformées en zéro ;
- conventions de calcul modifiées silencieusement ;
- source secondaire traitée comme primaire ;
- migration ou cron affectant des données au-delà du scope.

Chaque risque matérialisé doit être relié à une preuve, une décision ou une action de mitigation.