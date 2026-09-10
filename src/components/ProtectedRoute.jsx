import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute
 * Enforces strict role-based access control (RBAC):
 * - Unauthenticated users are redirected to /login with return location
 * - FARMER must NOT access buyer-only or admin pages
 * - BUYER must NOT access farmer-only or admin pages
 * - ADMIN only can access admin functionality
 */
export default function ProtectedRoute({ children, allowedRoles = [], adminOnly = false }) {
  const { isLoggedIn, role } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveAllowedRoles = adminOnly
    ? ['admin']
    : (allowedRoles.length > 0 ? allowedRoles : ['farmer', 'buyer', 'admin']);

  const userRole = (role || '').toLowerCase();
  const isAuthorized = effectiveAllowedRoles.map(r => r.toLowerCase()).includes(userRole);

  if (!isAuthorized) {
    // If Admin attempts to access non-admin only route
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    // If Farmer attempts to access unauthorized route (e.g. /admin)
    if (userRole === 'farmer') {
      return <Navigate to="/dashboard" state={{ accessDenied: true }} replace />;
    }

    // If Buyer attempts to access unauthorized route (e.g. /admin)
    if (userRole === 'buyer') {
      return <Navigate to="/dashboard" state={{ accessDenied: true }} replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}
