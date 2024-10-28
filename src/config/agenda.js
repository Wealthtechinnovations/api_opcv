// config/agenda.js
const Agenda = require('agenda');
const { MongoClient } = require('mongodb');

const agenda = new Agenda();

// Configuration MySQL
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'fond_opcvm'
});

// Connecter Agenda à MySQL
agenda.mongo(
    connection,
    'agendaJobs'
);

module.exports = agenda;