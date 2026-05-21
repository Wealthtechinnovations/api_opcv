require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./src/db/sequelize');
const { initClickHouse } = require('./src/db/clickhouse');
const { startPeriodicSync } = require('./src/services/clickhouse-sync');

// Initialize database
sequelize.initDb();

// Initialize ClickHouse (non-blocking — analytics features disabled if unavailable)
initClickHouse().then((available) => {
  if (available) {
    const syncInterval = parseInt(process.env.CLICKHOUSE_SYNC_INTERVAL_MINUTES, 10) || 60;
    startPeriodicSync(syncInterval);
  }
});

const app = express();
const port = process.env.PORT || 3005;

// ---------------------
// Middleware
// ---------------------

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS - restrict to known origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.SITE_BASE_URL || 'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Origin', 'Authorization', 'X-Requested-With', 'Content-Type', 'Accept', 'x-api-key'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
const { sanitizeStrings, rateLimit } = require('./src/middleware/validate');
app.use(sanitizeStrings);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting global - 200 requêtes par 15 minutes par IP
app.use(rateLimit(200, 15 * 60 * 1000));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ---------------------
// Swagger Documentation
// ---------------------
if (process.env.NODE_ENV !== 'production') {
  const swaggerUI = require('swagger-ui-express');
  const swaggerJsDoc = require('swagger-jsdoc');
  const swaggerOptions = {
    failOnErrors: true,
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API OPCVM - Documentation',
        version: '1.0.0',
        description: 'API pour la gestion et l\'analyse de fonds OPCVM',
      },
      servers: [
        {
          url: process.env.API_BASE_URL || `http://localhost:${port}`,
        },
      ],
    },
    apis: ['./src/routes/*.js'],
  };

  const specs = swaggerJsDoc(swaggerOptions);
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs));
}

// ---------------------
// Routes
// ---------------------
require('./src/routes/apigestionauth')(app);
require('./src/routes/routes_vl')(app);

// Router-based route files
app.use(require('./src/routes/apigestionfonds'));
app.use(require('./src/routes/apigestionpays'));
app.use(require('./src/routes/apigestionperformance'));
app.use(require('./src/routes/apigestionquartile'));
app.use(require('./src/routes/apigestionratios'));
app.use(require('./src/routes/apigestionrendement'));
app.use(require('./src/routes/apigestionsavequotidien'));
app.use(require('./src/routes/apigestionsociete'));
app.use(require('./src/routes/apigestionapikey'));

// Analytics routes (ClickHouse-powered)
app.use(require('./src/routes/analytics'));

// Health check (basic)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check (detailed) — etat complet de la plateforme
app.get('/health/detailed', async (req, res) => {
  const result = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: { status: 'unknown' },
    clickhouse: { status: 'unknown' },
    tables: {},
  };

  try {
    const db = sequelize.sequelize;
    const [tables] = await db.query(`
      SELECT 'fond_investissements' as tbl, COUNT(*) as cnt FROM fond_investissements WHERE active = 1
      UNION ALL SELECT 'valorisations', COUNT(*) FROM valorisations
      UNION ALL SELECT 'performences', COUNT(*) FROM performences
      UNION ALL SELECT 'performences_eurs', COUNT(*) FROM performences_eurs
      UNION ALL SELECT 'performences_usds', COUNT(*) FROM performences_usds
      UNION ALL SELECT 'classementfonds', COUNT(*) FROM classementfonds
      UNION ALL SELECT 'classementfonds_eurs', COUNT(*) FROM classementfonds_eurs
      UNION ALL SELECT 'classementfonds_usds', COUNT(*) FROM classementfonds_usds
      UNION ALL SELECT 'rendements', COUNT(*) FROM rendements
      UNION ALL SELECT 'devisedechanges', COUNT(*) FROM devisedechanges
      UNION ALL SELECT 'societes', COUNT(*) FROM societes
      UNION ALL SELECT 'indice_references', COUNT(*) FROM indice_references
    `, { type: db.QueryTypes.SELECT });
    for (const row of tables) {
      result.tables[row.tbl] = parseInt(row.cnt);
    }
    result.database.status = 'connected';

    const [lastVlRows] = await db.query(
      `SELECT MAX(date) as last_date, COUNT(DISTINCT fund_id) as fonds FROM valorisations WHERE date > DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const lastVl = lastVlRows[0];
    result.database.last_vl_date = lastVl?.last_date || null;
    result.database.fonds_with_recent_vl = parseInt(lastVl?.fonds) || 0;

    const [lastClassementRows] = await db.query(
      `SELECT MAX(updatedAt) as last_update, COUNT(DISTINCT fond_id) as fonds FROM classementfonds`
    );
    const lastClassement = lastClassementRows[0];
    result.database.last_classement_update = lastClassement?.last_update || null;
    result.database.fonds_with_classement = parseInt(lastClassement?.fonds) || 0;
  } catch (err) {
    result.database.status = 'error';
    result.database.error = err.message;
    result.status = 'degraded';
  }

  try {
    const { isClickHouseAvailable } = require('./src/db/clickhouse');
    result.clickhouse.status = isClickHouseAvailable() ? 'connected' : 'unavailable';
  } catch (err) {
    result.clickhouse.status = 'unavailable';
  }

  res.json(result);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// ---------------------
// Global Error Handler
// ---------------------
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: Origine non autorisée' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message,
  });
});

// ---------------------
// Start Server
// ---------------------
const server = app.listen(port, () => {
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
