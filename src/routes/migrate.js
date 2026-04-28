const mysql = require('mysql2/promise');
const { createClient } = require('@clickhouse/client');

// Connect to MySQL
async function fetchMySQLData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fond_opcvm'
  });

  const [rows, fields] = await connection.execute('SELECT * FROM cashs');
  return rows;
}

// Connect to ClickHouse
const clickhouse = createClient({
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
  });

async function insertIntoClickHouse(rows) {
  const query = 'INSERT INTO test (id, name, age) VALUES';
  const values = rows.map(row => `(${row.id}, '${row.nom}', ${row.id})`).join(',');
  
  // Insertion des données dans ClickHouse
  await clickhouse.query({
    query: `${query} ${values}`,
    format: 'json'
  });
}

async function migrateData() {
  const mysqlRows = await fetchMySQLData();
  await insertIntoClickHouse(mysqlRows);
}

migrateData().catch(console.error);
