# Prompt Claude Code V2 — audit, correction et mise à jour hebdomadaire des OPCVM Nigeria

Version 2 renforcée : interprétation exhaustive des nombres, absence de correction aveugle, accès contrôlé à la base, synchronisation Git/serveur et déploiement réversible.

Copie-colle l’intégralité du prompt ci-dessous dans Claude Code avec le MCP `wealthtech_ssh_bridge` disponible.

---

## Rôle et mission

Tu es un ingénieur senior data/fintech, expert OPCVM, qualité de données, Node.js, SQL/MariaDB, extraction de fichiers Excel/PDF et maintenance de production sans régression.

Ta mission est d’auditer puis de fiabiliser les données des OPCVM/CIS du Nigeria dans ProAfricaFund/FundAfrica à partir de la source officielle SEC Nigeria :

`https://home.sec.gov.ng/for-operators/keep-track-of-capital-market-data/net-asset-value-data/weekly-net-asset-value-for-cis/`

Tu dois reproduire et améliorer la méthode d’extraction décrite ci-dessous pour :

1. récupérer tout l’historique disponible depuis 2011 ;
2. identifier et harmoniser les fonds et sociétés de gestion sans fusion hasardeuse ;
3. distinguer strictement l’actif net total, la VL/Unit Price, le Bid Price et l’Offer Price ;
4. corriger les données Nigeria déjà présentes lorsqu’une preuve officielle démontre l’erreur ;
5. importer les nouveaux fichiers chaque semaine de manière idempotente ;
6. préserver toutes les fonctionnalités existantes et ne provoquer aucune régression.

## Contraintes absolues

- Ne crée aucune nouvelle branche Git.
- Reste sur la branche déjà active. Ne fais ni `git checkout`, ni `git switch`, ni `git branch`, ni rebase, ni merge.
- Ne fais jamais `git reset --hard`, `git clean`, suppression récursive, écrasement global, restauration destructive ou changement de branche.
- Ne supprime, ne déplace et ne modifie aucun fichier utilisateur non suivi sans preuve qu’il appartient à cette tâche.
- État observé à préserver dans l’API : branche `claude/code-review-improvements-ikvuj`, dépôt en avance de 189 commits, `logs.txt` modifié, éléments non suivis `0` et `sec_ng_downloads/`.
- État observé à préserver dans le frontend : même branche, dossier non suivi `.mcp_logs/`.
- Inspecte d’abord `sec_ng_downloads/` : il peut contenir un travail Nigeria antérieur. Ne le supprime pas et ne retélécharge pas inutilement les mêmes fichiers.
- Ne pousse, ne déploie et ne redémarre aucun service avant validation humaine explicite après présentation des résultats, tests, différences et plan de rollback.
- Ne modifie pas les données d’autres pays.
- N’interromps pas les workers existants. Ne lance aucun recalcul global si un recalcul limité aux fonds/dates Nigeria suffit.
- N’expose jamais de secret, mot de passe, clé, fichier `.env` ou donnée personnelle.
- Toute correction de production doit être précédée d’une sauvegarde horodatée ciblée, d’un dry-run, d’un contrôle de volumétrie et d’un mécanisme de rollback testé.
- Toute modification de schéma doit être additive, rétrocompatible et migrée de manière idempotente. Aucun `DROP`, aucun renommage destructif et aucune réutilisation ambiguë d’un champ existant.
- N’applique aucune correction globale sur la seule base d’une ressemblance, d’un décalage supposé, d’une position de colonne, du nom d’un fichier ou d’un exemple isolé.
- Toute règle de correction doit être démontrée sur les cellules sources, documentée, testée sur plusieurs périodes et mesurée par un rapport avant/après.
- Ne transforme jamais une chaîne numérique avant d’avoir identifié son format, sa devise, son unité, son séparateur décimal et ses séparateurs de milliers.

## Environnement à vérifier, sans supposer

- API : `/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/api`
- Frontend : `/var/www/vhosts/chainsolutions.fr/africafunds.chainsolutions.fr/frontend`
- Base : MariaDB `fund_opcvm`
- Site public vérifié : `https://africafunds.chainsolutions.fr` répond HTTP 200.
- Le nom `api.africafunds.chainsolutions.fr` ne résolvait pas lors de l’audit. Ne le crée pas et ne change pas le DNS ; inspecte la configuration réelle du frontend et les routes actuellement utilisées.
- Processus PM2 observés : `api-monolith`, `fundafrique-frontend`, `worker-data-import`, `worker-recalculation` en ligne.
- N’exécute pas `pm2 update` simplement parce que PM2 le suggère.

Avant toute modification, lis intégralement les fichiers de gouvernance disponibles dans les deux dépôts, notamment : `CLAUDE.md`, `SUIVI.md`, `README.md`, `README_DEV.md`, `ROADMAP.md`, `TODO.md`, `TASKS.md`, `CODE_REVIEW.md`, `CHANGELOG.md`, `DEPLOYMENT_PRODUCTION.md`, `PRODUCTION_STATE.json` et le « POINT DE REPRISE COURANT » de `SUIVI.md`. Si un fichier n’existe pas, note-le sans le créer automatiquement.

## Référence d’audit connue au 22 juillet 2026

Ces chiffres sont des repères de contrôle, pas des objectifs à forcer artificiellement :

- 686 fichiers officiels SEC répertoriés sur les pages annuelles 2011–2026 ;
- 683 fichiers directement lisibles ;
- trois XLS officiels structurellement corrompus/tronqués : documents SEC 860, 833 et 816 ;
- deux périodes des fichiers corrompus sont récupérables par les colonnes historiques de fichiers adjacents ;
- la période du 17 août 2012, document 860, n’est pas récupérable : ne rien inventer ;
- 77 863 observations normalisées provisoires ;
- 725 dates distinctes, du 12 août 2011 au 10 juillet 2026 ;
- 352 clés textuelles provisoires, mais ce nombre n’est pas le nombre définitif de fonds juridiques : il contient au moins des variantes et une anomalie ;
- 223 fonds/lignes présents dans le fichier SEC du 10 juillet 2026 ;
- 1 186 groupes fonds/date présentent des variantes ou révisions entre publications et doivent rester auditables.

Anomalies déjà repérées dans l’extraction de référence :

- `ACAP Canary Growth Fund` / `ACAP CanaryGrowth Fund` ;
- `GDL Canary Growth Fund` / `GDL CanaryGrowth Fund` ;
- `United Capital Euro Bond Fund` / `United Capital Eurobond Fund` ;
- une fausse identité de fonds `3`, issue d’une ligne mal interprétée ;
- certaines catégories historiques sont absentes ou imparfaites dans les feuilles sources : ne déduis jamais une catégorie uniquement parce qu’une ligne contient le mot `FUND`.

## État réel de la base Nigeria observé avant correction

Reproduis ces contrôles en lecture seule et explique tout écart avant d’écrire :

- `fond_investissements` : 285 lignes Nigeria, toutes marquées `active = 1` ;
- 285 noms distincts après simple `UPPER(TRIM())` ;
- 69 identifiants de sociétés mais 72 libellés de sociétés de gestion ;
- `valorisations` : 54 046 lignes Nigeria, 284 fonds avec valeurs, 441 dates ;
- période en base : 29 décembre 2017 au 3 juillet 2026 ;
- aucun doublon actuel sur la clé `(fund_id, date)` ;
- un fonds sans valorisation : `FAAM MONEY MARKET FUND` ;
- 52 fonds marqués actifs n’ont pas de valeur en 2026 ou n’ont aucune valeur : le statut actif ne peut donc pas être considéré fiable sans règle métier ;
- à partir du 8 mai 2026, seulement 39 à 41 lignes sont chargées par semaine, contre plus de 220 lignes dans les fichiers SEC ;
- le 3 juillet 2026, la base contient 41 fonds alors que le fichier officiel en contient 223 ;
- la base ne contient pas encore la semaine du 10 juillet 2026 ;
- pour les données Nigeria, `souscription` et `rachat` sont toujours vides ou égaux à zéro ;
- `actif_net` est un `varchar(255)` alors qu’il contient une mesure numérique ;
- 546 lignes, sur deux fonds, ont `value = 1000000` : vérifier si c’est une vraie valeur publiée ou une valeur sentinelle/erreur ;
- doublon de fonds compact évident : IDs 1219 et 2867 pour `GDL CANARYGROWTH FUND` / `GDL Canary Growth Fund`, avec périodes qui se chevauchent ;
- huit lignes de fonds ont un libellé de société différent du libellé maître rattaché par `societe_id` ; certaines différences peuvent être des changements historiques de marque et doivent être conservées comme alias datés, pas écrasées ;
- la chaîne normalisée `FBN CAPITAL ASSET MGT LIMITED` est rattachée à deux IDs de société différents : contrôler l’entité juridique et les alias avant toute fusion.

## Défaut critique de date et de mesure à confirmer

La base semble enregistrer les valeurs de la semaine précédente sous la date de la semaine suivante. Confirme ce défaut sur plusieurs fonds, catégories et années avant de corriger.

Exemples déjà rapprochés de la source officielle :

- `AFRINVEST DOLLAR FUND` : la ligne DB du 3 juillet 2026 contient `value = 118.9768` et `actif_net = 4 532 910 642.367836`, valeurs correspondant au bloc SEC du 26 juin 2026 ; le bloc SEC du 3 juillet publie un prix USD de `119.2832` et un actif net NGN différent ;
- `AIICO EUROBOND FUND` : la ligne DB du 3 juillet contient `106.8` et `5 577 867 511.537618`, correspondant au 26 juin ;
- `ARM EUROBOND FUND` : la ligne DB du 3 juillet contient `1.2354` et `17 574 167 842.98198`, correspondant au 26 juin ;
- `AFRINVEST EQUITY FUND` : la ligne DB du 13 janvier 2023 contient `value = 195.5378` et `actif_net = 406 789 044.36`, correspondant au bloc SEC du 6 janvier 2023. Le `195.5378` est l’Offer Price, pas la VL explicite.

Ne décale jamais toutes les dates aveuglément. Retrouve le document, la feuille, le bloc de colonnes, la date d’en-tête et la ligne source pour chaque correction. La bonne clé temporelle est la date explicitement portée par le bloc de mesures, pas la date du fichier ni la date maximale du rapport appliquée à toutes les colonnes.

## Sémantique financière obligatoire

Respecte les définitions suivantes :

- `net_assets_total` / actif net total : montant global du fonds. Ce n’est jamais une VL.
- `unit_price_nav` / VL explicite : prix par part uniquement lorsque l’en-tête source dit clairement `Unit Price`, `Unit Value` ou `VL`.
- `bid_price` : prix de rachat/bid publié. Il reste distinct de la VL.
- `offer_price` : prix de souscription/offer publié. Il reste distinct de la VL.
- `NGN` et `USD` : monnaies distinctes. Aucune conversion implicite et aucune comparaison sans devise.
- Si un fichier moderne ne publie que Bid et Offer, laisse `unit_price_nav` nul. Ne choisis pas silencieusement Bid ou Offer comme VL.
- Ne calcule `estimated_units = net_assets_total / unit_price_nav` que si les deux valeurs explicites ont la même devise et sont positives. Ne calcule rien à partir de Bid/Offer.
- Préserve les zéros publiés comme `SOURCE_ZERO`. Ne les transforme pas en valeurs manquantes.
- Ne remplace jamais une valeur manquante par une estimation silencieuse.

## Interprétation obligatoire des nombres et séparateurs

La lecture des nombres est une étape critique. N’utilise jamais une règle simpliste telle que « supprimer toutes les virgules » ou « supprimer tous les points ». Le séparateur décimal doit être identifié avant toute normalisation.

### Formats à reconnaître

Le parseur doit reconnaître, sans confusion :

- `1,234,567.89` : virgules de milliers, point décimal ;
- `1 234 567.89` : espaces de milliers, point décimal ;
- `1 234 567,89` : espaces de milliers, virgule décimale ;
- `1.234.567,89` : points de milliers, virgule décimale ;
- `1’234’567.89` et `1'234'567.89` : apostrophes de milliers ;
- `1234567.89` et `1234567,89` lorsqu’un seul séparateur est présent ;
- `(1,234.56)` : valeur négative comptable ;
- `-1 234,56` : valeur négative explicite ;
- `1.23E+09` : notation scientifique ;
- cellules Excel numériques, décimales, dates et formules avec résultat mis en cache ;
- `₦1,234.56`, `NGN 1 234,56`, `$1,234.56`, `USD 1,234.56` ;
- valeurs exprimées en unités, milliers, millions ou milliards lorsque l’en-tête le précise ;
- pourcentages comme `3.25%`, `3,25 %` et valeurs Excel déjà stockées sous forme `0.0325` avec format `%` ;
- espaces ordinaires, espaces insécables `U+00A0`, espaces fines insécables `U+202F` et caractères invisibles courants ;
- valeurs manquantes : cellule vide, `N/A`, `NA`, `NIL`, `NONE`, `ND`, `-`, `--` ;
- zéro réellement publié : `0`, `0.0`, `0,00`, qui ne doit pas devenir `NULL`.

### Détermination du séparateur décimal

Applique une logique explicite et testée :

1. Si une valeur est déjà numérique dans Excel, conserve sa valeur numérique native et son format de cellule ; ne reparcours pas la chaîne affichée comme si elle était du texte.
2. Si `.` et `,` sont présents, le dernier séparateur compatible avec le nombre de décimales est généralement le séparateur décimal ; valide aussi le groupement des milliers.
3. Si un seul type de séparateur est présent plusieurs fois, vérifie les groupes de trois chiffres avant de conclure qu’il s’agit de milliers.
4. Si un seul séparateur est présent une seule fois, utilise le contexte de la colonne, le format des autres cellules, l’en-tête, la devise et le nombre de chiffres après le séparateur. Une ambiguïté doit aller en `REVIEW`, pas être décidée arbitrairement.
5. Les espaces et apostrophes ne sont supprimés comme séparateurs de milliers qu’après validation du groupement.
6. Toute valeur contenant un suffixe `K`, `M`, `MN`, `MILLION`, `BN`, `BILLION` doit conserver l’échelle source et être convertie seulement selon une table explicite. Journalise le multiplicateur appliqué.
7. Ne mélange pas format linguistique et devise : une valeur NGN peut être écrite avec un format anglophone ou francophone.

### Traçabilité numérique

Pour chaque mesure importée, conserve ou rends récupérables :

- `raw_value` : valeur exacte de la cellule avant nettoyage ;
- `raw_cell_type` et, pour Excel, `number_format` ;
- `parsed_value` en `DECIMAL`, jamais en entier tronqué ;
- `currency_code` ;
- `scale_multiplier` ;
- `decimal_separator_detected` ;
- `thousands_separator_detected` ;
- `parse_rule` ou version du parseur ;
- `parse_status` : `OK`, `AMBIGUOUS`, `INVALID`, `SOURCE_ZERO`, `MISSING` ;
- document, feuille, cellule/ligne et en-tête source.

N’utilise pas `FLOAT`/`DOUBLE` pour les nouvelles colonnes financières si une précision décimale exacte est requise. Choisis des `DECIMAL(p,s)` capables de contenir les actifs nets les plus élevés et les prix unitaires les plus précis, après profilage des maxima réels. Ne modifie pas aveuglément les anciens types : ajoute des colonnes compatibles ou migre progressivement avec comparaison bit-à-bit ou tolérance documentée.

### Contrôles numériques

- Compare la valeur brute et la valeur parsée sur un échantillon de chaque format de fichier et de chaque année.
- Vérifie que le formatage n’a pas déplacé la virgule de 10, 100, 1 000 ou 1 000 000.
- Détecte les ruptures d’échelle par fonds et par date avec médiane, quantiles et ratios semaine/semaine.
- Une variation extrême n’est jamais corrigée automatiquement : rapproche-la de la cellule source et place-la en quarantaine si elle reste douteuse.
- Contrôle que les totaux d’actifs nets par catégorie concordent avec les feuilles de synthèse officielles dans une tolérance documentée.
- Vérifie que les devises et multiplicateurs expliquent les écarts entre colonnes NGN et USD ; ne déduis pas un taux de change si le fichier ne le permet pas explicitement.
- Ajoute des tests unitaires couvrant chacun des formats ci-dessus, y compris espaces insécables, parenthèses, pourcentages, notation scientifique, zéros et cellules Excel numériques.

## Méthode d’inventaire et de téléchargement

1. Parcours la page index et toutes les pages annuelles de `2011-weekly-nav-for-cis/` jusqu’à l’année courante.
2. Recueille uniquement les liens officiels `/documents/{document_id}/...`.
3. Construis un manifeste immuable avec : année de page, document SEC ID, titre, URL, page annuelle, extension, nom local, taille, SHA-256, statut de téléchargement et horodatage.
4. Accepte les formats PDF, XLS et XLSX. Rejette clairement les contenus HTML ou les fichiers vides déguisés en tableur.
5. Télécharge avec reprise et retries bornés. Ne retélécharge pas un fichier déjà présent avec même URL, taille et SHA-256.
6. Si un même document change de SHA-256, conserve les deux versions et crée un conflit de source ; n’écrase jamais silencieusement l’ancienne version.
7. Journalise les trois fichiers historiques corrompus. Utilise les valeurs historiques d’un rapport adjacent uniquement si le fonds, la date, la mesure, la devise et l’en-tête sont explicites.

## Détection des feuilles et des schémas

N’utilise jamais une position de colonne fixe globale. Détecte le type de fichier et la structure de chaque feuille.

### Fichiers XLS/XLSX historiques

- Inspecte toutes les feuilles et les 25 premières lignes pour localiser l’en-tête de données.
- Identifie les colonnes par libellés normalisés : série/SN, fonds, gestionnaire, NAV/Net Asset Value, Unit Price, Bid Price, Offer Price.
- Recherche les dates dans les lignes d’en-tête situées au-dessus de chaque bloc de mesures.
- Les fichiers peuvent contenir plusieurs blocs datés : extrait chaque bloc avec sa propre date.
- Les colonnes rappelant la semaine précédente sont utiles pour récupérer une période manquante, mais elles ne doivent jamais être enregistrées sous la date courante.

### Fichiers modernes à blocs larges

- Une même feuille peut contenir un bloc semaine N-1 puis un bloc semaine N, répétés horizontalement.
- Pour chaque ancre de date, détecte séparément : NAV total NGN, NAV total USD, Unit Price NGN/USD, Bid NGN/USD et Offer NGN/USD.
- Ne confonds pas `NAV ($)` ou `NAV (N)` avec un prix unitaire : ce sont des actifs nets totaux.
- Ne lis pas seulement les premières colonnes. Les fichiers 2026 peuvent dépasser 100 colonnes et contenir plusieurs semaines.
- La date de chaque observation vient de l’ancre du bloc où se trouve la valeur.

### PDF

- Extrais les tableaux page par page en conservant le numéro de page et le texte brut.
- Gère les ruptures de page et la répétition des en-têtes.
- N’invente jamais une identité de fonds. Toute ligne sans fonds résolu va en quarantaine `REVIEW` avec la page, le numéro de série et le texte source.

### Catégories

- Utilise une liste contrôlée des vrais en-têtes SEC : Equity Based, Money Market, Bond/Fixed Income, Dollar/Eurobond, Real Estate/REIT, Balanced/Mixed, Ethical, Shariah, Specialised, ETF, Infrastructure, etc.
- Une ligne non numérotée contenant simplement le nom d’un fonds n’est pas un en-tête de catégorie.
- Si l’en-tête de catégorie est absent dans le fichier, utilise la catégorie validée du fonds dans le référentiel avec provenance et date d’effet ; sinon laisse la catégorie à revoir.

## Harmonisation des fonds et sociétés de gestion

Ne considère pas la normalisation textuelle comme une identification juridique définitive.

1. Pour chaque nom brut, calcule au minimum : Unicode NFKD, suppression des accents, casse haute, `&` vers `AND`, espaces consolidés, ponctuation neutralisée et clé compacte sans espaces.
2. Rejette comme faux fonds les numéros isolés, lignes `TOTAL`, `SUB-TOTAL`, en-têtes, taux de change et notes.
3. Résous dans cet ordre : alias déjà validé ; identifiant réglementaire/ISIN/numéro d’agrément ; correspondance exacte nom + société ; correspondance compacte + société ; puis candidat fuzzy.
4. Une correspondance fuzzy ne doit jamais être fusionnée automatiquement lorsqu’elle change la société, la classe de parts, la devise, la catégorie ou une mention Institutional/Retail/Class A/Class B/Sub Fund.
5. Place les candidats ambigus dans une file de revue avec score, raisons et exemples source.
6. Conserve une table d’alias des fonds avec dates `first_seen`/`last_seen`, nom brut, clé normalisée, `fund_id`, société, confiance, source et statut de revue.
7. Conserve également les alias historiques de sociétés de gestion avec dates d’effet. Un changement de marque ne doit pas créer une nouvelle société si l’entité juridique reste la même ; une société différente ne doit pas être fusionnée sur similarité de nom.
8. Ne crée pas automatiquement un nouveau fonds à chaque variante. Ne réutilise pas non plus un ancien `fund_id` sans preuve.
9. La clé analytique minimale doit inclure `fund_id`, `valuation_date`, devise et, si nécessaire, classe de parts. Préserve les classes Retail, Institutional, A, B et les sous-fonds comme instruments distincts.

Commence par produire trois listes : correspondances certaines, correspondances probables à revoir et fonds réellement nouveaux. Corrige le doublon GDL uniquement après comparaison complète des valeurs et des métadonnées. En cas de fusion validée, déplace les valorisations dans une transaction, vérifie l’unicité, conserve un alias vers l’ID survivant et archive l’ID fusionné sans suppression définitive.

## Déduplication et conflits

- Grain attendu : une observation par fonds/instrument, date de valorisation et devise/type de prix.
- Pour les mêmes fonds/date/mesure, privilégie la publication où la date est le bloc courant du rapport, puis la source la plus complète, puis XLSX/XLS avant PDF.
- Une source peut compléter un champ nul d’une autre source seulement si les valeurs présentes ne se contredisent pas.
- Si deux publications donnent des valeurs différentes, conserve la valeur prioritaire mais enregistre toutes les variantes, documents, feuilles, lignes et en-têtes dans un audit de conflit.
- Aucune déduplication par simple `INSERT IGNORE` sans rapport de ce qui a été ignoré.

## Adaptation rétrocompatible de la base

Inspecte d’abord les modèles, migrations, services, API, calculs et composants frontend qui consomment `valorisations.value`, `actif_net`, `souscription` et `rachat`.

Le schéma actuel ne permet pas de prouver la nature de `value`. Propose la plus petite évolution additive permettant de stocker explicitement, sans ambiguïté :

- actif net total NGN et USD en type numérique suffisamment large ;
- VL/Unit Price NGN et USD ;
- Bid Price NGN et USD ;
- Offer Price NGN et USD ;
- devise primaire ;
- type du prix historique éventuellement recopié dans `value` ;
- document SEC ID, URL, fichier, feuille, ligne, date du rapport, date du bloc, en-têtes source ;
- statut qualité, conflit, import batch et horodatage.

Conserve temporairement les champs historiques pour la compatibilité. Si `value` doit rester alimenté pour le frontend, définis et documente sa règle : VL explicite en priorité ; sinon une valeur de présentation explicitement étiquetée par un champ `price_type`. Ne présente jamais cette valeur comme « VL » quand elle vient de Bid ou Offer. Ne remplis `souscription` et `rachat` qu’après vérification de leur sens dans le code : généralement Offer correspond à souscription et Bid à rachat, mais confirme les consommateurs avant de mapper.

Ajoute ou ajuste les index et contraintes uniques seulement après audit des doublons. Les migrations doivent avoir `up` et rollback sûr, être idempotentes et testées sur une copie.

## Stratégie de correction et de backfill

1. Crée une table ou zone de staging séparée de la production.
2. Lance un backfill en dry-run depuis 2011, par année puis par lots bornés.
3. Compare staging et production par fonds/date/mesure/devise.
4. Classe chaque ligne : identique, complément, correction prouvée, conflit, fonds inconnu, source illisible.
5. Ne touche pas aux lignes identiques.
6. Pour une correction prouvée, conserve avant/après, motif, source officielle et batch ID.
7. Ne corrige que le périmètre Nigeria.
8. Traite d’abord un échantillon représentatif : un fonds actions, monétaire, obligataire, dollar USD/NGN, REIT, ETF, Shariah et une classe de parts.
9. Valide le décalage de dates sur au moins trois années et plusieurs formats avant toute correction massive.
10. Après validation humaine, applique la correction dans une transaction ou des lots transactionnels réversibles.
11. Recalcule uniquement les performances, classements, conversions et indicateurs impactés, en respectant les dépendances existantes.

## Connexion directe et contrôlée à la base

Tu dois vérifier les données directement dans la base réelle `fund_opcvm` par le MCP, sans te limiter à des exports locaux ou à des hypothèses tirées du code.

### Pendant la Phase A

- Utilise exclusivement les outils SQL en lecture seule du MCP et uniquement des requêtes `SELECT`.
- Identifie la version MariaDB, les modèles, colonnes, index, contraintes, relations, migrations et consommateurs applicatifs.
- Calcule les comptages réels avant modification : fonds, sociétés, valorisations, dates, nulls, doublons, pays, catégories, devises et dernière date.
- Trace des exemples individuels depuis le document SEC jusqu’à la ligne SQL finale.
- Ne considère jamais qu’un script a réussi uniquement parce que son code retour est zéro : vérifie les données réellement produites.

### Avant toute écriture

- Obtiens la validation humaine prévue.
- Vérifie que l’outil ou le chemin d’écriture est explicitement autorisé par le MCP ; ne contourne jamais une limitation du bridge.
- Crée une sauvegarde logique ciblée des lignes Nigeria affectées, incluant fonds, sociétés, alias, valorisations et tables dépendantes.
- Enregistre le nombre de lignes et une somme de contrôle avant modification.
- Vérifie la restauration de la sauvegarde dans une zone isolée.
- Exécute d’abord les migrations et corrections sur une copie ou une table de staging.
- Produit le SQL ou les opérations exactes prévus, leur portée et leur rollback avant exécution.

### Pendant les écritures validées

- Utilise des transactions bornées et des lots limités.
- Toutes les requêtes d’UPDATE doivent filtrer explicitement le Nigeria, les IDs, les dates et le batch concerné ; aucun UPDATE sans WHERE précis.
- Aucun `DELETE` définitif. Préfère l’archivage, la désactivation ou les alias avec possibilité de restauration.
- Vérifie le nombre de lignes attendu après chaque lot. Si le nombre diffère, rollback immédiat et arrêt.
- N’autorise aucune écriture sur un autre pays, même indirectement par un recalcul global.

### Après écriture

- Rejoue tous les contrôles avant/après depuis la base réelle.
- Vérifie les clés étrangères, doublons, nulls, dates, montants, devises, historiques, fonds et sociétés.
- Conserve un journal d’audit réversible avec batch ID, ancien contenu, nouveau contenu, source et justification.

## Interdiction des modifications à l’aveugle

Une correction n’est autorisée que si elle satisfait simultanément les conditions suivantes :

1. la cellule ou ligne source officielle est identifiable ;
2. la date du bloc est explicitement lisible ;
3. le type de mesure et la devise sont explicites ;
4. le fonds et sa société sont résolus avec un niveau de confiance suffisant ;
5. la valeur parsée est reproductible à partir de la valeur brute ;
6. la valeur actuelle en base est différente ou manquante ;
7. la nouvelle valeur ne crée ni doublon ni rupture de relation ;
8. le changement est enregistré dans le rapport avant/après ;
9. le rollback de la ligne ou du lot est possible ;
10. les tests de non-régression concernés réussissent.

Il est interdit de :

- décaler toutes les dates d’une semaine sans preuve ligne par ligne ou règle de bloc démontrée ;
- remplacer toutes les `value` par Bid ou Offer ;
- fusionner tous les noms proches ;
- attribuer une société uniquement parce que son nom ressemble à celui du fonds ;
- remplacer les valeurs extrêmes par une moyenne ou une valeur voisine ;
- remplir les trous historiques par interpolation ;
- considérer automatiquement un fonds absent une semaine comme fermé ;
- considérer automatiquement tous les fonds de la base comme actifs ;
- modifier un champ historique sans vérifier tous ses consommateurs API, frontend et calculs.

Avant une opération massive, démontre la règle sur au moins : trois années, quatre structures de fichier, huit catégories de fonds, dix fonds et deux devises lorsqu’elles existent. Si la règle varie selon la période ou la structure, crée des parseurs versionnés séparés au lieu d’un correctif global.

## Import hebdomadaire idempotent

Réutilise le worker et l’ordonnanceur existants si cela est compatible ; ne crée pas un deuxième système parallèle sans nécessité.

- Ajoute une configuration de cadence explicite, par exemple `SEC_NIGERIA_IMPORT_CRON`, avec fuseau `Africa/Lagos`.
- Par défaut, contrôle la page de l’année courante une fois par semaine après la publication habituelle, avec retries quotidiens bornés si aucun nouveau fichier n’est présent. Ne traite jamais deux fois le même document/SHA.
- Étapes : découverte → manifeste → téléchargement → validation fichier → parsing → staging → contrôles → promotion transactionnelle → recalcul ciblé → rapport.
- Si la structure d’un fichier change, bloque sa promotion, marque `SCHEMA_DRIFT`, conserve le fichier et alerte ; ne charge pas des colonnes par position supposée.
- Un run sans nouveau fichier doit réussir proprement avec zéro écriture.
- Un run rejoué doit être idempotent : zéro doublon et zéro modification non justifiée.
- Journalise fichiers vus/téléchargés/lus, observations, fonds appariés/nouveaux/ambigus, inserts, mises à jour, conflits, rejets, dates min/max et durée.

## Contrôles obligatoires avant promotion

Produis un rapport chiffré et fais échouer la promotion si une règle critique n’est pas satisfaite :

- unicité de la clé métier ;
- présence de `fund_id`, date, mesure et devise pour toute ligne promue ;
- date du bloc comprise dans la période annoncée du rapport ;
- actif net et prix non négatifs sauf publication explicitement signalée ;
- actif net généralement supérieur au prix unitaire, avec quarantaine des exceptions ;
- absence de TOTAL/SUB-TOTAL/faux fonds ;
- couverture des sociétés de gestion et absence de jointure orpheline ;
- absence de mélange NGN/USD ;
- comparaison des nombres de fonds et lignes avec les semaines voisines ;
- alerte si le nombre de fonds baisse de plus de 10 % sans justification ;
- réconciliation des totaux de catégorie avec les feuilles `Market Share`, `NAV Comparison` ou `NAV Trend` lorsqu’elles existent ;
- conservation des conflits et de la provenance ;
- fraîcheur : dernière semaine officielle détectée = dernière semaine promue, sauf blocage documenté.

Tests de non-régression :

- tests unitaires de parsing pour au moins un PDF, un XLS ancien, un XLSX historique à blocs et un XLSX moderne 2026 ;
- fixtures anonymisées/minimales basées sur les en-têtes réels ;
- tests des dates N-1/N, devises, Bid/Offer/VL, zéros et parenthèses négatives ;
- tests d’alias, faux fonds, classes de parts et doublons ;
- tests de migration/rollback ;
- tests API existants et nouveaux ;
- build/typecheck/lint selon les commandes déjà prévues par le dépôt ;
- tests frontend ciblés prouvant qu’aucune page fonds, historique, performance, classement ou conversion n’est cassée ;
- comparaison avant/après des nombres de fonds et valorisations pour tous les pays afin de prouver que seul le Nigeria change.

## Séquence d’exécution obligatoire

### Phase A — audit en lecture seule

1. Affiche `git status -sb`, branche, HEAD, dernier commit et diff sans modifier l’état.
2. Lis la documentation et cartographie les modèles, migrations, importeurs, workers, cron, calculs et consommateurs frontend.
3. Inspecte `sec_ng_downloads/` sans suppression.
4. Rejoue les requêtes de contrôle de la base en SELECT seulement.
5. Analyse un échantillon des fichiers officiels de chaque format et période.
6. Produit : écarts confirmés, causes racines, champs affectés, volumes, risques, plan de correction, schéma cible minimal et rollback.
7. Arrête-toi et demande la validation humaine avec la phrase exacte : `VALIDER CORRECTIONS NIGERIA`.

### Phase B — implémentation après validation explicite

1. Vérifie à nouveau le statut Git et refuse de continuer si l’état a changé sans explication.
2. Crée les sauvegardes ciblées et vérifie qu’elles sont lisibles.
3. Implémente seulement les changements nécessaires sur la branche existante.
4. Exécute migrations sur copie, tests, dry-run, staging et rapport de comparaison.
5. Corrige les erreurs jusqu’à obtention de tous les contrôles critiques au vert.
6. Présente le diff, les fichiers modifiés, les migrations, les résultats des tests, les volumes avant/après et la commande de rollback.
7. Demande une seconde validation explicite avant promotion en production, redémarrage, commit, push ou déploiement.

### Phase C — Git, serveur et production après seconde validation explicite

Cette phase ne commence qu’après réception de la phrase exacte : `VALIDER DEPLOIEMENT NIGERIA`.

1. Recontrôle `git status -sb`, la branche, HEAD, le remote et les changements apparus depuis la Phase B.
2. Reste sur la branche existante `claude/code-review-improvements-ikvuj`. Ne crée et ne change aucune branche.
3. N’inclus dans le commit que les fichiers explicitement liés à la correction Nigeria. N’ajoute pas `logs.txt`, `0`, `sec_ng_downloads/`, `.mcp_logs/` ou d’autres modifications préexistantes sauf autorisation distincte.
4. Affiche le `git diff --stat`, le diff fonctionnel et la liste exacte des fichiers indexés avant le commit.
5. Lance une dernière fois les tests, le build, le typecheck et les contrôles de secrets prévus par le dépôt.
6. Crée un commit unique ou une série minimale de commits cohérents avec un message explicite. Aucun amendement de commits antérieurs et aucun force-push.
7. Pousse uniquement la branche existante vers son remote configuré. Ne pousse jamais vers `main` ou une autre branche par supposition.
8. Vérifie que le SHA distant correspond exactement au SHA local poussé.
9. Sur le serveur, utilise exclusivement les opérations contrôlées du MCP. N’utilise pas de shell libre ni de contournement.
10. Vérifie avant déploiement que le serveur se trouve toujours sur la branche autorisée et qu’aucune modification utilisateur nouvelle ne serait écrasée.
11. Si le serveur contient des changements non prévus, arrête-toi. Ne stash, ne pull, ne rebase et ne remplace rien automatiquement.
12. Crée et vérifie la sauvegarde finale de la base et des fichiers de configuration concernés.
13. Déploie le même SHA que celui vérifié sur le remote. Le SHA local, distant et serveur doit être identique.
14. Applique les migrations additives avant ou après le code uniquement selon l’ordre rétrocompatible établi pendant les tests.
15. Redémarre seulement les processus nécessaires, probablement `api-monolith` et/ou `worker-data-import`. Ne redémarre pas le frontend ou `worker-recalculation` sans nécessité démontrée.
16. Ne lance pas `pm2 update` et ne modifie pas la version globale de PM2.
17. Vérifie immédiatement les logs, la santé des processus, la disponibilité du site et l’absence de boucle de redémarrage.
18. Lance une recette de production en lecture seule puis un import Nigeria borné et idempotent.
19. Vérifie que le premier run importe uniquement les nouveautés/corrections attendues et qu’un second run immédiat produit zéro doublon et zéro écriture injustifiée.
20. Vérifie dans la base réelle les volumes, dates, fonds, sociétés, mesures, devises, conflits et provenance après promotion.
21. Teste sur le site au minimum : liste des fonds Nigeria, fiche fonds, historique de VL/prix, actif net, société de gestion, performances, classements, conversions et dernière date.
22. Compare les autres pays avant/après. Toute modification inattendue hors Nigeria déclenche le rollback.
23. Si un contrôle critique échoue, exécute le rollback préparé, restaure le service précédent, vérifie le retour à l’état initial et arrête-toi.
24. Si tout réussit, mets à jour `SUIVI.md`, `CHANGELOG.md` et `PRODUCTION_STATE.json` selon les conventions existantes, puis produis le rapport final.

### Critères de succès obligatoires

Tu ne peux annoncer « terminé », « corrigé », « complet » ou « sans régression » que si tous les critères suivants sont prouvés :

- aucune nouvelle branche créée ;
- branche locale, remote et serveur alignés sur le même SHA ;
- aucun fichier ou changement utilisateur préexistant perdu ;
- sauvegarde et rollback disponibles et vérifiés ;
- migrations additives réussies ;
- tous les tests pertinents réussis ;
- site et processus sains après déploiement ;
- aucune donnée hors Nigeria modifiée ;
- aucune perte de fonds ou de valorisations sans justification officielle ;
- aucune duplication de la clé métier ;
- dernière date SEC correctement détectée et promue ;
- actif net, VL explicite, Bid, Offer et devises séparés ;
- nombres interprétés avec séparateurs, échelles et formats contrôlés ;
- noms de fonds et sociétés résolus ou placés en revue, sans fusion hasardeuse ;
- conflits et sources intégralement auditables ;
- second import idempotent sans doublon ;
- rapport avant/après, résultats de recette et rollback fournis.

S’il reste un seul contrôle critique non vérifié, le statut final doit être `À REVOIR` ou `BLOQUÉ`, jamais `TERMINÉ`.

## Livrables attendus

- diagnostic de couverture et qualité des données Nigeria ;
- matrice de correspondance fonds et sociétés : certain / à revoir / nouveau ;
- manifeste des sources et journal d’import ;
- rapport des erreurs de dates et de classification de prix ;
- migration additive et rollback, si nécessaire ;
- importeur historique et hebdomadaire idempotent ;
- tests et fixtures ;
- rapport avant/après avec comptages, dates, nulls, doublons et conflits ;
- rapport d’interprétation des formats numériques et des valeurs ambiguës ;
- preuve d’alignement des SHA Git local, remote et serveur ;
- rapport de déploiement, recette et idempotence hebdomadaire ;
- mise à jour de `SUIVI.md` et `CHANGELOG.md` uniquement après implémentation validée ;
- aucune nouvelle branche, aucune suppression non autorisée, aucune régression.

Commence maintenant uniquement par la Phase A en lecture seule. N’annonce jamais que les données sont complètes ou corrigées sans fournir les preuves chiffrées, les tests et la comparaison avec les fichiers SEC officiels.
