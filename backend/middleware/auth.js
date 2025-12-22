const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route (missing token)'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from MySQL via repository
    const user = await userRepo.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this id'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Attach user object to request (for controllers)
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth protect error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten the roles array in case it's passed as a single array argument
    const allowedRoles =
      roles.length === 1 && Array.isArray(roles[0]) ? roles[0] : roles;

    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'User not authenticated'
      });
    }
  

    // Check if user has any of the allowed roles
    const hasPermission = req.user.roles && req.user.roles.some(role => allowedRoles.includes(role));
    
    // Fallback to old role field for backward compatibility
    const hasLegacyPermission = req.user.role && allowedRoles.includes(req.user.role);

    if (!hasPermission && !hasLegacyPermission) {
      return res.status(403).json({
        success: false,
        message: `User role(s) [${req.user.roles?.join(', ') || req.user.role}] not authorized to access this route. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};

// Middleware using hasRole() - Check for single role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!req.user.hasRole(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${role} role required.`
      });
    }

    next();
  };
};

// Middleware using hasAnyRole() - Check for multiple roles
const requireAnyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!req.user.hasAnyRole(...roles)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. One of these roles required: ${roles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  requireRole,
  requireAnyRole
};
