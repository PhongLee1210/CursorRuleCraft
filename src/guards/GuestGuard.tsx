import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router';

/**
 * GuestGuard component protects routes that should only be accessible to unauthenticated users
 * (e.g., login, register pages).
 *
 * If the user is authenticated, they will be redirected to the dashboard or intended page.
 * If the user is not authenticated, they can access the route.
 */
export const GuestGuard = () => {
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

  // If user is already signed in, redirect to dashboard or the page they came from
  if (isSignedIn) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // User is not signed in, allow access to guest routes
  return <Outlet />;
};
