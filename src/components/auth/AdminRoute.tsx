import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protects admin-only routes.
 * Uses sessionStorage 'isAdmin' flag (matching existing AdminDashboard pattern).
 * Redirects unauthenticated admin users to /admin/login.
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const isAdmin = sessionStorage.getItem('isAdmin');

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
