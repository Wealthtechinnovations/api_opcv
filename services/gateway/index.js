require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('./serviceRegistry');

const app = express();
const port = process.env.GATEWAY_PORT || 3005;

// ---------------------
// Middleware (matching monolith app.js config)
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
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
].filter((v, i, a) => a.indexOf(v) === i);

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
  credentials: true,
}));

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ---------------------
// Build route-to-service lookup map
// ---------------------
const routeMap = new Map();
for (const [serviceKey, service] of Object.entries(services)) {
  for (const route of service.routes) {
    routeMap.set(route, { key: serviceKey, ...service });
  }
}

// ---------------------
// Swagger UI - Gateway-level API docs
// ---------------------
if (process.env.NODE_ENV !== 'production') {
  const swaggerUI = require('swagger-ui-express');

  const gatewaySwaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'API OPCVM Gateway',
      version: '1.0.0',
      description: 'API Gateway for the OPCVM microservices architecture. Routes requests to the appropriate backend service.',
    },
    servers: [
      { url: process.env.API_BASE_URL || `http://localhost:${port}` },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Aggregated health check for all services',
          tags: ['Gateway'],
          responses: {
            200: { description: 'All services healthy' },
            503: { description: 'One or more services unhealthy' },
          },
        },
      },
    },
    tags: Object.values(services).map((s) => ({ name: s.name, description: `Proxied to ${s.url}` })),
  };

  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(gatewaySwaggerSpec));
}

// ---------------------
// Health aggregator
// ---------------------
app.get('/health', async (req, res) => {
  const results = {};
  let allHealthy = true;

  await Promise.all(
    Object.entries(services).map(async ([key, service]) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${service.url}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        results[key] = {
          name: service.name,
          url: service.url,
          status: response.ok ? 'healthy' : 'unhealthy',
          httpStatus: response.status,
        };
        if (!response.ok) allHealthy = false;
      } catch (err) {
        allHealthy = false;
        results[key] = {
          name: service.name,
          url: service.url,
          status: 'unreachable',
          error: err.message,
        };
      }
    })
  );

  res.status(allHealthy ? 200 : 503).json({
    gateway: 'ok',
    timestamp: new Date().toISOString(),
    services: results,
  });
});

// ---------------------
// Proxy middleware per service
// ---------------------
for (const [serviceKey, service] of Object.entries(services)) {
  const proxyMiddleware = createProxyMiddleware({
    target: service.url,
    changeOrigin: true,
    // Do NOT parse the body - let the backend service handle it
    // This means we must NOT use express.json() before proxied routes
    on: {
      proxyReq: (proxyReq, req) => {
        // Forward Authorization header (already in the original request)
        // http-proxy-middleware forwards all headers by default,
        // but we log routing for observability
      },
      error: (err, req, res) => {
        console.error(`[Gateway] Proxy error for ${service.name}:`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            error: `Service indisponible: ${service.name}`,
            message: 'Le service backend est temporairement inaccessible. Veuillez réessayer.',
          });
        }
      },
    },
  });

  // Register each route for this service
  for (const route of service.routes) {
    app.use(route, proxyMiddleware);
  }
}

// ---------------------
// 404 handler for unmatched routes
// ---------------------
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
  for (const [key, service] of Object.entries(services)) {
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
