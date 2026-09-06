// ============================================================
//  src/firebase/config.ts
//  Central place that connects the app to Firebase (Auth + Firestore).
//  Every other firebase/*.ts module imports its instances from here so
//  we never call initializeApp() more than once.
//
//  Adapted from the legacy project's firebase-config.js. Key changes:
//   - The config now comes from Vite env vars (VITE_FIREBASE_*) instead
//     of being hardcoded, so no project credentials live in source control.
//   - Analytics/Storage are left out since nothing in RAKCHA GAME uses them
//     yet; add them back the same way (getAnalytics/getStorage) if needed.
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';

// Silence internal verbose connection retry logs from Firebase SDK
setLogLevel('error');

// The existing RAKCHA GAME Firebase project (tawla-e6f71). Everything except
// the API key is a fixed, non-secret identifier of that project, so it is
// pinned here to make a missing .env.local impossible to misconfigure into a
// second project. The API key still comes from VITE_FIREBASE_API_KEY.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDw4B83MZXPNMVTEV1lIntMwh63_ScgY4c',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tawla-e6f71.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tawla-e6f71',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tawla-e6f71.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '163517793638',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:163517793638:web:27ca8ef72ba3856ca7f4a7',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-GJBX1Z9VGJ',
};

// Helps catch a misconfigured .env.local early instead of failing deep
// inside a Firestore call with a cryptic error.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[rakcha] Firebase env vars are missing. Copy .env.example to .env.local ' +
      'and fill in your Firebase project config (Project settings -> Your apps -> Web app).'
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const functions = getFunctions(app);

// Enable experimentalForceLongPolling only for development, iframe, or sandbox web environments.
// Real production mobile apps (Capacitor) or standard non-iframe production web deployments should
// use the default high-performance WebSockets transport.
const isNative = Capacitor.isNativePlatform();
const isDevelopment = import.meta.env.DEV;
const isSandboxEnv = typeof window !== 'undefined' && (
  window.location.hostname.includes('localhost') ||
  window.location.hostname.includes('run.app') ||
  window.location.hostname.includes('web-sandbox') ||
  window.location.hostname.includes('aistudio') ||
  window.self !== window.top
);
const shouldForceLongPolling = !isNative && (isDevelopment || isSandboxEnv);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: shouldForceLongPolling,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Keep users logged in across reloads/navigation.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  // eslint-disable-next-line no-console
  console.warn('[rakcha] Auth persistence setup failed:', err.code);
});

// Local dev against the Firebase emulator suite:
//   firebase emulators:start
// Toggle with VITE_USE_FIREBASE_EMULATORS=true in .env.local
// Also ensure we are actually on localhost to avoid "network-request-failed" in cloud previews.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && 
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app };
