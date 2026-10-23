/**
 * Routes de supervision du module BRVM BOC (valeurs liquidatives OPCVM UEMOA).
 *
 * LECTURE SEULE — aucune ecriture. Les imports/backfills se lancent via le
 * script scripts/scraper/brvm_boc_daily.py (cron ou SSH), jamais via l'API.
 *
 * Tables consultees (creees par le script, additives) :
 *   brvm_boc_sources, brvm_boc_navs_raw, brvm_fund_aliases,
 *   brvm_import_logs, brvm_missing_navs
 *
 * Si les tables n'existent pas encore (module non initialise en production),
 * les routes repondent proprement avec initialized: false.
 */
const express = require('express');
const { sequelize } = require('../db/sequelize');

const router = express.Router();

function isMissingTableError(error) {
  return error && (error.original?.code === 'ER_NO_SUCH_TABLE'
    || /doesn't exist/i.test(error.message || ''));
}

// Etat global du module : dernier import, compteurs sources/lignes/promotions
router.get('/api/brvm/boc/status', async (req, res) => {
  try {
    const [[lastImport]] = await sequelize.query(
      'SELECT * FROM brvm_import_logs ORDER BY id DESC LIMIT 1');
    const [[sources]] = await sequelize.query(
      `SELECT COUNT(*) total,
              SUM(parse_status='PARSED') parsed,
              SUM(parse_status='FAILED') failed,
              MAX(boc_date) last_boc_date
         FROM brvm_boc_sources`);
    const [[rows]] = await sequelize.query(
      `SELECT COUNT(*) total,
              SUM(quality_status='OK') ok,
              SUM(is_nd=1) nd_official,
              SUM(match_status IN ('MATCHED_ALIAS','MATCHED_EXACT','MATCHED_FUZZY')) matched,
              SUM(match_status='UNMATCHED') unmatched,
              SUM(match_status='AMBIGUOUS') ambiguous,
              SUM(promote_status='PROMOTED') promoted,
              SUM(promote_status='CONFLICT') conflicts
         FROM brvm_boc_navs_raw`);
    res.json({ code: 200, data: { initialized: true, lastImport, sources, rows } });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({ code: 200, data: { initialized: false, message: 'Module BRVM BOC non initialise (lancer le script en production)' } });
    }
    res.status(500).json({ code: 500, message: 'Erreur status BRVM BOC', error: error.message });
  }
});

// Historique des executions d'import
router.get('/api/brvm/boc/imports', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 200);
  try {
    const [logs] = await sequelize.query(
      'SELECT * FROM brvm_import_logs ORDER BY id DESC LIMIT ?',
      { replacements: [limit] });
    res.json({ code: 200, data: logs });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({ code: 200, data: [], initialized: false });
    }
    res.status(500).json({ code: 500, message: 'Erreur imports BRVM BOC', error: error.message });
  }
});

// Lignes non rapprochees ou ambigues — file de validation manuelle
router.get('/api/brvm/boc/unmatched', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  try {
    const [rows] = await sequelize.query(
      `SELECT id, boc_date, section, fund_name_raw, management_company_raw,
              category_raw, current_nav, nav_date, quality_status,
              match_status, match_confidence
         FROM brvm_boc_navs_raw
        WHERE match_status IN ('UNMATCHED','AMBIGUOUS')
        ORDER BY boc_date DESC, fund_name_raw
        LIMIT ?`,
      { replacements: [limit] });
    res.json({ code: 200, data: rows });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({ code: 200, data: [], initialized: false });
    }
    res.status(500).json({ code: 500, message: 'Erreur unmatched BRVM BOC', error: error.message });
  }
});

// Diagnostic des VL manquantes (rempli par --repair-missing)
router.get('/api/brvm/boc/missing', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
  try {
    const [rows] = await sequelize.query(
      `SELECT m.*, f.nom_fond
         FROM brvm_missing_navs m
         LEFT JOIN fond_investissements f ON f.id = m.fund_id
        ORDER BY m.expected_date DESC
        LIMIT ?`,
      { replacements: [limit] });
    res.json({ code: 200, data: rows });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({ code: 200, data: [], initialized: false });
    }
    res.status(500).json({ code: 500, message: 'Erreur missing BRVM BOC', error: error.message });
  }
});

module.exports = router;
