import { Button } from '@/components/Button';
import { SignOutButton, useUser } from '@clerk/clerk-react';

/**
 * DashboardPage component
 * Main dashboard page for authenticated users
 */
export const DashboardPage = () => {
  const { user } = useUser();

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
            </p>
          </div>
          <SignOutButton>
            <Button variant="outline">Sign Out</Button>
          </SignOutButton>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">User Information</h3>
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                <strong>ID:</strong> {user?.id}
              </p>
              <p>
                <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p>
                <strong>Name:</strong> {user?.fullName || 'Not set'}
              </p>
              <p>
                <strong>Email Verified:</strong>{' '}
                {user?.primaryEmailAddress?.verification?.status === 'verified' ? '✅' : '❌'}
              </p>
            </div>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Getting Started</h3>
            <p className="text-muted-foreground text-sm">
              You're successfully authenticated with Clerk and Supabase integration is ready to use!
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Next Steps</h3>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>Configure Clerk integration in dashboard</li>
              <li>Enable Supabase integration</li>
              <li>Set up your database tables</li>
              <li>Start building your app!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
