require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createServiceApp } = require('../shared/utils');
const routes = require('./routes');

const { app, start } = createServiceApp('Performance Service', process.env.PERFORMANCE_PORT || 3012);
app.use(routes);
start();
