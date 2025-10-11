import { HelmetProvider } from 'react-helmet-async';
import { Outlet } from 'react-router';

import { ClerkProvider } from '@/providers/ClerkProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WorkspaceProvider } from '@/providers/WorkspaceProvider';

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
