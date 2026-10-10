const { sequelize } = require('../db/sequelize');

async function emitEvent(eventType, fondId, impactDate, triggeredBy, metadata = null) {
  try {
    await sequelize.query(`
      INSERT INTO recalc_events (event_type, fond_id, impact_date, triggered_by, metadata, status)
      VALUES (:eventType, :fondId, :impactDate, :triggeredBy, :metadata, 'NEW')
    `, {
      replacements: {
        eventType,
        fondId: fondId || null,
        impactDate,
        triggeredBy,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      type: sequelize.QueryTypes.INSERT,
    });
  } catch (err) {
    // Table may not exist yet — log but don't crash
    if (err.message && err.message.includes("doesn't exist")) return;
    console.error(`[recalc-event] Erreur emission ${eventType}:`, err.message);
  }
}

async function propagateEvent(eventId) {
  try {
    const [event] = await sequelize.query(`
      SELECT * FROM recalc_events WHERE id = :eventId
    `, { replacements: { eventId }, type: sequelize.QueryTypes.SELECT });

    if (!event) return;

    const jobTypeMap = {
      'VL_INSERT': 'VL_AJUSTE',
      'VL_UPDATE': 'VL_AJUSTE',
      'VL_DELETE': 'VL_AJUSTE',
      'DIVIDEND_INSERT': 'VL_AJUSTE',
      'DIVIDEND_UPDATE': 'VL_AJUSTE',
      'FX_UPDATE': 'FX_CONVERSION',
      'CATEGORY_CHANGE': 'CLASSEMENT_LOCAL',
      'INDEX_UPDATE': 'INDREF',
      'BENCHMARK_CHANGE': 'INDREF',
    };

    const firstJobType = jobTypeMap[event.event_type];
    if (!firstJobType) return;

    await sequelize.query(`
      INSERT INTO recalc_jobs (event_id, job_type, fond_id, date_from, priority, status)
      VALUES (:eventId, :jobType, :fondId, :dateFrom, 5, 'PENDING')
    `, {
      replacements: {
        eventId,
        jobType: firstJobType,
        fondId: event.fond_id,
        dateFrom: event.impact_date,
      },
      type: sequelize.QueryTypes.INSERT,
    });

    await sequelize.query(`
      UPDATE recalc_events SET status = 'PROPAGATED' WHERE id = :eventId
    `, { replacements: { eventId }, type: sequelize.QueryTypes.UPDATE });

  } catch (err) {
    if (err.message && err.message.includes("doesn't exist")) return;
    console.error(`[recalc-event] Erreur propagation event ${eventId}:`, err.message);
  }
}

async function emitAndPropagate(eventType, fondId, impactDate, triggeredBy, metadata = null) {
  try {
    const [recent] = await sequelize.query(`
      SELECT id FROM recalc_events
      WHERE event_type = :eventType AND fond_id <=> :fondId AND impact_date = :impactDate
        AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      LIMIT 1
    `, {
      replacements: { eventType, fondId: fondId || null, impactDate },
      type: sequelize.QueryTypes.SELECT,
    });

    if (recent) return;

    const [result] = await sequelize.query(`
      INSERT INTO recalc_events (event_type, fond_id, impact_date, triggered_by, metadata, status)
      VALUES (:eventType, :fondId, :impactDate, :triggeredBy, :metadata, 'NEW')
    `, {
      replacements: {
        eventType,
        fondId: fondId || null,
        impactDate,
        triggeredBy,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      type: sequelize.QueryTypes.INSERT,
    });

    if (result) {
      await propagateEvent(result);
    }
  } catch (err) {
    if (err.message && err.message.includes("doesn't exist")) return;
    console.error(`[recalc-event] Erreur emitAndPropagate ${eventType}:`, err.message);
  }
}

module.exports = {
  emitEvent,
  propagateEvent,
  emitAndPropagate,
};
