const { calculateBeta } = require('../src/functions/beta');

describe('calculateBeta (beta.js)', () => {
  test('beta of 1 for fund tracking index perfectly', () => {
    const now = new Date();
    const makeDate = (daysAgo) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    const values = [100, 102, 101, 105, 103, 107, 106, 110];
    const fonds = values.map((v, i) => ({
      date: makeDate(values.length - i),
      valeurLiquidative: v,
    }));
    const indice = values.map((v, i) => ({
      date: makeDate(values.length - i),
      valeurLiquidative: v,
    }));

    const result = calculateBeta(fonds, indice, 1);
    expect(result).toBeCloseTo(1, 3);
  });

  test('beta > 1 for more volatile fund', () => {
    const now = new Date();
    const makeDate = (daysAgo) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    const indiceValues = [100, 102, 101, 103, 102, 104, 103, 105];
    const fondValues = [100, 104, 99, 107, 100, 109, 102, 111];

    const fonds = fondValues.map((v, i) => ({
      date: makeDate(indiceValues.length - i),
      valeurLiquidative: v,
    }));
    const indice = indiceValues.map((v, i) => ({
      date: makeDate(indiceValues.length - i),
      valeurLiquidative: v,
    }));

    const result = calculateBeta(fonds, indice, 1);
    expect(result).toBeGreaterThan(1);
  });

  test('throws for insufficient data in period', () => {
    const fonds = [{ date: new Date('2020-01-01'), valeurLiquidative: 100 }];
    const indice = [{ date: new Date('2020-01-01'), valeurLiquidative: 100 }];
    expect(() => calculateBeta(fonds, indice, 1)).toThrow();
  });
});
