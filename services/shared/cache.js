const NodeCache = require('node-cache');

// ---------------------
// Cache Instance
// ---------------------
const cache = new NodeCache({ stdTTL: 3600 });

/**
 * Get a value from cache, or fetch it and store it if not present.
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to call if cache miss
 * @param {number} [ttl] - Optional TTL in seconds (overrides default)
 * @returns {Promise<*>} The cached or freshly fetched value
 */
const getOrSet = async (key, fetchFn, ttl) => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await fetchFn();

  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }

  return value;
};

/**
 * Invalidate a specific cache key.
 * @param {string} key - Cache key to invalidate
 */
const invalidate = (key) => {
  cache.del(key);
};

/**
 * Invalidate all keys matching a pattern (simple string includes check).
 * @param {string} pattern - Pattern to match against cache keys
 */
const invalidatePattern = (pattern) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  const matchingKeys = keys.filter(key => regex.test(key));
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
  }
};

module.exports = {
  cache,
  getOrSet,
  invalidate,
  invalidatePattern,
};
