/**
 * Contrat read-only sur le protocole SQL des recalculs massifs.
 *
 * Les deux batchs dynamiques construisent un SQL complet different a chaque
 * bloc. Ils ne doivent donc pas utiliser mysql2.execute(), qui prepare/cache
 * chaque texte SQL exact. Les SELECT parametres historiques restent execute().
 *
 * Ce diagnostic ne charge aucune DB et ne modifie aucun fichier.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

const cases = [
  {
    name: 'STEP3_RECALC_EUR_USD',
    file: 'scripts/recalc/recalc_eur_usd_daily_rate.js',
    marker: 'value_EUR = CASE id',
  },
  {
    name: 'STEP4_RECALC_VL_AJUSTE',
    file: 'scripts/recalc/recalc_vl_ajuste.js',
    marker: 'vl_ajuste = CASE id',
  },
];

let failures = 0;

console.log('\n=== RECALC SQL PROTOCOL CONTRACT — READ ONLY ===');

for (const item of cases) {
  const full = path.join(ROOT, item.file);
  const src = fs.readFileSync(full, 'utf8');
  const idx = src.indexOf(item.marker);
  if (idx < 0) {
    console.log(item.name + '=RED marker_missing');
    failures++;
    continue;
  }

  const before = src.slice(Math.max(0, idx - 500), idx);
  const queryPos = before.lastIndexOf('conn.query(');
  const executePos = before.lastIndexOf('conn.execute(');
  const protocol = queryPos > executePos ? 'QUERY_TEXT' : 'EXECUTE_PREPARED';

  const hasParameterizedSelect =
    src.includes('WHERE fund_id = ?') &&
    src.includes('conn.execute(');

  console.log(
    item.name +
    ' protocol=' + protocol +
    ' parameterized_select_execute_preserved=' + (hasParameterizedSelect ? 'YES' : 'NO')
  );

  if (protocol !== 'QUERY_TEXT' || !hasParameterizedSelect) {
    failures++;
  }
}

console.log('MUTATION=NONE');
console.log('CONTRACT=' + (failures === 0 ? 'GREEN' : 'RED'));
process.exitCode = failures === 0 ? 0 : 1;
