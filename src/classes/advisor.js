class RobotAdvisor {
    constructor(assets, prices, investmentAmount, goalReturn, goalVolatility, timeHorizon) {
        this.assets = assets;
        this.prices = prices;
        this.investmentAmount = investmentAmount;
        this.goalReturn = goalReturn;
        this.goalVolatility = goalVolatility;
        this.timeHorizon = timeHorizon;
        this.portfolio = {}; // Objet pour stocker les informations du portefeuille
    }

    suggestAllocation() {
        const returns = this.calculateReturns();
        const covMatrix = this.calculateCovarianceMatrix(returns);
        const portfolio = this.optimizePortfolio(covMatrix);
        return portfolio;
    }

    calculateReturns() {
        const returns = {};
        for (const asset of this.assets) {
            const prices = this.prices[asset];
            const assetReturns = [];
            for (let i = 1; i < prices.length; i++) {
                const priceToday = prices[i];
                const priceYesterday = prices[i - 1];
                const assetReturn = (priceToday - priceYesterday) / priceYesterday;
                assetReturns.push(assetReturn);
            }
            returns[asset] = assetReturns;
        }
        return returns;
    }

    calculateCovarianceMatrix(returns) {
        const covMatrix = [];
        for (const asset1 of this.assets) {
            const row = [];
            for (const asset2 of this.assets) {
                const returns1 = returns[asset1];
                const returns2 = returns[asset2];
                const covariance = this.calculateCovariance(returns1, returns2);
                row.push(covariance);
            }
            covMatrix.push(row);
        }
        return covMatrix;
    }

    calculateCovariance(returns1, returns2) {
        const n = returns1.length;
        let sum = 0;
        for (let i = 0; i < n; i++) {
            sum += returns1[i] * returns2[i];
        }
        const mean1 = returns1.reduce((acc, val) => acc + val, 0) / n;
        const mean2 = returns2.reduce((acc, val) => acc + val, 0) / n;
        const covariance = (sum / n) - (mean1 * mean2);
        return covariance;
    }

    optimizePortfolio(covMatrix) {
        const n = this.assets.length;

        // Génération aléatoire de poids initiaux
        let weights = Array.from({ length: n }, () => Math.random());
        const sum = weights.reduce((acc, val) => acc + val, 0);
        weights = weights.map((weight) => weight / sum);

        // Fonction d'objectif pour maximiser le rendement attendu pour une volatilité donnée
        const objective = (weights) => {
            const portfolioReturn = weights.reduce((acc, weight, index) => acc + (weight * this.goalReturn[index]), 0);
            const portfolioVolatility = Math.sqrt(
                weights.reduce((acc, weight1, index1) =>
                    acc + (weight1 * weights.reduce((acc2, weight2, index2) =>
                        acc2 + (weight2 * covMatrix[index1][index2]), 0)), 0)
            );
            return -portfolioReturn + portfolioVolatility; // Négatif pour maximiser
        };

        // Contraintes : somme des poids = 1, tous les poids >= 0
        const constraints = [
            { type: 'eq', fun: (weights) => weights.reduce((acc, val) => acc + val, 0) - 1 },
            { type: 'ineq', fun: (weights) => Math.min(...weights) }
        ];

        // Optimisation en utilisant la méthode minimize de la bibliothèque 'scipy.optimize.minimize'
        const optimizedWeights = minimize(objective, weights, { constraints }).x;

        const portfolio = {};
        for (let i = 0; i < n; i++) {
            portfolio[this.assets[i]] = optimizedWeights[i] * this.investmentAmount;
        }
        return portfolio;
    }
}

// Exemple d'utilisation du robot advisor
const assets = ['AAPL', 'GOOGL', 'AMZN']; // Liste des actifs
const prices = {
    AAPL: [100, 110, 105, 120, 115], // Historique des prix de l'actif AAPL
    GOOGL: [2000, 2100, 2050, 2200, 2150], // Historique des prix de l'actif GOOGL
    AMZN: [3000, 3100, 3050, 3200, 3150] // Historique des prix de l'actif AMZN
};
const investmentAmount = 10000; // Montant à investir
const goalReturn = [0.1, 0.15, 0.12]; // Objectifs de rendement annuel pour chaque actif
const goalVolatility = [0.2, 0.25, 0.18]; // Objectifs de volatilité pour chaque actif
const timeHorizon = 5; // Horizon temporel

const advisor = new RobotAdvisor(assets, prices, investmentAmount, goalReturn, goalVolatility, timeHorizon);
const suggestedAllocation = advisor.suggestAllocation();
console.log('Allocation suggérée :', suggestedAllocation);