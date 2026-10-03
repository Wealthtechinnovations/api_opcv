/**
 * CONTRAT D ECRITURE DES VALORISATIONS — point de passage unique.
 *
 * POURQUOI CE MODULE EXISTE
 * -------------------------
 * Audit du 2026-08-13/15 : sur onze ecrivains de `valorisations`, un seul
 * renseignait la qualification de la mesure. Le schema doctrinal existe
 * (54 colonnes : `currency_code`, `price_type`, `sec_document_id`,
 * `data_quality`, `correction_batch`...), un batch de rattrapage l a rempli une
 * fois, mais aucun ecrivain de production ne l alimentait. La qualification se
 * degradait donc a chaque execution de cron.
 *
 * Consequence mesuree (#73) : 44 fonds portent des series melangeant deux
 * echelles. Preuve arithmetique sur le fonds 1141 — `bid_price_usd` va de
 * 117,51 a 119,75, `value` de 160 435 a 165 207, et 117,51 x 1371,2 = 161 130.
 * `value` contenait le prix en dollars converti en naira : le chargeur avait
 * pris la colonne « Bid Price (NGN) » sur une serie en « Bid Price (USD) ».
 *
 * Point d entree precis du defaut, cote Nigeria :
 *   `currency_code: row.currency_code || 'NGN'`
 * Un defaut silencieux vers NGN transforme un fonds dollar en fonds naira sans
 * qu aucune trace ne subsiste. Ce module interdit ce genre de repli.
 *
 * REGLE METIER ACTEE PAR L UTILISATEUR (2026-08-15)
 * ------------------------------------------------
 * **La devise du fonds fait foi.** La serie canonique d un fonds est exprimee
 * dans sa devise de libelle (`fond_investissements.dev_libelle`). Une mesure
 * dont la devise contredit celle du fonds n a pas sa place dans la serie.
 *
 * Corollaire : on ne CONVERTIT jamais pour faire entrer une valeur dans la
 * serie. Les publications officielles donnent les deux colonnes ; on choisit
 * la bonne. Un taux se lit, il ne se fabrique pas.
 *
 * DEUX MODES, POUR UN DEPLOIEMENT PROGRESSIF
 * ------------------------------------------
 *   `warn`   (defaut) — n empeche aucune insertion, mais qualifie chaque ligne
 *                       et marque les manquements dans `data_quality`. Aucun
 *                       risque de regression : un import qui passait passe
 *                       encore. C est le mode de mise en service.
 *   `strict`          — rejette les lignes non conformes. A activer seulement
 *                       une fois le mode `warn` observe en production et les
 *                       anomalies traitees.
 *
 * Passer directement en `strict` casserait les imports des pays dont les
 * chargeurs ne fournissent pas encore la devise — c est-a-dire tous sauf un.
 */

'use strict';

/** Colonnes de qualification ajoutees par le contrat, dans cet ordre. */
const CONTRACT_COLUMNS = [
  'currency_code',
  'price_type',
  'data_quality',
  'correction_batch',
  'source_url',
  'sec_document_id',
  'report_date',
];

/** Types de prix reconnus. Une VL explicite n est pas un Bid ni un Offer. */
const PRICE_TYPES = new Set(['UNIT_PRICE', 'BID', 'OFFER', 'NAV_TOTAL']);

/** Statuts de qualite, du plus sain au plus douteux. */
const QUALITY = {
  OK: 'OK',                              // conforme au contrat
  UNQUALIFIED: 'UNQUALIFIED',            // devise ou type de prix absent
  CURRENCY_MISMATCH: 'CURRENCY_MISMATCH', // devise != devise du fonds
  REVIEW: 'REVIEW',                      // a instruire (variation extreme, etc.)
};

/**
 * Identifiant de lot, pour rendre tout import reversible.
 * Exemple : SECNG_20260815_204512
 */
function makeBatchId(prefix) {
  const t = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  return `${String(prefix || 'IMPORT').toUpperCase()}_${t.slice(0, 8)}_${t.slice(8)}`;
}

/**
 * Confronte une mesure au contrat.
 *
 * @param {object} row   { currency_code, price_type, source_url, sec_document_id, report_date }
 * @param {object} fund  { id, dev_libelle } — le fonds tel qu il est en base
 * @param {object} opts  { mode: 'warn' | 'strict' }
 * @returns {{ accepted: boolean, quality: string, reasons: string[] }}
 */
function validate(row, fund, opts = {}) {
  const mode = opts.mode === 'strict' ? 'strict' : 'warn';
  const reasons = [];
  let quality = QUALITY.OK;

  const devise = row.currency_code ? String(row.currency_code).trim().toUpperCase() : null;
  const type = row.price_type ? String(row.price_type).trim().toUpperCase() : null;
  const deviseFonds = fund && fund.dev_libelle ? String(fund.dev_libelle).trim().toUpperCase() : null;

  // 1. La devise doit etre PORTEE par la mesure, jamais deduite ni supposee.
  if (!devise) {
    reasons.push('devise absente — aucun repli par defaut n est autorise');
    quality = QUALITY.UNQUALIFIED;
  }

  // 2. Le type de prix doit etre explicite. Un Bid n est pas une VL.
  if (!type) {
    reasons.push('type de prix absent');
    if (quality === QUALITY.OK) quality = QUALITY.UNQUALIFIED;
  } else if (!PRICE_TYPES.has(type)) {
    reasons.push(`type de prix inconnu : ${type}`);
    if (quality === QUALITY.OK) quality = QUALITY.UNQUALIFIED;
  }

  // 3. La devise de la mesure doit etre celle du fonds. C est la regle qui
  //    aurait empeche #73 : une valeur en NGN sur un fonds USD est refusee,
  //    au lieu d etre inseree silencieusement dans la serie.
  if (devise && deviseFonds && devise !== deviseFonds) {
    reasons.push(
      `devise de la mesure (${devise}) differente de celle du fonds ${fund.id} (${deviseFonds}) — ` +
      'choisir la colonne publiee dans la devise du fonds, ne jamais convertir'
    );
    quality = QUALITY.CURRENCY_MISMATCH;
  }

  // 4. La provenance doit permettre de rejouer la decision plus tard.
  if (!row.source_url && !row.sec_document_id) {
    reasons.push('aucune provenance (ni URL ni identifiant de document)');
    if (quality === QUALITY.OK) quality = QUALITY.UNQUALIFIED;
  }

  // En mode `warn`, seule une contradiction de devise bloque : elle produit une
  // donnee fausse, alors qu une qualification incomplete ne fait que degrader
  // la tracabilite.
  const accepted = mode === 'strict'
    ? quality === QUALITY.OK
    : quality !== QUALITY.CURRENCY_MISMATCH;

  return { accepted, quality, reasons };
}

/**
 * Valeurs a inserer pour CONTRACT_COLUMNS, dans le meme ordre.
 * A concatener aux valeurs metier de l INSERT existant.
 */
function contractValues(row, quality, batchId) {
  return [
    row.currency_code ? String(row.currency_code).trim().toUpperCase() : null,
    row.price_type ? String(row.price_type).trim().toUpperCase() : null,
    quality,
    batchId || null,
    row.source_url || null,
    row.sec_document_id || null,
    row.report_date || null,
  ];
}

/** Fragment SQL des colonnes du contrat, pour completer un INSERT existant. */
function contractColumnsSql() {
  return CONTRACT_COLUMNS.join(', ');
}

/** Placeholders correspondants. */
function contractPlaceholders() {
  return CONTRACT_COLUMNS.map(() => '?').join(', ');
}

/**
 * Charge la devise de reference des fonds concernes.
 * Une seule requete, pour eviter un aller-retour par ligne.
 */
async function loadFundCurrencies(conn, fundIds) {
  const ids = [...new Set(fundIds)].filter(Boolean);
  if (!ids.length) return new Map();
  const [rows] = await conn.query(
    'SELECT id, dev_libelle FROM fond_investissements WHERE id IN (?)',
    [ids]
  );
  return new Map(rows.map(r => [r.id, { id: r.id, dev_libelle: r.dev_libelle }]));
}

/** Compte-rendu lisible, a joindre au rapport d import. */
function summarize(results) {
  const par = {};
  for (const r of results) par[r.quality] = (par[r.quality] || 0) + 1;
  const refuses = results.filter(r => !r.accepted).length;
  const lignes = Object.entries(par)
    .sort((a, b) => b[1] - a[1])
    .map(([q, n]) => `${q}: ${n}`);
  return `contrat — ${results.length} mesures | ${lignes.join(' · ')} | refusees: ${refuses}`;
}

module.exports = {
  CONTRACT_COLUMNS,
  PRICE_TYPES,
  QUALITY,
  makeBatchId,
  validate,
  contractValues,
  contractColumnsSql,
  contractPlaceholders,
  loadFundCurrencies,
  summarize,
};
