// ============================================================
//  src/native/useAndroidBackButton.ts
//  Maps the Android hardware/gesture back button onto the app's existing
//  in-app navigation (sub-views -> main, non-home tab -> home), and only
//  exits the app from the home screen. No visual changes.
// ============================================================

import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../context/AppContext';

export function useAndroidBackButton(): void {
  const { activeView, setActiveView, activeTab, setActiveTab, closeActiveModal, closeViewedUserProfile, joinedRoom, requestLeaveRoom, unoAiConfig, chessAiConfig, language } = useApp();

  const isInProtectedSession =
    (joinedRoom != null && (joinedRoom.status === 'waiting' || joinedRoom.status === 'in_progress')) ||
    unoAiConfig.isAiMode ||
    chessAiConfig.isAiMode;

  const handleBackAction = useCallback((): boolean => {
    // Priority 1: Close active modal or sheet if open
    const modalClosed = closeActiveModal();
    if (modalClosed) return true;

    // Priority 2: Profile view
    if (activeView === 'profile') {
      closeViewedUserProfile();
      return true;
    }

    // Settings subviews (privacy, help, about)
    if (activeView === 'settings_privacy' || activeView === 'settings_help' || activeView === 'settings_about') {
      if (isInProtectedSession) {
        setActiveView(unoAiConfig.isAiMode || chessAiConfig.isAiMode || joinedRoom?.status === 'in_progress' ? 'game' : 'waiting_room');
      } else {
        setActiveView('main');
        setActiveTab('settings');
      }
      return true;
    }

    // Active Game or Waiting Room
    if (activeView === 'game' || activeView === 'waiting_room') {
      if (joinedRoom || unoAiConfig.isAiMode || chessAiConfig.isAiMode) {
        requestLeaveRoom();
      } else {
        setActiveView('main');
      }
      return true;
    }

    // Other non-main active views
    if (activeView !== 'main') {
      if (isInProtectedSession) {
        setActiveView(unoAiConfig.isAiMode || chessAiConfig.isAiMode || joinedRoom?.status === 'in_progress' ? 'game' : 'waiting_room');
      } else {
        setActiveView('main');
      }
      return true;
    }

    // Priority 3: Active tab is settings or non-home tab
    if (activeTab === 'settings') {
      if (isInProtectedSession) {
        setActiveView(unoAiConfig.isAiMode || chessAiConfig.isAiMode || joinedRoom?.status === 'in_progress' ? 'game' : 'waiting_room');
      } else {
        setActiveTab('home');
      }
      return true;
    }
    if (activeTab !== 'home') {
      if (isInProtectedSession) {
        setActiveView(unoAiConfig.isAiMode || chessAiConfig.isAiMode || joinedRoom?.status === 'in_progress' ? 'game' : 'waiting_room');
      } else {
        setActiveTab('home');
      }
      return true;
    }

    // Priority 4: Protected session main fallback -> prompt confirmation before leaving
    if (isInProtectedSession) {
      requestLeaveRoom();
      return true;
    }

    return false;
  }, [activeView, activeTab, setActiveView, setActiveTab, closeActiveModal, closeViewedUserProfile, joinedRoom, isInProtectedSession, requestLeaveRoom, unoAiConfig.isAiMode, chessAiConfig.isAiMode]);

  // ---- Double back press to exit from home ----
  const lastBackPressRef = useRef<number>(0);
  const EXIT_WINDOW_MS = 2000;

  const showExitHint = useCallback(() => {
    const message =
      language === 'ar'
        ? 'اضغط مرة أخرى للخروج'
        : language === 'fr'
          ? 'Appuyez encore pour quitter'
          : 'Press back again to exit';

    if (typeof document === 'undefined') return;
    const existing = document.getElementById('rakcha-exit-hint');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'rakcha-exit-hint';
    el.textContent = message;
    el.setAttribute(
      'style',
      [
        'position:fixed',
        'left:50%',
        'transform:translateX(-50%)',
        'bottom:calc(env(safe-area-inset-bottom) + 88px)',
        'z-index:2147483647',
        'padding:10px 18px',
        'border-radius:999px',
        'background:rgba(0,0,0,0.82)',
        'color:#fff',
        'font-size:14px',
        'font-weight:600',
        'pointer-events:none',
        'max-width:80vw',
        'text-align:center',
      ].join(';')
    );
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), EXIT_WINDOW_MS);
  }, [language]);

  /** Returns true when the app may actually exit (second press in a row). */
  const confirmExit = useCallback((): boolean => {
    const now = Date.now();
    if (now - lastBackPressRef.current < EXIT_WINDOW_MS) {
      lastBackPressRef.current = 0;
      return true;
    }
    lastBackPressRef.current = now;
    showExitHint();
    return false;
  }, [showExitHint]);

  const confirmExitRef = useRef(confirmExit);
  useEffect(() => {
    confirmExitRef.current = confirmExit;
  }, [confirmExit]);

  const handleBackActionRef = useRef(handleBackAction);
  useEffect(() => {
    handleBackActionRef.current = handleBackAction;
  }, [handleBackAction]);

  // Native Android Back Button
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    let isMounted = true;
    let listenerHandle: any = null;

    import('@capacitor/app').then(({ App }) => {
      if (!isMounted) return;
      App.addListener('backButton', () => {
        const handled = handleBackActionRef.current();
        if (!handled && confirmExitRef.current()) {
          App.exitApp();
        }
      }).then((handle) => {
        if (isMounted) {
          listenerHandle = handle;
        } else {
          handle.remove();
        }
      });
    });

    return () => {
      isMounted = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  // Web Browser / PWA Popstate (System Back Button on Web)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (activeView !== 'main' || activeTab !== 'home') {
      window.history.pushState({ page: activeView }, '');
    }

    const onPopState = (e: PopStateEvent) => {
      e.preventDefault();
      const handled = handleBackActionRef.current();
      if (handled) {
        window.history.pushState({ page: activeView }, '');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [activeView, activeTab]);
}
