import { HelmetProvider } from 'react-helmet-async';
import { Outlet } from 'react-router';

import { ClerkProvider } from '@frontend/providers/ClerkProvider';
import { LocaleProvider } from '@frontend/providers/LocaleProvider';
import { QueryProvider } from '@frontend/providers/QueryProvider';
import { ThemeProvider } from '@frontend/providers/ThemeProvider';
import { WorkspaceProvider } from '@frontend/providers/WorkspaceProvider';

export const Providers = () => (
  <HelmetProvider>
    <ClerkProvider>
      <LocaleProvider>
        <QueryProvider>
          <WorkspaceProvider>
            <ThemeProvider>
              <Outlet />
            </ThemeProvider>
          </WorkspaceProvider>
        </QueryProvider>
      </LocaleProvider>
    </ClerkProvider>
  </HelmetProvider>
);
