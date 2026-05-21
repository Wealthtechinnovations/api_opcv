module.exports = {
  apps: [
    {
      name: 'gateway',
      script: 'services/gateway/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'auth-service',
      script: 'services/auth/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'fund-service',
      script: 'services/funds/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'performance-service',
      script: 'services/performance/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'portfolio-service',
      script: 'services/portfolio/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'analytics-service',
      script: 'services/analytics/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'reference-service',
      script: 'services/reference/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'notification-service',
      script: 'services/notification/index.js',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'worker-scheduler',
      script: 'src/workers/worker-scheduler.js',
      env: {
        NODE_ENV: 'production',
        SCHEDULER_LOG_DIR: '/var/log',
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'worker-recalculation',
      script: 'src/workers/worker-recalculation.js',
      env: {
        NODE_ENV: 'production',
        WORKER_POLL_INTERVAL: 10000,
        WORKER_LOCK_TIMEOUT: 300000,
        WORKER_ID: 'recalc-1',
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'worker-data-import',
      script: 'src/workers/worker-data-import.js',
      env: {
        NODE_ENV: 'production',
        IMPORT_POLL_INTERVAL: 30000,
        WORKER_ID: 'import-1',
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'ttyd-agent',
      script: 'src/workers/ttyd-agent.js',
      env: { NODE_ENV: 'production' },
      autorestart: false,
    },
  ],
};
