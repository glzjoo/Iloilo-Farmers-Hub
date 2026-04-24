import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * Protects auth pages (login, signup, OTP) from already-authenticated users.
 * If a user is already logged in, they are redirected to the home page
 * instead of seeing login/signup forms.
 */
export default function GuestRoute({ children }: GuestRouteProps) {
  const { isLoggedIn, loading } = useAuth();

  // Show nothing while auth state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Already logged in → redirect away from auth pages
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
