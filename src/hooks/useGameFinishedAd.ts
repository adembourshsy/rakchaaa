// ============================================================
//  src/hooks/useGameFinishedAd.ts
//  Shared hook: shows the preloaded interstitial ad (if ready) the
//  moment a game's own "finished" condition becomes true.
//
//  Used by every game mode's completion state instead of duplicating
//  AdMob logic in each game component:
//    - Uno:      gameState === 'winner'
//    - Mecanque: gameState.status === 'ended'
//    - Belote:   stage === 'MATCH_OVER'
//    - Intrus:   phase === 'GAME_OVER'
//
//  It never blocks or alters the existing finished/result screen or
//  navigation — those continue to render and behave exactly as before.
//  It only guarantees the ad is requested at most once per finish event.
// ============================================================

import { useEffect, useRef } from 'react';
import { showInterstitialIfReady } from '../services/adService';

/**
 * @param isFinished Whether the game/round has just finished, per the
 *                    calling game view's own state.
 */
export function useGameFinishedAd(isFinished: boolean): void {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isFinished) {
      // Reset so a subsequent "play again" -> finish cycle can show an ad again.
      hasTriggeredRef.current = false;
      return;
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    void showInterstitialIfReady();
  }, [isFinished]);
}
