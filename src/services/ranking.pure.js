/**
 * Le calcul de rang, sans base de donnees.
 *
 * POURQUOI CE FICHIER EXISTE. `check_doc_drift.js` doit pouvoir verifier que
 * les rangs stockes correspondent aux performances stockees (controle C12).
 * Il travaille en `mysql2` brut, sans Sequelize : il ne peut pas charger
 * `ranking.service.js`, qui ouvre une connexion des son premier `require`
 * (`require('../db/sequelize')` en tete de fichier). Jusqu ici la seule option
 * etait de REECRIRE le tri dans le controle — et un controle qui reimplemente
 * ce qu il verifie ne verifie rien : il compare deux implementations, dont
 * l une n a jamais servi en production.
 *
 * Ce module est un DEPLACEMENT PUR, sans aucun changement de comportement :
 *   - aucune signature modifiee ;
 *   - aucune ligne de logique modifiee ;
 *   - `ranking.service.js` re-exporte tout a l identique, donc tout appelant
 *     existant continue de fonctionner sans etre touche ;
 *   - deja couvert par `tests/ranking.service.test.js`.
 *
 * Ce fichier ne doit JAMAIS acquerir de `require` vers la base, un modele ou
 * une route. C est sa seule raison d etre.
 */

// Les periodes ou une valeur PLUS BASSE est meilleure : une volatilite, une
// perte maximale, un beta baissier et un DSR se classent a l envers des
// performances.
const LOWER_IS_BETTER = new Set([
  'pertemax3an', 'betabaissier3an', 'volatility3an', 'dsr3an',
]);

const PERF_PERIODS = ['perf3m', 'perf6m', 'perf1an', 'perf3ans', 'perf5ans', 'ytd'];

const PERF_PERIODS_FULL = [
  ...PERF_PERIODS,
  'perfveille', 'perfveillem',
  'perf3mm', 'perf6mm', 'perf1anm', 'perf3ansm', 'perf5ansm', 'ytdm',
  'volatility3an', 'ratiosharpe3an', 'pertemax3an', 'sortino3an',
  'info3an', 'calamar3an', 'var953an', 'betabaissier3an', 'omega3an', 'dsr3an',
];

const PERF_PERIODS_FULL_DEV = [
  ...PERF_PERIODS,
  'perfveille',
  'volatility3an', 'ratiosharpe3an', 'pertemax3an', 'sortino3an',
  'info3an', 'calamar3an', 'var953an', 'betabaissier3an', 'omega3an', 'dsr3an',
];

function rankFundInList(fundsWithPerformance, fundId, period) {
  const validPerformances = fundsWithPerformance.filter(
    (f) => f[period] != null && f[period] != '-'
  );
  if (validPerformances.length === 0) return [null, 0];

  if (LOWER_IS_BETTER.has(period)) {
    validPerformances.sort((a, b) => a[period] - b[period]);
  } else {
    validPerformances.sort((a, b) => b[period] - a[period]);
  }

  const rank = validPerformances.findIndex((f) => f.fond_id === fundId) + 1;
  return [rank, validPerformances.length];
}

function buildRankResult(fundsWithPerformance, fundId, category, periods) {
  const data = { ranktotal: fundsWithPerformance.length, category };
  const names = {
    perf3m: '3Mois', perf6m: '6Mois', perf1an: '1An',
    perf3ans: '3Ans', perf5ans: '5Ans', ytd: '1erJanvier',
    perfveille: 'veille', perfveillem: 'veillem',
    perf3mm: '3Moism', perf6mm: '6Moism', perf1anm: '1Anm',
    perf3ansm: '3Ansm', perf5ansm: '5Ansm', ytdm: '1erJanvierm',
    volatility3an: 'volatilite', ratiosharpe3an: 'sharpe', pertemax3an: 'pertemax',
    sortino3an: 'sortino', info3an: 'info', calamar3an: 'calamar',
    var953an: 'var95', betabaissier3an: 'betabaissier', omega3an: 'omega', dsr3an: 'dsr',
  };

  const totalNames = {
    perf3mm: '3Moistotalm', perf6mm: '6Moistotalm', perf1anm: '1Antotalm',
    perf3ansm: '3Anstotalm', perf5ansm: '5Anstotalm', ytdm: '1erJanviertotalm',
  };

  for (const period of periods) {
    const [rank, total] = rankFundInList(fundsWithPerformance, fundId, period);
    const name = names[period] || period;
    data[`rank${name}`] = rank;
    data[`rank${totalNames[period] || (name + 'total')}`] = total;
  }
  return data;
}

module.exports = {
  LOWER_IS_BETTER,
  PERF_PERIODS,
  PERF_PERIODS_FULL,
  PERF_PERIODS_FULL_DEV,
  rankFundInList,
  buildRankResult,
};
