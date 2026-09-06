import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const MobileContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    isRTL,
    joinedRoom,
    activeView,
    activeTab,
    unoAiConfig,
    chessAiConfig,
  } = useApp();

  const isInProtectedSession =
    joinedRoom != null &&
    (joinedRoom.status === 'waiting' || joinedRoom.status === 'in_progress');

  const isGameActive =
    activeView === 'game' ||
    joinedRoom?.status === 'in_progress' ||
    Boolean(unoAiConfig?.isAiMode) ||
    Boolean(chessAiConfig?.isAiMode);

  // `.app-scroll` (see ref below) is the app's single scroll container and
  // is shared across every screen -- it is never unmounted when navigating
  // between Home and a game. Any leftover horizontal/vertical scroll offset
  // left on it by a game screen (e.g. an internal element auto-scrolling
  // into view) would otherwise still be applied the moment Home renders in
  // the same node, producing a shifted/clipped layout with no game code
  // actually being "broken" -- it's stale scroll state on a reused element.
  //
  // We snap this shared container back to its origin exactly on the
  // game -> non-game transition, which restores Home to a clean state
  // regardless of what any individual game screen did internally, without
  // masking anything with a blanket `overflow-x: hidden` rule.
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasGameActiveRef = useRef(isGameActive);

  useEffect(() => {
    if (wasGameActiveRef.current && !isGameActive) {
      const node = scrollContainerRef.current;
      if (node) {
        node.scrollLeft = 0;
        node.scrollTop = 0;
      }
    }
    wasGameActiveRef.current = isGameActive;
  }, [isGameActive]);

  const isNavDockVisible =
    !isInProtectedSession &&
    !isGameActive &&
    activeView !== 'waiting_room' &&
    activeView !== 'profile' &&
    (activeTab === 'home' || activeTab === 'rooms' || activeTab === 'settings');

  return (
    // Fixed-height app shell: exactly one scrollable region lives inside it
    // (the content area below). This is what makes touch scrolling reliable
    // inside the Android WebView, where <body> cannot scroll.
    <div
      className={`h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden transition-colors duration-300 font-sans flex flex-col bg-gradient-to-br from-[#F4F7FC] via-[#EBF2FC] to-[#F0F5FD] dark:from-[#0A0E17] dark:via-[#0F1626] dark:to-[#070A12] text-[#0F172A] dark:text-[#F8FAFC] relative`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative crisp ambient background lighting — rendered ONLY outside games to save GPU compositing overhead during game sessions & orientation changes */}
      {!isGameActive && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none [will-change:transform] [transform:translateZ(0)]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none [will-change:transform] [transform:translateZ(0)]" />
        </>
      )}

      {/* The single scroll container of the app.
          - min-h-0 lets flex actually shrink it so overflow-y works
          - app-scroll adds momentum touch scrolling + overscroll containment
          - bottom padding clears the floating dock when shown, or safe-area bottom when in-game */}
      <div
        ref={scrollContainerRef}
        className={`app-scroll flex-1 min-h-0 w-full max-w-full relative flex flex-col ${
          isGameActive
            ? 'p-0 m-0 overflow-hidden'
            : `overflow-y-auto overflow-x-hidden px-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] ${
                isNavDockVisible
                  ? 'pb-[calc(max(1rem,env(safe-area-inset-bottom))+5rem)]'
                  : 'pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.5rem))]'
              }`
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col h-full min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

