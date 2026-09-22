'use strict';

const { AllocationDataError } = require('./preparation');

const FUND_ATTRIBUTES = Object.freeze([
  'id',
  'nom_fond',
  'code_ISIN',
  'active',
  'periodicite',
  'dev_libelle',
  'societe_gestion',
  'societe_id',
  'pays',
  'region',
  'categorie_globale',
  'categorie_fundafrica_locale',
  'categorie_fundafrica_regionale',
  'categorie_fundafrica_globale',
  'classification',
  'type_investissement',
  'frais_gestion',
  'minimum_investissement',
]);

const VALUATION_ATTRIBUTES = Object.freeze([
  'fund_id',
  'date',
  'value',
  'value_EUR',
  'value_USD',
  'dividende',
  'dividende_EUR',
  'dividende_USD',
  'vl_ajuste',
  'vl_ajuste_EUR',
  'vl_ajuste_USD',
]);

function issue(path, code, message, meta) {
  return {
    path,
    code,
    message,
    ...(meta ? { meta } : {}),
  };
}

function normalizeIds(fundIds) {
  if (!Array.isArray(fundIds) || !fundIds.length) {
    throw new AllocationDataError(issue('fund_ids', 'FUND_IDS_REQUIRED', 'Une liste de fonds est requise.'));
  }

  const ids = [...new Set(fundIds.map(Number))];
  if (ids.some(id => !Number.isInteger(id) || id <= 0)) {
    throw new AllocationDataError(issue('fund_ids', 'INVALID_FUND_ID', 'Chaque fund_id doit etre un entier positif.'));
  }
  return ids;
}

function createAllocationDataProvider({
  fundModel,
  valuationModel,
  Op,
}) {
  if (!fundModel || typeof fundModel.findAll !== 'function') {
    throw new TypeError('fundModel.findAll is required');
  }
  if (!valuationModel || typeof valuationModel.findAll !== 'function') {
    throw new TypeError('valuationModel.findAll is required');
  }
  if (!Op || Op.in === undefined || Op.gte === undefined || Op.lte === undefined) {
    throw new TypeError('Sequelize Op.in/Op.gte/Op.lte are required');
  }

  async function loadFundMaster(fundIds) {
    const ids = normalizeIds(fundIds);
    const rows = await fundModel.findAll({
      attributes: [...FUND_ATTRIBUTES],
      where: {
        id: { [Op.in]: ids },
        active: 1,
      },
      raw: true,
    });

    const byId = new Map((rows || []).map(row => [Number(row.id), row]));
    const missing = ids.filter(id => !byId.has(id));
    if (missing.length) {
      throw new AllocationDataError(issue(
        'fund_master',
        'FUND_NOT_ACTIVE_OR_MISSING',
        'Certains fonds demandes sont absents ou inactifs dans le Fund Master.',
        { fund_ids: missing }
      ));
    }

    return ids.map(id => byId.get(id));
  }

  async function loadValuations({ fundIds, dateFrom, dateTo }) {
    const ids = normalizeIds(fundIds);
    const date = {};
    if (dateFrom) date[Op.gte] = dateFrom;
    if (dateTo) date[Op.lte] = dateTo;

    const where = {
      fund_id: { [Op.in]: ids },
    };
    if (Object.keys(date).length) where.date = date;

    const rows = await valuationModel.findAll({
      attributes: [...VALUATION_ATTRIBUTES],
      where,
      order: [
        ['fund_id', 'ASC'],
        ['date', 'ASC'],
      ],
      raw: true,
      // Intentionally no limit: horizon/date predicates define the dataset.
    });

    const grouped = Object.fromEntries(ids.map(id => [String(id), []]));
    for (const row of rows || []) {
      const id = Number(row.fund_id);
      if (grouped[String(id)]) grouped[String(id)].push(row);
    }

    return grouped;
  }

  async function load({ fundIds, dateFrom = null, dateTo = null }) {
    const ids = normalizeIds(fundIds);
    const [funds, valuationsByFund] = await Promise.all([
      loadFundMaster(ids),
      loadValuations({
        fundIds: ids,
        dateFrom,
        dateTo,
      }),
    ]);

    return {
      funds,
      valuations_by_fund: valuationsByFund,
      query_contract: {
        fund_master_table: 'fond_investissements',
        valuation_table: 'valorisations',
        active_only: true,
        explicit_date_window: Boolean(dateFrom || dateTo),
        limit: null,
        no_limit_500: true,
      },
    };
  }

  return {
    loadFundMaster,
    loadValuations,
    load,
  };
}

module.exports = {
  FUND_ATTRIBUTES,
  VALUATION_ATTRIBUTES,
  createAllocationDataProvider,
};
