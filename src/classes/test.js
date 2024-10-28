var PortfolioAllocation = require('portfolio-allocation');

// Définir les actifs du portefeuille et leurs rendements historiques
/*var assets = ['AAPL', 'MSFT', 'AMZN', 'GOOG'];
var returns = [
    [0.01, 0.02, 0.03, 0.04], // Rendements du mois 1
    [0.02, 0.01, 0.04, 0.03], // Rendements du mois 2
    [0.03, 0.04, 0.01, 0.02], // Rendements du mois 3
    [0.04, 0.03, 0.02, 0.01] // Rendements du mois 4
];*/
// Importer les modules nécessaires
const mysqls = require('mysql');

// Définir la liste des actifs disponibles et leurs symboles boursiers
const connection = mysqls.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'fi',
});
const assets = [
    { name: 'Apple', symbol: 33 },
    { name: 'Microsoft', symbol: 'MSFT' },
    { name: 'Amazon', symbol: 'AMZN' },
    { name: 'Tesla', symbol: 'TSLA' },
    { name: 'Facebook', symbol: 'FB' }
];

connection.connect();

// Obtenez la liste des fonds disponibles (vous pouvez la récupérer depuis la base de données)
const funds = ['LU1819480192', 'FR0010434019p', 'benchagressor'];

// Période de dates
const startDate = '2018-07-31';
const endDate = '2023-07-31';

// Construisez la requête SQL pour obtenir les rendements par date et fond dans la période
const sqlQuery = `
  SELECT
    d.Date,
    ${funds.map(fund => `(SELECT rendement FROM roboad WHERE Fond = '${fund}' AND Date = d.Date) AS ${fund}`).join(', ')}
  FROM
    (SELECT DISTINCT Date FROM roboad WHERE Date BETWEEN ? AND ? and existe is null) AS d
`;

// Exécutez la requête SQL
connection.query(sqlQuery, [startDate, endDate], (error, rows) => {
    if (error) throw error;

    // Organisez les valeurs dans un tableau
    const valuesOnly = [];
    for (const row of rows) {
        const fundValues = funds.map(fund => row[fund]);
        valuesOnly.push(fundValues);
    }

    // console.log(valuesOnly);
    // Calculer la matrice de covariance des rendements des actifs
    var covMatrix = PortfolioAllocation.covarianceMatrix(valuesOnly);
    var targetReturn = 0.002; // Rendement attendu de 2% par mois
    var weights = PortfolioAllocation.proportionalMinimumVarianceWeights(covMatrix, targetReturn);
    // Calculer les poids optimaux du portefeuille qui minimise la variance
    // var weights = PortfolioAllocation.globalMinimumVarianceWeights(covMatrix);

    // Afficher les résultats
    console.log('Les poids optimaux du portefeuille sont :');
    for (var i = 0; i < funds.length; i++) {
        console.log(funds[i] + ' : ' + weights[i]);
    }
    connection.end();
});

/*
// Calculer la matrice de covariance des rendements des actifs
var covMatrix = PortfolioAllocation.covarianceMatrix(returns);

// Calculer les poids optimaux du portefeuille qui minimise la variance
var weights = PortfolioAllocation.globalMinimumVarianceWeights(covMatrix);

// Afficher les résultats
console.log('Les poids optimaux du portefeuille sont :');
for (var i = 0; i < assets.length; i++) {
    console.log(assets[i] + ' : ' + weights[i].toFixed(2));
}*/
