require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createServiceApp } = require('../shared/utils');
const routes = require('./routes');

const { app, start } = createServiceApp('Fund Service', process.env.FUND_PORT || 3011);
app.use(routes);
start();
