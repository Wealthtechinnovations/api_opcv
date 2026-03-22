require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createServiceApp } = require('../shared/utils');
const routes = require('./routes');

const { app, start } = createServiceApp('Reference Service', process.env.REFERENCE_PORT || 3015);
app.use(routes);
start();
