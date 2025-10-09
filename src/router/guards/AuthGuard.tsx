import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router';

/**
 * AuthGuard component protects routes that require authentication.
 *
 * If the user is not authenticated, they will be redirected to the login page
 * with the current location saved so they can be redirected back after signing in.
 * If the user is authenticated, they can access the route.
 */
export const AuthGuard = () => {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  // Wait for Clerk to finish loading the user state
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If user is not signed in, redirect to login with return URL
  if (!isSignedIn) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // User is signed in, allow access to protected routes
  return <Outlet />;
};
