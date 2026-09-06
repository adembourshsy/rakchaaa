// ============================================================
//  src/firebase/roomsService.ts
//  Real multiplayer Rooms, backed by Firestore instead of local React
//  state. Adapted from the legacy project's firebase/rooms-service.js —
//  same core patterns (numeric-free room codes via uniqueness retries,
//  transactions for join/leave so two players joining at once can't
//  corrupt the player list, host handoff on leave) but reshaped to
//  match RAKCHA GAME's existing Room / RoomPlayer / *Settings types so
//  the rest of the app (already-built UI) barely has to change.
//
//  Lives in its OWN `antifada_rooms` collection (not the legacy TAWLA
//  `rooms` collection) — different, incompatible document shape
//  (`hostId` vs `host`, `status` vs `gameStatus`, `players[].id` vs
//  `.uid`, alphanumeric vs numeric codes). Keeping them in separate
//  collections means the two can never collide or get misread as
//  each other, and the old TAWLA `rooms`/`games` docs are left
//  completely untouched as inert legacy data.
//
//  antifada_rooms/{roomCode}
//    id, code, title, gameId, gameTitle, mode, playType
//    hostId (uid), hostName, hostAvatar
//    currentPlayers, maxPlayers, isPrivate, status
//    players: RoomPlayer[]        <- membership lives here, synced live
//    mecanqueSettings / beloteSettings / intrusSettings
//    createdAt / updatedAt (server timestamps)
// ============================================================

import { auth, db } from './config';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit as fsLimit,
  Timestamp,
} from 'firebase/firestore';
import {
  Room,
  RoomPlayer,
  RoomStatus,
  GameMode,
  PlayType,
  MecanqueSettings,
  ChessSettings,
} from '../types';
import { ensureAuthUser } from './authService';

/**
 * Typed, non-generic errors. Every service failure surfaces one of these
 * codes so the UI can tell ROOM_FULL from PERMISSION_DENIED instead of
 * showing "invalid code" for everything.
 */
export type RoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ALREADY_STARTED'
  | 'INSUFFICIENT_COINS'
  | 'NOT_ROOM_MEMBER'
  | 'NOT_HOST'
  | 'PERMISSION_DENIED'
  | 'NOT_AUTHENTICATED'
  | 'UID_MISMATCH'
  | 'START_GAME_FAILED'
  | 'ROOM_CODE_EXHAUSTED'
  | 'UNKNOWN';

export class RoomError extends Error {
  code: RoomErrorCode;
  cause?: unknown;
  constructor(code: RoomErrorCode, message?: string, cause?: unknown) {
    super(message || code);
    this.name = 'RoomError';
    this.code = code;
    this.cause = cause;
  }
}

/** Wraps a raw Firebase error into a RoomError, never hiding the original message. */
export function toRoomError(err: unknown, fallback: RoomErrorCode = 'UNKNOWN'): RoomError {
  if (err instanceof RoomError) return err;
  const anyErr = err as { code?: string; message?: string };
  if (anyErr?.code === 'permission-denied' || anyErr?.message?.includes('insufficient permissions')) {
    return new RoomError('PERMISSION_DENIED', anyErr.message || 'Missing or insufficient permissions', err);
  }
  if (anyErr?.code === 'unauthenticated') {
    return new RoomError('NOT_AUTHENTICATED', anyErr.message, err);
  }
  return new RoomError(fallback, anyErr?.message || String(err), err);
}

/**
 * Firestore Rules cannot read fields inside maps stored in an array, so
 * membership checks can't use `players[].id`. `playerIds` is the flat
 * mirror of that list and MUST be written on every mutation that touches
 * `players`. This helper is the single source of truth for that mirror.
 */
function idsOf(players: RoomPlayer[]): string[] {
  return players.map((p) => p.id);
}

/** Throws unless the signed-in Firebase user matches the uid the app thinks it is. */
function assertUid(uid: string): string {
  const current = auth.currentUser;
  if (!current) throw new RoomError('NOT_AUTHENTICATED', 'No Firebase user is signed in.');
  if (current.uid !== uid) {
    throw new RoomError(
      'UID_MISMATCH',
      `Local profile id "${uid}" does not match Firebase Auth uid "${current.uid}".`
    );
  }
  return current.uid;
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids visual ambiguity when read aloud/shared
const ROOM_CODE_LENGTH = 6;
const MAX_CREATE_ATTEMPTS = 5;

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

/** Firestore doc -> app Room, normalizing the timestamp fields the UI doesn't need as Timestamps. */
function toRoom(data: any): Room {
  const createdAt =
    data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || 'Just now';
  return { ...data, createdAt } as Room;
}

export interface CreateRoomInput {
  hostUid: string;
  hostName: string;
  hostAvatar: string;
  hostUsername: string;
  gameId: string;
  gameTitle: string;
  title: string;
  maxPlayers: number;
  isPrivate: boolean;
  mode?: GameMode;
  playType?: PlayType;
  entryCost?: number;
  hostWins?: number;
  mecanqueSettings?: MecanqueSettings;
  chessSettings?: ChessSettings;
}

/** Creates a room doc keyed by its own room code (so "join by code" is a direct doc lookup, no query needed). */
export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const authUser = await ensureAuthUser(input.hostName);
  const effectiveUid = authUser.uid;

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    const roomRef = doc(db, 'antifada_rooms', code);

    try {
      const existing = await getDoc(roomRef);
      if (existing.exists()) continue; // code taken, try again

      const hostPlayer: RoomPlayer = {
        id: effectiveUid,
        name: input.hostName,
        username: input.hostUsername,
        avatarUrl: input.hostAvatar,
        isHost: true,
        isReady: true,
        wins: input.hostWins ?? 0,
      };

      const roomData: Record<string, unknown> = {
        id: code,
        code,
        title: input.title,
        gameId: input.gameId,
        gameTitle: input.gameTitle,
        mode: input.mode ?? null,
        playType: input.playType ?? null,
        entryCost: (input.gameId === 'mind-rally' || input.gameId === 'action-verite') ? 0 : (input.entryCost ?? 30),
        hostId: effectiveUid,
        hostName: input.hostName,
        hostAvatar: input.hostAvatar,
        currentPlayers: 1,
        maxPlayers: input.maxPlayers,
        isPrivate: input.isPrivate,
        status: 'waiting',
        players: [hostPlayer],
        playerIds: [effectiveUid], // flat mirror of players[].id — required by firestore.rules
        mecanqueSettings: input.mecanqueSettings ?? null,
        chessSettings: input.chessSettings ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      };

      await setDoc(roomRef, roomData);
      return toRoom({ ...roomData, createdAt: new Date().toISOString() });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[rakcha] createRoom error on attempt', attempt, code, err);
      if (attempt === MAX_CREATE_ATTEMPTS - 1) {
        throw toRoomError(err, 'UNKNOWN');
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new RoomError('ROOM_CODE_EXHAUSTED');
}

/** Joins a room by code. Transaction so two people can't take the same last slot. */
export async function joinRoomByCode(
  codeOrId: string,
  player: { uid: string; name: string; username: string; avatarUrl: string; wins?: number },
  userCoins: number = 300
): Promise<Room> {
  const authUser = await ensureAuthUser(player.name);
  const effectiveUid = authUser.uid;
  const code = codeOrId.trim().toUpperCase();
  const roomRef = doc(db, 'antifada_rooms', code);

  try {
    const room = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) throw new RoomError('ROOM_NOT_FOUND');

      const data = snap.data();
      const isActionVerite = data.gameId === 'mind-rally' || data.gameId === 'action-verite';
      const entryCost = isActionVerite ? 0 : (typeof data.entryCost === 'number' ? data.entryCost : 30);
      if (entryCost > 0 && userCoins < entryCost) {
        throw new RoomError('INSUFFICIENT_COINS', `رصيدك غير كافٍ للدخول (تتطلب ${entryCost} Coins)`);
      }

      const players: RoomPlayer[] = data.players || [];
      const alreadyIn = players.some((p) => p.id === effectiveUid || p.id === player.uid);

      if (alreadyIn) {
        // Idempotent rejoin. Backfill playerIds for legacy rooms so chat
        // and rules-based membership start working for this room.
        if (!Array.isArray(data.playerIds)) {
          transaction.update(roomRef, { playerIds: idsOf(players) });
          return { ...data, playerIds: idsOf(players) };
        }
        return data;
      }

      if (data.status !== 'waiting') throw new RoomError('ROOM_ALREADY_STARTED');

      const now = Date.now();
      const createdAtMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
      const isNewRoom = createdAtMs > 0 && now - createdAtMs < 45000;

      // If room is empty or all players are inactive ghosts (>45s and not brand new), mark completed and reject
      const hasAnyActivePlayer = players.length > 0 && (isNewRoom || players.some((p) => !p.lastActive || now - p.lastActive <= 45000));
      if (!hasAnyActivePlayer && !isNewRoom) {
        transaction.update(roomRef, {
          status: 'completed',
          players: [],
          playerIds: [],
          currentPlayers: 0,
          updatedAt: serverTimestamp(),
        });
        throw new RoomError('ROOM_NOT_FOUND', 'This room is no longer active.');
      }

      if (players.length >= data.maxPlayers) throw new RoomError('ROOM_FULL');

      const updatedPlayers: RoomPlayer[] = [
        ...players,
        { id: effectiveUid, name: player.name, username: player.username, avatarUrl: player.avatarUrl, isHost: false, isReady: false, wins: player.wins ?? 0 },
      ];

      transaction.update(roomRef, {
        players: updatedPlayers,
        playerIds: idsOf(updatedPlayers),
        currentPlayers: updatedPlayers.length,
        updatedAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
      });

      return { ...data, players: updatedPlayers, playerIds: idsOf(updatedPlayers), currentPlayers: updatedPlayers.length };
    });

    return toRoom(room);
  } catch (err) {
    throw toRoomError(err, 'UNKNOWN');
  }
}

/**
 * Legacy-room repair: adds `playerIds` to a room document created before
 * that field existed. Writes ONLY that field (firestore.rules allows this
 * narrow backfill for any listed member), never touching players/status,
 * so existing rooms keep working instead of silently losing chat.
 * Safe to call on every room attach — a no-op when playerIds is present.
 */
export async function ensureRoomPlayerIds(roomCode: string, uid: string): Promise<void> {
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.playerIds)) return;
      const players: RoomPlayer[] = data.players || [];
      if (!players.some((p) => p.id === uid)) return; // not our room to repair
      transaction.update(roomRef, { playerIds: idsOf(players) });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[rakcha] playerIds backfill skipped:', toRoomError(err).code);
  }
}

/** Leaves a room; hands host over to the next player; closes (never deletes) an empty room. */
export async function leaveRoom(roomCode: string, uid: string): Promise<void> {
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  const activeAuthUid = auth.currentUser?.uid;
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const players: RoomPlayer[] = data.players || [];

      const isTarget = (p: RoomPlayer) =>
        p.id === uid ||
        (Boolean(activeAuthUid) && p.id === activeAuthUid);

      const remaining = players.filter((p) => !isTarget(p));

      if (remaining.length === 0) {
        transaction.update(roomRef, {
          status: 'completed',
          players: [],
          playerIds: [],
          currentPlayers: 0,
          updatedAt: serverTimestamp(),
        });
        return;
      }

      const wasHost =
        players.find((p) => isTarget(p))?.isHost ||
        data.hostId === uid ||
        (Boolean(activeAuthUid) && data.hostId === activeAuthUid);

      const updatedPlayers = wasHost ? remaining.map((p, i) => ({ ...p, isHost: i === 0 })) : remaining;

      const wasInProgress = data.status === 'in_progress';
      const needsResetToWaiting = wasInProgress && remaining.length < 2;

      transaction.update(roomRef, {
        players: updatedPlayers,
        playerIds: idsOf(updatedPlayers),
        currentPlayers: updatedPlayers.length,
        hostId: wasHost ? updatedPlayers[0].id : data.hostId,
        hostName: wasHost ? updatedPlayers[0].name : data.hostName,
        hostAvatar: wasHost ? updatedPlayers[0].avatarUrl : data.hostAvatar,
        status: needsResetToWaiting ? 'waiting' : data.status,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    throw toRoomError(err, 'UNKNOWN');
  }
}

/** Toggles the current user's ready flag. Membership list is unchanged. */
export async function toggleReady(roomCode: string, uid: string): Promise<void> {
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) throw new RoomError('ROOM_NOT_FOUND');
      const data = snap.data();
      const players: RoomPlayer[] = data.players || [];
      if (!players.some((p) => p.id === uid)) throw new RoomError('NOT_ROOM_MEMBER');
      const updated = players.map((p) => (p.id === uid ? { ...p, isReady: !p.isReady } : p));
      transaction.update(roomRef, {
        players: updated,
        playerIds: idsOf(updated), // keeps legacy rooms self-healing
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    throw toRoomError(err, 'UNKNOWN');
  }
}

export interface UpdateRoomSettingsInput {
  roomCode: string;
  hostUid: string;
  mode?: GameMode;
  isPrivate?: boolean;
  maxPlayers?: number;
  mecanqueSettings?: MecanqueSettings;
  chessSettings?: ChessSettings;
  status?: RoomStatus;
}

/**
 * Host updates room parameters while in waiting room.
 * Enforces host authorization.
 */
export async function updateRoomSettings(input: UpdateRoomSettingsInput): Promise<void> {
  assertUid(input.hostUid);
  const roomRef = doc(db, 'antifada_rooms', input.roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) throw new RoomError('ROOM_NOT_FOUND');
      const data = snap.data();
      if (data.hostId !== input.hostUid) throw new RoomError('NOT_HOST');

      const patch: Record<string, unknown> = { updatedAt: serverTimestamp(), lastActivityAt: serverTimestamp() };
      if (input.status !== undefined) patch.status = input.status;
      if (input.mode !== undefined) patch.mode = input.mode;
      if (input.isPrivate !== undefined) patch.isPrivate = input.isPrivate;
      if (input.maxPlayers !== undefined) {
        patch.maxPlayers = Math.max(data.currentPlayers || 1, input.maxPlayers);
      }
      if (input.mecanqueSettings !== undefined) patch.mecanqueSettings = input.mecanqueSettings;
      if (input.chessSettings !== undefined) patch.chessSettings = input.chessSettings;

      // Self-heal legacy rooms in the same write
      if (!Array.isArray(data.playerIds)) patch.playerIds = idsOf(data.players || []);

      transaction.update(roomRef, patch);
    });
  } catch (err) {
    throw toRoomError(err, 'UNKNOWN');
  }
}

/**
 * Host starts the game. Runs as a transaction so we can verify host +
 * status server-side-ish before the write, and so we can report exactly
 * why it failed (NOT_HOST / ROOM_ALREADY_STARTED / PERMISSION_DENIED)
 * instead of a dead button. Only `status`/`updatedAt` change — gameId,
 * mode, playType and every *Settings field are left untouched.
 */
export async function startGame(roomCode: string, hostUid: string): Promise<void> {
  assertUid(hostUid);
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) throw new RoomError('ROOM_NOT_FOUND');
      const data = snap.data();
      if (data.hostId !== hostUid) throw new RoomError('NOT_HOST');
      if (data.status === 'in_progress') return; // already started, idempotent
      if (data.status !== 'waiting') throw new RoomError('ROOM_ALREADY_STARTED');

      const patch: Record<string, unknown> = { status: 'in_progress', updatedAt: serverTimestamp(), lastActivityAt: serverTimestamp() };
      // Self-heal legacy rooms in the same write so the rules' host branch
      // and chat membership keep working after the game starts.
      if (!Array.isArray(data.playerIds)) patch.playerIds = idsOf(data.players || []);
      transaction.update(roomRef, patch);
    });
  } catch (err) {
    const roomErr = toRoomError(err, 'START_GAME_FAILED');
    throw roomErr;
  }
}

/** Host removes a specific player. */
export async function removePlayer(roomCode: string, uid: string): Promise<void> {
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const players: RoomPlayer[] = (data.players || []).filter((p: RoomPlayer) => p.id !== uid);
      transaction.update(roomRef, {
        players,
        playerIds: idsOf(players),
        currentPlayers: players.length,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    throw toRoomError(err, 'UNKNOWN');
  }
}

/** Real-time listener on a single room — the backbone of "Player A sees Player B join instantly". */
export function listenToRoom(
  roomCode: string,
  callback: (room: Room | null) => void,
  onError?: (err: RoomError) => void
) {
  return onSnapshot(
    doc(db, 'antifada_rooms', roomCode),
    (snap) => callback(snap.exists() ? toRoom(snap.data()) : null),
    (err) => {
      const roomErr = toRoomError(err, 'UNKNOWN');
      // eslint-disable-next-line no-console
      console.error('[rakcha] listenToRoom error:', roomErr.code, roomErr.message);
      onError?.(roomErr);
    }
  );
}

/**
 * Atomically marks an abandoned room as 'completed' in Firestore if all players have disconnected.
 */
export async function closeAbandonedRoom(roomCode: string): Promise<void> {
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === 'completed') return;

      const now = Date.now();
      const players: RoomPlayer[] = data.players || [];
      const createdAtMs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
      const isNew = createdAtMs > 0 && now - createdAtMs < 45000;

      const hasActivePlayer =
        players.length > 0 && (isNew || players.some((p) => !p.lastActive || now - p.lastActive <= 45000));

      if (!hasActivePlayer && !isNew) {
        transaction.update(roomRef, {
          status: 'completed',
          players: [],
          playerIds: [],
          currentPlayers: 0,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    // Non-fatal background vacuum
    console.warn('[rakcha] closeAbandonedRoom skipped:', err);
  }
}

/** Real-time listener for the public "Open Rooms" list on the Rooms tab. */
export function listenToOpenRooms(
  callback: (rooms: Room[]) => void,
  maxResults = 30,
  onError?: (err: RoomError) => void
) {
  const q = query(
    collection(db, 'antifada_rooms'),
    where('isPrivate', '==', false),
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'desc'),
    fsLimit(maxResults)
  );
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const staleRoomCodesToClean: string[] = [];

      const activeRooms = snap.docs
        .map((d) => toRoom(d.data()))
        .filter((room) => {
          // Exclude rooms marked completed or with 0 players
          if (room.status !== 'waiting' || !room.players || room.players.length === 0 || room.currentPlayers === 0) {
            staleRoomCodesToClean.push(room.code);
            return false;
          }
          const createdAtMs = typeof room.createdAt === 'string' ? new Date(room.createdAt).getTime() : 0;
          const isNew = createdAtMs > 0 && now - createdAtMs < 45000;

          // Verify at least one player has active heartbeat within the last 45s (or grace period for new rooms)
          const hasActivePlayer = room.players.some((p) => {
            if (!p.lastActive) return true; // Grace period for new joins
            return now - p.lastActive <= 45000;
          });

          if (!hasActivePlayer && !isNew) {
            staleRoomCodesToClean.push(room.code);
            return false;
          }
          return true;
        });

      // Background vacuum stale rooms in Firestore so they stop querying
      if (staleRoomCodesToClean.length > 0 && auth.currentUser) {
        for (const code of staleRoomCodesToClean) {
          void closeAbandonedRoom(code);
        }
      }

      callback(activeRooms);
    },
    (err) => {
      const roomErr = toRoomError(err, 'UNKNOWN');
      // A failed-precondition here means the composite index
      // (isPrivate ASC, status ASC, createdAt DESC) is missing in the
      // Firebase console — the message contains a one-click create link.
      // eslint-disable-next-line no-console
      console.error('[rakcha] listenToOpenRooms error:', roomErr.code, roomErr.message);
      onError?.(roomErr);
    }
  );
}

export async function sendHeartbeat(roomCode: string, playerId: string) {
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) return;
      
      const room = roomSnap.data() as Room;
      const players = [...(room.players || [])];
      const playerIndex = players.findIndex(p => p.id === playerId);
      
      if (playerIndex >= 0) {
        players[playerIndex] = { ...players[playerIndex], lastActive: Date.now() };
        transaction.update(roomRef, { players });
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[rakcha] Heartbeat failed:', err);
  }
}

/**
 * Checks for inactive ghost players (lastActive > 45s ago) and evicts them.
 * If the host is evicted, reassigns host atomically to remaining[0].
 * If all players disconnect, marks the room status as 'completed'.
 */
export async function evictInactivePlayersAndReassignHost(roomCode: string, timeoutMs = 45000): Promise<void> {
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === 'completed') return;

      const now = Date.now();
      const players: RoomPlayer[] = data.players || [];
      if (players.length === 0) return;

      // Filter out players whose lastActive was recorded and is older than timeoutMs
      const remaining = players.filter((p) => {
        if (!p.lastActive) return true; // Grace period for new joins
        return now - p.lastActive <= timeoutMs;
      });

      if (remaining.length === players.length) return; // No inactive players

      if (remaining.length === 0) {
        // Room empty -> mark as completed
        transaction.update(roomRef, {
          status: 'completed',
          players: [],
          playerIds: [],
          currentPlayers: 0,
          updatedAt: serverTimestamp(),
        });
        return;
      }

      // Check if current host is among the remaining players
      const hostStillPresent = remaining.some((p) => p.id === data.hostId);
      const updatedPlayers = remaining.map((p, idx) => ({
        ...p,
        isHost: hostStillPresent ? p.id === data.hostId : idx === 0,
      }));

      const newHost = updatedPlayers.find((p) => p.isHost) || updatedPlayers[0];

      const wasInProgress = data.status === 'in_progress';
      const needsResetToWaiting = wasInProgress && remaining.length < 2;

      transaction.update(roomRef, {
        players: updatedPlayers,
        playerIds: idsOf(updatedPlayers),
        currentPlayers: updatedPlayers.length,
        hostId: newHost.id,
        hostName: newHost.name,
        hostAvatar: newHost.avatarUrl,
        status: needsResetToWaiting ? 'waiting' : data.status,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[rakcha] evictInactivePlayers error:', err);
  }
}

/**
 * Migrates a player's identity in active room and game documents when transitioning
 * from an anonymous/guest session to a permanent registered account.
 * Updates player list, playerIds mirror, host information if applicable, and game state.
 */
export async function updatePlayerIdentityInRoomAndMatch(
  roomCode: string,
  oldUid: string,
  newPlayer: { id: string; name: string; username: string; avatarUrl?: string; wins?: number }
): Promise<void> {
  if (!roomCode || !oldUid || !newPlayer?.id || oldUid === newPlayer.id) return;
  const roomRef = doc(db, 'antifada_rooms', roomCode);
  const gameRef = doc(db, 'antifada_games', roomCode);

  try {
    // 1. Update antifada_rooms document
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const players: RoomPlayer[] = data.players || [];
      const hasOldPlayer = players.some((p) => p.id === oldUid);
      const isOldHost = data.hostId === oldUid;

      if (!hasOldPlayer && !isOldHost) return;

      const updatedPlayers = players.map((p) => {
        if (p.id === oldUid) {
          return {
            ...p,
            id: newPlayer.id,
            name: newPlayer.name,
            username: newPlayer.username,
            avatarUrl: newPlayer.avatarUrl || p.avatarUrl,
            wins: newPlayer.wins ?? p.wins ?? 0,
          };
        }
        return p;
      });

      const updatedPlayerIds = Array.from(new Set(updatedPlayers.map((p) => p.id)));
      const updates: Record<string, unknown> = {
        players: updatedPlayers,
        playerIds: updatedPlayerIds,
        updatedAt: serverTimestamp(),
      };

      if (isOldHost) {
        updates.hostId = newPlayer.id;
        updates.hostName = newPlayer.name;
        updates.hostAvatar = newPlayer.avatarUrl || data.hostAvatar;
      }

      transaction.update(roomRef, updates);
    });

    // 2. Update antifada_games document if game is active
    await runTransaction(db, async (transaction) => {
      const gameSnap = await transaction.get(gameRef);
      if (!gameSnap.exists()) return;
      const gameData = gameSnap.data() as Record<string, any>;
      let hasChanges = false;
      const updates: Record<string, any> = {};

      if (Array.isArray(gameData.players)) {
        updates.players = gameData.players.map((p: any) => {
          if (p && p.id === oldUid) {
            hasChanges = true;
            return {
              ...p,
              id: newPlayer.id,
              name: newPlayer.name,
              username: newPlayer.username,
              avatarUrl: newPlayer.avatarUrl || p.avatarUrl,
            };
          }
          return p;
        });
      }

      if (Array.isArray(gameData.playerIds) && gameData.playerIds.includes(oldUid)) {
        hasChanges = true;
        updates.playerIds = gameData.playerIds.map((id: string) => (id === oldUid ? newPlayer.id : id));
      }

      if (gameData.hostId === oldUid) {
        hasChanges = true;
        updates.hostId = newPlayer.id;
      }

      if (gameData.currentTurnPlayerId === oldUid) {
        hasChanges = true;
        updates.currentTurnPlayerId = newPlayer.id;
      }

      if (gameData.whitePlayerId === oldUid) {
        hasChanges = true;
        updates.whitePlayerId = newPlayer.id;
      }
      if (gameData.blackPlayerId === oldUid) {
        hasChanges = true;
        updates.blackPlayerId = newPlayer.id;
      }

      if (gameData.answersMap && gameData.answersMap[oldUid]) {
        hasChanges = true;
        const newAnswersMap = { ...gameData.answersMap };
        newAnswersMap[newPlayer.id] = {
          ...newAnswersMap[oldUid],
          playerId: newPlayer.id,
          playerName: newPlayer.name,
        };
        delete newAnswersMap[oldUid];
        updates.answersMap = newAnswersMap;
      }

      if (gameData.unoWindow && gameData.unoWindow.playerId === oldUid) {
        hasChanges = true;
        updates.unoWindow = { ...gameData.unoWindow, playerId: newPlayer.id };
      }
      if (gameData.counterUnoWindow && gameData.counterUnoWindow.playerId === oldUid) {
        hasChanges = true;
        updates.counterUnoWindow = { ...gameData.counterUnoWindow, playerId: newPlayer.id };
      }

      if (hasChanges) {
        transaction.update(gameRef, updates);
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[rakcha] updatePlayerIdentityInRoomAndMatch skipped or failed:', err);
  }
}


