/**
 * Middleware de pagination standard
 * Ajoute req.pagination avec page, limit, offset
 */
const paginate = (defaultLimit = 50, maxLimit = 500) => {
  return (req, res, next) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || defaultLimit;

    if (page < 1) page = 1;
    if (limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const offset = (page - 1) * limit;

    req.pagination = { page, limit, offset };
    next();
  };
};

/**
 * Helper pour formater la réponse paginée
 */
const paginatedResponse = (data, count, pagination) => {
  const totalPages = Math.ceil(count / pagination.limit);
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: count,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
};

module.exports = { paginate, paginatedResponse };
