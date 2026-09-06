import { useMemo } from 'react';

/**
 * Cheap, synchronous, one-shot heuristic for "is this a low-end / weak device"
 * (older or budget Android phones especially). Used to decide whether it's
 * safe to render expensive CSS (backdrop-filter/blur, large blurred glows,
 * infinite looping transforms) or whether we should fall back to a much
 * lighter visual so the app doesn't feel like it's stuttering the moment
 * it opens.
 *
 * Signals used (all optional/best-effort — Capacitor's Android WebView
 * exposes most of these, but we never assume any one of them is present):
 *  - navigator.deviceMemory      -> approx RAM in GB (Chromium/WebView only)
 *  - navigator.hardwareConcurrency -> logical CPU cores
 *  - matchMedia(prefers-reduced-motion) -> OS-level "reduce motion" setting
 *  - navigator.connection.saveData / effectiveType -> data saver / slow network,
 *    which usually correlates with an older or budget device too
 *
 * We deliberately bias towards NOT flagging a device as low-end unless a
 * signal clearly indicates it, so we never needlessly downgrade the
 * experience for the average phone.
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
  } catch {
    // matchMedia not available/throws — ignore, not a strong enough signal to assume low-end
  }

  const deviceMemory = (navigator as any).deviceMemory as number | undefined;
  if (typeof deviceMemory === 'number' && deviceMemory > 0 && deviceMemory <= 2) {
    return true;
  }

  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && cores > 0 && cores <= 2) {
    return true;
  }

  const connection = (navigator as any).connection;
  if (connection?.saveData === true) {
    return true;
  }
  if (
    typeof connection?.effectiveType === 'string' &&
    (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
  ) {
    return true;
  }

  return false;
}

/**
 * React hook wrapper. `forceLite` lets a caller fold in the app's own
 * user-controlled settings (Battery Saver / Reduced Motion toggles) so a
 * single source of truth decides whether to render the lightweight variant.
 */
export function useDevicePerformance(forceLite: boolean = false): { isLowEnd: boolean } {
  const isLowEnd = useMemo(() => forceLite || isLowEndDevice(), [forceLite]);
  return { isLowEnd };
}
