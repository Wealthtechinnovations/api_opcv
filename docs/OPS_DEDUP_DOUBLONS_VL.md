# Deduplication des VL en doublon — journal des operations

> Genere par `ops-dedup-doublons-vl.yml`. Ne pas modifier a la main.

Derniere execution : **2026-10-29 18:11 UTC**
Mode : **execute**
Index UNIQUE demande : **true**
Declencheur : `workflow_dispatch` — par `Wealthtechinnovations`

```
Commit avant mise a jour : d100c2321 chore(ops): dedup doublons VL — dry-run 2026-10-29 18:09 UTC [skip ci]
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   d100c2321..661466a3f  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating d100c2321..661466a3f
Fast-forward
 docs/OPS_DEDUP_DOUBLONS_VL.md | 79 +++++++++++++++++++++++++++++++++++++------
 1 file changed, 68 insertions(+), 11 deletions(-)
Commit retenu        : 661466a3f chore(ops): dedup doublons VL — execute 2026-10-29 18:10 UTC [skip ci]

==============================================
 1. PERIMETRE (dry-run de controle)
==============================================
=== DOUBLONS DE VL PORTANT ZERO ===
Mode : DRY-RUN (aucune ecriture)
Mesure le 2026-10-29 18:10:56 UTC

0 paire(s) dupliquee(s), fonds reels uniquement.
Rien a faire.


==============================================
 2. SUPPRESSION DES LIGNES A ZERO
==============================================
=== DOUBLONS DE VL PORTANT ZERO ===
Mode : EXECUTION
Mesure le 2026-10-29 18:10:56 UTC

0 paire(s) dupliquee(s), fonds reels uniquement.
Rien a faire.


==============================================
 3. VERIFICATION — le script est idempotent
==============================================
=== DOUBLONS DE VL PORTANT ZERO ===
Mode : DRY-RUN (aucune ecriture)
Mesure le 2026-10-29 18:10:57 UTC

0 paire(s) dupliquee(s), fonds reels uniquement.
Rien a faire.


==============================================
 4. CREATION DE L INDEX UNIQUE (demandee explicitement)
==============================================
Modifie le SCHEMA. Retour arriere :
  DROP INDEX uq_valorisations_fund_date ON valorisations;

=== CREATION DE L INDEX UNIQUE ===
  Aucun doublon restant entre fonds reels. Creation…
  Index `uq_valorisations_fund_date` cree.
  Retour arriere : DROP INDEX `uq_valorisations_fund_date` ON valorisations;
  restent supprimees — ce sont deux gestes independants.

Instantanes disponibles pour rollback :
data/doublons_snapshots/2026-10-29T18-10-05.json
```
