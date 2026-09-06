// ============================================================
//  src/native/useBackDismissible.ts
//  Registers a modal/sheet close handler in the global back-button stack
//  while it is open, so the Android hardware/gesture back button closes it
//  instead of exiting the app. No visual changes.
// ============================================================

import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

/**
 * @param isOpen  whether the modal is currently visible
 * @param onClose the function that closes it
 */
export function useBackDismissible(isOpen: boolean, onClose: () => void): void {
  const { registerModalCloseHandler } = useApp();

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModalCloseHandler(() => {
      onCloseRef.current?.();
    });
    return unregister;
  }, [isOpen, registerModalCloseHandler]);
}
