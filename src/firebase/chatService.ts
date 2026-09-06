// ============================================================
//  src/firebase/chatService.ts
//  Real-time Room Chat. The legacy project didn't have player-to-player
//  chat (only one-way system "notices" in rooms-service.js), so this is
//  new — built on the same collection-per-room + onSnapshot pattern as
//  roomsService.ts, so it fits the rest of the Firebase layer.
//
//  rooms/{roomCode}/messages/{messageId}
//    senderId, senderName, senderAvatar, text, createdAt
//
//  Access control (see firestore.rules): only players currently listed
//  in rooms/{roomCode}.players may read or write this subcollection —
//  enforced server-side, not just hidden in the UI.
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string; // ISO string, normalized from the Firestore Timestamp
}

const MAX_MESSAGE_LENGTH = 500;
const HISTORY_LIMIT = 100;

/** Strips characters that would let a message inject markup if it's ever rendered as HTML instead of text. */
function sanitizeText(raw: string): string {
  return raw.replace(/[<>]/g, '').trim();
}

export async function sendMessage(
  roomCode: string,
  sender: { uid: string; name: string; avatarUrl: string },
  text: string
): Promise<void> {
  const clean = sanitizeText(text).slice(0, MAX_MESSAGE_LENGTH);
  if (!clean) return;

  const current = auth.currentUser;
  if (!current) throw new RoomError('NOT_AUTHENTICATED', 'You must be signed in to chat.');
  if (current.uid !== sender.uid) {
    throw new RoomError('UID_MISMATCH', `Chat sender "${sender.uid}" != auth uid "${current.uid}".`);
  }

  try {
    await addDoc(collection(db, 'antifada_rooms', roomCode, 'messages'), {
      senderId: current.uid,
      senderName: sender.name,
      senderAvatar: sender.avatarUrl,
      text: clean,
      createdAt: serverTimestamp(),
    });
    try {
      await updateDoc(doc(db, 'antifada_rooms', roomCode), {
        lastActivityAt: serverTimestamp(),
      });
    } catch {
      // non-blocking
    }
  } catch (err) {
    const chatErr = toRoomError(err, 'UNKNOWN');
    // eslint-disable-next-line no-console
    console.error('[rakcha] Chat sendMessage error:', roomCode, current.uid, chatErr.code, chatErr.message);
    throw chatErr.code === 'PERMISSION_DENIED'
      ? new RoomError('PERMISSION_DENIED', 'CHAT_PERMISSION_DENIED: ' + chatErr.message, err)
      : chatErr;
  }
}

/** Real-time listener for a room's chat, newest last. Returns an unsubscribe function — always call it on leave/unmount. */
export function listenToMessages(
  roomCode: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (code: RoomErrorCode, message: string) => void
) {
  const q = query(
    collection(db, 'antifada_rooms', roomCode, 'messages'),
    orderBy('createdAt', 'asc'),
    fsLimit(HISTORY_LIMIT)
  );

  return onSnapshot(
    q,
    (snap) => {
      const messages: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data();
        let createdAt = new Date().toISOString();
        if (data.createdAt) {
          if (typeof (data.createdAt as any)?.toDate === 'function') {
            createdAt = (data.createdAt as any).toDate().toISOString();
          } else if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
          }
        }
        return {
          id: d.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          text: data.text,
          createdAt,
        };
      });
      callback(messages);
    },
    (err) => {
      const chatErr = toRoomError(err, 'UNKNOWN');
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Chat listener error:', roomCode, chatErr.code, chatErr.message);
      onError?.(chatErr.code === 'PERMISSION_DENIED' ? 'PERMISSION_DENIED' : chatErr.code, chatErr.message);
    }
  );
}
