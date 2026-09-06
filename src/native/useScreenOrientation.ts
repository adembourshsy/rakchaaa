// ============================================================
//  src/native/useScreenOrientation.ts
//  Manages screen orientation:
//  - All games (UNO, Chess, and everything else): Force & lock to Portrait
//    orientation during gameplay. No game in this app uses landscape.
// ============================================================

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

export function useScreenOrientation(): void {
  const targetOrientation: 'portrait' = 'portrait';
  const currentOrientationRef = useRef<'landscape' | 'portrait' | null>(null);

  useEffect(() => {
    // Only fire lock request if target orientation actually changed
    if (currentOrientationRef.current === targetOrientation) return;

    let isMounted = true;

    const applyOrientation = async () => {
      try {
        currentOrientationRef.current = targetOrientation;

        if (Capacitor.isNativePlatform()) {
          await ScreenOrientation.lock({ orientation: targetOrientation }).catch(() => {});
        } else if (typeof window !== 'undefined' && window.screen?.orientation) {
          try {
            await (window.screen.orientation as any).lock?.('portrait').catch(() => {
              window.screen.orientation.unlock?.();
            });
          } catch {
            try {
              window.screen.orientation.unlock?.();
            } catch {}
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[ScreenOrientation] Error applying orientation mode:', err);
        }
      }
    };

    void applyOrientation();

    return () => {
      isMounted = false;
    };
  }, [targetOrientation]);
}
