import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute
 * - If not logged in → redirect to /login (saves intended path)
 * - If adminOnly and not admin → redirect to /
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, role } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
