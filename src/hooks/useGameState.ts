import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { stripUndefined } from '../firebase/firestoreUtils';

export function useGameState<T>(roomCode: string, initialState: T) {
  const initialStateRef = useRef<T>(initialState);
  const [gameState, setLocalGameState] = useState<T>(initialState);
  const stateRef = useRef<T>(initialState);
  const isInitializedRef = useRef<boolean>(false);
  const docExistsRef = useRef<boolean>(false);
  const prevRoomCodeRef = useRef<string>(roomCode);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!roomCode || !auth.currentUser) {
      if (prevRoomCodeRef.current !== roomCode) {
        prevRoomCodeRef.current = roomCode;
        isInitializedRef.current = false;
        docExistsRef.current = false;
        setLocalGameState(initialStateRef.current);
        stateRef.current = initialStateRef.current;
      }
      return;
    }
    prevRoomCodeRef.current = roomCode;

    // Reset initialization flags when switching room codes
    isInitializedRef.current = false;
    docExistsRef.current = false;

    const docRef = doc(db, 'antifada_games', roomCode);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!auth.currentUser) return;
        if (snap.exists()) {
          const data = snap.data() as T;
          setLocalGameState(data);
          stateRef.current = data;
          docExistsRef.current = true;
          isInitializedRef.current = true;
        } else {
          // Received authoritative snapshot confirming doc does not exist yet
          docExistsRef.current = false;
          isInitializedRef.current = true;
        }
      },
      (err) => {
        if (!auth.currentUser) return;
        if (err.code === 'permission-denied') {
          isInitializedRef.current = true;
          return;
        }
        // eslint-disable-next-line no-console
        console.warn('[rakcha] useGameState snapshot error:', roomCode, err.code, err.message);
      }
    );

    return () => {
      unsubscribe();
      isInitializedRef.current = false;
      docExistsRef.current = false;
    };
  }, [roomCode, auth.currentUser?.uid]);

  // Provide a function to update the global state (this acts like setGameState)
  const setGameState = useCallback(
    async (update: Partial<T> | ((prev: T) => Partial<T> | T)) => {
      if (!roomCode) {
        const prev = stateRef.current ?? initialStateRef.current;
        const nextComputedState: T = typeof update === 'function' ? (update as any)(prev) : { ...prev, ...update };
        stateRef.current = nextComputedState;
        setLocalGameState(nextComputedState);
        return;
      }
      const docRef = doc(db, 'antifada_games', roomCode);

      // Path A & B: If doc is not confirmed to exist or snapshot hasn't resolved yet,
      // use a transactional read-and-merge to safely initialize or merge without overwriting
      if (!isInitializedRef.current || !docExistsRef.current) {
        try {
          await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(docRef);
            if (snap.exists()) {
              // Remote authoritative game document exists — merge onto remote state!
              const remoteData = snap.data() as T;
              const updated = typeof update === 'function' ? (update as any)(remoteData) : { ...remoteData, ...update };
              const cleanState = stripUndefined(updated);
              transaction.set(docRef, cleanState);
              stateRef.current = cleanState as T;
              setLocalGameState(cleanState as T);
              docExistsRef.current = true;
              isInitializedRef.current = true;
            } else {
              // Game document does not exist yet — create safely from current local / initial state
              const baseData = stateRef.current ?? initialStateRef.current;
              const updated = typeof update === 'function' ? (update as any)(baseData) : { ...baseData, ...update };
              const cleanState = stripUndefined(updated);
              transaction.set(docRef, cleanState);
              stateRef.current = cleanState as T;
              setLocalGameState(cleanState as T);
              docExistsRef.current = true;
              isInitializedRef.current = true;
            }
          });
        } catch (txnErr) {
          // If transaction fails (e.g. permission race before room document index is ready),
          // update local optimistic state so UI does not stall
          const prev = stateRef.current ?? initialStateRef.current;
          const nextComputedState: T = typeof update === 'function' ? (update as any)(prev) : { ...prev, ...update };
          stateRef.current = nextComputedState;
          setLocalGameState(nextComputedState);
          // eslint-disable-next-line no-console
          console.warn('[rakcha] Transactional game state init notice:', txnErr);
        }
        return;
      }

      // Path C: Game doc exists and snapshot is initialized — standard transaction to avoid concurrent state overwrites
      try {
        await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(docRef);
          if (snap.exists()) {
            const remoteData = snap.data() as T;
            const updated = typeof update === 'function' ? (update as any)(remoteData) : { ...remoteData, ...update };
            const cleanState = stripUndefined(updated);
            transaction.set(docRef, cleanState);
            // Rely on the active onSnapshot listener in Path C to authoritatively sync
            // the state, preventing slow transaction resolution race conditions from
            // overwriting newer game moves.
          } else {
            const prev = stateRef.current ?? initialStateRef.current;
            const nextComputedState = typeof update === 'function' ? (update as any)(prev) : { ...prev, ...update };
            const cleanState = stripUndefined(nextComputedState);
            transaction.set(docRef, cleanState);
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[rakcha] useGameState Path C transaction error:', err);
      }
    },
    [roomCode]
  );

  return [gameState, setGameState] as const;
}
