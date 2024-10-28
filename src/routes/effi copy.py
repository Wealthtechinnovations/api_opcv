from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from scipy.optimize import minimize
import matplotlib.pyplot as plt
from flask_cors import CORS
import os
from datetime import timedelta
import itertools

app = Flask(__name__)
CORS(app)  # Ajoute le middleware CORS

@app.route('/efficient-frontier', methods=['POST'])
def efficient_frontier():

    
    data = request.json
    returns = pd.DataFrame(data['returns'])
    period = data['period']
    min_return = float(data['minReturn'])/100
    max_return = float(data['maxReturn'])/100
    max_volatility = float(data['maxVolatility'])
    nombreligne=int(data['nombreligne'])
    nombreportefeuille=int(data['nombreportefeuille'])
    categoryValues=data['categoryValues']
    fund_names=data['fund_names']

    categoryminmax = {item['category']: {'min': float(item['min']), 'max': float(item['max'])} for item in categoryValues}

    min_value = categoryminmax['Obligations']['min']
    max_value = categoryminmax['Obligations']['max']
    print(f"Category: {'Obligations'}, Min: {min_value}, Max: {max_value}")
   
    if period == 'Journalière':
        scale = 252
    elif period == 'Hebdomadaire':
        scale = 52
    else:
        return jsonify({'error': 'Invalid period'}), 400

    def portfolio_performance(weights, mean_returns, cov_matrix):
        annualized_returns = np.sum(mean_returns * weights) * scale
        annualized_std = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(scale)
        return annualized_returns, annualized_std

    def neg_sharpe_ratio(weights, mean_returns, cov_matrix, risk_free_rate):
        p_returns, p_std = portfolio_performance(weights, mean_returns, cov_matrix)
        return -(p_returns - risk_free_rate) / p_std

    def max_sharpe_ratio(mean_returns, cov_matrix, risk_free_rate):
        num_assets = len(mean_returns)
        args = (mean_returns, cov_matrix, risk_free_rate)
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
                       {'type': 'ineq', 'fun': lambda x: 0.4 - np.max(x)}  # Contrainte pour éviter plus de 40% d'allocation par fonds
)
        bound = (0.0, 1.0)
        bounds = tuple(bound for asset in range(num_assets))
        result = minimize(neg_sharpe_ratio, num_assets*[1./num_assets,], args=args, method='SLSQP', bounds=bounds, constraints=constraints)
        return result

    def portfolio_variance(weights, mean_returns, cov_matrix):
        return portfolio_performance(weights, mean_returns, cov_matrix)[1]

    mean_returns = returns.mean()
    cov_matrix = returns.cov()
    risk_free_rate = 0.0178

    max_sharpe = max_sharpe_ratio(mean_returns, cov_matrix, risk_free_rate)

    num_portfolios = nombreportefeuille
    results = np.zeros((3, num_portfolios))
    weights_record = []

    # Generate all combinations of selected funds
    for combo in itertools.combinations(range(len(mean_returns)), len(mean_returns)):
        combo_mean_returns = mean_returns[list(combo)]
        combo_cov_matrix = cov_matrix.iloc[list(combo), list(combo)]
        
        for i in range(num_portfolios):
            weights = np.random.random(len(combo_mean_returns))
            weights /= np.sum(weights)
            if np.max(weights) <= 0.4:  # Vérifier si l'allocation d'un fonds est supérieure à 40%
                portfolio_return, portfolio_stddev = portfolio_performance(weights, combo_mean_returns, combo_cov_matrix)
                if portfolio_return >= min_return and portfolio_return <= max_return and portfolio_stddev <= max_volatility:
                    results[0, i] = portfolio_stddev
                    results[1, i] = portfolio_return
                    results[2, i] = (portfolio_return - risk_free_rate) / portfolio_stddev
                    weights_record.append(weights)

    target_returns = np.linspace(min_return, max_return, nombreligne)
    efficient_portfolios = []

    for target_return in target_returns:
        constraints = (
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'eq', 'fun': lambda x: portfolio_performance(x, mean_returns, cov_matrix)[0] - target_return},
            {'type': 'ineq', 'fun': lambda x: 0.4 - np.max(x)}
        )
        bounds = tuple((0.0, 1.0) for _ in range(len(mean_returns)))
        result = minimize(portfolio_variance, len(mean_returns)*[1./len(mean_returns)], args=(mean_returns, cov_matrix), method='SLSQP', bounds=bounds, constraints=constraints)
        if result.success and portfolio_performance(result.x, mean_returns, cov_matrix)[1] <= max_volatility:
            efficient_portfolios.append(result.x)

    frontier_risks = [portfolio_performance(weights, mean_returns, cov_matrix)[1] for weights in efficient_portfolios]
    frontier_returns = target_returns.tolist()



  # Convertir les clés en int ou str si nécessaire
   # max_sharpe_weights_named = {str(fund_names[i]): weight for i, weight in enumerate(max_sharpe.x)}
   # efficient_portfolios_named = [{str(fund_names[i]): weight for i, weight in enumerate(weights)} for weights in efficient_portfolios]

    return jsonify({
        'max_sharpe_weights': max_sharpe.x.tolist(),
        'efficient_portfolios':  [weights.tolist() for weights in efficient_portfolios],
        'frontier': {
            'risks': frontier_risks,
            'returns': frontier_returns
        },
        'frontier_image': 'efficient_frontier.png'
    })

if __name__ == '__main__':
    app.run(port=5000)