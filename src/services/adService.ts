// ============================================================
//  src/services/adService.ts
//  Minimal AdMob (interstitial-only) service for the Android build.
//
//  Scope: interstitial ads shown after a game finishes. No banners,
//  no rewarded ads, no ads during gameplay.
//
//  Safe to import from anywhere (web or native): every native call is
//  dynamically imported and guarded, so this is a complete no-op when
//  running in a normal browser (e.g. `npm run dev`) or on a platform
//  the plugin doesn't support.
// ============================================================

import { Capacitor } from '@capacitor/core';

// ------------------------------------------------------------------
// Ad Unit IDs
// ------------------------------------------------------------------
// Google's official TEST interstitial ad unit for Android. Always use
// this during development — never a real ad unit ID while testing.
const TEST_INTERSTITIAL_AD_ID_ANDROID = 'ca-app-pub-3940256099942544/1033173712';

// Production interstitial ad unit ID for RAKCHA GAME (loaded from env or default production ID).
const PRODUCTION_INTERSTITIAL_AD_ID_ANDROID =
  (import.meta.env.VITE_ADMOB_INTERSTITIAL_AD_ID_ANDROID as string) ||
  'ca-app-pub-2670119965769261/5744783245';

// Toggle for switching between test and production ad units.
// Default is `true` unless explicitly set to 'false' via environment variable.
const USE_TEST_ADS =
  import.meta.env.VITE_ADMOB_USE_TEST_ADS === undefined ||
  import.meta.env.VITE_ADMOB_USE_TEST_ADS === ''
    ? true
    : import.meta.env.VITE_ADMOB_USE_TEST_ADS !== 'false';

const INTERSTITIAL_AD_ID = USE_TEST_ADS
  ? TEST_INTERSTITIAL_AD_ID_ANDROID
  : PRODUCTION_INTERSTITIAL_AD_ID_ANDROID;

// Production rewarded ad unit ID for RAKCHA GAME (loaded from env; falls back to
// this hardcoded ID only if VITE_ADMOB_REWARDED_AD_ID_ANDROID is left unset).
const PRODUCTION_REWARDED_AD_ID_ANDROID =
  (import.meta.env.VITE_ADMOB_REWARDED_AD_ID_ANDROID as string) ||
  'ca-app-pub-2670119965769261/9111026614';

const TEST_REWARDED_AD_ID_ANDROID = 'ca-app-pub-3940256099942544/5224354917';

const REWARDED_AD_ID = USE_TEST_ADS
  ? TEST_REWARDED_AD_ID_ANDROID
  : PRODUCTION_REWARDED_AD_ID_ANDROID;

// ------------------------------------------------------------------
// Dev-only logging (never logs Firebase/user data)
// ------------------------------------------------------------------
const log = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[AdMob]', ...args);
  }
};

// ------------------------------------------------------------------
// Internal state
// ------------------------------------------------------------------
let isReady = false;
let isShowing = false;
let isPreparing = false;

let isRewardedReady = false;
let isRewardedShowing = false;
let isRewardedPreparing = false;
let activeRewardCallback: ((reward: any) => void) | null = null;

let initPromise: Promise<boolean> | null = null;
let listenersAttached = false;

/** Only Android is targeted for this integration (per project scope). */
function isSupportedNativePlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Lazily initializes the AdMob SDK. Safe to call multiple times —
 * the underlying `AdMob.initialize()` call only ever runs once.
 * Resolves to `false` on web or if the native SDK is unavailable.
 */
async function ensureInitialized(): Promise<boolean> {
  if (!isSupportedNativePlatform()) return false;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.initialize();

        if (!listenersAttached) {
          await attachListeners();
          listenersAttached = true;
        }

        log('SDK initialized');
        return true;
      } catch (err) {
        log('SDK unavailable / initialize failed', err);
        return false;
      }
    })();
  }

  return initPromise;
}

async function attachListeners(): Promise<void> {
  const { AdMob, InterstitialAdPluginEvents, RewardAdPluginEvents } = await import('@capacitor-community/admob');

  AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
    isReady = true;
    isPreparing = false;
    log('Interstitial loaded');
  });

  AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
    isReady = false;
    isPreparing = false;
    log('Interstitial failed to load', error);
  });

  AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
    log('Interstitial shown');
  });

  AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error) => {
    isShowing = false;
    isReady = false;
    log('Interstitial failed to show', error);
  });

  AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    isShowing = false;
    isReady = false;
    log('Interstitial dismissed');
    // Opportunistically prepare the next one for the following game.
    void preloadInterstitial();
  });

  AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
    isRewardedReady = true;
    isRewardedPreparing = false;
    log('Rewarded ad loaded');
  });

  AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
    isRewardedReady = false;
    isRewardedPreparing = false;
    log('Rewarded ad failed to load', error);
  });

  AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
    isRewardedShowing = false;
    isRewardedReady = false;
    log('Rewarded ad failed to show', error);
  });

  AdMob.addListener(RewardAdPluginEvents.Rewarded, (rewardItem) => {
    log('Rewarded ad earned reward', rewardItem);
    if (activeRewardCallback) {
      activeRewardCallback(rewardItem);
    }
  });

  AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
    isRewardedShowing = false;
    isRewardedReady = false;
    log('Rewarded ad dismissed');
    void preloadRewardedAd(); // Prepare next rewarded ad
  });
}

/**
 * Requests a new interstitial to be prepared in the background.
 * Call this when entering a game, well before it can finish.
 * No-op on web / unsupported platforms, and safe to call repeatedly.
 */
export async function preloadInterstitial(): Promise<void> {
  if (!isSupportedNativePlatform()) return;
  if (isReady || isPreparing) return;

  const initialized = await ensureInitialized();
  if (!initialized) return;

  try {
    isPreparing = true;
    log('Interstitial requested');
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_ID,
      isTesting: USE_TEST_ADS,
    });
    // Readiness is confirmed by the Loaded listener; prepareInterstitial's
    // own promise can resolve before the SDK actually finishes loading.
  } catch (err) {
    isPreparing = false;
    isReady = false;
    log('Interstitial failed to load', err);
  }
}

export function isInterstitialReady(): boolean {
  return isSupportedNativePlatform() && isReady && !isShowing;
}

/**
 * Shows the interstitial if one is ready, and resolves once the user
 * has dismissed it (or the ad failed to show). If no ad is ready, or
 * we're on web, this resolves immediately so the caller's flow is
 * never blocked.
 */
export async function showInterstitialIfReady(): Promise<void> {
  if (!isInterstitialReady()) {
    log('Interstitial not ready, continuing without ad');
    return;
  }

  isShowing = true;

  try {
    const { AdMob, InterstitialAdPluginEvents } = await import('@capacitor-community/admob');

    const waitForOutcome = new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      // Safety timeout: never block the game-finished flow indefinitely,
      // even if a Dismissed/FailedToShow event is somehow never delivered.
      const timeoutId = setTimeout(() => {
        log('Interstitial dismissal timed out, continuing anyway');
        finish();
      }, 15000);

      void AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        clearTimeout(timeoutId);
        finish();
      });
      void AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
        clearTimeout(timeoutId);
        finish();
      });
    });

    await AdMob.showInterstitial();
    await waitForOutcome;
  } catch (err) {
    log('Interstitial failed to show', err);
  } finally {
    isShowing = false;
    isReady = false;
  }
}

export async function preloadRewardedAd(): Promise<void> {
  if (!isSupportedNativePlatform()) return;
  if (isRewardedReady || isRewardedPreparing) return;

  const initialized = await ensureInitialized();
  if (!initialized) return;

  try {
    isRewardedPreparing = true;
    log('Rewarded ad requested');
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_ID,
      isTesting: USE_TEST_ADS,
    });
  } catch (err) {
    isRewardedPreparing = false;
    isRewardedReady = false;
    log('Rewarded ad failed to load', err);
  }
}

export function isRewardedAdReady(): boolean {
  return isSupportedNativePlatform() && isRewardedReady && !isRewardedShowing;
}

export async function showRewardedAdIfReady(): Promise<boolean> {
  if (!isRewardedAdReady()) {
    log('Rewarded ad not ready');
    return false;
  }

  isRewardedShowing = true;
  let rewardEarned = false;

  try {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');

    const waitForOutcome = new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        activeRewardCallback = null;
        resolve();
      };

      activeRewardCallback = () => {
        rewardEarned = true;
      };

      const timeoutId = setTimeout(() => {
        log('Rewarded ad dismissal timed out');
        finish();
      }, 120000); // 120 seconds max for rewarded ad wait.
      
      void AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        clearTimeout(timeoutId);
        finish();
      });
      void AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => {
        clearTimeout(timeoutId);
        finish();
      });
    });

    await AdMob.showRewardVideoAd();
    await waitForOutcome;
  } catch (err) {
    log('Rewarded ad failed to show', err);
  } finally {
    isRewardedShowing = false;
    isRewardedReady = false;
    activeRewardCallback = null;
  }

  return rewardEarned;
}

/** Test-only / debugging helper, not used by app code. */
export function __resetAdStateForTests(): void {
  isReady = false;
  isShowing = false;
  isPreparing = false;
  initPromise = null;
  listenersAttached = false;
}
