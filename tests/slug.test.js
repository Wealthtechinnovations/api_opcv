const { generateSlug, generateFundSlug, extractIdFromSlug } = require('../src/functions/slug');

describe('generateSlug', () => {
  test('converts to lowercase with hyphens', () => {
    expect(generateSlug('FCP CAPITAL MAROC')).toBe('fcp-capital-maroc');
  });

  test('removes French accents', () => {
    expect(generateSlug('Société Générale Épargne')).toBe('societe-generale-epargne');
  });

  test('collapses multiple spaces and hyphens', () => {
    expect(generateSlug('FCP   TRESO -- MONEA')).toBe('fcp-treso-monea');
  });

  test('handles empty/null input', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug(null)).toBe('');
    expect(generateSlug(undefined)).toBe('');
  });

  test('removes special characters', () => {
    expect(generateSlug("ESS ASSET'S MANAGEMENT (PTY)")).toBe('ess-assets-management-pty');
  });

  test('trims leading/trailing hyphens', () => {
    expect(generateSlug(' --Test Fund-- ')).toBe('test-fund');
  });
});

describe('generateFundSlug', () => {
  test('combines name, ISIN, and id', () => {
    expect(generateFundSlug('FCP Capital', 'MA0001234567', 42)).toBe('fcp-capital-ma0001234567-42');
  });

  test('handles missing ISIN', () => {
    expect(generateFundSlug('FCP Capital', '', 42)).toBe('fcp-capital-42');
    expect(generateFundSlug('FCP Capital', null, 42)).toBe('fcp-capital-42');
  });
});

describe('extractIdFromSlug', () => {
  test('extracts ID from end of slug', () => {
    expect(extractIdFromSlug('fcp-capital-maroc-42')).toBe(42);
  });

  test('handles numeric-only slug', () => {
    expect(extractIdFromSlug('1131')).toBe(1131);
  });

  test('handles null/empty', () => {
    expect(extractIdFromSlug(null)).toBeNull();
    expect(extractIdFromSlug('')).toBeNull();
  });

  test('handles slug without trailing number', () => {
    expect(extractIdFromSlug('fcp-capital')).toBeNull();
  });
});
