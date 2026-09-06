import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initNativeShell} from './native/nativeShell';
import {registerServiceWorker} from './registerServiceWorker';

// Native (Capacitor) setup: status bar, splash, keyboard, external links.
// No-op on the web build.
void initNativeShell();

// Register Service Worker for offline asset caching & local AI game execution
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
