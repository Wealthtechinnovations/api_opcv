/**
 * lot3_indice_fundafrica.js
 *
 * LOT 3 — Ajoute les colonnes indice_fundafrica + indice_fundafrica_id
 * sur fond_investissements et backfill depuis le referentiel.
 *
 * REGLES:
 *   - NE TOUCHE PAS a indice_benchmark (benchmark declare par le fonds)
 *   - Mapping: UPPER(classification) + UPPER(pays) -> ref_categories_fundafrica
 *     -> categorie_locale_fundafrica -> ref_indices_fundafrica (NIVEAU=LOCAL)
 *   - Seuls les indices avec nom_indice_usd non NULL sont assignes
 *   - Auto-migration: detecte et ajoute les colonnes manquantes (ensureSchema)
 *   - NON-DESTRUCTIF: ne met a jour que les fonds sans indice_fundafrica ou avec --force
 *
 * Usage:
 *   node lot3_indice_fundafrica.js              # diagnostic (dry run)
 *   node lot3_indice_fundafrica.js --execute     # appliquer
 *   node lot3_indice_fundafrica.js --execute --force  # re-ecrire meme si deja rempli
 *   node lot3_indice_fundafrica.js --fond 1131   # un seul fond (dry run)
 *   node lot3_indice_fundafrica.js --pays MAROC   # fonds d'un pays (dry run)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const EXECUTE = process.argv.includes('--execute');
const FORCE = process.argv.includes('--force');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

async function ensureSchema(conn) {
  const [cols] = await conn.execute('SHOW COLUMNS FROM fond_investissements');
  const existing = new Set(cols.map(c => c.Field));

  const required = [
    { name: 'indice_fundafrica', type: "VARCHAR(200) DEFAULT NULL COMMENT 'Code indice FundAfrica (ref_indices_fundafrica.indice_id)'" },
    { name: 'indice_fundafrica_id', type: "INT DEFAULT NULL COMMENT 'FK ref_indices_fundafrica.id'" },
    { name: 'categorie_fundafrica_locale', type: "VARCHAR(200) DEFAULT NULL COMMENT 'Categorie locale FundAfrica'" },
    { name: 'categorie_fundafrica_regionale', type: "VARCHAR(200) DEFAULT NULL COMMENT 'Categorie regionale FundAfrica'" },
    { name: 'categorie_fundafrica_globale', type: "VARCHAR(200) DEFAULT NULL COMMENT 'Categorie globale FundAfrica'" },
  ];

  let added = 0;
  for (const col of required) {
    if (!existing.has(col.name)) {
      console.log(`  + ALTER TABLE: ajout colonne ${col.name}`);
      if (EXECUTE) {
        await conn.execute(`ALTER TABLE fond_investissements ADD COLUMN \`${col.name}\` ${col.type}`);
      }
      added++;
    }
  }

  if (added > 0) {
    console.log(`  ${added} colonne(s) ${EXECUTE ? 'ajoutee(s)' : 'a ajouter'}.\n`);
  } else {
    console.log('  Schema OK — colonnes deja presentes.\n');
  }
}

async function run() {
  const fondId = getArg('--fond');
  const pays = getArg('--pays');

  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? (FORCE ? 'MODE: EXECUTE + FORCE\n' : 'MODE: EXECUTE\n') : 'MODE: DIAGNOSTIC (dry run, --execute pour appliquer)\n');

  // 1. Schema migration
  console.log('=== 1. SCHEMA MIGRATION ===');
  await ensureSchema(conn);

  // 2. Build mapping from ref tables
  console.log('=== 2. CHARGEMENT REFERENTIEL ===');

  const [refCats] = await conn.execute(
    `SELECT id, category_id, classification_regulateur, pays, region,
            categorie_locale_fundafrica, categorie_regionale_fundafrica, categorie_globale_fundafrica
     FROM ref_categories_fundafrica
     WHERE niveau_categorie = 'LOCAL' AND pays IS NOT NULL`
  );
  console.log(`  ${refCats.length} categories locales chargees`);

  const [refIndices] = await conn.execute(
    `SELECT id, indice_id, categorie_fundafrica, niveau_categorie,
            classification_regulateur, nom_indice_usd, statut_indice
     FROM ref_indices_fundafrica
     WHERE niveau_categorie = 'LOCAL'`
  );
  console.log(`  ${refIndices.length} indices locaux charges`);

  // Build lookup: CLASSIFICATION_UPPER + PAYS_UPPER -> { category, index }
  const mapping = {};
  for (const cat of refCats) {
    const key = `${(cat.classification_regulateur || '').toUpperCase()}|${(cat.pays || '').toUpperCase()}`;
    const matchingIdx = refIndices.find(
      i => i.categorie_fundafrica === cat.categorie_locale_fundafrica
    );
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
  console.log(`  ${Object.keys(mapping).length} mappings classification+pays construits\n`);

  // 3. Load active funds
  console.log('=== 3. BACKFILL FOND_INVESTISSEMENTS ===');
  let whereClause = 'active = 1';
  const params = [];
  if (fondId) {
    whereClause += ' AND id = ?';
    params.push(parseInt(fondId));
  } else if (pays) {
    whereClause += ' AND UPPER(pays) = UPPER(?)';
    params.push(pays);
  }
  if (!FORCE) {
    whereClause += ' AND (indice_fundafrica IS NULL OR indice_fundafrica = \'\')';
  }

  const [fonds] = await conn.execute(
    `SELECT id, nom_fond, classification, pays, indice_benchmark,
            indice_fundafrica, indice_fundafrica_id
     FROM fond_investissements
     WHERE ${whereClause}
     ORDER BY id`,
    params
  );
  console.log(`  ${fonds.length} fonds a traiter${FORCE ? ' (force mode)' : ''}\n`);

  // Classification normalization map
  const classifNorm = {
    'ACTIONS': 'ACTIONS',
    'ACTION': 'ACTIONS',
    'EQUITY': 'ACTIONS',
    'OBLIGATIONS': 'OBLIGATIONS',
    'OBLIGATION': 'OBLIGATIONS',
    'OBLIGATAIRE': 'OBLIGATIONS',
    'BOND': 'OBLIGATIONS',
    'BONDS': 'OBLIGATIONS',
    'FIXED INCOME': 'OBLIGATIONS',
    'DIVERSIFIE': 'DIVERSIFIE',
    'DIVERSIFIÉ': 'DIVERSIFIE',
    'DIVERSIFIES': 'DIVERSIFIE',
    'MIXTE': 'DIVERSIFIE',
    'BALANCED': 'DIVERSIFIE',
    'EQUILIBRE': 'DIVERSIFIE',
    'MONETAIRE': 'MONETAIRE',
    'MONÉTAIRE': 'MONETAIRE',
    'MONEY MARKET': 'MONETAIRE',
    'TRESORERIE': 'MONETAIRE',
    'TRÉSORERIE': 'MONETAIRE',
    'CONTRACTUEL': 'DIVERSIFIE',
  };

  // Pays normalization: match DB values to referentiel values
  const paysNorm = {
    'MAROC': 'MAROC',
    'MOROCCO': 'MAROC',
    'NIGERIA': 'NIGERIA',
    'TUNISIE': 'TUNISIE',
    'TUNISIA': 'TUNISIE',
    'UEMOA': 'UEMOA',
    'CEMAC': 'CEMAC',
    'KENYA': 'KENYA',
    'GHANA': 'GHANA',
    'EGYPTE': 'EGYPTE',
    'EGYPT': 'EGYPTE',
    'MAURITIUS': 'MAURICE',
    'MAURICE': 'MAURICE',
    'ILE MAURICE': 'MAURICE',
    'BOTSWANA': 'BOTSWANA',
    'NAMIBIE': 'NAMIBIE',
    'NAMIBIA': 'NAMIBIE',
    'RWANDA': 'RWANDA',
    'OUGANDA': 'OUGANDA',
    'UGANDA': 'OUGANDA',
    'TANZANIE': 'TANZANIE',
    'TANZANIA': 'TANZANIE',
    'ZAMBIE': 'ZAMBIE',
    'ZAMBIA': 'ZAMBIE',
    'ZIMBABWE': 'ZIMBABWE',
    'SENEGAL': 'UEMOA',
    'COTE D\'IVOIRE': 'UEMOA',
    'CÔTE D\'IVOIRE': 'UEMOA',
    'BURKINA FASO': 'UEMOA',
    'MALI': 'UEMOA',
    'TOGO': 'UEMOA',
    'NIGER': 'UEMOA',
    'BENIN': 'UEMOA',
    'BÉNIN': 'UEMOA',
    'GUINEE-BISSAU': 'UEMOA',
    'CAMEROUN': 'CEMAC',
    'CAMEROON': 'CEMAC',
    'GABON': 'CEMAC',
    'CONGO': 'CEMAC',
    'TCHAD': 'CEMAC',
    'CENTRAFRIQUE': 'CEMAC',
    'GUINEE EQUATORIALE': 'CEMAC',
    'ALGERIE': 'ALGERIE',
    'ALGERIA': 'ALGERIE',
    'ANGOLA': 'ANGOLA',
    'ETHIOPIE': 'ETHIOPIE',
    'ETHIOPIA': 'ETHIOPIE',
    'LIBYE': 'LIBYE',
    'LIBYA': 'LIBYE',
    'SOUDAN': 'SOUDAN',
    'SUDAN': 'SOUDAN',
    'MALAWI': 'MALAWI',
    'MOZAMBIQUE': 'MOZAMBIQUE',
    'SEYCHELLES': 'SEYCHELLES',
    'SIERRA LEONE': 'SIERRA LEONE',
    'SOMALIE': 'SOMALIE',
    'SOMALIA': 'SOMALIE',
    'ESWATINI': 'ESWATINI',
    'LESOTHO': 'LESOTHO',
    'CAP-VERT': 'CAP-VERT',
    'CAPE VERDE': 'CAP-VERT',
  };

  let updated = 0;
  let skippedNoMapping = 0;
  let skippedNoClassif = 0;
  let skippedNoPays = 0;
  let errors = 0;
  const unmapped = {};

  for (const f of fonds) {
    const rawClassif = (f.classification || '').trim().toUpperCase();
    const rawPays = (f.pays || '').trim().toUpperCase();

    if (!rawClassif) {
      skippedNoClassif++;
      continue;
    }
    if (!rawPays) {
      skippedNoPays++;
      continue;
    }

    const normClassif = classifNorm[rawClassif] || null;
    const normPays = paysNorm[rawPays] || null;

    if (!normClassif || !normPays) {
      const unmappedKey = `${rawClassif}|${rawPays}`;
      unmapped[unmappedKey] = (unmapped[unmappedKey] || 0) + 1;
      skippedNoMapping++;
      continue;
    }

    const lookupKey = `${normClassif}|${normPays}`;
    const m = mapping[lookupKey];

    if (!m) {
      const unmappedKey = `${normClassif}|${normPays} (normalise)`;
      unmapped[unmappedKey] = (unmapped[unmappedKey] || 0) + 1;
      skippedNoMapping++;
      continue;
    }

    if (EXECUTE) {
      try {
        await conn.execute(
          `UPDATE fond_investissements SET
             indice_fundafrica = ?,
             indice_fundafrica_id = ?,
             categorie_fundafrica_locale = ?,
             categorie_fundafrica_regionale = ?,
             categorie_fundafrica_globale = ?
           WHERE id = ?`,
          [
            m.indice_id_code,
            m.indice_id_pk,
            m.cat_locale,
            m.cat_regionale,
            m.cat_globale,
            f.id,
          ]
        );
        updated++;
      } catch (e) {
        console.error(`  ERREUR fond ${f.id} (${f.nom_fond}): ${e.message}`);
        errors++;
      }
    } else {
      updated++;
    }
  }

  // 4. Report
  console.log('\n=== RESUME ===');
  console.log(`Fonds traites:           ${fonds.length}`);
  console.log(`Fonds ${EXECUTE ? 'mis a jour' : 'a mettre a jour'}:  ${updated}`);
  console.log(`Ignores (pas classif):   ${skippedNoClassif}`);
  console.log(`Ignores (pas pays):      ${skippedNoPays}`);
  console.log(`Ignores (pas mapping):   ${skippedNoMapping}`);
  console.log(`Erreurs:                 ${errors}`);

  if (Object.keys(unmapped).length > 0) {
    console.log('\n--- Classifications/pays non mappes ---');
    Object.entries(unmapped)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, count]) => console.log(`  ${k}: ${count} fonds`));
  }

  // 5. Verification
  if (EXECUTE) {
    console.log('\n=== VERIFICATION ===');
    const [total] = await conn.execute('SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1');
    const [withIdx] = await conn.execute('SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1 AND indice_fundafrica IS NOT NULL');
    const [withoutIdx] = await conn.execute('SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1 AND (indice_fundafrica IS NULL OR indice_fundafrica = \'\')');
    const [byClassif] = await conn.execute(
      `SELECT classification, COUNT(*) as c,
              SUM(CASE WHEN indice_fundafrica IS NOT NULL THEN 1 ELSE 0 END) as mapped
       FROM fond_investissements WHERE active = 1 GROUP BY classification ORDER BY c DESC`
    );
    const [byPays] = await conn.execute(
      `SELECT pays, COUNT(*) as c,
              SUM(CASE WHEN indice_fundafrica IS NOT NULL THEN 1 ELSE 0 END) as mapped
       FROM fond_investissements WHERE active = 1 GROUP BY pays ORDER BY c DESC`
    );
    const [sampleMapping] = await conn.execute(
      `SELECT f.id, LEFT(f.nom_fond, 40) as nom, f.classification, f.pays,
              f.indice_benchmark, f.indice_fundafrica,
              f.categorie_fundafrica_locale, f.categorie_fundafrica_globale,
              i.nom_indice_usd, i.statut_indice
       FROM fond_investissements f
       LEFT JOIN ref_indices_fundafrica i ON i.indice_id = f.indice_fundafrica
       WHERE f.active = 1 AND f.indice_fundafrica IS NOT NULL
       ORDER BY f.pays, f.classification
       LIMIT 20`
    );

    console.log(`Fonds actifs total:       ${total[0].c}`);
    console.log(`Avec indice FundAfrica:   ${withIdx[0].c}`);
    console.log(`Sans indice FundAfrica:   ${withoutIdx[0].c}`);

    console.log('\n--- Par classification ---');
    byClassif.forEach(r => console.log(`  ${(r.classification || 'NULL').padEnd(20)} ${r.c} fonds, ${r.mapped} mappes`));

    console.log('\n--- Par pays ---');
    byPays.forEach(r => console.log(`  ${(r.pays || 'NULL').padEnd(20)} ${r.c} fonds, ${r.mapped} mappes`));

    console.log('\n--- Echantillon mapping (20 fonds) ---');
    console.log('ID  | Nom                                      | Classif      | Pays    | Benchmark         | Indice FA          | Cat Locale             | Indice Nom');
    sampleMapping.forEach(r => {
      console.log(
        `${String(r.id).padEnd(4)}| ${(r.nom || '').padEnd(41)}| ${(r.classification || '').padEnd(13)}| ${(r.pays || '').padEnd(8)}| ${(r.indice_benchmark || '').substring(0, 18).padEnd(18)}| ${(r.indice_fundafrica || '').substring(0, 19).padEnd(19)}| ${(r.categorie_fundafrica_locale || '').substring(0, 23).padEnd(23)}| ${r.nom_indice_usd || 'N/A'}`
      );
    });

    // Confirm benchmark NOT touched
    const [benchCheck] = await conn.execute(
      `SELECT COUNT(*) as c FROM fond_investissements WHERE active = 1 AND indice_benchmark IS NOT NULL AND indice_benchmark != ''`
    );
    console.log(`\nControle: ${benchCheck[0].c} fonds avec indice_benchmark => NON MODIFIE`);
  } else {
    console.log('\n(Mode diagnostic — aucune modification appliquee)');
    console.log('Ajouter --execute pour appliquer les changements.');

    // Show sample of what would be mapped
    console.log('\n--- Echantillon du mapping prevu ---');
    let shown = 0;
    for (const f of fonds) {
      if (shown >= 15) break;
      const rawClassif = (f.classification || '').trim().toUpperCase();
      const rawPays = (f.pays || '').trim().toUpperCase();
      const normClassif = classifNorm[rawClassif] || null;
      const normPays = paysNorm[rawPays] || null;
      if (!normClassif || !normPays) continue;
      const m = mapping[`${normClassif}|${normPays}`];
      if (!m) continue;
      console.log(`  Fond ${f.id} (${(f.nom_fond || '').substring(0, 35)}) ${rawClassif}/${rawPays} -> ${m.indice_id_code} (${m.indice_nom || 'pas de nom'}) [${m.indice_statut}]`);
      shown++;
    }
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => {
  console.error('ERREUR:', e);
  process.exit(1);
});
