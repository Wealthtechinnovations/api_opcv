# Deduplication des VL en doublon — journal des operations

> Genere par `ops-dedup-doublons-vl.yml`. Ne pas modifier a la main.

Derniere execution : **2026-10-29 18:09 UTC**
Mode : **dry-run**
Index UNIQUE demande : ****
Declencheur : `push` — par `Wealthtechinnovations`

```
Commit avant mise a jour : 4afd7f569 chore(governance): certify all current Markdown [skip ci]
From https://github.com/Wealthtechinnovations/api_opcv
 * branch                claude/code-review-improvements-ikvuj -> FETCH_HEAD
   4afd7f569..ec5674ac4  claude/code-review-improvements-ikvuj -> origin/claude/code-review-improvements-ikvuj
Updating 4afd7f569..ec5674ac4
Fast-forward
 .github/workflows/ops-dedup-doublons-vl.yml  | 283 +++++++++++
 .governance/knowledge/markdown-registry.json |  16 +-
 docs/DIAG_ONDEMAND.md                        | 684 +++++++++++++--------------
 docs/ETAT_PRODUCTION_VERIFIE.md              |  48 +-
 scripts/fix/fix_doublons_vl.js               |  54 +++
 src/routes/apigestionapikey.js               |  17 +-
 src/routes/routes_vl_admin.js                |   9 +-
 7 files changed, 735 insertions(+), 376 deletions(-)
 create mode 100644 .github/workflows/ops-dedup-doublons-vl.yml
Commit retenu        : ec5674ac4 feat(ops): workflow gouverne pour V2 — dedup des 19 doublons puis index UNIQUE

==============================================
 1. PERIMETRE (dry-run de controle)
==============================================
=== DOUBLONS DE VL PORTANT ZERO ===
Mode : DRY-RUN (aucune ecriture)
Mesure le 2026-10-29 18:09:02 UTC

19 paire(s) dupliquee(s), fonds reels uniquement.

--- A SUPPRIMER : 19 ligne(s) a zero ---
         id  fonds date         garde l id   valeur gardee
    3175143   1552 2024-10-01      3243394       827269.72
    3183726   2596 2022-12-23      3204335         7029.13
    3183723   2597 2022-07-14      3196676         1791.27
    3183727   2597 2022-08-11      3196694         1803.09
    3183725   2597 2022-10-20      3196707         1808.37
    3183720   2597 2022-11-03      3196714         1814.39
    3183722   2597 2022-11-24      3196645         1767.87
    3183721   2597 2022-12-15      3196670         1785.13
    3183718   2597 2023-01-26      3196664         1780.54
    3183713   2597 2023-02-09      3196669         1784.87
    3183729   2597 2023-03-09      3196710         1811.63
    3183715   2597 2023-03-16      3196715         1815.72
    3183730   2597 2023-03-23      3196713         1813.07
    3183717   2597 2023-04-20      3196682         1797.94
    3183728   2597 2023-05-25      3196709         1809.03
    3183716   2597 2023-08-31      3196826         1855.44
    3183719   2597 2023-09-07      3196880         1863.16
    3183712   2601 2024-07-03      3185869         1113.88
    3183724   2615 2022-09-19      3190776        125433.6

--- APRES CE NETTOYAGE, L INDEX UNIQUE SERAIT-IL CREABLE ? ---
  OUI : plus aucune paire en double entre fonds reels.
  MySQL autorisant plusieurs NULL dans un index UNIQUE, les 18 087 lignes
  a `fund_id = NULL` ne le bloquent pas.
  Migration : ALTER TABLE valorisations
    ADD UNIQUE INDEX uq_valorisations_fund_date (fund_id, date);
  Retour arriere : DROP INDEX uq_valorisations_fund_date ON valorisations;

DRY-RUN — aucune ecriture. Relancer avec --execute pour appliquer.


Mode dry-run — aucune ecriture. Fin.
```
