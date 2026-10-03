# AF-INC-20260914-001 — Contrôle production faux-vert

**Statut : CLOSED — SEV1**

## Impact
Une DB morte/API HTTP 500 pendant ~3 h 56 n'a pas rendu le workflow de contrôle rouge. Un second défaut permettait à un snapshot C5 corrompu d'interrompre tous les autres contrôles.

## Root cause — PROVEN
1. `ssh ... | tee` sans `pipefail` masquait le code du contrôle : patch `d58508f0d3e759b0456c1268b5105068221bfbc4`.
2. `JSON.parse` C5 non isolé pouvait aborter toute la mesure : patch `9f051c035e4bf72f919004f5a654ccf015f159ee`.

## Vérification
- codes 0/1/2/3 testés pour la sémantique du workflow ;
- snapshots frais, périmé, vide, tronqué, absent testés ;
- C5 défaillant n'empêche plus C2/C3/C4/C7/C8.

## Prévention
Une mesure impossible est désormais distincte d'une dérive mesurée et doit être bruyante.
