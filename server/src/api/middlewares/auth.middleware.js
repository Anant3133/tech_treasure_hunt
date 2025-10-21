const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.team = decoded; // { teamId, teamName, role }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}

function authorizeRoles(...allowed) {
  return (req, res, next) => {
    const role = req.team?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    return next();
  };
}

// Convenience middleware for admin-only routes
function adminMiddleware(req, res, next) {
  return authorizeRoles('admin')(req, res, next);
}

module.exports = { protect, authorizeRoles, adminMiddleware };


