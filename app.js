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
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow requests with no origin only in non-production (local dev/testing)
    if (!origin && process.env.NODE_ENV !== 'production') {
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
require('./src/routes/routes_vl')(app);

// Analytics routes (ClickHouse-powered)
app.use(require('./src/routes/analytics'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
