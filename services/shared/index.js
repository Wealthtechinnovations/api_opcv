const db = require('./db');
const middleware = require('./middleware');
const utils = require('./utils');
const cacheModule = require('./cache');

module.exports = {
  ...db,
  ...middleware,
  ...utils,
  ...cacheModule,
  // Also export as namespaced modules for clarity
  db,
  middleware,
  utils,
  cacheModule,
};
