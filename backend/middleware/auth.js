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

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};
