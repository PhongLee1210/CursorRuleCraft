import { useUserSync } from '@/hooks';
import { Outlet } from 'react-router';

export const MainLayout = () => {
  useUserSync();

  return (
    <div>
      <Outlet />
    </div>
  );
};
