const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Middleware d'authentification JWT
 * Vérifie le token dans le header Authorization (Bearer <token>)
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré, veuillez vous reconnecter' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

/**
 * Middleware d'autorisation par rôle
 * @param  {...string} roles - Rôles autorisés (ex: 'admin', 'societe_gestion', 'investisseur')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé pour ce rôle' });
    }

    next();
  };
};

/**
 * Middleware optionnel - n'échoue pas si pas de token, mais ajoute req.user si présent
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // Token invalide - on continue sans authentification
    }
  }

  next();
};

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} user - Données utilisateur (id, email, role)
 * @param {string} expiresIn - Durée de validité (ex: '24h', '7d')
 */
const generateToken = (user, expiresIn = '24h') => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.typeusers || 'investisseur',
      typeusers_id: user.typeusers_id != null ? Number(user.typeusers_id) : 1,
      societe: user.denomination || null,
      pays: user.pays || null
    },
    JWT_SECRET,
    { expiresIn }
  );
};

module.exports = { authenticate, authorize, optionalAuth, generateToken };
