# LOOP_ENGINEERING — AfricaFunds

> Statut : `APPLICABLE`
> Portée : `Wealthtechinnovations/api_opcv` + `Wealthtechinnovations/front_end_opcvm`.
> Nature : méthode d’exécution commune à tous les humains, agents IA et automatisations. Ce document complète sans remplacer `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md`, `DIRECTIVE_TRAVAIL.md`, `CLAUDE.md` et le `SUIVI.md` canonique.

## 1. État canonique

AfricaFunds est un seul produit réparti sur deux dépôts. L’état courant est un tuple, jamais un SHA isolé :

```text
FUND_STATE = (
  API_HEAD,
  FRONTEND_HEAD,
  SUIVI_CHECKPOINT,
  PRODUCTION_ATTESTATION
)
```

Branches canoniques actuelles dans les deux dépôts : `claude/code-review-improvements-ikvuj`. Le préfixe `claude/` est historique et ne confère aucune propriété exclusive à Claude.

## 2. Contrat de boucle

Toute boucle possède obligatoirement :

- **TRIGGER** : raison vérifiable d’ouverture ;
- **SCOPE** : une tâche ou Integration Slot borné ;
- **ACTION** : plus petit changement compatible ;
- **BUDGET** : fichiers, dépôts, DB, services, droits et interdictions ;
- **STOP** : critères objectifs de fin ou de blocage ;
- **REPORT** : preuves, nouvel état et une seule prochaine action.

Voir aussi `LOOP_CONTRACT.md`.

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

Aucune étape applicable ne peut être silencieusement sautée.

## 4. DISCOVER

Lire l’ordre complet de `00_START_HERE.md`. La reprise opérationnelle utilise notamment `PROJECT_CONTEXT.md`, `STATUS.md`, le `SUIVI.md` global frontend, `NEXT_ACTION.md`, `LOOP_STATE.md`, `CURRENT_ITERATION.md`, `WORK_LOG.md` et `HANDOFF.md`, puis les décisions, GOV-006 et documents/code directement concernés.

Toujours rechercher l’existant avant de créer une nouvelle autorité, table, composant, service, workflow ou mécanisme de suivi. Les anciens documents restent exploités selon leur rôle.

## 5. RECONCILE

Résoudre avant implémentation : API_HEAD, FRONTEND_HEAD, checkpoint SUIVI, travaux actifs, commits/PR/checks pertinents, état S2/runtime si concerné, DB/migrations si concernées et contradictions entre vues opérationnelles.

Les faits mesurés de production priment sur une prose périmée. Une mesure absente vaut `UNKNOWN` ou `PENDING`, jamais `OK`.

Si S2 diverge, appliquer le gate GOV-006 de la section 20 avant toute synchronisation ou écriture serveur.

## 6. BASELINE

Enregistrer ce qui fonctionne avant modification : comportements, contrats API, routes/pages, données/comptages pertinents, calculs financiers représentatifs, tests/build/lint/typecheck, cron/runtime et défauts préexistants.

Un défaut préexistant n’est pas une régression du nouveau lot, mais le nouveau lot ne doit jamais l’aggraver.

## 7. SELECT + IMPACT_ANALYSIS

Choisir une seule tâche atomique à partir de l’état réel, des dépendances et de `NEXT_ACTION.md`. Cartographier impacts frontend, backend, DB, données, calculs, auth, imports/crons, sources, SEO, infra/runtime, déploiement et documentation.

Si une autorité existante peut être étendue, il est interdit de créer une autorité parallèle.

## 8. VERIFY_HEADS

Immédiatement avant le premier write, relire les deux HEAD canoniques :

```text
EXPECTED_HEAD != ACTUAL_HEAD
-> WRITE_GATE = CLOSED
-> RECONCILE AGAIN
```

Aucun force push, rewrite d’historique ou écrasement du travail concurrent.

## 9. SINGLE WRITER

Plusieurs agents peuvent lire/analyser simultanément. Un seul writer modifie un lot gouverné à un instant donné. Le writer possède un scope borné et le libère après persistance de l’état et vérification distante. Tout agent suivant repart du nouveau `FUND_STATE`.

## 10. IMPLEMENT COMPATIBLY

Toujours préférer :

`RÉUTILISER -> CORRIGER -> RENFORCER -> ÉTENDRE -> MIGRER COMPATIBLEMENT`.

Préserver les autorités existantes users/auth/fonds/SGO/documents/données. Préférer les migrations additives. Aucun `DROP TABLE`, `DROP COLUMN`, rename destructif, truncate ou suppression de données sans plan explicitement approuvé. S2 reste cible de déploiement, jamais source de développement indépendante.

Aucune donnée financière absente, stale, aberrante ou non qualifiée ne peut être transformée silencieusement en score valide.

## 11. VERIFY

Exécuter les contrôles déterministes applicables :

- backend : syntaxe/type, tests, contrats API/routes, auth, migrations, calculs ;
- frontend : typecheck, lint, build production, routes/pages, parcours critiques ;
- data : comptages avant/après, contraintes/FK, orphelins, stale/outliers, provenance ;
- infra : runtime/services, cron, HTTP/API, DB si concernée ;
- gouvernance : cohérence des registres, JSON machine-readable, liens/autorités, absence de secret introduit.

## 12. REGRESSION_CHECK

Comparer BEFORE vs AFTER. Une nouveauté fonctionnelle ne suffit pas : les comportements valides non concernés doivent rester valides. Aucun contrôle ne peut être affaibli ou supprimé uniquement pour obtenir un PASS.

## 13. CORRECT / VERIFY AGAIN

En cas d’échec : diagnostiquer la cause, appliquer la plus petite correction pertinente, relancer les contrôles échoués puis les régressions affectées. Un échec inexpliqué reste un blocage et peut alimenter `docs/09-loop/FAILURE_REGISTER.md` / `ROOT_CAUSE_REGISTER.md`.

## 14. PERSIST_STATE

Les registres ont des fonctions complémentaires et ne remplacent pas l’historique global :

- `front_end_opcvm/SUIVI.md` : historique/checkpoint opérationnel global, append-only selon les règles existantes ;
- `STATUS.md` : photographie courante du dépôt ;
- `LOOP_STATE.md` et `.governance/loop/state.json` : état de boucle ;
- `CURRENT_ITERATION.md` : lot borné ;
- `WORK_LOG.md` : actions/preuves/anomalies ;
- `HANDOFF.md` : transmission ;
- `NEXT_ACTION.md` : une seule action suivante ;
- `OPEN_QUESTIONS.md` : inconnues réelles ;
- `.governance/knowledge/*` et `.governance/matrices/*` : identifiants/relations structurés selon `authority-map.json`.

Ne pas recopier intégralement la même information dans chaque registre. Mettre à jour uniquement ceux affectés par le changement, puis ajouter l’entrée de synthèse nécessaire au `SUIVI.md` global lorsque le checkpoint change.

## 15. COMMIT + VERIFY_REMOTE_STATE

Commit sur la branche canonique existante uniquement, sauf décision explicite du propriétaire. Interdits : branche agent permanente, force push, rewrite d’historique, suppression d’un historique valide ou contournement d’un gate.

Après push : relire HEAD distant, vérifier commit, diff, checks et les deux HEAD avant qu’un autre agent commence. Le registre machine-readable ne peut pas pré-déclarer le SHA final : il est enrichi après observation lorsque nécessaire.

## 16. DEPLOY + VERIFY_PRODUCTION

Le chemin normal est GitHub canonique -> S2. Pour tout lot production, mesurer : SHA S2, working tree, runtime/services, HTTP/API, DB et crons concernés.

```text
GitHub API canonical SHA == S2 API deployed SHA
GitHub frontend canonical SHA == S2 frontend deployed SHA
```

Sans mesure : `NOT_ATTESTED`.

Une modification documentaire qui avance un HEAD GitHub doit elle aussi être synchronisée puis re-attestée si le lot est déclaré production-vérifié.

## 17. DEFINITION OF DONE

Un lot est DONE seulement si : comportement/résultat demandé atteint ; scope borné ; autorités existantes réutilisées ; tests passés ; régressions vérifiées ; intégrité data vérifiée si concernée ; changements concurrents réconciliés ; état distant vérifié ; registres de continuité synchronisés ; `SUIVI.md` global actualisé si nécessaire ; production vérifiée si modifiée ; `FUND_STATE` connu ou explicitement partiellement non attesté ; une seule prochaine action identifiée.

`CODE_WRITTEN != DONE` et `DOCUMENT_WRITTEN != DONE`.

## 18. STOP CONDITIONS

Garder le write gate fermé si : HEAD inattendu, writer concurrent, autorité requise non mesurable, migration destructive non approuvée, test/régression inexpliqué, production contradictoire, secret/sécurité critique ou action exigeant de contourner gouvernance/autorisation.

Pour une divergence S2 : gate fermé si commit applicatif local inexpliqué, artefact potentiellement métier à détruire ou sauvegarde requise échouée.

## 19. SELECT_NEXT

Chaque boucle se termine avec une seule prochaine action explicite. La boucle suivante recommence à `DISCOVER` sur le nouvel état canonique vérifié. Si aucune action sûre n’existe, l’état reste `BLOCKED` avec raison persistée.

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

Interdits : `git pull` sans diagnostic, `git reset --hard`, `git clean -fd`, `git push --force`.

Classification des untracked :

```text
GENERATED_SAFE | LOG | CACHE | DOWNLOAD | BUSINESS_DATA | UNKNOWN
```

`UNKNOWN` est préservé jusqu’à investigation.

Le snapshot live reste techniquement `/var/lib/fundafrica/runtime/PRODUCTION_STATE.json`. Sa génération ne doit jamais changer Git HEAD ni produire de commit automatique.

Tout commit documentaire fait évoluer le `FUND_STATE`. Après documentation de gouvernance liée à la production, refaire la mesure GitHub ↔ S2 ↔ runtime avant de passer le lot à `CERTIFIED`.

## 21. CONTEXT RECONSTRUCTION GATE

Toute boucle ouverte dans une nouvelle session commence par une reconstruction déterministe : découverte du peer repository, vérification des deux default/canonical branches et HEAD, lecture des autorités/registres, inspection CI récente et observation S2/runtime si le scope en dépend. La sortie attendue est un `FUND_STATE` reconstruit et un `CONTEXT_RECONSTRUCTION=PASS`. Sans ce PASS, `WORK_GATE=CLOSED`.

Le canal d'observation serveur est abstrait : bridge MCP nominal, GitHub Actions → SSH S2 en fallback. Changer de canal ne change ni les autorités, ni les gates, ni les interdictions de mutation.
