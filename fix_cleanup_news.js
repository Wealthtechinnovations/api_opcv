/**
 * fix_cleanup_news.js
 *
 * Nettoie les publications test de la table actualites.
 * Les 5 entrees existantes sont toutes des tests de 2024.
 *
 * Usage:
 *   node fix_cleanup_news.js              # diagnostic
 *   node fix_cleanup_news.js --execute    # suppression
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

async function run() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('Connecte a fund_opcvm');
  console.log(EXECUTE ? 'MODE: EXECUTE\n' : 'MODE: DIAGNOSTIC\n');

  const [rows] = await conn.execute('SELECT id, date, LEFT(description, 80) as descr, username, type FROM actualites ORDER BY id');
  console.log(`${rows.length} publications trouvees:`);
  rows.forEach(r => {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date;
    console.log(`  ID=${r.id} date=${d} user=${r.username || 'NULL'} type=${r.type || 'NULL'} desc="${r.descr}"`);
  });

  const testIds = rows
    .filter(r => {
      const t = (r.type || '').toLowerCase();
      const d = (r.descr || '').toLowerCase();
      return t.includes('test') || d.includes('test') || d.length < 20 || t === 'nl';
    })
    .map(r => r.id);

  console.log(`\n${testIds.length} publications test identifiees: IDs [${testIds.join(', ')}]`);

  if (EXECUTE && testIds.length > 0) {
    const placeholders = testIds.map(() => '?').join(', ');
    const [result] = await conn.execute(
      `DELETE FROM actualites WHERE id IN (${placeholders})`,
      testIds
    );
    console.log(`${result.affectedRows} publications supprimees.`);

    const [remaining] = await conn.execute('SELECT COUNT(*) as c FROM actualites');
    console.log(`Publications restantes: ${remaining[0].c}`);
  } else if (!EXECUTE) {
    console.log('\n(Mode diagnostic — aucune suppression. Ajouter --execute pour supprimer.)');
  }

  await conn.end();
  console.log('\nTermine.');
}

run().catch(e => { console.error('ERREUR:', e); process.exit(1); });
