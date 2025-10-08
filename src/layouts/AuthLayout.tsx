import { Outlet } from 'react-router';

/**
 * AuthLayout component for authentication pages (login, register, etc.)
 * Provides a centered layout with consistent styling for auth forms
 */
export const AuthLayout = () => {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card text-card-foreground rounded-lg border p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">CursorRuleCraft</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Welcome back! Please sign in to continue.
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
