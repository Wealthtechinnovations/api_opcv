require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createServiceApp } = require('../shared/utils');
const routes = require('./routes');

const { app, start } = createServiceApp('Auth Service', process.env.AUTH_PORT || 3010);
app.use(routes);
start();
