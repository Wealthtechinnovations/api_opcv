'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // fond_investissements indexes
    await queryInterface.addIndex('fond_investissements', ['code_ISIN'], { name: 'idx_fond_code_isin' }).catch(() => {});
    await queryInterface.addIndex('fond_investissements', ['societe_gestion'], { name: 'idx_fond_societe_gestion' }).catch(() => {});
    await queryInterface.addIndex('fond_investissements', ['pays'], { name: 'idx_fond_pays' }).catch(() => {});
    await queryInterface.addIndex('fond_investissements', ['categorie_libelle'], { name: 'idx_fond_categorie' }).catch(() => {});
    await queryInterface.addIndex('fond_investissements', ['active'], { name: 'idx_fond_active' }).catch(() => {});

    // valorisations indexes
    await queryInterface.addIndex('valorisations', ['fund_id'], { name: 'idx_vl_fund_id' }).catch(() => {});
    await queryInterface.addIndex('valorisations', ['date'], { name: 'idx_vl_date' }).catch(() => {});
    await queryInterface.addIndex('valorisations', ['fund_id', 'date'], { name: 'idx_vl_fund_date' }).catch(() => {});

    // users indexes
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'idx_users_email_unique' }).catch(() => {});

    // performences indexes
    await queryInterface.addIndex('performences', ['fond_id'], { name: 'idx_perf_fond_id' }).catch(() => {});
    await queryInterface.addIndex('performences', ['code_ISIN'], { name: 'idx_perf_code_isin' }).catch(() => {});
    await queryInterface.addIndex('performences', ['date'], { name: 'idx_perf_date' }).catch(() => {});

    // performences_eurs indexes
    await queryInterface.addIndex('performences_eurs', ['fond_id'], { name: 'idx_perf_eurs_fond_id' }).catch(() => {});
    await queryInterface.addIndex('performences_eurs', ['date'], { name: 'idx_perf_eurs_date' }).catch(() => {});

    // performences_usds indexes
    await queryInterface.addIndex('performences_usds', ['fond_id'], { name: 'idx_perf_usds_fond_id' }).catch(() => {});
    await queryInterface.addIndex('performences_usds', ['date'], { name: 'idx_perf_usds_date' }).catch(() => {});

    // transactions indexes
    await queryInterface.addIndex('transactions', ['fond_ids'], { name: 'idx_tx_fond_ids' }).catch(() => {});
    await queryInterface.addIndex('transactions', ['portefeuille_id'], { name: 'idx_tx_portefeuille_id' }).catch(() => {});
    await queryInterface.addIndex('transactions', ['date'], { name: 'idx_tx_date' }).catch(() => {});

    // investissements indexes
    await queryInterface.addIndex('investissements', ['fund_id'], { name: 'idx_invest_fund_id' }).catch(() => {});
    await queryInterface.addIndex('investissements', ['portefeuille_id'], { name: 'idx_invest_portefeuille_id' }).catch(() => {});

    // portefeuilles indexes
    await queryInterface.addIndex('portefeuilles', ['user_id'], { name: 'idx_portf_user_id' }).catch(() => {});

    // portefeuilles_vls indexes
    await queryInterface.addIndex('portefeuilles_vls', ['portefeuille_id'], { name: 'idx_pvl_portefeuille_id' }).catch(() => {});
    await queryInterface.addIndex('portefeuilles_vls', ['fund_id'], { name: 'idx_pvl_fund_id' }).catch(() => {});
    await queryInterface.addIndex('portefeuilles_vls', ['date'], { name: 'idx_pvl_date' }).catch(() => {});

    // portefeuilles_vls_cumuls indexes
    await queryInterface.addIndex('portefeuilles_vls_cumuls', ['portefeuille_id'], { name: 'idx_pvlc_portefeuille_id' }).catch(() => {});
    await queryInterface.addIndex('portefeuilles_vls_cumuls', ['date'], { name: 'idx_pvlc_date' }).catch(() => {});

    // portefeuille_base100s indexes
    await queryInterface.addIndex('portefeuille_base100s', ['portefeuille_id'], { name: 'idx_pb100_portefeuille_id' }).catch(() => {});
    await queryInterface.addIndex('portefeuille_base100s', ['date'], { name: 'idx_pb100_date' }).catch(() => {});

    // rendements indexes
    await queryInterface.addIndex('rendements', ['fond_id'], { name: 'idx_rend_fond_id' }).catch(() => {});
    await queryInterface.addIndex('rendements', ['date'], { name: 'idx_rend_date' }).catch(() => {});

    // classementfonds indexes
    await queryInterface.addIndex('classementfonds', ['fond_id'], { name: 'idx_class_fond_id' }).catch(() => {});
    await queryInterface.addIndex('classementfonds', ['categorie'], { name: 'idx_class_categorie' }).catch(() => {});

    // frais indexes
    await queryInterface.addIndex('frais', ['fond_id'], { name: 'idx_frais_fond_id' }).catch(() => {});

    // favorisfonds indexes
    await queryInterface.addIndex('favorisfonds', ['user_id'], { name: 'idx_fav_user_id' }).catch(() => {});
    await queryInterface.addIndex('favorisfonds', ['fund_id'], { name: 'idx_fav_fund_id' }).catch(() => {});
    await queryInterface.addIndex('favorisfonds', ['user_id', 'fund_id'], { unique: true, name: 'idx_fav_user_fund_unique' }).catch(() => {});

    // documents indexes
    await queryInterface.addIndex('documents', ['fond_id'], { name: 'idx_doc_fond_id' }).catch(() => {});
    await queryInterface.addIndex('documents', ['societe'], { name: 'idx_doc_societe' }).catch(() => {});

    // actualites indexes
    await queryInterface.addIndex('actualites', ['user_id'], { name: 'idx_actu_user_id' }).catch(() => {});
    await queryInterface.addIndex('actualites', ['date'], { name: 'idx_actu_date' }).catch(() => {});

    // simulations indexes
    await queryInterface.addIndex('simulations', ['user_id'], { name: 'idx_sim_user_id' }).catch(() => {});

    // simulation_portefeuilles indexes
    await queryInterface.addIndex('simulation_portefeuilles', ['simulation_id'], { name: 'idx_simport_sim_id' }).catch(() => {});
    await queryInterface.addIndex('simulation_portefeuilles', ['portefeuille_id'], { name: 'idx_simport_portf_id' }).catch(() => {});

    // cashs indexes
    await queryInterface.addIndex('cashs', ['portefeuille_id'], { name: 'idx_cash_portefeuille_id' }).catch(() => {});

    // societes indexes
    await queryInterface.addIndex('societes', ['nom'], { name: 'idx_soc_nom' }).catch(() => {});
    await queryInterface.addIndex('societes', ['pays'], { name: 'idx_soc_pays' }).catch(() => {});

    // devisedechanges indexes
    await queryInterface.addIndex('devisedechanges', ['paire'], { name: 'idx_devise_paire' }).catch(() => {});
    await queryInterface.addIndex('devisedechanges', ['date'], { name: 'idx_devise_date' }).catch(() => {});

    // pays_regulateurs indexes
    await queryInterface.addIndex('pays_regulateurs', ['pays'], { name: 'idx_paysreg_pays' }).catch(() => {});

    // indice_references indexes
    await queryInterface.addIndex('indice_references', ['nom_indice'], { name: 'idx_indice_nom' }).catch(() => {});
    await queryInterface.addIndex('indice_references', ['date'], { name: 'idx_indice_date' }).catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    // Remove all indexes (reverse order)
    const indexes = [
      ['indice_references', 'idx_indice_date'],
      ['indice_references', 'idx_indice_nom'],
      ['pays_regulateurs', 'idx_paysreg_pays'],
      ['devisedechanges', 'idx_devise_date'],
      ['devisedechanges', 'idx_devise_paire'],
      ['societes', 'idx_soc_pays'],
      ['societes', 'idx_soc_nom'],
      ['cashs', 'idx_cash_portefeuille_id'],
      ['simulation_portefeuilles', 'idx_simport_portf_id'],
      ['simulation_portefeuilles', 'idx_simport_sim_id'],
      ['simulations', 'idx_sim_user_id'],
      ['actualites', 'idx_actu_date'],
      ['actualites', 'idx_actu_user_id'],
      ['documents', 'idx_doc_societe'],
      ['documents', 'idx_doc_fond_id'],
      ['favorisfonds', 'idx_fav_user_fund_unique'],
      ['favorisfonds', 'idx_fav_fund_id'],
      ['favorisfonds', 'idx_fav_user_id'],
      ['frais', 'idx_frais_fond_id'],
      ['classementfonds', 'idx_class_categorie'],
      ['classementfonds', 'idx_class_fond_id'],
      ['rendements', 'idx_rend_date'],
      ['rendements', 'idx_rend_fond_id'],
      ['portefeuille_base100s', 'idx_pb100_date'],
      ['portefeuille_base100s', 'idx_pb100_portefeuille_id'],
      ['portefeuilles_vls_cumuls', 'idx_pvlc_date'],
      ['portefeuilles_vls_cumuls', 'idx_pvlc_portefeuille_id'],
      ['portefeuilles_vls', 'idx_pvl_date'],
      ['portefeuilles_vls', 'idx_pvl_fund_id'],
      ['portefeuilles_vls', 'idx_pvl_portefeuille_id'],
      ['portefeuilles', 'idx_portf_user_id'],
      ['investissements', 'idx_invest_portefeuille_id'],
      ['investissements', 'idx_invest_fund_id'],
      ['transactions', 'idx_tx_date'],
      ['transactions', 'idx_tx_portefeuille_id'],
      ['transactions', 'idx_tx_fond_ids'],
      ['performences_usds', 'idx_perf_usds_date'],
      ['performences_usds', 'idx_perf_usds_fond_id'],
      ['performences_eurs', 'idx_perf_eurs_date'],
      ['performences_eurs', 'idx_perf_eurs_fond_id'],
      ['performences', 'idx_perf_date'],
      ['performences', 'idx_perf_code_isin'],
      ['performences', 'idx_perf_fond_id'],
      ['users', 'idx_users_email_unique'],
      ['valorisations', 'idx_vl_fund_date'],
      ['valorisations', 'idx_vl_date'],
      ['valorisations', 'idx_vl_fund_id'],
      ['fond_investissements', 'idx_fond_active'],
      ['fond_investissements', 'idx_fond_categorie'],
      ['fond_investissements', 'idx_fond_pays'],
      ['fond_investissements', 'idx_fond_societe_gestion'],
      ['fond_investissements', 'idx_fond_code_isin'],
    ];

    for (const [table, indexName] of indexes) {
      await queryInterface.removeIndex(table, indexName).catch(() => {});
    }
  }
};
