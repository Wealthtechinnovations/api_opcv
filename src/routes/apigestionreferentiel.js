const express = require('express');
const router = express.Router();
const { sequelize } = require('../db/sequelize');
const { QueryTypes } = require('sequelize');

/**
 * GET /api/ref/categories
 * Liste les catégories FundAfrica avec filtres optionnels.
 * ?niveau=LOCAL|REGIONAL|GLOBAL  ?classification=ACTIONS|OBLIGATIONS|...  ?pays=MAROC|...
 */
router.get('/api/ref/categories', async (req, res) => {
  try {
    const conditions = [];
    const replacements = {};

    if (req.query.niveau) {
      conditions.push('niveau_categorie = :niveau');
      replacements.niveau = req.query.niveau.toUpperCase();
    }
    if (req.query.classification) {
      conditions.push('classification_regulateur = :classification');
      replacements.classification = req.query.classification.toUpperCase();
    }
    if (req.query.pays) {
      conditions.push('pays = :pays');
      replacements.pays = req.query.pays.toUpperCase();
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = await sequelize.query(
      `SELECT id, category_id, niveau_categorie, classification_regulateur, pays, region,
              code_devise_locale, categorie_locale_fundafrica, categorie_regionale_fundafrica,
              categorie_globale_fundafrica, statut
       FROM ref_categories_fundafrica ${where}
       ORDER BY niveau_categorie, pays, classification_regulateur`,
      { replacements, type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: rows, total: rows.length });
  } catch (error) {
    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ code: 200, data: [], total: 0, message: 'Table ref_categories_fundafrica not yet created' });
    }
    console.error('[Ref] categories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/ref/indices
 * Liste les indices FundAfrica avec filtres optionnels.
 * ?statut=VALIDATED_OR_TO_VERIFY|MISSING_BENCHMARK|COMPOSITE_TO_BUILD|RATE_TO_DEFINE
 * ?classification=ACTIONS|OBLIGATIONS|...  ?niveau=LOCAL|REGIONAL|GLOBAL
 */
router.get('/api/ref/indices', async (req, res) => {
  try {
    const conditions = [];
    const replacements = {};

    if (req.query.statut) {
      conditions.push('statut_indice = :statut');
      replacements.statut = req.query.statut.toUpperCase();
    }
    if (req.query.classification) {
      conditions.push('classification_regulateur = :classification');
      replacements.classification = req.query.classification.toUpperCase();
    }
    if (req.query.niveau) {
      conditions.push('niveau_categorie = :niveau');
      replacements.niveau = req.query.niveau.toUpperCase();
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = await sequelize.query(
      `SELECT id, indice_id, categorie_fundafrica, niveau_categorie, classification_regulateur,
              nom_indice_usd, nom_indice_eur, devise_base_indice,
              source_primaire, statut_indice, commentaire_controle
       FROM ref_indices_fundafrica ${where}
       ORDER BY niveau_categorie, classification_regulateur, indice_id`,
      { replacements, type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: rows, total: rows.length });
  } catch (error) {
    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ code: 200, data: [], total: 0, message: 'Table ref_indices_fundafrica not yet created' });
    }
    console.error('[Ref] indices error:', error.message);
    res.status(500).json({ error: 'Failed to fetch indices' });
  }
});

/**
 * GET /api/ref/indices/stats
 * Statistiques des indices par statut et classification.
 */
router.get('/api/ref/indices/stats', async (req, res) => {
  try {
    const byStatut = await sequelize.query(
      `SELECT statut_indice, COUNT(*) as count FROM ref_indices_fundafrica GROUP BY statut_indice ORDER BY count DESC`,
      { type: QueryTypes.SELECT }
    );
    const byClassification = await sequelize.query(
      `SELECT classification_regulateur, niveau_categorie, COUNT(*) as count
       FROM ref_indices_fundafrica
       GROUP BY classification_regulateur, niveau_categorie
       ORDER BY classification_regulateur, niveau_categorie`,
      { type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: { by_statut: byStatut, by_classification: byClassification } });
  } catch (error) {
    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ code: 200, data: { by_statut: [], by_classification: [] } });
    }
    console.error('[Ref] indices stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch indices stats' });
  }
});

/**
 * GET /api/ref/pays
 * Liste les zones géographiques du référentiel FundAfrica.
 */
router.get('/api/ref/pays', async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT id, pays_id, pays, nom_devise, code_devise, region, zone_globale, univers
       FROM ref_geo_zones
       ORDER BY pays`,
      { type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: rows, total: rows.length });
  } catch (error) {
    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ code: 200, data: [], total: 0, message: 'Table ref_geo_zones not yet created' });
    }
    console.error('[Ref] pays error:', error.message);
    res.status(500).json({ error: 'Failed to fetch pays' });
  }
});

/**
 * GET /api/ref/asset-classes
 * Liste les 4 classes d'actifs FundAfrica.
 */
router.get('/api/ref/asset-classes', async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT id, code, libelle_fr, code_technique, description
       FROM ref_asset_classes
       ORDER BY id`,
      { type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: rows, total: rows.length });
  } catch (error) {
    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ code: 200, data: [], total: 0, message: 'Table ref_asset_classes not yet created' });
    }
    console.error('[Ref] asset-classes error:', error.message);
    res.status(500).json({ error: 'Failed to fetch asset classes' });
  }
});

/**
 * GET /api/ref/sources
 * Liste les sources de données pour les indices.
 */
router.get('/api/ref/sources', async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT id, source_id, source_name, source_url, usage_description
       FROM ref_index_sources
       ORDER BY source_name`,
      { type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: rows, total: rows.length });
  } catch (error) {
    if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ code: 200, data: [], total: 0, message: 'Table ref_index_sources not yet created' });
    }
    console.error('[Ref] sources error:', error.message);
    res.status(500).json({ error: 'Failed to fetch index sources' });
  }
});

/**
 * GET /api/ref/mapping
 * Vue synthétique du mapping fonds → indices FundAfrica.
 * ?pays=MAROC  ?classification=ACTIONS  ?unmapped_only=1
 */
router.get('/api/ref/mapping', async (req, res) => {
  try {
    const conditions = ['f.active = 1'];
    const replacements = {};

    if (req.query.pays) {
      conditions.push('UPPER(f.pays) = :pays');
      replacements.pays = req.query.pays.toUpperCase();
    }
    if (req.query.classification) {
      conditions.push('UPPER(f.classification) = :classification');
      replacements.classification = req.query.classification.toUpperCase();
    }
    if (req.query.unmapped_only === '1') {
      conditions.push("(f.indice_fundafrica IS NULL OR f.indice_fundafrica = '')");
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const rows = await sequelize.query(
      `SELECT f.id, LEFT(f.nom_fond, 60) as nom_fond, f.classification, f.pays,
              f.indice_benchmark, f.indice_fundafrica, f.indice_fundafrica_id,
              f.categorie_fundafrica_locale, f.categorie_fundafrica_regionale,
              f.categorie_fundafrica_globale,
              i.nom_indice_usd, i.statut_indice
       FROM fond_investissements f
       LEFT JOIN ref_indices_fundafrica i ON i.indice_id = f.indice_fundafrica
       ${where}
       ORDER BY f.pays, f.classification, f.nom_fond
       LIMIT 500`,
      { replacements, type: QueryTypes.SELECT }
    );

    const summary = await sequelize.query(
      `SELECT f.pays, f.classification,
              COUNT(*) as total,
              SUM(CASE WHEN f.indice_fundafrica IS NOT NULL AND f.indice_fundafrica != '' THEN 1 ELSE 0 END) as mapped
       FROM fond_investissements f
       ${where}
       GROUP BY f.pays, f.classification
       ORDER BY f.pays, f.classification`,
      { replacements, type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: { funds: rows, summary, total_funds: rows.length } });
  } catch (error) {
    console.error('[Ref] mapping error:', error.message);
    res.status(500).json({ error: 'Failed to fetch mapping data' });
  }
});

/**
 * GET /api/ref/mapping/summary
 * Résumé global du mapping indices par pays et classification.
 */
router.get('/api/ref/mapping/summary', async (req, res) => {
  try {
    const byPays = await sequelize.query(
      `SELECT pays, COUNT(*) as total,
              SUM(CASE WHEN indice_fundafrica IS NOT NULL AND indice_fundafrica != '' THEN 1 ELSE 0 END) as mapped
       FROM fond_investissements WHERE active = 1
       GROUP BY pays ORDER BY total DESC`,
      { type: QueryTypes.SELECT }
    );

    const byClassification = await sequelize.query(
      `SELECT classification, COUNT(*) as total,
              SUM(CASE WHEN indice_fundafrica IS NOT NULL AND indice_fundafrica != '' THEN 1 ELSE 0 END) as mapped
       FROM fond_investissements WHERE active = 1
       GROUP BY classification ORDER BY total DESC`,
      { type: QueryTypes.SELECT }
    );

    const [totals] = await sequelize.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN indice_fundafrica IS NOT NULL AND indice_fundafrica != '' THEN 1 ELSE 0 END) as mapped
       FROM fond_investissements WHERE active = 1`,
      { type: QueryTypes.SELECT }
    );

    res.json({ code: 200, data: { totals, by_pays: byPays, by_classification: byClassification } });
  } catch (error) {
    console.error('[Ref] mapping summary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch mapping summary' });
  }
});

module.exports = router;
