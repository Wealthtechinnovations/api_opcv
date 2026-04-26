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
  ],
};
