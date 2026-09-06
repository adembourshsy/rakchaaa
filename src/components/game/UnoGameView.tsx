import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  X, 
  Check, 
  Trophy, 
  LogOut,
  XCircle,
  Coins
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { useApp, UnoAiConfig } from '../../context/AppContext';
import { useGameState } from '../../hooks/useGameState';
import { DEFAULT_AVATAR } from '../../data/mockData';
import { audioManager } from '../../services/audioManager';
import { UnoAiBrain, selectBestUnoPlay } from '../../services/unoAiLearningService';
import { getThemeById } from '../../theme/gameThemeEngine';
import { calculatePlayerCoinChange } from '../../utils/coins';
import { UnoCard, UnoCardFront, UnoCardBack } from './UnoCards';
import { UnoPlayerControls } from './UnoPlayerControls';
export type { UnoCard };
export { UnoCardFront, UnoCardBack };

export interface UnoPlayer {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  cards: UnoCard[];
  declaredUno: boolean;
  finishedRank?: number;
}

// ==========================================
// REUSABLE VISUAL CARD MOVEMENT OVERLAY SYSTEM
// ==========================================
export interface FlyingCardData {
  id: string;
  card?: UnoCard;
  from: { x: number; y: number };
  to: { x: number; y: number };
  startRotation?: number;
  endRotation?: number;
  duration?: number;
  delay?: number;
  isCardBack?: boolean;
  onLanding?: () => void;
}

export const FlyingCardsOverlay: React.FC<{
  flyingCards: FlyingCardData[];
  onAnimationComplete: (id: string) => void;
}> = React.memo(({ flyingCards, onAnimationComplete }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {flyingCards.map((anim, animIdx) => {
          const startX = anim.from.x;
          const startY = anim.from.y;
          const endX = anim.to.x;
          const endY = anim.to.y;
          const duration = anim.duration ?? 0.22;
          const delay = anim.delay ?? 0;
          const startRot = anim.startRotation ?? 0;
          const endRot = anim.endRotation ?? 0;

          return (
            <motion.div
              key={`flying-card-${anim.id}-${animIdx}`}
              initial={{
                x: startX - 36,
                y: startY - 54,
                scale: 0.85,
                rotate: startRot,
                opacity: 0,
              }}
              animate={{
                x: endX - 36,
                y: endY - 54,
                scale: 1,
                rotate: endRot,
                opacity: 1,
              }}
              transition={{
                duration: duration,
                delay: delay,
                ease: [0.16, 1, 0.3, 1], // snappy realistic cubic-bezier
                opacity: { duration: 0.08, delay: delay }
              }}
              onAnimationComplete={() => onAnimationComplete(anim.id)}
              className="absolute top-0 left-0 w-[72px] h-[108px] shadow-md rounded-2xl [will-change:transform] [transform:translateZ(0)]"
            >
              {anim.isCardBack || !anim.card ? (
                <UnoCardBack disabled className="w-full h-full pointer-events-none shadow-md" />
              ) : (
                <UnoCardFront card={anim.card} className="w-full h-full pointer-events-none shadow-md" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

interface UnoGameViewProps {
  isAiMode?: boolean;
  aiConfig?: UnoAiConfig;
}

const UnoGameViewComponent: React.FC<UnoGameViewProps> = ({ isAiMode = false, aiConfig }) => {
  const { 
    userProfile, 
    currentUid, 
    joinedRoom, 
    language, 
    voiceInteractionEnabled, 
    setVoiceInteractionEnabled, 
    requestLeaveRoom, 
    settleMatchCoins, 
    setIsThemePickerOpen, 
    batterySaver,
    selectedGameTheme 
  } = useApp();

  const myPlayerId = currentUid || userProfile.id || '';
  const gameTheme = useMemo(() => getThemeById(selectedGameTheme, userProfile?.level || 1), [selectedGameTheme, userProfile?.level]);

  // 1. GAME STATES
  const isHost = isAiMode || Boolean(myPlayerId && (joinedRoom?.hostId === myPlayerId || joinedRoom?.hostId === userProfile.id));

  const [syncedState, setSyncedState] = useGameState<any>(joinedRoom?.code || '', {
    players: [],
    drawPile: [],
    discardPile: [],
    currentPlayerIndex: 0,
    currentPlayerId: '',
    playDirection: 'clockwise',
    activeColor: null,
    gameState: 'lobby',
    winner: null,
    unoWindow: null,
    counterUnoWindow: null,
    voicePrompt: null,
    gameLogs: [],
    selectedWildType: null,
    justDrewCard: null,
    finishOrder: [],
  });

  const finishOrder: string[] = syncedState.finishOrder || [];

  const getOrdinal = (n: number) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  const players: UnoPlayer[] = syncedState.players || [];
  const drawPile: UnoCard[] = syncedState.drawPile || [];
  const discardPile: UnoCard[] = syncedState.discardPile || [];
  const currentPlayerIndex: number = syncedState.currentPlayerIndex || 0;
  const currentPlayerId: string = syncedState.currentPlayerId || '';
  
  // Authoritative turn ownership uses currentPlayerId (canonical UID) with fallback to players index
  const activePlayerId: string = currentPlayerId || players[currentPlayerIndex]?.id || '';
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isMyTurn = Boolean(
    myPlayerId &&
    myPlayer &&
    myPlayer.cards.length > 0 &&
    !myPlayer.finishedRank &&
    activePlayerId === myPlayerId &&
    (syncedState.gameState === 'playing' || syncedState.gameState === 'color_picker')
  );

  const playDirection: 'clockwise' | 'counter-clockwise' = syncedState.playDirection || 'clockwise';
  const rawActiveColor: 'red' | 'yellow' | 'green' | 'blue' | null = syncedState.activeColor || null;
  const effectiveActiveColor: 'red' | 'yellow' | 'green' | 'blue' = useMemo(() => {
    const topCard = discardPile[discardPile.length - 1];
    if (!topCard) return rawActiveColor || 'red';
    if (topCard.color !== 'wild') return topCard.color as 'red' | 'yellow' | 'green' | 'blue';
    return rawActiveColor || 'red';
  }, [discardPile, rawActiveColor]);
  const activeColor = effectiveActiveColor;
  const gameState: 'lobby' | 'playing' | 'color_picker' | 'winner' = syncedState.gameState || 'lobby';
  const winner: UnoPlayer | null = syncedState.winner || null;
  const hasSettledMatchRef = useRef<boolean>(false);

  // Trigger coin settlement when UNO winner is declared
  useEffect(() => {
    if (winner && (gameState === 'winner' || winner.id)) {
      if (hasSettledMatchRef.current) return;
      hasSettledMatchRef.current = true;

      const rankedPlayers = [...players].sort((a, b) => {
        const rA = a.finishedRank || (finishOrder.indexOf(a.id) >= 0 ? finishOrder.indexOf(a.id) + 1 : 99);
        const rB = b.finishedRank || (finishOrder.indexOf(b.id) >= 0 ? finishOrder.indexOf(b.id) + 1 : 99);
        return rA - rB;
      });
      const rankedPlayerIds = rankedPlayers.map((p) => p.id);

      const winnerId = winner.id || rankedPlayerIds[0];
      const winnerIds = [winnerId];
      const loserIds = rankedPlayerIds.filter((id) => id !== winnerId);

      settleMatchCoins(
        joinedRoom?.code || 'uno_match',
        joinedRoom?.gameTitle || 'Rakcha Uno',
        winnerIds,
        loserIds,
        joinedRoom?.entryCost || 30,
        false,
        rankedPlayerIds
      );
    } else if (gameState !== 'winner') {
      hasSettledMatchRef.current = false;
    }
  }, [winner, gameState, players, finishOrder, joinedRoom?.code, joinedRoom?.gameTitle, joinedRoom?.entryCost, settleMatchCoins]);
  const unoWindow: { active: boolean; playerId: string } | null = syncedState.unoWindow || null;
  const counterUnoWindow: { active: boolean; playerId: string } | null = syncedState.counterUnoWindow || null;
  const voicePrompt: { active: boolean; text: string } | null = syncedState.voicePrompt || null;
  const gameLogs: string[] = syncedState.gameLogs || [];
  const selectedWildType: 'wild' | 'wild4' | null = syncedState.selectedWildType || null;
  const justDrewCard: UnoCard | null = syncedState.justDrewCard || null;

  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  const pendingState = useRef<any>(null);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);

  const applyStateUpdate = (key: string, value: any) => {
    if (!pendingState.current) pendingState.current = {};
    if (typeof value === 'function') {
      const currentState = pendingState.current[key] !== undefined ? pendingState.current[key] : syncedState[key];
      pendingState.current[key] = value(currentState !== undefined ? currentState : (key === 'gameLogs' ? [] : null));
    } else {
      pendingState.current[key] = value;
    }
    if (flushTimeout.current) clearTimeout(flushTimeout.current);
    flushTimeout.current = setTimeout(() => {
      const updates = { ...pendingState.current };
      pendingState.current = null;
      setSyncedState((prev: any) => ({ ...prev, ...updates }));
    }, 0);
  };

  const setPlayers = (v: any) => applyStateUpdate('players', v);
  const setDrawPile = (v: any) => applyStateUpdate('drawPile', v);
  const setDiscardPile = (v: any) => applyStateUpdate('discardPile', v);
  
  // Safely sets currentPlayerIndex AND currentPlayerId atomically using pending player list
  const setCurrentPlayerIndex = (v: any) => {
    if (!pendingState.current) pendingState.current = {};
    const effectiveIndex = pendingState.current['currentPlayerIndex'] !== undefined 
      ? pendingState.current['currentPlayerIndex'] 
      : currentPlayerIndex;
    const nextIndex = typeof v === 'function' ? v(effectiveIndex) : v;
    
    const effectivePlayers: UnoPlayer[] = pendingState.current['players'] !== undefined 
      ? pendingState.current['players'] 
      : players;
      
    const validIndex = effectivePlayers.length > 0 
      ? ((nextIndex % effectivePlayers.length) + effectivePlayers.length) % effectivePlayers.length 
      : 0;
    const nextId = effectivePlayers[validIndex]?.id || '';
    
    pendingState.current['currentPlayerIndex'] = validIndex;
    pendingState.current['currentPlayerId'] = nextId;
    
    if (flushTimeout.current) clearTimeout(flushTimeout.current);
    flushTimeout.current = setTimeout(() => {
      const updates = { ...pendingState.current };
      pendingState.current = null;
      setSyncedState((prev: any) => ({ ...prev, ...updates }));
    }, 0);
  };
  const setPlayDirection = (v: any) => applyStateUpdate('playDirection', v);
  const setActiveColor = (v: any) => applyStateUpdate('activeColor', v);
  const setGameState = (v: any) => applyStateUpdate('gameState', v);
  const setWinner = (v: any) => applyStateUpdate('winner', v);
  const setUnoWindow = (v: any) => applyStateUpdate('unoWindow', v);
  const setCounterUnoWindow = (v: any) => applyStateUpdate('counterUnoWindow', v);
  const setVoicePrompt = (v: any) => applyStateUpdate('voicePrompt', v);
  const setGameLogs = (v: any) => applyStateUpdate('gameLogs', v);
  const setSelectedWildType = (v: any) => applyStateUpdate('selectedWildType', v);
  const setJustDrewCard = (v: any) => applyStateUpdate('justDrewCard', v);

  // Extra UX states for complete production polish
  const [showIntro, setShowIntro] = useState<boolean>(() => localStorage.getItem('rakchagame_uno_intro_seen') !== 'true');
  const [micPermissionState, setMicPermissionState] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showMicHelp, setShowMicHelp] = useState<boolean>(false);
  const [isReshuffling, setIsReshuffling] = useState<boolean>(false);
  const [isDealing, setIsDealing] = useState<boolean>(false);

  // Show/hide the status bar on UNO entrance and exit.
  // NOTE: The actual landscape/portrait orientation lock is handled ONCE, centrally,
  // by the global `useScreenOrientation` hook (src/native/useScreenOrientation.ts),
  // which already runs whenever the active game is UNO. This effect used to ALSO call
  // `ScreenOrientation.lock('landscape')` on mount, which meant two separate native
  // orientation-lock calls fired back-to-back every time a player opened UNO — causing
  // the visible double-rotation jank/lag reported when starting a game. Only the
  // StatusBar toggling (which the global hook does not do) stays here.
  useEffect(() => {
    let isMounted = true;

    const hideStatusBar = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await StatusBar.hide().catch(() => {});
          await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          console.warn('UNO status bar hide fallback:', err);
        }
      }
    };

    void hideStatusBar();

    return () => {
      isMounted = false;
      const restoreStatusBar = async () => {
        try {
          if (Capacitor.isNativePlatform()) {
            await StatusBar.show().catch(() => {});
            await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
          }
        } catch {}
      };
      void restoreStatusBar();
    };
  }, []);

  // Responsive Orientation Detection State
  // (Previously computed `isLandscape` / `showLogsInLandscape` here, but
  // neither value was ever read anywhere in this component — it was dead
  // code left over from an earlier refactor that still ran a resize +
  // orientationchange listener on every render for nothing. That listener
  // firing repeatedly during the physical device rotation (right when the
  // player opens UNO, since the game force-locks landscape) is exactly what
  // contributed to the rotation stutter/jank players noticed. Removed.)

  // Visual Hand & Discard Display State (Decoupled from Authoritative state during flight for pristine animations)
  const [visibleHandCounts, setVisibleHandCounts] = useState<{ [playerId: string]: number }>({});
  const [visibleDiscardPile, setVisibleDiscardPile] = useState<UnoCard[]>([]);
  const [animatingPlayCardId, setAnimatingPlayCardId] = useState<string | null>(null);
  const [aiTurnTick, setAiTurnTick] = useState<number>(0);
  const [draggedCardState, setDraggedCardState] = useState<{
    card: UnoCard;
    x: number;
    y: number;
    startX: number;
    startY: number;
    playable: boolean;
  } | null>(null);

  // References
  const recognitionRef = useRef<any>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Card Flight Animation System State & Refs
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);
  const processedAnimKeys = useRef<Set<string>>(new Set());
  const activeTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const scheduledSafetyIds = useRef<Set<string>>(new Set());

  const drawPileRef = useRef<HTMLDivElement>(null);
  const discardPileRef = useRef<HTMLDivElement>(null);
  const userHandRef = useRef<HTMLDivElement>(null);
  const opponentRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const userCardRefs = useRef<{ [cardId: string]: HTMLDivElement | null }>({});

  // Tracks the live width of the user's hand container so the fan layout can
  // shrink card size (instead of just piling cards on top of each other) once
  // the hand grows too wide to fit on screen.
  const [userHandContainerWidth, setUserHandContainerWidth] = useState(0);
  useEffect(() => {
    const el = userHandRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setUserHandContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // RAF-batched card removal system to prevent frame drops during card distribution
  const pendingRemovalIdsRef = useRef<Set<string>>(new Set());
  const removalRafRef = useRef<number | null>(null);

  const processRemovals = useCallback(() => {
    removalRafRef.current = null;
    const idsToRemove = Array.from(pendingRemovalIdsRef.current);
    if (idsToRemove.length === 0) return;
    pendingRemovalIdsRef.current.clear();

    setFlyingCards((prev) => {
      const idsSet = new Set(idsToRemove);
      prev.forEach((card) => {
        if (idsSet.has(card.id) && card.onLanding) {
          try {
            card.onLanding();
          } catch (err) {
            console.error('Error in flying card onLanding:', err);
          }
        }
      });
      return prev.filter((card) => !idsSet.has(card.id));
    });
  }, []);

  const removeFlyingCard = useCallback((id: string) => {
    pendingRemovalIdsRef.current.add(id);
    if (!removalRafRef.current) {
      removalRafRef.current = requestAnimationFrame(processRemovals);
    }
  }, [processRemovals]);

  // Cleanup active timers and RAF on unmount or view transition
  useEffect(() => {
    return () => {
      if (removalRafRef.current) {
        cancelAnimationFrame(removalRafRef.current);
        removalRafRef.current = null;
      }
      activeTimersRef.current.forEach((t) => clearTimeout(t));
      activeTimersRef.current.clear();
    };
  }, []);

  // Safety cleanup watchdog for flying cards
  useEffect(() => {
    flyingCards.forEach((card) => {
      if (!scheduledSafetyIds.current.has(card.id)) {
        scheduledSafetyIds.current.add(card.id);
        const durationMs = Math.ceil(((card.delay || 0) + (card.duration || 0.22) + 0.15) * 1000);
        const timer = setTimeout(() => {
          removeFlyingCard(card.id);
          scheduledSafetyIds.current.delete(card.id);
        }, durationMs);
        activeTimersRef.current.add(timer);
      }
    });

    // Clean up tracking for cards no longer flying
    scheduledSafetyIds.current.forEach((id) => {
      const exists = flyingCards.some((c) => c.id === id);
      if (!exists) {
        scheduledSafetyIds.current.delete(id);
      }
    });
  }, [flyingCards, removeFlyingCard]);

  // Converge visual display state to authoritative state when no card flight animations are active
  useEffect(() => {
    if (flyingCards.length === 0 && !isDealing) {
      if (discardPile.length > 0) {
        setVisibleDiscardPile((prev) => {
          if (prev.length === discardPile.length && prev[prev.length - 1]?.id === discardPile[discardPile.length - 1]?.id) {
            return prev;
          }
          return discardPile;
        });
      }
      setVisibleHandCounts((prev) => {
        let changed = false;
        const counts: { [id: string]: number } = { ...prev };
        players.forEach((p) => {
          if (counts[p.id] !== p.cards.length) {
            counts[p.id] = p.cards.length;
            changed = true;
          }
        });
        return changed ? counts : prev;
      });
    }
  }, [discardPile, players, flyingCards.length, isDealing]);

  const getElementCenter = useCallback((el: HTMLElement | null, fallback: { x: number; y: number }) => {
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }
    return fallback;
  }, []);

  // Sync isMicEnabled with voiceInteractionEnabled setting
  useEffect(() => {
    if (voiceInteractionEnabled) {
      setIsMicEnabled(true);
      setMicPermissionState('granted');
    } else {
      setIsMicEnabled(false);
    }
  }, [voiceInteractionEnabled]);

  // Auto scroll logs container directly without triggering page scroll
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [gameLogs]);

  // Lock viewport scrolling during active gameplay
  useEffect(() => {
    if (gameState !== 'playing') return;

    const parent = document.querySelector('.flex-1.overflow-y-auto');
    let originalParentOverflow = '';
    if (parent) {
      originalParentOverflow = (parent as HTMLElement).style.overflowY;
      (parent as HTMLElement).style.overflowY = 'hidden';
    }
    
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Prevent default scroll behavior on touchmove for the document, 
    // EXCEPT for elements that have overflow-x or overflow-y set
    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      let current: HTMLElement | null = target;
      let isScrollable = false;
      while (current && current !== document.body) {
        if (
          current.classList.contains('overflow-x-auto') || 
          current.classList.contains('overflow-y-auto') || 
          current.style.overflowX === 'auto' || 
          current.style.overflowY === 'auto' ||
          current.style.overflow === 'auto' ||
          current.style.overflow === 'scroll'
        ) {
          isScrollable = true;
          break;
        }
        current = current.parentElement;
      }
      
      if (!isScrollable) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      if (parent) {
        (parent as HTMLElement).style.overflowY = originalParentOverflow;
      }
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [gameState]);

  // 2. DECK GENERATOR
  const createUnoDeck = (): UnoCard[] => {
    const colors = ['red', 'yellow', 'green', 'blue'] as const;
    const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'] as const;
    const deck: UnoCard[] = [];

    colors.forEach((color) => {
      // 1x Zero card per color
      deck.push({
        id: `${color}-0-v1`,
        color,
        value: '0',
      });
      
      // 2x 1-9 and special cards per color
      for (let i = 0; i < 2; i++) {
        values.forEach((value) => {
          deck.push({
            id: `${color}-${value}-v${i + 1}`,
            color,
            value,
          });
        });
      }
    });

    // 4x Wild and 3x Wild Draw Four cards (Total 107 cards)
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `wild-normal-v${i + 1}`,
        color: 'wild',
        value: 'wild',
      });
    }
    for (let i = 0; i < 3; i++) {
      deck.push({
        id: `wild-draw4-v${i + 1}`,
        color: 'wild',
        value: 'wild4',
      });
    }

    return deck;
  };

  const shuffleDeck = (deck: UnoCard[]): UnoCard[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 3. START GAME ROUND
  const startNewRound = () => {
    // Generate and shuffle 107 cards
    const initialDeck = shuffleDeck(createUnoDeck());
    
    let roomPlayers: Array<{ id: string; name: string; username: string; avatarUrl: string }>;

    if (isAiMode) {
      const human = {
        id: myPlayerId || 'human-player',
        name: userProfile?.name || 'Player',
        username: userProfile?.username || '@player',
        avatarUrl: userProfile?.avatarUrl || DEFAULT_AVATAR,
      };

      const count = aiConfig?.aiCount || 3;
      const difficultyTag = '';

      const botPool = [
        { id: 'ai-bot-1', name: `Sami`, username: '@sami', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
        { id: 'ai-bot-2', name: `Leila`, username: '@leila', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
        { id: 'ai-bot-3', name: `Karim`, username: '@karim', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
        { id: 'ai-bot-4', name: `Yasmine`, username: '@yasmine', avatarUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150' },
        { id: 'ai-bot-5', name: `Mehdi`, username: '@mehdi', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
        { id: 'ai-bot-6', name: `Nour`, username: '@nour', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
        { id: 'ai-bot-7', name: `Amine`, username: '@amine', avatarUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150' },
        { id: 'ai-bot-8', name: `Rania`, username: '@rania', avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150' },
        { id: 'ai-bot-9', name: `Wassim`, username: '@wassim', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150' },
      ];

      roomPlayers = [human, ...botPool.slice(0, count)];
    } else {
      roomPlayers = joinedRoom?.players && joinedRoom.players.length > 0
        ? joinedRoom.players
        : [
            { id: myPlayerId, name: userProfile.name, username: userProfile.username, avatarUrl: userProfile.avatarUrl },
            { id: 'player-2', name: 'Guest Player', username: '@guest_player', avatarUrl: DEFAULT_AVATAR }
          ];
    }

    const initialPlayers: UnoPlayer[] = roomPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      username: p.username || '@' + p.name.toLowerCase().replace(/\s+/g, ''),
      avatarUrl: p.avatarUrl || DEFAULT_AVATAR,
      cards: [],
      declaredUno: false,
    }));

    // Deal 7 cards to each player
    const updatedPlayers = initialPlayers.map((player) => {
      const hand = initialDeck.splice(0, 7);
      return { ...player, cards: hand };
    });

    // Make sure top discard card is NOT a wild action card to start cleanly
    let firstDiscardIndex = 0;
    while (
      initialDeck[firstDiscardIndex].color === 'wild' ||
      initialDeck[firstDiscardIndex].value === 'skip' ||
      initialDeck[firstDiscardIndex].value === 'reverse' ||
      initialDeck[firstDiscardIndex].value === 'draw2'
    ) {
      firstDiscardIndex++;
      if (firstDiscardIndex >= initialDeck.length) {
        firstDiscardIndex = 0;
        break;
      }
    }

    const firstDiscard = initialDeck.splice(firstDiscardIndex, 1)[0];

    // Initialize visual animation display state before flight
    const initCounts: { [id: string]: number } = {};
    updatedPlayers.forEach((p) => {
      initCounts[p.id] = 0;
    });
    setVisibleHandCounts(initCounts);
    setVisibleDiscardPile([]);
    setIsDealing(true);

    setPlayers(updatedPlayers);
    setDrawPile(initialDeck);
    setDiscardPile([firstDiscard]);
    setActiveColor(firstDiscard.color as any);
    setCurrentPlayerIndex(0);
    setPlayDirection('clockwise');
    setWinner(null);
    applyStateUpdate('finishOrder', []);
    setGameState('playing');
    setUnoWindow(null);
    setCounterUnoWindow(null);
    setVoicePrompt(null);
    setJustDrewCard(null);
    setGameLogs([
      '🔴 New Round Started!',
      '🔀 Shuffled deck of 107 cards.',
      '🃏 Dealt 7 cards to everyone.',
      `🌟 First Discard: ${getCardLabel(firstDiscard)}`,
    ]);

    // REWORKED ULTRA-FAST BATCHED DEALING ANIMATION (7 Waves, 70ms wave stagger, 180ms flight duration)
    const newFlyingCards: FlyingCardData[] = [];
    let stepCount = 0;

    for (let cardIdx = 0; cardIdx < 7; cardIdx++) {
      const waveDelay = cardIdx * 0.07;
      updatedPlayers.forEach((player, pIdx) => {
        stepCount++;
        const isUser = player.id === myPlayerId;
        const targetEl = isUser ? userHandRef.current : opponentRefs.current[player.id];
        const drawPos = getElementCenter(drawPileRef.current, { x: window.innerWidth * 0.38, y: window.innerHeight * 0.45 });
        const targetPos = getElementCenter(targetEl, isUser
          ? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 }
          : { x: window.innerWidth * (pIdx === 0 ? 0.3 : 0.7), y: window.innerHeight * 0.15 }
        );

        const card = isUser ? player.cards[cardIdx] : undefined;
        const animId = `deal_${player.id}_${cardIdx}`;

        newFlyingCards.push({
          id: animId,
          card,
          from: drawPos,
          to: targetPos,
          duration: 0.18,
          delay: waveDelay + pIdx * 0.015,
          isCardBack: !isUser,
          startRotation: (pIdx - 1) * 8,
          endRotation: 0,
          onLanding: pIdx === updatedPlayers.length - 1 ? () => {
            setVisibleHandCounts((prev) => {
              const nextCounts = { ...prev };
              updatedPlayers.forEach((p) => {
                nextCounts[p.id] = cardIdx + 1;
              });
              return nextCounts;
            });
          } : undefined,
        });
      });
    }

    // Animate first discard card to center pile
    const discardPos = getElementCenter(discardPileRef.current, { x: window.innerWidth * 0.62, y: window.innerHeight * 0.45 });
    const drawPos = getElementCenter(drawPileRef.current, { x: window.innerWidth * 0.38, y: window.innerHeight * 0.45 });
    const discardAnimId = `deal_discard_${firstDiscard.id}`;

    newFlyingCards.push({
      id: discardAnimId,
      card: firstDiscard,
      from: drawPos,
      to: discardPos,
      duration: 0.18,
      delay: 7 * 0.07 + 0.04,
      isCardBack: false,
      startRotation: Math.random() * 20 - 10,
      endRotation: 0,
      onLanding: () => {
        setVisibleDiscardPile([firstDiscard]);
        setIsDealing(false);
      },
    });

    setFlyingCards(newFlyingCards);

    // Safety completion timer ensuring UI transitions even if animation frame is dropped
    const maxDealingMs = Math.ceil((7 * 0.07 + 0.3) * 1000);
    const timer = setTimeout(() => {
      setIsDealing(false);
      const fullCounts: { [id: string]: number } = {};
      updatedPlayers.forEach((p) => { fullCounts[p.id] = p.cards.length; });
      setVisibleHandCounts(fullCounts);
      setVisibleDiscardPile([firstDiscard]);
    }, maxDealingMs);
    activeTimersRef.current.add(timer);
  };

  const isStartingRoundRef = useRef<boolean>(false);
  const actionLockRef = useRef<boolean>(false);
  useEffect(() => {
    actionLockRef.current = false;
  }, [syncedState]);

  useEffect(() => {
    if (isHost && (gameState === 'lobby' || syncedState.gameState === 'lobby') && !isStartingRoundRef.current) {
      isStartingRoundRef.current = true;
      startNewRound();
    } else if (gameState !== 'lobby' && syncedState.gameState !== 'lobby') {
      isStartingRoundRef.current = false;
    }
  }, [isHost, syncedState.gameState, gameState]);

  // ==========================================
  // CARD RULES & NAVIGATION UTILITIES
  // ==========================================
  const isCardPlayable = (card: UnoCard, playerChecking?: UnoPlayer): boolean => {
    const topCard = discardPile[discardPile.length - 1];
    if (!topCard) return false;

    // Wild cards are always playable
    if (card.color === 'wild') {
      // Wild Draw Four can only be played if the player has no card matching the active color
      if (card.value === 'wild4') {
        const target = playerChecking || activePlayer;
        const matchesColor = target?.cards?.some((c) => c.color !== 'wild' && c.color === activeColor);
        return !matchesColor;
      }
      return true;
    }

    // Matches active color or value/symbol
    return card.color === activeColor || card.value === topCard.value;
  };

  const getNextPlayerIndex = (
    steps: number,
    currentList: UnoPlayer[],
    customDir?: 'clockwise' | 'counter-clockwise',
    fromIdx?: number
  ): number => {
    const listLength = currentList.length;
    if (listLength === 0) return 0;
    const currentIdx = currentList.findIndex((p) => p.id === activePlayerId);
    const baseIdx = fromIdx !== undefined ? fromIdx : (currentIdx !== -1 ? currentIdx : currentPlayerIndex);
    const dir = customDir || playDirection;
    const stepDirection = dir === 'clockwise' ? 1 : -1;

    let curr = baseIdx;
    let activeSteps = 0;
    let fallbackActiveIdx = -1;

    for (let i = 0; i < listLength * 4; i++) {
      curr = (curr + stepDirection) % listLength;
      if (curr < 0) curr += listLength;
      if (currentList[curr] && currentList[curr].cards.length > 0 && !currentList[curr].finishedRank) {
        if (fallbackActiveIdx === -1) fallbackActiveIdx = curr;
        activeSteps++;
        if (activeSteps === steps) {
          return curr;
        }
      }
    }
    if (fallbackActiveIdx !== -1) return fallbackActiveIdx;
    return (baseIdx + (dir === 'clockwise' ? 1 : -1) + listLength) % listLength;
  };

  // Elimination & Finish Handler:
  // When a player reaches 0 cards, they finish and claim their rank (1st, 2nd, 3rd, etc.).
  // They become a spectator while remaining active players continue until only 1 player is left.
  const handlePlayerFinished = (
    finishingPlayer: UnoPlayer,
    currentPlayersList: UnoPlayer[],
    cardPlayed: UnoCard,
    chosenWildColor?: 'red' | 'yellow' | 'green' | 'blue' | null
  ) => {
    // 1. Calculate finish order & placement rank
    const existingFinishOrder = [
      ...(pendingState.current?.finishOrder !== undefined
        ? pendingState.current.finishOrder
        : finishOrder),
    ];
    if (!existingFinishOrder.includes(finishingPlayer.id)) {
      existingFinishOrder.push(finishingPlayer.id);
    }
    const earnedRank = existingFinishOrder.length; // 1 for 1st, 2 for 2nd, etc.

    // 2. Mark this player as finished with 0 cards and their finishing rank
    let updatedPlayers = currentPlayersList.map((p) =>
      p.id === finishingPlayer.id
        ? { ...p, cards: [], declaredUno: false, finishedRank: earnedRank }
        : p
    );

    // If 1st place winner, set initial winner reference and trigger victory sound
    if (earnedRank === 1) {
      const winnerPlayer = updatedPlayers.find((p) => p.id === finishingPlayer.id) || finishingPlayer;
      setWinner(winnerPlayer);
      if (finishingPlayer.id === myPlayerId) {
        audioManager.playVictory();
      }
    } else if (finishingPlayer.id === myPlayerId) {
      audioManager.playVictory();
    }

    if (cardPlayed && !finishingPlayer.id.startsWith('bot-') && !finishingPlayer.id.startsWith('ai-bot-')) {
      UnoAiBrain.recordHumanMove(cardPlayed, 0);
    }

    const rankTitle = getOrdinal(earnedRank);
    addLog(`🏆 ${finishingPlayer.name} finished all cards and claimed ${rankTitle} Place!`);

    // 3. Count remaining active players (players who still have cards and are not yet finished)
    const activeRemaining = updatedPlayers.filter((p) => p.cards.length > 0 && !p.finishedRank);

    // Case A: 1 or fewer active players remain -> Entire UNO Match Ends!
    if (activeRemaining.length <= 1) {
      if (activeRemaining.length === 1) {
        const lastPlayer = activeRemaining[0];
        const lastRank = existingFinishOrder.length + 1;
        if (!existingFinishOrder.includes(lastPlayer.id)) {
          existingFinishOrder.push(lastPlayer.id);
        }
        updatedPlayers = updatedPlayers.map((p) =>
          p.id === lastPlayer.id ? { ...p, finishedRank: lastRank } : p
        );
        addLog(`🏁 ${lastPlayer.name} is the final remaining player (${getOrdinal(lastRank)} Place).`);
      }

      applyStateUpdate('finishOrder', existingFinishOrder);
      setPlayers(updatedPlayers);

      const firstWinnerId = existingFinishOrder[0];
      const firstWinner = updatedPlayers.find((p) => p.id === firstWinnerId) || finishingPlayer;
      setWinner(firstWinner);
      setGameState('winner');

      if (firstWinnerId !== myPlayerId && earnedRank !== 1) {
        audioManager.playLoss();
      }
      UnoAiBrain.recordGameOutcome(firstWinnerId === myPlayerId);
      addLog(`🎉 Match Finished! Final placement rankings established.`);
      return;
    }

    // Case B: 2 or more active players remain -> Match Continues! Finished player becomes spectator.
    applyStateUpdate('finishOrder', existingFinishOrder);
    setPlayers(updatedPlayers);

    // Advance turn to next active player, applying action card if applicable
    const baseIdx = updatedPlayers.findIndex((p) => p.id === finishingPlayer.id);

    if (
      cardPlayed.value === 'skip' ||
      cardPlayed.value === 'reverse' ||
      cardPlayed.value === 'draw2' ||
      cardPlayed.value === 'wild4' ||
      chosenWildColor
    ) {
      applyCardActionAndAdvance(cardPlayed, chosenWildColor || null, updatedPlayers, false, baseIdx);
    } else {
      const nextTurnIndex = getNextPlayerIndex(1, updatedPlayers, playDirection, baseIdx);
      setCurrentPlayerIndex(nextTurnIndex);
      setAiTurnTick((t) => t + 1);
    }
  };

  // ==========================================
  // OFFLINE AI TURN DECISION ENGINE
  // ==========================================
  const isAiThinkingRef = useRef<boolean>(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pickBestWildColorForAi = (hand: UnoCard[]): 'red' | 'yellow' | 'green' | 'blue' => {
    const counts: Record<'red' | 'yellow' | 'green' | 'blue', number> = {
      red: 0,
      yellow: 0,
      green: 0,
      blue: 0,
    };
    hand.forEach((c) => {
      if (c.color !== 'wild') {
        counts[c.color] = (counts[c.color] || 0) + 1;
      }
    });

    let bestColor: 'red' | 'yellow' | 'green' | 'blue' = 'red';
    let maxCount = -1;

    (Object.keys(counts) as Array<'red' | 'yellow' | 'green' | 'blue'>).forEach((color) => {
      if (counts[color] > maxCount) {
        maxCount = counts[color];
        bestColor = color;
      }
    });

    return bestColor;
  };

  const runAiTurnLogic = (aiPlayer: UnoPlayer) => {
    const difficulty = aiConfig?.difficulty || 'medium';
    const playableCards = aiPlayer.cards.filter((c) => isCardPlayable(c, aiPlayer));

    // 1. NO LEGAL CARDS: AI MUST DRAW
    if (playableCards.length === 0) {
      let currentDeck = [...drawPile];
      if (currentDeck.length === 0) {
        currentDeck = replenishDrawPile();
      }
      if (currentDeck.length === 0) {
        // Pass turn if completely empty
        const currentIdx = players.findIndex((p) => p.id === aiPlayer.id);
        const nextIndex = getNextPlayerIndex(1, players, playDirection, currentIdx);
        setCurrentPlayerIndex(nextIndex);
        setAiTurnTick((t) => t + 1);
        return;
      }

      const drawnCard = currentDeck.shift()!;
      setDrawPile(currentDeck);

      const updatedHand = [...aiPlayer.cards, drawnCard];
      const updatedPlayers = players.map((p) =>
        p.id === aiPlayer.id ? { ...p, cards: updatedHand } : p
      );
      setPlayers(updatedPlayers);
      addLog(`🃏 ${aiPlayer.name} drew a card.`);

      // Check if drawn card can be played immediately
      const topDiscard = discardPile[discardPile.length - 1];
      const isDrawnPlayable =
        drawnCard.color === 'wild' ||
        drawnCard.color === activeColor ||
        (topDiscard && drawnCard.value === topDiscard.value);

      let shouldPlayDrawn = false;
      if (isDrawnPlayable) {
        if (difficulty === 'easy') {
          shouldPlayDrawn = Math.random() < 0.5;
        } else {
          shouldPlayDrawn = true;
        }
      }

      if (shouldPlayDrawn) {
        addLog(`✨ ${aiPlayer.name} plays drawn card: ${getCardLabel(drawnCard)}`);
        
        const finalHand = updatedHand.filter((c) => c.id !== drawnCard.id);
        const finalPlayers = updatedPlayers.map((p) =>
          p.id === aiPlayer.id ? { ...p, cards: finalHand, declaredUno: finalHand.length === 1 ? false : p.declaredUno } : p
        );

        const newDiscard = [...discardPile, drawnCard];
        setDiscardPile(newDiscard);
        if (drawnCard.color !== 'wild') {
          setActiveColor(drawnCard.color as any);
        }

        if (finalHand.length === 0) {
          const chosenColor = drawnCard.color === 'wild' ? pickBestWildColorForAi(finalHand) : null;
          handlePlayerFinished(aiPlayer, finalPlayers, drawnCard, chosenColor);
          return;
        }

        let isUno = finalHand.length === 1;
        if (isUno) {
          if (difficulty === 'easy' && Math.random() < 0.3) {
            setCounterUnoWindow({ active: true, playerId: aiPlayer.id });
            addLog(`⚡ ${aiPlayer.name} forgot to declare UNO!`);
          } else {
            addLog(`📣 ${aiPlayer.name} declared UNO!`);
            finalPlayers.forEach(p => { if (p.id === aiPlayer.id) p.declaredUno = true; });
          }
        }

        if (drawnCard.color === 'wild') {
          const chosenColor = pickBestWildColorForAi(finalHand);
          applyCardActionAndAdvance(drawnCard, chosenColor, finalPlayers, isUno);
        } else {
          applyCardActionAndAdvance(drawnCard, null, finalPlayers, isUno);
        }
      } else {
        // Pass turn to next active player
        const currentIdx = updatedPlayers.findIndex((p) => p.id === aiPlayer.id);
        const nextIndex = getNextPlayerIndex(1, updatedPlayers, playDirection, currentIdx);
        setCurrentPlayerIndex(nextIndex);
        setAiTurnTick((t) => t + 1);
      }
      return;
    }

    // 2. HAS PLAYABLE CARDS: PICK BEST CARD BASED ON LEARNING ENGINE & DIFFICULTY
    const topDiscardCard = discardPile[discardPile.length - 1] || null;

    const decision = selectBestUnoPlay({
      aiPlayer,
      allPlayers: players,
      playableCards,
      activeColor,
      topDiscard: topDiscardCard,
      playDirection: playDirection === 'clockwise' ? 'clockwise' : 'counterclockwise',
      difficulty,
    });

    const chosenCard = decision.chosenCard;

    // 3. EXECUTE AI PLAYING THE CHOSEN CARD
    const finalHand = aiPlayer.cards.filter((c) => c.id !== chosenCard.id);
    const finalPlayers = players.map((p) =>
      p.id === aiPlayer.id ? { ...p, cards: finalHand, declaredUno: finalHand.length === 1 ? false : p.declaredUno } : p
    );

    const newDiscard = [...discardPile, chosenCard];
    setDiscardPile(newDiscard);
    addLog(`✨ ${aiPlayer.name} played: ${getCardLabel(chosenCard)}`);

    if (finalHand.length === 0) {
      const chosenColor = chosenCard.color === 'wild' ? pickBestWildColorForAi(finalHand) : null;
      handlePlayerFinished(aiPlayer, finalPlayers, chosenCard, chosenColor);
      return;
    }

    let isUno = finalHand.length === 1;
    if (isUno) {
      if (difficulty === 'easy' && Math.random() < 0.3) {
        setCounterUnoWindow({ active: true, playerId: aiPlayer.id });
        addLog(`⚡ ${aiPlayer.name} forgot to declare UNO!`);
      } else {
        addLog(`📣 ${aiPlayer.name} declared UNO!`);
        finalPlayers.forEach(p => { if (p.id === aiPlayer.id) p.declaredUno = true; });
      }
    }

    if (chosenCard.color === 'wild') {
      const chosenColor = pickBestWildColorForAi(finalHand);
      applyCardActionAndAdvance(chosenCard, chosenColor, finalPlayers, isUno);
    } else {
      applyCardActionAndAdvance(chosenCard, null, finalPlayers, isUno);
    }
  };

  useEffect(() => {
    if (!isAiMode) return;
    if (gameState !== 'playing' || isDealing || flyingCards.length > 0) return;

    const currentTurnPlayer = players.find((p) => p.id === activePlayerId) || players[currentPlayerIndex];
    if (!currentTurnPlayer || !currentTurnPlayer.id.startsWith('ai-bot-')) return;

    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    if (isAiThinkingRef.current) return;
    isAiThinkingRef.current = true;

    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      isAiThinkingRef.current = false;
      runAiTurnLogic(currentTurnPlayer);
    }, 850 + Math.random() * 350);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      isAiThinkingRef.current = false;
    };
  }, [isAiMode, activePlayerId, gameState, isDealing, flyingCards.length, players, currentPlayerIndex, aiTurnTick]);


  // ==========================================
  // OFFLINE MULTIPLAYER DISCONNECT MONITOR
  // ==========================================
  useEffect(() => {
    if (!isHost || isAiMode || gameState !== 'playing' || isDealing || flyingCards.length > 0) return;

    const currentTurnPlayer = players.find((p) => p.id === activePlayerId) || players[currentPlayerIndex];
    if (!currentTurnPlayer || currentTurnPlayer.id.startsWith('ai-bot-') || currentTurnPlayer.id.startsWith('bot-')) return;

    // Check if player is missing from the active room members
    const isPlayerInRoom = joinedRoom?.players?.some((p: any) => p.id === currentTurnPlayer.id);
    if (isPlayerInRoom === false) {
      const timeoutId = setTimeout(() => {
        let tempDrawPile = [...drawPile];
        let drawnCard = null;
        if (tempDrawPile.length === 0) {
           // Basic replenish logic if empty to prevent crash
           const remaining = [...discardPile];
           if (remaining.length > 1) {
             const topCard = remaining.pop();
             tempDrawPile = remaining.sort(() => Math.random() - 0.5);
             applyStateUpdate('discardPile', [topCard]);
           }
        }
        
        const updatedPlayers = [...players];
        const pIdx = updatedPlayers.findIndex(p => p.id === currentTurnPlayer.id);
        
        if (tempDrawPile.length > 0) {
          drawnCard = tempDrawPile.pop()!;
          applyStateUpdate('drawPile', tempDrawPile);
          if (pIdx !== -1) {
             updatedPlayers[pIdx] = {
               ...updatedPlayers[pIdx],
               cards: [...updatedPlayers[pIdx].cards, drawnCard]
             };
          }
        }
        
        applyStateUpdate('players', updatedPlayers);
        addLog('⚠️ ' + currentTurnPlayer.name + ' is offline. Turn auto-skipped.');
        
        const shift = playDirection === 'clockwise' ? 1 : -1;
        let nextTurnIndex = (currentPlayerIndex + shift) % updatedPlayers.length;
        if (nextTurnIndex < 0) nextTurnIndex += updatedPlayers.length;
        applyStateUpdate('currentPlayerIndex', nextTurnIndex);
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [isHost, isAiMode, gameState, isDealing, flyingCards.length, players, activePlayerId, currentPlayerIndex, joinedRoom?.players, drawPile, discardPile, playDirection]);

  // Get Card Label for logs
  const getCardLabel = (card: UnoCard): string => {
    const colorEmoji = {
      red: '🔴',
      yellow: '🟡',
      green: '🟢',
      blue: '🔵',
      wild: '🌈',
    }[card.color];

    const valueLabel = {
      skip: 'Skip 🚫',
      reverse: 'Reverse 🔄',
      draw2: 'Draw Two ✌️',
      wild: 'Wild Card 🎭',
      wild4: 'Wild Draw Four 💥',
    }[card.value] || card.value;

    return `${colorEmoji} ${card.color.toUpperCase()} ${valueLabel}`;
  };

  const activePlayer = players.find((p) => p.id === activePlayerId) || players[currentPlayerIndex] || players[0];

  // 4. SPEECH RECOGNITION (Voice UNO)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();

        if (transcript.includes('uno') || transcript.includes('ono') || transcript.includes('you know')) {
          handleUnoSuccess(activePlayerId || myPlayerId, 'voice');
        } else {
          // Speak detected but uncertain!
          setVoicePrompt({
            active: true,
            text: `System detected "${transcript}". Did you mean to declare UNO?`,
          });
        }
      };

      rec.onerror = (err: any) => {
        console.warn('Speech Recognition error:', err.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      return () => {
        try {
          rec.abort();
        } catch (e) {}
      };
    }
  }, [activePlayerId, myPlayerId]);

  // Activate microphone listening only during the user's UNO window
  useEffect(() => {
    if (
      isMicEnabled && 
      unoWindow?.active && 
      unoWindow.playerId === myPlayerId && 
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already listening
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  }, [unoWindow, isMicEnabled]);

  // 5. UNO WINDOW TIMEOUT (auto-penalize if the player doesn't call UNO in time)
  // NOTE: this used to tick a `unoTimeLeft` state value down every 100ms via
  // setInterval purely to trigger a timeout after ~1s — but that state was never
  // actually read anywhere in the JSX (the "UNO!" button's pulse is pure CSS).
  // Every one of those ~10 state updates/second re-rendered this entire
  // 2800-line component (recomputing the whole hand's fan-layout, playability
  // checks, etc. each time), which is a real, easily-avoidable source of jank
  // every single time an UNO call window opens. A single setTimeout achieves
  // the same behavior (auto-miss after 1s) with zero extra re-renders.
  useEffect(() => {
    if (unoWindow?.active) {
      const timer = setTimeout(() => {
        if (isHost) {
          handleUnoMissed(unoWindow.playerId);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [unoWindow?.active, unoWindow?.playerId, isHost]);

  const handleUnoSuccess = (playerId: string, method: 'button' | 'voice') => {
    setUnoWindow(null);
    setVoicePrompt(null);
    const sourcePlayer = players.find((p) => p.id === playerId);
    if (sourcePlayer?.finishedRank || sourcePlayer?.cards.length === 0) return;
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, declaredUno: true } : p))
    );
    if (sourcePlayer) {
      addLog(`🗣️ ${sourcePlayer.name} successfully declared UNO via ${method === 'voice' ? 'microphone 🎙️' : 'button 👆'}!`);
    }
  };

  const handleUnoMissed = (playerId: string) => {
    setUnoWindow(null);
    setVoicePrompt(null);
    
    // If the player missed declaration, open Counter UNO window for OTHER players to catch them!
    const targetPlayer = players.find((p) => p.id === playerId);
    if (targetPlayer && targetPlayer.cards.length === 1 && !targetPlayer.finishedRank) {
      setCounterUnoWindow({
        active: true,
        playerId,
      });
      addLog(`⚡ ${targetPlayer.name} forgot to say UNO! "Counter UNO" window is active!`);
    }
  };

  // Auto-skip turn if current turn index points to an already finished player
  useEffect(() => {
    if (gameState !== 'playing' || isDealing) return;
    const currentTurnPlayer = players[currentPlayerIndex];
    if (currentTurnPlayer && (currentTurnPlayer.finishedRank || currentTurnPlayer.cards.length === 0)) {
      const activeCount = players.filter((p) => p.cards.length > 0 && !p.finishedRank).length;
      if (activeCount > 1) {
        const nextIndex = getNextPlayerIndex(1, players, playDirection, currentPlayerIndex);
        if (nextIndex !== currentPlayerIndex) {
          setCurrentPlayerIndex(nextIndex);
          setAiTurnTick((t) => t + 1);
        }
      }
    }
  }, [currentPlayerIndex, players, gameState, isDealing, playDirection]);

  // 6. ACTION TRIGGERS & CARD PLAYABILITY RULES
  const playCard = (cardId: string) => {
    if (gameState !== 'playing' || isDealing) return;
    if (!isMyTurn || actionLockRef.current) return;
    if (myPlayer?.finishedRank || userCards.length === 0) return;

    const cardToPlay = activePlayer.cards.find((c) => c.id === cardId);
    if (!cardToPlay || !isCardPlayable(cardToPlay)) return;

    actionLockRef.current = true;

    audioManager.playCardPlace();
    setAnimatingPlayCardId(cardId);

    // VISUAL CARD MOVEMENT: Hand -> Discard Pile
    const cardEl = userCardRefs.current[cardId] || userHandRef.current;
    const startPos = getElementCenter(cardEl, { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 });
    const discardPos = getElementCenter(discardPileRef.current, { x: window.innerWidth * 0.62, y: window.innerHeight * 0.45 });

    const animId = `play_${cardId}_${Date.now()}`;
    processedAnimKeys.current.add(`play_${cardId}`);

    setFlyingCards((prev) => [
      ...prev,
      {
        id: animId,
        card: cardToPlay,
        from: startPos,
        to: discardPos,
        duration: 0.22,
        isCardBack: false,
        startRotation: Math.random() * 10 - 5,
        endRotation: Math.random() * 24 - 12,
        onLanding: () => {
          setVisibleDiscardPile((prevPile) => [...prevPile, cardToPlay]);
          setAnimatingPlayCardId(null);
        },
      },
    ]);

    executePlayCard(activePlayer.id, cardToPlay);
  };

  // Drag-and-drop & touch interaction tracking for UNO cards (RAF-throttled for 60fps responsiveness)
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!draggedCardState) return;

    const flushDragPos = () => {
      dragRafRef.current = null;
      if (pendingDragPosRef.current) {
        const { x, y } = pendingDragPosRef.current;
        setDraggedCardState((prev) => (prev ? { ...prev, x, y } : null));
      }
    };

    const scheduleDragPos = (x: number, y: number) => {
      pendingDragPosRef.current = { x, y };
      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(flushDragPos);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      scheduleDragPos(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        scheduleDragPos(touch.clientX, touch.clientY);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!draggedCardState) return;
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      const clientX = e.clientX;
      const clientY = e.clientY;
      const dx = clientX - draggedCardState.startX;
      const dy = clientY - draggedCardState.startY;
      const dist = Math.hypot(dx, dy);

      const isDraggedToTable = dy < -30 || clientY < window.innerHeight * 0.74;
      const isTap = dist < 8;

      if ((isTap || isDraggedToTable) && draggedCardState.playable) {
        playCard(draggedCardState.card.id);
      }
      setDraggedCardState(null);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!draggedCardState) return;
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      const lastTouch = e.changedTouches[0];
      const clientX = lastTouch ? lastTouch.clientX : draggedCardState.x;
      const clientY = lastTouch ? lastTouch.clientY : draggedCardState.y;
      const dx = clientX - draggedCardState.startX;
      const dy = clientY - draggedCardState.startY;
      const dist = Math.hypot(dx, dy);

      const isDraggedToTable = dy < -30 || clientY < window.innerHeight * 0.74;
      const isTap = dist < 8;

      if ((isTap || isDraggedToTable) && draggedCardState.playable) {
        playCard(draggedCardState.card.id);
      }
      setDraggedCardState(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [draggedCardState]);

  const handleCardPointerDown = (e: React.PointerEvent, card: UnoCard, playable: boolean) => {
    if (!playable || !isMyTurn || gameState !== 'playing' || isDealing) return;
    if (myPlayer?.finishedRank || userCards.length === 0) return;
    setDraggedCardState({
      card,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      playable,
    });
  };

  const handleCardTouchStart = (e: React.TouchEvent, card: UnoCard, playable: boolean) => {
    if (!playable || !isMyTurn || gameState !== 'playing' || isDealing) return;
    if (myPlayer?.finishedRank || userCards.length === 0) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setDraggedCardState({
        card,
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
        playable,
      });
    }
  };

  const executePlayCard = (playerId: string, card: UnoCard) => {
    // 1. Remove card from hand
    let cardOwner = players.find((p) => p.id === playerId)!;
    const updatedHand = cardOwner.cards.filter((c) => c.id !== card.id);

    // Update players state immediately
    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          cards: updatedHand,
          declaredUno: updatedHand.length === 1 ? false : p.declaredUno, // reset
        };
      }
      return p;
    });

    // 2. Add to discard pile
    const newDiscardPile = [...discardPile, card];
    setDiscardPile(newDiscardPile);
    setActiveColor(card.color !== 'wild' ? card.color : activeColor);
    setJustDrewCard(null);

    // Record human move to train AI brain
    if (!playerId.startsWith('bot-')) {
      UnoAiBrain.recordHumanMove(card, updatedHand.length);
    }

    addLog(`✨ ${cardOwner.name} played: ${getCardLabel(card)}`);

    // 3. Check for Win / Finish condition
    if (updatedHand.length === 0) {
      const chosenColor = card.color === 'wild' ? (activeColor || 'red') : null;
      handlePlayerFinished(cardOwner, updatedPlayers, card, chosenColor);
      return;
    }

    // 4. Handle UNO 1-card event
    let isUnoTriggered = false;
    if (updatedHand.length === 1) {
      isUnoTriggered = true;
      setPlayers(updatedPlayers);
      
      // Open 1-second countdown window for UNO declaration
      setUnoWindow({
        active: true,
        playerId: cardOwner.id,
      });
    } else {
      setPlayers(updatedPlayers);
    }

    // 5. Apply card action and step to next player
    if (card.color === 'wild') {
      setSelectedWildType(card.value as any);
      // Wait for card to visibly travel to center before opening color picker modal
      setTimeout(() => {
        setGameState('color_picker');
      }, 360);
    } else {
      applyCardActionAndAdvance(card, null, updatedPlayers, isUnoTriggered);
    }
  };

  // Color picker selection handler for human player
  const selectWildColor = (color: 'red' | 'yellow' | 'green' | 'blue') => {
    if (!isMyTurn || actionLockRef.current) return;
    actionLockRef.current = true;
    const cardValue = selectedWildType || 'wild';
    const currentCard: UnoCard = { id: `selected-wild`, color: 'wild', value: cardValue };
    
    // Train AI learning service on human color preference
    UnoAiBrain.recordWildChoice(color);

    setGameState('playing');
    setSelectedWildType(null);
    applyCardActionAndAdvance(currentCard, color, players, false);
  };

  const applyCardActionAndAdvance = (
    card: UnoCard,
    chosenWildColor: 'red' | 'yellow' | 'green' | 'blue' | null,
    currentPlayersList: UnoPlayer[],
    isUnoTriggered: boolean,
    customBaseIdx?: number
  ) => {
    let skipCount = 1;
    let cardsToDraw = 0;
    let message = '';

    const currentIdx = currentPlayersList.findIndex((p) => p.id === activePlayerId);
    const baseIdx = customBaseIdx !== undefined ? customBaseIdx : (currentIdx !== -1 ? currentIdx : currentPlayerIndex);

    // Set wild color if chosen
    if (chosenWildColor) {
      setActiveColor(chosenWildColor);
      addLog(`🌈 Color chosen: ${chosenWildColor.toUpperCase()}`);
    }

    let effectiveDir = playDirection;

    // Determine card action
    if (card.value === 'skip') {
      skipCount = 2; // skips next active player
      const nextIdx = getNextPlayerIndex(1, currentPlayersList, effectiveDir, baseIdx);
      const skippedPlayer = currentPlayersList[nextIdx];
      message = `🚫 ${skippedPlayer?.name || 'Player'} was skipped!`;
    } else if (card.value === 'reverse') {
      const newDir = playDirection === 'clockwise' ? 'counter-clockwise' : 'clockwise';
      setPlayDirection(newDir);
      effectiveDir = newDir;
      message = `🔄 Direction of play changed to ${newDir.toUpperCase()}!`;
      
      const activeCount = currentPlayersList.filter(p => p.cards.length > 0 && !p.finishedRank).length;
      if (activeCount === 2) {
        skipCount = 2; // with 2 active players, reverse acts like a skip
      }
    } else if (card.value === 'draw2') {
      cardsToDraw = 2;
      skipCount = 2; // draws and is skipped
      const targetIdx = getNextPlayerIndex(1, currentPlayersList, effectiveDir, baseIdx);
      const skippedPlayer = currentPlayersList[targetIdx];
      message = `✌️ ${skippedPlayer?.name || 'Player'} draws 2 cards and loses their turn!`;
    } else if (card.value === 'wild4') {
      cardsToDraw = 4;
      skipCount = 2; // draws and is skipped
      const targetIdx = getNextPlayerIndex(1, currentPlayersList, effectiveDir, baseIdx);
      const skippedPlayer = currentPlayersList[targetIdx];
      message = `💥 ${skippedPlayer?.name || 'Player'} draws 4 cards and loses their turn!`;
    }

    if (message) {
      addLog(message);
    }

    // Apply draw penalty to target player
    let tempPlayersList = [...currentPlayersList];
    if (cardsToDraw > 0) {
      const targetIndex = getNextPlayerIndex(1, currentPlayersList, effectiveDir, baseIdx);
      const targetPlayer = currentPlayersList[targetIndex];
      const isTargetUser = targetPlayer?.id === myPlayerId;

      if (targetPlayer) {
        const penaltyCards: UnoCard[] = [];
        let tempDrawPile = [...drawPile];

        for (let i = 0; i < cardsToDraw; i++) {
          if (tempDrawPile.length === 0) {
            tempDrawPile = replenishDrawPile();
          }
          if (tempDrawPile.length > 0) {
            penaltyCards.push(tempDrawPile.shift()!);
          }
        }

        setDrawPile(tempDrawPile);

        // VISUAL MOVEMENT ANIMATION FOR PENALTY CARDS (+2 or +4)
        const drawPos = getElementCenter(drawPileRef.current, { x: window.innerWidth * 0.38, y: window.innerHeight * 0.45 });
        const targetEl = isTargetUser ? userHandRef.current : opponentRefs.current[targetPlayer.id];
        const targetPos = getElementCenter(targetEl, isTargetUser
          ? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 }
          : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.15 }
        );

        const startCount = visibleHandCounts[targetPlayer.id] ?? targetPlayer.cards.length;
        setVisibleHandCounts((prev) => ({ ...prev, [targetPlayer.id]: startCount }));

        // Animate penalty cards staggered one by one from Draw Pile -> Affected Player Hand
        const newFlyingCards: FlyingCardData[] = [];
        penaltyCards.forEach((pCard, idx) => {
          const animId = `penalty_${targetPlayer.id}_${pCard.id}_${Date.now()}_${idx}`;
          processedAnimKeys.current.add(`penalty_${pCard.id}`);

          newFlyingCards.push({
            id: animId,
            card: isTargetUser ? pCard : undefined,
            from: drawPos,
            to: targetPos,
            duration: 0.38,
            delay: 0.18 + idx * 0.14,
            isCardBack: !isTargetUser,
            startRotation: Math.random() * 24 - 12,
            endRotation: Math.random() * 10 - 5,
            onLanding: () => {
              setVisibleHandCounts((prev) => ({
                ...prev,
                [targetPlayer.id]: startCount + idx + 1,
              }));
            },
          });
        });

        setFlyingCards((prev) => [...prev, ...newFlyingCards]);

        tempPlayersList = currentPlayersList.map((p, idx) => {
          if (idx === targetIndex) {
            return {
              ...p,
              cards: [...p.cards, ...penaltyCards],
              declaredUno: false, // reset uno
            };
          }
          return p;
        });

        setPlayers(tempPlayersList);
      }
    } else {
      setPlayers(tempPlayersList);
    }

    // Advance turn index relative to baseIdx using the effective direction & skipping finished players
    const nextTurnIndex = getNextPlayerIndex(skipCount, tempPlayersList, effectiveDir, baseIdx);

    // If UNO window is still running, wait a moment to preserve UX flow before switching turn index
    if (isUnoTriggered) {
      setTimeout(() => {
        setCurrentPlayerIndex(nextTurnIndex);
        setCounterUnoWindow(null);
        setAiTurnTick((t) => t + 1);
      }, 1100);
    } else {
      setCurrentPlayerIndex(nextTurnIndex);
      setCounterUnoWindow(null);
      setAiTurnTick((t) => t + 1);
    }
  };

  // 7. DRAW CARD ACTION
  const drawCard = () => {
    if (gameState !== 'playing' || isDealing) return;
    if (!isMyTurn || actionLockRef.current) return;
    if (myPlayer?.finishedRank || userCards.length === 0) return;
    actionLockRef.current = true;

    audioManager.playCardPick();

    let tempDrawPile = [...drawPile];
    if (tempDrawPile.length === 0) {
      tempDrawPile = replenishDrawPile();
    }

    const drawn = tempDrawPile.shift()!;
    setDrawPile(tempDrawPile);

    const userPlayer = players.find((p) => p.id === myPlayerId);
    const currentCount = visibleHandCounts[myPlayerId] ?? (userPlayer?.cards.length || 0);
    setVisibleHandCounts((prev) => ({ ...prev, [myPlayerId]: currentCount }));

    // VISUAL CARD MOVEMENT: Draw Pile -> User Hand
    const drawPos = getElementCenter(drawPileRef.current, { x: window.innerWidth * 0.38, y: window.innerHeight * 0.45 });
    const handPos = getElementCenter(userHandRef.current, { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 });

    const animId = `draw_${drawn.id}_${Date.now()}`;
    processedAnimKeys.current.add(`draw_${drawn.id}`);

    setFlyingCards((prev) => [
      ...prev,
      {
        id: animId,
        card: drawn,
        from: drawPos,
        to: handPos,
        duration: 0.22,
        isCardBack: false,
        startRotation: Math.random() * 10 - 5,
        endRotation: Math.random() * 24 - 12,
        onLanding: () => {
          setVisibleHandCounts((prev) => ({
            ...prev,
            [myPlayerId]: currentCount + 1,
          }));
        },
      },
    ]);

    addLog(`📥 You drew a card: ${getCardLabel(drawn)}`);

    const playable = isCardPlayable(drawn);

    if (playable) {
      // Give the player option to play the drawn card immediately or keep it
      setJustDrewCard(drawn);
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === myPlayerId) {
            return { ...p, cards: [...p.cards, drawn] };
          }
          return p;
        })
      );
    } else {
      // Just add to hand and end turn
      const updatedPlayers = players.map((p) => {
        if (p.id === myPlayerId) {
          return { ...p, cards: [...p.cards, drawn], declaredUno: false };
        }
        return p;
      });
      setPlayers(updatedPlayers);

      // Next active player
      const currentIdx = players.findIndex((p) => p.id === activePlayerId);
      const baseIdx = currentIdx !== -1 ? currentIdx : currentPlayerIndex;
      const nextTurnIndex = getNextPlayerIndex(1, updatedPlayers, playDirection, baseIdx);
      setCurrentPlayerIndex(nextTurnIndex);
      setAiTurnTick((t) => t + 1);
    }
  };

  const playJustDrewCard = () => {
    if (!isMyTurn) return;
    if (!justDrewCard) return;
    const card = justDrewCard;
    setJustDrewCard(null);

    setAnimatingPlayCardId(card.id);

    const handPos = getElementCenter(userHandRef.current, { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 });
    const discardPos = getElementCenter(discardPileRef.current, { x: window.innerWidth * 0.62, y: window.innerHeight * 0.45 });

    const animId = `play_drawn_${card.id}_${Date.now()}`;
    setFlyingCards((prev) => [
      ...prev,
      {
        id: animId,
        card: card,
        from: handPos,
        to: discardPos,
        duration: 0.22,
        isCardBack: false,
        startRotation: Math.random() * 10 - 5,
        endRotation: Math.random() * 24 - 12,
        onLanding: () => {
          setVisibleDiscardPile((prevPile) => [...prevPile, card]);
          setAnimatingPlayCardId(null);
        },
      },
    ]);

    executePlayCard(myPlayerId, card);
  };

  const keepJustDrewCard = () => {
    if (!isMyTurn || actionLockRef.current) return;
    actionLockRef.current = true;
    setJustDrewCard(null);
    // Move turn to next player skipping finished players
    const currentIdx = players.findIndex((p) => p.id === activePlayerId);
    const baseIdx = currentIdx !== -1 ? currentIdx : currentPlayerIndex;
    const nextTurnIndex = getNextPlayerIndex(1, players, playDirection, baseIdx);
    setCurrentPlayerIndex(nextTurnIndex);
    setAiTurnTick((t) => t + 1);
  };

  // Shuffle remaining discard pile when draw pile is dry
  const replenishDrawPile = (): UnoCard[] => {
    setIsReshuffling(true);
    const remaining = [...discardPile];
    if (remaining.length === 0) {
      addLog('🔀 Generating fresh UNO deck!');
      const freshDeck = shuffleDeck(createUnoDeck());
      setTimeout(() => {
        setIsReshuffling(false);
      }, 1200);
      return freshDeck;
    }
    const topCard = remaining.pop()!;
    setDiscardPile([topCard]);
    addLog('🔀 Replenishing dry Draw Pile by shuffling Discard Pile!');
    
    // Smooth timer for the beautiful 3D rotating card deck reshuffle overlay
    setTimeout(() => {
      setIsReshuffling(false);
    }, 1500);

    return shuffleDeck(remaining);
  };

  // 8. COUNTER UNO TRIGGER
  const triggerCounterUno = () => {
    if (!counterUnoWindow?.active || actionLockRef.current) return;
    if (myPlayer?.finishedRank || userCards.length === 0) return;
    actionLockRef.current = true;

    const caughtId = counterUnoWindow.playerId;
    if (caughtId === myPlayerId) return;

    const caughtPlayer = players.find((p) => p.id === caughtId);

    if (!caughtPlayer || caughtPlayer.finishedRank || caughtPlayer.cards.length === 0) return;

    if (caughtPlayer.declaredUno) {
      // Target had already successfully declared UNO! No punishment.
      addLog(`🛡️ ${caughtPlayer.name} already successfully declared UNO! Counter failed.`);
      setCounterUnoWindow(null);
      return;
    }

    // Apply +2 cards penalty to target
    let tempDrawPile = [...drawPile];
    const penaltyCards: UnoCard[] = [];

    for (let i = 0; i < 2; i++) {
      if (tempDrawPile.length === 0) {
        tempDrawPile = replenishDrawPile();
      }
      penaltyCards.push(tempDrawPile.shift()!);
    }

    setDrawPile(tempDrawPile);

    const isCaughtUser = caughtId === myPlayerId;
    const drawPos = getElementCenter(drawPileRef.current, { x: window.innerWidth * 0.35, y: window.innerHeight * 0.45 });
    const targetEl = isCaughtUser ? userHandRef.current : opponentRefs.current[caughtId];
    const targetPos = getElementCenter(targetEl, isCaughtUser
      ? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 }
      : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.15 }
    );

    const startCount = visibleHandCounts[caughtId] ?? caughtPlayer.cards.length;
    setVisibleHandCounts((prev) => ({ ...prev, [caughtId]: startCount }));

    const newFlyingCards: FlyingCardData[] = [];
    penaltyCards.forEach((pCard, idx) => {
      const animId = `counter_penalty_${caughtId}_${pCard.id}_${Date.now()}_${idx}`;
      processedAnimKeys.current.add(`penalty_${pCard.id}`);

      newFlyingCards.push({
        id: animId,
        card: isCaughtUser ? pCard : undefined,
        from: drawPos,
        to: targetPos,
        duration: 0.38,
        delay: idx * 0.14,
        isCardBack: !isCaughtUser,
        startRotation: Math.random() * 24 - 12,
        endRotation: Math.random() * 10 - 5,
        onLanding: () => {
          setVisibleHandCounts((prev) => ({
            ...prev,
            [caughtId]: startCount + idx + 1,
          }));
        },
      });
    });

    setFlyingCards((prev) => [...prev, ...newFlyingCards]);

    const updatedPlayers = players.map((p) => {
      if (p.id === caughtId) {
        return {
          ...p,
          cards: [...p.cards, ...penaltyCards],
          declaredUno: false,
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    setCounterUnoWindow(null);
    
    addLog(`⚡ Sami (You) caught ${caughtPlayer.name} with Counter UNO! Dealt +2 cards penalty!`);
  };

  // 9. OPPONENT ACTIONS & FIRESTORE VISUAL SYNC
  const prevSyncedStateRef = useRef<{
    topDiscardId?: string;
    playerHandCounts: { [id: string]: number };
  }>({
    playerHandCounts: {},
  });

  useEffect(() => {
    if (gameState !== 'playing' || isDealing) return;

    const topDiscard = discardPile[discardPile.length - 1];
    const currentHandCounts: { [id: string]: number } = {};
    players.forEach((p) => {
      currentHandCounts[p.id] = p.cards.length;
    });

    const prev = prevSyncedStateRef.current;

    // 1. Check if top discard card changed from an opponent's play
    if (topDiscard && prev.topDiscardId && topDiscard.id !== prev.topDiscardId) {
      const animKey = `play_${topDiscard.id}`;
      if (!processedAnimKeys.current.has(animKey)) {
        processedAnimKeys.current.add(animKey);

        const activePlayerId = players[currentPlayerIndex]?.id;
        if (activePlayerId && activePlayerId !== myPlayerId) {
          const oppEl = opponentRefs.current[activePlayerId];
          const oppPos = getElementCenter(oppEl, { x: window.innerWidth * 0.5, y: window.innerHeight * 0.15 });
          const discardPos = getElementCenter(discardPileRef.current, { x: window.innerWidth * 0.62, y: window.innerHeight * 0.45 });

          const animId = `opp_play_${topDiscard.id}_${Date.now()}`;
          setFlyingCards((prevCards) => [
            ...prevCards,
            {
              id: animId,
              card: topDiscard,
              from: oppPos,
              to: discardPos,
              duration: 0.38,
              isCardBack: false,
              startRotation: Math.random() * 24 - 12,
              endRotation: Math.random() * 10 - 5,
              onLanding: () => {
                setVisibleDiscardPile((p) => [...p, topDiscard]);
              },
            },
          ]);
        }
      }
    }

    // 2. Check if opponent hand count increased (draw / penalty)
    players.forEach((p) => {
      if (p.id === myPlayerId) return;
      const prevCount = prev.playerHandCounts[p.id];
      if (prevCount !== undefined && p.cards.length > prevCount) {
        const addedCount = p.cards.length - prevCount;
        const animKey = `draw_${p.id}_${p.cards.length}`;
        if (!processedAnimKeys.current.has(animKey)) {
          processedAnimKeys.current.add(animKey);

          const drawPos = getElementCenter(drawPileRef.current, { x: window.innerWidth * 0.38, y: window.innerHeight * 0.45 });
          const oppEl = opponentRefs.current[p.id];
          const oppPos = getElementCenter(oppEl, { x: window.innerWidth * 0.5, y: window.innerHeight * 0.15 });

          const startCount = visibleHandCounts[p.id] ?? prevCount;
          const newFlyingCards: FlyingCardData[] = [];

          for (let i = 0; i < addedCount; i++) {
            const animId = `opp_draw_${p.id}_${i}_${Date.now()}`;
            newFlyingCards.push({
              id: animId,
              from: drawPos,
              to: oppPos,
              duration: 0.38,
              delay: i * 0.14,
              isCardBack: true,
              startRotation: Math.random() * 24 - 12,
              endRotation: Math.random() * 10 - 5,
              onLanding: () => {
                setVisibleHandCounts((prevCounts) => ({
                  ...prevCounts,
                  [p.id]: startCount + i + 1,
                }));
              },
            });
          }

          setFlyingCards((prevCards) => [...prevCards, ...newFlyingCards]);
        }
      }
    });

    prevSyncedStateRef.current = {
      topDiscardId: topDiscard?.id,
      playerHandCounts: currentHandCounts,
    };
  }, [discardPile, players, currentPlayerIndex, gameState, isDealing, getElementCenter, userProfile.id]);

  // Helper log addition
  const addLog = (text: string) => {
    setGameLogs((prev) => [...prev, text]);
  };

  // Color theme selectors
  const activeColorTheme = {
    red: 'border-red-500 text-red-500 bg-red-500/10 shadow-red-500/20',
    yellow: 'border-yellow-500 text-yellow-600 bg-yellow-500/10 shadow-yellow-500/20',
    green: 'border-green-500 text-green-500 bg-green-500/10 shadow-green-500/20',
    blue: 'border-blue-500 text-blue-500 bg-blue-500/10 shadow-blue-500/20',
  }[activeColor || 'red'] || 'border-[#989277] text-[#989277] bg-[#989277]/10';

  const userCards = players.find((p) => p.id === myPlayerId)?.cards || [];

  // Opponent seat sizing: with fewer opponents each seat gets more breathing
  // room and renders bigger. Now scales smoothly all the way up to 9
  // opponents (10-player games) instead of hard-capping at 3 — the strip
  // becomes horizontally swipeable past a certain count so seats never get
  // squeezed down to unreadable sizes.
  const opponentCount = players.filter((p) => p.id !== myPlayerId).length;
  const oppAvatarClass =
    opponentCount <= 1
      ? 'w-11 h-11 sm:w-14 sm:h-14'
      : opponentCount === 2
        ? 'w-9 h-9 sm:w-12 sm:h-12'
        : opponentCount <= 4
          ? 'w-8 h-8 sm:w-10 sm:h-10'
          : opponentCount <= 6
            ? 'w-7 h-7 sm:w-9 sm:h-9'
            : 'w-6 h-6 sm:w-8 sm:h-8';
  // Fanned card-back "hand" shown above each opponent seat in the strip.
  const oppCardBackClass =
    opponentCount <= 2
      ? 'w-5 sm:w-8 h-8 sm:h-12'
      : opponentCount <= 4
        ? 'w-5 sm:w-7 h-7 sm:h-11'
        : 'w-4 sm:w-6 h-6 sm:h-9';
  const oppFanHeightClass = opponentCount <= 2 ? 'h-8 sm:h-12' : 'h-7 sm:h-11';
  const oppNameTextClass = opponentCount <= 4 ? 'text-[9px] sm:text-[11px] max-w-[70px]' : 'text-[8px] sm:text-[10px] max-w-[52px]';

  // Center tabletop card sizing: baseline (full 4-player table, the most
  // crowded layout) is +30% over the original size; fewer opponents free up
  // table space so the draw/discard piles scale up further, matching the
  // opponent-seat sizing pattern above. The arena's own max-height grows in
  // step so the taller discard card never clips against the overflow-hidden
  // tabletop wrapper. Beyond 4 opponents the arena holds steady at its most
  // compact size rather than continuing to shrink — the discard/draw piles
  // stay big and legible no matter how many players are seated.
  const drawOuterClass =
    opponentCount <= 1
      ? 'w-[94px] h-[94px] sm:w-[134px] sm:h-[134px]'
      : opponentCount === 2
        ? 'w-[86px] h-[86px] sm:w-[122px] sm:h-[122px]'
        : 'w-[77px] h-[77px] sm:w-[109px] sm:h-[109px]';
  const drawInnerClass =
    opponentCount <= 1
      ? 'w-[61px] h-[61px] sm:w-[80px] sm:h-[80px]'
      : opponentCount === 2
        ? 'w-[55px] h-[55px] sm:w-[73px] sm:h-[73px]'
        : 'w-[49px] h-[49px] sm:w-[65px] sm:h-[65px]';
  const discardWidthClass =
    opponentCount <= 1
      ? 'w-[109px] sm:w-[147px]'
      : opponentCount === 2
        ? 'w-[99px] sm:w-[133px]'
        : 'w-[88px] sm:w-[120px]';
  const arenaMaxHClass =
    opponentCount <= 1
      ? 'max-h-[min(185px,28dvh)] sm:max-h-[min(240px,29dvh)]'
      : opponentCount === 2
        ? 'max-h-[min(172px,26dvh)] sm:max-h-[min(240px,29dvh)]'
        : 'max-h-[min(160px,25dvh)] sm:max-h-[min(240px,29dvh)]';
  const arenaGapClass =
    opponentCount <= 1
      ? 'gap-5 sm:gap-8'
      : opponentCount === 2
        ? 'gap-4 sm:gap-7'
        : 'gap-3 sm:gap-6';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full max-w-full pb-safe-bottom pt-safe-top px-safe-left px-safe-right select-none relative flex flex-col h-full flex-1 overflow-hidden"
    >
      {/* MODERN DARK-PURPLE ARENA BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none bg-[#0B0B16]">
        {/* Soft violet spotlight centered over the table */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(139,92,246,0.20)_0%,rgba(76,29,149,0.10)_40%,transparent_70%)]" />
        {/* Subtle geometric gaming texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94A3B8_1px,transparent_1px)] [background-size:24px_24px]" />
        {/* Top ambient highlight */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent" />
      </div>

      {/* Main content view wrapper with relative positioning & z-index */}
      <div className="relative z-10 flex flex-col h-full space-y-1 sm:space-y-3 min-h-0">
        {/* 1. Clean Modern Header Row */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 shrink-0 relative z-20">
          <button
            onClick={requestLeaveRoom}
            aria-label="Exit"
            className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
          >
            <LogOut size={15} />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-100 font-sans">
              {isAiMode ? `SOLO (${aiConfig?.difficulty?.toUpperCase() || 'MEDIUM'})` : 'UNO MATCH'}
            </span>
          </div>

          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300">
            <Volume2 size={15} />
          </div>
        </div>

        {/* 2. UNIFIED PROFESSIONAL CARD TABLETOP ARENA */}
        <div className="relative flex-1 flex flex-col justify-between items-center my-0.5 sm:my-1 min-h-0 z-10 overflow-hidden w-full">
          
          {/* OPPONENTS STRIP — renders every opponent (works for 1 up to 9,
              i.e. 2–10 player games) in a single row instead of 3 hardcoded
              top/left/right slots. With 3 or fewer it's centered and roomy;
              beyond that it becomes a horizontally swipeable strip so any
              player count fits cleanly on a phone screen without clipping. */}
          {(() => {
            const opponents = players.filter(p => p.id !== myPlayerId);
            if (opponents.length === 0) return null;
            const fanCount = opponentCount <= 2 ? 6 : opponentCount <= 4 ? 4 : 3;

            return (
              <div
                className={`w-full flex items-start z-20 shrink-0 mt-0.5 px-1 sm:px-3 gap-1.5 sm:gap-3 ${
                  opponents.length <= 3 ? 'justify-center' : 'overflow-x-auto justify-start snap-x snap-mandatory'
                }`}
                style={{ scrollbarWidth: 'none' }}
              >
                {opponents.map((opp) => {
                  const isCurrentTurn = !opp.finishedRank && (activePlayerId ? activePlayerId === opp.id : players[currentPlayerIndex]?.id === opp.id);

                  return (
                    <div
                      key={`opp-player-${opp.id}`}
                      ref={(el) => { opponentRefs.current[opp.id] = el; }}
                      className="flex flex-col items-center gap-0.5 shrink-0 snap-center"
                    >
                      {/* Opponent Cards Fanned Out */}
                      <div className={`flex items-center justify-center -space-x-2 sm:-space-x-3 ${oppFanHeightClass} mb-0.5`}>
                        {opp.finishedRank ? (
                          <div className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/60 text-amber-300 font-mono text-[9px] font-bold shadow-lg whitespace-nowrap">
                            🎉 {getOrdinal(opp.finishedRank)}
                          </div>
                        ) : (
                          Array.from({ length: Math.min(opp.cards.length, fanCount) }).map((_, cIdx) => (
                            <div
                              key={`opp-card-${opp.id}-${cIdx}`}
                              style={{ transform: `rotate(${(cIdx - (fanCount - 1) / 2) * 6}deg)` }}
                              className={`${oppCardBackClass} rounded-md border border-white/80 bg-neutral-900 shadow-md overflow-hidden relative shrink-0`}
                            >
                              <div className="absolute inset-0.5 rounded-xs bg-red-600 flex items-center justify-center">
                                <span className="text-[5px] sm:text-[7px] font-black text-yellow-300 italic font-sans">UNO</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Avatar + Nameplate */}
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="relative">
                          <div className={`${oppAvatarClass} rounded-full border-2 ${
                            opp.finishedRank
                              ? 'border-amber-400/80 ring-2 ring-amber-400/30'
                              : isCurrentTurn
                                ? 'border-amber-400 ring-3 ring-amber-400/70 shadow-[0_0_14px_rgba(251,191,36,0.8)] scale-105 animate-pulse'
                                : 'border-white/15'
                          } bg-slate-950 shadow-md overflow-hidden flex items-center justify-center transition-all`}>
                            <img loading="lazy" decoding="async" src={opp.avatarUrl} alt={opp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          {opp.finishedRank ? (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[8px] px-1 rounded-full shadow-sm">
                              🥇
                            </span>
                          ) : (
                            <motion.span
                              key={visibleHandCounts[opp.id] ?? opp.cards.length}
                              initial={{ scale: 1.4 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              className="absolute -top-1 -right-1 bg-purple-600 text-white font-mono font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full shadow-md border border-white/60"
                            >
                              {visibleHandCounts[opp.id] ?? opp.cards.length}
                            </motion.span>
                          )}
                        </div>

                        <div className={`text-slate-200 font-bold ${oppNameTextClass} font-sans truncate drop-shadow-md text-center`}>
                          {opp.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* CENTER ROW: FELT TABLE ARENA (draw pile / discard pile / direction).
              Opponents now render in the unified strip above, so this row no
              longer needs dedicated left/right seat columns — the arena gets
              the full width to stay big and centered no matter how many
              players are seated. */}
          <div className="w-full flex-1 flex items-center justify-center gap-1 sm:gap-4 relative my-0.5 min-h-0 px-1 sm:px-4">

            {/* ELEGANT CARD TABLETOP ARENA */}
            <div className={`flex-1 max-w-lg aspect-[16/10] ${arenaMaxHClass} mx-auto relative flex items-center justify-center ${arenaGapClass} select-none my-auto`}>

              {/* 3D STACKED DRAW DECK — round UNO badge style */}
              <div
                ref={drawPileRef}
                onClick={drawCard}
                className="relative z-10 flex flex-col items-center cursor-pointer group"
              >
                <div className={`relative ${drawOuterClass} rounded-full bg-[#0D0D14] border-2 flex items-center justify-center transition-transform ${
                  isMyTurn && gameState === 'playing'
                    ? 'border-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.5)] group-hover:scale-105'
                    : 'border-white/15'
                }`}>
                  <div className={`${drawInnerClass} rounded-full bg-[#D90429] flex items-center justify-center rotate-[-18deg] shadow-inner`}>
                    <span className="text-white font-black italic text-[10px] sm:text-sm tracking-tight">UNO</span>
                  </div>
                </div>
                <span className={`mt-1.5 font-mono font-bold text-[10px] sm:text-xs ${
                  isMyTurn && gameState === 'playing' ? 'text-amber-300' : 'text-slate-400'
                }`}>
                  {drawPile.length}
                </span>
              </div>

              {/* DISCARD PILE — current card in play, spotlighted */}
              <div
                ref={discardPileRef}
                className="relative z-10 flex flex-col items-center"
              >
                <div className={`relative ${discardWidthClass} aspect-[2/3]`}>
                  {(() => {
                    const topCard = visibleDiscardPile.length > 0 ? visibleDiscardPile[visibleDiscardPile.length - 1] : discardPile[discardPile.length - 1];
                    return topCard ? (
                      <motion.div
                        key={`top-discard-${topCard.id}`}
                        initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        className="w-full h-full rounded-xl ring-2 ring-amber-400/90 shadow-[0_0_24px_rgba(251,191,36,0.4)]"
                      >
                        <UnoCardFront card={topCard} compact className="w-full h-full !rounded-lg shadow-xl" />
                      </motion.div>
                    ) : (
                      <div className="w-full h-full rounded-lg border border-dashed border-white/40 bg-black/30 flex items-center justify-center text-white/60 text-[8px]">
                        Discard
                      </div>
                    );
                  })()}
                </div>

                {/* Active Color Badge */}
                <div className="mt-1.5 flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  <span className={`w-2 h-2 rounded-full ${
                    activeColor === 'red' ? 'bg-red-500' :
                    activeColor === 'yellow' ? 'bg-yellow-400' :
                    activeColor === 'green' ? 'bg-emerald-500' :
                    activeColor === 'blue' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  <span className="text-[8px] sm:text-[9px] font-mono font-black text-slate-200 uppercase tracking-wider">
                    {activeColor || 'Wild'}
                  </span>
                </div>
              </div>

              {/* Direction indicator */}
              <motion.div
                key={playDirection}
                initial={{ scale: 0.6, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1, scaleX: playDirection === 'clockwise' ? 1 : -1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute -top-2 right-1 sm:right-2 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-violet-500/15 border border-violet-400/40 text-violet-200 pointer-events-none animate-[pulse_2.4s_ease-in-out_infinite]"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12a8 8 0 0 1 14.5-4.6" />
                  <path d="M18 3v5h-5" />
                </svg>
              </motion.div>

            </div>

          </div>

          {/* BOTTOM PLAYER AREA (User Avatar + Action Buttons + User Cards Hand) */}
          <div className="w-full flex flex-col items-center gap-1 z-20 mt-auto shrink-0">
            
            {/* Action Row: Bottom User Avatar, Turn Status, UNO Button */}
            <UnoPlayerControls
              userProfile={userProfile}
              myPlayer={myPlayer}
              isMyTurn={isMyTurn}
              getOrdinal={getOrdinal}
              unoWindow={unoWindow}
              counterUnoWindow={counterUnoWindow}
              myPlayerId={myPlayerId}
              onUnoClick={() => handleUnoSuccess(myPlayerId, 'button')}
              onCounterUnoClick={triggerCounterUno}
            />

            {/* User Cards Hand (Curved Fan Layout with Elevated Golden Glow on Playable Cards) */}
            <div
              ref={userHandRef}
              className="relative w-full flex items-end justify-center px-2 pt-2 pb-0.5 min-h-[min(155px,22dvh)] sm:min-h-[min(190px,25dvh)]"
            >
              {(() => {
                if (myPlayer?.finishedRank || userCards.length === 0) {
                  const myRank = myPlayer?.finishedRank || 1;
                  return (
                    <div className="px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-amber-400/50 shadow-2xl text-amber-300 font-mono text-xs font-bold flex items-center gap-2.5 animate-pulse">
                      <span className="text-base">{myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎉'}</span>
                      <div className="flex flex-col text-left">
                        <span className="text-amber-300 font-black tracking-wider uppercase">Finished {getOrdinal(myRank)} Place!</span>
                        <span className="text-slate-400 text-[10px] font-normal">Spectating remaining match...</span>
                      </div>
                    </div>
                  );
                }

                const visibleCount = visibleHandCounts[myPlayerId] ?? userCards.length;
                const visibleUserCards = userCards.slice(0, visibleCount);
                const count = visibleUserCards.length;

                // Fan geometry: cards rotate and lift around a center point, like a real hand of cards.
                const maxSpreadDeg = Math.min(40, count * 4);

                // "Natural" (un-shrunk) card size — bumped up from the old
                // 72/91px baseline so the player's own cards read as the
                // biggest, most important element on screen regardless of
                // how many opponents are seated at the table.
                const naturalCardWidthPx = userHandContainerWidth >= 380 ? 108 : 86;
                const cardAspectRatio = 132 / 91; // height / width, same proportions as before

                // Overlap grows a little with hand size (a real hand does bunch up), but is capped
                // well below "fully stacked" so cards stay individually readable.
                const overlapFraction = count <= 5 ? 0.30 : count <= 9 ? 0.42 : count <= 13 ? 0.50 : 0.56;

                // Once the container width is known, shrink the card size (not just the overlap)
                // so the whole hand fits within the hand area instead of spilling out or piling up.
                const horizontalPaddingPx = 24; // roughly matches the container's px-2 + a little breathing room
                const minCardWidthPx = 50; // keep cards big & legible/tappable even with a huge (10-player) hand
                let cardWidthPx = naturalCardWidthPx;
                if (userHandContainerWidth > 0 && count > 1) {
                  const availableWidth = Math.max(userHandContainerWidth - horizontalPaddingPx, minCardWidthPx);
                  const neededWidthAtNatural = naturalCardWidthPx * (1 + (count - 1) * (1 - overlapFraction));
                  if (neededWidthAtNatural > availableWidth) {
                    cardWidthPx = availableWidth / (1 + (count - 1) * (1 - overlapFraction));
                    cardWidthPx = Math.max(minCardWidthPx, Math.min(naturalCardWidthPx, cardWidthPx));
                  }
                }
                const cardHeightPx = cardWidthPx * cardAspectRatio;

                return visibleUserCards.map((card, idx) => {
                  const playable = isCardPlayable(card) && isMyTurn && gameState === 'playing' && !myPlayer?.finishedRank;
                  const isAnimatingOut = card.id === animatingPlayCardId;

                  const mid = (count - 1) / 2;
                  const offsetFromCenter = idx - mid;
                  const rotateDeg = count > 1 ? (offsetFromCenter / mid) * (maxSpreadDeg / 2) : 0;
                  const riseCurve = count > 1 ? Math.abs(offsetFromCenter / mid) : 0;
                  const liftPx = riseCurve * riseCurve * 12; // slight upward curve at the fan's edges
                  const marginLeft = idx === 0 ? 0 : -(cardWidthPx * overlapFraction);

                  return (
                    <motion.div
                      key={`usercard-m-${card.id}-${idx}`}
                      ref={(el) => { userCardRefs.current[card.id] = el as HTMLDivElement; }}
                      onPointerDown={(e) => handleCardPointerDown(e, card, playable)}
                      onTouchStart={(e) => handleCardTouchStart(e, card, playable)}
                      style={{
                        marginLeft,
                        rotate: rotateDeg,
                        y: liftPx,
                        transformOrigin: 'bottom center',
                        zIndex: playable ? 40 : idx,
                      }}
                      animate={{ width: cardWidthPx, height: cardHeightPx }}
                      transition={{ width: { type: 'spring', damping: 26, stiffness: 260 }, height: { type: 'spring', damping: 26, stiffness: 260 } }}
                      whileHover={playable ? { y: liftPx - 24, scale: 1.08, zIndex: 50 } : {}}
                      whileTap={playable ? { y: liftPx - 16, scale: 0.97 } : { scale: 0.98 }}
                      className={`shrink-0 transition-[opacity,filter] touch-none select-none cursor-grab active:cursor-grabbing first:ml-0 ${
                        isAnimatingOut || (draggedCardState?.card.id === card.id) ? 'opacity-30' : !playable && isMyTurn && gameState === 'playing' && !myPlayer?.finishedRank ? 'opacity-80 saturate-[0.85]' : ''
                      }`}
                    >
                      <UnoCardFront
                        card={card}
                        playable={playable}
                        onClick={() => playable && !draggedCardState && playCard(card.id)}
                        className="w-full h-full"
                      />
                    </motion.div>
                  );
                });
              })()}
            </div>

          </div>

        </div>
        {/* END PROFESSIONAL TABLETOP ARENA */}

        {/* Just Drew Play Option */}
        <AnimatePresence>
          {justDrewCard && (
            <motion.div
              key="uno-just-drew-play-option"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-3 bg-green-600/10 border border-green-600/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-30"
            >
              <div className="flex items-center gap-2">
                <Check className="text-green-600" size={18} />
                <div className="text-left">
                  <div className="text-[10px] font-black font-mono text-green-600 uppercase tracking-widest">
                    🃏 Drawn Playable Card!
                  </div>
                  <div className="text-[11px] text-slate-200 font-medium leading-tight">
                    You drew {getCardLabel(justDrewCard)}. Would you like to play it?
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={playJustDrewCard}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all cursor-pointer active:scale-95"
                >
                  PLAY CARD
                </button>
                <button
                  onClick={keepJustDrewCard}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-slate-100 font-mono text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all cursor-pointer active:scale-95"
                >
                  KEEP CARD
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Color Picker Modal (Wild / Wild4 Selection) */}
        <AnimatePresence>
          {gameState === 'color_picker' && (
            <div key="uno-color-picker-backdrop" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto select-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-sm my-auto bg-[#181C24] border-2 border-purple-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-5 text-white"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <span>🎭 WILD CARD PLAYED</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black tracking-tight text-white font-mono uppercase">
                    {language === 'ar' ? '🌈 اختر اللون التالي' : language === 'fr' ? '🌈 CHOISISSEZ LA COULEUR' : '🌈 SELECT NEXT COLOR'}
                  </h4>
                  <p className="text-xs text-white/70 font-sans">
                    {language === 'ar'
                      ? 'لقد لعبت ورقة الجوكر! اختر اللون المناسب لتوجيه اللعبة'
                      : language === 'fr'
                      ? 'Vous avez joué une carte Joker ! Choisissez la couleur active.'
                      : 'Choose the active color to steer the next turn.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => selectWildColor('red')}
                    className="py-3.5 px-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white font-black tracking-wider font-mono shadow-lg hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-red-400/40"
                  >
                    <span className="text-base">🔴</span>
                    <span>{language === 'ar' ? 'أحمر' : 'RED'}</span>
                  </button>
                  <button
                    onClick={() => selectWildColor('yellow')}
                    className="py-3.5 px-4 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black tracking-wider font-mono shadow-lg hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-yellow-300/60"
                  >
                    <span className="text-base">🟡</span>
                    <span>{language === 'ar' ? 'أصفر' : 'YELLOW'}</span>
                  </button>
                  <button
                    onClick={() => selectWildColor('green')}
                    className="py-3.5 px-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black tracking-wider font-mono shadow-lg hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
                  >
                    <span className="text-base">🟢</span>
                    <span>{language === 'ar' ? 'أخضر' : 'GREEN'}</span>
                  </button>
                  <button
                    onClick={() => selectWildColor('blue')}
                    className="py-3.5 px-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black tracking-wider font-mono shadow-lg hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-blue-400/40"
                  >
                    <span className="text-base">🔵</span>
                    <span>{language === 'ar' ? 'أزرق' : 'BLUE'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Winner / Match Finished Result Modal */}
        <AnimatePresence>
          {gameState === 'winner' && (() => {
            const isUserWinner = winner?.id === myPlayerId;
            const myPlayerObj = players.find(p => p.id === myPlayerId);

            const sortedModalPlayers = [...players].sort((a, b) => {
              const rA = a.finishedRank || (finishOrder.indexOf(a.id) >= 0 ? finishOrder.indexOf(a.id) + 1 : 99);
              const rB = b.finishedRank || (finishOrder.indexOf(b.id) >= 0 ? finishOrder.indexOf(b.id) + 1 : 99);
              return rA - rB;
            });
            const modalRankedIds = sortedModalPlayers.map(p => p.id);

            const myRank = myPlayerObj?.finishedRank || (finishOrder.indexOf(myPlayerId) >= 0 ? finishOrder.indexOf(myPlayerId) + 1 : modalRankedIds.indexOf(myPlayerId) + 1);

            const entryCost = joinedRoom?.entryCost || 30;
            const myCoinsChange = calculatePlayerCoinChange(
              myPlayerId,
              [winner?.id || ''],
              modalRankedIds.filter(id => id !== winner?.id),
              entryCost,
              false,
              modalRankedIds
            );

            const isAr = language === 'ar';
            const isFr = language === 'fr';

            return (
              <div key="uno-winner-modal-backdrop" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto select-none">
                <motion.div
                  initial={{ scale: 0.88, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.88, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`w-full max-w-sm sm:max-w-md my-auto rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-5 border-2 text-white font-sans ${
                    isUserWinner
                      ? 'bg-gradient-to-b from-[#1C2812] via-[#121A0C] to-[#0A0F07] border-emerald-500/80 shadow-emerald-500/25'
                      : 'bg-gradient-to-b from-[#251316] via-[#180C0E] to-[#0D0607] border-red-500/80 shadow-red-500/25'
                  }`}
                >
                  {/* Game Scope Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-mono font-bold tracking-widest text-white/90 uppercase border border-white/15">
                    <span>🃏 UNO SHOWDOWN</span>
                  </div>

                  {/* Main Visual Result Icon */}
                  <div className="flex justify-center">
                    {isUserWinner ? (
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce shadow-lg shadow-emerald-500/30">
                          <Trophy size={44} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-400 text-black shadow-md">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/30">
                          <XCircle size={44} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-bold">
                          #{myRank}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Header & Text */}
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight font-sans">
                      {isUserWinner
                        ? isAr ? '🏆 مبروك! لقد فزت بالمباراة!' : isFr ? '🏆 VICTOIRE ! VOUS AVEZ GAGNÉ !' : '🏆 VICTORY! YOU WON!'
                        : isAr ? '❌ حظ أوفر! انتهت اللعبة' : isFr ? '❌ DÉFAITE ! FIN DE LA PARTIE' : '❌ MATCH FINISHED'}
                    </h3>
                    <p className="text-xs text-white/75 font-mono leading-relaxed px-2">
                      {isUserWinner
                        ? isAr ? 'أداء تكتيكي ممتاز! تمكنت من التخلص من جميع أوراقك بنجاح.' : isFr ? 'Performance tactique exceptionnelle !' : 'Incredible play! You cleared all your cards first.'
                        : isAr ? `الفائز بالمباراة: ${winner?.name || 'المنافس'}. تمكنت من الحصول على المرتبة #${myRank}` : isFr ? `Gagnant: ${winner?.name || 'Adversaire'}. Votre classement: #${myRank}` : `Winner: ${winner?.name || 'Opponent'}. Your finish: #${myRank}`}
                    </p>
                  </div>

                  {/* Coins Settlement Box */}
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between font-mono ${
                    myCoinsChange > 0
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : myCoinsChange < 0
                        ? 'bg-red-500/15 border-red-500/40 text-red-300'
                        : 'bg-white/5 border-white/10 text-white/80'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Coins size={20} className={myCoinsChange > 0 ? 'text-emerald-400' : myCoinsChange < 0 ? 'text-red-400' : 'text-amber-400'} />
                      <span className="text-[11px] uppercase font-bold tracking-wider">
                        {isAr ? 'النتيجة المالية' : 'Match Rewards'}
                      </span>
                    </div>
                    <span className="text-lg font-black">
                      {myCoinsChange > 0 ? `+${myCoinsChange} Coins 🪙` : `${myCoinsChange} Coins 💸`}
                    </span>
                  </div>

                  {/* Final Placement Rankings */}
                  {winner && (
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-left space-y-2">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
                        <span>{isAr ? 'الترتيب والكوينز:' : 'Placements & Rewards:'}</span>
                        <span>{players.length} Players</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {sortedModalPlayers.map((p, pIdx) => {
                          const rankIndex = finishOrder.indexOf(p.id);
                          const rank = p.finishedRank || (rankIndex >= 0 ? rankIndex + 1 : pIdx + 1);
                          const rankBadge = rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : rank === 3 ? '🥉 3rd' : `❌ ${rank}th`;
                          const isMe = p.id === myPlayerId;
                          const playerCoins = calculatePlayerCoinChange(
                            p.id,
                            [winner?.id || ''],
                            modalRankedIds.filter(id => id !== winner?.id),
                            entryCost,
                            false,
                            modalRankedIds
                          );

                          return (
                            <div
                              key={`uno-res-${p.id}-${pIdx}`}
                              className={`flex justify-between items-center text-xs p-2 rounded-xl transition-colors ${
                                isMe
                                  ? 'bg-white/15 border border-white/30 text-white font-bold'
                                  : 'bg-white/5 text-white/80 border border-transparent'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                  rank === 1 ? 'bg-amber-400 text-black' : rank === 2 ? 'bg-slate-300 text-black' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-red-500/20 text-red-300'
                                }`}>
                                  {rankBadge}
                                </span>
                                <img loading="lazy" decoding="async" src={p.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                <span className="truncate">{p.name} {isMe && (isAr ? '(أنت)' : '(You)')}</span>
                              </span>
                              <span className={`font-mono text-[11px] font-extrabold shrink-0 px-2 py-0.5 rounded-md ${
                                playerCoins > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : playerCoins < 0
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : 'bg-slate-700/40 text-slate-300'
                              }`}>
                                {playerCoins > 0 ? `+${playerCoins}` : playerCoins} 🪙
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    <button
                      onClick={startNewRound}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF8600] to-amber-500 hover:opacity-95 text-black font-mono font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#FF8600]/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{isAr ? 'إعادة اللعب 🔄' : isFr ? 'REJOUER 🔄' : 'PLAY AGAIN 🔄'}</span>
                    </button>
                    <button
                      onClick={requestLeaveRoom}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-98 cursor-pointer border border-white/15"
                    >
                      <span>{isAr ? 'الخروج من المباراة' : isFr ? 'QUITTER' : 'EXIT MATCH'}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>

        {/* VISUAL CARDS FLYING OVERLAY */}
        <FlyingCardsOverlay
          flyingCards={flyingCards}
          onAnimationComplete={removeFlyingCard}
        />

        {/* FLOATING DRAGGED CARD OVERLAY */}
        {draggedCardState && (
          <div
            style={{
              position: 'fixed',
              left: draggedCardState.x - 46,
              top: draggedCardState.y - 67,
              pointerEvents: 'none',
              zIndex: 99999,
              touchAction: 'none',
            }}
            className="w-[91px] h-[134px] drop-shadow-2xl rounded-2xl rotate-3 scale-110 pointer-events-none select-none transition-transform duration-75"
          >
            <UnoCardFront card={draggedCardState.card} playable={true} className="w-[91px] h-[134px] shadow-2xl" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const UnoGameView = React.memo(UnoGameViewComponent);
