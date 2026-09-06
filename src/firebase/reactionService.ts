// ============================================================
//  src/firebase/reactionService.ts
//  RAKCHA GAME — Real-time Multiplayer Emoji Reactions Synchronization
//  Broadcasts emoji reactions to all players in the room with sound triggers.
// ============================================================

import { auth, db } from './config';
import { RoomError, toRoomError, type RoomErrorCode } from './roomsService';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { EmojiReaction } from '../types';

const HISTORY_LIMIT = 20;

export async function sendReaction(
  roomCode: string,
  sender: { uid: string; name: string; avatarUrl: string },
  emoji: string,
  soundId?: string | null
): Promise<void> {
  const current = auth.currentUser;
  if (!current) throw new RoomError('NOT_AUTHENTICATED', 'You must be signed in to send reactions.');
  if (current.uid !== sender.uid) {
    throw new RoomError('UID_MISMATCH', `Reaction sender "${sender.uid}" != auth uid "${current.uid}".`);
  }

  try {
    await addDoc(collection(db, 'antifada_rooms', roomCode, 'reactions'), {
      senderId: current.uid,
      senderName: sender.name,
      senderAvatar: sender.avatarUrl,
      emoji,
      soundId: soundId || null,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });

    try {
      await updateDoc(doc(db, 'antifada_rooms', roomCode), {
        lastActivityAt: serverTimestamp(),
      });
    } catch {
      // non-blocking
    }
  } catch (err) {
    const error = toRoomError(err, 'UNKNOWN');
    console.error('[rakcha] sendReaction error:', roomCode, current.uid, error.code, error.message);
    throw error;
  }
}

/**
 * Real-time listener for emoji reactions in a room.
 * Invokes callback with newly posted reactions in chronological order.
 */
export function listenToReactions(
  roomCode: string,
  callback: (reactions: EmojiReaction[]) => void,
  onError?: (code: RoomErrorCode, message: string) => void
) {
  const q = query(
    collection(db, 'antifada_rooms', roomCode, 'reactions'),
    orderBy('createdAt', 'desc'),
    fsLimit(HISTORY_LIMIT)
  );

  return onSnapshot(
    q,
    (snap) => {
      const reactions: EmojiReaction[] = snap.docs.map((d) => {
        const data = d.data();
        let createdAt = new Date().toISOString();
        let createdAtMs = data.createdAtMs || Date.now();
        if (data.createdAt) {
          if (typeof (data.createdAt as any)?.toDate === 'function') {
            const dt = (data.createdAt as any).toDate();
            createdAt = dt.toISOString();
            createdAtMs = dt.getTime();
          } else if (data.createdAt instanceof Timestamp) {
            const dt = data.createdAt.toDate();
            createdAt = dt.toISOString();
            createdAtMs = dt.getTime();
          } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
          }
        }
        return {
          id: d.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          emoji: data.emoji,
          soundId: data.soundId || null,
          createdAt,
          createdAtMs,
        };
      });

      // Reverse so oldest is first for proper chronological sequence
      callback(reactions.reverse());
    },
    (err) => {
      const error = toRoomError(err, 'UNKNOWN');
      console.warn('[rakcha] Reaction listener error:', roomCode, error.code, error.message);
      onError?.(error.code === 'PERMISSION_DENIED' ? 'PERMISSION_DENIED' : error.code, error.message);
    }
  );
}
