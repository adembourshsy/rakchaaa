// ============================================================
//  src/native/useImmersiveMode.ts
//  Manages Android fullscreen / immersive mode during active gameplay:
//  - Automatically enables true Android Immersive Fullscreen on entering ANY active game
//    (Chess, UNO, Belote, Intrus, Mecanque, Action/Truth, AI or Multiplayer).
//  - Completely hides Status Bar, Navigation Bar, Navigation buttons & Gesture handle/bar.
//  - Prevents system UI from showing during normal gameplay touches, card/piece drags, or taps.
//  - If the user intentionally swipes from the edge to invoke system navigation gestures,
//    it returns automatically to immersive fullscreen after ~1s of inactivity.
//  - Restores normal Android system UI behavior when leaving the active game.
// ============================================================

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { useApp } from '../context/AppContext';

declare global {
  interface Window {
    AndroidImmersive?: {
      setImmersiveMode: (enable: boolean) => void;
      pingInteraction: () => void;
    };
  }
}

export function useImmersiveMode(): void {
  const {
    activeView,
    joinedRoom,
    unoAiConfig,
    chessAiConfig,
  } = useApp();

  const isGameActive =
    activeView === 'game' ||
    joinedRoom?.status === 'in_progress' ||
    Boolean(unoAiConfig?.isAiMode) ||
    Boolean(chessAiConfig?.isAiMode);

  const gameTitle = (joinedRoom?.title || joinedRoom?.gameTitle || '').toLowerCase();
  const gameId = joinedRoom?.gameId || '';
  const isUnoGame =
    isGameActive &&
    (gameTitle.includes('uno') ||
      gameId === 'uno-game' ||
      Boolean(unoAiConfig?.isAiMode));



  const activeTouchesRef = useRef<number>(0);
  const lastInteractionTimeRef = useRef<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestWebFullscreen = async () => {
      if (typeof document === 'undefined' || !document.documentElement) return;
      const elem = document.documentElement as any;
      if (document.fullscreenElement) return;

      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen({ navigationUI: 'hide' });
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } catch {
        // Fullscreen request might require user activation on some browsers, ignore silently
      }
    };

    const exitWebFullscreen = async () => {
      if (typeof document === 'undefined' || !(document as any).fullscreenElement) return;
      const doc = document as any;
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      } catch {
        // Ignore exit errors
      }
    };

    const applyImmersiveMode = async () => {
      try {
        if (isGameActive) {
          // 1. Add CSS class for edge-to-edge layout & no system margins
          document.documentElement.classList.add('game-immersive-mode');
          document.body.classList.add('game-immersive-mode');

          // 2. Native Android Bridge (Direct WindowInsetsController / Sticky Immersive)
          if (typeof window !== 'undefined' && window.AndroidImmersive?.setImmersiveMode) {
            window.AndroidImmersive.setImmersiveMode(true);
          }

          // 3. Native Capacitor Status Bar
          if (Capacitor.isNativePlatform()) {
            await StatusBar.hide().catch(() => {});
            await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
          }

          // 4. Web / WebView Fullscreen API
          await requestWebFullscreen();
        } else {
          // 1. Remove CSS class
          document.documentElement.classList.remove('game-immersive-mode');
          document.body.classList.remove('game-immersive-mode');

          // 2. Native Android Bridge: Restore system UI
          if (typeof window !== 'undefined' && window.AndroidImmersive?.setImmersiveMode) {
            window.AndroidImmersive.setImmersiveMode(false);
          }

          // 3. Restore normal Android system UI behavior outside game
          if (Capacitor.isNativePlatform()) {
            await StatusBar.show().catch(() => {});
            await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
          }

          // 4. Exit web fullscreen
          await exitWebFullscreen();
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[ImmersiveMode] Error toggling system UI:', err);
        }
      }
    };

    void applyImmersiveMode();

    if (!isGameActive) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return () => {
        isMounted = false;
      };
    }

    // --- ACTIVITY & SYSTEM UI INVOCATION MONITORING ---
    const isEdgeTouch = (e: TouchEvent): boolean => {
      if (!e.touches || e.touches.length === 0) return false;
      const touch = e.touches[0];
      const margin = 24;
      const w = window.innerWidth;
      const h = window.innerHeight;
      return (
        touch.clientX <= margin ||
        touch.clientX >= w - margin ||
        touch.clientY <= margin ||
        touch.clientY >= h - margin
      );
    };

    const checkAndReengageImmersive = () => {
      if (!isMounted || !isGameActive) return;

      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTimeRef.current;

      // Do NOT re-engage if user is actively touching/gesturing or interacted < 1000ms ago
      if (activeTouchesRef.current > 0 || timeSinceLastInteraction < 1000) {
        const remainingTime = Math.max(100, 1000 - timeSinceLastInteraction);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(checkAndReengageImmersive, remainingTime);
        return;
      }

      // Re-apply immersive fullscreen after ~1s of inactivity
      void applyImmersiveMode();
    };

    const scheduleInactivityCheck = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(checkAndReengageImmersive, 1000);
    };

    const handleTouchStart = (e: TouchEvent) => {
      activeTouchesRef.current = e.touches.length;
      lastInteractionTimeRef.current = Date.now();
      if (typeof window !== 'undefined' && window.AndroidImmersive?.pingInteraction) {
        window.AndroidImmersive.pingInteraction();
      }
      if (isEdgeTouch(e)) {
        // System edge gesture invoked -> schedule 1s inactivity check after touch release
        scheduleInactivityCheck();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      activeTouchesRef.current = e.touches.length;
      lastInteractionTimeRef.current = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      activeTouchesRef.current = e.touches.length;
      lastInteractionTimeRef.current = Date.now();
      scheduleInactivityCheck();
    };

    const handlePointerDown = () => {
      lastInteractionTimeRef.current = Date.now();
      if (typeof window !== 'undefined' && window.AndroidImmersive?.pingInteraction) {
        window.AndroidImmersive.pingInteraction();
      }
    };

    const handlePointerMove = () => {
      lastInteractionTimeRef.current = Date.now();
    };

    const handlePointerUp = () => {
      lastInteractionTimeRef.current = Date.now();
      scheduleInactivityCheck();
    };

    const handleFullscreenChange = () => {
      // When system navigation or edge gesture causes webview to exit fullscreen temporarily:
      if (!document.fullscreenElement && isGameActive) {
        // Wait for ~1s of inactivity before returning to immersive fullscreen
        scheduleInactivityCheck();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isGameActive) {
        void applyImmersiveMode();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGameActive, isUnoGame, activeView]);
}

