# OPEN_QUESTIONS — AfricaFunds API

Ce registre contient uniquement les inconnues réelles ; il ne remplace ni décisions ni TODO.

## Ouvert

- La certification path-by-path de tous les Markdown courants doit atteindre 100 % avant `ALL_MARKDOWN_EXPLOITED = CERTIFIED`.
- La reprise multi-agent et le fallback bridge-down doivent être prouvés par tests déterministes avant toute certification finale.

- Les protections/rulesets GitHub de la branche canonique doivent être rapprochés du modèle cible avant enforcement.
- Les artefacts runtime API non suivis doivent conserver leur classification/préservation selon GOV-006 ; toute entrée `UNKNOWN` reste à investiguer.
- Les chemins optionnels Regulatory Plus doivent rester `CONDITIONAL` tant que leur applicabilité AfricaFunds n’est pas prouvée.

Toute réponse structurante doit être persistée dans une décision/ADR puis retirée de cette section par une nouvelle entrée historique, sans réécrire les décisions passées.

## 2026-09-11 — questions/gaps de certification finale

- S2 host key OOB : aucune empreinte historique indépendante trouvée dans les deux repos ; le candidat issu du bootstrap peut être épinglé en TOFU pour continuer, mais doit rester marqué `PENDING_OOB_VERIFICATION`.
- GitHub native rulesets : aucun ruleset observé et aucune action admin de création disponible dans le connecteur GitHub actuel.
- Secrets suivis : remédiation runtime/rotation reste SECURITY_GATE et ne peut pas être résolue par simple modification documentaire.


## 2026-09-12 — gaps externes après remédiation interne

- `EMAIL_PASSWORD` : le secret historique doit être révoqué/rotaté côté fournisseur SMTP ; aucun connecteur fournisseur compatible n'est disponible dans la session. Ne jamais remplacer la valeur runtime avant émission d'un nouveau credential valide.
- `MAGIC_SECRET_KEY` : rotation requise dans la console/API administrateur Magic ; aucun connecteur d'administration Magic disponible. Ne jamais blanker la clé runtime.
- clé hôte S2 : pin TOFU immuable et StrictHostKeyChecking fonctionnent ; vérification OOB indépendante reste souhaitée.
- GitHub rulesets : liste vide dans les deux repos ; la surface connector actuelle n'expose pas la création de ruleset/protection native.
