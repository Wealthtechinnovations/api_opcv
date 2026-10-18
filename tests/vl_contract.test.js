const {
  QUALITY,
  validate,
  contractValues,
  CONTRACT_COLUMNS,
  makeBatchId,
  summarize,
} = require('../src/lib/vl_contract');

// Le fonds 1141 (AFRINVEST DOLLAR FUND) est le cas reel qui a motive ce
// contrat : sa serie melangeait le prix en dollars et sa contre-valeur en
// naira, produisant un YTD servi de 143 958 %.
const FONDS_USD = { id: 1141, dev_libelle: 'USD' };
const FONDS_NGN = { id: 1146, dev_libelle: 'NGN' };

const mesureSaine = {
  currency_code: 'USD',
  price_type: 'BID',
  source_url: 'https://home.sec.gov.ng/documents/1497/',
  sec_document_id: '1497',
  report_date: '2026-07-10',
};

describe('vl_contract — regle de devise', () => {
  test('accepte une mesure dont la devise est celle du fonds', () => {
    const r = validate(mesureSaine, FONDS_USD);
    expect(r.accepted).toBe(true);
    expect(r.quality).toBe(QUALITY.OK);
    expect(r.reasons).toHaveLength(0);
  });

  test('refuse une mesure en NGN sur un fonds USD, meme en mode warn', () => {
    // C est exactement #73 : le chargeur prenait la colonne NGN sur une serie
    // en USD. Cette contradiction produit une donnee fausse, elle doit donc
    // bloquer y compris dans le mode le plus permissif.
    const r = validate({ ...mesureSaine, currency_code: 'NGN' }, FONDS_USD);
    expect(r.accepted).toBe(false);
    expect(r.quality).toBe(QUALITY.CURRENCY_MISMATCH);
    expect(r.reasons.join(' ')).toMatch(/ne jamais convertir/);
  });

  test('refuse aussi en mode strict', () => {
    const r = validate({ ...mesureSaine, currency_code: 'NGN' }, FONDS_USD, { mode: 'strict' });
    expect(r.accepted).toBe(false);
  });

  test('compare les devises sans tenir compte de la casse ni des espaces', () => {
    const r = validate({ ...mesureSaine, currency_code: '  usd ' }, FONDS_USD);
    expect(r.accepted).toBe(true);
    expect(r.quality).toBe(QUALITY.OK);
  });
});

describe('vl_contract — interdiction du repli silencieux', () => {
  test('une devise absente est signalee, jamais remplacee par un defaut', () => {
    // Le point d entree exact du defaut cote Nigeria etait
    // `row.currency_code || 'NGN'`, qui transformait un fonds dollar en fonds
    // naira sans laisser de trace.
    const r = validate({ ...mesureSaine, currency_code: null }, FONDS_USD);
    expect(r.quality).toBe(QUALITY.UNQUALIFIED);
    expect(r.reasons.join(' ')).toMatch(/aucun repli par defaut/);
    // La valeur produite reste nulle : aucune devise n est inventee.
    expect(contractValues({ ...mesureSaine, currency_code: null }, r.quality, 'B')[0]).toBeNull();
  });

  test('en mode warn, une devise absente ne bloque pas l import', () => {
    // Sinon la mise en service casserait les imports des pays dont les
    // chargeurs ne fournissent pas encore la devise.
    const r = validate({ ...mesureSaine, currency_code: null }, FONDS_USD);
    expect(r.accepted).toBe(true);
  });

  test('en mode strict, une devise absente bloque', () => {
    const r = validate({ ...mesureSaine, currency_code: null }, FONDS_USD, { mode: 'strict' });
    expect(r.accepted).toBe(false);
  });
});

describe('vl_contract — type de prix et provenance', () => {
  test('un type de prix absent degrade la qualite', () => {
    const r = validate({ ...mesureSaine, price_type: null }, FONDS_USD);
    expect(r.quality).toBe(QUALITY.UNQUALIFIED);
  });

  test('un type de prix inconnu est refuse comme tel', () => {
    const r = validate({ ...mesureSaine, price_type: 'MID' }, FONDS_USD);
    expect(r.reasons.join(' ')).toMatch(/type de prix inconnu/);
  });

  test('NAV_TOTAL est un type reconnu mais distinct d une VL', () => {
    const r = validate({ ...mesureSaine, price_type: 'NAV_TOTAL' }, FONDS_USD);
    expect(r.quality).toBe(QUALITY.OK);
  });

  test('une mesure sans aucune provenance est signalee', () => {
    const r = validate({ ...mesureSaine, source_url: null, sec_document_id: null }, FONDS_USD);
    expect(r.quality).toBe(QUALITY.UNQUALIFIED);
    expect(r.reasons.join(' ')).toMatch(/provenance/);
  });

  test('un identifiant de document suffit comme provenance', () => {
    const r = validate({ ...mesureSaine, source_url: null }, FONDS_USD);
    expect(r.quality).toBe(QUALITY.OK);
  });
});

describe('vl_contract — fonds sans devise de reference', () => {
  test('ne bloque pas quand le fonds lui-meme n a pas de devise declaree', () => {
    // 23 fonds nigerians sont mal libelles ; tant que l etape 0 n est pas
    // faite, on ne peut pas comparer. Le contrat ne doit pas rejeter pour
    // cette raison, sinon il bloquerait sur un defaut du referentiel.
    const r = validate(mesureSaine, { id: 9999, dev_libelle: null });
    expect(r.accepted).toBe(true);
    expect(r.quality).toBe(QUALITY.OK);
  });
});

describe('vl_contract — sortie SQL', () => {
  test('contractValues respecte l ordre de CONTRACT_COLUMNS', () => {
    const v = contractValues(mesureSaine, QUALITY.OK, 'SECNG_20260815_204512');
    expect(v).toHaveLength(CONTRACT_COLUMNS.length);
    expect(v[CONTRACT_COLUMNS.indexOf('currency_code')]).toBe('USD');
    expect(v[CONTRACT_COLUMNS.indexOf('price_type')]).toBe('BID');
    expect(v[CONTRACT_COLUMNS.indexOf('data_quality')]).toBe(QUALITY.OK);
    expect(v[CONTRACT_COLUMNS.indexOf('correction_batch')]).toBe('SECNG_20260815_204512');
    expect(v[CONTRACT_COLUMNS.indexOf('sec_document_id')]).toBe('1497');
  });

  test('normalise la casse des valeurs ecrites', () => {
    const v = contractValues({ ...mesureSaine, currency_code: 'usd', price_type: 'bid' }, QUALITY.OK, 'B');
    expect(v[0]).toBe('USD');
    expect(v[1]).toBe('BID');
  });
});

describe('vl_contract — lot et compte-rendu', () => {
  test('makeBatchId produit un identifiant prefixe et horodate', () => {
    const id = makeBatchId('secng');
    expect(id).toMatch(/^SECNG_\d{8}_\d{6}$/);
  });

  test('summarize compte les refus et la repartition par qualite', () => {
    const s = summarize([
      { quality: QUALITY.OK, accepted: true },
      { quality: QUALITY.OK, accepted: true },
      { quality: QUALITY.CURRENCY_MISMATCH, accepted: false },
    ]);
    expect(s).toMatch(/3 mesures/);
    expect(s).toMatch(/OK: 2/);
    expect(s).toMatch(/refusees: 1/);
  });
});
