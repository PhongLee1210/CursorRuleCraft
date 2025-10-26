import { StrictMode } from 'react';

import App from '@frontend/App';
import { createRoot } from 'react-dom/client';

import '@frontend/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
