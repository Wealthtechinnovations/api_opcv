const { sequelize, performences_eurs, performences_usds } = require('../db/sequelize');

// Le calcul de rang lui-meme vit dans `ranking.pure.js`, sans aucun `require`
// vers la base. Deplacement pur du 2026-10-07 : aucune signature ni aucune
// ligne de logique n a change, et tout est re-exporte a l identique en bas de
// ce fichier, donc aucun appelant n est touche.
//
// Raison : `check_doc_drift.js` travaille en `mysql2` brut et ne peut pas
// charger ce fichier-ci, qui ouvre une connexion des son premier `require`.
// Sans module pur, le controle « les rangs correspondent-ils aux
// performances ? » devrait REECRIRE le tri — et un controle qui reimplemente
// ce qu il verifie ne verifie rien.
const {
  LOWER_IS_BETTER,
  PERF_PERIODS,
  PERF_PERIODS_FULL,
  PERF_PERIODS_FULL_DEV,
  rankFundInList,
  buildRankResult,
} = require('./ranking.pure');

// Les tables performences_eurs/usds contiennent plusieurs dates par fond.
// On ne garde que la derniere date par fond pour eviter de gonfler les totaux
// de classement (doublons) et fausser les rangs.
function keepLatestPerFund(rows) {
  const byFund = new Map();
  for (const r of rows) {
    const prev = byFund.get(r.fond_id);
    if (!prev || new Date(r.date) > new Date(prev.date)) {
      byFund.set(r.fond_id, r);
    }
  }
  return Array.from(byFund.values());
}

async function calculateRankNational(category, fundId, date) {
  // Sans categorie, la requete ci-dessous compare `categorie_nationale = NULL`,
  // qui n est JAMAIS vrai en SQL : le jeu de resultats est vide, `selectedFund`
  // est introuvable et la fonction rend deja l erreur « Fond non trouve ». La
  // garde ne change donc AUCUN resultat — elle evite seulement une analyse
  // complete de `performences` par fonds sans categorie, a chaque run de
  // classement. C est une economie, pas une correction, et il faut le dire
  // ainsi plutot que de laisser croire a un defaut repare.
  if (!category) return { error: 'Fond non trouvé.' };

  // Chaque fond est compare a sa derniere performance disponible (MAX(date) par fond),
  // comme pour le classement regional/global. L'ancien filtre `date = :date` fixe
  // excluait la quasi-totalite des pairs (dernieres VL a des dates differentes),
  // laissant le classement national vide. Le parametre `date` est conserve pour
  // compatibilite de signature mais n'est plus utilise.
  const fundsWithPerformance = await sequelize.query(`
    SELECT p1.fond_id, ${PERF_PERIODS_FULL.map(p => `p1.${p}`).join(', ')}
    FROM performences p1
    INNER JOIN (
      SELECT fond_id, MAX(date) as max_date
      FROM performences
      WHERE categorie_nationale = :category
      GROUP BY fond_id
    ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
    WHERE p1.categorie_nationale = :category
  `, {
    replacements: { category },
    type: sequelize.QueryTypes.SELECT,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS_FULL) };
}

async function calculateRankRegional(category, fundId) {
  // Meme raison, meme absence d effet numerique que dans `calculateRankNational` :
  // `categorie_fundafrica_regionale = NULL` n est jamais vrai.
  if (!category) return { error: 'Fond non trouvé.' };

  const fundsWithPerformance = await sequelize.query(`
    SELECT p1.fond_id, ${PERF_PERIODS.map(p => `p1.${p}`).join(', ')}
    FROM performences p1
    INNER JOIN (
      SELECT fond_id, MAX(date) as max_date
      FROM performences
      WHERE categorie_fundafrica_regionale = :category
      GROUP BY fond_id
    ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
    WHERE p1.categorie_fundafrica_regionale = :category
  `, {
    replacements: { category },
    type: sequelize.QueryTypes.SELECT,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankGlobal(category, fundId) {
  if (!category) return { error: 'Pas de categorie globale FundAfrica.' };

  const fundsWithPerformance = await sequelize.query(`
    SELECT p1.fond_id, ${PERF_PERIODS.map(p => `p1.${p}`).join(', ')}
    FROM performences p1
    INNER JOIN (
      SELECT fond_id, MAX(date) as max_date
      FROM performences
      WHERE categorie_fundafrica_globale = :category
      GROUP BY fond_id
    ) p2 ON p1.fond_id = p2.fond_id AND p1.date = p2.max_date
    WHERE p1.categorie_fundafrica_globale = :category
  `, {
    replacements: { category },
    type: sequelize.QueryTypes.SELECT,
  });

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { code: 404, error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankNationalDev(category, fundId, devise) {
  // Sans garde, category=null devient WHERE categorie_nationale IS NULL (Sequelize)
  // et le fond serait classe parmi le groupe des fonds SANS categorie — classement absurde.
  if (!category) return { error: 'Pas de categorie nationale.' };

  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const rows = await model.findAll({
    where: { categorie_nationale: category },
    attributes: ['fond_id', 'date', ...PERF_PERIODS_FULL_DEV],
    limit: 10000,
  });
  const fundsWithPerformance = keepLatestPerFund(rows);

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS_FULL_DEV) };
}

async function calculateRankRegionalDev(category, fundId, devise) {
  // Meme garde que calculateRankGlobalDev : category=null deviendrait IS NULL et
  // classerait le fond parmi les fonds sans categorie regionale (ex bug fonds 2863-2881
  // affiches "6/18" au lieu d'un classement regional reel).
  if (!category) return { error: 'Pas de categorie regionale FundAfrica.' };

  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const rows = await model.findAll({
    where: { categorie_fundafrica_regionale: category },
    attributes: ['fond_id', 'date', ...PERF_PERIODS],
    limit: 10000,
  });
  const fundsWithPerformance = keepLatestPerFund(rows);

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

async function calculateRankGlobalDev(category, fundId, devise) {
  if (!category) return { error: 'Pas de categorie globale FundAfrica.' };

  const model = devise === 'EUR' ? performences_eurs : performences_usds;
  const rows = await model.findAll({
    where: { categorie_fundafrica_globale: category },
    attributes: ['fond_id', 'date', ...PERF_PERIODS],
    limit: 10000,
  });
  const fundsWithPerformance = keepLatestPerFund(rows);

  const selectedFund = fundsWithPerformance.find((f) => f.fond_id === fundId);
  if (!selectedFund) return { error: 'Fond non trouvé.' };

  return { code: 200, data: buildRankResult(fundsWithPerformance, fundId, category, PERF_PERIODS) };
}

module.exports = {
  rankFundInList,
  buildRankResult,
  calculateRankNational,
  calculateRankRegional,
  calculateRankGlobal,
  calculateRankNationalDev,
  calculateRankRegionalDev,
  calculateRankGlobalDev,
  PERF_PERIODS,
  PERF_PERIODS_FULL,
  PERF_PERIODS_FULL_DEV,
  LOWER_IS_BETTER,
};
