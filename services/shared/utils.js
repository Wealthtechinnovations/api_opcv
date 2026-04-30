const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const { initDb } = require('./db');

/**
 * Creates a standardized Express app for a microservice.
 * @param {string} serviceName - Name of the service (for logging)
 * @param {number} port - Port to listen on
 * @returns {{ app: express.Application, start: Function }}
 */
function createServiceApp(serviceName, port) {
  const app = express();

  // Standard middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.SITE_BASE_URL || 'http://localhost:3000',
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(morgan('combined'));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ service: serviceName, status: 'ok', timestamp: new Date().toISOString() });
  });

  const start = async () => {
    try {
      await initDb();
      app.listen(port, () => {
      });
    } catch (error) {
      console.error(`Failed to start ${serviceName}:`, error);
      process.exit(1);
    }
  };

  return { app, start };
}

module.exports = { createServiceApp };
