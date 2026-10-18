#!/usr/bin/env node
/**
 * =============================================================================
 * AUDIT COMPLET BASE DE DONNÉES - PLATEFORME OPCVM AFRICAFUNDS
 * =============================================================================
 * Script de diagnostic exhaustif couvrant :
 * - Structure complète (tables, colonnes, index, FK)
 * - Intégrité des données et relations
 * - Logique métier OPCVM (fonds, VL, performances, classements)
 * - Cohérence devises, pays, catégories
 * - Portefeuilles et reconstitution
 * - Indices, benchmarks, TSR
 * - Anomalies et contrôles VL
 * - Recommandations de mise à niveau
 *
 * Usage: cd /chemin/vers/api && node diagnostic_db.js 2>&1 | tee audit_result.txt
 * =============================================================================
 */

require('dotenv').config();
const { Sequelize, Op } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  timezone: process.env.DB_TIMEZONE || '+00:00'
});

function section(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80));
}

function subsection(title) {
  console.log(`\n--- ${title} ---`);
}

async function safeQuery(sql, label) {
  try {
    const [rows] = await seq.query(sql);
    return rows;
  } catch (e) {
    console.log(`  [ERREUR ${label}]: ${e.message}`);
    return [];
  }
}

async function countTable(table) {
  try {
    const [[r]] = await seq.query(`SELECT COUNT(*) as c FROM \`${table}\``);
    return r.c;
  } catch { return 'TABLE_ABSENTE'; }
}

async function run() {
  await seq.authenticate();
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║       AUDIT COMPLET BASE DE DONNÉES - PLATEFORME OPCVM AFRICAFUNDS         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Base: ${process.env.DB_NAME}@${process.env.DB_HOST}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: VUE D'ENSEMBLE
  // ═══════════════════════════════════════════════════════════════════════════
  section('1. VUE D\'ENSEMBLE DE LA BASE');

  const [tables] = await seq.query('SHOW TABLES');
  console.log(`Nombre total de tables: ${tables.length}`);

  const tableList = [
    'fond_investissements', 'societes', 'valorisations', 'performences',
    'performences_eurs', 'performences_usds', 'rendements', 'classementfonds',
    'classementfonds_eurs', 'classementfonds_usds', 'indice_references',
    'taux_sans_risques', 'tsrhistos', 'devisedechanges', 'taux_changes', 'devises',
    'pays_regulateurs', 'date_valorisations', 'frais', 'fiscalites',
    'portefeuilles', 'portefeuilles_vls', 'portefeuilles_vls_cumuls',
    'portefeuille_base100s', 'investissements', 'transactions', 'cashs',
    'portefeuilles_proposes', 'portefeuilles_proposes_vls',
    'simulations', 'simulation_portefeuilles',
    'users', 'api_keys', 'favorisfonds', 'actualites',
    'societes', 'personnel_sgs', 'documents'
  ];

  console.log('\nVolumes par table:');
  for (const t of tableList) {
    const c = await countTable(t);
    if (c !== 'TABLE_ABSENTE') {
      console.log(`  ${t.padEnd(35)} ${String(c).padStart(10)} lignes`);
    }
  }

  // Taille des tables
  subsection('Taille des tables sur disque');
  const diskUsage = await safeQuery(`
    SELECT table_name,
           ROUND(data_length/1024/1024, 2) as data_MB,
           ROUND(index_length/1024/1024, 2) as index_MB,
           table_rows
    FROM information_schema.tables
    WHERE table_schema = '${process.env.DB_NAME}'
    ORDER BY data_length DESC
    LIMIT 20
  `, 'disk_usage');
  diskUsage.forEach(r => console.log(`  ${r.table_name.padEnd(35)} data=${r.data_MB}MB  idx=${r.index_MB}MB  ~${r.table_rows} rows`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: SOCIÉTÉS DE GESTION
  // ═══════════════════════════════════════════════════════════════════════════
  section('2. SOCIÉTÉS DE GESTION');

  subsection('2.1 Table societes');
  const societes = await safeQuery('SELECT id, nom, pays, email, devise, regulateur, numeroagrement FROM societes ORDER BY nom', 'societes');
  console.log(`Total: ${societes.length}`);
  societes.forEach(s => console.log(`  id=${s.id} | "${s.nom}" | pays=${s.pays} | devise=${s.devise} | regulateur=${s.regulateur} | agrement=${s.numeroagrement}`));

  subsection('2.2 Valeurs societe_gestion dans fonds');
  const sgInFonds = await safeQuery(`
    SELECT societe_gestion, COUNT(*) as nb_fonds,
           GROUP_CONCAT(DISTINCT pays) as pays_fonds,
           SUM(active=1) as actifs, SUM(active=0) as inactifs
    FROM fond_investissements
    WHERE societe_gestion IS NOT NULL AND societe_gestion != ''
    GROUP BY societe_gestion ORDER BY societe_gestion
  `, 'sg_fonds');
  console.log(`Valeurs distinctes: ${sgInFonds.length}`);
  sgInFonds.forEach(r => console.log(`  "${r.societe_gestion}" -> ${r.nb_fonds} fonds (${r.actifs} actifs) | pays: ${r.pays_fonds}`));

  subsection('2.3 Fonds orphelins (societe_gestion ne match aucune societe.nom)');
  const orphans = await safeQuery(`
    SELECT f.id, f.nom_fond, f.societe_gestion, f.pays, f.active
    FROM fond_investissements f
    LEFT JOIN societes s ON TRIM(f.societe_gestion) = TRIM(s.nom)
    WHERE s.id IS NULL AND f.societe_gestion IS NOT NULL AND f.societe_gestion != ''
    ORDER BY f.societe_gestion, f.nom_fond
  `, 'orphelins');
  console.log(`Total: ${orphans.length}`);
  orphans.forEach(r => console.log(`  id=${r.id} | "${r.nom_fond}" | sg="${r.societe_gestion}" | pays=${r.pays} | active=${r.active}`));

  subsection('2.4 Fonds sans societe_gestion');
  const noSg = await safeQuery(`SELECT id, nom_fond, pays, active FROM fond_investissements WHERE societe_gestion IS NULL OR societe_gestion = '' ORDER BY pays`, 'no_sg');
  console.log(`Total: ${noSg.length}`);
  noSg.forEach(r => console.log(`  id=${r.id} | "${r.nom_fond}" | pays=${r.pays} | active=${r.active}`));

  subsection('2.5 Doublons societe_gestion (TRIM/casse)');
  const doublons = await safeQuery(`
    SELECT LOWER(TRIM(societe_gestion)) as norm, GROUP_CONCAT(DISTINCT societe_gestion SEPARATOR ' | ') as variantes, COUNT(DISTINCT societe_gestion) as nb
    FROM fond_investissements WHERE societe_gestion IS NOT NULL AND societe_gestion != ''
    GROUP BY LOWER(TRIM(societe_gestion)) HAVING COUNT(DISTINCT societe_gestion) > 1
  `, 'doublons');
  if (doublons.length === 0) console.log('  OK - Pas de doublons');
  else doublons.forEach(r => console.log(`  DOUBLON: "${r.norm}" -> ${r.variantes}`));

  subsection('2.6 Utilisateurs societe de gestion et match');
  const userSgMatch = await safeQuery(`
    SELECT u.id as uid, u.denomination, u.email, u.pays as u_pays, s.id as sid, s.nom, s.pays as s_pays
    FROM users u LEFT JOIN societes s ON TRIM(u.denomination) = TRIM(s.nom)
    WHERE u.typeusers_id = '2' ORDER BY u.denomination
  `, 'user_sg');
  userSgMatch.forEach(r => {
    const match = r.sid ? 'OK' : 'NO MATCH';
    console.log(`  [${match}] user=${r.uid} "${r.denomination}" (${r.email}) -> societe_id=${r.sid || 'NULL'}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: PAYS ET REFERENTIELS GEOGRAPHIQUES
  // ═══════════════════════════════════════════════════════════════════════════
  section('3. PAYS ET RÉFÉRENTIELS');

  subsection('3.1 Pays regulateurs (table referentiel)');
  const paysReg = await safeQuery('SELECT pays, regulateur, symboledevise, nomdevise, nomdelabourse FROM pays_regulateurs ORDER BY pays', 'pays_reg');
  console.log(`Total: ${paysReg.length}`);
  paysReg.forEach(r => console.log(`  ${r.pays} | devise=${r.symboledevise} (${r.nomdevise}) | bourse=${r.nomdelabourse} | regulateur=${r.regulateur}`));

  subsection('3.2 Fonds par pays');
  const paysFonds = await safeQuery(`
    SELECT f.pays, COUNT(*) as total, SUM(f.active=1) as actifs,
           COUNT(DISTINCT f.societe_gestion) as nb_sg,
           COUNT(DISTINCT f.categorie_libelle) as nb_cat,
           COUNT(DISTINCT f.dev_libelle) as nb_devises
    FROM fond_investissements f GROUP BY f.pays ORDER BY total DESC
  `, 'pays_fonds');
  paysFonds.forEach(r => console.log(`  ${(r.pays||'(vide)').padEnd(20)} ${r.total} fonds (${r.actifs} actifs) | ${r.nb_sg} SG | ${r.nb_cat} cat | ${r.nb_devises} devises`));

  subsection('3.3 Pays dans fonds SANS referentiel pays_regulateurs');
  const paysMissing = await safeQuery(`
    SELECT DISTINCT f.pays, COUNT(*) as nb FROM fond_investissements f
    LEFT JOIN pays_regulateurs p ON TRIM(f.pays) = TRIM(p.pays)
    WHERE p.id IS NULL AND f.pays IS NOT NULL AND f.pays != ''
    GROUP BY f.pays
  `, 'pays_manquants');
  if (paysMissing.length === 0) console.log('  OK - Tous les pays ont un referentiel');
  else paysMissing.forEach(r => console.log(`  MANQUANT: "${r.pays}" (${r.nb} fonds)`));

  subsection('3.4 Coherence pays societe <-> fonds');
  const paysIncoh = await safeQuery(`
    SELECT f.societe_gestion, f.pays as pays_fond, s.pays as pays_societe, COUNT(*) as nb
    FROM fond_investissements f
    JOIN societes s ON TRIM(f.societe_gestion) = TRIM(s.nom)
    WHERE f.pays != s.pays
    GROUP BY f.societe_gestion, f.pays, s.pays
  `, 'pays_incoherence');
  if (paysIncoh.length === 0) console.log('  OK - Coherent');
  else paysIncoh.forEach(r => console.log(`  INCOHERENCE: "${r.societe_gestion}" | fond_pays=${r.pays_fond} | societe_pays=${r.pays_societe} | ${r.nb} fonds`));

  subsection('3.5 Fonds sans pays');
  const noPays = await safeQuery(`SELECT id, nom_fond, societe_gestion FROM fond_investissements WHERE pays IS NULL OR pays = ''`, 'no_pays');
  console.log(`Total: ${noPays.length}`);
  noPays.forEach(r => console.log(`  id=${r.id} "${r.nom_fond}" sg="${r.societe_gestion}"`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: FONDS (OPCVM) - STRUCTURE ET QUALITE
  // ═══════════════════════════════════════════════════════════════════════════
  section('4. FONDS (OPCVM)');

  subsection('4.1 Champs critiques vides sur fonds actifs');
  const criticalFields = ['nom_fond','code_ISIN','societe_gestion','pays','dev_libelle','categorie_libelle','periodicite','indice_benchmark'];
  for (const field of criticalFields) {
    const rows = await safeQuery(`SELECT COUNT(*) as c FROM fond_investissements WHERE active=1 AND (${field} IS NULL OR ${field} = '')`, field);
    if (rows[0]?.c > 0) console.log(`  ${field.padEnd(25)} ${rows[0].c} fonds actifs SANS valeur`);
  }

  subsection('4.2 Categories de fonds (categorie_libelle)');
  const cats = await safeQuery(`
    SELECT categorie_libelle, COUNT(*) as nb, GROUP_CONCAT(DISTINCT pays) as pays
    FROM fond_investissements WHERE active=1
    GROUP BY categorie_libelle ORDER BY nb DESC
  `, 'categories');
  cats.forEach(r => console.log(`  "${r.categorie_libelle || '(vide)'}" -> ${r.nb} fonds | pays: ${r.pays}`));

  subsection('4.3 Categories nationales');
  const catsNat = await safeQuery(`
    SELECT categorie_national, COUNT(*) as nb, GROUP_CONCAT(DISTINCT pays) as pays
    FROM fond_investissements WHERE active=1
    GROUP BY categorie_national ORDER BY nb DESC LIMIT 20
  `, 'cat_nat');
  catsNat.forEach(r => console.log(`  "${r.categorie_national || '(vide)'}" -> ${r.nb} fonds | pays: ${r.pays}`));

  subsection('4.4 Categories regionales');
  const catsReg = await safeQuery(`
    SELECT categorie_regional, COUNT(*) as nb
    FROM fond_investissements WHERE active=1
    GROUP BY categorie_regional ORDER BY nb DESC LIMIT 20
  `, 'cat_reg');
  catsReg.forEach(r => console.log(`  "${r.categorie_regional || '(vide)'}" -> ${r.nb} fonds`));

  subsection('4.5 Categories globales');
  const catsGlob = await safeQuery(`
    SELECT categorie_globale, COUNT(*) as nb
    FROM fond_investissements WHERE active=1
    GROUP BY categorie_globale ORDER BY nb DESC
  `, 'cat_glob');
  catsGlob.forEach(r => console.log(`  "${r.categorie_globale || '(vide)'}" -> ${r.nb} fonds`));

  subsection('4.6 Devises des fonds');
  const devFonds = await safeQuery(`
    SELECT dev_libelle, COUNT(*) as nb, GROUP_CONCAT(DISTINCT pays) as pays
    FROM fond_investissements WHERE active=1
    GROUP BY dev_libelle ORDER BY nb DESC
  `, 'devises_fonds');
  devFonds.forEach(r => console.log(`  ${r.dev_libelle || '(vide)'} -> ${r.nb} fonds | pays: ${r.pays}`));

  subsection('4.7 Indices benchmark rattaches aux fonds');
  const indices = await safeQuery(`
    SELECT indice_benchmark, COUNT(*) as nb FROM fond_investissements WHERE active=1
    GROUP BY indice_benchmark ORDER BY nb DESC LIMIT 20
  `, 'benchmarks');
  indices.forEach(r => console.log(`  "${r.indice_benchmark || '(vide)'}" -> ${r.nb} fonds`));

  subsection('4.8 Correspondance benchmark <-> table indice_references');
  const benchNoRef = await safeQuery(`
    SELECT DISTINCT f.indice_benchmark
    FROM fond_investissements f
    LEFT JOIN indice_references ir ON f.indice_benchmark = ir.nom_indice OR f.indice = ir.id_indice
    WHERE ir.id IS NULL AND f.indice_benchmark IS NOT NULL AND f.indice_benchmark != '' AND f.active=1
  `, 'bench_orphan');
  if (benchNoRef.length === 0) console.log('  OK - Tous les benchmarks ont une reference');
  else {
    console.log(`  ${benchNoRef.length} benchmarks SANS reference:`);
    benchNoRef.forEach(r => console.log(`    "${r.indice_benchmark}"`));
  }

  subsection('4.9 Periodicite des fonds');
  const periodicites = await safeQuery(`
    SELECT periodicite, COUNT(*) as nb FROM fond_investissements WHERE active=1
    GROUP BY periodicite ORDER BY nb DESC
  `, 'periodicite');
  periodicites.forEach(r => console.log(`  ${r.periodicite || '(vide)'} -> ${r.nb} fonds`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: VALORISATIONS (VL)
  // ═══════════════════════════════════════════════════════════════════════════
  section('5. VALORISATIONS (VL / NAV)');

  subsection('5.1 Vue globale');
  const vlStats = await safeQuery(`
    SELECT COUNT(*) as total, COUNT(DISTINCT fund_id) as nb_fonds,
           MIN(date) as date_min, MAX(date) as date_max
    FROM valorisations
  `, 'vl_stats');
  if (vlStats[0]) console.log(`  Total: ${vlStats[0].total} VL | ${vlStats[0].nb_fonds} fonds | Du ${vlStats[0].date_min} au ${vlStats[0].date_max}`);

  subsection('5.2 Fonds actifs SANS aucune VL');
  const noVl = await safeQuery(`
    SELECT f.id, f.nom_fond, f.societe_gestion, f.pays
    FROM fond_investissements f
    LEFT JOIN valorisations v ON f.id = v.fund_id
    WHERE f.active=1 AND v.id IS NULL
    ORDER BY f.pays, f.societe_gestion
  `, 'no_vl');
  console.log(`Total: ${noVl.length}`);
  noVl.forEach(r => console.log(`  id=${r.id} | "${r.nom_fond}" | sg=${r.societe_gestion} | pays=${r.pays}`));

  subsection('5.3 Fonds actifs avec VL obsolete (>30j)');
  const oldVl = await safeQuery(`
    SELECT f.id, f.nom_fond, f.societe_gestion, f.pays, MAX(v.date) as last_vl,
           DATEDIFF(CURDATE(), MAX(v.date)) as jours_retard
    FROM fond_investissements f
    JOIN valorisations v ON f.id = v.fund_id
    WHERE f.active=1
    GROUP BY f.id, f.nom_fond, f.societe_gestion, f.pays
    HAVING last_vl < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ORDER BY jours_retard DESC LIMIT 30
  `, 'old_vl');
  console.log(`Total: ${oldVl.length}`);
  oldVl.forEach(r => console.log(`  id=${r.id} | "${r.nom_fond}" | derniere_vl=${r.last_vl} (${r.jours_retard}j retard) | ${r.societe_gestion}`));

  subsection('5.4 VL par pays (volume)');
  const vlPays = await safeQuery(`
    SELECT f.pays, COUNT(v.id) as nb_vl, COUNT(DISTINCT v.fund_id) as nb_fonds,
           MIN(v.date) as premiere, MAX(v.date) as derniere
    FROM valorisations v JOIN fond_investissements f ON v.fund_id = f.id
    GROUP BY f.pays ORDER BY nb_vl DESC
  `, 'vl_pays');
  vlPays.forEach(r => console.log(`  ${(r.pays||'?').padEnd(20)} ${r.nb_vl} VL | ${r.nb_fonds} fonds | ${r.premiere} -> ${r.derniere}`));

  subsection('5.5 Qualite multi-devise VL');
  const vlDevise = await safeQuery(`
    SELECT COUNT(*) as total,
           SUM(value IS NOT NULL AND value > 0) as has_local,
           SUM(value_EUR IS NOT NULL AND value_EUR > 0) as has_eur,
           SUM(value_USD IS NOT NULL AND value_USD > 0) as has_usd,
           SUM(vl_ajuste IS NOT NULL AND vl_ajuste > 0) as has_ajuste,
           SUM(dividende IS NOT NULL AND dividende > 0) as has_dividende
    FROM valorisations
  `, 'vl_devise');
  if (vlDevise[0]) {
    const v = vlDevise[0];
    console.log(`  Total VL: ${v.total}`);
    console.log(`  Avec valeur locale:   ${v.has_local} (${(v.has_local/v.total*100).toFixed(1)}%)`);
    console.log(`  Avec valeur EUR:      ${v.has_eur} (${(v.has_eur/v.total*100).toFixed(1)}%)`);
    console.log(`  Avec valeur USD:      ${v.has_usd} (${(v.has_usd/v.total*100).toFixed(1)}%)`);
    console.log(`  Avec VL ajustee:      ${v.has_ajuste} (${(v.has_ajuste/v.total*100).toFixed(1)}%)`);
    console.log(`  Avec dividende > 0:   ${v.has_dividende} (${(v.has_dividende/v.total*100).toFixed(1)}%)`);
  }

  subsection('5.6 VL avec valeur 0 ou negative');
  const vlZero = await safeQuery(`SELECT COUNT(*) as c FROM valorisations WHERE value <= 0`, 'vl_zero');
  console.log(`  VL <= 0: ${vlZero[0]?.c}`);

  subsection('5.7 Coherence fund_name <-> fond_investissements.nom_fond');
  const vlNameMismatch = await safeQuery(`
    SELECT COUNT(*) as c FROM valorisations v
    JOIN fond_investissements f ON v.fund_id = f.id
    WHERE TRIM(v.fund_name) != TRIM(f.nom_fond) LIMIT 1
  `, 'vl_name');
  console.log(`  VL avec fund_name != nom_fond: ${vlNameMismatch[0]?.c || 0}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: DEVISES ET TAUX DE CHANGE
  // ═══════════════════════════════════════════════════════════════════════════
  section('6. DEVISES ET TAUX DE CHANGE');

  subsection('6.1 Table devises');
  const devises = await safeQuery('SELECT * FROM devises ORDER BY Symbole', 'devises');
  console.log(`Total: ${devises.length}`);
  devises.forEach(r => console.log(`  id=${r.id} ${r.Symbole}`));

  subsection('6.2 Table taux_changes (par pays)');
  const tauxChange = await safeQuery('SELECT pays, devise_national, devise_eur, devise_usd, devise_xaf, devise_xof FROM taux_changes ORDER BY pays', 'taux_change');
  console.log(`Total: ${tauxChange.length}`);
  tauxChange.forEach(r => console.log(`  ${r.pays} | nat=${r.devise_national} | EUR=${r.devise_eur} | USD=${r.devise_usd} | XAF=${r.devise_xaf} | XOF=${r.devise_xof}`));

  subsection('6.3 Paires de change (devisedechanges)');
  const paires = await safeQuery(`
    SELECT paire, COUNT(*) as nb, MIN(date) as depuis, MAX(date) as jusqua
    FROM devisedechanges GROUP BY paire ORDER BY paire
  `, 'paires');
  console.log(`Total paires: ${paires.length}`);
  paires.forEach(r => console.log(`  ${r.paire} -> ${r.nb} cours | ${r.depuis} -> ${r.jusqua}`));

  subsection('6.4 Pays de fonds sans taux_change');
  const paysSansTaux = await safeQuery(`
    SELECT DISTINCT f.pays FROM fond_investissements f
    LEFT JOIN taux_changes t ON TRIM(f.pays) = TRIM(t.pays)
    WHERE t.id IS NULL AND f.pays IS NOT NULL AND f.pays != '' AND f.active=1
  `, 'pays_sans_taux');
  if (paysSansTaux.length === 0) console.log('  OK');
  else paysSansTaux.forEach(r => console.log(`  SANS TAUX: "${r.pays}"`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: INDICES ET BENCHMARKS
  // ═══════════════════════════════════════════════════════════════════════════
  section('7. INDICES ET BENCHMARKS');

  subsection('7.1 Indices disponibles');
  const indicesRef = await safeQuery(`
    SELECT id_indice, nom_indice, type_indice_id, COUNT(*) as nb_valeurs, MIN(date) as depuis, MAX(date) as jusqua
    FROM indice_references
    GROUP BY id_indice, nom_indice, type_indice_id ORDER BY nom_indice
  `, 'indices');
  console.log(`Total indices: ${indicesRef.length}`);
  indicesRef.forEach(r => console.log(`  [${r.id_indice}] "${r.nom_indice}" type=${r.type_indice_id} | ${r.nb_valeurs} val | ${r.depuis} -> ${r.jusqua}`));

  subsection('7.2 Fonds actifs <-> indice_benchmark');
  const fondsBench = await safeQuery(`
    SELECT f.indice_benchmark, f.indice, COUNT(*) as nb,
           (SELECT COUNT(DISTINCT ir.id_indice) FROM indice_references ir
            WHERE ir.nom_indice = f.indice_benchmark OR ir.id_indice = f.indice) as ref_exists
    FROM fond_investissements f WHERE f.active=1
    GROUP BY f.indice_benchmark, f.indice ORDER BY nb DESC
  `, 'fonds_bench');
  fondsBench.forEach(r => console.log(`  benchmark="${r.indice_benchmark}" id="${r.indice}" -> ${r.nb} fonds | ref_existe=${r.ref_exists > 0 ? 'OUI' : 'NON'}`));

  subsection('7.3 VL <-> Indice reference dans valorisations');
  const vlIndice = await safeQuery(`
    SELECT COUNT(*) as total,
           SUM(indRef IS NOT NULL AND indRef > 0) as has_indref,
           SUM(indice_comparaison IS NOT NULL AND indice_comparaison > 0) as has_comp,
           SUM(ID_indice IS NOT NULL AND ID_indice != '') as has_id_indice
    FROM valorisations
  `, 'vl_indice');
  if (vlIndice[0]) {
    console.log(`  VL avec indRef renseignee: ${vlIndice[0].has_indref}/${vlIndice[0].total}`);
    console.log(`  VL avec indice_comparaison: ${vlIndice[0].has_comp}/${vlIndice[0].total}`);
    console.log(`  VL avec ID_indice: ${vlIndice[0].has_id_indice}/${vlIndice[0].total}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: TSR (TAUX SANS RISQUE)
  // ═══════════════════════════════════════════════════════════════════════════
  section('8. TAUX SANS RISQUE (TSR)');

  subsection('8.1 TSR par pays');
  const tsrPays = await safeQuery(`
    SELECT pays, COUNT(*) as nb, MIN(date) as depuis, MAX(date) as jusqua,
           AVG(valeur) as moy_valeur
    FROM taux_sans_risques GROUP BY pays ORDER BY pays
  `, 'tsr_pays');
  tsrPays.forEach(r => console.log(`  ${r.pays} -> ${r.nb} valeurs | ${r.depuis} -> ${r.jusqua} | moy=${parseFloat(r.moy_valeur).toFixed(4)}`));

  subsection('8.2 TSR historique par pays et indice');
  const tsrHisto = await safeQuery(`
    SELECT pays, indice, COUNT(*) as nb, MIN(date) as depuis, MAX(date) as jusqua
    FROM tsrhistos GROUP BY pays, indice ORDER BY pays, indice
  `, 'tsr_histo');
  tsrHisto.forEach(r => console.log(`  ${r.pays} | indice=${r.indice} -> ${r.nb} val | ${r.depuis} -> ${r.jusqua}`));

  subsection('8.3 Pays de fonds actifs sans TSR');
  const paysSansTsr = await safeQuery(`
    SELECT DISTINCT f.pays FROM fond_investissements f
    LEFT JOIN taux_sans_risques t ON TRIM(f.pays) = TRIM(t.pays)
    WHERE t.id IS NULL AND f.pays IS NOT NULL AND f.pays != '' AND f.active=1
  `, 'pays_sans_tsr');
  if (paysSansTsr.length === 0) console.log('  OK - Tous les pays ont un TSR');
  else paysSansTsr.forEach(r => console.log(`  SANS TSR: "${r.pays}"`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9: PERFORMANCES ET RATIOS
  // ═══════════════════════════════════════════════════════════════════════════
  section('9. PERFORMANCES ET RATIOS');

  subsection('9.1 Couverture performances (devise locale)');
  const perfCover = await safeQuery(`
    SELECT COUNT(*) as total,
           SUM(ytd IS NOT NULL) as has_ytd,
           SUM(perf1an IS NOT NULL) as has_1an,
           SUM(perf3ans IS NOT NULL) as has_3ans,
           SUM(volatility1an IS NOT NULL) as has_vol1an,
           SUM(ratiosharpe1an IS NOT NULL) as has_sharpe1an,
           SUM(beta1an IS NOT NULL) as has_beta1an,
           SUM(trackingerror1an IS NOT NULL) as has_te1an,
           SUM(anomalie IS NOT NULL AND anomalie != '') as has_anomalie
    FROM performences
  `, 'perf_cover');
  if (perfCover[0]) {
    const p = perfCover[0];
    console.log(`  Total: ${p.total} lignes`);
    console.log(`  YTD:          ${p.has_ytd} (${(p.has_ytd/p.total*100).toFixed(1)}%)`);
    console.log(`  Perf 1an:     ${p.has_1an} (${(p.has_1an/p.total*100).toFixed(1)}%)`);
    console.log(`  Perf 3ans:    ${p.has_3ans} (${(p.has_3ans/p.total*100).toFixed(1)}%)`);
    console.log(`  Volatilite 1an: ${p.has_vol1an} (${(p.has_vol1an/p.total*100).toFixed(1)}%)`);
    console.log(`  Sharpe 1an:   ${p.has_sharpe1an} (${(p.has_sharpe1an/p.total*100).toFixed(1)}%)`);
    console.log(`  Beta 1an:     ${p.has_beta1an} (${(p.has_beta1an/p.total*100).toFixed(1)}%)`);
    console.log(`  Track.Error:  ${p.has_te1an} (${(p.has_te1an/p.total*100).toFixed(1)}%)`);
    console.log(`  Anomalie:     ${p.has_anomalie}`);
  }

  subsection('9.2 Performances EUR et USD');
  for (const table of ['performences_eurs', 'performences_usds']) {
    const pc = await safeQuery(`SELECT COUNT(*) as c, COUNT(DISTINCT fond_id) as fonds FROM ${table}`, table);
    console.log(`  ${table}: ${pc[0]?.c} lignes, ${pc[0]?.fonds} fonds`);
  }

  subsection('9.3 Fonds actifs SANS performance');
  const noPerf = await safeQuery(`
    SELECT f.id, f.nom_fond, f.societe_gestion, f.pays
    FROM fond_investissements f
    LEFT JOIN performences p ON f.id = p.fond_id
    WHERE f.active=1 AND p.id IS NULL
  `, 'no_perf');
  console.log(`Total: ${noPerf.length}`);
  noPerf.forEach(r => console.log(`  id=${r.id} | "${r.nom_fond}" | ${r.societe_gestion} | ${r.pays}`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 10: CLASSEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  section('10. CLASSEMENTS');

  subsection('10.1 Classements par type et categorie');
  for (const table of ['classementfonds', 'classementfonds_eurs', 'classementfonds_usds']) {
    const cls = await safeQuery(`
      SELECT type_classement, categorie, COUNT(*) as nb
      FROM ${table} GROUP BY type_classement, categorie ORDER BY type_classement, nb DESC
    `, table);
    console.log(`\n  ${table}:`);
    cls.forEach(r => console.log(`    type=${r.type_classement} cat="${r.categorie}" -> ${r.nb} fonds`));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 11: PORTEFEUILLES
  // ═══════════════════════════════════════════════════════════════════════════
  section('11. PORTEFEUILLES');

  subsection('11.1 Vue d ensemble');
  const portStats = await safeQuery(`
    SELECT COUNT(*) as total,
           COUNT(DISTINCT user_id) as nb_users,
           SUM(portefeuilletype = 'Robot advisor') as robot,
           SUM(portefeuilletype != 'Robot advisor' OR portefeuilletype IS NULL) as manual,
           AVG(montant_invest) as moy_invest
    FROM portefeuilles
  `, 'port_stats');
  if (portStats[0]) {
    const ps = portStats[0];
    console.log(`  Total: ${ps.total} portefeuilles | ${ps.nb_users} utilisateurs`);
    console.log(`  Robot advisor: ${ps.robot} | Manuel: ${ps.manual}`);
    console.log(`  Investissement moyen: ${parseFloat(ps.moy_invest||0).toFixed(2)}`);
  }

  subsection('11.2 Portefeuilles par devise');
  const portDevise = await safeQuery(`SELECT devise, COUNT(*) as nb FROM portefeuilles GROUP BY devise ORDER BY nb DESC`, 'port_devise');
  portDevise.forEach(r => console.log(`  ${r.devise || '(vide)'}: ${r.nb}`));

  subsection('11.3 Structure JSON (funds/fundids)');
  const portJson = await safeQuery(`
    SELECT COUNT(*) as total,
           SUM(funds IS NOT NULL) as has_funds,
           SUM(fundids IS NOT NULL) as has_fundids,
           SUM(poidsportefeuille IS NOT NULL) as has_poids,
           SUM(categorie IS NOT NULL) as has_categorie
    FROM portefeuilles
  `, 'port_json');
  if (portJson[0]) {
    const pj = portJson[0];
    console.log(`  Avec funds: ${pj.has_funds}/${pj.total} | Avec fundids: ${pj.has_fundids}/${pj.total}`);
    console.log(`  Avec poids: ${pj.has_poids}/${pj.total} | Avec categorie: ${pj.has_categorie}/${pj.total}`);
  }

  subsection('11.4 Lignes portefeuille_vl');
  const pvlStats = await safeQuery(`
    SELECT COUNT(*) as total, COUNT(DISTINCT portefeuille_id) as nb_port,
           COUNT(DISTINCT fund_id) as nb_fonds, MIN(date) as depuis, MAX(date) as jusqua
    FROM portefeuilles_vls
  `, 'pvl_stats');
  if (pvlStats[0]) console.log(`  ${pvlStats[0].total} lignes | ${pvlStats[0].nb_port} portefeuilles | ${pvlStats[0].nb_fonds} fonds | ${pvlStats[0].depuis} -> ${pvlStats[0].jusqua}`);

  subsection('11.5 Lignes portefeuille cumul/base100');
  for (const t of ['portefeuilles_vls_cumuls', 'portefeuille_base100s']) {
    const c = await countTable(t);
    console.log(`  ${t}: ${c} lignes`);
  }

  subsection('11.6 Transactions');
  const txStats = await safeQuery(`
    SELECT type, COUNT(*) as nb, SUM(montant) as total_montant
    FROM transactions GROUP BY type ORDER BY nb DESC
  `, 'transactions');
  txStats.forEach(r => console.log(`  ${r.type}: ${r.nb} tx | total=${parseFloat(r.total_montant||0).toFixed(2)}`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 12: ANOMALIES ET CONTROLES
  // ═══════════════════════════════════════════════════════════════════════════
  section('12. ANOMALIES ET CONTRÔLES VL');

  subsection('12.1 Anomalies dans performences');
  const anomStats = await safeQuery(`
    SELECT anomalie, COUNT(*) as nb FROM performences
    WHERE anomalie IS NOT NULL AND anomalie != ''
    GROUP BY anomalie ORDER BY nb DESC
  `, 'anomalies');
  anomStats.forEach(r => console.log(`  "${r.anomalie}": ${r.nb} fonds`));

  subsection('12.2 VL suspectes (ecart >10% entre dates consecutives) - echantillon');
  const vlSuspect = await safeQuery(`
    SELECT v1.fund_id, f.nom_fond, v1.date as date1, v1.value as val1,
           v2.date as date2, v2.value as val2,
           ROUND(ABS((v2.value - v1.value) / v1.value * 100), 2) as pct_change
    FROM valorisations v1
    JOIN valorisations v2 ON v1.fund_id = v2.fund_id AND v2.date = (
      SELECT MIN(date) FROM valorisations WHERE fund_id = v1.fund_id AND date > v1.date
    )
    JOIN fond_investissements f ON v1.fund_id = f.id
    WHERE v1.value > 0 AND ABS((v2.value - v1.value) / v1.value) > 0.10
    ORDER BY ABS((v2.value - v1.value) / v1.value) DESC
    LIMIT 20
  `, 'vl_suspect');
  console.log(`Echantillon (top 20 ecarts):`);
  vlSuspect.forEach(r => console.log(`  fund=${r.fund_id} "${r.nom_fond}" | ${r.date1}=${r.val1} -> ${r.date2}=${r.val2} | ecart=${r.pct_change}%`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 13: DOCUMENTS ET PERSONNEL
  // ═══════════════════════════════════════════════════════════════════════════
  section('13. DOCUMENTS ET PERSONNEL');

  subsection('13.1 Documents par societe');
  const docSoc = await safeQuery(`
    SELECT d.societe, COUNT(*) as nb, COUNT(DISTINCT d.fond_id) as nb_fonds,
           GROUP_CONCAT(DISTINCT d.type_fichier) as types
    FROM documents d GROUP BY d.societe ORDER BY d.societe
  `, 'docs');
  docSoc.forEach(r => console.log(`  "${r.societe}": ${r.nb} docs | ${r.nb_fonds} fonds | types: ${r.types}`));

  subsection('13.2 Documents orphelins (societe ne match pas)');
  const docOrph = await safeQuery(`
    SELECT DISTINCT d.societe FROM documents d
    LEFT JOIN societes s ON TRIM(d.societe) = TRIM(s.nom)
    WHERE s.id IS NULL AND d.societe IS NOT NULL AND d.societe != ''
  `, 'doc_orphan');
  docOrph.forEach(r => console.log(`  ORPHELIN: "${r.societe}"`));

  subsection('13.3 Personnel par societe');
  const persSoc = await safeQuery(`SELECT societe, COUNT(*) as nb FROM personnel_sgs GROUP BY societe ORDER BY societe`, 'personnel');
  persSoc.forEach(r => console.log(`  "${r.societe}": ${r.nb} personnes`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 14: UTILISATEURS
  // ═══════════════════════════════════════════════════════════════════════════
  section('14. UTILISATEURS');

  const userTypes = await safeQuery(`
    SELECT typeusers_id, typeusers, COUNT(*) as nb, SUM(active=1) as actifs
    FROM users GROUP BY typeusers_id, typeusers ORDER BY typeusers_id
  `, 'users');
  userTypes.forEach(r => console.log(`  type_id=${r.typeusers_id} (${r.typeusers}): ${r.nb} users (${r.actifs} actifs)`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 15: FRAIS ET FISCALITE
  // ═══════════════════════════════════════════════════════════════════════════
  section('15. FRAIS ET FISCALITÉ');

  subsection('15.1 Table frais');
  const fraisStats = await safeQuery(`SELECT COUNT(*) as c, COUNT(DISTINCT fond_id) as fonds FROM frais`, 'frais');
  console.log(`  ${fraisStats[0]?.c} lignes | ${fraisStats[0]?.fonds} fonds`);

  subsection('15.2 Fonds actifs sans table frais');
  const noFrais = await safeQuery(`
    SELECT COUNT(*) as c FROM fond_investissements f
    LEFT JOIN frais fr ON f.id = fr.fond_id
    WHERE f.active=1 AND fr.id IS NULL
  `, 'no_frais');
  console.log(`  ${noFrais[0]?.c} fonds actifs sans frais dans la table frais`);

  subsection('15.3 Fiscalite par pays');
  const fisc = await safeQuery('SELECT pays, frais FROM fiscalites ORDER BY pays', 'fiscalite');
  fisc.forEach(r => console.log(`  ${r.pays}: ${r.frais}%`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 16: RELATIONS ET FOREIGN KEYS MANQUANTES
  // ═══════════════════════════════════════════════════════════════════════════
  section('16. AUDIT DES RELATIONS ET FK MANQUANTES');

  console.log(`
  RELATIONS EXISTANTES (Sequelize ORM uniquement - pas de FK MySQL):
  ┌─────────────────────────────────────────────────────────────────────┐
  │ fond -> vl (fund_id)                    OK - hasMany/belongsTo     │
  │ fond -> performences (fond_id)          OK - hasMany/belongsTo     │
  │ fond -> rendement (fond_id)             OK - hasMany/belongsTo     │
  │ fond -> investissement (fund_id)        OK - hasMany/belongsTo     │
  │ fond -> frais (fond_id)                 OK - hasMany/belongsTo     │
  │ fond -> portefeuille_vl (fund_id)       OK - hasMany/belongsTo     │
  │ fond -> favorisfonds (fund_id)          OK - hasMany/belongsTo     │
  │ fond -> documents (fond_id)             OK - hasMany/belongsTo     │
  │ fond -> classementfonds (fond_id)       OK - hasMany/belongsTo     │
  │ fond -> transaction (fond_ids)          OK - hasMany/belongsTo     │
  │ portefeuille -> investissement (id)     OK - hasMany/belongsTo     │
  │ portefeuille -> portefeuille_vl (id)    OK - hasMany/belongsTo     │
  │ portefeuille -> portefeuille_cumul (id) OK - hasMany/belongsTo     │
  │ portefeuille -> portefeuille_base100    OK - hasMany/belongsTo     │
  │ portefeuille -> transaction (id)        OK - hasMany               │
  │ portefeuille -> cash (id)               OK - hasMany/belongsTo     │
  │ users -> portefeuille (user_id)         OK - hasMany/belongsTo     │
  │ users -> favorisfonds (user_id)         OK - hasMany/belongsTo     │
  │ users -> simulation (user_id)           OK - hasMany/belongsTo     │
  │ users -> apikeys (user_id)              OK - hasMany/belongsTo     │
  │ users -> actualite (user_id)            OK - hasMany/belongsTo     │
  │ simulation -> simulationportefeuille    OK - hasMany/belongsTo     │
  └─────────────────────────────────────────────────────────────────────┘

  RELATIONS MANQUANTES (STRING-BASED - CRITIQUES):
  ┌─────────────────────────────────────────────────────────────────────┐
  │ fond.societe_gestion -> societe.nom     STRING MATCH - PAS DE FK   │
  │ document.societe -> societe.nom         STRING MATCH - PAS DE FK   │
  │ personnel.societe -> societe.nom        STRING MATCH - PAS DE FK   │
  │ fond.pays -> pays_regulateurs.pays      STRING MATCH - PAS DE FK   │
  │ taux_sans_risques.pays -> pays_reg      STRING MATCH - PAS DE FK   │
  │ taux_changes.pays -> pays_regulateurs   STRING MATCH - PAS DE FK   │
  │ fiscalites.pays -> pays_regulateurs     STRING MATCH - PAS DE FK   │
  │ tsrhisto.pays -> pays_regulateurs       STRING MATCH - PAS DE FK   │
  │ fond.indice_benchmark -> indice_ref     STRING MATCH - PAS DE FK   │
  │ societe.pays -> pays_regulateurs.pays   STRING MATCH - PAS DE FK   │
  │ users.denomination -> societe.nom       STRING MATCH - PAS DE FK   │
  └─────────────────────────────────────────────────────────────────────┘

  RELATIONS COMPLÈTEMENT ABSENTES (À CRÉER):
  ┌─────────────────────────────────────────────────────────────────────┐
  │ fond -> societe (societe_id INT FK)     ABSENT - CRITIQUE          │
  │ fond -> pays_regulateurs (pays_id FK)   ABSENT - IMPORTANT         │
  │ societe -> pays_regulateurs (pays_id)   ABSENT - IMPORTANT         │
  │ document -> societe (societe_id FK)     ABSENT - IMPORTANT         │
  │ personnel -> societe (societe_id FK)    ABSENT - IMPORTANT         │
  │ fond -> indice (indice_id FK)           ABSENT - POUR BENCHMARK    │
  │ users -> societe (societe_id FK)        ABSENT - POUR TYPE 2       │
  │ tsr -> pays_regulateurs (pays_id FK)    ABSENT                     │
  │ taux_change -> pays_reg (pays_id FK)    ABSENT                     │
  │ performences_eurs -> fond (fond_id FK)  PAS DE hasMany DANS FOND   │
  │ performences_usds -> fond (fond_id FK)  PAS DE hasMany DANS FOND   │
  │ classement_eurs -> fond (fond_id FK)    PAS DE hasMany DANS FOND   │
  │ classement_usds -> fond (fond_id FK)    PAS DE hasMany DANS FOND   │
  └─────────────────────────────────────────────────────────────────────┘
`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 17: RENDEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  section('17. RENDEMENTS');
  const rendStats = await safeQuery(`
    SELECT COUNT(*) as total, COUNT(DISTINCT fond_id) as fonds, MIN(date) as depuis, MAX(date) as jusqua
    FROM rendements
  `, 'rendements');
  if (rendStats[0]) console.log(`  ${rendStats[0].total} lignes | ${rendStats[0].fonds} fonds | ${rendStats[0].depuis} -> ${rendStats[0].jusqua}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 18: SIMULATIONS ET ROBOT ADVISOR
  // ═══════════════════════════════════════════════════════════════════════════
  section('18. SIMULATIONS ET ROBOT ADVISOR');
  const simStats = await safeQuery(`SELECT COUNT(*) as c FROM simulations`, 'sim');
  const simPortStats = await safeQuery(`SELECT COUNT(*) as c FROM simulation_portefeuilles`, 'sim_port');
  const roboStats = await safeQuery(`SELECT COUNT(*) as c FROM portefeuilles_proposes`, 'robo');
  const roboVlStats = await safeQuery(`SELECT COUNT(*) as c FROM portefeuilles_proposes_vls`, 'robo_vl');
  console.log(`  Simulations: ${simStats[0]?.c} | Sim portefeuilles: ${simPortStats[0]?.c}`);
  console.log(`  Robot portfolios proposes: ${roboStats[0]?.c} | Robot VL: ${roboVlStats[0]?.c}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 19: ENCOURS SOUS GESTION (AUM)
  // ═══════════════════════════════════════════════════════════════════════════
  section('19. ENCOURS SOUS GESTION (ACTIF NET)');

  subsection('19.1 Actif net dans fond_investissements');
  const aumFond = await safeQuery(`
    SELECT f.pays, f.societe_gestion, SUM(f.montant_actif_net) as total_aum, COUNT(*) as nb
    FROM fond_investissements f WHERE f.active=1 AND f.montant_actif_net > 0
    GROUP BY f.pays, f.societe_gestion ORDER BY total_aum DESC LIMIT 20
  `, 'aum_fond');
  aumFond.forEach(r => console.log(`  ${r.societe_gestion} (${r.pays}): AUM=${parseFloat(r.total_aum).toFixed(0)} | ${r.nb} fonds`));

  subsection('19.2 Actif net dans valorisations (derniere VL)');
  const aumVl = await safeQuery(`
    SELECT f.pays, SUM(v.actif_net) as total_an, COUNT(DISTINCT f.id) as nb_fonds
    FROM fond_investissements f
    JOIN valorisations v ON f.id = v.fund_id
    WHERE f.active=1 AND v.date = (SELECT MAX(v2.date) FROM valorisations v2 WHERE v2.fund_id = f.id)
    GROUP BY f.pays ORDER BY total_an DESC
  `, 'aum_vl');
  aumVl.forEach(r => console.log(`  ${r.pays}: Actif_net_VL=${parseFloat(r.total_an||0).toFixed(0)} | ${r.nb_fonds} fonds`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 20: DATE DE VALORISATION PAR PAYS
  // ═══════════════════════════════════════════════════════════════════════════
  section('20. DATES DE VALORISATION');
  const dateVal = await safeQuery('SELECT pays, date FROM date_valorisations ORDER BY pays', 'date_val');
  dateVal.forEach(r => console.log(`  ${r.pays}: ${r.date}`));

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 21: SYNTHESE ET RECOMMANDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  section('21. SYNTHÈSE DES PROBLÈMES DÉTECTÉS');

  console.log(`
  PROBLÈMES CRITIQUES (à corriger en priorité):
  1. Liaisons fond <-> societe par STRING (pas de FK) - risque de casse si renommage
  2. Fonds orphelins: ${orphans.length} fonds dont societe_gestion ne match aucune societe
  3. Fonds sans societe_gestion: ${noSg.length}
  4. Fonds sans pays: ${noPays.length}
  5. Fonds actifs sans VL: ${noVl.length}
  6. Pays manquants dans referentiel: ${paysMissing.length}
  7. Pays sans TSR: ${paysSansTsr.length}
  8. Pays sans taux de change: ${paysSansTaux.length}

  PROBLÈMES DE STRUCTURE:
  - Tables performances/classements dupliquees x3 (locale/EUR/USD)
  - Pas de FK MySQL reelles - uniquement Sequelize ORM
  - Pas de migrations versionnees
  - Champs JSON dans portefeuilles (funds, fundids, poids) sans validation
  - Colonnes de ranking aplaties (30+ colonnes) au lieu de table pivot
  - Indices references pas lies aux fonds par FK
  - TSR lie aux pays par string, pas par FK
  - Pas de table de liaison fond <-> indice pour alpha/beta
  - Pas de table encours historique (seul le dernier montant_actif_net)
  `);

  console.log('\n=== FIN DE L\'AUDIT ===');
  await seq.close();
}

run().catch(e => { console.error('ERREUR FATALE:', e.message); process.exit(1); });
