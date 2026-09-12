/**
 * Toutes les ruptures d echelle QUI SUBSISTENT, sans presupposer leur date.
 *
 * POURQUOI. `fix_scale_break_sec.js` a retire 82 lignes, celles du lot insere le
 * 2026-08-10. Les performances glissantes du fonds 1141 sont revenues a des
 * valeurs plausibles (1 an : -99,93 % -> -5,03 %). Mais son YTD reste a
 * **143 958 %** : la performance depuis le 1er janvier compare a une valeur de
 * fin 2025, et ce point de reference est donc lui aussi a la mauvaise echelle.
 *
 * Il existe donc d autres lignes polluees, ANTERIEURES au lot corrige. Mon
 * perimetre etait trop etroit : borne a une date d insertion, il ne pouvait pas
 * les voir. Ce diagnostic ne borne rien — il compare chaque ligne a la
 * precedente du meme fonds et signale tout saut d un facteur >= 10, quelle que
 * soit sa date d insertion, sa devise ou sa provenance.
 *
 * Il n agit pas : il decrit. La correction viendra apres, sur ce qu il aura
 * montre, et pas avant.
 *
 * LECTURE SEULE — uniquement des SELECT.
 *
 * USAGE  node scripts/diag/ondemand/diag_ruptures_restantes.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mysql = require('mysql2/promise');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'fund_opcvm',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fund_opcvm',
  charset: 'utf8mb4',
};

const FACTEUR = 10;

(async () => {
  const conn = await mysql.createConnection(DB);
  try {
    console.log('\n=== RUPTURES D ECHELLE RESTANTES — toutes dates confondues ===');
    console.log(`Mesure le ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — LECTURE SEULE`);
    console.log(`Critere : saut d un facteur >= ${FACTEUR} par rapport a la VL precedente du meme fonds\n`);

    // Comparaison a la ligne PRECEDENTE, pas au maximum de la serie : un maximum
    // pollue rendrait suspecte toute la serie saine autour de lui. Le saut entre
    // deux points consecutifs designe la ligne fautive, pas ses voisines.
    // UNE SEULE PASSE. La premiere version correlait une sous-requete
    // `SELECT MAX(date) ... WHERE date < v.date` a CHAQUE ligne : sur plus d un
    // million de VL, cela relance une recherche par ligne et ne se termine pas
    // en temps raisonnable. Lancee en production, elle est restee bloquee.
    // `LAG()` fait le meme travail en un seul tri : chaque ligne recoit la
    // valeur precedente de son propre fonds, sans relire la table.
    const [ruptures] = await conn.query(`
      WITH serie AS (
        SELECT v.fund_id,
               v.date,
               v.value,
               v.created_at,
               v.currency_code,
               v.correction_batch,
               v.source_url,
               LAG(v.value) OVER (PARTITION BY v.fund_id ORDER BY v.date) AS valeur_precedente,
               LAG(v.date)  OVER (PARTITION BY v.fund_id ORDER BY v.date) AS date_precedente
          FROM valorisations v
          JOIN fond_investissements f ON f.id = v.fund_id AND f.active = 1
         WHERE v.value > 0
      )
      SELECT s.fund_id,
             f.nom_fond,
             f.pays,
             f.dev_libelle,
             s.date,
             s.value,
             s.valeur_precedente,
             s.date_precedente,
             ROUND(GREATEST(s.value / s.valeur_precedente,
                            s.valeur_precedente / s.value), 1) AS facteur,
             DATE(s.created_at)                                 AS insere_le,
             s.currency_code,
             s.correction_batch,
             CASE WHEN s.source_url IS NULL THEN 'non' ELSE 'oui' END AS a_une_source
        FROM serie s
        JOIN fond_investissements f ON f.id = s.fund_id
       WHERE s.valeur_precedente > 0
         AND (s.value / s.valeur_precedente >= ${FACTEUR}
           OR s.valeur_precedente / s.value >= ${FACTEUR})
       ORDER BY f.pays, s.fund_id, s.date
    `);

    if (!ruptures.length) {
      console.log('Aucune rupture. La base est coherente sur ce critere.');
      return;
    }

    console.log(`TOTAL : ${ruptures.length} ligne(s) sur ${new Set(ruptures.map(r => r.fund_id)).size} fonds\n`);

    // Par pays et par date d insertion : c est ce qui identifie le chargeur fautif.
    const parLot = new Map();
    for (const r of ruptures) {
      const cle = `${r.pays} | insere le ${r.insere_le ? String(r.insere_le).slice(0, 10) : 'inconnu'}`;
      parLot.set(cle, (parLot.get(cle) || 0) + 1);
    }
    console.log('## Repartition par pays et lot d insertion\n');
    for (const [cle, n] of [...parLot.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(5)} ligne(s)   ${cle}`);
    }

    console.log('\n## Detail (60 premieres)\n');
    console.log(`  ${'fonds'.padStart(5)} ${'dev'.padEnd(4)} ${'date'.padEnd(10)} ${'valeur'.padStart(14)} ${'precedente'.padStart(14)} ${'fact.'.padStart(7)} ${'insere'.padEnd(10)} ${'devise'.padEnd(6)} src  nom`);
    console.log(`  ${'-'.repeat(5)} ${'-'.repeat(4)} ${'-'.repeat(10)} ${'-'.repeat(14)} ${'-'.repeat(14)} ${'-'.repeat(7)} ${'-'.repeat(10)} ${'-'.repeat(6)} ---  ---`);
    for (const r of ruptures.slice(0, 60)) {
      const d = x => (x ? String(x).slice(0, 10) : '?');
      console.log(
        `  ${String(r.fund_id).padStart(5)} ${String(r.dev_libelle || '?').padEnd(4)} ${d(r.date).padEnd(10)}` +
        ` ${Number(r.value).toFixed(4).padStart(14)} ${Number(r.valeur_precedente).toFixed(4).padStart(14)}` +
        ` ${String(r.facteur).padStart(7)} ${d(r.insere_le).padEnd(10)} ${String(r.currency_code || '-').padEnd(6)}` +
        ` ${String(r.a_une_source).padEnd(4)} ${String(r.nom_fond).slice(0, 30)}`
      );
    }
    if (ruptures.length > 60) console.log(`  ... et ${ruptures.length - 60} autre(s)`);

    // Une ligne QUALIFIEE en rupture ne se supprime pas a l aveugle : elle a une
    // provenance, donc elle se corrige a la source. La distinction commande le
    // traitement, elle doit apparaitre.
    const qualifiees = ruptures.filter(r => r.currency_code || r.correction_batch || r.a_une_source === 'oui');
    console.log(`\n## Provenance\n`);
    console.log(`  ${ruptures.length - qualifiees.length} ligne(s) SANS provenance — meme signature que les 82 deja retirees`);
    console.log(`  ${qualifiees.length} ligne(s) AVEC provenance — a corriger a la source, jamais par suppression aveugle`);

    console.log('');
  } finally {
    await conn.end();
  }
})().catch(err => {
  console.error('ERREUR :', err.message);
  process.exitCode = 1;
});
