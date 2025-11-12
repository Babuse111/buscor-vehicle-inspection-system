const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Invalid token attempt from ${req.ip}: ${err.message}`);
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID' 
      });
    }

    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      logger.warn(`Access denied for user ${req.user.id} - required roles: ${requiredRoles}, user roles: ${userRoles}`);
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredRoles,
        current: userRoles
      });
    }

    next();
  };
};

// Specific role middleware
const requireAdmin = requireRole(['admin']);
const requireDriver = requireRole(['driver', 'admin']);
const requireMechanic = requireRole(['mechanic', 'admin']);
const requireDriverOrMechanic = requireRole(['driver', 'mechanic', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireDriver,
  requireMechanic,
  requireDriverOrMechanic
};