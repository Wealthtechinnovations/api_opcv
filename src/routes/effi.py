from flask import Flask, jsonify
import numpy as np
import pandas as pd
from scipy.optimize import minimize
import matplotlib.pyplot as plt
from flask_cors import CORS
import os
from datetime import timedelta
import itertools
@app.route('/efficient-frontier', methods=['GET'])
def efficient_frontier():
    # Appeler l'API pour obtenir les fonds de la meilleure année
    response = best_year_funds()
    response_data = response.get_json()
    
    if response_data.get('error'):
        return jsonify({'error': response_data['error']}), 400

    # Récupérer les données de la meilleure année
    best_year = response_data['best_year']
    best_funds_data = pd.DataFrame(response_data['data'])

    period = "daily"
    min_return = 0.03
    max_return = 0.20
    min_risk = 0.02
    max_risk = 0.30
    num_portfolios = 50

    # Récupérer les performances pour les fonds sélectionnés à ces dates communes
    perf_data = []
    fund_info = []
    for fund_id in best_funds_data['fund_id'].unique():
        fund_perf = best_funds_data[(best_funds_data['fund_id'] == fund_id) & (best_funds_data['date'].isin(response_data['common_dates']))]
        perf_data.append(fund_perf.sort_values(by='date')['performance'].tolist())
        fund_info.append({
            'id': fund_id,
            'name': fund_perf['fund'].iloc[0],
            'category': fund_perf['catégorie'].iloc[0],
            'asset_class': fund_perf['classe d\'actifs'].iloc[0],
            'country': fund_perf['pays'].iloc[0]
        })

    returns = pd.DataFrame(perf_data)
    if period == 'daily':
        scale = 252
    elif period == 'weekly':
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
        constraints = (
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'ineq', 'fun': lambda x: 0.30 - np.max(x)},  # Contrainte pour éviter plus de 30% d'allocation par fonds
            {'type': 'ineq', 'fun': lambda x: np.min(x) - 0.02},  # Contrainte pour éviter moins de 2% d'allocation par fonds
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Actions']) - 0.02},  # Min 2% pour Actions
            {'type': 'ineq', 'fun': lambda x: 0.50 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Actions'])},  # Max 50% pour Actions
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Obligations']) - 0.07},  # Min 7% pour Obligations
            {'type': 'ineq', 'fun': lambda x: 0.30 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Obligations'])},  # Max 30% pour Obligations
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Monétaire']) - 0.08},  # Min 8% pour Monétaire
            {'type': 'ineq', 'fun': lambda x: 0.40 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Monétaire'])},  # Max 40% pour Monétaire
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Diversifié']) - 0.05},  # Min 5% pour Diversifié
            {'type': 'ineq', 'fun': lambda x: 0.50 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Diversifié'])},  # Max 50% pour Diversifié
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

    results = np.zeros((3, num_portfolios))
    weights_record = []

    def category_constraints(weights):
        categories = pd.DataFrame({'category': [info['category'] for info in fund_info], 'weights': weights})
        category_sums = categories.groupby('category').sum()
        if ('Actions' in category_sums.index and not (0.02 <= category_sums.loc['Actions'].values[0] <= 0.50)):
            return False
        if ('Obligations' in category_sums.index and not (0.07 <= category_sums.loc['Obligations'].values[0] <= 0.30)):
            return False
        if ('Monétaire' in category_sums.index and not (0.08 <= category_sums.loc['Monétaire'].values[0] <= 0.40)):
            return False
        if ('Diversifié' in category_sums.index and not (0.05 <= category_sums.loc['Diversifié'].values[0] <= 0.50)):
            return False
        return True

    def additional_constraints(weights):
        num_funds = len(weights)
        if num_funds < 7 or num_funds > 20:
            return False
        return True

    # Generate all combinations of selected funds with minimum 7 funds and maximum 20 funds
    for combo in itertools.combinations(range(len(mean_returns)), 7):
        for end in range(7, min(len(combo) + 1, 21)):  # Ensure min 7 and max 20 funds in a portfolio
            combo_mean_returns = mean_returns[list(combo[:end])]
            combo_cov_matrix = cov_matrix.iloc[list(combo[:end]), list(combo[:end])]
            combo_fund_info = [fund_info[i] for i in combo[:end]]

            for i in range(num_portfolios):
                weights = np.random.random(len(combo_mean_returns))
                weights /= np.sum(weights)
                if np.all(weights >= 0.02) and np.all(weights <= 0.30) and category_constraints(weights) and additional_constraints(weights):  # Check all constraints
                    portfolio_return, portfolio_stddev = portfolio_performance(weights, combo_mean_returns, combo_cov_matrix)
                    if min_return <= portfolio_return <= max_return and min_risk <= portfolio_stddev <= max_risk:
                        results[0, i] = portfolio_stddev
                        results[1, i] = portfolio_return
                        results[2, i] = (portfolio_return - risk_free_rate) / portfolio_stddev
                        weights_record.append((weights, combo_fund_info))

    target_returns = np.linspace(min_return, max_return, 50)
    efficient_portfolios = []

    for target_return in target_returns:
        constraints = (
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
            {'type': 'eq', 'fun': lambda x: portfolio_performance(x, mean_returns, cov_matrix)[0] - target_return},
            {'type': 'ineq', 'fun': lambda x: 0.30 - np.max(x)},  # Contrainte pour éviter plus de 30% d'allocation par fonds
            {'type': 'ineq', 'fun': lambda x: np.min(x) - 0.02},  # Contrainte pour éviter moins de 2% d'allocation par fonds
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Actions']) - 0.02},  # Min 2% pour Actions
            {'type': 'ineq', 'fun': lambda x: 0.50 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Actions'])},  # Max 50% pour Actions
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Obligations']) - 0.07},  # Min 7% pour Obligations
            {'type': 'ineq', 'fun': lambda x: 0.30 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Obligations'])},  # Max 30% pour Obligations
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Monétaire']) - 0.08},  # Min 8% pour Monétaire
            {'type': 'ineq', 'fun': lambda x: 0.40 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Monétaire'])},  # Max 40% pour Monétaire
            {'type': 'ineq', 'fun': lambda x: np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Diversifié']) - 0.05},  # Min 5% pour Diversifié
            {'type': 'ineq', 'fun': lambda x: 0.50 - np.sum([x[i] for i, info in enumerate(fund_info) if info['category'] == 'Diversifié'])},  # Max 50% pour Diversifié
        )
        bounds = tuple((0.02, 0.30) for _ in range(len(mean_returns)))  # Bounds for each fund between 2% and 30%
        result = minimize(portfolio_variance, len(mean_returns)*[1./len(mean_returns)], args=(mean_returns, cov_matrix), method='SLSQP', bounds=bounds, constraints=constraints)
        if result.success and portfolio_performance(result.x, mean_returns, cov_matrix)[1] <= max_risk:
            if category_constraints(result.x) and additional_constraints(result.x):
                efficient_portfolios.append(result.x)

    frontier_risks = [portfolio_performance(weights, mean_returns, cov_matrix)[1] for weights in efficient_portfolios]
    frontier_returns = target_returns.tolist()

    plt.figure(figsize=(10, 6))
    plt.scatter(results[0, :], results[1, :], c=results[2, :], marker='o')
    plt.plot(frontier_risks, frontier_returns, 'r--', linewidth=3)
    plt.title('Frontière Efficiente')
    plt.xlabel('Volatilité (Risque)')
    plt.ylabel('Rendement')
    plt.colorbar(label='Ratio de Sharpe')
    plt.savefig('efficient_frontier.png')

    max_sharpe_weights_named = {fund_info[i]['name']: weight for i, weight in enumerate(max_sharpe.x)}
    efficient_portfolios_named = [{
        'fund_id': fund['id'],
        'fund_name': fund['name'],
        'category': fund['category'],
        'asset_class': fund['asset_class'],
        'country': fund['country'],
        'weight': weight
    } for weights in efficient_portfolios for fund, weight in zip(fund_info, weights)]

    return jsonify({
        'max_sharpe_weights': max_sharpe_weights_named,
        'efficient_portfolios': efficient_portfolios_named,
        'frontier': {
            'risks': frontier_risks,
            'returns': frontier_returns
        },
        'frontier_image': 'efficient_frontier.png'
    })

if __name__ == '__main__':
    app.run(port=5000)