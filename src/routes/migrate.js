const mysql = require('mysql2/promise');
const { createClient } = require('@clickhouse/client');

// Connect to MySQL
async function fetchMySQLData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'fond_opcvm'
  });

  const [rows, fields] = await connection.execute('SELECT * FROM cashs');
  return rows;
}

// Connect to ClickHouse
const clickhouse = createClient({
    url: 'http://172.20.27.129:8123', // L'adresse IP de votre WSL et le port 8123
    username: 'default',
    password: 'Testing',  // ou votre mot de passe si défini
    protocol: 'http',
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
