import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.antifada.app',
  appName: 'RAKCHA GAME',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      // Auto-hide is OFF on purpose: we hide the native splash manually, only once the
      // in-app JS splash screen (SplashScreen.tsx) has actually painted. With auto-hide
      // on AND a manual hide() call in nativeShell.ts, the two raced each other — on a
      // cold start the native splash could disappear before the JS bundle finished
      // loading/decoding its background image, showing a blank flash in between
      // ("splash not smooth"). Hiding manually after paint removes that gap.
      launchAutoHide: false,
      backgroundColor: '#0B0E17',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0E17',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
