// Fix for "Cannot set property fetch of #<Window> which has only a getter"
// This must run as early as possible.
(function() {
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
      if (descriptor && descriptor.configurable) {
        const originalFetch = window.fetch;
        Object.defineProperty(window, 'fetch', {
          get: () => originalFetch,
          set: () => { /* Ignore attempts to overwrite fetch */ },
          configurable: true,
          enumerable: true
        });
      }
    }
  } catch (e) {
    // Ignore errors during redefinition
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
