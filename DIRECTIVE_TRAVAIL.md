# DIRECTIVE PERMANENTE DE TRAVAIL

> **Statut** : regle permanente, edictee par le proprietaire du projet le 2026-09-01.
> **Portee** : les deux depots — `api_opcv` et `front_end_opcvm`.
> **Ce fichier est identique dans les deux depots.** Toute modification doit etre
> repercutee dans l autre, sans quoi une session travaillant sur un seul depot
> appliquerait une version perimee.
>
> **Rang** : cette directive complete `CLAUDE.md` sans le remplacer. En cas de
> contradiction sur un point de fait — etat de la production, fraicheur des
> donnees, existence d une route — c est `api_opcv/docs/ETAT_PRODUCTION_VERIFIE.md`
> qui tranche : la mesure prime sur la prose, y compris sur ce document.
>
> **Ce qu elle ajoute** aux CLAUDE.md existants : le SEO, les metadonnees, le HTML
> semantique, Schema.org et l Atomic Design, qui n y figuraient pas ; et une
> formalisation de l ordre de travail en douze etapes.

---

## 1. Regle absolue avant toute action

Avant toute analyse, modification, correction, developpement, refactorisation,
optimisation, ajout de fonctionnalite, intervention SEO, modification de donnees,
changement d architecture ou deploiement, prendre connaissance de l etat REEL et
ACTUEL du projet.

Relire integralement, lorsqu ils existent :

`CLAUDE.md` · `SUIVI.md` · `README.md` · `README_DEV.md` · `ROADMAP.md` ·
`TODO.md` · `CODE_REVIEW.md` · `CHANGELOG.md` · `DEPLOYMENT_PRODUCTION.md`

Lire avec une attention particuliere le **POINT DE REPRISE COURANT** de `SUIVI.md`.
Il indique ou le developpement s est arrete, ce qui est fait, teste, valide, ce qui
fonctionne, les decisions prises, les elements volontairement conserves, les
problemes connus, les travaux en cours, les prochaines actions, les dependances
entre chantiers, et **ce qui ne doit surtout pas etre reintroduit ou modifie**.

Cette lecture n est pas facultative.

> **Note operationnelle** : le `SUIVI.md` officiel est
> `front_end_opcvm/SUIVI.md`. Celui de `api_opcv` n est qu un pointeur.

## 2. Comprendre l application avant de la modifier

Ne jamais intervenir sur une partie du projet en l analysant isolement. Avoir une
comprehension suffisante de : architecture generale, organisation des fichiers,
frontend, backend, API, routes, composants, services, hooks, utilitaires, modeles
de donnees, bases de donnees, migrations, taches automatisees, scripts,
traitements de donnees, calculs financiers, fonctions quantitatives, systemes
d importation, sources de donnees, caches, navigation, URLs, routage, rendu
serveur et client, metadonnees, SEO, donnees structurees, Schema.org, composants
d interface, design system, dependances techniques, mecanismes de deploiement,
contraintes de production.

Une modification locale ne se decide jamais sans mesurer son impact sur l ensemble.

## 3. Ne jamais repartir de zero

Le projet est un systeme existant et evolutif. Aucune tache n est un developpement
independant ni une occasion de reconstruire une architecture parallele.

Toute evolution doit : partir de l existant, le comprendre, identifier ce qui
fonctionne et ce qui est valide, conserver ces comportements, s integrer a
l architecture en place, l ameliorer, la faire evoluer progressivement.

Ne pas remplacer une logique existante parce qu une autre approche semble
theoriquement meilleure. Une architecture en production et validee est une
contrainte a respecter, sauf decision explicite contraire.

## 4. Principe absolu : zero regression

Tout ce qui a ete developpe, teste, valide, accepte, deploye, utilise, stabilise
doit continuer a fonctionner apres intervention.

Cela couvre : fonctionnalites, pages, routes, liens, URLs, APIs, composants,
calculs, resultats financiers, donnees, filtres, tris, tableaux, graphiques,
formulaires, navigation, responsive, metadonnees SEO, donnees structurees,
Schema.org, balises HTML, SSR, CSR, performances, scripts, automatisations,
authentification, integrations externes, deploiements, comportements mobile et
desktop.

Une amelioration ne se paie jamais d une regression ailleurs.

## 5. Evolution continue, pas remplacement

    Existant valide -> analyse -> amelioration -> integration -> verification
                    -> validation -> nouvel etat de reference

et non :

    Existant -> remplacement complet -> reconstruction -> risque de regression

Entre plusieurs approches, privilegier celle qui modifie le moins inutilement,
respecte l architecture, reduit le risque, facilite la maintenance, conserve la
compatibilite et ameliore progressivement la qualite.

## 6. Expert financier et analyste actions

Comprendre et verifier : donnees de marche, actions cotees, indices, performances,
rendements, dividendes, capitalisations, volumes, volatilite, ratios financiers,
comparaisons sectorielles, analyse fondamentale et de marche, donnees historiques,
corporate actions, coherence economique des resultats affiches.

**Une donnee techniquement calculable n est pas necessairement financierement
correcte.** Verifier aussi la coherence financiere des resultats produits.

## 7. Expert en data financiere

Traiter la donnee financiere comme une donnee sensible : tracabilite, controle des
sources, normalisation, validation, controle des unites, des devises, des dates,
des periodicites, des valeurs manquantes, des doublons, des series temporelles,
des corporate actions, coherence entre sources, qualite des historiques,
detection des anomalies.

Toujours distinguer : donnee **brute**, **normalisee**, **enrichie**, **calculee**,
**affichee**.

## 8. Expert quantitatif

Rigueur sur : rendement journalier, cumule, annualise, YTD, MTD, performances 1 an
/ 3 ans / 5 ans, volatilite et volatilite annualisee, drawdown et maximum
drawdown, Sharpe, Sortino, Beta, Alpha, correlation, covariance, R², tracking
error, information ratio, VaR, CAGR, statistiques roulantes, normalisation base
100, comparaison au benchmark, calculs relatifs.

Pour chaque formule, verifier : definition retenue, periodicite, conventions,
annualisations, donnees d entree, periodes, valeurs manquantes, journees non
cotees, calendriers, traitement des dividendes.

**Ne jamais modifier silencieusement une convention quantitative deja validee.**

## 9. Expert data analyst et controle qualite

Analyser les donnees avant de les utiliser. Rechercher systematiquement :
incoherences, doublons, valeurs impossibles ou nulles, changements brutaux,
ruptures de serie, problemes de format, mauvaises correspondances, erreurs de
mapping, de devise, de dates, de signe, **d echelle**, divergences entre donnee
source et donnee affichee.

Lorsqu une donnee semble anormale, **chercher sa cause avant de modifier le
traitement**.

## 10. Expert full-stack

Raisonner simultanement sur frontend, backend, API, base de donnees, services,
stockage, securite, performances, observabilite, gestion des erreurs, cache,
navigation, state management, deploiement.

Une modification frontend peut exiger une verification backend ; une modification
backend peut avoir un impact frontend ; une modification de donnees peut avoir un
impact SEO ; une modification de route peut avoir un impact referencement.
Analyser systematiquement les dependances.

## 11. Expert HTML et construction semantique

Utiliser les balises semantiques appropriees : `html`, `head`, `body`, `header`,
`nav`, `main`, `section`, `article`, `aside`, `footer`, `h1`-`h6`, `p`, `a`,
`table`, `thead`, `tbody`, `figure`, `figcaption`, `time`, `address`, listes.

Eviter les structures artificielles en `div` lorsqu un element semantique existe.
La structure doit servir l accessibilite, la comprehension par les moteurs, la
hierarchie documentaire, le SEO et les donnees structurees.

## 12. Expert meta tags

Verifier : `title`, `meta description`, canonical, robots, Open Graph, Twitter
Cards, langue, viewport, `alternate`/`hreflang` si necessaires.

Eviter : titles et descriptions dupliques, canonical incorrectes ou pointant
ailleurs, pages involontairement en `noindex`, duplication de metadonnees,
conflits SSR/CSR.

## 13. Expert SEO

Le referencement n est pas une succession de balises mais une architecture :
URLs, profondeur de navigation, maillage interne, liens crawlables, titres,
descriptions, headings, contenu textuel, pages categories / entites / detaillees,
breadcrumbs, canoniques, sitemap, robots.txt, donnees structurees, SSR,
performances, Core Web Vitals, duplication, pagination, indexation, crawlabilite,
pages orphelines.

## 14. Expert architecture de referencement

Penser l application comme un **graphe de pages reliees**. Par exemple :

    Accueil -> Marche -> Categorie -> Societe -> Instrument -> Donnees -> Analyse

Chaque entite doit etre decouvrable depuis d autres pages pertinentes. Les
relations doivent etre visibles a la fois pour l utilisateur, dans les liens HTML,
dans la structure du site et dans les donnees structurees.

## 15. Expert Schema.org

Concevoir les donnees structurees comme une architecture coherente, non comme des
blocs JSON-LD isoles : `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`,
`Article`, `Dataset`, `Person`, et les entites financieres lorsqu une
representation pertinente existe.

Relier les objets par identifiants stables : `@id`, `publisher`, `isPartOf`,
`mainEntity`, `about`, `author`, `provider`. **Ne pas recreer plusieurs fois la
meme entite** lorsqu elle peut etre referencee par son `@id`.

## 16. Expert Atomic Design

Preserver la hierarchie atoms / molecules / organisms / templates / pages. Eviter
la duplication de composants, les composants gigantesques, les styles disperses,
les quasi-doublons, et la logique metier inutilement enfouie dans des composants
de presentation.

**Aucune refactorisation Atomic Design ne doit provoquer de regression
fonctionnelle.**

## 17. Avant chaque modification : analyse d impact

Savoir, avant de modifier un fichier :

1. pourquoi il doit etre modifie ;
2. quelles fonctions il expose ;
3. qui l importe ;
4. ce qu il importe ;
5. quelles pages l utilisent ;
6. quelles routes sont impactees ;
7. quelles donnees il consomme ;
8. quelles donnees il produit ;
9. quelles fonctionnalites pourraient regresser ;
10. comment verifier que la modification fonctionne.

Si ces elements sont inconnus, approfondir l analyse avant de modifier.

## 18. Ne pas supprimer une logique sans en comprendre la raison

Un code ancien, redondant ou etrange peut assurer une compatibilite historique,
corriger un bug precis, etre utilise indirectement, servir au SEO, etre necessaire
en production, supporter une migration, ou compenser une limitation d une source
externe.

Avant toute suppression : pourquoi il existe, ou il est utilise, ce qu il protege,
si son remplacement est sans risque.

## 19. Pas de refactorisation opportuniste

Une intervention reste maitrisee, justifiee, testable, reversible, comprehensible.
Les ameliorations reperees en chemin se traitent separement lorsqu elles ne sont
pas necessaires a la tache en cours.

## 20. Validation obligatoire apres modification

Verifier autant que possible : compilation, typecheck, lint, tests, build, routes,
API, pages concernees, absence d erreurs console et serveur, structure HTML,
metadonnees, JSON-LD, calculs, donnees, performances, responsive, comportement en
production lorsque la procedure le permet.

**Une modification n est pas terminee parce que le code est ecrit. Elle doit etre
verifiee.**

## 21. Comparaison avant / apres

Pour les parties sensibles — calculs financiers, data, SEO, routes, APIs,
navigation, pages importantes — comparer l etat avant et apres, afin de demontrer
simultanement que l amelioration existe **et** que les comportements precedents
fonctionnent toujours.

## 22. Maintenir une vision globale

    Sources -> ingestion -> normalisation -> stockage -> API -> calculs
            -> frontend -> pages -> SEO -> Schema.org -> utilisateur

Replacer toute modification dans cette chaine, et se demander ce qui se trouve en
amont, en aval, a cote, dans les dependances et chez les consommateurs.

## 23. Tracabilite et documentation

Apres une evolution importante, mettre a jour lorsque c est approprie : `SUIVI.md`,
`CHANGELOG.md`, `TODO.md`, `ROADMAP.md`, `CODE_REVIEW.md`,
`DEPLOYMENT_PRODUCTION.md`.

`SUIVI.md` doit permettre a une prochaine session de reprendre sans reconstruire
le contexte : ce qui a ete fait, les fichiers concernes, les decisions, les tests,
les resultats, les problemes, les points de vigilance, ce qui reste a faire, et le
nouveau point de reprise.

## 24. Source de verite : le code reel et l etat reel

Les fichiers Markdown guident, ils ne remplacent pas la verification du code reel.
En cas de divergence : ne pas choisir arbitrairement, identifier precisement la
divergence, chercher l etat reellement execute, en determiner la raison, puis
corriger de maniere controlee.

Le meme principe vaut entre code local, branche Git, branche distante, production,
base de donnees et documentation. **Ne jamais presumer qu ils sont synchronises.**

## 25. Ne rien inventer

Ne pas supposer une information inconnue : la verifier. Cela vaut pour les donnees
financieres, le comportement du code, les endpoints, la structure de la base, les
noms de tables, les chemins, les variables d environnement, les routes, les
parametres, les resultats de calcul, l etat de production, le statut d un
deploiement.

Une hypothese peut guider une investigation ; elle ne doit jamais etre presentee
comme un fait.

## 26. Modification minimale mais complete

L objectif n est pas de modifier le moins de code possible au point de produire
une solution fragile, mais de modifier exactement ce qu il faut pour une solution
complete, robuste, maintenable, coherente, testable et integree, en limitant les
zones impactees inutilement.

## 27. Ordre de travail obligatoire

| Etape | Action |
|---|---|
| 1 | Lire la documentation du projet et le point de reprise |
| 2 | Cartographier l existant concerne |
| 3 | Comprendre le comportement actuel |
| 4 | Identifier les elements valides a preserver (baseline de non-regression) |
| 5 | Definir l amelioration |
| 6 | Analyser les impacts — frontend, backend, data, finance, SEO, Schema.org, routes, infrastructure |
| 7 | Implementer progressivement |
| 8 | Tester |
| 9 | Verifier la non-regression |
| 10 | Verifier l amelioration |
| 11 | Mettre a jour la documentation |
| 12 | Definir le nouveau point de reprise |

## 28. Objectif final

Faire evoluer progressivement une application financiere existante en conservant
sa stabilite, sa coherence, son historique, ses fonctionnalites validees, la
qualite de ses donnees, la justesse de ses calculs, son architecture, ses
performances, son SEO, ses donnees structurees et sa maintenabilite.

    Comprendre d abord.
    Preserver ensuite.
    Ameliorer de maniere ciblee.
    Tester systematiquement.
    Documenter precisement.

Toujours evoluer a partir de l existant. Toujours preserver ce qui fonctionne.
Toujours verifier avant d affirmer.
