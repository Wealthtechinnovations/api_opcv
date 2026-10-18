jest.mock('../src/db/sequelize', () => ({
  sequelize: {
    query: jest.fn(),
    QueryTypes: { SELECT: 'SELECT' },
  },
  performences_eurs: { findAll: jest.fn() },
  performences_usds: { findAll: jest.fn() },
}));

const {
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
  LOWER_IS_BETTER,
} = require('../src/services/ranking.service');

const { sequelize, performences_eurs, performences_usds } = require('../src/db/sequelize');

// --- Pure function tests (no DB) ---

describe('rankFundInList', () => {
  const funds = [
    { fond_id: 1, perf3m: 10, perf6m: 20, volatility3an: 5 },
    { fond_id: 2, perf3m: 30, perf6m: 15, volatility3an: 12 },
    { fond_id: 3, perf3m: 20, perf6m: 25, volatility3an: 8 },
  ];

  test('ranks higher-is-better correctly (perf3m)', () => {
    expect(rankFundInList(funds, 2, 'perf3m')).toEqual([1, 3]);
    expect(rankFundInList(funds, 3, 'perf3m')).toEqual([2, 3]);
    expect(rankFundInList(funds, 1, 'perf3m')).toEqual([3, 3]);
  });

  test('ranks lower-is-better correctly (volatility3an)', () => {
    expect(rankFundInList(funds, 1, 'volatility3an')).toEqual([1, 3]);
    expect(rankFundInList(funds, 3, 'volatility3an')).toEqual([2, 3]);
    expect(rankFundInList(funds, 2, 'volatility3an')).toEqual([3, 3]);
  });

  test('returns [null, 0] for empty list', () => {
    expect(rankFundInList([], 1, 'perf3m')).toEqual([null, 0]);
  });

  test('excludes funds with null performance', () => {
    const withNulls = [
      { fond_id: 1, perf3m: 10 },
      { fond_id: 2, perf3m: null },
      { fond_id: 3, perf3m: 20 },
    ];
    expect(rankFundInList(withNulls, 1, 'perf3m')).toEqual([2, 2]);
    // fund 2 has null perf3m → excluded from valid list → findIndex returns -1 → rank = 0
    expect(rankFundInList(withNulls, 2, 'perf3m')).toEqual([0, 2]);
  });

  test('excludes funds with "-" performance', () => {
    const withDash = [
      { fond_id: 1, perf3m: 10 },
      { fond_id: 2, perf3m: '-' },
    ];
    expect(rankFundInList(withDash, 1, 'perf3m')).toEqual([1, 1]);
  });

  test('fund not in list returns rank 0 (not found)', () => {
    expect(rankFundInList(funds, 999, 'perf3m')).toEqual([0, 3]);
  });

  test('single fund gets rank 1', () => {
    const single = [{ fond_id: 42, perf3m: 5 }];
    expect(rankFundInList(single, 42, 'perf3m')).toEqual([1, 1]);
  });

  test('tied values produce deterministic ranking', () => {
    const tied = [
      { fond_id: 1, perf3m: 10 },
      { fond_id: 2, perf3m: 10 },
    ];
    const [rank1] = rankFundInList(tied, 1, 'perf3m');
    const [rank2] = rankFundInList(tied, 2, 'perf3m');
    expect(rank1 + rank2).toBe(3);
  });
});

describe('buildRankResult', () => {
  const funds = [
    { fond_id: 1, perf3m: 30, perf6m: 20 },
    { fond_id: 2, perf3m: 10, perf6m: 40 },
  ];

  test('builds result with correct field names', () => {
    const result = buildRankResult(funds, 1, 'ACTIONS MAROC', ['perf3m', 'perf6m']);
    expect(result.category).toBe('ACTIONS MAROC');
    expect(result.ranktotal).toBe(2);
    expect(result.rank3Mois).toBe(1);
    expect(result.rank3Moistotal).toBe(2);
    expect(result.rank6Mois).toBe(2);
    expect(result.rank6Moistotal).toBe(2);
  });

  test('handles all PERF_PERIODS without error', () => {
    const fund = { fond_id: 1 };
    PERF_PERIODS.forEach((p) => { fund[p] = 10; });
    const result = buildRankResult([fund], 1, 'TEST', PERF_PERIODS);
    expect(result.rank3Mois).toBe(1);
    expect(result.rank1erJanvier).toBe(1);
  });

  test('handles PERF_PERIODS_FULL with risk metrics', () => {
    const fund = { fond_id: 1 };
    PERF_PERIODS_FULL.forEach((p) => { fund[p] = 5; });
    const result = buildRankResult([fund], 1, 'TEST', PERF_PERIODS_FULL);
    expect(result.rankvolatilite).toBe(1);
    expect(result.ranksharpe).toBe(1);
    expect(result.rankpertemax).toBe(1);
    expect(result.ranksortino).toBe(1);
    expect(result.rankvar95).toBe(1);
    expect(result.rankbetabaissier).toBe(1);
  });
});

describe('LOWER_IS_BETTER', () => {
  test('contains exactly the risk metrics', () => {
    expect(LOWER_IS_BETTER.has('pertemax3an')).toBe(true);
    expect(LOWER_IS_BETTER.has('betabaissier3an')).toBe(true);
    expect(LOWER_IS_BETTER.has('volatility3an')).toBe(true);
    expect(LOWER_IS_BETTER.has('dsr3an')).toBe(true);
    expect(LOWER_IS_BETTER.has('perf3m')).toBe(false);
    expect(LOWER_IS_BETTER.has('ratiosharpe3an')).toBe(false);
  });
});

// --- Async functions with mocked DB ---

describe('calculateRankNational', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns ranked data for fund in category', async () => {
    sequelize.query.mockResolvedValue([
      { fond_id: 1, perf3m: 10, perf6m: 20, perf1an: 30, perf3ans: 5, perf5ans: 8, ytd: 12,
        perfveille: 0.1, perfveillem: 0.05, perf3mm: 9, perf6mm: 18, perf1anm: 28,
        perf3ansm: 4, perf5ansm: 7, ytdm: 11, volatility3an: 5, ratiosharpe3an: 1.2,
        pertemax3an: -10, sortino3an: 1.5, info3an: 0.8, calamar3an: 2.0,
        var953an: -3, betabaissier3an: 0.7, omega3an: 1.1, dsr3an: 0.02 },
      { fond_id: 2, perf3m: 20, perf6m: 15, perf1an: 25, perf3ans: 10, perf5ans: 12, ytd: 18,
        perfveille: 0.2, perfveillem: 0.1, perf3mm: 19, perf6mm: 14, perf1anm: 24,
        perf3ansm: 9, perf5ansm: 11, ytdm: 17, volatility3an: 8, ratiosharpe3an: 0.9,
        pertemax3an: -15, sortino3an: 1.0, info3an: 0.5, calamar3an: 1.5,
        var953an: -5, betabaissier3an: 0.9, omega3an: 0.8, dsr3an: 0.05 },
    ]);

    const result = await calculateRankNational('ACTIONS MAROC', 1, '2026-05-20');
    expect(result.code).toBe(200);
    expect(result.data.category).toBe('ACTIONS MAROC');
    expect(result.data.rank3Mois).toBe(2);
    expect(result.data.ranktotal).toBe(2);
    expect(result.data.rankvolatilite).toBe(1);
    expect(sequelize.query).toHaveBeenCalledTimes(1);
  });

  test('returns error when fund not found', async () => {
    sequelize.query.mockResolvedValue([
      { fond_id: 99, perf3m: 10 },
    ]);
    const result = await calculateRankNational('ACTIONS', 1, '2026-05-20');
    expect(result.error).toBe('Fond non trouvé.');
  });
});

describe('calculateRankRegional', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns ranked data using MAX(date) per fund', async () => {
    sequelize.query.mockResolvedValue([
      { fond_id: 1, perf3m: 15, perf6m: 25, perf1an: 35, perf3ans: 10, perf5ans: 20, ytd: 14 },
      { fond_id: 2, perf3m: 25, perf6m: 20, perf1an: 30, perf3ans: 15, perf5ans: 18, ytd: 22 },
    ]);

    const result = await calculateRankRegional('OBLIGATIONS AFRIQUE DU NORD', 1);
    expect(result.code).toBe(200);
    expect(result.data.rank3Mois).toBe(2);
    expect(result.data.rank6Mois).toBe(1);
  });
});

describe('calculateRankGlobal', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns error for null category', async () => {
    const result = await calculateRankGlobal(null, 1);
    expect(result.error).toBe('Pas de categorie globale FundAfrica.');
  });

  test('returns 404 when fund not in global category', async () => {
    sequelize.query.mockResolvedValue([
      { fond_id: 99, perf3m: 10, perf6m: 20, perf1an: 15, perf3ans: 5, perf5ans: 8, ytd: 12 },
    ]);
    const result = await calculateRankGlobal('ACTIONS', 1);
    expect(result.code).toBe(404);
  });
});

describe('calculateRankNationalDev', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses performences_eurs for EUR', async () => {
    performences_eurs.findAll.mockResolvedValue([
      { fond_id: 1, perf3m: 12, perf6m: 22, perf1an: 32, perf3ans: 8, perf5ans: 15, ytd: 10 },
    ]);
    const result = await calculateRankNationalDev('ACTIONS MAROC', 1, 'EUR');
    expect(performences_eurs.findAll).toHaveBeenCalledTimes(1);
    expect(performences_usds.findAll).not.toHaveBeenCalled();
    expect(result.code).toBe(200);
  });

  test('uses performences_usds for USD', async () => {
    performences_usds.findAll.mockResolvedValue([
      { fond_id: 1, perf3m: 10, perf6m: 20, perf1an: 30, perf3ans: 6, perf5ans: 12, ytd: 9 },
    ]);
    const result = await calculateRankNationalDev('ACTIONS MAROC', 1, 'USD');
    expect(performences_usds.findAll).toHaveBeenCalledTimes(1);
    expect(performences_eurs.findAll).not.toHaveBeenCalled();
    expect(result.code).toBe(200);
  });
});

describe('calculateRankRegionalDev', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns error when fund not in category', async () => {
    performences_eurs.findAll.mockResolvedValue([
      { fond_id: 99, perf3m: 10 },
    ]);
    const result = await calculateRankRegionalDev('ACTIONS AFRIQUE', 1, 'EUR');
    expect(result.error).toBe('Fond non trouvé.');
  });
});

describe('calculateRankGlobalDev', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns error for null category', async () => {
    const result = await calculateRankGlobalDev(null, 1, 'EUR');
    expect(result.error).toBe('Pas de categorie globale FundAfrica.');
  });

  test('returns ranked data for valid inputs', async () => {
    performences_usds.findAll.mockResolvedValue([
      { fond_id: 1, perf3m: 20, perf6m: 30, perf1an: 40, perf3ans: 15, perf5ans: 25, ytd: 18 },
      { fond_id: 2, perf3m: 10, perf6m: 40, perf1an: 35, perf3ans: 20, perf5ans: 22, ytd: 15 },
    ]);
    const result = await calculateRankGlobalDev('OBLIGATIONS', 2, 'USD');
    expect(result.code).toBe(200);
    expect(result.data.rank3Mois).toBe(2);
    expect(result.data.rank6Mois).toBe(1);
  });
});
