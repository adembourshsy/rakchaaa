import { useMemo, useRef } from 'react';
import { RoomPlayer, Room, CardTurnSession, UserProfile } from '../types';

export interface NormalizedGameState {
  activePlayers: RoomPlayer[];
  playersById: Record<string, RoomPlayer>;
  playerIds: string[];
  turnOrderIds: string[];
  activePlayerId: string;
  activePlayerObj: RoomPlayer;
  isActiveTurn: boolean;
  currentShields: number;
  totalPlayersCount: number;
}

/**
 * Custom State-Normalization Layer for GameView
 * Optimizes memory allocation and stabilizes player / turn state
 * during high-frequency real-time synchronization with 8+ concurrent players.
 */
export function useNormalizedGameState(
  joinedRoom: Room | null,
  userProfile: UserProfile,
  currentUid: string | null,
  cardTurn: CardTurnSession
): NormalizedGameState {
  const myEffectiveId = currentUid || userProfile?.id || '';

  // Cache player references to prevent unnecessary object re-allocations during sync ticks
  const cachedPlayersMapRef = useRef<Map<string, RoomPlayer>>(new Map());

  const activePlayers = useMemo(() => {
    const raw: RoomPlayer[] = (joinedRoom?.players && joinedRoom.players.length > 0)
      ? joinedRoom.players
      : [
          {
            id: myEffectiveId || 'local-host',
            name: userProfile?.name || 'Player',
            username: userProfile?.username || '@player',
            avatarUrl: userProfile?.avatarUrl || '',
            isHost: true,
            isReady: true,
          },
          {
            id: 'bot-1',
            name: 'Yassine',
            username: '@yassine_af',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            isHost: false,
            isReady: true,
          },
          {
            id: 'bot-2',
            name: 'Amira',
            username: '@amira_hub',
            avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            isHost: false,
            isReady: true,
          },
        ];

    const currentCache = cachedPlayersMapRef.current;
    const nextCache = new Map<string, RoomPlayer>();
    const normalizedList: RoomPlayer[] = [];

    for (let i = 0; i < raw.length; i++) {
      const p = raw[i];
      const prev = currentCache.get(p.id);

      // Check structural equality of key player properties
      if (
        prev &&
        prev.id === p.id &&
        prev.name === p.name &&
        prev.username === p.username &&
        prev.avatarUrl === p.avatarUrl &&
        prev.isHost === p.isHost &&
        prev.isReady === p.isReady &&
        prev.equippedFrame === p.equippedFrame
      ) {
        nextCache.set(p.id, prev);
        normalizedList.push(prev);
      } else {
        nextCache.set(p.id, p);
        normalizedList.push(p);
      }
    }

    cachedPlayersMapRef.current = nextCache;
    return normalizedList;
  }, [joinedRoom?.players, myEffectiveId, userProfile?.name, userProfile?.username, userProfile?.avatarUrl]);

  const playersById = useMemo(() => {
    const map: Record<string, RoomPlayer> = {};
    for (let i = 0; i < activePlayers.length; i++) {
      map[activePlayers[i].id] = activePlayers[i];
    }
    return map;
  }, [activePlayers]);

  const playerIds = useMemo(() => activePlayers.map((p) => p.id), [activePlayers]);

  const turnOrderIds = useMemo(() => {
    if (cardTurn.turnOrder && cardTurn.turnOrder.length > 0) {
      return cardTurn.turnOrder;
    }
    return playerIds;
  }, [cardTurn.turnOrder, playerIds]);

  const activePlayerId = useMemo(() => {
    if (cardTurn.currentPlayerId) return cardTurn.currentPlayerId;
    const len = turnOrderIds.length || 1;
    const idx = (cardTurn.activePlayerIndex || 0) % len;
    return turnOrderIds[idx] || playerIds[0] || '';
  }, [cardTurn.currentPlayerId, cardTurn.activePlayerIndex, turnOrderIds, playerIds]);

  const activePlayerObj = useMemo(() => {
    return (
      playersById[activePlayerId] ||
      activePlayers[0] || {
        id: myEffectiveId,
        name: userProfile?.name || 'Player',
        username: userProfile?.username || '@player',
        avatarUrl: '',
        isHost: false,
      }
    );
  }, [playersById, activePlayerId, activePlayers, myEffectiveId, userProfile?.name, userProfile?.username]);

  const isActiveTurn = useMemo(() => {
    if (!myEffectiveId) return false;
    return (
      activePlayerId === myEffectiveId ||
      activePlayerObj?.id === myEffectiveId ||
      (userProfile?.id && activePlayerId === userProfile.id) ||
      (userProfile?.id && activePlayerObj?.id === userProfile.id)
    );
  }, [myEffectiveId, activePlayerId, activePlayerObj?.id, userProfile?.id]);

  const currentShields = useMemo(() => {
    const map = cardTurn.shieldsMap || {};
    return map[activePlayerObj?.id || ''] || 0;
  }, [cardTurn.shieldsMap, activePlayerObj?.id]);

  return {
    activePlayers,
    playersById,
    playerIds,
    turnOrderIds,
    activePlayerId,
    activePlayerObj,
    isActiveTurn,
    currentShields,
    totalPlayersCount: activePlayers.length,
  };
}
