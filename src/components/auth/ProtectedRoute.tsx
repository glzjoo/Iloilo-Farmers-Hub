import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Which roles are allowed to access this route */
  allowedRoles?: ('farmer' | 'consumer')[];
}

/**
 * Protects routes that require authentication.
 * Optionally restricts access to specific user roles (farmer/consumer).
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isLoggedIn, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show nothing while auth state is loading to prevent flash of redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → redirect to login, save intended destination
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role check: if allowedRoles is specified, verify the user's role
  if (allowedRoles && userProfile?.role && !allowedRoles.includes(userProfile.role)) {
    // User is logged in but has wrong role → redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
