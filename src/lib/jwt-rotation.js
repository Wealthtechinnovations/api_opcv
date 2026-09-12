const jwt = require('jsonwebtoken');

function getCurrentSecret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return value;
}

function getPreviousSecret() {
  const value = process.env.JWT_SECRET_PREVIOUS;
  return value && value !== process.env.JWT_SECRET ? value : null;
}

function signJwt(payload, options) {
  return jwt.sign(payload, getCurrentSecret(), options);
}

function verifyJwt(token, options) {
  try {
    return jwt.verify(token, getCurrentSecret(), options);
  } catch (error) {
    const previous = getPreviousSecret();
    if (!previous || error.name !== 'JsonWebTokenError') {
      throw error;
    }
    return jwt.verify(token, previous, options);
  }
}

module.exports = {
  signJwt,
  verifyJwt,
  getCurrentSecret,
  getPreviousSecret,
};
