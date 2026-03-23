require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createServiceApp } = require('../shared/utils');
const routes = require('./routes');

const { app, start } = createServiceApp('Analytics Service', process.env.ANALYTICS_PORT || 3014);
app.use(routes);
start();
