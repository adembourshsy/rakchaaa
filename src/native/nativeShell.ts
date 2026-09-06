// ============================================================
//  src/native/nativeShell.ts
//  Capacitor (Android / iOS) integration for the existing web app.
//  Purely technical: status bar, splash screen, keyboard behaviour and
//  external links. No UI/visual changes.
// ============================================================

import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

/**
 * Hides the native (Capacitor) splash screen. Call this only once the in-app JS
 * splash screen has actually painted, so the handoff between the two is invisible.
 * Safe no-op on the web build or if the plugin is unavailable.
 */
export async function hideNativeSplash(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    /* splash plugin unavailable — non fatal */
  }
}

/**
 * One-time native setup, called from main.tsx before React renders.
 * Everything is dynamically imported so the web build never pulls the
 * native plugin code paths at startup.
 */
export async function initNativeShell(): Promise<void> {
  if (!isNativePlatform()) return;

  const platform = Capacitor.getPlatform();
  document.documentElement.classList.add('capacitor', `platform-${platform}`);

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#0B0E17' });
    }
  } catch {
    /* status bar plugin unavailable — non fatal */
  }

  try {
    const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    if (platform === 'ios') {
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
    }
    // Keep the focused input visible: expose keyboard height as a CSS var.
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.documentElement.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      document.documentElement.classList.remove('keyboard-open');
    });
  } catch {
    /* keyboard plugin unavailable — non fatal */
  }

  // NOTE: the native splash screen is intentionally NOT hidden here. Hiding it this
  // early (before React has even rendered) can race ahead of the in-app JS splash
  // screen finishing its own paint (it loads a background image), leaving a blank
  // flash on screen in between. It is hidden instead by `hideNativeSplash()` below,
  // called from SplashScreen.tsx once that component has actually painted.

  // Open http(s) links in the system browser instead of replacing the app WebView.
  document.addEventListener('click', (event) => {
    const anchor = (event.target as HTMLElement | null)?.closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || !/^https?:\/\//i.test(href)) return;
    event.preventDefault();
    import('@capacitor/browser').then(({ Browser }) => Browser.open({ url: href }));
  });
}
