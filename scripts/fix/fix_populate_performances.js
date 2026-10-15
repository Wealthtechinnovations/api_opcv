/**
 * Calcule et insere les performances pour la DATE LA PLUS RECENTE
 * de chaque fond actif. Calcul DIRECT en SQL+JS sans passer par l'API.
 *
 * L'ancienne version appelait /api/performanceswithdate qui crash
 * pour 96% des fonds. Cette version fait tout le calcul localement.
 *
 * Pour chaque fond:
 *   1. Recupere les VL triees par date ASC
 *   2. Calcule les perfs glissantes (veille, 4s, 3m, 6m, YTD, 1an..10an)
 *   3. INSERT/UPDATE dans la table performences
 *
 * Usage: node fix_populate_performances.js
 * Options:
 *   --pays NIGERIA     : un seul pays
 *   --fond 1141        : un seul fond
 *   --force            : recalculer meme si une perf recente existe deja
 *   --dry-run          : n ecrit RIEN et compare au contenu de la table
 *   --limit N          : s arrete apres N fonds
 *   --sans-ratios      : n appelle pas l endpoint de ratios (comportement
 *                        d avant le 2026-10-07 — issue de secours si l API
 *                        locale ne repond pas ; les colonnes de ratios sont
 *                        alors omises, donc preservees en UPDATE)
 *
 * POURQUOI --dry-run A ETE AJOUTE (2026-10-05). Ce script est le pendant direct
 * de `fix_populate_performances_eur_usd.js`, que le cron appelle chaque soir en
 * etape 8/9 — d ou des performances EUR/USD a jour au 02/10. Les performances
 * LOCALES, elles, passent encore par `/api/saveperfdatemysql/:a/:b`, une route
 * qui emet une requete HTTP interne par fonds ET par date vers sa propre API :
 * elle sort en HTTP 000 sur le lot 601-1200 et laisse le Maroc a 122 jours de
 * retard, pour 3,1 % de fonds a jour. Brancher ce script a la place de la route
 * est la correction evidente — mais remplacer un calcul valide par un autre sans
 * avoir verifie qu ils donnent les MEMES chiffres serait exactement la
 * substitution silencieuse que ce depot interdit. `--dry-run` existe pour rendre
 * cette verification possible : il affiche ce qui serait ecrit et le compare
 * champ par champ a ce que la table contient deja.
 *
 * Le defaut reste l ECRITURE, a l inverse des autres scripts du depot. C est
 * delibere : ce script ecrit depuis sa creation, et basculer son defaut
 * changerait en silence le comportement de tout appelant que je ne vois pas.
 *
 * POURQUOI LES RATIOS ONT ETE AJOUTES (2026-10-07). RECTIFICATION. J ai ecrit
 * le 2026-10-06, apres un dry-run concluant, que « la substitution est neutre,
 * equivalence verifiee ». C etait faux en PORTEE, et le dry-run ne pouvait pas
 * le voir : il ne comparait que dix champs de performance.
 *
 *   route `saveperfdatemysql`  ≈ 84 colonnes, dont 63 de ratios, obtenues par
 *                              `/api/ratiosnewithdate/{1,3,5}`
 *                              (apigestionsavequotidien.js:1377-1396 et 1470)
 *   ce script, avant ce jour   15 colonnes, et AUCUN ratio
 *
 * Or `src/services/ranking.service.js:9-15` : `PERF_PERIODS_FULL` contient
 * `volatility3an, ratiosharpe3an, pertemax3an, sortino3an, info3an, calamar3an,
 * var953an, betabaissier3an, omega3an, dsr3an`. Et ce script INSERE une ligne a
 * la derniere date de VL : elle devient la ligne `MAX(date)`, celle que lisent
 * le classement, les moyennes de categorie et les tableaux pays. Le brancher
 * sans les ratios aurait gueri le retard des performances en VIDANT les rangs
 * de risque — « chiffres justes et colonnes vides » au lieu de « chiffres
 * plausibles et faux ». C est la substitution que ce depot interdit.
 *
 * Trois decisions, et la raison de chacune :
 *
 *  1. ON NE RECALCULE PAS LES RATIOS EN SQL. Le script appelle le MEME endpoint
 *     que la route. Recalculer serait substituer un calcul neuf a un calcul
 *     valide. Le vice de la route n est pas « elle fait du HTTP », c est
 *     « par fonds ET par date, sur toutes les dates depuis 2020, dans le
 *     processus qui sert deja la requete ». Ici : un appel par fonds et par
 *     derniere date — exactement le motif que
 *     `fix_populate_performances_eur_usd.js:28-66` tient en production depuis
 *     septembre.
 *
 *  2. UNE PERIODE DONT L APPEL ECHOUE N EST PAS ECRITE DU TOUT. La route, elle,
 *     ecrit `'-'` (`getRatioDataFields` : `data ? data[field] : '-'`). En
 *     UPDATE cela ECRASE des ratios valides par une valeur d absence des que
 *     l API ne repond pas. Omettre la colonne preserve l existant : plus sur
 *     que la route, et jamais destructeur. En INSERT, la colonne reste NULL —
 *     valeur d absence du pendant EUR/USD, sur les memes colonnes, depuis un
 *     mois.
 *
 *  3. LE SEUIL D HISTORIQUE EST COPIE A L IDENTIQUE : `years > 1`, `> 3`, `> 5`
 *     avec `years = DATEDIFF(MAX(date), MIN(date)) / 365`, comme
 *     `anneevalorisation` (apigestionsavequotidien.js:301) et `fetchRatioData`.
 *     Un fonds de deux ans n a donc que les ratios 1 an, comme aujourd hui.
 *
 * LE CRITERE DE BASCULE A ETE REDEFINI (2026-10-15), PARCE QUE L ANCIEN ETAIT
 * INATTEIGNABLE. Le plan exigeait « 0 divergence sur 84 colonnes ». Le dry-run
 * etendu a tourne : il a sorti « 10 divergents » — et aucun de ces dix ecarts
 * n etait un desaccord de valeur. Tous etaient de la forme
 * `calcule=4,06 / stocke=null` : des colonnes de ratios que ce script remplit
 * desormais et que la table n a pas. Le critere condamnait donc l amelioration
 * en meme temps que le defaut, et il ne pouvait jamais etre satisfait.
 *
 * Le dry-run classe maintenant chaque colonne dans l une de quatre classes :
 *
 *   IDENTIQUE  les deux cotes ont une valeur, ecart sous tolerance
 *   DIVERGENT  les deux cotes ont une valeur, ecart au-dessus  → EXIGE : 0
 *   COMBLE     le script a une valeur, la table est vide       → attendu
 *   PERDU      la table a une valeur, le script n en a pas     → EXIGE : 0
 *
 * `DIVERGENT = 0` est la garantie d equivalence : la ou les deux calculs ont un
 * chiffre, c est le meme. `PERDU = 0` est la garantie de non-destruction, et
 * c est elle qui manquait a l ancien critere. Les deux sont atteignables, et
 * verifiables sans interpretation.
 *
 * CE QUE LE PLAN DEMANDAIT ET QUI N A PAS ETE FAIT : ecrire
 * `lastdatepreviousmonth`. Verification faite, `src/models/performence.js` ne
 * DECLARE PAS cette colonne ; Sequelize ignore silencieusement un attribut non
 * declare, donc la route ne l ecrit jamais malgre les apparences
 * (apigestionsavequotidien.js:1439). L ecrire ici CREERAIT une divergence au
 * lieu d en supprimer une. `diag_perf_colonnes_manquantes.js` verifie en base
 * si la colonne existe seulement.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const http = require('http');

const API_PORT = process.env.PORT || 3005;

// Les 19 champs de ratios que la route recopie telle quelle, dans l ordre de
// `getRatioDataFields` (apigestionsavequotidien.js:1470). `r2` et `alphaJensen`
// sont a part : leur nom de colonne ne suit pas la meme regle.
const CHAMPS_RATIO = ['perfannu', 'volatility', 'ratiosharpe', 'pertemax', 'sortino',
  'info', 'calamar', 'var99', 'var95', 'trackingerror', 'betahaussier',
  'betabaissier', 'beta', 'omega', 'dsr', 'downcapture', 'upcapture',
  'skewness', 'kurtosis'];

// Les trois periodes, avec le seuil d historique qui conditionne l appel —
// strictement celui de `fetchRatioData` (apigestionsavequotidien.js:1378-1392).
const PERIODES_RATIO = [
  { annee: 1, suffixe: '1an', seuil: 1 },
  { annee: 3, suffixe: '3an', seuil: 3 },
  { annee: 5, suffixe: '5an', seuil: 5 },
];

// Les colonnes dont la valeur n a de sens que si l historique couvre l horizon.
// Elles servent au dry-run a distinguer deux choses que l ancien critere
// confondait : le script qui PERD une valeur, et le script qui REFUSE d en
// inventer une. La garde `valeurSiHorizonCouvert` rend `null` sur un horizon
// non couvert ; sans cette table, ce `null` serait compte comme une perte.
const HORIZON_PAR_COLONNE = {
  perf1an: 1, perf1anm: 1,
  perf3ans: 3, perf3ansm: 3,
  perf5ans: 5, perf5ansm: 5,
  perf8ans: 8, perf8ansm: 8,
  perf10ans: 10, perf10ansm: 10,
};

// Les colonnes de ratios que lit le classement local (ranking.service.js:9-15).
// Listees ici pour que le dry-run les signale nommement : ce sont celles dont
// l absence vide les rangs de risque.
const RATIOS_DU_CLASSEMENT = ['volatility3an', 'ratiosharpe3an', 'pertemax3an',
  'sortino3an', 'info3an', 'calamar3an', 'var953an', 'betabaissier3an',
  'omega3an', 'dsr3an'];

// Une valeur de ratio exploitable, ou null. Reprend `ratioNum` de
// `fix_populate_performances_eur_usd.js:20` : les colonnes sont declarees DOUBLE
// et un NaN ou la chaine '-' n y a pas de sens.
function nombreRatio(v) {
  if (v === null || v === undefined || v === '-') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Appelle `/api/ratiosnewithdate/:annee/:fond/:date` — le MEME endpoint que la
 * route — et rend les colonnes de la periode.
 *
 * Rend `{ ok: false }` sur echec, timeout, HTTP non 200, JSON invalide ou
 * `data` absent. L appelant omet alors ces colonnes : jamais de valeur
 * d absence ecrite par-dessus un ratio valide.
 */
function appelerRatios(fondId, dateStr, periode) {
  return new Promise((resolve) => {
    const chemin = `/api/ratiosnewithdate/${periode.annee}/${fondId}/${dateStr}`;
    const req = http.get({ host: '127.0.0.1', port: API_PORT, path: chemin, timeout: 60000 }, (resp) => {
      let corps = '';
      resp.on('data', (c) => { corps += c; });
      resp.on('end', () => {
        if (resp.statusCode !== 200) { resolve({ ok: false, raison: `HTTP ${resp.statusCode}` }); return; }
        try {
          const json = JSON.parse(corps);
          const d = json && json.data;
          if (!d) { resolve({ ok: false, raison: 'data absent' }); return; }
          const colonnes = {};
          for (const champ of CHAMPS_RATIO) colonnes[`${champ}${periode.suffixe}`] = nombreRatio(d[champ]);
          colonnes[`r2_${periode.suffixe}`] = nombreRatio(d.r2);
          colonnes[`alpha${periode.suffixe}`] = nombreRatio(d.alphaJensen);
          resolve({ ok: true, colonnes });
        } catch (e) {
          resolve({ ok: false, raison: `JSON invalide (${e.message})` });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, raison: `erreur reseau (${e.code || e.message})` }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, raison: 'timeout 60 s' }); });
  });
}

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { pays: null, fondId: null, force: false, dryRun: false, limit: null, ratios: true };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pays' && args[i + 1]) opts.pays = args[++i];
    else if (args[i] === '--fond' && args[i + 1]) opts.fondId = parseInt(args[++i]);
    else if (args[i] === '--force') opts.force = true;
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--limit' && args[i + 1]) opts.limit = parseInt(args[++i]);
    else if (args[i] === '--sans-ratios') opts.ratios = false;
  }
  return opts;
}

function perf(current, previous) {
  if (!previous || previous === 0 || current == null || previous == null) return null;
  if (current === previous) return 0;
  return ((current - previous) / previous) * 100;
}

function findValueAtDate(dates, values, targetDate) {
  const targetTs = targetDate.getTime();
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i].getTime();
    if (d <= targetTs) {
      const diff = targetTs - d;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
      break;
    }
  }
  if (bestIdx === -1 && dates.length > 0) {
    bestIdx = 0;
  }
  return bestIdx >= 0 ? values[bestIdx] : null;
}

function findValueAtYearsAgo(dates, values, lastDate, years) {
  const target = new Date(lastDate);
  target.setFullYear(target.getFullYear() - years);
  return findValueAtDate(dates, values, target);
}

/**
 * La valeur a N annees, MAIS SEULEMENT si l historique couvre reellement N
 * annees. Sinon `null`.
 *
 * POURQUOI CETTE GARDE EXISTE, ET CE QU ELLE CORRIGE. `findValueAtDate`
 * ci-dessus se termine par :
 *
 *     if (bestIdx === -1 && dates.length > 0) { bestIdx = 0; }
 *
 * c est-a-dire : faute de VL a la date visee, elle retombe sur la PLUS ANCIENNE
 * valeur disponible. Consequence mesuree sur la production le 2026-10-15 :
 *
 *   [1543] SOAGA EPARGNE ACTIVE — 1 528 VL, du 2016-10-28 au 2024-11-01,
 *   soit 8,01 ans d historique. AUCUNE VL a dix ans ou avant.
 *   Et pourtant : perf10ans calcule = 20,4574.
 *
 * Ce chiffre est une performance mesuree sur huit ans et presentee comme une
 * performance dix ans. La route fait la meme chose : sur la ligne MAX(date) de
 * ce fonds, elle stocke perf8ans = 19,7076 ET perf10ans = 19,7076 — deux
 * horizons differents, un seul chiffre, donc le meme repli sur la plus ancienne
 * valeur.
 *
 * **565 fonds** sont dans ce cas : historique de moins de dix ans et un
 * `perf10ans` tout de meme renseigne. Ce n est pas un cas isole, c est une
 * classe de defaut.
 *
 * `CLAUDE.md` l interdit en ces termes : « Ne jamais inventer : benchmark,
 * donnee financiere, taux de change, **performance**, categorie, historique. »
 * Une performance dix ans sur huit ans d historique est une performance
 * inventee. Rendre `null` n est pas une perte d information : c est le retrait
 * d une information fausse.
 *
 * CE QUE CELA PRODUIRA DANS LE DRY-RUN, ET QU IL NE FAUDRA PAS MAL LIRE. La
 * table contient aujourd hui les chiffres fabriques par la route. Ecrire `null`
 * la ou elle a un nombre fait apparaitre ces colonnes en **PERDU** au sens du
 * critere a quatre classes. C est voulu : le script ne perd pas une valeur, il
 * refuse d en inventer une. Le critere doit donc etre lu en distinguant un
 * PERDU sur une colonne d horizon non couvert — attendu, souhaite — d un PERDU
 * sur une colonne dont l horizon est couvert, qui serait lui un vrai defaut.
 *
 * `findValueAtDate` n est PAS modifiee : elle sert aussi aux horizons courts
 * (veille, quatre semaines, trois et six mois, premier janvier), ou le repli
 * joue un autre role. Changement cible, pas global.
 */
function valeurSiHorizonCouvert(dates, values, lastDate, years) {
  if (!dates.length) return null;
  const target = new Date(lastDate);
  target.setFullYear(target.getFullYear() - years);
  // La plus ancienne VL est-elle anterieure ou egale a la date visee ? Si non,
  // l horizon n est pas couvert et il n y a rien a mesurer.
  if (dates[0].getTime() > target.getTime()) return null;
  return findValueAtDate(dates, values, target);
}

/** Meme garde, pour les horizons calcules depuis la fin du mois precedent. */
function valeurSiHorizonCouvertPourDate(dates, values, refDate, years) {
  if (!dates.length) return null;
  const target = new Date(refDate);
  target.setFullYear(target.getFullYear() - years);
  if (dates[0].getTime() > target.getTime()) return null;
  return findValueAtDate(dates, values, target);
}

function findValueAtMonthsAgo(dates, values, lastDate, months) {
  const target = new Date(lastDate);
  target.setMonth(target.getMonth() - months);
  return findValueAtDate(dates, values, target);
}

function findValueAtWeeksAgo(dates, values, lastDate, weeks) {
  const target = new Date(lastDate);
  target.setDate(target.getDate() - weeks * 7);
  return findValueAtDate(dates, values, target);
}

function findValueAtJanuary1(dates, values, lastDate) {
  const year = lastDate.getFullYear();
  const jan1 = new Date(year, 0, 1);
  return findValueAtDate(dates, values, jan1);
}

function findLastDateOfPreviousMonth(dates, values, lastDate) {
  const prevMonthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth(), 0);
  return findValueAtDate(dates, values, prevMonthEnd);
}

function findValueAtJanuary1ForDate(dates, values, refDate) {
  const year = refDate.getFullYear();
  const jan1 = new Date(year, 0, 1);
  return findValueAtDate(dates, values, jan1);
}

function findValueAtWeeksAgoForDate(dates, values, refDate, weeks) {
  const target = new Date(refDate);
  target.setDate(target.getDate() - weeks * 7);
  return findValueAtDate(dates, values, target);
}

function findValueAtMonthsAgoForDate(dates, values, refDate, months) {
  const target = new Date(refDate);
  target.setMonth(target.getMonth() - months);
  return findValueAtDate(dates, values, target);
}

function findValueAtYearsAgoForDate(dates, values, refDate, years) {
  const target = new Date(refDate);
  target.setFullYear(target.getFullYear() - years);
  return findValueAtDate(dates, values, target);
}

async function run() {
  const opts = parseArgs();
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a la base fund_opcvm');
  console.log(`Options: pays=${opts.pays || 'TOUS'}, force=${opts.force}`
    + `, mode=${opts.dryRun ? 'DRY-RUN (aucune ecriture)' : 'ECRITURE'}`
    + (opts.limit ? `, limit=${opts.limit}` : ''));

  let fondQuery = `
    SELECT f.id, f.nom_fond, f.pays, f.code_ISIN, f.dev_libelle,
           f.categorie_globale, f.categorie_national, f.categorie_regional,
           f.categorie_fundafrica_regionale, f.categorie_fundafrica_globale
    FROM fond_investissements f
    WHERE f.active = 1 AND f.id IN (SELECT DISTINCT fund_id FROM valorisations)
  `;
  const fondParams = [];
  if (opts.fondId) {
    fondQuery += ' AND f.id = ?';
    fondParams.push(opts.fondId);
  } else if (opts.pays) {
    fondQuery += ' AND LOWER(f.pays) = LOWER(?)';
    fondParams.push(opts.pays);
  }
  fondQuery += ' ORDER BY f.pays, f.id';

  const [fonds] = await conn.execute(fondQuery, fondParams);
  console.log(`${fonds.length} fonds a traiter\n`);

  let processed = 0, inserted = 0, updated = 0, skipped = 0, errors = 0;
  let dryIdentiques = 0, dryDifferents = 0, dryAbsents = 0;
  // Decompte des divergences PAR COLONNE : un total global dirait « ca
  // diverge » sans dire ou, et c est precisement ce qui a permis de croire a
  // une equivalence qui ne portait que sur dix champs.
  const divergencesParColonne = {};
  // QUATRE CLASSES, ET NON UN COMPTEUR BINAIRE. Le dry-run livre le 2026-10-07
  // comparait bien les ~90 colonnes, mais il rangeait tout ecart dans
  // « divergent » — et sa sortie disait « 10 divergents » alors qu AUCUN ecart
  // n etait un desaccord de valeur : tous etaient de la forme
  // `calcule=4,06 / stocke=null`, c est-a-dire des colonnes de ratios que le
  // script remplit desormais et que la table n a pas. Le critere « 0 divergence
  // sur 84 colonnes » exige par le plan ne pouvait donc JAMAIS etre atteint :
  // il condamnait l amelioration en meme temps que le defaut.
  //
  //   IDENTIQUE : les deux cotes ont une valeur, ecart sous tolerance
  //   DIVERGENT : les deux cotes ont une valeur, ecart au-dessus → DOIT ETRE 0
  //   COMBLE    : le script a une valeur, la table est vide → attendu, souhaite
  //   PERDU     : la table a une valeur, le script n en a pas → DOIT ETRE 0
  //
  // `PERDU = 0` est la garantie de non-destruction, et c est elle qui manquait.
  // `DIVERGENT = 0` est la garantie d equivalence. Les deux sont atteignables
  // et verifiables.
  const comblesParColonne = {};
  const perdusParColonne = {};
  let dryCombles = 0, dryPerdus = 0;
  // REFUSE : le script rend `null` parce que l horizon n est pas couvert par
  // l historique, alors que la table porte un chiffre que la route a fabrique.
  // Ce n est PAS une perte : c est le retrait d une performance inventee.
  // 565 fonds sont dans ce cas pour `perf10ans` (mesure du 2026-10-15).
  const refusesParColonne = {};
  let dryRefuses = 0;
  let colonnesComparees = 0;
  let ratiosEchoues = 0;
  // Fonds dont au moins un des dix ratios lus par le classement local ne
  // serait pas ecrit (periode non atteinte ou appel echoue) : ce sont eux dont
  // les rangs de risque resteraient vides.
  let fondsSansRatiosClassement = 0;
  const byPays = {};

  for (let i = 0; i < fonds.length; i++) {
    const f = fonds[i];
    const pays = f.pays || 'INCONNU';

    try {
      const [vlRows] = await conn.execute(
        'SELECT date, value FROM valorisations WHERE fund_id = ? AND value > 0 ORDER BY date ASC',
        [f.id]
      );

      if (vlRows.length < 2) { skipped++; continue; }

      const dates = vlRows.map(r => new Date(r.date));
      const values = vlRows.map(r => parseFloat(r.value));
      const lastDate = dates[dates.length - 1];
      const latestDateStr = lastDate.toISOString().slice(0, 10);

      if (!opts.force) {
        const [existing] = await conn.execute(
          'SELECT id, date FROM performences WHERE fond_id = ? ORDER BY date DESC LIMIT 1',
          [f.id]
        );
        if (existing.length > 0 && String(existing[0].date).slice(0, 10) === latestDateStr) {
          skipped++;
          continue;
        }
      }

      const lastValue = values[values.length - 1];
      const prevValue = values[values.length - 2];

      // Performances glissantes a date
      const perfVeille = perf(lastValue, prevValue);
      const perf4s = perf(lastValue, findValueAtWeeksAgo(dates, values, lastDate, 4));
      const ytd = perf(lastValue, findValueAtJanuary1(dates, values, lastDate));
      const perf3m = perf(lastValue, findValueAtMonthsAgo(dates, values, lastDate, 3));
      const perf6m = perf(lastValue, findValueAtMonthsAgo(dates, values, lastDate, 6));
      const perf1an = perf(lastValue, valeurSiHorizonCouvert(dates, values, lastDate, 1));
      const perf3ans = perf(lastValue, valeurSiHorizonCouvert(dates, values, lastDate, 3));
      const perf5ans = perf(lastValue, valeurSiHorizonCouvert(dates, values, lastDate, 5));
      const perf8ans = perf(lastValue, valeurSiHorizonCouvert(dates, values, lastDate, 8));
      const perf10ans = perf(lastValue, valeurSiHorizonCouvert(dates, values, lastDate, 10));

      // Performances glissantes fin de mois precedent
      const prevMonthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth(), 0);
      const prevMonthValue = findLastDateOfPreviousMonth(dates, values, lastDate);

      let perfveillem = null, perf4sm = null, ytdm = null, perf3mm = null, perf6mm = null;
      let perf1anm = null, perf3ansm = null, perf5ansm = null, perf8ansm = null, perf10ansm = null;

      if (prevMonthValue != null) {
        // Find the value just before prevMonthEnd for "veille"
        const prevMonthPrevDay = new Date(prevMonthEnd);
        prevMonthPrevDay.setDate(prevMonthPrevDay.getDate() - 1);
        const prevMonthPrevValue = findValueAtDate(dates, values, prevMonthPrevDay);
        perfveillem = perf(prevMonthValue, prevMonthPrevValue);
        perf4sm = perf(prevMonthValue, findValueAtWeeksAgoForDate(dates, values, prevMonthEnd, 4));
        ytdm = perf(prevMonthValue, findValueAtJanuary1ForDate(dates, values, prevMonthEnd));
        perf3mm = perf(prevMonthValue, findValueAtMonthsAgoForDate(dates, values, prevMonthEnd, 3));
        perf6mm = perf(prevMonthValue, findValueAtMonthsAgoForDate(dates, values, prevMonthEnd, 6));
        perf1anm = perf(prevMonthValue, valeurSiHorizonCouvertPourDate(dates, values, prevMonthEnd, 1));
        perf3ansm = perf(prevMonthValue, valeurSiHorizonCouvertPourDate(dates, values, prevMonthEnd, 3));
        perf5ansm = perf(prevMonthValue, valeurSiHorizonCouvertPourDate(dates, values, prevMonthEnd, 5));
        perf8ansm = perf(prevMonthValue, valeurSiHorizonCouvertPourDate(dates, values, prevMonthEnd, 8));
        perf10ansm = perf(prevMonthValue, valeurSiHorizonCouvertPourDate(dates, values, prevMonthEnd, 10));
      }

      // Ratios. `years` reproduit `anneevalorisation` : DATEDIFF(MAX, MIN)/365
      // sur les VL deja chargees — aucune requete de plus.
      const years = (lastDate.getTime() - dates[0].getTime()) / (365 * 86400000);
      const colonnesRatio = {};
      const periodesEchouees = [];
      if (opts.ratios) {
        for (const periode of PERIODES_RATIO) {
          // Seuil STRICTEMENT celui de `fetchRatioData` : `years > seuil`.
          if (!(years > periode.seuil)) continue;
          const r = await appelerRatios(f.id, latestDateStr, periode);
          if (r.ok) Object.assign(colonnesRatio, r.colonnes);
          else periodesEchouees.push(`${periode.suffixe}: ${r.raison}`);
        }
      }

      // Upsert. En dry-run on relit TOUTES les colonnes que l on ecrirait, et
      // pas seulement l id ni les dix champs de performance : c est l erreur de
      // portee du 2026-10-06, et la comparaison large est ce qui la corrige.
      const [existingPerf] = await conn.execute(
        'SELECT * FROM performences WHERE fond_id = ? AND date = ?',
        [f.id, latestDateStr]
      );

      const perfValues = {
        fond_id: f.id,
        code_ISIN: f.code_ISIN,
        categorie: f.categorie_globale,
        categorie_nationale: f.categorie_national,
        categorie_regionale: f.categorie_regional,
        categorie_fundafrica_regionale: f.categorie_fundafrica_regionale || null,
        categorie_fundafrica_globale: f.categorie_fundafrica_globale || null,
        devise: f.dev_libelle,
        date: latestDateStr,
        ytd, perfveille: perfVeille,
        perf1an, perf3ans, perf5ans, perf8ans, perf10ans,
        perf4s, perf3m, perf6m,
        ytdm, perfveillem,
        perf1anm, perf3ansm, perf5ansm, perf8ansm, perf10ansm,
        perf4sm, perf3mm, perf6mm,
        // Uniquement les periodes dont l appel a REUSSI. Une periode absente
        // de cet objet n est ni mise a jour ni inseree : son contenu existant
        // est preserve tel quel.
        ...colonnesRatio,
      };

      if (opts.dryRun) {
        // Comparaison sur TOUTES les colonnes que l on ecrirait — performances
        // ET ratios — et non sur dix champs choisis. Deux tolerances, parce que
        // les deux familles de grandeurs ne sont pas de meme nature :
        //   - une performance est un pourcentage : au-dela d un centieme de
        //     point, les deux calculs ne disent plus la meme chose ;
        //   - un ratio de Sharpe ou un beta vaut quelques unites : la meme
        //     tolerance absolue y serait beaucoup plus severe, donc on la
        //     prend relative, a un pour mille.
        const TOLERANCE_PERF = 0.01;
        const TOLERANCE_RATIO_REL = 0.001;
        const estRatio = (c) => /(1an|3an|5an)$/.test(c) && !/^perf(veille|[0-9])/.test(c);

        if (!existingPerf.length) {
          console.log(`  [${f.id}] ${f.nom_fond} (${pays}) date=${latestDateStr} — ABSENT en base, serait INSERE`
            + ` (${Object.keys(colonnesRatio).length} colonnes de ratios obtenues`
            + `, historique ${years.toFixed(1)} ans)`);
          dryAbsents++;
        } else {
          const stocke = existingPerf[0];
          const ecarts = [];
          let nbCombles = 0, nbRefuses = 0;
          // `date` et `fond_id` sont la cle de la comparaison, pas son objet.
          for (const c of Object.keys(perfValues)) {
            if (c === 'fond_id' || c === 'date') continue;
            if (!(c in stocke)) { ecarts.push(`${c}: COLONNE ABSENTE de la table`); continue; }
            const calc = perfValues[c];
            const base = stocke[c];
            const vide = v => v === null || v === undefined || v === '-' || v === '';

            // Colonnes de categorie, devise, ISIN : comparaison de chaines.
            if (typeof calc === 'string' || typeof base === 'string') {
              if (vide(calc) && vide(base)) continue;
              if (String(calc) !== String(base)) ecarts.push(`${c}: calcule=${calc} stocke=${base}`);
              continue;
            }
            if (vide(calc) && vide(base)) continue;
            // COMBLE : le script apporte une valeur ou la table n avait rien.
            // C est l effet VOULU de l ajout des ratios, pas une divergence.
            if (vide(base)) {
              comblesParColonne[c] = (comblesParColonne[c] || 0) + 1;
              nbCombles++;
              continue;
            }
            if (vide(calc)) {
              // REFUSE ou PERDU ? La question est : l historique de ce fonds
              // couvre-t-il l horizon de cette colonne ? S il ne le couvre pas,
              // le `null` est le refus delibere d inventer un chiffre, et la
              // valeur stockee est celle que la route a fabriquee en retombant
              // sur la plus ancienne VL. S il le couvre, c est une vraie perte.
              const horizon = HORIZON_PAR_COLONNE[c];
              if (horizon != null && years < horizon) {
                refusesParColonne[c] = (refusesParColonne[c] || 0) + 1;
                nbRefuses++;
                continue;
              }
              perdusParColonne[c] = (perdusParColonne[c] || 0) + 1;
              ecarts.push(`${c}: PERDU — calcule=${calc} stocke=${base}`);
              continue;
            }
            const a = Number(calc), b = Number(base);
            const ecart = Math.abs(a - b);
            const depasse = estRatio(c)
              ? ecart > Math.max(Math.abs(b) * TOLERANCE_RATIO_REL, 1e-6)
              : ecart > TOLERANCE_PERF;
            if (depasse) {
              ecarts.push(`${c}: calcule=${a.toFixed(6)} stocke=${b.toFixed(6)}`);
              divergencesParColonne[c] = (divergencesParColonne[c] || 0) + 1;
            }
          }
          colonnesComparees = Math.max(colonnesComparees, Object.keys(perfValues).length - 2);

          // Le fonds est classe par sa PIRE classe : un seul desaccord de
          // valeur ou une seule perte suffit a le sortir du vert.
          if (nbCombles) dryCombles += nbCombles;
          if (nbRefuses) dryRefuses += nbRefuses;
          if (ecarts.length) {
            const perdus = ecarts.filter(e => e.includes('PERDU')).length;
            console.log(`  [${f.id}] ${f.nom_fond} (${pays}) date=${latestDateStr}`
              + ` — ${ecarts.length} ecart(s) dont ${perdus} PERDU`
              + (nbCombles ? `, ${nbCombles} colonne(s) comblee(s)` : '')
              + (periodesEchouees.length ? ` | ratios non obtenus : ${periodesEchouees.join(', ')}` : ''));
            for (const e of ecarts.slice(0, 8)) console.log(`        ${e}`);
            if (ecarts.length > 8) console.log(`        … et ${ecarts.length - 8} autre(s)`);
            if (perdus) dryPerdus += perdus;
            dryDifferents++;
          } else if (nbCombles || nbRefuses) {
            console.log(`  [${f.id}] ${f.nom_fond} (${pays}) date=${latestDateStr}`
              + ` — 0 divergence`
              + (nbCombles ? `, ${nbCombles} COMBLEE(S)` : '')
              + (nbRefuses ? `, ${nbRefuses} REFUSEE(S) (horizon non couvert, historique ${years.toFixed(1)} ans)` : ''));
            dryIdentiques++;
          } else {
            dryIdentiques++;
          }
        }
        if (periodesEchouees.length) ratiosEchoues += periodesEchouees.length;
        if (RATIOS_DU_CLASSEMENT.some(c => !(c in perfValues))) fondsSansRatiosClassement++;
        processed++;
        if (!byPays[pays]) byPays[pays] = 0;
        byPays[pays]++;
        if (opts.limit && processed >= opts.limit) { console.log(`\n  limite de ${opts.limit} fonds atteinte`); break; }
        continue;
      }

      if (existingPerf.length > 0) {
        const sets = Object.keys(perfValues).filter(k => k !== 'fond_id' && k !== 'date')
          .map(k => `\`${k}\` = ?`).join(', ');
        const vals = Object.keys(perfValues).filter(k => k !== 'fond_id' && k !== 'date')
          .map(k => perfValues[k]);
        await conn.execute(
          `UPDATE performences SET ${sets} WHERE fond_id = ? AND date = ?`,
          [...vals, f.id, latestDateStr]
        );
        updated++;
      } else {
        const cols = Object.keys(perfValues).map(k => `\`${k}\``).join(', ');
        const placeholders = Object.keys(perfValues).map(() => '?').join(', ');
        const vals = Object.values(perfValues);
        await conn.execute(
          `INSERT INTO performences (${cols}) VALUES (${placeholders})`,
          vals
        );
        inserted++;
      }

      if (periodesEchouees.length) ratiosEchoues += periodesEchouees.length;
      if (RATIOS_DU_CLASSEMENT.some(c => !(c in perfValues))) fondsSansRatiosClassement++;
      processed++;
      if (!byPays[pays]) byPays[pays] = 0;
      byPays[pays]++;

      if (opts.limit && processed >= opts.limit) {
        console.log(`  limite de ${opts.limit} fonds atteinte`);
        break;
      }

      if ((i + 1) % 50 === 0 || i === fonds.length - 1) {
        console.log(`  [${i + 1}/${fonds.length}] ${f.nom_fond} (${pays}) date=${latestDateStr}`);
      }
    } catch (err) {
      errors++;
      console.error(`  [ERROR] ${f.nom_fond} (${f.id}): ${err.message}`);
    }
  }

  console.log('\n==========================================');
  console.log('=== RAPPORT PEUPLAGE PERFORMANCES ===');
  console.log('==========================================');
  if (opts.dryRun) {
    console.log('--- DRY-RUN : comparaison avec la table performences ---');
    console.log(`Colonnes comparees par fonds : ${colonnesComparees}`
      + ' (performances ET ratios — le dry-run du 2026-10-06 n en comparait que dix,'
      + ' d ou une equivalence affirmee a tort)');
    console.log(`Fonds sans aucun desaccord : ${dryIdentiques}`);
    console.log(`Fonds avec desaccord       : ${dryDifferents}`);
    console.log(`Fonds absents en base      : ${dryAbsents}`);
    console.log('');
    const parCol = (titre, obj) => {
      const l = Object.entries(obj).sort((a, b) => b[1] - a[1]);
      if (!l.length) { console.log(`--- ${titre} : aucune ---`); return; }
      console.log(`--- ${titre} ---`);
      for (const [c, n] of l) console.log(`  ${c.padEnd(22)} ${n} fonds`);
    };
    // DIVERGENT : les deux cotes ont une valeur et elles ne concordent pas.
    // C est le seul ecart qui remet en cause l equivalence des deux calculs.
    parCol('DIVERGENT — desaccord de valeur (doit etre vide)', divergencesParColonne);
    console.log('');
    // PERDU : la table avait une valeur, le script n en produit pas. C est la
    // seule forme destructrice de la substitution.
    parCol('PERDU — la table avait une valeur, le script non (doit etre vide)', perdusParColonne);
    console.log('');
    // COMBLE : attendu et souhaite. C est l effet de l ajout des ratios.
    parCol('COMBLE — le script remplit une colonne vide (attendu)', comblesParColonne);
    console.log('');
    // REFUSE : compte a part, et surtout PAS avec les pertes. La table porte un
    // chiffre que la route a fabrique en retombant sur la plus ancienne VL ; le
    // script rend `null` parce que l horizon n est pas couvert. Confondre les
    // deux reviendrait a traiter le retrait d un faux chiffre comme une
    // regression, et donc a bloquer la correction au nom de la prudence.
    parCol('REFUSE — horizon non couvert par l historique (attendu, corrige un faux chiffre)', refusesParColonne);

    const nbDivergent = Object.values(divergencesParColonne).reduce((a, b) => a + b, 0);
    console.log(`\n=== CRITERE DE BASCULE, sur ${colonnesComparees} colonnes comparees ===`);
    console.log(`  DIVERGENT : ${nbDivergent} (exige : 0)`);
    console.log(`  PERDU     : ${dryPerdus} (exige : 0)`);
    console.log(`  COMBLE    : ${dryCombles} (attendu non nul : les ratios que la table n a pas)`);
    console.log(`  REFUSE    : ${dryRefuses} (attendu non nul : les horizons que l historique ne couvre pas)`);
    console.log(nbDivergent === 0 && dryPerdus === 0
      ? '  → CRITERE ATTEINT. Les deux calculs donnent les memes chiffres la ou'
        + ' les deux en ont un, et le script ne fait perdre aucune valeur existante.'
        + ' La substitution est non destructrice sur ce perimetre.'
      : '  → CRITERE NON ATTEINT. Ne pas brancher le calcul direct : expliquer'
        + ' chaque DIVERGENT et chaque PERDU, colonne par colonne, d abord.');
    console.log('');
  }
  if (opts.ratios) {
    console.log(`Appels de ratios echoues     : ${ratiosEchoues}`
      + ' (periode non ecrite, contenu existant preserve)');
  } else {
    console.log('Ratios : NON appeles (--sans-ratios) — colonnes de ratios omises,'
      + ' donc preservees en UPDATE et laissees NULL en INSERT.');
  }
  console.log(`Fonds sans les 10 ratios du classement : ${fondsSansRatiosClassement}`
    + ' — leurs rangs de risque resteraient vides (historique < 3 ans, ou appel echoue)');
  console.log(`Fonds traites:    ${processed}`);
  console.log(`Inseres:          ${inserted}`);
  console.log(`Mis a jour:       ${updated}`);
  console.log(`Ignores:          ${skipped}`);
  console.log(`Erreurs:          ${errors}`);
  console.log('\n=== PAR PAYS ===');
  for (const [pays, count] of Object.entries(byPays).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pays}: ${count} fonds`);
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
