const fs = require('fs');
const path = require('path');
const { sequelize } = require('../db/sequelize');
const recalcEvent = require('../services/recalc-event.service');
const { authenticate, authorize } = require('../middleware/auth');

module.exports = (app) => {

  app.get('/api/admin/recalc/dashboard', authenticate, authorize('admin'), async (req, res) => {
    try {
      const [summary] = await sequelize.query(`
        SELECT
          status,
          COUNT(*) as count,
          AVG(execution_time_ms) as avg_time_ms,
          MAX(execution_time_ms) as max_time_ms
        FROM recalc_jobs
        GROUP BY status
      `, { type: sequelize.QueryTypes.SELECT });

      const [recentEvents] = await sequelize.query(`
        SELECT id, event_type, fond_id, impact_date, triggered_by, status, created_at
        FROM recalc_events
        ORDER BY created_at DESC
        LIMIT 20
      `, { type: sequelize.QueryTypes.SELECT });

      const [recentJobs] = await sequelize.query(`
        SELECT id, job_type, fond_id, date_from, status, priority,
               attempts, max_attempts, execution_time_ms, rows_affected,
               error_message, locked_by, created_at, completed_at
        FROM recalc_jobs
        ORDER BY created_at DESC
        LIMIT 30
      `, { type: sequelize.QueryTypes.SELECT });

      const [staleJobs] = await sequelize.query(`
        SELECT id, job_type, fond_id, locked_by, locked_at
        FROM recalc_jobs
        WHERE status = 'RUNNING' AND locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      `, { type: sequelize.QueryTypes.SELECT });

      res.json({
        code: 200,
        data: {
          summary: Array.isArray(summary) ? summary : [summary].filter(Boolean),
          recentEvents: Array.isArray(recentEvents) ? recentEvents : [recentEvents].filter(Boolean),
          recentJobs: Array.isArray(recentJobs) ? recentJobs : [recentJobs].filter(Boolean),
          staleJobs: Array.isArray(staleJobs) ? staleJobs : [staleJobs].filter(Boolean),
        },
      });
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) {
        return res.json({ code: 200, data: { summary: [], recentEvents: [], recentJobs: [], staleJobs: [], info: 'Tables recalc pas encore creees' } });
      }
      console.error('[recalc-admin] dashboard error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/recalc/retry/:jobId', authenticate, authorize('admin'), async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) return res.status(400).json({ error: 'jobId invalide' });

      const [job] = await sequelize.query(`
        SELECT * FROM recalc_jobs WHERE id = :jobId
      `, { replacements: { jobId }, type: sequelize.QueryTypes.SELECT });

      if (!job) return res.status(404).json({ error: 'Job non trouve' });
      if (job.status !== 'FAILED' && job.status !== 'CANCELLED') {
        return res.status(400).json({ error: `Job status=${job.status}, retry possible uniquement sur FAILED ou CANCELLED` });
      }

      await sequelize.query(`
        UPDATE recalc_jobs
        SET status = 'PENDING', attempts = 0, error_message = NULL,
            locked_by = NULL, locked_at = NULL
        WHERE id = :jobId
      `, { replacements: { jobId } });

      await sequelize.query(`
        INSERT INTO recalc_audit (job_id, fond_id, action, detail)
        VALUES (:jobId, :fondId, 'MANUAL_RETRY', 'Retry via admin API')
      `, { replacements: { jobId, fondId: job.fond_id } });

      res.json({ code: 200, message: `Job #${jobId} remis en PENDING` });
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) {
        return res.status(400).json({ error: 'Tables recalc pas encore creees' });
      }
      console.error('[recalc-admin] retry error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/recalc/trigger', authenticate, authorize('admin'), async (req, res) => {
    try {
      const { eventType, fondId, impactDate } = req.body;
      if (!eventType || !impactDate) {
        return res.status(400).json({ error: 'eventType et impactDate requis' });
      }

      const validEvents = ['VL_INSERT', 'VL_UPDATE', 'VL_DELETE', 'FX_UPDATE', 'INDEX_UPDATE', 'FULL_REBUILD'];
      if (!validEvents.includes(eventType)) {
        return res.status(400).json({ error: `eventType invalide. Valides: ${validEvents.join(', ')}` });
      }

      await recalcEvent.emitAndPropagate(eventType, fondId || null, impactDate, 'admin_manual');

      res.json({ code: 200, message: `Evenement ${eventType} emis et propage` });
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) {
        return res.status(400).json({ error: 'Tables recalc pas encore creees' });
      }
      console.error('[recalc-admin] trigger error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/recalc/audit', authenticate, authorize('admin'), async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const fondId = req.query.fondId ? parseInt(req.query.fondId) : null;

      let where = '';
      const replacements = { limit };
      if (fondId) {
        where = 'WHERE fond_id = :fondId';
        replacements.fondId = fondId;
      }

      const [rows] = await sequelize.query(`
        SELECT * FROM recalc_audit ${where}
        ORDER BY created_at DESC
        LIMIT :limit
      `, { replacements, type: sequelize.QueryTypes.SELECT });

      res.json({ code: 200, data: Array.isArray(rows) ? rows : [rows].filter(Boolean) });
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) {
        return res.json({ code: 200, data: [], info: 'Tables recalc pas encore creees' });
      }
      console.error('[recalc-admin] audit error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/recalc/cancel/:jobId', authenticate, authorize('admin'), async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) return res.status(400).json({ error: 'jobId invalide' });

      const [result] = await sequelize.query(`
        UPDATE recalc_jobs
        SET status = 'CANCELLED', locked_by = NULL, locked_at = NULL
        WHERE id = :jobId AND status = 'PENDING'
      `, { replacements: { jobId } });

      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Job non trouvé ou pas en status PENDING' });
      }

      await sequelize.query(`
        INSERT INTO recalc_audit (job_id, fond_id, action, detail)
        VALUES (:jobId, NULL, 'MANUAL_CANCEL', 'Cancel via admin API')
      `, { replacements: { jobId } });

      res.json({ code: 200, message: `Job #${jobId} annule` });
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) {
        return res.status(400).json({ error: 'Tables recalc pas encore creees' });
      }
      console.error('[recalc-admin] cancel error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/import/trigger', authenticate, authorize('admin'), async (req, res) => {
    try {
      const { importType } = req.body;
      const validTypes = ['IMPORT_ASFIM', 'IMPORT_FOREX', 'IMPORT_NIGERIA'];
      if (!importType || !validTypes.includes(importType)) {
        return res.status(400).json({ error: `importType requis. Valides: ${validTypes.join(', ')}` });
      }

      await sequelize.query(`
        INSERT INTO recalc_jobs (job_type, date_from, priority, status)
        VALUES (:importType, CURDATE(), 3, 'PENDING')
      `, { replacements: { importType } });

      res.json({ code: 200, message: `Import ${importType} programme` });
    } catch (err) {
      if (err.message && err.message.includes("doesn't exist")) {
        return res.status(400).json({ error: 'Tables recalc pas encore creees' });
      }
      console.error('[recalc-admin] import trigger error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/scheduler/status', authenticate, authorize('admin'), (req, res) => {
    try {
      const schedulerState = path.join(__dirname, '../../scheduler-state.json');
      let state = {};
      try { state = JSON.parse(fs.readFileSync(schedulerState, 'utf-8')); } catch (_) {}
      res.json({ code: 200, data: state });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/scheduler/toggle', authenticate, authorize('admin'), (req, res) => {
    try {
      const { taskName, enabled } = req.body;
      if (!taskName || typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'taskName (string) et enabled (boolean) requis' });
      }
      const schedulerState = path.join(__dirname, '../../scheduler-state.json');
      let state = {};
      try { state = JSON.parse(fs.readFileSync(schedulerState, 'utf-8')); } catch (_) {}
      state[taskName] = enabled;
      fs.writeFileSync(schedulerState, JSON.stringify(state, null, 2));
      res.json({ code: 200, message: `Tache ${taskName} ${enabled ? 'activee' : 'desactivee'}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

};
