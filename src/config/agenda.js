// config/agenda.js
const Agenda = require('agenda');
const { MongoClient } = require('mongodb');

const agenda = new Agenda();

// Configuration MySQL
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fond_opcvm'
});

// Connecter Agenda à MySQL
agenda.mongo(
    connection,
    'agendaJobs'
);

module.exports = agenda;