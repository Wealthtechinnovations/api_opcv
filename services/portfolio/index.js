require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createServiceApp } = require('../shared/utils');
const routes = require('./routes');

const { app, start } = createServiceApp('Portfolio Service', process.env.PORTFOLIO_PORT || 3013);
app.use(routes);
start();
