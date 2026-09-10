# LOOP_ENGINEERING — FundAfrica

> Statut : `APPLICABLE`
> Portée : `Wealthtechinnovations/api_opcv` + `Wealthtechinnovations/front_end_opcvm`.
> Nature : méthode d'exécution commune à tous les humains, agents IA et automatisations. Ce document complète sans remplacer `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md`, `DIRECTIVE_TRAVAIL.md`, `CLAUDE.md` et le `SUIVI.md` canonique.

## 1. État canonique

FundAfrica est un seul produit réparti sur deux dépôts. L'état courant est un tuple, jamais un SHA isolé :

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

- **TRIGGER** : raison vérifiable d'ouverture ;
- **SCOPE** : une tâche ou Integration Slot borné ;
- **ACTION** : plus petit changement compatible ;
- **BUDGET** : fichiers, dépôts, DB, services, droits et interdictions ;
- **STOP** : critères objectifs de fin ou de blocage ;
- **REPORT** : preuves, nouvel état et une seule prochaine action.

## 3. Boucle canonique

```text
DISCOVER
→ RECONCILE
→ BASELINE
→ SELECT
→ IMPACT_ANALYSIS
→ VERIFY_HEADS
→ CLAIM_SINGLE_WRITER
→ IMPLEMENT_COMPATIBLY
→ VERIFY
→ REGRESSION_CHECK
→ CORRECT_IF_REQUIRED
→ VERIFY_AGAIN
→ PERSIST_STATE
→ COMMIT
→ VERIFY_REMOTE_STATE
→ DEPLOY_IF_APPLICABLE
→ VERIFY_PRODUCTION
→ SELECT_NEXT
```

Aucune étape applicable ne peut être silencieusement sautée.

## 4. DISCOVER

Avant toute modification, lire dans cet ordre : `00_START_HERE.md`, `GOVERNANCE.md`, `SOURCE_OF_TRUTH.md`, `AGENTS.md`, `LOOP_ENGINEERING.md`, `DIRECTIVE_TRAVAIL.md`, les `CLAUDE.md` pertinents, `front_end_opcvm/SUIVI.md`, puis les README/TODO/ROADMAP/CODE_REVIEW/CHANGELOG/DEPLOYMENT et enfin le code, les tests, migrations, routes, modèles et scripts concernés.

Toujours rechercher l'existant avant de créer une nouvelle autorité, table, composant, service, workflow ou mécanisme de suivi.

## 5. RECONCILE

Résoudre avant l'implémentation : API_HEAD, FRONTEND_HEAD, checkpoint SUIVI, travaux actifs, commits/PR/checks pertinents, état S2/runtime si concerné, état DB/migrations si concerné.

Les faits mesurés de production priment sur une prose documentaire périmée. Une mesure absente vaut `UNKNOWN` ou `PENDING`, jamais `OK`.

## 6. BASELINE

Enregistrer ce qui fonctionne avant modification : comportements, contrats API, routes/pages, données/comptages pertinents, calculs financiers représentatifs, tests/build/lint/typecheck, cron/runtime et défauts préexistants.

Un défaut préexistant n'est pas une régression du nouveau lot, mais le nouveau lot ne doit jamais l'aggraver.

## 7. SELECT + IMPACT_ANALYSIS

Choisir une seule tâche atomique. Cartographier ses impacts frontend, backend, DB, données, calculs financiers, auth, imports/crons, sources externes, SEO, infra/runtime, déploiement et documentation.

Si une autorité existante peut être étendue, il est interdit de créer une autorité parallèle.

## 8. VERIFY_HEADS

Immédiatement avant le premier write, relire les deux HEAD canoniques.

```text
EXPECTED_HEAD != ACTUAL_HEAD
→ WRITE_GATE = CLOSED
→ RECONCILE AGAIN
```

Aucun force push, aucun rewrite d'historique, aucun écrasement du travail concurrent.

## 9. SINGLE WRITER

Plusieurs agents peuvent lire/analyser simultanément. Un seul writer peut modifier un lot gouverné à un instant donné. Le writer possède un Integration Slot borné et le libère après persistance de l'état et vérification distante. Tout agent suivant repart du nouveau FUND_STATE.

## 10. IMPLEMENT_COMPATIBLY

Toujours préférer :

`RÉUTILISER → CORRIGER → RENFORCER → ÉTENDRE → MIGRER COMPATIBLEMENT`.

Préserver les autorités existantes users/auth/fonds/SGO/documents/données. Préférer les migrations additives. Aucun `DROP TABLE`, `DROP COLUMN`, rename destructif, truncate ou suppression de données sans plan explicitement approuvé. S2 reste une cible de déploiement, jamais une source de développement indépendante.

Aucune donnée financière absente, stale, aberrante ou non qualifiée ne peut être transformée silencieusement en score valide.

## 11. VERIFY

Exécuter les contrôles déterministes applicables :

- backend : syntaxe/type, tests, contrats API/routes, auth, migrations, calculs ;
- frontend : typecheck, lint, build production, routes/pages, parcours critiques ;
- data : comptages avant/après, contraintes/FK, orphelins, stale/outliers ;
- infra : runtime/PM2, cron, HTTP/API, DB si concernée.

## 12. REGRESSION_CHECK

Comparer BEFORE vs AFTER. Une nouveauté fonctionnelle ne suffit pas : les comportements validés non concernés doivent rester valides. Aucun contrôle ne peut être affaibli ou supprimé uniquement pour obtenir un PASS.

## 13. CORRECT / VERIFY AGAIN

En cas d'échec : diagnostiquer la cause, appliquer la plus petite correction pertinente, relancer les contrôles échoués puis les régressions affectées. Un échec inexpliqué reste un blocage.

## 14. PERSIST_STATE

Lorsque l'état opérationnel change, mettre à jour l'unique mémoire opérationnelle canonique : `front_end_opcvm/SUIVI.md`. Ne pas créer de fichier de statut concurrent.

Conserver quand pertinent : lot/Integration Slot, SHA de départ/fin des deux repos, fichiers, DB/data, tests, production, décisions, risques et prochaine action exacte.

## 15. COMMIT + VERIFY_REMOTE_STATE

Commit sur la branche canonique existante uniquement, sauf décision explicite du propriétaire modifiant la gouvernance. Interdits : branche agent permanente, force push, rewrite d'historique, suppression d'un historique validé ou contournement d'un gate d'approbation.

Après push : relire le HEAD distant, vérifier le commit, le diff, les checks et les deux HEAD avant qu'un autre agent commence.

## 16. DEPLOY + VERIFY_PRODUCTION

Le chemin normal est GitHub canonique → S2. Pour tout lot de production, mesurer : SHA S2, working tree, PM2/services, HTTP/API, DB et crons concernés.

Invariant cible :

```text
GitHub API canonical SHA == S2 API deployed SHA
GitHub frontend canonical SHA == S2 frontend deployed SHA
```

Sans mesure : `NOT_ATTESTED`.

## 17. DEFINITION OF DONE

Un lot est DONE seulement si toutes les conditions applicables sont satisfaites : comportement demandé implémenté, scope borné, autorités existantes réutilisées, tests passés, régressions vérifiées, intégrité data vérifiée, changements concurrents réconciliés, état distant vérifié, `SUIVI.md` actualisé si nécessaire, production vérifiée si modifiée, FUND_STATE connu ou explicitement partiellement non attesté, et une seule prochaine action identifiée.

`CODE_WRITTEN != DONE`.

## 18. STOP CONDITIONS

Garder le write gate fermé si : HEAD inattendu, writer concurrent sur scope chevauchant, autorité requise non mesurable, migration destructive non approuvée, test/régression inexpliqué, production contradictoire avec les hypothèses, ou action nécessitant de contourner gouvernance/autorisation/approbation.

## 19. SELECT_NEXT

Chaque boucle se termine avec une seule prochaine action explicite. La boucle suivante recommence à `DISCOVER` sur le nouvel état canonique vérifié.
