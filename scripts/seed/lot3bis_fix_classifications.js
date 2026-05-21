/**
 * lot3bis_fix_classifications.js
 *
 * LOT 3bis — Completer les classifications manquantes et normaliser
 * les classifications non-standard, puis re-executer le mapping indice FundAfrica.
 *
 * ETAPE 1: Remplir classification NULL depuis categorie_globale
 *   categorie_globale contient ACTIONS/OBLIGATIONS/DIVERSIFIE/MONETAIRE
 *   meme quand classification est NULL
 *
 * ETAPE 2: Normaliser classifications non-standard (Nigeria)
 *   OMLT -> OBLIGATIONS, OCT -> MONETAIRE, DOLLAR -> MONETAIRE,
 *   ETF -> ACTIONS, ETHIQUE -> DIVERSIFIE, AUTRE -> DIVERSIFIE,
 *   IMMOBILIER -> DIVERSIFIE, INFRASTRUCTURE -> DIVERSIFIE,
 *   CHARIA -> DIVERSIFIE, OPCVM -> DIVERSIFIE
 *
 * ETAPE 3: Re-executer le mapping indice FundAfrica (meme logique que lot3)
 *
 * NON-DESTRUCTIF: ne modifie QUE les fonds qui n'ont pas encore indice_fundafrica
 *   sauf si --force est passe
 *
 * Usage:
 *   node lot3bis_fix_classifications.js              # diagnostic
 *   node lot3bis_fix_classifications.js --execute     # appliquer
 *   node lot3bis_fix_classifications.js --execute --force  # re-mapper tous
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'fund_opcvm',
  password: '66G41zes~',
  database: 'fund_opcvm',
  charset: 'utf8mb4',
};

const EXECUTE = process.argv.includes('--execute');
const FORCE = process.argv.includes('--force');

const CLASSIF_FROM_CATEGORIE_GLOBALE = {
  'ACTIONS': 'ACTIONS',
  'OBLIGATIONS': 'OBLIGATIONS',
  'DIVERSIFIE': 'DIVERSIFIE',
  'MONETAIRE': 'MONETAIRE',
};

const CLASSIF_NORMALIZE = {
  'OMLT': 'OBLIGATIONS',
  'OCT': 'MONETAIRE',
  'DOLLAR': 'MONETAIRE',
  'ETF': 'ACTIONS',
  'ETHIQUE': 'DIVERSIFIE',
  'AUTRE': 'DIVERSIFIE',
  'IMMOBILIER': 'DIVERSIFIE',
  'INFRASTRUCTURE': 'DIVERSIFIE',
  'CHARIA': 'DIVERSIFIE',
  'OPCVM': 'DIVERSIFIE',
  'CONTRACTUEL': 'DIVERSIFIE',
};

const PAYS_NORM = {
  'MAROC': 'MAROC', 'MOROCCO': 'MAROC',
  'NIGERIA': 'NIGERIA',
  'TUNISIE': 'TUNISIE', 'TUNISIA': 'TUNISIE',
  'UEMOA': 'UEMOA',
  'CEMAC': 'CEMAC',
  'KENYA': 'KENYA', 'GHANA': 'GHANA',
  'EGYPTE': 'EGYPTE', 'EGYPT': 'EGYPTE',
  'MAURITIUS': 'MAURICE', 'MAURICE': 'MAURICE', 'ILE MAURICE': 'MAURICE',
  'BOTSWANA': 'BOTSWANA',
  'NAMIBIE': 'NAMIBIE', 'NAMIBIA': 'NAMIBIE',
  'RWANDA': 'RWANDA',
  'OUGANDA': 'OUGANDA', 'UGANDA': 'OUGANDA',
  'TANZANIE': 'TANZANIE', 'TANZANIA': 'TANZANIE',
  'ZAMBIE': 'ZAMBIE', 'ZAMBIA': 'ZAMBIE',
  'ZIMBABWE': 'ZIMBABWE',
  'SENEGAL': 'UEMOA', 'COTE D\'IVOIRE': 'UEMOA', 'CÔTE D\'IVOIRE': 'UEMOA',
  'BURKINA FASO': 'UEMOA', 'MALI': 'UEMOA', 'TOGO': 'UEMOA',
  'NIGER': 'UEMOA', 'BENIN': 'UEMOA', 'BÉNIN': 'UEMOA', 'GUINEE-BISSAU': 'UEMOA',
  'CAMEROUN': 'CEMAC', 'CAMEROON': 'CEMAC', 'GABON': 'CEMAC',
  'CONGO': 'CEMAC', 'TCHAD': 'CEMAC', 'CENTRAFRIQUE': 'CEMAC',
  'GUINEE EQUATORIALE': 'CEMAC',
  'ALGERIE': 'ALGERIE', 'ANGOLA': 'ANGOLA', 'ETHIOPIE': 'ETHIOPIE',
  'LIBYE': 'LIBYE', 'SOUDAN': 'SOUDAN', 'MALAWI': 'MALAWI',
  'MOZAMBIQUE': 'MOZAMBIQUE', 'SEYCHELLES': 'SEYCHELLES',
  'SIERRA LEONE': 'SIERRA LEONE', 'SOMALIE': 'SOMALIE',
  'ESWATINI': 'ESWATINI', 'LESOTHO': 'LESOTHO',
  'CAP-VERT': 'CAP-VERT',
};

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? (FORCE ? 'MODE: EXECUTE + FORCE\n' : 'MODE: EXECUTE\n') : 'MODE: DIAGNOSTIC (dry run)\n');

  // ========================================================
  // ETAPE 1: Remplir classification NULL depuis categorie_globale
  // ========================================================
  console.log('=== ETAPE 1: REMPLIR CLASSIFICATION NULL DEPUIS CATEGORIE_GLOBALE ===\n');

  const [nullClassif] = await conn.execute(`
    SELECT id, nom_fond, pays, classification, categorie_globale, categorie_libelle
    FROM fond_investissements
    WHERE active = 1 AND (classification IS NULL OR classification = '')
    ORDER BY pays, id
  `);
  console.log(`  ${nullClassif.length} fonds avec classification NULL\n`);

  let filledFromGlobale = 0;
  let filledFromLibelle = 0;
  let stillNull = 0;
  const statsE1 = {};

  for (const f of nullClassif) {
    let newClassif = null;

    // Try from categorie_globale first
    const catG = (f.categorie_globale || '').trim().toUpperCase();
    if (catG && CLASSIF_FROM_CATEGORIE_GLOBALE[catG]) {
      newClassif = CLASSIF_FROM_CATEGORIE_GLOBALE[catG];
      filledFromGlobale++;
    }

    // Fallback: try from categorie_libelle (often contains "ACTIONS", "OBLIGATIONS" etc.)
    if (!newClassif && f.categorie_libelle) {
      const libUp = f.categorie_libelle.toUpperCase();
      if (libUp.includes('ACTION') || libUp.includes('EQUITY')) newClassif = 'ACTIONS';
      else if (libUp.includes('OBLIG') || libUp.includes('BOND') || libUp.includes('FIXED')) newClassif = 'OBLIGATIONS';
      else if (libUp.includes('DIVERS') || libUp.includes('BALANCED') || libUp.includes('MIXTE') || libUp.includes('EQUILIB')) newClassif = 'DIVERSIFIE';
      else if (libUp.includes('MONET') || libUp.includes('MONEY') || libUp.includes('TRESOR') || libUp.includes('LIQUI') || libUp.includes('CASH')) newClassif = 'MONETAIRE';
      if (newClassif) filledFromLibelle++;
    }

    if (newClassif) {
      const key = `${f.pays}|${newClassif}`;
      statsE1[key] = (statsE1[key] || 0) + 1;
      if (EXECUTE) {
        await conn.execute('UPDATE fond_investissements SET classification = ? WHERE id = ?', [newClassif, f.id]);
      }
    } else {
      stillNull++;
    }
  }

  console.log(`  Remplis depuis categorie_globale: ${filledFromGlobale}`);
  console.log(`  Remplis depuis categorie_libelle: ${filledFromLibelle}`);
  console.log(`  Toujours NULL:                    ${stillNull}`);
  console.log('\n  Detail par pays|classification:');
  Object.entries(statsE1).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${k}: ${v}`));

  // ========================================================
  // ETAPE 2: Normaliser classifications non-standard
  // ========================================================
  console.log('\n=== ETAPE 2: NORMALISER CLASSIFICATIONS NON-STANDARD ===\n');

  const nonStdKeys = Object.keys(CLASSIF_NORMALIZE);
  const placeholders = nonStdKeys.map(() => '?').join(', ');
  const [nonStd] = await conn.execute(`
    SELECT id, nom_fond, pays, classification
    FROM fond_investissements
    WHERE active = 1 AND UPPER(classification) IN (${placeholders})
    ORDER BY classification, pays
  `, nonStdKeys);

  console.log(`  ${nonStd.length} fonds avec classification non-standard\n`);

  let normalized = 0;
  const statsE2 = {};

  for (const f of nonStd) {
    const raw = (f.classification || '').trim().toUpperCase();
    const norm = CLASSIF_NORMALIZE[raw];
    if (norm) {
      const key = `${raw} -> ${norm} (${f.pays})`;
      statsE2[key] = (statsE2[key] || 0) + 1;
      if (EXECUTE) {
        await conn.execute('UPDATE fond_investissements SET classification = ? WHERE id = ?', [norm, f.id]);
      }
      normalized++;
    }
  }

  console.log(`  Normalises: ${normalized}`);
  console.log('\n  Detail:');
  Object.entries(statsE2).sort().forEach(([k, v]) => console.log(`    ${k}: ${v}`));

  // ========================================================
  // ETAPE 3: Re-mapper indice FundAfrica
  // ========================================================
  console.log('\n=== ETAPE 3: RE-MAPPER INDICE FUNDAFRICA ===\n');

  // Load referentiel
  const [refCats] = await conn.execute(`
    SELECT id, category_id, classification_regulateur, pays, region,
           categorie_locale_fundafrica, categorie_regionale_fundafrica, categorie_globale_fundafrica
    FROM ref_categories_fundafrica WHERE niveau_categorie = 'LOCAL' AND pays IS NOT NULL
  `);
  const [refIndices] = await conn.execute(`
    SELECT id, indice_id, categorie_fundafrica, niveau_categorie,
           classification_regulateur, nom_indice_usd, statut_indice
    FROM ref_indices_fundafrica WHERE niveau_categorie = 'LOCAL'
  `);

  const mapping = {};
  for (const cat of refCats) {
    const key = `${(cat.classification_regulateur || '').toUpperCase()}|${(cat.pays || '').toUpperCase()}`;
    const matchingIdx = refIndices.find(i => i.categorie_fundafrica === cat.categorie_locale_fundafrica);
    mapping[key] = {
      cat_locale: cat.categorie_locale_fundafrica,
      cat_regionale: cat.categorie_regionale_fundafrica,
      cat_globale: cat.categorie_globale_fundafrica,
      indice_id_code: matchingIdx ? matchingIdx.indice_id : null,
      indice_id_pk: matchingIdx ? matchingIdx.id : null,
      indice_nom: matchingIdx ? matchingIdx.nom_indice_usd : null,
      indice_statut: matchingIdx ? matchingIdx.statut_indice : null,
    };
  }
  console.log(`  ${Object.keys(mapping).length} mappings charges\n`);

  // Load funds to map
  let whereClause = 'active = 1';
  if (!FORCE) {
    whereClause += " AND (indice_fundafrica IS NULL OR indice_fundafrica = '')";
  }

  const [fonds] = await conn.execute(`
    SELECT id, nom_fond, classification, pays, indice_benchmark
    FROM fond_investissements WHERE ${whereClause} ORDER BY id
  `);
  console.log(`  ${fonds.length} fonds a mapper${FORCE ? ' (force mode)' : ''}\n`);

  let mapped = 0;
  let skippedNoClassif = 0;
  let skippedNoPays = 0;
  let skippedNoMapping = 0;
  let errors = 0;
  const unmapped = {};

  for (const f of fonds) {
    const rawClassif = (f.classification || '').trim().toUpperCase();
    const rawPays = (f.pays || '').trim().toUpperCase();

    if (!rawClassif) { skippedNoClassif++; continue; }
    if (!rawPays) { skippedNoPays++; continue; }

    const normPays = PAYS_NORM[rawPays] || null;
    if (!normPays) {
      unmapped[`?PAYS: ${rawPays}`] = (unmapped[`?PAYS: ${rawPays}`] || 0) + 1;
      skippedNoMapping++;
      continue;
    }

    const lookupKey = `${rawClassif}|${normPays}`;
    const m = mapping[lookupKey];
    if (!m) {
      unmapped[`${rawClassif}|${normPays}`] = (unmapped[`${rawClassif}|${normPays}`] || 0) + 1;
      skippedNoMapping++;
      continue;
    }

    if (EXECUTE) {
      try {
        await conn.execute(`
          UPDATE fond_investissements SET
            indice_fundafrica = ?, indice_fundafrica_id = ?,
            categorie_fundafrica_locale = ?, categorie_fundafrica_regionale = ?,
            categorie_fundafrica_globale = ?
          WHERE id = ?`,
          [m.indice_id_code, m.indice_id_pk, m.cat_locale, m.cat_regionale, m.cat_globale, f.id]
        );
        mapped++;
      } catch (e) {
        console.error(`  ERREUR fond ${f.id}: ${e.message}`);
        errors++;
      }
    } else {
      mapped++;
    }
  }

  console.log('--- Resultat mapping ---');
  console.log(`  Mappes:                ${mapped}`);
  console.log(`  Sans classification:   ${skippedNoClassif}`);
  console.log(`  Sans pays:             ${skippedNoPays}`);
  console.log(`  Pas de mapping:        ${skippedNoMapping}`);
  console.log(`  Erreurs:               ${errors}`);

  if (Object.keys(unmapped).length > 0) {
    console.log('\n  Non mappes:');
    Object.entries(unmapped).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${k}: ${v} fonds`));
  }

  // ========================================================
  // VERIFICATION FINALE
  // ========================================================
  if (EXECUTE) {
    console.log('\n=== VERIFICATION FINALE ===');
    const [total] = await conn.execute('SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1');
    const [withIdx] = await conn.execute("SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1 AND indice_fundafrica IS NOT NULL AND indice_fundafrica != ''");
    const [withoutIdx] = await conn.execute("SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1 AND (indice_fundafrica IS NULL OR indice_fundafrica = '')");
    const [nullClassifAfter] = await conn.execute("SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1 AND (classification IS NULL OR classification = '')");

    const [byClassif] = await conn.execute(`
      SELECT classification, COUNT(*) as c,
             SUM(CASE WHEN indice_fundafrica IS NOT NULL AND indice_fundafrica != '' THEN 1 ELSE 0 END) as mapped
      FROM fond_investissements WHERE active = 1 GROUP BY classification ORDER BY c DESC
    `);
    const [byPays] = await conn.execute(`
      SELECT pays, COUNT(*) as c,
             SUM(CASE WHEN indice_fundafrica IS NOT NULL AND indice_fundafrica != '' THEN 1 ELSE 0 END) as mapped,
             SUM(CASE WHEN classification IS NULL OR classification = '' THEN 1 ELSE 0 END) as null_classif
      FROM fond_investissements WHERE active = 1 GROUP BY pays ORDER BY c DESC
    `);

    console.log(`\nFonds actifs total:          ${total[0].c}`);
    console.log(`Avec indice FundAfrica:      ${withIdx[0].c}`);
    console.log(`Sans indice FundAfrica:      ${withoutIdx[0].c}`);
    console.log(`Classification toujours NULL: ${nullClassifAfter[0].c}`);

    console.log('\n--- Par classification ---');
    byClassif.forEach(r => console.log(`  ${(r.classification || 'NULL').padEnd(20)} ${String(r.c).padStart(4)} fonds, ${String(r.mapped).padStart(4)} mappes`));

    console.log('\n--- Par pays ---');
    byPays.forEach(r => console.log(`  ${(r.pays || 'NULL').padEnd(15)} ${String(r.c).padStart(4)} fonds, ${String(r.mapped).padStart(4)} mappes, ${r.null_classif} sans classif`));

    // Sample
    const [sample] = await conn.execute(`
      SELECT f.id, LEFT(f.nom_fond, 35) as nom, f.classification, f.pays,
             f.indice_benchmark, f.indice_fundafrica, i.nom_indice_usd, i.statut_indice
      FROM fond_investissements f
      LEFT JOIN ref_indices_fundafrica i ON i.indice_id = f.indice_fundafrica
      WHERE f.active = 1 AND f.indice_fundafrica IS NOT NULL
      ORDER BY f.pays, f.classification LIMIT 25
    `);
    console.log('\n--- Echantillon (25 fonds) ---');
    sample.forEach(r => {
      console.log(`  ${String(r.id).padEnd(5)} ${(r.nom||'').padEnd(36)} ${(r.classification||'').padEnd(14)} ${(r.pays||'').padEnd(8)} bench=${(r.indice_benchmark||'').substring(0,15).padEnd(15)} FA=${(r.indice_fundafrica||'').substring(0,25)} (${r.nom_indice_usd || 'N/A'})`);
    });

    const [benchCheck] = await conn.execute("SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1 AND indice_benchmark IS NOT NULL AND indice_benchmark != ''");
    console.log(`\nControle benchmark: ${benchCheck[0].c} fonds avec indice_benchmark => NON MODIFIE`);
  } else {
    console.log('\n(Mode diagnostic — aucune modification. Ajouter --execute pour appliquer.)');
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
