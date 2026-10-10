/**
 * L0.a — Combien de lignes `MAX(date)` de performances n ont AUCUN ratio ?
 *
 * POURQUOI. J ai ecrit le 2026-10-06 que la substitution de la route
 * `saveperfdatemysql` par `scripts/fix/fix_populate_performances.js` etait
 * « neutre, equivalence verifiee ». C etait faux en portee, et je l ai verifie
 * de premiere main :
 *
 *   route `saveperfdatemysql`        ≈ 84 colonnes, dont ≈ 63 de ratios
 *                                   (`volatility*`, `ratiosharpe*`, `sortino*`,
 *                                   `var95*`, `calamar*`, `omega*`, `dsr*`…)
 *                                   via `/api/ratiosnewithdate/{1,3,5}`
 *   `fix_populate_performances.js`  15 colonnes, et AUCUN ratio
 *
 * Mon dry-run ne comparait que dix champs de performance. Ils concordent — mais
 * le script n ecrit pas les ratios. Or `src/services/ranking.service.js:9-15` :
 * `PERF_PERIODS_FULL` contient `volatility3an, ratiosharpe3an, pertemax3an,
 * sortino3an, info3an, calamar3an, var953an, betabaissier3an, omega3an, dsr3an`.
 * Le script INSERE une ligne a la derniere date de VL pour les fonds en retard :
 * elle devient la ligne `MAX(date)`, celle que lisent le classement, les
 * moyennes de categorie (`apigestionperformance.js:2272`) et les tableaux pays.
 *
 * Brancher le script tel quel guerirait C8 en VIDANT les colonnes de ratios et
 * les rangs de risque, sur un perimetre plus large que le defaut initial. On
 * remplacerait « chiffres plausibles et faux » par « chiffres justes et
 * colonnes vides ».
 *
 * CE SCRIPT ETABLIT LA LIGNE DE BASE qui permettra de le prouver ou de
 * l infirmer apres coup. Trois mesures :
 *
 *   1. Par pays, parmi les lignes `MAX(date)` : combien portent un
 *      `volatility3an` nul ou `'-'`. Si ce nombre est deja eleve, des lignes
 *      sans ratios existent — `worker-recalculation.js:263` lance deja ce
 *      script avec `--force`, donc le defaut peut etre en partie installe.
 *   2. Le temps de reponse de `/api/ratiosnewithdate/3/:fond/:date`. Ce chiffre
 *      seul dicte la duree du rattrapage : 886 fonds en retard x jusqu a trois
 *      appels. A 200 ms c est dix minutes, a 5 s c est quatre heures.
 *   3. La PRESENCE — jamais la valeur — de `DB_SYNC_ALTER` dans
 *      l environnement, prerequis de la migration d horodatage : si
 *      `sync({ alter: true })` tourne au demarrage, une colonne absente du
 *      modele peut etre supprimee.
 *
 * LECTURE SEULE : uniquement des SELECT, trois GET sur l API locale, et la
 * lecture du nom (pas du contenu) d une variable d environnement.
 *
 * USAGE  node scripts/diag/ondemand/diag_perf_colonnes_manquantes.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');
const http = require('http');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

// Les colonnes de ratios que le classement local lit reellement
// (ranking.service.js:9-15). Si elles sont vides, les rangs de risque le sont.
const RATIOS_DU_CLASSEMENT = [
  'volatility3an', 'ratiosharpe3an', 'pertemax3an', 'sortino3an', 'info3an',
  'calamar3an', 'var953an', 'betabaissier3an', 'omega3an', 'dsr3an',
];

const j = x => {
  if (!x) return '?';
  if (x instanceof Date) {
    const p = k => String(k).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  return String(x).slice(0, 10);
};

function get(chemin, timeoutMs = 30000) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const req = http.get({ host: '127.0.0.1', port: 3005, path: chemin, timeout: timeoutMs }, res => {
      let corps = '';
      res.on('data', c => { corps += c; });
      res.on('end', () => resolve({ code: res.statusCode, ms: Date.now() - t0, taille: corps.length, corps }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ code: 'TIMEOUT', ms: Date.now() - t0, taille: 0, corps: '' }); });
    req.on('error', e => resolve({ code: `ERR ${e.code || e.message}`, ms: Date.now() - t0, taille: 0, corps: '' }));
  });
}

(async () => {
  console.log('=== L0.a — RATIOS MANQUANTS SUR LA LIGNE MAX(date), ET COUT D UN APPEL DE RATIOS ===');
  console.log(`Mesure le ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC — LECTURE SEULE\n`);

  const conn = await mysql.createConnection(DB);
  try {
    // ---- 1. Volumetrie de la table ----------------------------------------
    const [vol] = await conn.execute(`
      SELECT COUNT(*) AS lignes, COUNT(DISTINCT fond_id) AS fonds,
             MIN(date) AS premiere, MAX(date) AS derniere
        FROM performences`);
    console.log('## 1. Volumetrie de `performences`');
    console.log(`  ${vol[0].lignes} lignes | ${vol[0].fonds} fonds distincts`
      + ` | de ${j(vol[0].premiere)} a ${j(vol[0].derniere)}\n`);

    // ---- 2. Ratios nuls sur la ligne MAX(date), par pays -------------------
    // La ligne MAX(date) est celle que lisent le classement, les moyennes de
    // categorie et les fiches. C est la seule dont l etat compte pour
    // l affichage. `'-'` compte comme absent : c est la valeur que la route
    // ecrit quand l endpoint de ratios echoue, et `rankFundInList` l exclut
    // explicitement (`f[period] != '-'`).
    const casRatioVide = RATIOS_DU_CLASSEMENT
      .map(c => `(p.${c} IS NULL OR p.${c} = '-')`).join(' AND ');

    const [parPays] = await conn.execute(`
      SELECT f.pays,
             COUNT(*)                                               AS fonds,
             SUM(CASE WHEN p.volatility3an IS NULL OR p.volatility3an = '-'
                      THEN 1 ELSE 0 END)                            AS vol3an_vide,
             SUM(CASE WHEN ${casRatioVide} THEN 1 ELSE 0 END)       AS tous_ratios_vides,
             ROUND(AVG(DATEDIFF(v.dv, p.date)), 1)                  AS retard_j
        FROM fond_investissements f
        JOIN (SELECT fund_id, MAX(date) AS dv FROM valorisations GROUP BY fund_id) v
          ON v.fund_id = f.id
        JOIN (SELECT fond_id, MAX(date) AS dp FROM performences GROUP BY fond_id) m
          ON m.fond_id = f.id
        JOIN performences p ON p.fond_id = f.id AND p.date = m.dp
       WHERE f.active = 1
       GROUP BY f.pays
       ORDER BY tous_ratios_vides DESC, f.pays`);

    console.log('## 2. Ligne MAX(date) de chaque fonds actif — ratios absents (NULL ou `-`)');
    console.log('   LIGNE DE BASE : apres le rattrapage, ces nombres ne doivent pas augmenter.');
    let totalFonds = 0, totalVides = 0;
    for (const r of parPays) {
      totalFonds += Number(r.fonds); totalVides += Number(r.tous_ratios_vides);
      const pct = (100 * Number(r.tous_ratios_vides) / Number(r.fonds)).toFixed(1);
      console.log(`  ${String(r.pays || 'INCONNU').padEnd(14)} ${String(r.fonds).padStart(4)} fonds`
        + ` | volatility3an vide : ${String(r.vol3an_vide).padStart(4)}`
        + ` | les 10 ratios vides : ${String(r.tous_ratios_vides).padStart(4)} (${pct} %)`
        + ` | retard perf. ${String(r.retard_j).padStart(6)} j`);
    }
    console.log(`  ${'TOTAL'.padEnd(14)} ${String(totalFonds).padStart(4)} fonds`
      + ` | les 10 ratios vides : ${totalVides}`
      + ` (${(100 * totalVides / Math.max(totalFonds, 1)).toFixed(1)} %)\n`);

    // ---- 3. Combien de fonds le rattrapage toucherait ----------------------
    // Sans `--force`, le script ignore les fonds dont la derniere performance
    // est deja a la derniere date de VL. C est le perimetre reel de L3.
    const [cible] = await conn.execute(`
      SELECT f.pays, COUNT(*) AS a_rattraper
        FROM fond_investissements f
        JOIN (SELECT fund_id, MAX(date) AS dv FROM valorisations GROUP BY fund_id) v
          ON v.fund_id = f.id
        LEFT JOIN (SELECT fond_id, MAX(date) AS dp FROM performences GROUP BY fond_id) p
          ON p.fond_id = f.id
       WHERE f.active = 1 AND (p.dp IS NULL OR p.dp <> v.dv)
       GROUP BY f.pays
       ORDER BY a_rattraper DESC`);
    const totalCible = cible.reduce((s, r) => s + Number(r.a_rattraper), 0);
    console.log('## 3. Perimetre reel du rattrapage (sans `--force`)');
    for (const r of cible) {
      console.log(`  ${String(r.pays || 'INCONNU').padEnd(14)} ${String(r.a_rattraper).padStart(4)} fonds a rattraper`);
    }
    console.log(`  ${'TOTAL'.padEnd(14)} ${String(totalCible).padStart(4)} fonds\n`);

    // ---- 4. Cout d un appel de ratios -------------------------------------
    // Trois fonds de pays differents, a leur derniere date de VL : exactement
    // ce que le script appellerait. Ce chiffre dicte la duree de L3.
    // Un fonds par pays, choisi par `MIN(id)` dans une sous-requete plutot
    // qu un `GROUP BY` sur colonnes non agregees : `ONLY_FULL_GROUP_BY` est
    // actif par defaut depuis MySQL 5.7 et rejetterait la seconde forme.
    const [echant] = await conn.execute(`
      SELECT f.id, f.pays, v.dv
        FROM fond_investissements f
        JOIN (SELECT fund_id, MAX(date) AS dv FROM valorisations GROUP BY fund_id) v
          ON v.fund_id = f.id
       WHERE f.id IN (
         SELECT MIN(f2.id) FROM fond_investissements f2
          WHERE f2.active = 1 AND f2.pays IN ('MAROC', 'NIGERIA', 'UEMOA')
            AND f2.id IN (SELECT DISTINCT fund_id FROM valorisations)
          GROUP BY f2.pays)
       ORDER BY f.pays`);

    console.log('## 4. Temps de reponse de `/api/ratiosnewithdate/3/:fond/:date`');
    console.log('   Ce chiffre seul dicte la duree de L3 : il sera multiplie par le perimetre ci-dessus.');
    let sommeMs = 0, mesures = 0;
    for (const e of echant) {
      const d = j(e.dv);
      const r = await get(`/api/ratiosnewithdate/3/${e.id}/${d}`);
      if (typeof r.code === 'number' && r.code === 200) { sommeMs += r.ms; mesures++; }
      console.log(`  fonds ${String(e.id).padStart(5)} (${String(e.pays).padEnd(8)}) date=${d}`
        + ` → HTTP ${r.code} en ${String(r.ms).padStart(6)} ms, ${r.taille} octets`);
    }
    if (mesures > 0) {
      const moy = sommeMs / mesures;
      console.log(`  moyenne : ${moy.toFixed(0)} ms sur ${mesures} appel(s) reussi(s)`);
      // Jusqu a trois appels par fonds (1, 3 et 5 ans) selon l historique
      // disponible — `fetchRatioData` les conditionne par `years`.
      for (const n of [1, 3]) {
        const h = (totalCible * n * moy) / 3600000;
        console.log(`  → projection L3 : ${totalCible} fonds x ${n} appel(s) ≈ ${h.toFixed(2)} h`);
      }
    } else {
      console.log('  AUCUN appel reussi — projection impossible, a reprendre avant L3.');
    }
    console.log('');

    // ---- 4bis. Type REEL des colonnes de ratios, et valeur d absence ------
    // Question ouverte, et il ne faut pas y repondre par une supposition.
    // `src/models/performence.js` declare ces colonnes en DOUBLE, mais
    // `getRatioDataFields` (apigestionsavequotidien.js:1470) ecrit la CHAINE
    // `'-'` quand l endpoint de ratios n a pas ete appele — ce qui arrive pour
    // tout fonds de moins d un an d historique, sur les 63 colonnes a la fois.
    //
    // Les deux cas n ont pas les memes consequences :
    //   - colonne VARCHAR : `'-'` est stocke tel quel, et `rankFundInList`
    //     l exclut explicitement (`f[period] != '-'`) : comportement correct ;
    //   - colonne DOUBLE en mode non strict : `'-'` devient **0**, que
    //     `rankFundInList` prend pour une valeur valide — un fonds sans ratio
    //     serait classe comme ayant une volatilite nulle, donc premier.
    //
    // De cette reponse depend ce que le script de rattrapage doit ecrire en
    // cas d absence : `'-'` comme la route, ou `NULL` comme le pendant EUR/USD.
    const RATIOS_ECHANTILLON = ['volatility3an', 'ratiosharpe3an', 'r2_3an', 'alpha3an', 'perfannu3an'];
    const [colonnes] = await conn.execute(`
      SELECT column_name, data_type, column_type, is_nullable
        FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'performences'
         AND column_name IN (${RATIOS_ECHANTILLON.map(() => '?').join(', ')})
       ORDER BY column_name`, RATIOS_ECHANTILLON);
    console.log('## 4bis. Type REEL des colonnes de ratios, et mode SQL');
    for (const c of colonnes) {
      console.log(`  ${String(c.column_name || c.COLUMN_NAME).padEnd(16)}`
        + ` ${String(c.column_type || c.COLUMN_TYPE).padEnd(14)}`
        + ` nullable=${c.is_nullable || c.IS_NULLABLE}`);
    }
    // `lastdatepreviousmonth` : la route le passe a Sequelize
    // (apigestionsavequotidien.js:1439) mais `src/models/performence.js` ne
    // DECLARE PAS cette colonne — Sequelize ignore silencieusement un attribut
    // non declare. Donc la route ne l ecrit probablement jamais. Si la colonne
    // n existe pas en base, l ajouter au script de rattrapage CREERAIT une
    // divergence au lieu d en supprimer une : le plan se trompait sur ce point,
    // et c est cette mesure qui tranche.
    const [existe] = await conn.execute(`
      SELECT column_name, column_type
        FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'performences'
         AND column_name = 'lastdatepreviousmonth'`);
    console.log(`  lastdatepreviousmonth : ${existe.length
      ? `EXISTE (${existe[0].column_type || existe[0].COLUMN_TYPE}) — a instruire`
      : 'ABSENTE de la table → la route ne l ecrit pas, le script ne doit pas l ecrire non plus'}`);

    const [nbCol] = await conn.execute(`
      SELECT COUNT(*) AS n FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'performences'`);
    console.log(`  table performences : ${nbCol[0].n} colonnes au total`
      + ' — c est le denominateur du « 0 divergence sur N colonnes » attendu en L1.');

    const [mode] = await conn.query("SELECT @@SESSION.sql_mode AS m");
    const strict = /STRICT_(ALL|TRANS)_TABLES/.test(String(mode[0].m || ''));
    console.log(`  sql_mode : ${String(mode[0].m || '').slice(0, 120)}`);
    console.log(`  → mode strict : ${strict ? 'OUI (une ecriture de `-` dans un DOUBLE echouerait)'
      : 'NON (une ecriture de `-` dans un DOUBLE donnerait 0 — faux ratio valide)'}`);

    // Distribution de volatility3an : un pic exact a 0 trahirait des `'-'`
    // convertis. Une volatilite reellement nulle est quasi impossible.
    const [distrib] = await conn.execute(`
      SELECT SUM(CASE WHEN volatility3an IS NULL THEN 1 ELSE 0 END)   AS nuls,
             SUM(CASE WHEN volatility3an = 0 THEN 1 ELSE 0 END)       AS zeros,
             SUM(CASE WHEN volatility3an > 0 THEN 1 ELSE 0 END)       AS positifs,
             SUM(CASE WHEN volatility3an < 0 THEN 1 ELSE 0 END)       AS negatifs,
             COUNT(*)                                                 AS total
        FROM performences`);
    const d = distrib[0];
    console.log(`  volatility3an sur ${d.total} lignes : ${d.nuls} NULL | ${d.zeros} exactement 0`
      + ` | ${d.positifs} > 0 | ${d.negatifs} < 0`);
    console.log(`  → ${Number(d.zeros) > 0
      ? 'des zeros exacts existent : a instruire, une volatilite nulle n a pas de sens financier'
      : 'aucun zero exact : l absence est bien representee par NULL'}\n`);

    // ---- 5. Prerequis de la migration d horodatage ------------------------
    // Presence seule. Ne JAMAIS imprimer la valeur d une variable
    // d environnement : ce rapport est commite dans le depot.
    console.log('## 5. Prerequis de la migration L2 (horodatage des classements)');
    for (const cle of ['DB_SYNC_ALTER', 'DB_SYNC']) {
      const definie = Object.prototype.hasOwnProperty.call(process.env, cle);
      const actif = process.env[cle] === 'true';
      console.log(`  ${cle.padEnd(14)} : ${definie ? 'definie' : 'ABSENTE'}`
        + ` | vaut 'true' : ${actif ? 'OUI' : 'non'}`
        + (actif ? '  ← DANGER : sync({ alter: true }) au demarrage, une colonne'
          + ' hors modele peut etre supprimee ; L2 doit alors basculer les modeles'
          + ' en meme temps que la migration' : ''));
    }
    const [tbl] = await conn.execute(`
      SELECT table_name, table_rows, data_length, index_length
        FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name IN ('classementfonds', 'classementfonds_eurs', 'classementfonds_usds')
       ORDER BY table_name`);
    for (const t of tbl) {
      console.log(`  ${String(t.table_name || t.TABLE_NAME).padEnd(22)} ≈ ${t.table_rows || t.TABLE_ROWS} lignes`
        + ` | donnees ${(Number(t.data_length || t.DATA_LENGTH) / 1048576).toFixed(1)} Mo`
        + ` | index ${(Number(t.index_length || t.INDEX_LENGTH) / 1048576).toFixed(1)} Mo`);
    }
  } finally {
    await conn.end();
  }
  console.log('\n=== FIN L0.a — aucune ecriture effectuee ===');
})().catch(e => { console.error('ECHEC L0.a :', e.message); process.exit(1); });
