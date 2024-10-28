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

@app.route('/efficient-frontier', methods=['GET'])
def efficient_frontier():
   # data = request.json
    
    period = "daily"
    min_return = 1
    max_return =15
    max_volatility = 1.2
    csv_file_path = os.path.join(os.getcwd(), 'fichiers', 'perfor.csv')  # Chemin complet à partir de la racine du projet

    csv_file_paths = '/fichiers/perfor.csv'  # Remplacez par le chemin de votre fichier CSV
   

    df = pd.read_csv(csv_file_path, sep=';')

    # Assurez-vous que les colonnes sont correctement séparées et renommées
    df.columns = df.columns.str.split(';').str[0]  # Séparer les noms de colonnes par ';'

    # Vérifier les noms de colonnes et manipuler 'date' comme nécessaire
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], format='%d/%m/%Y')

     # Collecter toutes les dates uniques pour chaque fond_id
    fund_dates = {}
    for fund_id in df['fond_id'].unique():
        fund_dates[fund_id] = set(df[df['fond_id'] == fund_id]['date'])

      # Trouver la séquence de dates consécutives la plus longue commune à la majorité des fonds
    all_dates = sorted(set(date for dates in fund_dates.values() for date in dates))
    date_counts = {date: 0 for date in all_dates}
    
    for dates in fund_dates.values():
        for date in dates:
            date_counts[date] += 1

    majority_threshold = len(fund_dates) // 2
    common_dates = [date for date, count in date_counts.items() if count > majority_threshold]

    # Trouver la plus longue séquence de dates consécutives parmi les dates communes
    longest_sequence = []
    current_sequence = []

    for i in range(len(common_dates)):
        if i == 0 or common_dates[i] == common_dates[i-1] + timedelta(days=1):
            current_sequence.append(common_dates[i])
        else:
            if len(current_sequence) > len(longest_sequence):
                longest_sequence = current_sequence
            current_sequence = [common_dates[i]]
    
    if len(current_sequence) > len(longest_sequence):
        longest_sequence = current_sequence

    # Sélectionner les fonds qui ont cette séquence de dates consécutives
    top_fund_ids = []
    for fund_id, dates in fund_dates.items():
        if set(longest_sequence).issubset(dates):
            top_fund_ids.append(fund_id)
        if len(top_fund_ids) >= 10:
            break

      # Récupérer les performances pour les fonds sélectionnés à ces dates consécutives
    perf_data = []
    fund_names = []

    for fund_id in top_fund_ids:
        fund_perf = df[(df['fond_id'] == fund_id) & (pd.to_datetime(df['date']).isin(longest_sequence))]
        perf_data.append(fund_perf.sort_values(by='date')['perfveille'].tolist())
        fund_names.append(df[df['fond_id'] == fund_id]['fond_id'].iloc[0])  # Assumption: there's a 'fond_name' column

    returns= pd.DataFrame(perf_data)
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

    num_portfolios = 10000
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

    target_returns = np.linspace(min_return, max_return, 50)
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

    plt.figure(figsize=(10, 6))
    plt.scatter(results[0, :], results[1, :], c=results[2, :], marker='o')
    plt.plot(frontier_risks, frontier_returns, 'r--', linewidth=3)
    plt.title('Frontière Efficiente')
    plt.xlabel('Volatilité (Risque)')
    plt.ylabel('Rendement')
    plt.colorbar(label='Ratio de Sharpe')
    plt.savefig('efficient_frontier.png')

  # Convertir les clés en int ou str si nécessaire
    max_sharpe_weights_named = {str(fund_names[i]): weight for i, weight in enumerate(max_sharpe)}
    efficient_portfolios_named = [{str(fund_names[i]): weight for i, weight in enumerate(weights)} for weights in efficient_portfolios]

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