export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication is required.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const hasPermission = allowedRoles.some(r => r.toLowerCase() === userRole);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Allowed roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
