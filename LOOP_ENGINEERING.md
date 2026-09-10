# LOOP_ENGINEERING - FundAfrica

> Statut : `APPLICABLE`
> Portee : `Wealthtechinnovations/api_opcv` + `Wealthtechinnovations/front_end_opcvm`.
> Nature : methode d'execution commune a tous les humains, agents IA et automatisations. Ce document complete sans remplacer `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md`, `DIRECTIVE_TRAVAIL.md`, `CLAUDE.md` et le `SUIVI.md` canonique.

## 1. Etat canonique

FundAfrica est un seul produit reparti sur deux depots. L'etat courant est un tuple, jamais un SHA isole :

```text
FUND_STATE = (
  API_HEAD,
  FRONTEND_HEAD,
  SUIVI_CHECKPOINT,
  PRODUCTION_ATTESTATION
)
```

Branches canoniques actuelles dans les deux depots : `claude/code-review-improvements-ikvuj`. Le prefixe `claude/` est historique et ne confere aucune propriete exclusive a Claude.

## 2. Contrat de boucle

Toute boucle possede obligatoirement :

- **TRIGGER** : raison verifiable d'ouverture ;
- **SCOPE** : une tache ou Integration Slot borne ;
- **ACTION** : plus petit changement compatible ;
- **BUDGET** : fichiers, depots, DB, services, droits et interdictions ;
- **STOP** : criteres objectifs de fin ou de blocage ;
- **REPORT** : preuves, nouvel etat et une seule prochaine action.

## 3. Boucle canonique

```text
DISCOVER
-> RECONCILE
-> BASELINE
-> SELECT
-> IMPACT_ANALYSIS
-> VERIFY_HEADS
-> CLAIM_SINGLE_WRITER
-> IMPLEMENT_COMPATIBLY
-> VERIFY
-> REGRESSION_CHECK
-> CORRECT_IF_REQUIRED
-> VERIFY_AGAIN
-> PERSIST_STATE
-> COMMIT
-> VERIFY_REMOTE_STATE
-> DEPLOY_IF_APPLICABLE
-> VERIFY_PRODUCTION
-> SELECT_NEXT
```

Aucune etape applicable ne peut etre silencieusement sautee.

## 4. DISCOVER

Avant toute modification, lire dans cet ordre : `00_START_HERE.md`, `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md`, `LOOP_ENGINEERING.md`, `docs/governance/GOV-006_GITHUB_S2_RECONCILIATION_2026-09-10.md`, `docs/architecture/GITHUB_S2_RUNTIME_AUTHORITY_MODEL.md`, `docs/runbooks/GITHUB_S2_RECONCILIATION_RUNBOOK.md`, `DIRECTIVE_TRAVAIL.md`, les `CLAUDE.md` pertinents, `front_end_opcvm/SUIVI.md`, puis les README/TODO/ROADMAP/CODE_REVIEW/CHANGELOG/DEPLOYMENT et enfin le code, les tests, migrations, routes, modeles et scripts concernes.

Toujours rechercher l'existant avant de creer une nouvelle autorite, table, composant, service, workflow ou mecanisme de suivi.

## 5. RECONCILE

Resoudre avant l'implementation : API_HEAD, FRONTEND_HEAD, checkpoint SUIVI, travaux actifs, commits/PR/checks pertinents, etat S2/runtime si concerne, etat DB/migrations si concerne.

Les faits mesures de production priment sur une prose documentaire perimee. Une mesure absente vaut `UNKNOWN` ou `PENDING`, jamais `OK`.

Si S2 diverge, appliquer obligatoirement le gate GOV-006 de la section 20 avant toute synchronisation ou ecriture serveur.

## 6. BASELINE

Enregistrer ce qui fonctionne avant modification : comportements, contrats API, routes/pages, donnees/comptages pertinents, calculs financiers representatifs, tests/build/lint/typecheck, cron/runtime et defauts preexistants.

Un defaut preexistant n'est pas une regression du nouveau lot, mais le nouveau lot ne doit jamais l'aggraver.

## 7. SELECT + IMPACT_ANALYSIS

Choisir une seule tache atomique. Cartographier ses impacts frontend, backend, DB, donnees, calculs financiers, auth, imports/crons, sources externes, SEO, infra/runtime, deploiement et documentation.

Si une autorite existante peut etre etendue, il est interdit de creer une autorite parallele.

## 8. VERIFY_HEADS

Immediatement avant le premier write, relire les deux HEAD canoniques.

```text
EXPECTED_HEAD != ACTUAL_HEAD
-> WRITE_GATE = CLOSED
-> RECONCILE AGAIN
```

Aucun force push, aucun rewrite d'historique, aucun ecrasement du travail concurrent.

## 9. SINGLE WRITER

Plusieurs agents peuvent lire/analyser simultanement. Un seul writer peut modifier un lot gouverne a un instant donne. Le writer possede un Integration Slot borne et le libere apres persistance de l'etat et verification distante. Tout agent suivant repart du nouveau FUND_STATE.

## 10. IMPLEMENT COMPATIBLY

Toujours preferer :

`REUTILISER -> CORRIGER -> RENFORCER -> ETENDRE -> MIGRER COMPATIBLEMENT`.

Preserver les autorites existantes users/auth/fonds/SGO/documents/donnees. Preferer les migrations additives. Aucun `DROP TABLE`, `DROP COLUMN`, rename destructif, truncate ou suppression de donnees sans plan explicitement approuve. S2 reste une cible de deploiement, jamais une source de developpement independante.

Aucune donnee financiere absente, stale, aberrante ou non qualifiee ne peut etre transformee silencieusement en score valide.

## 11. VERIFY

Executer les controles deterministes applicables :

- backend : syntaxe/type, tests, contrats API/routes, auth, migrations, calculs ;
- frontend : typecheck, lint, build production, routes/pages, parcours critiques ;
- data : comptages avant/apres, contraintes/FK, orphelins, stale/outliers ;
- infra : runtime/PM2, cron, HTTP/API, DB si concernee.

## 12. REGRESSION_CHECK

Comparer BEFORE vs AFTER. Une nouveaute fonctionnelle ne suffit pas : les comportements valides non concernes doivent rester valides. Aucun controle ne peut etre affaibli ou supprime uniquement pour obtenir un PASS.

## 13. CORRECT / VERIFY AGAIN

En cas d'echec : diagnostiquer la cause, appliquer la plus petite correction pertinente, relancer les controles echoues puis les regressions affectees. Un echec inexplique reste un blocage.

## 14. PERSIST_STATE

Lorsque l'etat operationnel change, mettre a jour l'unique memoire operationnelle canonique : `front_end_opcvm/SUIVI.md`. Ne pas creer de fichier de statut concurrent.

Conserver quand pertinent : lot/Integration Slot, SHA de depart/fin des deux repos, fichiers, DB/data, tests, production, decisions, risques et prochaine action exacte.

## 15. COMMIT + VERIFY_REMOTE_STATE

Commit sur la branche canonique existante uniquement, sauf decision explicite du proprietaire modifiant la gouvernance. Interdits : branche agent permanente, force push, rewrite d'historique, suppression d'un historique valide ou contournement d'un gate d'approbation.

Apres push : relire le HEAD distant, verifier le commit, le diff, les checks et les deux HEAD avant qu'un autre agent commence.

## 16. DEPLOY + VERIFY_PRODUCTION

Le chemin normal est GitHub canonique -> S2. Pour tout lot de production, mesurer : SHA S2, working tree, PM2/services, HTTP/API, DB et crons concernes.

Invariant cible :

```text
GitHub API canonical SHA == S2 API deployed SHA
GitHub frontend canonical SHA == S2 frontend deployed SHA
```

Sans mesure : `NOT_ATTESTED`.

Une modification documentaire qui avance un HEAD GitHub doit elle aussi etre synchronisee puis re-attestee si le lot est declare production-verifie.

## 17. DEFINITION OF DONE

Un lot est DONE seulement si toutes les conditions applicables sont satisfaites : comportement demande implemente, scope borne, autorites existantes reutilisees, tests passes, regressions verifiees, integrite data verifiee, changements concurrents reconcilies, etat distant verifie, `SUIVI.md` actualise si necessaire, production verifiee si modifiee, FUND_STATE connu ou explicitement partiellement non atteste, et une seule prochaine action identifiee.

`CODE_WRITTEN != DONE`.

## 18. STOP CONDITIONS

Garder le write gate ferme si : HEAD inattendu, writer concurrent sur scope chevauchant, autorite requise non mesurable, migration destructive non approuvee, test/regression inexplique, production contradictoire avec les hypotheses, ou action necessitant de contourner gouvernance/autorisation/approbation.

Pour une divergence S2, garder aussi le write gate ferme si un commit applicatif local est inexplique, si un artefact potentiellement metier devrait etre detruit pour continuer, ou si la sauvegarde requise echoue.

## 19. SELECT_NEXT

Chaque boucle se termine avec une seule prochaine action explicite. La boucle suivante recommence a `DISCOVER` sur le nouvel etat canonique verifie.

## 20. S2 DIVERGENCE GATE — GOV-006

Toute divergence GitHub/S2 passe obligatoirement par :

```text
S2 DIVERGES ?
  |
  +-- NO  -> continue normal loop
  |
  +-- YES -> CLASSIFY COMMITS AND FILES
             -> IDENTIFY AUTOMATIC PRODUCER / ROOT CAUSE
             -> BACKUP RECOVERABLE STATE
             -> PRESERVE UNKNOWN UNTRACKED
             -> PRESERVE LEGITIMATE LOCAL CHANGES
             -> CORRECT ROOT CAUSE
             -> RECONCILE WITH FRESH REMOTE HEAD
             -> VERIFY ahead=0 / behind=0
             -> VERIFY runtime
```

### Interdictions

Ne jamais remplacer cette boucle par :

```text
git pull sans diagnostic
git reset --hard
git clean -fd
git push --force
```

### Classification des untracked

```text
GENERATED_SAFE | LOG | CACHE | DOWNLOAD | BUSINESS_DATA | UNKNOWN
```

`UNKNOWN` est preserve jusqu'a investigation.

### Snapshot production

Le snapshot live est `/var/lib/fundafrica/runtime/PRODUCTION_STATE.json`. Sa generation ne doit jamais changer Git HEAD ni produire de commit automatique.

### Preuve post-documentation

Tout commit documentaire fait evoluer le FUND_STATE. Apres une documentation de gouvernance liee a la production, refaire obligatoirement la mesure GitHub ↔ S2 ↔ runtime avant de passer le lot a `CERTIFIED`.
