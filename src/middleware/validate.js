/**
 * Middleware de validation des entrées
 * Protège contre les injections et les données malformées
 */

/**
 * Valide que les champs requis sont présents dans le body
 * @param {string[]} fields - Liste des champs obligatoires
 */
const requireFields = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants',
        fields: missing
      });
    }
    next();
  };
};

/**
 * Valide le format d'un email
 */
const validateEmail = (field = 'email') => {
  return (req, res, next) => {
    const email = req.body[field];
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: `Format d'email invalide pour le champ ${field}` });
      }
    }
    next();
  };
};

/**
 * Valide que les paramètres numériques sont bien des nombres
 * @param {string[]} params - Noms des paramètres à valider
 * @param {string} source - 'params', 'query', ou 'body'
 */
const validateNumeric = (params, source = 'params') => {
  return (req, res, next) => {
    const data = req[source];
    for (const param of params) {
      if (data[param] !== undefined) {
        const num = Number(data[param]);
        if (isNaN(num)) {
          return res.status(400).json({
            error: `Le paramètre '${param}' doit être un nombre valide`
          });
        }
      }
    }
    next();
  };
};

/**
 * Valide le format d'une date (YYYY-MM-DD)
 * @param {string[]} fields - Champs à valider
 * @param {string} source - 'body', 'query', ou 'params'
 */
const validateDate = (fields, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const field of fields) {
      if (data[field] && !dateRegex.test(data[field])) {
        return res.status(400).json({
          error: `Format de date invalide pour '${field}'. Utilisez le format YYYY-MM-DD`
        });
      }
    }
    next();
  };
};

/**
 * Sanitise les chaînes de caractères pour éviter les XSS
 */
const sanitizeStrings = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove HTML tags to prevent XSS
        obj[key] = obj[key].replace(/<[^>]*>/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);

  next();
};

/**
 * Limite la taille des fichiers uploadés et vérifie les types MIME
 * @param {string[]} allowedTypes - Types MIME autorisés
 * @param {number} maxSize - Taille maximale en bytes (défaut: 10MB)
 */
const validateFileUpload = (allowedTypes, maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) return next();

    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: `Le fichier est trop volumineux. Taille maximale: ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }

    if (allowedTypes.length > 0) {
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      const mimeOk = allowedTypes.some(type =>
        req.file.mimetype.includes(type) || ext === type
      );

      if (!mimeOk) {
        return res.status(400).json({
          error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
        });
      }
    }

    next();
  };
};

/**
 * Rate limiter simple basé sur la mémoire
 * @param {number} maxRequests - Nombre max de requêtes
 * @param {number} windowMs - Fenêtre de temps en ms
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  // Nettoyage périodique
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests) {
      if (now - data.startTime > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;

    // Exempter les appels INTERNES (crons + scripts batch qui appellent l'API en
    // boucle sur localhost:3005). Un appel interne arrive directement sur la
    // loopback SANS en-tete X-Forwarded-For ; les clients externes passent par
    // Nginx qui ajoute toujours X-Forwarded-For (trust proxy=1). Aucun impact sur
    // le rate-limit des clients externes (ils gardent leur IP reelle).
    const socketIp = (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || '';
    const isLoopbackSocket = socketIp === '127.0.0.1' || socketIp === '::1' || socketIp === '::ffff:127.0.0.1';
    if (isLoopbackSocket && !req.headers['x-forwarded-for']) {
      return next();
    }

    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    const data = requests.get(key);
    if (now - data.startTime > windowMs) {
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    data.count++;
    if (data.count > maxRequests) {
      return res.status(429).json({
        error: 'Trop de requêtes. Veuillez réessayer plus tard.'
      });
    }

    next();
  };
};

module.exports = {
  requireFields,
  validateEmail,
  validateNumeric,
  validateDate,
  sanitizeStrings,
  validateFileUpload,
  rateLimit
};
