require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createServiceApp } = require('../shared/utils');
const routes = require('./routes');

const { app, start } = createServiceApp('Notification Service', process.env.NOTIFICATION_PORT || 3016);
app.use(routes);
start();
