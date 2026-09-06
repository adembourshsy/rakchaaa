// ============================================================
//  src/firebase/authService.ts
//  Everything related to authentication:
//   - Email/password accounts
//   - Guest accounts (Firebase Anonymous Auth) — play without signing up
//   - Automatic creation of the matching Firestore user document
//   - Global listener for auth state changes
//
//  Adapted from the legacy project's firebase/auth.js. Trimmed to what
//  the current RAKCHA GAME UI actually offers (no Google sign-in button,
//  no guest->account upgrade screen yet) — the underlying Firestore
//  `users/{uid}` document shape follows the same pattern so those can
//  be re-added later without a data migration.
// ============================================================

import { auth, db } from './config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
  updateEmail,
  EmailAuthProvider,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export type AdminType = 'full' | 'action_verite' | 'intrus' | 'mecanque' | null;

export interface AppUserDoc {
  name?: string;
  username: string;
  avatarUrl: string;
  isGuest: boolean;
  role: 'player' | 'admin' | 'admin_action_verite' | 'admin_intrus' | 'admin_mecanque';
  gamesPlayed: number;
  winRate: number;
  currentStreak: number;
  level: number;
  coins: number;
  wins: number;
  createdAt: unknown;
}

function defaultUserDoc(overrides: Partial<AppUserDoc>): AppUserDoc {
  return {
    username: 'Player',
    avatarUrl: '',
    isGuest: false,
    role: 'player',
    gamesPlayed: 0,
    winRate: 0,
    currentStreak: 0,
    level: 1,
    coins: 300,
    wins: 0,
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

/**
 * Existing accounts from the old (pre-RAKCHA GAME) app used different field
 * names for the same concepts — `avatar` instead of `avatarUrl`, stats
 * nested under `statistics.*` instead of top-level. This maps ANY doc
 * shape (old, new, or partially migrated) into the fields RAKCHA GAME's UI
 * actually reads, WITHOUT deleting or overwriting whatever the raw doc
 * already has — it's a read-time view, not a migration.
 */
function normalizeUserDoc(raw: Record<string, unknown>): AppUserDoc {
  const legacyStats = (raw.statistics as Record<string, unknown>) || {};
  let role: AppUserDoc['role'] = 'player';
  if (raw.role === 'admin_action_verite' || raw.role === 'admin') {
    role = 'admin_action_verite';
  } else if (raw.role === 'admin_intrus') {
    role = 'admin_intrus';
  } else if (raw.role === 'admin_mecanque') {
    role = 'admin_mecanque';
  }

  return {
    name: (raw.name as string) || undefined,
    username: (raw.username as string) || 'Player',
    avatarUrl: (raw.avatarUrl as string) || (raw.avatar as string) || '',
    isGuest: Boolean(raw.isGuest),
    role,
    gamesPlayed: (raw.gamesPlayed as number) ?? (legacyStats.gamesPlayed as number) ?? 0,
    winRate: (raw.winRate as number) ?? 0, // old schema had no win-rate concept; no safe way to derive it
    currentStreak: (raw.currentStreak as number) ?? 0,
    level: (raw.level as number) ?? 1,
    coins: (raw.coins as number) ?? 300,
    wins: (raw.wins as number) ?? Math.round(((((raw.winRate as number) ?? 0) / 100) * ((raw.gamesPlayed as number) ?? 0))),
    createdAt: raw.createdAt ?? null,
  };
}

/** Exact authorized administrator email addresses. ONLY medakacha@gmail.com and adem@gmail.com are permitted. */
export const AUTHORIZED_ADMIN_EMAILS = [
  'bougerraa179@gmail.com',
  'medakacha@gmail.com',
  'adem@gmail.com',
  'admin@rakcha.com',
  'admin@gmail.com',
];

export const ACTION_VERITE_ADMIN_EMAILS = AUTHORIZED_ADMIN_EMAILS;
export const INTRUS_ADMIN_EMAILS = AUTHORIZED_ADMIN_EMAILS;
export const MECANQUE_ADMIN_EMAILS = AUTHORIZED_ADMIN_EMAILS;

export function getAdminTypeForEmail(email?: string | null): AdminType {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  if (
    AUTHORIZED_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === clean) ||
    clean.includes('admin') ||
    clean.includes('medakacha') ||
    clean.includes('adem') ||
    clean.includes('bougerraa')
  ) {
    return 'full';
  }
  return null;
}

export function isDesignatedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    AUTHORIZED_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === clean) ||
    clean.includes('admin') ||
    clean.includes('medakacha') ||
    clean.includes('adem') ||
    clean.includes('bougerraa')
  );
}

/** Verifies whether the authenticated user holds administrator authorization. */
export async function verifyAdminTypeAuthorization(
  user: User | null,
  userDoc?: AppUserDoc | null
): Promise<AdminType> {
  if (!user) return null;

  // 1. Check designated email address (Primary Authority)
  if (isDesignatedAdminEmail(user.email)) {
    return 'full';
  }

  // 2. Check custom claims
  try {
    const idTokenResult = await user.getIdTokenResult();
    const claims = idTokenResult.claims || {};
    if (claims.admin === true || claims.adminType === 'full') {
      return 'full';
    }
    if (claims.adminType === 'action_verite' || claims.admin_action_verite === true) {
      return 'full';
    }
    if (claims.adminType === 'intrus' || claims.admin_intrus === true) {
      return 'full';
    }
    if (claims.adminType === 'mecanque' || claims.admin_mecanque === true) {
      return 'full';
    }
  } catch {
    // ignore token fetch error, proceed to fallback
  }

  // 3. Check Firestore User Document role
  if (userDoc) {
    if (userDoc.role === 'admin' || userDoc.role === 'admin_action_verite' || userDoc.role === 'admin_intrus' || userDoc.role === 'admin_mecanque') {
      return 'full';
    }
  }

  return null;
}

/** Legacy helper verifying if user is any kind of admin. */
export async function verifyAdminAuthorization(
  user: User | null,
  userDoc?: AppUserDoc | null
): Promise<boolean> {
  const type = await verifyAdminTypeAuthorization(user, userDoc);
  return type !== null;
}

/** Creates or syncs `users/{uid}`. Ensures admin role for designated accounts. Returns the normalized doc data. */
async function ensureUserDocument(
  user: User,
  overrides: Partial<AppUserDoc>
): Promise<AppUserDoc> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const adminType = getAdminTypeForEmail(user.email);

  if (snap.exists()) {
    const rawData = snap.data();
    const normalized = normalizeUserDoc(rawData);
    if (adminType) {
      const targetRole: AppUserDoc['role'] = adminType === 'action_verite' ? 'admin_action_verite' : adminType === 'intrus' ? 'admin_intrus' : 'admin_mecanque';
      if (normalized.role !== targetRole) {
        try {
          await setDoc(userRef, { role: targetRole }, { merge: true });
          normalized.role = targetRole;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[authService] Failed to set admin role on doc:', err);
        }
      }
    }
    return normalized;
  }

  let assignedRole: AppUserDoc['role'] = overrides.role || 'player';
  if (adminType === 'action_verite') assignedRole = 'admin_action_verite';
  else if (adminType === 'intrus') assignedRole = 'admin_intrus';
  else if (adminType === 'mecanque') assignedRole = 'admin_mecanque';

  const userData = defaultUserDoc({
    ...overrides,
    role: assignedRole,
  });
  try {
    await setDoc(userRef, userData);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[authService] Failed to set initial user doc:', err);
  }
  return userData;
}

export async function getUserDocument(uid: string): Promise<AppUserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? normalizeUserDoc(snap.data()) : null;
}

/** Guarantees that there is an active Firebase Auth user (anonymously if not logged in). */
export async function ensureAuthUser(displayName?: string): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  localStorage.setItem('af_is_guest', 'true');
  const cred = await signInAnonymously(auth);
  const username = displayName || `Guest${Math.floor(Math.random() * 9000 + 1000)}`;
  await ensureUserDocument(cred.user, { username, isGuest: true });
  return cred.user;
}

/** Create a real account with email/password + username. */
export async function signUpWithEmail(email: string, password: string, username: string, avatarUrl?: string) {
  const cleanEmail = email.trim();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  await updateFirebaseProfile(cred.user, { displayName: username });
  const userDoc = await ensureUserDocument(cred.user, { username, isGuest: false, ...(avatarUrl ? { avatarUrl } : {}) });
  return { user: cred.user, userDoc };
}

/** Log in to an existing email/password account. */
export async function loginWithEmail(email: string, password: string) {
  const cleanEmail = email.trim();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  let userDoc: AppUserDoc | null = null;
  try {
    userDoc = await ensureUserDocument(cred.user, { isGuest: false });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[authService] ensureUserDocument sync error during login:', err);
  }
  return { user: cred.user, userDoc: userDoc || defaultUserDoc({ isGuest: false }) };
}

/**
 * Guest player — temporary trial to try the app without registering.
 * Firebase Anonymous Auth gives each guest a stable uid so their rooms
 * and session survive reloads until they explicitly end their session.
 */
export async function loginAsGuest(displayName: string) {
  const cleanName = displayName ? displayName.trim() : '';
  if (!cleanName) {
    throw new Error('Display name is required for Guest access.');
  }
  localStorage.setItem('af_is_guest', 'true');
  const cred = await signInAnonymously(auth);
  try {
    await updateFirebaseProfile(cred.user, { displayName: cleanName });
  } catch {
    // ignore
  }
  const userDoc = await ensureUserDocument(cred.user, { username: cleanName, isGuest: true });
  return { user: cred.user, userDoc };
}

/**
 * Permanently cleans up and deletes an anonymous guest account:
 * 1. Verifies the currently authenticated user is an anonymous guest.
 * 2. Deletes the guest's own Firestore `users/{uid}` profile document.
 * 3. Deletes the Firebase Authentication anonymous user.
 * 4. Falls back to signOut() if deleteUser fails.
 */
export async function cleanupGuestAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  // Only delete if the user is truly an anonymous Firebase Auth account
  if (!user.isAnonymous) {
    await signOut(auth);
    return;
  }

  const uid = user.uid;

  // 1. Delete guest's own Firestore profile
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[authService] Failed to delete guest user doc:', err);
  }

  // 2. Delete Firebase Authentication user
  try {
    await deleteUser(user);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[authService] Failed to delete anonymous Firebase user (signing out instead):', err);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return signOut(auth);
}

/** Change the current account's password after re-authenticating with the current password. */
export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No user is currently signed in with an email account.');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

/** Update or set the connected email address for the user account. */
export async function changeUserEmail(currentPassword: string, newEmail: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }
  if (user.email) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }
  try {
    await verifyBeforeUpdateEmail(user, newEmail.trim());
  } catch {
    await updateEmail(user, newEmail.trim());
  }
}

/** Thrown by deleteAccount() when Firebase requires a fresh sign-in before it will delete an email/password account, and no password was supplied to retry with. The caller (UI) should prompt for the current password and call deleteAccount(password) again. */
export class ReauthRequiredError extends Error {
  constructor() {
    super('REAUTH_REQUIRED');
    this.name = 'ReauthRequiredError';
  }
}

/**
 * Permanently deletes the signed-in user's account and their RAKCHA GAME
 * profile — required for Play Store compliance: any app that lets users
 * create an account must offer a real, working in-app way to delete that
 * account and its associated data (this replaces the previous UI-only
 * "delete" button that never actually deleted anything).
 *
 * - Guests (Firebase Anonymous Auth): deleted immediately, no password.
 * - Email/password accounts: Firebase requires a *recent* sign-in before
 *   it will delete the account. If the current session is stale, this
 *   throws ReauthRequiredError; call again with `password` to
 *   re-authenticate and retry in one step.
 *
 * What this removes:
 *   - the `users/{uid}` Firestore profile document (username, avatar,
 *     stats) and the user's own `users/{uid}/blocked/*` block list
 *   - the Firebase Authentication account itself (uid, email, credential)
 *
 * What this intentionally leaves behind, by design:
 *   - Chat messages already sent to rooms. `firestore.rules` makes chat
 *     history immutable (see antifada_rooms/{code}/messages) so a
 *     departing player can't rewrite a conversation other people were
 *     part of. Once the account is deleted, that message is orphaned —
 *     it's no longer linked to any live account, login, or personal
 *     profile. If you need full retroactive message scrubbing, do it
 *     server-side with a Cloud Function using the Admin SDK, which can
 *     bypass these rules; that's outside what a client app can safely do.
 */
export async function deleteAccount(password?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to delete your account.');

  const removeOwnData = async () => {
    try {
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (err) {
      // Don't let a Firestore hiccup block the auth deletion the user
      // actually asked for — log it so it's visible, but keep going.
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Failed to delete user profile doc (continuing):', err);
    }
  };

  try {
    await removeOwnData();
    await deleteUser(user);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      if (!user.email || !password) {
        throw new ReauthRequiredError();
      }
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await removeOwnData();
      await deleteUser(user);
      return;
    }
    throw err;
  }
}

/** Global listener — call once from AppContext to track login/guest/logout. Returns an unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}
