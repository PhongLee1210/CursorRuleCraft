import { RouterProvider } from 'react-router';

import { router } from '@frontend/router';

export const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
