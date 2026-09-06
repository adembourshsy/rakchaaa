// ============================================================
//  src/hooks/useAudio.ts
//  React hook interface for RAKCHA GAME's Audio Identity
// ============================================================

import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { audioManager } from '../services/audioManager';

/**
 * Hook for playing RAKCHA sound effects.
 */
export function useAudio() {
  const { soundEnabled } = useApp();

  // Sync settings whenever they change
  useEffect(() => {
    audioManager.setSfxEnabled(soundEnabled);
  }, [soundEnabled]);

  const playCardPick = useCallback(() => {
    audioManager.playCardPick();
  }, []);

  const playCardPlace = useCallback(() => {
    audioManager.playCardPlace();
  }, []);

  const playCardFlip = useCallback(() => {
    audioManager.playCardPick();
  }, []);

  const playCardMovement = useCallback(() => {
    audioManager.playCardPlace();
  }, []);

  const playSonicSignature = useCallback(() => {
    audioManager.playSonicSignature();
  }, []);

  return {
    playCardPick,
    playCardPlace,
    playCardFlip,
    playCardMovement,
    playSonicSignature,
  };
}

/**
 * Application-wide centralized audio lifecycle hook.
 */
export function useAppAudioLifecycle() {
  const { soundEnabled } = useApp();

  // Sync settings with audioManager
  useEffect(() => {
    audioManager.setSfxEnabled(soundEnabled);
  }, [soundEnabled]);
}
