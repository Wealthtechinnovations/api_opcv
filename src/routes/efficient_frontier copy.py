from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Ajoute le middleware CORS

@app.route('/efficient-frontier', methods=['POST'])
def efficient_frontier():
    data = request.json
    
    # Récupération des données
    returns = pd.DataFrame(data['returns'])
    min_return = float(data['minReturn'])/100
    max_return = float(data['maxReturn'])/100
    max_volatility = float(data['maxVolatility'])/100
    nombreportefeuille = int(data['nombreportefeuille'])
    fund_names = data['fund_names']
    
    # Calcul des statistiques de performance
    mean_returns = returns.mean()
    cov_matrix = returns.cov()
    
    # Définition du risque sans risque (hypothétique ici)
    risk_free_rate = 0.01  # par exemple, à ajuster selon vos besoins
    
    # Fonction pour calculer la performance d'un portefeuille
    def portfolio_performance(weights, mean_returns, cov_matrix):
        portfolio_return = np.sum(mean_returns * weights)
        portfolio_std_dev = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        return portfolio_return, portfolio_std_dev
    
    # Fonction objectif pour maximiser le ratio de Sharpe
    def neg_sharpe_ratio(weights, mean_returns, cov_matrix, risk_free_rate):
        p_ret, p_var = portfolio_performance(weights, mean_returns, cov_matrix)
        return -(p_ret - risk_free_rate) / p_var
    
    # Fonction pour optimiser le ratio de Sharpe
    def max_sharpe_ratio(mean_returns, cov_matrix, risk_free_rate):
        num_assets = len(mean_returns)
        args = (mean_returns, cov_matrix, risk_free_rate)
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
                       {'type': 'ineq', 'fun': lambda x: x - 0.4})  # Contrainte pour <= 40% d'allocation
        bounds = tuple((0, 1) for _ in range(num_assets))
        result = minimize(neg_sharpe_ratio, num_assets * [1. / num_assets,], args=args,
                          method='SLSQP', bounds=bounds, constraints=constraints)
        return result
    
    # Optimisation du ratio de Sharpe
    max_sharpe = max_sharpe_ratio(mean_returns, cov_matrix, risk_free_rate)
    
    # Nombre de portefeuilles efficaces à générer
    num_portfolios = nombreportefeuille
    efficient_portfolios = []
    
    # Génération de portefeuilles efficaces
    for i in range(num_portfolios):
        weights = np.random.random(len(mean_returns))
        weights /= np.sum(weights)
        portfolio_return, portfolio_std_dev = portfolio_performance(weights, mean_returns, cov_matrix)
        
        # Filtrer les portefeuilles par critères de rendement et de volatilité
        if portfolio_return >= min_return and portfolio_return <= max_return and portfolio_std_dev <= max_volatility:
            efficient_portfolios.append({
                'weights': weights.tolist(),
                'return': portfolio_return,
                'risk': portfolio_std_dev
            })
    
    # Préparation des résultats à renvoyer
    result = {
        'max_sharpe_weights': max_sharpe.x.tolist(),
        'efficient_portfolios': efficient_portfolios,
        'frontier_image': 'efficient_frontier.png'
    }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000)
