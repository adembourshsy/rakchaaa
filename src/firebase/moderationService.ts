// ============================================================
//  src/firebase/moderationService.ts
//  Real, persisted user safety controls — added to close a Play Store
//  compliance gap: RAKCHA GAME has live, unmoderated player-to-player
//  chat (see chatService.ts), so Google Play's user-generated-content
//  policy expects a REAL way for a player to block someone and report
//  abuse, not just a local UI toggle.
//
//  Block list:  users/{uid}/blocked/{blockedUid}   (private subcollection,
//               only the owner can read/write it — see firestore.rules)
//  Reports:     reports/{reportId}                 (write-once by the
//               reporter, only readable by an admin account — moderation
//               happens by you reviewing this collection, same pattern as
//               the existing admin-gated `cards` management)
//
//  Blocking is enforced CLIENT-SIDE by filtering chat messages from
//  blocked senders out of what's rendered (see AppContext.tsx's chat
//  listener). It does not stop a blocked user from *sending* a message
//  into the shared room (Firestore rules would need per-recipient fan-out
//  to do that, which this room-chat data model doesn't support), but it
//  does what Play's policy actually asks for: the blocking user stops
//  seeing that person's messages, in-app, immediately and persistently
//  across sessions/devices.
// ============================================================

import { auth, db } from './config';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export interface BlockedUser {
  uid: string;
  username: string;
  avatarUrl?: string;
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to do that.');
  return uid;
}

/** Block a player — hides their chat messages from you from now on, everywhere, across sessions. */
export async function blockUser(target: { uid: string; username: string; avatarUrl?: string }): Promise<void> {
  const uid = requireUid();
  if (!target.uid || target.uid === uid) return;
  await setDoc(doc(db, 'users', uid, 'blocked', target.uid), {
    username: target.username || 'Player',
    avatarUrl: target.avatarUrl || '',
    blockedAt: serverTimestamp(),
  });
}

export async function unblockUser(targetUid: string): Promise<void> {
  const uid = requireUid();
  await deleteDoc(doc(db, 'users', uid, 'blocked', targetUid));
}

/** Real-time listener for the signed-in user's own block list. Returns an unsubscribe function. */
export function listenToBlockedUsers(callback: (blocked: BlockedUser[]) => void): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    callback([]);
    return () => {};
  }
  const ref = collection(db, 'users', uid, 'blocked');
  return onSnapshot(
    ref,
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            uid: d.id,
            username: (data.username as string) || 'Player',
            avatarUrl: (data.avatarUrl as string) || '',
          };
        })
      );
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] listenToBlockedUsers error:', err.message);
      callback([]);
    }
  );
}

const MAX_REPORT_FIELD_LENGTH = 300;

export interface ReportInput {
  reportedUserId: string;
  reportedUsername: string;
  /** Free-text reason chosen/typed by the reporter. */
  reason: string;
  /** Optional context so you can find the offending content in Firestore. */
  roomCode?: string;
  messageId?: string;
  messageText?: string;
}

/** Files an abuse report for admin review. Never throws for the reporter's own bad input beyond basic guards — always fails loudly on network/permission errors so the UI can tell the user it didn't go through. */
export async function reportUser(input: ReportInput): Promise<void> {
  const uid = requireUid();
  if (!input.reportedUserId || input.reportedUserId === uid) {
    throw new Error('You cannot report yourself.');
  }
  await addDoc(collection(db, 'reports'), {
    reporterId: uid,
    reportedUserId: input.reportedUserId,
    reportedUsername: (input.reportedUsername || 'Player').slice(0, MAX_REPORT_FIELD_LENGTH),
    roomCode: input.roomCode || null,
    messageId: input.messageId || null,
    messageText: (input.messageText || '').slice(0, MAX_REPORT_FIELD_LENGTH),
    reason: (input.reason || 'Not specified').slice(0, MAX_REPORT_FIELD_LENGTH),
    status: 'open',
    createdAt: serverTimestamp(),
  });
}

const MAX_SUPPORT_MESSAGE_LENGTH = 1000;

export interface SupportMessageInput {
  /** 'problem' = the in-app "Report a Problem" form (bug/gameplay/sound/content). 'contact' = the free-form "Contact Support" form. */
  type: 'problem' | 'contact';
  /** Only meaningful for type 'problem'. */
  category?: 'bug' | 'gameplay' | 'sound' | 'content';
  message: string;
}

/**
 * Real, persisted app-support inbox — closes the same gap `reportUser` closed for
 * player reports, but for general bug reports / feedback / support questions that
 * aren't about another player (so they don't fit the `reports` collection's
 * reportedUserId-required schema). Reviewable the same way: Firestore console or an
 * admin-gated view, same pattern as `reports` and `cards`.
 */
export async function submitSupportMessage(input: SupportMessageInput): Promise<void> {
  const uid = requireUid();
  const message = (input.message || '').trim().slice(0, MAX_SUPPORT_MESSAGE_LENGTH);
  if (!message) {
    throw new Error('Message cannot be empty.');
  }
  await addDoc(collection(db, 'supportMessages'), {
    senderId: uid,
    type: input.type,
    category: input.type === 'problem' ? (input.category || 'bug') : null,
    message,
    status: 'open',
    createdAt: serverTimestamp(),
  });
}
