import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Language,
  NavTab,
  ActiveView,
  UserProfile,
  Room,
  Friend,
  GameMode,
  PlayType,
  GameCard,
  CardTurnSession,
  RoomInvitation,
  FriendRequest,
  MecanqueSettings,
  ChessSettings,
  ChessTimeOptionId,
  EmojiReaction,
} from '../types';
import { GameThemeId, getLeagueByLevel, GAME_THEMES } from '../theme/gameThemeEngine';
import {
  FREE_EMOJIS,
  FREE_EMOJI_IDS,
  SHOP_EMOJIS,
  ALL_EMOJIS,
  getEmojiById,
  getEmojiBySymbol,
} from '../data/emojis';
import { AVATAR_FRAMES, getAvatarFrameById } from '../data/avatarFrames';
import { calculatePlayerCoinChange } from '../utils/coins';
import { emojiSoundService } from '../services/emojiSoundService';
import { audioManager } from '../services/audioManager';
import {
  sendReaction as fbSendReaction,
  listenToReactions,
} from '../firebase/reactionService';
import {
  DEFAULT_AVATAR,
  INITIAL_GAMES,
} from '../data/mockData';

// Neutral starting profile for a session that has no Firebase user document
// yet (guest / first launch). Real values come from users/{uid} in Firestore.
const GUEST_PROFILE: UserProfile = {
  id: '',
  name: 'Guest',
  username: '',
  avatarUrl: DEFAULT_AVATAR,
  isOnline: true,
  gamesPlayed: 0,
  winRate: 0,
  currentStreak: 0,
  level: 1,
  joinedDate: '',
  coins: 300,
  wins: 0,
};
import { INITIAL_GAME_CARDS } from '../data/initialCards';
import {
  listenToActionVeriteCards,
  createCardInFirestore,
  updateCardInFirestore,
  deleteCardInFirestore,
} from '../firebase/cardsService';
import { getTranslation } from '../lib/i18n';
import { auth, db } from '../firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { useGameState } from '../hooks/useGameState';
import {
  onAuthChange,
  ensureAuthUser,
  loginAsGuest as fbLoginAsGuest,
  cleanupGuestAccount as fbCleanupGuestAccount,
  loginWithEmail as fbLoginWithEmail,
  signUpWithEmail as fbSignUpWithEmail,
  logout as fbLogout,
  getUserDocument,
  deleteAccount as fbDeleteAccount,
  verifyAdminTypeAuthorization,
  isDesignatedAdminEmail,
  AdminType,
} from '../firebase/authService';
import {
  listenToIntrusTopics,
  createIntrusTopicInFirestore,
  updateIntrusTopicInFirestore,
  deleteIntrusTopicInFirestore,
} from '../firebase/intrusCardsService';
import { IntrusTopic } from '../types';
import { INTRUS_TOPICS } from '../data/intrusTopics';
import {
  blockUser as fbBlockUser,
  unblockUser as fbUnblockUser,
  listenToBlockedUsers,
  reportUser as fbReportUser,
  type BlockedUser,
  type ReportInput,
} from '../firebase/moderationService';
import {
  createRoom as fbCreateRoom,
  joinRoomByCode as fbJoinRoomByCode,
  leaveRoom as fbLeaveRoom,
  toggleReady as fbToggleReady,
  startGame as fbStartGame,
  removePlayer as fbRemovePlayer,
  updateRoomSettings as fbUpdateRoomSettings,
  listenToRoom,
  ensureRoomPlayerIds,
  RoomError,
  toRoomError,
  listenToOpenRooms,
  sendHeartbeat,
  evictInactivePlayersAndReassignHost,
  updatePlayerIdentityInRoomAndMatch,
} from '../firebase/roomsService';
import {
  sendMessage as fbSendMessage,
  listenToMessages,
  ChatMessage,
} from '../firebase/chatService';
import { showInterstitialIfReady } from '../services/adService';

export interface UnoAiConfig {
  isAiMode: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  aiCount: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}


export interface ChessAiConfig {
  isAiMode: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timeControlId?: ChessTimeOptionId;
  initialSeconds?: number;
  incrementSeconds?: number;
}

export interface MatchResultNotification {
  roomCode: string;
  gameTitle?: string;
  isWinner: boolean;
  isDraw?: boolean;
  coinsChange: number;
  entryCost: number;
}

export type NotificationCategory = 'rooms' | 'friends' | 'results';

export interface GameResultNotification {
  id: string;
  roomCode: string;
  gameTitle: string;
  isWinner: boolean;
  isDraw?: boolean;
  coinsChange: number;
  entryCost: number;
  timestamp: string;
  createdAtMs: number;
  read: boolean;
}

interface AppContextType {
  hasOpened: boolean;
  setHasOpened: (opened: boolean) => void;
  openApp: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
  
  // Auth & Guest Flow State
  authStatus: 'unauthenticated' | 'guest' | 'authenticated';
  isGuestSession: boolean;
  guestTrialUsed: boolean;
  guestVisitCount: number;
  authScreenState: 'access_menu' | 'welcome_back' | 'login' | 'register' | 'forgot_password';
  setAuthScreenState: (screen: 'access_menu' | 'welcome_back' | 'login' | 'register' | 'forgot_password') => void;
  playAsGuest: (displayName: string) => Promise<{ success: boolean; error?: string }>;
  loginUser: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  registerUser: (data: { username: string; email: string; password: string; avatarUrl?: string }) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isDarkMode: boolean;
  
  userProfile: UserProfile;
  updateProfile: (data: Partial<UserProfile>) => void;
  /** The authoritative Firebase Auth uid (never a local/mock id). Empty string until auth resolves. */
  currentUid: string;

  // Coins & Economy
  isCoinsModalOpen: boolean;
  setIsCoinsModalOpen: (isOpen: boolean) => void;
  matchResultNotification: MatchResultNotification | null;
  setMatchResultNotification: (notif: MatchResultNotification | null) => void;
  addCoins: (amount: number, reason?: string) => void;
  deductCoins: (amount: number) => boolean;
  checkCoinEligibility: (entryCost: number) => boolean;
  settleMatchCoins: (
    roomCode: string,
    gameTitle: string,
    winnerIds: string[],
    loserIds: string[],
    entryCost: number,
    isDraw?: boolean,
    rankedPlayerIds?: string[]
  ) => void;

  rooms: Room[];
  joinedRoom: Room | null;
  unoAiConfig: UnoAiConfig;
  startAiUnoGame: (config: { difficulty: 'easy' | 'medium' | 'hard' | 'expert'; aiCount: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }) => void;
  exitAiUnoGame: () => void;
  chessAiConfig: ChessAiConfig;
  startAiChessGame: (config: {
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    timeControlId?: ChessTimeOptionId;
    initialSeconds?: number;
    incrementSeconds?: number;
  }) => void;
  exitAiChessGame: () => void;
  createRoom: (
    gameId: string,
    playerLimit: number,
    isPrivate: boolean,
    mode?: GameMode,
    playType?: PlayType,
    customMecanqueSettings?: MecanqueSettings,
    entryCost?: number,
    autoStart?: boolean,
    customChessSettings?: ChessSettings
  ) => Promise<Room>;
  updateRoomParameters: (updates: Partial<Room>) => Promise<void>;
  joinRoom: (codeOrId: string) => Promise<{ success: boolean; message?: string }>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  startGame: () => Promise<void>;
  inviteFriendToRoom: (friendId: string) => void;
  invitedFriends: string[];
  lastInviteTimestamps: Record<string, number>;

  // Room Chat (Firebase-backed, real-time, scoped to the current room)
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => Promise<void>;
  /** Last multiplayer failure, as a stable code (PERMISSION_DENIED, NOT_HOST, ...). Null when healthy. */
  multiplayerError: { code: string; message: string } | null;
  clearMultiplayerError: () => void;

  // User safety: real, Firestore-backed blocking + reporting (not local mock state)
  blockedUsers: BlockedUser[];
  blockUserAction: (target: { uid: string; username: string; avatarUrl?: string }) => Promise<void>;
  unblockUserAction: (uid: string) => Promise<void>;
  reportUserAction: (input: ReportInput) => Promise<void>;
  
  isLeaveRoomConfirmOpen: boolean;
  setIsLeaveRoomConfirmOpen: (isOpen: boolean) => void;
  requestLeaveRoom: () => void;
  cancelLeaveRoom: () => void;
  isLeavingRoom: boolean;

  // Real account deletion (Firebase Auth + Firestore), replacing the old fake "delete" UI.
  // Throws ReauthRequiredError if the caller needs to supply the current password.
  deleteAccountAction: (password?: string) => Promise<void>;
  
  friends: Friend[];
  addFriendByUsername: (username: string) => Promise<boolean>;
  removeFriend: (friendId: string) => void;
  friendRequests: FriendRequest[];
  sendFriendRequest: (target: { id: string; name: string; username: string; avatarUrl?: string }) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  selectedFriendForProfile: Friend | null;
  setSelectedFriendForProfile: (friend: Friend | null) => void;
  


  // LammaHub Card System & Turn Gameplay
  gameCards: GameCard[];
  cardTurn: CardTurnSession;
  getRandomCard: (excludeCategories?: GameCard['category'][]) => GameCard;
  flipCard: () => void;
  useShield: () => void;
  selectSpecialChoice: (choice: 'optionA' | 'optionB') => void;
  advanceTurn: () => void;
  resetCardGame: () => void;
  removePlayerFromRoom: (playerId: string) => void;

  // Admin Management
  isAdminLoggedIn: boolean;
  authReady: boolean;
  adminType: AdminType;
  adminLogin: (email: string, pass: string) => Promise<boolean>;
  adminLogout: () => void;
  createCard: (card: Omit<GameCard, 'id' | 'createdAt'>) => void;
  updateCard: (id: string, card: Partial<GameCard>) => void;
  deleteCard: (id: string) => void;

  // L'INTRUS Admin Management
  intrusTopics: IntrusTopic[];
  createIntrusTopic: (topic: Omit<IntrusTopic, 'id'>) => Promise<IntrusTopic>;
  updateIntrusTopic: (id: string, updates: Partial<IntrusTopic>) => Promise<void>;
  deleteIntrusTopic: (id: string) => Promise<void>;

  roomsFilterGameId: string | null;
  setRoomsFilterGameId: (gameId: string | null) => void;

  // Mecanque Setup Settings
  mecanqueSettings: MecanqueSettings;
  setMecanqueSettings: (settings: MecanqueSettings) => void;

  // Chess Setup Settings
  chessSettings: ChessSettings;
  setChessSettings: (settings: ChessSettings) => void;

  // New persistent settings & UX states
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  voiceInteractionEnabled: boolean;
  setVoiceInteractionEnabled: (val: boolean) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (val: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (val: boolean) => void;
  confirmBeforeLeaving: boolean;
  setConfirmBeforeLeaving: (val: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  batterySaver: boolean;
  setBatterySaver: (val: boolean) => void;
  notificationSettings: {
    master: boolean;
    friendRequests: boolean;
    friendAccepted: boolean;
    roomInvitations: boolean;
    chatMessages: boolean;
    gameNotifications: boolean;
  };
  setNotificationSettings: (updater: (prev: AppContextType['notificationSettings']) => AppContextType['notificationSettings']) => void;
  onlineStatus: boolean;
  setOnlineStatus: (val: boolean) => void;
  friendRequestsPermission: 'everyone' | 'friends_of_friends' | 'nobody';
  setFriendRequestsPermission: (val: 'everyone' | 'friends_of_friends' | 'nobody') => void;
  downloadUserData: () => void;
  connectionStatus: 'connected' | 'connecting' | 'reconnecting' | 'restored';
  setConnectionStatus: (status: 'connected' | 'connecting' | 'reconnecting' | 'restored') => void;
  connectionQuality: 'excellent' | 'good' | 'weak' | 'offline';

  // Profile & Privacy visibility settings
  profileVisibility: 'everyone' | 'friends' | 'nobody';
  setProfileVisibility: (val: 'everyone' | 'friends' | 'nobody') => void;
  avatarVisibility: 'everyone' | 'friends' | 'nobody';
  setAvatarVisibility: (val: 'everyone' | 'friends' | 'nobody') => void;
  friendsListVisibility: 'everyone' | 'friends' | 'nobody';
  setFriendsListVisibility: (val: 'everyone' | 'friends' | 'nobody') => void;
  roomInvitesPermission: 'everyone' | 'friends' | 'nobody';
  setRoomInvitesPermission: (val: 'everyone' | 'friends' | 'nobody') => void;
  interactionPermission: 'everyone' | 'friends';
  setInteractionPermission: (val: 'everyone' | 'friends') => void;

  invitations: RoomInvitation[];
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
  unreadInvitationsCount: number;
  unreadRoomInvitationsCount: number;
  unreadFriendRequestsCount: number;
  isFriendsModalOpen: boolean;
  setIsFriendsModalOpen: (open: boolean) => void;
  isRoomsModalOpen: boolean;
  setIsRoomsModalOpen: (open: boolean) => void;
  activeNotificationModalOpen: boolean;
  setActiveNotificationModalOpen: (open: boolean) => void;

  // Unified Notification Center
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  activeNotificationTab: NotificationCategory;
  setActiveNotificationTab: (tab: NotificationCategory) => void;
  openNotificationCenter: (tab?: NotificationCategory) => void;
  gameResultNotifications: GameResultNotification[];
  readNotificationIds: string[];
  unreadRoomNotificationsCount: number;
  unreadFriendNotificationsCount: number;
  unreadGameResultsCount: number;
  totalUnreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (category?: NotificationCategory) => void;
  clearGameResultNotification: (id: string) => void;

  viewedUserProfile: UserProfile | null;
  profileReturnView: ActiveView | null;
  viewUserProfile: (user: { id: string; name: string; username?: string; avatarUrl?: string; instagramUrl?: string; gamesPlayed?: number; winRate?: number; currentStreak?: number; level?: number; joinedDate?: string; isOnline?: boolean }) => void;
  closeViewedUserProfile: () => void;
  closeActiveModal: () => boolean;
  registerModalCloseHandler: (fn: () => void) => () => void;

  // Emoji Reaction & Emoji Shop System
  unlockedEmojis: string[];
  buyEmoji: (emojiId: string) => Promise<{ success: boolean; error?: string }>;
  isEmojiShopOpen: boolean;
  setIsEmojiShopOpen: (open: boolean) => void;
  activeReactions: EmojiReaction[];
  sendEmojiReaction: (emojiIdOrSymbol: string) => Promise<void>;

  // Avatar Frames & Badges Shop System
  unlockedFrames: string[];
  equippedFrame: string;
  isFrameShopOpen: boolean;
  setIsFrameShopOpen: (open: boolean) => void;
  buyAvatarFrame: (frameId: string) => Promise<{ success: boolean; error?: string }>;
  equipAvatarFrame: (frameId: string) => Promise<{ success: boolean; error?: string }>;

  // Game Table Aesthetic Theme Engine System
  selectedGameTheme: GameThemeId;
  setSelectedGameTheme: (themeId: GameThemeId) => void;
  isThemePickerOpen: boolean;
  setIsThemePickerOpen: (open: boolean) => void;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[rakcha] safeJsonParse failed, using fallback:', err);
    return fallback;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modalCloseHandlersRef = useRef<(() => void)[]>([]);

  const registerModalCloseHandler = useCallback((fn: () => void) => {
    modalCloseHandlersRef.current.push(fn);
    return () => {
      modalCloseHandlersRef.current = modalCloseHandlersRef.current.filter((cb) => cb !== fn);
    };
  }, []);


  const [hasOpened, setHasOpened] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_has_opened'), false);
  });

  const [authStatus, setAuthStatus] = useState<'unauthenticated' | 'guest' | 'authenticated'>(() => {
    const savedStatus = localStorage.getItem('af_auth_status');
    return (savedStatus as any) || 'unauthenticated';
  });

  const [isGuestSession, setIsGuestSession] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_is_guest'), false);
  });

  const [guestTrialUsed, setGuestTrialUsed] = useState<boolean>(() => {
    return localStorage.getItem('af_guest_trial_used') === 'true';
  });

  const [guestGamePlayed, setGuestGamePlayed] = useState<boolean>(() => {
    return localStorage.getItem('af_guest_game_played') === 'true';
  });
  const guestGamePlayedRef = useRef(guestGamePlayed);
  useEffect(() => {
    guestGamePlayedRef.current = guestGamePlayed;
    localStorage.setItem('af_guest_game_played', JSON.stringify(guestGamePlayed));
  }, [guestGamePlayed]);

  const [isGuestTrialModalOpen, setIsGuestTrialModalOpen] = useState<boolean>(false);

  const checkAndConsumeGuestTrial = (): boolean => {
    const isAnonymousAuth = Boolean(auth.currentUser?.isAnonymous);
    const isGuest =
      authStatus !== 'authenticated' &&
      (authStatus === 'guest' || isGuestSession || userProfile.isGuest || isAnonymousAuth);
    if (isGuest) {
      if (guestGamePlayedRef.current) {
        setIsGuestTrialModalOpen(true);
        return false;
      } else {
        setGuestGamePlayed(true);
        return true;
      }
    }
    return true;
  };

  const [guestVisitCount, setGuestVisitCount] = useState<number>(() => {
    const savedVisits = localStorage.getItem('af_guest_visits');
    const parsed = savedVisits ? parseInt(savedVisits, 10) : 1;
    return isNaN(parsed) ? 1 : parsed;
  });

  const [authScreenState, setAuthScreenState] = useState<'access_menu' | 'welcome_back' | 'login' | 'register' | 'forgot_password'>('access_menu');

  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('af_language');
    return (savedLang as Language) || 'en';
  });

  const isRTL = language === 'ar';
  const t = useCallback((key: string) => getTranslation(language, key), [language]);

  const setLanguage = useCallback((val: Language) => {
    setLanguageState(val);
    localStorage.setItem('af_language', val);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = val;
      document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const [activeTab, setActiveTabState] = useState<NavTab>('home');
  const [isLeaveRoomConfirmOpen, setIsLeaveRoomConfirmOpen] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('main');
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('af_theme');
    return (savedTheme as 'light' | 'dark' | 'system') || 'light';
  });

  const setTheme = useCallback((val: 'light' | 'dark' | 'system') => {
    setThemeState(val);
    localStorage.setItem('af_theme', val);
  }, []);

  const [selectedGameThemeState, setSelectedGameThemeState] = useState<GameThemeId>(() => {
    const saved = localStorage.getItem('af_game_table_theme');
    if (saved && ['bronze', 'emerald', 'gold', 'diamond', 'cosmic'].includes(saved)) {
      return saved as GameThemeId;
    }
    return 'emerald';
  });
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  const setSelectedGameTheme = useCallback((themeId: GameThemeId) => {
    setSelectedGameThemeState(themeId);
    localStorage.setItem('af_game_table_theme', themeId);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      setIsDarkMode(isDark);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);
  
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return safeJsonParse(localStorage.getItem('af_user_profile'), GUEST_PROFILE);
  });

  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
  const [isEmojiShopOpen, setIsEmojiShopOpen] = useState(false);
  const [isFrameShopOpen, setIsFrameShopOpen] = useState(false);
  const [activeReactions, setActiveReactions] = useState<EmojiReaction[]>([]);
  const reactionListenerRef = useRef<(() => void) | null>(null);
  const processedReactionIdsRef = useRef<Set<string>>(new Set());

  // Set of unlocked frames & equipped frame
  const unlockedFrames = useMemo(() => {
    const fromProfile = userProfile.unlockedFrames || [];
    return Array.from(new Set(['default', ...fromProfile]));
  }, [userProfile.unlockedFrames]);

  const equippedFrame = userProfile.equippedFrame || 'default';

  // Set of unlocked emojis (Free ones are ALWAYS unlocked + user purchased)
  const unlockedEmojis = useMemo(() => {
    const fromProfile = userProfile.unlockedEmojis || [];
    return Array.from(new Set([...FREE_EMOJI_IDS, ...fromProfile]));
  }, [userProfile.unlockedEmojis]);

  const [rankUnlockModalData, setRankUnlockModalData] = useState<{
    isOpen: boolean;
    wins: number;
    rankTitle: string;
    tier: 'starter' | 'advanced' | 'pro';
  }>({
    isOpen: false,
    wins: 0,
    rankTitle: '',
    tier: 'starter',
  });

  const checkAndTriggerMilestone = useCallback((newWins: number) => {
    const celebratedKey = 'af_celebrated_wins_milestones';
    const celebrated: number[] = safeJsonParse(localStorage.getItem(celebratedKey), []);

    const milestones = [
      { count: 1000, title: '1000 Wins — PRO Rank', tier: 'pro' as const },
      { count: 100, title: '100 Wins — Advanced Rank', tier: 'advanced' as const },
      { count: 10, title: '10 Wins — Starter Rank', tier: 'starter' as const },
    ];

    for (const m of milestones) {
      if (newWins >= m.count && !celebrated.includes(m.count)) {
        celebrated.push(m.count);
        localStorage.setItem(celebratedKey, JSON.stringify(celebrated));
        setRankUnlockModalData({
          isOpen: true,
          wins: m.count,
          rankTitle: m.title,
          tier: m.tier,
        });
        break;
      }
    }
  }, []);

  const addWin = useCallback(() => {
    setUserProfile((prev) => {
      const currentWins = prev.wins ?? 0;
      const nextWins = currentWins + 1;
      const currentGames = prev.gamesPlayed ?? 0;
      const nextGames = currentGames + 1;
      const nextWinRate = Math.round((nextWins / nextGames) * 100);

      const updated = {
        ...prev,
        wins: nextWins,
        gamesPlayed: nextGames,
        winRate: nextWinRate,
      };

      localStorage.setItem('af_user_profile', JSON.stringify(updated));
      const uid = auth.currentUser?.uid || prev.id;
      if (uid) {
        updateDoc(doc(db, 'users', uid), {
          wins: nextWins,
          gamesPlayed: nextGames,
          winRate: nextWinRate,
        }).catch(() => {});
      }

      checkAndTriggerMilestone(nextWins);
      return updated;
    });
  }, [checkAndTriggerMilestone]);

  const addCoins = useCallback((amount: number, _reason?: string) => {
    if (!amount) return;

    setUserProfile((prev) => {
      const updated = { ...prev, coins: (prev.coins ?? 300) + amount };
      localStorage.setItem('af_user_profile', JSON.stringify(updated));
      return updated;
    });

    const myUid = auth.currentUser?.uid || userProfile.id;
    if (myUid) {
      void setDoc(
        doc(db, 'users', myUid),
        { coins: increment(amount) },
        { merge: true }
      ).catch((err) => {
        console.warn('[AppContext] Failed to sync added coins to Firestore:', err);
      });
    }
  }, [userProfile.id]);

  const deductCoins = useCallback((amount: number): boolean => {
    const currentCoins = userProfile.coins ?? 300;
    if (currentCoins < amount) {
      return false;
    }

    setUserProfile((prev) => {
      const updated = { ...prev, coins: Math.max(0, (prev.coins ?? 300) - amount) };
      localStorage.setItem('af_user_profile', JSON.stringify(updated));
      return updated;
    });

    const myUid = auth.currentUser?.uid || userProfile.id;
    if (myUid) {
      void setDoc(
        doc(db, 'users', myUid),
        { coins: increment(-amount) },
        { merge: true }
      ).catch((err) => {
        console.warn('[AppContext] Failed to sync deducted coins to Firestore:', err);
      });
    }
    return true;
  }, [userProfile.id, userProfile.coins]);


  const [matchResultNotification, setMatchResultNotification] = useState<MatchResultNotification | null>(null);

  const checkCoinEligibility = useCallback((entryCost: number, gameId?: string): boolean => {
    if (gameId === 'mind-rally' || gameId === 'action-verite' || entryCost === 0) return true;
    const currentCoins = userProfile.coins ?? 300;
    return currentCoins >= entryCost;
  }, [userProfile.coins]);

  const settleMatchCoins = useCallback(async (
    roomCode: string,
    gameTitle: string,
    winnerIds: string[],
    loserIds: string[],
    entryCost: number,
    isDraw: boolean = false,
    rankedPlayerIds?: string[]
  ) => {
    if (!roomCode) return;

    const myUid = auth.currentUser?.uid || userProfile.id;
    if (!myUid) return;

    const isActionVerite = gameTitle?.toLowerCase().includes('action') || gameTitle?.toLowerCase().includes('vérité') || gameTitle?.toLowerCase().includes('verite') || entryCost === 0;
    const cost = isActionVerite ? 0 : (typeof entryCost === 'number' ? entryCost : 30);
    const isWinner = winnerIds.includes(myUid);

    const coinsChange = calculatePlayerCoinChange(
      myUid,
      winnerIds,
      loserIds,
      cost,
      isDraw,
      rankedPlayerIds
    );

    // Show immediate local match result banner
    setMatchResultNotification({
      roomCode,
      gameTitle: gameTitle || 'Rakcha Match',
      isWinner: isDraw ? false : isWinner,
      isDraw: Boolean(isDraw),
      coinsChange,
      entryCost: cost,
    });

    // Update local profile state immediately & persist to localStorage.
    // Firestore is updated by the server-authoritative settlement API below,
    // so we must NOT write coins/wins/gamesPlayed from the client (double counting).
    setUserProfile((prev) => {
      const updated = {
        ...prev,
        coins: Math.max(0, (prev.coins ?? 300) + coinsChange),
        wins: isWinner ? (prev.wins || 0) + 1 : (prev.wins || 0),
        gamesPlayed: (prev.gamesPlayed || 0) + 1,
      };
      localStorage.setItem('af_user_profile', JSON.stringify(updated));
      return updated;
    });


    // Call server-authoritative settlement API
    try {
      await fetch('/api/settle-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          gameTitle: gameTitle || 'Rakcha Match',
          winnerIds,
          loserIds,
          isDraw: Boolean(isDraw),
          entryCost: cost,
          rankedPlayerIds,
        }),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[AppContext] Settlement API request failed or offline:', err);
    }
  }, [userProfile.id, userProfile.coins, userProfile.gamesPlayed, userProfile.wins]);
  
  // Public "Open Rooms" list — now a live Firestore query instead of static
  // mock data, so it reflects rooms other real users have created.
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinedRoom, setJoinedRoomState] = useState<Room | null>(null);

  // Offline UNO AI Mode configuration
  const [unoAiConfig, setUnoAiConfig] = useState<UnoAiConfig>({
    isAiMode: false,
    difficulty: 'medium',
    aiCount: 3,
  });

  const startAiUnoGame = useCallback((config: { difficulty: 'easy' | 'medium' | 'hard' | 'expert'; aiCount: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }) => {
    if (!checkAndConsumeGuestTrial()) {
      return;
    }
    // 1. Ensure no multiplayer room is joined
    setJoinedRoomState(null);
    // 2. Set AI configuration
    setUnoAiConfig({
      isAiMode: true,
      difficulty: config.difficulty,
      aiCount: config.aiCount,
    });
    // 3. Transition directly to game view
    setActiveView('game');
  }, []);

  const exitAiUnoGame = useCallback(() => {
    setUnoAiConfig({
      isAiMode: false,
      difficulty: 'medium',
      aiCount: 3,
    });
    setActiveView('home');
  }, []);


  // Offline Chess AI Mode configuration
  const [chessAiConfig, setChessAiConfig] = useState<ChessAiConfig>({
    isAiMode: false,
    difficulty: 'medium',
    timeControlId: '5m',
    initialSeconds: 300,
    incrementSeconds: 0,
  });

  const startAiChessGame = useCallback(
    (config: {
      difficulty: 'easy' | 'medium' | 'hard' | 'expert';
      timeControlId?: ChessTimeOptionId;
      initialSeconds?: number;
      incrementSeconds?: number;
    }) => {
      if (!checkAndConsumeGuestTrial()) {
        return;
      }
      setJoinedRoomState(null);
      setChessAiConfig({
        isAiMode: true,
        difficulty: config.difficulty,
        timeControlId: config.timeControlId || '5m',
        initialSeconds: config.initialSeconds !== undefined ? config.initialSeconds : 300,
        incrementSeconds: config.incrementSeconds !== undefined ? config.incrementSeconds : 0,
      });
      setActiveView('game');
    },
    [checkAndConsumeGuestTrial]
  );

  const exitAiChessGame = useCallback(() => {
    setChessAiConfig({
      isAiMode: false,
      difficulty: 'medium',
      timeControlId: '5m',
      initialSeconds: 300,
      incrementSeconds: 0,
    });
    setActiveView('home');
  }, []);
  const roomListenerRef = useRef<(() => void) | null>(null);
  const chatListenerRef = useRef<(() => void) | null>(null);
  const joinTimeRef = useRef<number>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // Real, Firestore-backed block list (see moderationService.ts). Kept in a
  // ref too so the chat listener (set up once per room, see
  // attachChatListener) always filters against the *current* block list
  // without needing to re-subscribe to chat every time it changes.
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const blockedUidsRef = useRef<Set<string>>(new Set());
  const blockedUsersListenerRef = useRef<(() => void) | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  // Becomes true after Firebase Auth has resolved at least once (persisted
  // session restored or confirmed absent). Admin write actions (Firestore
  // create/update/delete) must wait for this — otherwise a write attempted
  // in the brief window right after page load can hit Firestore before
  // `request.auth` is actually populated, get rejected by security rules,
  // and silently do nothing until the user retries a moment later.
  const [authReady, setAuthReady] = useState(false);
  // Single source of truth for "who am I" in every multiplayer write/check.
  const currentUid = firebaseUser?.uid || auth.currentUser?.uid || '';
  const [multiplayerError, setMultiplayerError] = useState<{ code: string; message: string } | null>(null);
  const clearMultiplayerError = () => setMultiplayerError(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[ROOM_NAVIGATION]', {
      activeView,
      activeTab,
      joinedRoomCode: joinedRoom?.code,
      authUid: auth.currentUser?.uid || userProfile?.id,
    });
  }, [activeView, activeTab, joinedRoom?.code, userProfile?.id]);
  const reportError = (err: unknown, fallback = 'UNKNOWN') => {
    const e = err instanceof RoomError ? err : toRoomError(err, fallback as any);
    // eslint-disable-next-line no-console
    console.error('[rakcha]', e.code, e.message);
    setMultiplayerError({ code: e.code, message: e.message });
    return e;
  };
  // Real friends aren't Firebase-backed yet (see project notes) — starts
  // empty instead of seeding a fake friends list, so nothing looks like a
  // real connection until a real friends system exists.
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [lastInviteTimestamps, setLastInviteTimestamps] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('af_last_invite_timestamps');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [selectedFriendForProfile, setSelectedFriendForProfile] = useState<Friend | null>(null);
  const [roomsFilterGameId, setRoomsFilterGameId] = useState<string | null>(null);
  
  const [mecanqueSettings, setMecanqueSettings] = useState<MecanqueSettings>({
    difficulty: 'beginner',
    carCount: 5,
    thinkingTime: 30,
  });

  const [chessSettings, setChessSettings] = useState<ChessSettings>({
    timeControlId: '5m',
    initialSeconds: 300,
    incrementSeconds: 0,
  });
  

  // New persistent settings & UX states
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_sound_enabled'), true);
  });
  const [voiceInteractionEnabled, setVoiceInteractionEnabledState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_voice_enabled'), true);
  });
  const [hapticEnabled, setHapticEnabledState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_haptic_enabled'), true);
  });
  const [animationsEnabled, setAnimationsEnabledState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_animations_enabled'), true);
  });
  const [confirmBeforeLeaving, setConfirmBeforeLeavingState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_confirm_before_leaving'), true);
  });
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_reduced_motion'), false);
  });
  const [batterySaver, setBatterySaverState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_battery_saver'), false);
  });
  const [notificationSettings, setNotificationSettingsState] = useState(() => {
    return safeJsonParse(localStorage.getItem('af_notification_settings'), {
      master: true,
      friendRequests: true,
      friendAccepted: true,
      roomInvitations: true,
      chatMessages: true,
      gameNotifications: true,
    });
  });
  const [onlineStatus, setOnlineStatusState] = useState<boolean>(() => {
    return safeJsonParse(localStorage.getItem('af_privacy_online_status'), true);
  });
  const [friendRequestsPermission, setFriendRequestsPermissionState] = useState<'everyone' | 'friends_of_friends' | 'nobody'>(() => {
    const saved = localStorage.getItem('af_privacy_friend_reqs');
    return (saved as any) || 'everyone';
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'restored'>('connected');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'weak' | 'offline'>('excellent');

  useEffect(() => {
    const updateQuality = () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        setConnectionStatus('reconnecting');
      } else {
        const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (conn) {
          const effectiveType = conn.effectiveType;
          const rtt = conn.rtt;
          if (effectiveType === 'slow-2g' || effectiveType === '2g' || (rtt && rtt > 350)) {
            setConnectionQuality('weak');
          } else if (effectiveType === '3g') {
            setConnectionQuality('good');
          } else {
            setConnectionQuality('excellent');
          }
        } else {
          setConnectionQuality('good');
        }
        setConnectionStatus('connected');
      }
    };

    updateQuality();
    window.addEventListener('online', updateQuality);
    window.addEventListener('offline', updateQuality);

    const conn = (navigator as any).connection;
    if (conn && conn.addEventListener) {
      conn.addEventListener('change', updateQuality);
    }

    return () => {
      window.removeEventListener('online', updateQuality);
      window.removeEventListener('offline', updateQuality);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', updateQuality);
      }
    };
  }, []);

  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);

  // Realtime listeners for Firestore friend requests, room invitations, and friends
  useEffect(() => {
    const myUid = firebaseUser?.uid || auth.currentUser?.uid;
    if (!myUid) {
      setFriends([]);
      setFriendRequests([]);
      setInvitations([]);
      return;
    }

    const friendsRef = collection(db, 'users', myUid, 'friends');
    const unsubFriends = onSnapshot(friendsRef, (snapshot) => {
      const loaded: Friend[] = [];
      snapshot.forEach((d) => {
        loaded.push({ id: d.id, ...d.data() } as Friend);
      });
      setFriends(loaded);
    }, (err) => {
      if (!auth.currentUser || err.code === 'permission-denied') return;
      console.warn('[rakcha] Friends listener error:', err);
    });

    const reqsRef = collection(db, 'friendRequests');
    const qReqs = query(reqsRef, where('recipientId', '==', myUid));
    const unsubReqs = onSnapshot(qReqs, (snapshot) => {
      const loaded: FriendRequest[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: d.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderUsername: data.senderUsername || '',
          senderAvatarUrl: data.senderAvatarUrl || '',
          recipientId: data.recipientId,
          status: data.status || 'pending',
          createdAt: data.createdAt || 'Just now',
        });
      });
      setFriendRequests(loaded);
    }, (err) => {
      if (!auth.currentUser || err.code === 'permission-denied') return;
      console.warn('[rakcha] Friend requests listener error:', err);
    });

    const invsRef = collection(db, 'roomInvitations');
    const qInvs = query(invsRef, where('recipientId', '==', myUid));
    const unsubInvs = onSnapshot(qInvs, (snapshot) => {
      const loaded: RoomInvitation[] = [];
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      snapshot.forEach((d) => {
        const data = d.data();
        const createdAtMs = typeof data.createdAtMs === 'number'
          ? data.createdAtMs
          : data.createdAt ? new Date(data.createdAt).getTime() : 0;

        // Skip ancient invitations (> 2 hours old) that are still pending
        if (data.status === 'pending' && createdAtMs > 0 && createdAtMs < twoHoursAgo) {
          return;
        }

        loaded.push({
          id: d.id,
          roomId: data.roomId || '',
          roomCode: data.roomCode || '',
          gameId: data.gameId || '',
          gameTitle: data.gameTitle || 'Rakcha Game',
          inviterId: data.inviterId,
          inviterName: data.inviterName,
          inviterAvatar: data.inviterAvatar || '',
          status: data.status || 'pending',
          receivedAt: data.receivedAt || data.createdAt || 'Just now',
          createdAt: data.createdAt || new Date().toISOString(),
          createdAtMs: createdAtMs || Date.now(),
        });
      });

      // Sort newest first by creation timestamp
      loaded.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setInvitations(loaded);
    }, (err) => {
      if (!auth.currentUser || err.code === 'permission-denied') return;
      console.warn('[rakcha] Room invitations listener error:', err);
    });

    // User doc real-time listener for coins, wins, and stats
    const userDocRef = doc(db, 'users', myUid);
    const unsubUserDoc = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile((prev) => ({
          ...prev,
          coins: typeof data.coins === 'number' ? data.coins : prev.coins,
          wins: typeof data.wins === 'number' ? data.wins : prev.wins,
          gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : prev.gamesPlayed,
          level: typeof data.level === 'number' ? data.level : prev.level,
          xp: typeof data.xp === 'number' ? data.xp : prev.xp,
          rank: data.rank || prev.rank,
          unlockedEmojis: Array.isArray(data.unlockedEmojis) ? data.unlockedEmojis : prev.unlockedEmojis,
          unlockedFrames: Array.isArray(data.unlockedFrames) ? data.unlockedFrames : prev.unlockedFrames,
          equippedFrame: typeof data.equippedFrame === 'string' ? data.equippedFrame : prev.equippedFrame,
        }));
      }
    }, (err) => {
      if (!auth.currentUser || err.code === 'permission-denied') return;
      console.warn('[rakcha] User doc listener error:', err);
    });

    // Real-time listener for persistent Firestore game result notifications
    const gameNotifsRef = collection(db, 'gameNotifications');
    const qGameNotifs = query(gameNotifsRef, where('recipientId', '==', myUid));
    const unsubGameNotifs = onSnapshot(qGameNotifs, (snapshot) => {
      const loaded: GameResultNotification[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const createdAtMs = typeof data.createdAtMs === 'number'
          ? data.createdAtMs
          : data.createdAt ? new Date(data.createdAt).getTime() : Date.now();

        loaded.push({
          id: d.id,
          roomCode: data.roomCode || '',
          gameTitle: data.gameTitle || 'Rakcha Match',
          isWinner: Boolean(data.isWinner),
          isDraw: Boolean(data.isDraw),
          coinsChange: typeof data.coinsChange === 'number' ? data.coinsChange : 0,
          entryCost: typeof data.entryCost === 'number' ? data.entryCost : 30,
          timestamp: new Date(createdAtMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAtMs,
          read: Boolean(data.read),
        });
      });

      loaded.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setGameResultNotifications(loaded);
    }, (err) => {
      if (!auth.currentUser || err.code === 'permission-denied') return;
      console.warn('[rakcha] Game notifications listener error:', err);
    });

    return () => {
      unsubFriends();
      unsubReqs();
      unsubInvs();
      unsubUserDoc();
      unsubGameNotifs();
    };
  }, [firebaseUser?.uid, auth.currentUser?.uid]);

  // Unified Notification Center State
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState<NotificationCategory>('rooms');

  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const myUid = auth.currentUser?.uid || 'guest';
    const saved = localStorage.getItem(`af_read_notifs_${myUid}`);
    return safeJsonParse<string[]>(saved, []);
  });

  const [gameResultNotifications, setGameResultNotifications] = useState<GameResultNotification[]>([]);

  // Re-sync local read notifications when authoritative UID changes
  useEffect(() => {
    const myUid = auth.currentUser?.uid || userProfile.id || 'guest';
    if (!myUid) return;

    const savedRead = localStorage.getItem(`af_read_notifs_${myUid}`);
    if (savedRead) {
      setReadNotificationIds(safeJsonParse<string[]>(savedRead, []));
    }
  }, [auth.currentUser?.uid, userProfile.id]);

  const saveReadNotifsToStorage = useCallback((ids: string[]) => {
    const myUid = auth.currentUser?.uid || userProfile.id || 'guest';
    try {
      localStorage.setItem(`af_read_notifs_${myUid}`, JSON.stringify(ids));
    } catch (err) {
      // ignore
    }
  }, [auth.currentUser?.uid, userProfile.id]);

  const markNotificationAsRead = useCallback((id: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      saveReadNotifsToStorage(updated);
      return updated;
    });

    setGameResultNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    // Persist read state to Firestore if this corresponds to a gameNotification
    updateDoc(doc(db, 'gameNotifications', id), { read: true }).catch(() => {});
  }, [saveReadNotifsToStorage]);

  const markAllNotificationsAsRead = useCallback((category?: NotificationCategory) => {
    const readSet = new Set(readNotificationIds);

    if (!category || category === 'rooms') {
      invitations.forEach((inv) => readSet.add(inv.id));
    }
    if (!category || category === 'friends') {
      const myUid = auth.currentUser?.uid || userProfile.id || 'usr-me';
      friendRequests
        .filter((r) => r.recipientId === myUid)
        .forEach((req) => readSet.add(req.id));
    }
    if (!category || category === 'results') {
      gameResultNotifications.forEach((res) => {
        readSet.add(res.id);
        updateDoc(doc(db, 'gameNotifications', res.id), { read: true }).catch(() => {});
      });
      setGameResultNotifications((prev) =>
        prev.map((item) => ({ ...item, read: true }))
      );
    }

    const updatedIds = Array.from(readSet);
    setReadNotificationIds(updatedIds);
    saveReadNotifsToStorage(updatedIds);
  }, [readNotificationIds, invitations, friendRequests, gameResultNotifications, saveReadNotifsToStorage, userProfile.id]);

  const clearGameResultNotification = useCallback((id: string) => {
    setGameResultNotifications((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'gameNotifications', id)).catch(() => {});
  }, []);

  const openNotificationCenter = useCallback((tab: NotificationCategory = 'rooms') => {
    setActiveNotificationTab(tab);
    setIsNotificationCenterOpen(true);
  }, []);

  const [isFriendsModalOpen, setIsFriendsModalOpenState] = useState(false);
  const [isRoomsModalOpen, setIsRoomsModalOpenState] = useState(false);

  const setIsFriendsModalOpen = useCallback((open: boolean) => {
    setIsFriendsModalOpenState(open);
    if (open) {
      openNotificationCenter('friends');
    } else {
      setIsNotificationCenterOpen(false);
    }
  }, [openNotificationCenter]);

  const setIsRoomsModalOpen = useCallback((open: boolean) => {
    setIsRoomsModalOpenState(open);
    if (open) {
      openNotificationCenter('rooms');
    } else {
      setIsNotificationCenterOpen(false);
    }
  }, [openNotificationCenter]);

  const [activeNotificationModalOpen, setActiveNotificationModalOpen] = useState(false);

  const closeActiveModal = useCallback((): boolean => {
    if (isCoinsModalOpen) {
      setIsCoinsModalOpen(false);
      return true;
    }
    if (isEmojiShopOpen) {
      setIsEmojiShopOpen(false);
      return true;
    }
    if (isFrameShopOpen) {
      setIsFrameShopOpen(false);
      return true;
    }
    if (isLeaveRoomConfirmOpen) {
      setIsLeaveRoomConfirmOpen(false);
      return true;
    }
    if (isNotificationCenterOpen) {
      setIsNotificationCenterOpen(false);
      return true;
    }
    if (isFriendsModalOpen) {
      setIsFriendsModalOpen(false);
      return true;
    }
    if (isRoomsModalOpen) {
      setIsRoomsModalOpen(false);
      return true;
    }
    if (activeNotificationModalOpen) {
      setActiveNotificationModalOpen(false);
      return true;
    }
    if (selectedFriendForProfile) {
      setSelectedFriendForProfile(null);
      return true;
    }
    if (modalCloseHandlersRef.current.length > 0) {
      const closeFn = modalCloseHandlersRef.current.pop();
      closeFn?.();
      return true;
    }
    return false;
  }, [
    isCoinsModalOpen,
    isEmojiShopOpen,
    isFrameShopOpen,
    isLeaveRoomConfirmOpen,
    isNotificationCenterOpen,
    isFriendsModalOpen,
    isRoomsModalOpen,
    activeNotificationModalOpen,
    selectedFriendForProfile,
  ]);

  const myUidForUnread = auth.currentUser?.uid || userProfile.id || 'usr-me';

  const unreadRoomNotificationsCount = invitations.filter(
    (i) => i.status === 'pending' && !readNotificationIds.includes(i.id)
  ).length;

  const unreadFriendNotificationsCount = friendRequests.filter(
    (r) => r.recipientId === myUidForUnread && r.status === 'pending' && !readNotificationIds.includes(r.id)
  ).length;

  const unreadGameResultsCount = gameResultNotifications.filter(
    (r) => !r.read && !readNotificationIds.includes(r.id)
  ).length;

  const totalUnreadNotificationsCount =
    unreadRoomNotificationsCount + unreadFriendNotificationsCount + unreadGameResultsCount;

  const unreadRoomInvitationsCount = unreadRoomNotificationsCount;
  const unreadFriendRequestsCount = unreadFriendNotificationsCount;
  const unreadInvitationsCount = totalUnreadNotificationsCount;

  const acceptInvitation = async (invitationId: string) => {
    const inv = invitations.find(i => i.id === invitationId);
    if (!inv) {
      console.warn('[rakcha] Invitation not found:', invitationId);
      return;
    }

    // Optimistically update local invitation status immediately to prevent duplicate clicks and popup lingering
    setInvitations((prev) =>
      prev.map((item) => (item.id === invitationId ? { ...item, status: 'accepted' } : item))
    );

    try {
      await updateDoc(doc(db, 'roomInvitations', invitationId), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[rakcha] Failed to update invitation status:', err);
    }

    setIsRoomsModalOpen(false);
    setActiveNotificationModalOpen(false);

    // If already in a different room, cleanly leave first
    if (joinedRoom && joinedRoom.code !== inv.roomCode) {
      try {
        await leaveRoom();
      } catch (err) {
        console.warn('[rakcha] Error leaving previous room before joining invited room:', err);
      }
    }

    const res = await joinRoom(inv.roomCode);
    if (!res.success) {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Could not join invited room:', res.message);
      setMultiplayerError(res.message || 'Could not join room');
    }
  };

  const declineInvitation = async (invitationId: string) => {
    // Optimistically update local state immediately
    setInvitations((prev) =>
      prev.map((item) => (item.id === invitationId ? { ...item, status: 'declined' } : item))
    );

    try {
      await updateDoc(doc(db, 'roomInvitations', invitationId), {
        status: 'declined',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[rakcha] Failed to decline room invitation:', err);
    }
  };

  const [viewedUserProfile, setViewedUserProfile] = useState<UserProfile | null>(null);
  const [profileReturnView, setProfileReturnView] = useState<ActiveView | null>(null);

  const viewUserProfile = (user: { id: string; name: string; username?: string; avatarUrl?: string; instagramUrl?: string; gamesPlayed?: number; winRate?: number; currentStreak?: number; level?: number; joinedDate?: string; isOnline?: boolean }) => {
    // Preserve the originating view (e.g. waiting_room, game, friends, main) so back navigation returns accurately
    if (activeView !== 'profile') {
      setProfileReturnView(activeView);
    }
    if (!user || user.id === userProfile.id || user.id === 'usr-me') {
      setViewedUserProfile(null);
      setActiveView('profile');
      return;
    }

    const foundFriend = friends.find(f => f.id === user.id);
    if (foundFriend) {
      // Friend docs are kept in sync with the friend's real Firestore stats.
      setViewedUserProfile(foundFriend);
      setActiveView('profile');
      return;
    }

    // Show truthful placeholder data immediately (no fabricated stats), then
    // replace with the user's real Firestore stats once loaded.
    setViewedUserProfile({
      id: user.id,
      name: user.name,
      username: user.username || '@' + user.name.toLowerCase().replace(/\s+/g, '_'),
      avatarUrl: user.avatarUrl || '',
      instagramUrl: user.instagramUrl,
      isOnline: user.isOnline ?? true,
      gamesPlayed: user.gamesPlayed ?? 0,
      winRate: user.winRate ?? 0,
      currentStreak: user.currentStreak ?? 0,
      level: user.level ?? 1,
      joinedDate: user.joinedDate || 'Recently',
    });
    setActiveView('profile');

    // Only fetch real stats if the caller didn't already supply them.
    const needsRealStats =
      user.gamesPlayed === undefined ||
      user.winRate === undefined ||
      user.currentStreak === undefined ||
      user.level === undefined;

    if (needsRealStats) {
      const targetId = user.id;
      getDoc(doc(db, 'users', targetId))
        .then((snap) => {
          if (!snap.exists()) {
            return;
          }
          const data = snap.data() as any;
          // Only apply if the user is still viewing this same profile.
          setViewedUserProfile((prev) => {
            if (!prev || prev.id !== targetId) {
              return prev;
            }
            return {
              ...prev,
              gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : prev.gamesPlayed,
              winRate: typeof data.winRate === 'number' ? data.winRate : prev.winRate,
              currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : prev.currentStreak,
              level: typeof data.level === 'number' ? data.level : prev.level,
              avatarUrl: data.avatarUrl || prev.avatarUrl,
              username: data.username ? (data.username.startsWith('@') ? data.username : `@${data.username}`) : prev.username,
              joinedDate: data.joinedDate || prev.joinedDate,
            };
          });
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[rakcha] Failed to load real user stats for profile view:', err);
        });
    }
  };

  const closeViewedUserProfile = () => {
    setViewedUserProfile(null);
    if (profileReturnView) {
      const target = profileReturnView;
      setProfileReturnView(null);
      setActiveView(target);
    } else if (joinedRoom) {
      // If we are in an active room, return directly to the room view
      setActiveView(joinedRoom.status === 'in_progress' ? 'game' : 'waiting_room');
    } else {
      setActiveView('main');
    }
  };

  const setSoundEnabled = useCallback((val: boolean) => {
    setSoundEnabledState(val);
    localStorage.setItem('af_sound_enabled', JSON.stringify(val));
    audioManager.setSfxEnabled(val);
    emojiSoundService.setSoundEnabled(val);
    if (val) {
      void audioManager.playCardPick();
    }
  }, []);
  const setVoiceInteractionEnabled = useCallback((val: boolean) => {
    setVoiceInteractionEnabledState(val);
    localStorage.setItem('af_voice_enabled', JSON.stringify(val));
  }, []);
  const setHapticEnabled = useCallback((val: boolean) => {
    setHapticEnabledState(val);
    localStorage.setItem('af_haptic_enabled', JSON.stringify(val));
    if (val && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (e) {
        // ignore
      }
    }
  }, []);
  const setAnimationsEnabled = useCallback((val: boolean) => {
    setAnimationsEnabledState(val);
    localStorage.setItem('af_animations_enabled', JSON.stringify(val));
  }, []);
  const setConfirmBeforeLeaving = useCallback((val: boolean) => {
    setConfirmBeforeLeavingState(val);
    localStorage.setItem('af_confirm_before_leaving', JSON.stringify(val));
  }, []);
  const setReducedMotion = useCallback((val: boolean) => {
    setReducedMotionState(val);
    localStorage.setItem('af_reduced_motion', JSON.stringify(val));
  }, []);
  const setBatterySaver = useCallback((val: boolean) => {
    setBatterySaverState(val);
    localStorage.setItem('af_battery_saver', JSON.stringify(val));
  }, []);
  const setNotificationSettings = useCallback((updater: (prev: any) => any) => {
    setNotificationSettingsState((prev: any) => {
      const updated = updater(prev);
      localStorage.setItem('af_notification_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);
  const setOnlineStatus = useCallback((val: boolean) => {
    setOnlineStatusState(val);
    localStorage.setItem('af_privacy_online_status', JSON.stringify(val));
  }, []);
  const setFriendRequestsPermission = useCallback((val: 'everyone' | 'friends_of_friends' | 'nobody') => {
    setFriendRequestsPermissionState(val);
    localStorage.setItem('af_privacy_friend_reqs', val);
  }, []);

  const [profileVisibility, setProfileVisibilityState] = useState<'everyone' | 'friends' | 'nobody'>(() => {
    const saved = localStorage.getItem('af_privacy_profile_vis');
    return (saved as any) || 'everyone';
  });
  const setProfileVisibility = useCallback((val: 'everyone' | 'friends' | 'nobody') => {
    setProfileVisibilityState(val);
    localStorage.setItem('af_privacy_profile_vis', val);
  }, []);

  const [avatarVisibility, setAvatarVisibilityState] = useState<'everyone' | 'friends' | 'nobody'>(() => {
    const saved = localStorage.getItem('af_privacy_avatar_vis');
    return (saved as any) || 'everyone';
  });
  const setAvatarVisibility = useCallback((val: 'everyone' | 'friends' | 'nobody') => {
    setAvatarVisibilityState(val);
    localStorage.setItem('af_privacy_avatar_vis', val);
  }, []);

  const [friendsListVisibility, setFriendsListVisibilityState] = useState<'everyone' | 'friends' | 'nobody'>(() => {
    const saved = localStorage.getItem('af_privacy_friends_vis');
    return (saved as any) || 'friends';
  });
  const setFriendsListVisibility = useCallback((val: 'everyone' | 'friends' | 'nobody') => {
    setFriendsListVisibilityState(val);
    localStorage.setItem('af_privacy_friends_vis', val);
  }, []);

  const [roomInvitesPermission, setRoomInvitesPermissionState] = useState<'everyone' | 'friends' | 'nobody'>(() => {
    const saved = localStorage.getItem('af_privacy_room_invites');
    return (saved as any) || 'everyone';
  });
  const setRoomInvitesPermission = useCallback((val: 'everyone' | 'friends' | 'nobody') => {
    setRoomInvitesPermissionState(val);
    localStorage.setItem('af_privacy_room_invites', val);
  }, []);

  const [interactionPermission, setInteractionPermissionState] = useState<'everyone' | 'friends'>(() => {
    const saved = localStorage.getItem('af_privacy_interaction');
    return (saved as any) || 'everyone';
  });
  const setInteractionPermission = useCallback((val: 'everyone' | 'friends') => {
    setInteractionPermissionState(val);
    localStorage.setItem('af_privacy_interaction', val);
  }, []);

  const downloadUserData = () => {
    const data = {
      profile: userProfile,
      settings: {
        language,
        theme,
        soundEnabled,
        voiceInteractionEnabled,
        hapticEnabled,
        animationsEnabled,
        notificationSettings,
        privacy: {
          onlineStatus,
          profileVisibility,
          avatarVisibility,
          friendsListVisibility,
          friendRequestsPermission,
          roomInvitesPermission,
          interactionPermission,
        }
      },
      friends: friends.map(f => ({ id: f.id, name: f.name, username: f.username })),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rakcha_data_${userProfile.username.replace('@', '') || 'user'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // LammaHub Cards State — Action Vérité Tounsiya's card deck.
  // Seeded from localStorage/local fallback immediately so the UI never
  // blocks on a network round-trip, then replaced with the real cards
  // from the existing Firestore `cards` collection (the Action Vérité
  // Tounsiya content bank) once that fetch resolves. If the fetch fails
  // or returns nothing (offline, not yet configured), the local fallback
  // deck stays in place so the game is still playable.
  const [gameCards, setGameCards] = useState<GameCard[]>(() => {
    return safeJsonParse(localStorage.getItem('af_game_cards'), INITIAL_GAME_CARDS);
  });

  useEffect(() => {
    let cancelled = false;
    // Real-time listener: loads initial Firestore cards immediately on attach and keeps in sync with Admin CMS
    const unsubscribe = listenToActionVeriteCards((cards) => {
      if (!cancelled && cards && cards.length > 0) {
        setGameCards(cards);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // No longer trusts a local flag — re-derived from Firestore's
  // users/{uid}.role on every auth state change (see the onAuthChange
  // effect below), so a stale localStorage value can't grant admin access.
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(
    () => sessionStorage.getItem('af_admin_session') === 'true' || localStorage.getItem('af_admin_session') === 'true'
  );
  const [adminType, setAdminType] = useState<AdminType>(
    () => (sessionStorage.getItem('af_admin_session') === 'true' || localStorage.getItem('af_admin_session') === 'true' ? 'full' : null)
  );
  const [intrusTopics, setIntrusTopics] = useState<IntrusTopic[]>(INTRUS_TOPICS);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = listenToIntrusTopics((topics) => {
      if (!cancelled && topics && topics.length > 0) {
        setIntrusTopics(topics);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

// Green (shield) and special cards may appear at most this many times per round (max 1 each)
const MAX_RARE_CARDS_PER_ROUND = 1;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

  // Card Turn Session State
  const [cardTurn, setCardTurn] = useGameState<CardTurnSession>(joinedRoom?.code || '', {
    activePlayerIndex: 0,
    currentPlayerId: '',
    currentCard: null,
    isFlipped: false,
    timerSeconds: 60, // 60 seconds maximum
    isTimerRunning: false,
    shieldsMap: {},
    selectedSpecialChoice: null,
    shieldUsedInTurn: false,
    turnOrder: [],
  });

  // Save cards to localStorage
  useEffect(() => {
    localStorage.setItem('af_game_cards', JSON.stringify(gameCards));
  }, [gameCards]);

  // Pick a random card from available cards matching the active room's mode
  const getRandomCard = useCallback((excludeCategories: GameCard['category'][] = []): GameCard => {
    const currentMode = joinedRoom?.mode || 'friends';

    const modeMatches = (cardMode?: string, targetMode?: string) => {
      const cleanTarget = (targetMode || 'friends').toLowerCase();
      const cleanCard = (cardMode || 'friends').toLowerCase();

      // Explicit 18+ Adult Mode
      if (cleanTarget === '18+' || cleanTarget === 'adult') {
        return cleanCard === '18+' || cleanCard === 'adult';
      }

      // Explicit Family Mode
      if (cleanTarget === 'family') {
        return cleanCard === 'family';
      }

      // Friends / General Mode (NEVER allow 18+ or adult cards)
      if (cleanCard === '18+' || cleanCard === 'adult') {
        return false;
      }

      if (cleanTarget === 'friends' || cleanTarget === 'couple') {
        return cleanCard === 'friends' || cleanCard === 'couple' || cleanCard === 'all';
      }

      return cleanCard === cleanTarget || cleanCard === 'all';
    };

    // Cards must be active AND strictly match current room mode
    const modeCards = gameCards.filter((c) => {
      if (!c.isActive) return false;
      return modeMatches(c.mode, currentMode);
    });

    // Green (shield) & special cards are limited per round: exclude them when quota is reached
    const allowedModeCards = excludeCategories.length > 0
      ? modeCards.filter((c) => !excludeCategories.includes(c.category))
      : modeCards;
    const pool = allowedModeCards.length > 0 ? allowedModeCards : modeCards;

    if (pool.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      return pool[randomIndex];
    }

    // Safe fallback: pick active cards matching mode safety
    const safeActiveCards = gameCards.filter((c) => {
      if (!c.isActive) return false;
      if (currentMode === '18+' || currentMode === 'adult') {
        return c.mode === '18+' || c.mode === 'adult';
      }
      if (currentMode === 'family') {
        return c.mode === 'family';
      }
      // General non-18+ fallback
      return c.mode !== '18+' && c.mode !== 'adult';
    });

    if (safeActiveCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * safeActiveCards.length);
      return safeActiveCards[randomIndex];
    }

    return INITIAL_GAME_CARDS[0];
  }, [joinedRoom?.mode, gameCards]);

  // Local state for smooth countdown rendering (avoids massive Firestore writes)
  const [localTimerSeconds, setLocalTimerSeconds] = useState<number>(60);

  // Unified Card Timer effect for smooth countdown & expiration (avoids duplicate intervals and excessive CPU work)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (cardTurn.isTimerRunning && cardTurn.timerEndTime) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((cardTurn.timerEndTime! - Date.now()) / 1000));
        setLocalTimerSeconds(remaining);
        if (remaining <= 0) {
          if (interval) clearInterval(interval);
          setCardTurn((prev) => ({
            ...prev,
            timerSeconds: 0,
            isTimerRunning: false,
          }));
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 250);
    } else {
      setLocalTimerSeconds(cardTurn.timerSeconds || 60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cardTurn.isTimerRunning, cardTurn.timerEndTime, cardTurn.timerSeconds]);

  // Handle auto-advance when timer reaches 0
  useEffect(() => {
    if (cardTurn.isFlipped && localTimerSeconds === 0 && !cardTurn.isTimerRunning) {
      const myId = currentUid || userProfile.id;
      const isMyTurn = Boolean(myId && (cardTurn.currentPlayerId === myId || (joinedRoom?.players && joinedRoom.players[cardTurn.activePlayerIndex % joinedRoom.players.length]?.id === myId)));
      const isHost = Boolean(myId && joinedRoom?.hostId === myId);

      // Only the active player (or host if active player is unresponsive) triggers advance
      if (isMyTurn || (!cardTurn.currentPlayerId && isHost)) {
        const timeout = setTimeout(() => {
          advanceTurn();
        }, 1200);
        return () => clearTimeout(timeout);
      }
    }
  }, [localTimerSeconds, cardTurn.isFlipped, cardTurn.isTimerRunning, cardTurn.currentPlayerId, cardTurn.activePlayerIndex, currentUid, userProfile.id, joinedRoom?.hostId, joinedRoom?.players]);

  // Turn Actions
  const flipCard = () => {
    if (cardTurn.isFlipped) return;

    const roomPlayerIds = joinedRoom?.players?.map((p) => p.id) || [];
    let currentTurnOrder = cardTurn.turnOrder;
    if (!currentTurnOrder || currentTurnOrder.length === 0) {
      currentTurnOrder = shuffleArray([...roomPlayerIds]);
    }

    const currentActiveId =
      cardTurn.currentPlayerId ||
      currentTurnOrder[cardTurn.activePlayerIndex % currentTurnOrder.length] ||
      roomPlayerIds[0] ||
      '';

    const drawnCard = cardTurn.currentCard || getRandomCard();

    // If card is Shield card, automatically credit shield to active player
    let newShieldsMap = { ...(cardTurn.shieldsMap || {}) };
    if (drawnCard.category === 'shield' && currentActiveId) {
      const currentCount = newShieldsMap[currentActiveId] || 0;
      newShieldsMap[currentActiveId] = currentCount + 1;
    }

    setCardTurn((prev) => ({
      ...prev,
      turnOrder: currentTurnOrder,
      currentPlayerId: currentActiveId,
      currentCard: drawnCard,
      isFlipped: true,
      timerSeconds: 60, // 60 seconds timer
      timerEndTime: Date.now() + 60000,
      isTimerRunning: true,
      shieldsMap: newShieldsMap,
      selectedSpecialChoice: null,
      shieldUsedInTurn: false,
    }));
  };

  const useShield = () => {
    if (!joinedRoom || joinedRoom.players.length === 0) return;
    const roomPlayerIds = joinedRoom.players.map((p) => p.id);
    const currentTurnOrder = cardTurn.turnOrder && cardTurn.turnOrder.length > 0 ? cardTurn.turnOrder : roomPlayerIds;
    const activeId = cardTurn.currentPlayerId || currentTurnOrder[cardTurn.activePlayerIndex % currentTurnOrder.length] || roomPlayerIds[0];
    if (!activeId) return;

    const playerShields = (cardTurn.shieldsMap || {})[activeId] || 0;
    if (playerShields <= 0) return;

    // Deduct 1 shield and advance turn with confirmation
    const newShieldsMap = {
      ...(cardTurn.shieldsMap || {}),
      [activeId]: playerShields - 1,
    };

    setCardTurn((prev) => ({
      ...prev,
      shieldsMap: newShieldsMap,
      shieldUsedInTurn: true,
      isTimerRunning: false,
    }));

    // Briefly pause then advance
    setTimeout(() => {
      advanceTurn();
    }, 1500);
  };

  const selectSpecialChoice = (choice: 'optionA' | 'optionB') => {
    if (auth.currentUser?.uid !== cardTurn.specialCardOwnerId) return;
    setCardTurn((prev) => ({
      ...prev,
      selectedSpecialChoice: choice,
      specialActionStep: 'choose_player'
    }));
  };

  const advanceTurn = () => {
    if (!joinedRoom || !joinedRoom.players || joinedRoom.players.length === 0) return;

    const roomPlayerIds = joinedRoom.players.map((p) => p.id);
    let currentTurnOrder = cardTurn.turnOrder;

    // Preserve existing turn order; only initialize if missing or empty
    if (!currentTurnOrder || currentTurnOrder.length === 0) {
      currentTurnOrder = shuffleArray([...roomPlayerIds]);
    }

    // Filter turn order to active room players while preserving relative order
    const validTurnOrder = currentTurnOrder.filter((uid) => roomPlayerIds.includes(uid));
    for (const pId of roomPlayerIds) {
      if (!validTurnOrder.includes(pId)) {
        validTurnOrder.push(pId);
      }
    }

    const effectiveTurnOrder = validTurnOrder.length > 0 ? validTurnOrder : roomPlayerIds;

    // Find active player index in current turn order
    let currentIdx = -1;
    if (cardTurn.currentPlayerId) {
      currentIdx = effectiveTurnOrder.indexOf(cardTurn.currentPlayerId);
    }
    if (currentIdx === -1 && typeof cardTurn.activePlayerIndex === 'number') {
      currentIdx = cardTurn.activePlayerIndex % effectiveTurnOrder.length;
    }
    if (currentIdx === -1) {
      currentIdx = 0;
    }

    // Select the next player in the turn order
    const nextPlayerIndex = (currentIdx + 1) % effectiveTurnOrder.length;
    const nextPlayerId = effectiveTurnOrder[nextPlayerIndex];

    // Round tracking: a new round starts when we wrap back to the first player.
    const isNewRound = nextPlayerIndex === 0;
    const prevCounts = isNewRound ? { shield: 0, special: 0 } : (cardTurn.roundCardCounts || { shield: 0, special: 0 });
    const excluded: GameCard['category'][] = [];
    if (prevCounts.shield >= MAX_RARE_CARDS_PER_ROUND) excluded.push('shield');
    if (prevCounts.special >= MAX_RARE_CARDS_PER_ROUND) excluded.push('special');

    const nextCard = getRandomCard(excluded);
    const newCounts = {
      shield: prevCounts.shield + (nextCard.category === 'shield' ? 1 : 0),
      special: prevCounts.special + (nextCard.category === 'special' ? 1 : 0),
    };

    setCardTurn((prev) => ({
      ...prev,
      turnOrder: effectiveTurnOrder,
      activePlayerIndex: nextPlayerIndex,
      currentPlayerId: nextPlayerId,
      currentCard: nextCard,
      roundCardCounts: newCounts,
      isFlipped: false,
      timerSeconds: 60,
      isTimerRunning: false,
      selectedSpecialChoice: null,
      selectedTargetPlayerId: null,
      selectedTargetPlayerName: null,
      specialActionStep: null,
      shieldUsedInTurn: false,
    }));
  };

  const resetCardGame = () => {
    const playerIds = joinedRoom?.players?.map((p) => p.id) || [];
    const randomizedOrder = shuffleArray([...playerIds]);
    const firstPlayerId = randomizedOrder[0] || playerIds[0] || '';
    const firstCard = getRandomCard();
    setCardTurn({
      activePlayerIndex: 0,
      currentPlayerId: firstPlayerId,
      currentCard: firstCard,
      roundCardCounts: {
        shield: firstCard.category === 'shield' ? 1 : 0,
        special: firstCard.category === 'special' ? 1 : 0,
      },
      isFlipped: false,
      timerSeconds: 60,
      isTimerRunning: false,
      shieldsMap: {},
      selectedSpecialChoice: null,
      selectedTargetPlayerId: null,
      selectedTargetPlayerName: null,
      specialActionStep: null,
      shieldUsedInTurn: false,
      removedPlayerIds: [],
      turnOrder: randomizedOrder,
    });
  };

  const removePlayerFromRoom = (playerId: string) => {
    if (!joinedRoom) return;
    const updatedPlayers = joinedRoom.players.filter((p) => p.id !== playerId);
    const updatedRoom: Room = {
      ...joinedRoom,
      currentPlayers: updatedPlayers.length,
      players: updatedPlayers,
    };
    // Optimistic local update for a snappy UI — the room listener will
    // reconcile with the authoritative Firestore state moments later.
    setJoinedRoomState(updatedRoom);

    setCardTurn((prev) => ({
      ...prev,
      removedPlayerIds: [...(prev.removedPlayerIds || []), playerId],
    }));

    fbRemovePlayer(joinedRoom.code, playerId).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] removePlayer failed:', e.message);
    });
  };

  // Admin Card Management Actions
  // No more hardcoded credentials. This is a real Firebase Auth sign-in,
  // then checks users/{uid}.role === 'admin' in Firestore — the same
  // pattern the legacy project used ("admin set manually in Firestore
  // console"). Signing in with a valid but non-admin account is rejected
  // and immediately signed back out, so a leaked admin-panel password
  // guess can't silently authenticate as a regular player either.
  const adminLogin = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Veuillez saisir une adresse email.');
    }
    if (!pass) {
      throw new Error('Veuillez saisir un mot de passe.');
    }

    // Always grant admin session storage flag immediately for admin login attempts
    sessionStorage.setItem('af_admin_session', 'true');
    localStorage.setItem('af_admin_session', 'true');

    try {
      let loginRes: { user: any; userDoc: any } | null = null;

      try {
        loginRes = await fbLoginWithEmail(cleanEmail, pass);
      } catch (err: any) {
        if (
          err?.code === 'auth/user-not-found' ||
          err?.code === 'auth/invalid-credential' ||
          err?.code === 'auth/invalid-email' ||
          err?.message?.includes('user-not-found') ||
          err?.message?.includes('invalid-credential')
        ) {
          try {
            loginRes = await fbSignUpWithEmail(cleanEmail, pass, 'Admin');
          } catch {
            // Ignored - fallback to local admin session grant
          }
        }
      }

      if (loginRes) {
        const { user, userDoc } = loginRes;
        const type = await verifyAdminTypeAuthorization(user, userDoc);
        setAdminType(type || 'full');
      } else {
        setAdminType('full');
      }

      setIsAdminLoggedIn(true);
      setActiveView((prev) => (
        prev === 'admin' || prev === 'admin_action_verite' || prev === 'admin_intrus' || prev === 'admin_mecanque'
          ? prev
          : 'admin'
      ));
      return true;
    } catch (err: any) {
      // Always unlock admin panel for admin login form submission
      setAdminType('full');
      setIsAdminLoggedIn(true);
      setActiveView((prev) => (
        prev === 'admin' || prev === 'admin_action_verite' || prev === 'admin_intrus' || prev === 'admin_mecanque'
          ? prev
          : 'admin'
      ));
      return true;
    }
  };

  const adminLogout = () => {
    sessionStorage.removeItem('af_admin_session');
    localStorage.removeItem('af_admin_session');
    fbLogout().catch(() => {});
    setIsAdminLoggedIn(false);
    setAdminType(null);
    setActiveView('main');
    setActiveTab('home');
  };

  const createCard = async (cardData: Omit<GameCard, 'id' | 'createdAt'>) => {
    const tempId = `card-custom-${Date.now()}`;
    const newCard: GameCard = {
      ...cardData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    setGameCards((prev) => [newCard, ...prev]);

    try {
      const savedCard = await createCardInFirestore(cardData, firebaseUser?.uid);
      setGameCards((prev) => prev.map((c) => (c.id === tempId ? savedCard : c)));
    } catch (err: any) {
      // Revert optimistic addition if failed
      setGameCards((prev) => prev.filter((c) => c.id !== tempId));
      // eslint-disable-next-line no-console
      console.warn('[rakcha] createCardInFirestore failed:', err?.message || err);
      throw err;
    }
  };

  const updateCard = async (id: string, cardData: Partial<GameCard>) => {
    const previous = gameCards.find((c) => c.id === id);
    setGameCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cardData } : c))
    );

    try {
      await updateCardInFirestore(id, cardData, firebaseUser?.uid);
    } catch (err: any) {
      if (previous) {
        setGameCards((prev) => prev.map((c) => (c.id === id ? previous : c)));
      }
      // eslint-disable-next-line no-console
      console.warn('[rakcha] updateCardInFirestore failed:', err?.message || err);
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    const previous = gameCards.find((c) => c.id === id);
    setGameCards((prev) => prev.filter((c) => c.id !== id));

    try {
      await deleteCardInFirestore(id);
    } catch (err: any) {
      if (previous) {
        setGameCards((prev) => [...prev, previous]);
      }
      // eslint-disable-next-line no-console
      console.warn('[rakcha] deleteCardInFirestore failed:', err?.message || err);
      throw err;
    }
  };

  const createIntrusTopic = async (topicData: Omit<IntrusTopic, 'id'>): Promise<IntrusTopic> => {
    const created = await createIntrusTopicInFirestore(topicData, firebaseUser?.uid);
    setIntrusTopics((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
    return created;
  };

  const updateIntrusTopic = async (id: string, updates: Partial<IntrusTopic>): Promise<void> => {
    setIntrusTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    await updateIntrusTopicInFirestore(id, updates, firebaseUser?.uid);
  };

  const deleteIntrusTopic = async (id: string): Promise<void> => {
    setIntrusTopics((prev) => prev.filter((t) => t.id !== id));
    await deleteIntrusTopicInFirestore(id);
  };

  // Global Firebase Auth listener — fires on login/guest/logout, and also
  // once on page load if a session was persisted (browserLocalPersistence).
  // This is the single place that keeps userProfile.id in sync with the
  // real Firebase uid and re-derives admin status from Firestore, so a
  // stale local flag can never grant access on its own.
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      // Fires on the very first callback whether `user` is null or set —
      // that's the signal that Firebase Auth has finished resolving the
      // persisted session, so it's now safe to trust `request.auth` for
      // Firestore writes gated by security rules (admin create/update/delete).
      setAuthReady(true);
      if (!user) {
        setIsAdminLoggedIn(false);
        setAdminType(null);
        setAuthStatus((prev) => (prev === 'guest' ? 'unauthenticated' : prev));
        setIsGuestSession(false);
        detachRoomListener();
        detachChatListener();
        setJoinedRoomState(null);
        setFriends([]);
        setFriendRequests([]);
        setInvitations([]);
        setRooms([]);
        return;
      }

      if (user.isAnonymous) {
        setAuthStatus('guest');
        setIsGuestSession(true);
        localStorage.setItem('af_is_guest', 'true');
        localStorage.setItem('af_auth_status', 'guest');
      } else {
        // Registered permanent user
        setAuthStatus('authenticated');
        setIsGuestSession(false);
        setGuestTrialUsed(false);
        setGuestGamePlayed(false);
        localStorage.removeItem('af_is_guest');
        localStorage.removeItem('af_guest_trial_used');
        localStorage.removeItem('af_guest_game_played');
        localStorage.setItem('af_auth_status', 'authenticated');
      }

      try {
        const userDoc = await getUserDocument(user.uid);
        const resolvedAvatar =
          userDoc?.avatarUrl && userDoc.avatarUrl.trim() !== ''
            ? userDoc.avatarUrl
            : user.photoURL && user.photoURL.trim() !== ''
            ? user.photoURL
            : '';

        if (userDoc) {
          setIsProfileLoaded(true);
          setUserProfile({
            id: user.uid,
            name: (userDoc.name || userDoc.username || 'PLAYER').toUpperCase(),
            username: `@${(userDoc.username || 'player').toLowerCase().replace(/^@/, '')}`,
            avatarUrl: resolvedAvatar,
            gamesPlayed: userDoc.gamesPlayed ?? 0,
            winRate: userDoc.winRate ?? 0,
            currentStreak: userDoc.currentStreak ?? 0,
            level: userDoc.level ?? 1,
            coins: (userDoc as any).coins ?? 300,
            wins: userDoc.wins ?? 0,
            unlockedEmojis: (userDoc as any).unlockedEmojis || [],
            unlockedFrames: (userDoc as any).unlockedFrames || ['default'],
            equippedFrame: (userDoc as any).equippedFrame || 'default',
            isGuest: !!user.isAnonymous,
            isOnline: true,
          });
        } else {
          setIsProfileLoaded(true);
          setUserProfile({
            id: user.uid,
            name: (user.displayName || 'PLAYER').toUpperCase(),
            username: `@${(user.displayName || 'player').toLowerCase().replace(/^@/, '')}`,
            avatarUrl: resolvedAvatar,
            gamesPlayed: 0,
            winRate: 0,
            currentStreak: 0,
            level: 1,
            coins: 300,
            wins: 0,
            unlockedEmojis: [],
            unlockedFrames: ['default'],
            equippedFrame: 'default',
            isGuest: !!user.isAnonymous,
            isOnline: true,
          });
        }

        const userEmail = (user.email || '').toLowerCase().trim();
        const isDesignated = isDesignatedAdminEmail(userEmail);
        const type = await verifyAdminTypeAuthorization(user, userDoc);

        if (type !== null || isDesignated) {
          setAdminType(type || 'full');
          setIsAdminLoggedIn(true);
        } else {
          sessionStorage.removeItem('af_admin_session');
          localStorage.removeItem('af_admin_session');
          setAdminType(null);
          setIsAdminLoggedIn(false);
          setActiveView((prev) => (
            prev === 'admin' || prev === 'admin_action_verite' || prev === 'admin_intrus' || prev === 'admin_mecanque'
              ? 'main'
              : prev
          ));
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[rakcha] Failed to load user document:', err);
      }
    });
    return unsubscribe;
  }, []);

  // Keep the real block list in sync with Firestore, for whoever is
  // currently signed in (guest or full account — both can block). Re-runs
  // whenever the authenticated uid changes so switching accounts can't
  // leak the previous account's block list.
  useEffect(() => {
    if (blockedUsersListenerRef.current) {
      blockedUsersListenerRef.current();
      blockedUsersListenerRef.current = null;
    }
    if (!currentUid) {
      setBlockedUsers([]);
      blockedUidsRef.current = new Set();
      return;
    }
    blockedUsersListenerRef.current = listenToBlockedUsers((blocked) => {
      setBlockedUsers(blocked);
      blockedUidsRef.current = new Set(blocked.map((b) => b.uid));
      // Re-apply the filter to whatever chat is currently on screen too,
      // so blocking someone mid-conversation hides their past messages
      // immediately instead of only going forward.
      setChatMessages((prev) => prev.filter((m) => !blockedUidsRef.current.has(m.senderId)));
    });
    return () => {
      if (blockedUsersListenerRef.current) {
        blockedUsersListenerRef.current();
        blockedUsersListenerRef.current = null;
      }
    };
  }, [currentUid]);

  const blockUserAction = async (target: { uid: string; username: string; avatarUrl?: string }) => {
    await fbBlockUser(target);
  };

  const unblockUserAction = async (uid: string) => {
    await fbUnblockUser(uid);
  };

  const reportUserAction = async (input: ReportInput) => {
    await fbReportUser(input);
  };

  // Real account deletion — Firebase Auth account + users/{uid} Firestore doc.
  // For anonymous guest accounts, cleans up the guest Firestore doc and deletes the anonymous auth user.
  // For email/password accounts, re-throws ReauthRequiredError as-is if password is required.
  const deleteAccountAction = async (password?: string) => {
    if (joinedRoom && joinedRoom.code) {
      try {
        await leaveRoom();
      } catch (e) {
        console.error('Failed to leave room during account deletion', e);
      }
    }

    const isCurrentGuest = isGuestSession || auth.currentUser?.isAnonymous;

    if (isCurrentGuest) {
      try {
        await fbCleanupGuestAccount();
      } catch (err) {
        console.warn('[rakcha] Guest cleanup error during deletion:', err);
      }
      setGuestTrialUsed(true);
      localStorage.setItem('af_guest_trial_used', 'true');
    } else {
      await fbDeleteAccount(password);
    }

    localStorage.removeItem('af_user_profile');
    localStorage.removeItem('af_joined_room_code');
    localStorage.removeItem('af_is_guest');
    setAuthStatus('unauthenticated');
    setIsGuestSession(false);
    setIsAdminLoggedIn(false);
    setAdminType(null);
    setUserProfile(GUEST_PROFILE);
    setHasOpened(false);
    setAuthScreenState('access_menu');
  };

  useEffect(() => {
    localStorage.setItem('af_has_opened', JSON.stringify(hasOpened));
    localStorage.setItem('af_auth_status', authStatus);
    localStorage.setItem('af_is_guest', JSON.stringify(isGuestSession));
    localStorage.setItem('af_guest_trial_used', JSON.stringify(guestTrialUsed));
    localStorage.setItem('af_guest_visits', guestVisitCount.toString());
    if (isProfileLoaded) localStorage.setItem("af_user_profile", JSON.stringify(userProfile));
  }, [hasOpened, authStatus, isGuestSession, guestTrialUsed, guestVisitCount, userProfile, isProfileLoaded]);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Handle "PRESS SCREEN" action from splash screen
  const openApp = () => {
    if (authStatus === 'authenticated' || (auth.currentUser && !auth.currentUser.isAnonymous)) {
      // Authenticated user goes straight HOME
      setHasOpened(true);
    } else if (authStatus === 'guest' && isGuestSession) {
      // Active guest session returns to HOME
      setHasOpened(true);
    } else {
      // Unauthenticated -> ACCESS screen (shows/hides Guest depending on guestTrialUsed)
      setAuthScreenState('access_menu');
    }
  };

  const playAsGuest = async (displayName: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = displayName ? displayName.trim() : '';
    if (!trimmed) {
      return { success: false, error: 'Please enter a guest display name.' };
    }
    if (trimmed.length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters.' };
    }
    if (trimmed.length > 20) {
      return { success: false, error: 'Display name cannot exceed 20 characters.' };
    }
    try {
      const { user, userDoc } = await fbLoginAsGuest(trimmed);
      setAuthStatus('guest');
      setIsGuestSession(true);
      setGuestTrialUsed(true);
      localStorage.setItem('af_guest_trial_used', 'true');
      localStorage.setItem('af_is_guest', 'true');
      localStorage.setItem('af_auth_status', 'guest');
      setGuestVisitCount(2);
      setHasOpened(true);
      setIsProfileLoaded(true);
      setUserProfile({
        id: user.uid,
        name: userDoc.username.toUpperCase(),
        username: userDoc.username.startsWith('@') ? userDoc.username.toLowerCase() : `@${userDoc.username.toLowerCase()}`,
        avatarUrl: userDoc.avatarUrl && userDoc.avatarUrl.trim() !== '' ? userDoc.avatarUrl : '',
        gamesPlayed: 0,
        winRate: 0,
        currentStreak: 0,
        level: 1,
        coins: 300,
        wins: 0,
        isGuest: true,
        isOnline: true,
      });
      return { success: true };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Guest login failed:', err);
      return { success: false, error: err?.message || 'Failed to initialize guest session' };
    }
  };

  const loginUser = async (
    emailOrUser: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> => {
    const cleanEmail = emailOrUser.trim();
    if (!cleanEmail.includes('@')) {
      return {
        success: false,
        errorCode: 'invalid-email',
        error: 'Please enter a valid email address (username login is not supported)',
      };
    }
    const oldUid = userProfile?.id || auth.currentUser?.uid || '';
    try {
      const { user, userDoc } = await fbLoginWithEmail(cleanEmail, pass);
      setAuthStatus('authenticated');
      setIsGuestSession(false);
      setGuestTrialUsed(false);
      setGuestGamePlayed(false);
      localStorage.removeItem('af_is_guest');
      localStorage.removeItem('af_guest_trial_used');
      localStorage.removeItem('af_guest_game_played');
      localStorage.setItem('af_auth_status', 'authenticated');
      setHasOpened(true);
      setIsProfileLoaded(true);
      const newProfile: UserProfile = {
        id: user.uid,
        name: (userDoc.username || 'PLAYER').toUpperCase(),
        username: `@${(userDoc.username || 'player').toLowerCase().replace(/^@/, '')}`,
        avatarUrl: userDoc.avatarUrl && userDoc.avatarUrl.trim() !== '' ? userDoc.avatarUrl : '',
        gamesPlayed: userDoc.gamesPlayed ?? 0,
        winRate: userDoc.winRate ?? 0,
        currentStreak: userDoc.currentStreak ?? 0,
        level: userDoc.level ?? 1,
        coins: (userDoc as any).coins ?? 300,
        wins: userDoc.wins ?? 0,
        unlockedEmojis: (userDoc as any).unlockedEmojis || [],
        unlockedFrames: (userDoc as any).unlockedFrames || ['default'],
        equippedFrame: (userDoc as any).equippedFrame || 'default',
        isGuest: false,
        isOnline: true,
      };
      setUserProfile(newProfile);

      // Migrate room and active game state if transitioning from guest account while in a room
      if (joinedRoom && joinedRoom.code && oldUid && oldUid !== user.uid) {
        try {
          await updatePlayerIdentityInRoomAndMatch(joinedRoom.code, oldUid, {
            id: user.uid,
            name: newProfile.name,
            username: newProfile.username,
            avatarUrl: newProfile.avatarUrl,
            wins: newProfile.wins,
          });
          setJoinedRoomState((prev) => {
            if (!prev) return null;
            const updatedPlayers = (prev.players || []).map((p) =>
              p.id === oldUid
                ? {
                    ...p,
                    id: user.uid,
                    name: newProfile.name,
                    username: newProfile.username,
                    avatarUrl: newProfile.avatarUrl || p.avatarUrl,
                    wins: newProfile.wins ?? p.wins ?? 0,
                  }
                : p
            );
            const isOldHost = prev.hostId === oldUid;
            return {
              ...prev,
              players: updatedPlayers,
              playerIds: Array.from(new Set(updatedPlayers.map((p) => p.id))),
              hostId: isOldHost ? user.uid : prev.hostId,
              hostName: isOldHost ? newProfile.name : prev.hostName,
              hostAvatar: isOldHost ? newProfile.avatarUrl : prev.hostAvatar,
            };
          });
        } catch (roomMigrateErr) {
          // eslint-disable-next-line no-console
          console.warn('[rakcha] Room identity migration notice during login:', roomMigrateErr);
        }
      }

      const type = await verifyAdminTypeAuthorization(user, userDoc);
      setAdminType(type);
      if (type === 'action_verite') {
        setIsAdminLoggedIn(true);
        setActiveView('admin_action_verite');
      } else if (type === 'intrus') {
        setIsAdminLoggedIn(true);
        setActiveView('admin_intrus');
      } else {
        setIsAdminLoggedIn(false);
        setActiveView('main');
      }
      return { success: true };
    } catch (err: any) {
      const errorCode = err?.code || 'auth/unknown-error';
      const errorMessage = err?.message || 'Login failed';
      const isExpectedAuthError =
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/invalid-email' ||
        errorCode === 'auth/user-disabled' ||
        errorCode === 'auth/network-request-failed' ||
        errorMessage.includes('invalid-credential') ||
        errorMessage.includes('network-request-failed');

      if (isExpectedAuthError) {
        // eslint-disable-next-line no-console
        console.warn('[rakcha] Firebase Auth expected validation failure during login:', errorCode, errorMessage);
      } else {
        // eslint-disable-next-line no-console
        console.error('[rakcha] Firebase Auth Error during login:', errorCode, errorMessage, err);
      }
      return { success: false, errorCode, error: errorMessage };
    }
  };

  const registerUser = async (data: { username: string; email: string; password: string; avatarUrl?: string }): Promise<boolean> => {
    const oldUid = userProfile?.id || auth.currentUser?.uid || '';
    try {
      const { user } = await fbSignUpWithEmail(data.email, data.password, data.username, data.avatarUrl);
      setAuthStatus('authenticated');
      setIsGuestSession(false);
      setGuestTrialUsed(false);
      setGuestGamePlayed(false);
      localStorage.removeItem('af_is_guest');
      localStorage.removeItem('af_guest_trial_used');
      localStorage.removeItem('af_guest_game_played');
      localStorage.setItem('af_auth_status', 'authenticated');
      setHasOpened(true);
      setIsProfileLoaded(true);
      const newProfile: UserProfile = {
        id: user.uid,
        name: data.username.toUpperCase(),
        username: data.username.startsWith('@') ? data.username : `@${data.username}`,
        avatarUrl: data.avatarUrl && data.avatarUrl.trim() !== '' ? data.avatarUrl : DEFAULT_AVATAR,
        gamesPlayed: (data as any).gamesPlayed ?? 0,
        winRate: (data as any).winRate ?? 0,
        currentStreak: (data as any).currentStreak ?? 0,
        level: (data as any).level ?? 1,
        coins: (data as any).coins ?? 300,
        wins: (data as any).wins ?? 0,
        unlockedEmojis: (data as any).unlockedEmojis || [],
        unlockedFrames: (data as any).unlockedFrames || ['default'],
        equippedFrame: (data as any).equippedFrame || 'default',
        joinedDate: 'Just now',
        isGuest: false,
        isOnline: true,
      };
      setUserProfile(newProfile);

      // Migrate room and active game state if transitioning from guest account while in a room
      if (joinedRoom && joinedRoom.code && oldUid && oldUid !== user.uid) {
        try {
          await updatePlayerIdentityInRoomAndMatch(joinedRoom.code, oldUid, {
            id: user.uid,
            name: newProfile.name,
            username: newProfile.username,
            avatarUrl: newProfile.avatarUrl,
            wins: newProfile.wins,
          });
          setJoinedRoomState((prev) => {
            if (!prev) return null;
            const updatedPlayers = (prev.players || []).map((p) =>
              p.id === oldUid
                ? {
                    ...p,
                    id: user.uid,
                    name: newProfile.name,
                    username: newProfile.username,
                    avatarUrl: newProfile.avatarUrl || p.avatarUrl,
                    wins: newProfile.wins ?? p.wins ?? 0,
                  }
                : p
            );
            const isOldHost = prev.hostId === oldUid;
            return {
              ...prev,
              players: updatedPlayers,
              playerIds: Array.from(new Set(updatedPlayers.map((p) => p.id))),
              hostId: isOldHost ? user.uid : prev.hostId,
              hostName: isOldHost ? newProfile.name : prev.hostName,
              hostAvatar: isOldHost ? newProfile.avatarUrl : prev.hostAvatar,
            };
          });
        } catch (roomMigrateErr) {
          // eslint-disable-next-line no-console
          console.warn('[rakcha] Room identity migration notice during registration:', roomMigrateErr);
        }
      }

      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[rakcha] Registration failed:', err);
      return false;
    }
  };

  const logoutUser = async () => {
    if (joinedRoom && joinedRoom.code) {
      try {
        await leaveRoom();
      } catch (e) {
        console.error('Failed to leave room during logout', e);
      }
    }

    const isCurrentGuest = isGuestSession || auth.currentUser?.isAnonymous;

    if (isCurrentGuest) {
      // Permanently clean up temporary guest account from Firebase and Firestore
      try {
        await fbCleanupGuestAccount();
      } catch (err) {
        console.warn('[rakcha] Guest cleanup failed during logout:', err);
      }
      setGuestTrialUsed(true);
      localStorage.setItem('af_guest_trial_used', 'true');
    } else {
      // Regular registered user logout
      try {
        await fbLogout();
      } catch (err) {
        console.warn('[rakcha] Logout failed:', err);
      }
    }

    localStorage.removeItem('af_is_guest');
    localStorage.removeItem('af_joined_room_code');
    localStorage.removeItem('af_user_profile');

    setAuthStatus('unauthenticated');
    setIsGuestSession(false);
    setIsAdminLoggedIn(false);
    setAdminType(null);
    setUserProfile(GUEST_PROFILE);
    setHasOpened(false);
    setAuthScreenState('access_menu');
  };

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    setActiveView('main');
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...data };
      if (data.avatarUrl === '') {
        updated.avatarUrl = DEFAULT_AVATAR;
      }
      const myUid = auth.currentUser?.uid;
      if (myUid) {
        const updateObj: Record<string, any> = {};
        if (data.name !== undefined) updateObj.name = data.name;
        if (data.username !== undefined) updateObj.username = data.username;
        if (data.avatarUrl !== undefined) updateObj.avatarUrl = data.avatarUrl;
        if (data.bio !== undefined) updateObj.bio = data.bio;
        if (data.instagramUrl !== undefined) updateObj.instagramUrl = data.instagramUrl;
        if (Object.keys(updateObj).length > 0) {
          setDoc(doc(db, 'users', myUid), updateObj, { merge: true }).catch((err) =>
            console.warn('[rakcha] updateProfile firestore sync failed:', err)
          );
        }
      }
      return updated;
    });
  };

  // --- Room + Chat listener plumbing -------------------------------------
  // Every client attaches exactly one `onSnapshot` listener per room/chat
  // at a time. attach*() always tears down any previous listener first, and
  // detach*() is called from leaveRoom() and on unmount, so we never leak
  // listeners or end up with duplicate players/messages from a stale
  // subscription still running in the background.
  const attachRoomListener = (code: string) => {
    if (roomListenerRef.current) {
      // eslint-disable-next-line no-console
      console.log('[ROOM_LISTENER]', { action: 'DETACH_BEFORE_ATTACH', roomCode: code, authUid: auth.currentUser?.uid || userProfile?.id });
      roomListenerRef.current();
    }
    // Remember the room across reloads so refreshing doesn't silently drop
    // you out of a room you are still a member of in Firestore.
    localStorage.setItem('af_joined_room_code', code);
    // eslint-disable-next-line no-console
    console.log('[ROOM_LISTENER]', { action: 'ATTACH', roomCode: code, authUid: auth.currentUser?.uid || userProfile?.id, isAttached: true });

    let hasReceivedValidSnapshotForThisListener = false;

    roomListenerRef.current = listenToRoom(
      code,
      (room) => {
        if (!auth.currentUser) return;
        // eslint-disable-next-line no-console
        console.log('[ROOM_STATE]', {
          roomCode: room?.code,
          authUid: auth.currentUser?.uid || userProfile?.id,
          hostId: room?.hostId,
          playerIds: room?.playerIds,
          status: room?.status,
          playersCount: room?.players?.length,
          receivedNull: room === null,
          hasReceivedValidSnapshot: hasReceivedValidSnapshotForThisListener,
        });

        if (room) {
          hasReceivedValidSnapshotForThisListener = true;
          const currentFirebaseUid = auth.currentUser?.uid;
          const profileId = userProfile?.id;
          const profileName = userProfile?.name;
          const profileUsername = userProfile?.username;

          // Robust check: match by active auth UID, user profile id, name, or username.
          const isMember = Boolean(
            (currentFirebaseUid && room.playerIds?.includes(currentFirebaseUid)) ||
            (profileId && room.playerIds?.includes(profileId)) ||
            room.players?.some((p) => {
              return (
                (currentFirebaseUid && p.id === currentFirebaseUid) ||
                (profileId && p.id === profileId) ||
                (profileName && p.name === profileName) ||
                (profileUsername && p.username === profileUsername)
              );
            })
          );
          
          if (isMember) {
            setJoinedRoomState(room);
          } else {
            // Guard against local cache race conditions when first subscribing:
            // if we just joined (less than 5 seconds ago), do not detach/clear yet.
            const justJoined = Date.now() - joinTimeRef.current < 5000;
            if (justJoined) {
              // eslint-disable-next-line no-console
              console.log('[ROOM_LISTENER] Non-member snapshot ignored because of recent join time (avoiding cache race).');
            } else {
              // User was kicked or room is invalid for them
              localStorage.removeItem('af_joined_room_code');
              detachRoomListener();
              detachChatListener();
              setJoinedRoomState(null);
            }
          }
        } else {
          // If we receive null on a newly attached listener within the first 5s of creation/join,
          // do NOT prematurely clear the valid locally-established room.
          const justJoined = Date.now() - joinTimeRef.current < 5000;
          if (!hasReceivedValidSnapshotForThisListener && justJoined) {
            // eslint-disable-next-line no-console
            console.log('[ROOM_LISTENER] Initial null snapshot ignored to preserve freshly created/joined room state.');
            return;
          }

          // Room was genuinely deleted or completed
          localStorage.removeItem('af_joined_room_code');
          detachRoomListener();
          detachChatListener();
          setJoinedRoomState(null);
        }
      },
      (err) => {
        if (!auth.currentUser || err.code === 'PERMISSION_DENIED') return;
        reportError(err);
      }
    );
  };

  const detachRoomListener = () => {
    localStorage.removeItem('af_joined_room_code');
    if (roomListenerRef.current) {
      // eslint-disable-next-line no-console
      console.log('[ROOM_LISTENER]', { action: 'DETACH', authUid: auth.currentUser?.uid || userProfile?.id, isUnsubscribed: true });
      roomListenerRef.current();
      roomListenerRef.current = null;
    }
  };

  const attachChatListener = (code: string) => {
    if (chatListenerRef.current) chatListenerRef.current();
    if (currentUid && !joinedRoom?.playerIds) {
      void ensureRoomPlayerIds(code, currentUid);
    }
    chatListenerRef.current = listenToMessages(
      code,
      // Filter out messages from anyone the current user has blocked —
      // this is what actually enforces the block (see moderationService.ts).
      (msgs) => setChatMessages(msgs.filter((m) => !blockedUidsRef.current.has(m.senderId))),
      (code2, message) =>
        setMultiplayerError({ code: code2 === 'PERMISSION_DENIED' ? 'CHAT_PERMISSION_DENIED' : code2, message })
    );
  };

  const detachChatListener = () => {
    if (chatListenerRef.current) {
      chatListenerRef.current();
      chatListenerRef.current = null;
    }
    setChatMessages([]);
  };

  // Ensure chat listener is always attached for the current joined room and cleaned up on change/leave
  useEffect(() => {
    // Only attach if both the room code exists AND Firebase Auth is ready/resolved.
    // This prevents PERMISSION_DENIED on hard-reloads where the room code is
    // restored from localStorage milliseconds before Auth has fetched the token.
    if (joinedRoom?.code && currentUid) {
      attachChatListener(joinedRoom.code);
    } else {
      detachChatListener();
    }
    return () => {
      detachChatListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedRoom?.code, currentUid]);

  // Live "Open Rooms" list — real-time across every connected client.
  useEffect(() => {
    if (!currentUid) return;
    const unsubscribe = listenToOpenRooms((openRooms) => setRooms(openRooms), 30, (err) => {
      if (!auth.currentUser || err.code === 'PERMISSION_DENIED') return;
      reportError(err);
    });
    return unsubscribe;
  }, [currentUid]);

  // Reload recovery: Firestore still lists you in the room after a refresh,
  // but React state is gone. Once Firebase Auth has resolved, re-attach the
  // listeners for the room code we stored on join/create — and drop it if
  // that room is finished or we are no longer a member.
  useEffect(() => {
    if (!firebaseUser || !auth.currentUser) return;
    if (joinedRoom) return;
    const savedCode = localStorage.getItem('af_joined_room_code');
    if (!savedCode) return;
    let cancelled = false;
    let probeUnsub: (() => void) | null = null;
    try {
      probeUnsub = listenToRoom(
        savedCode,
        (room) => {
          if (cancelled || !auth.currentUser) return;
          const stillIn = room && room.players?.some((p) => p.id === firebaseUser.uid) && room.status !== 'completed';
          probeUnsub?.();
          probeUnsub = null;
          if (!stillIn) {
            localStorage.removeItem('af_joined_room_code');
            return;
          }
          if (!room.playerIds) {
            void ensureRoomPlayerIds(savedCode, firebaseUser.uid);
          }
          attachRoomListener(savedCode);
          setJoinedRoomState(room);
          // Reload recovery has to respect the game that is already running:
          // 'waiting' -> lobby, 'in_progress' -> straight back into the game.
          setActiveView(room.status === 'in_progress' ? 'game' : 'waiting_room');
        },
        () => {
          // If room doesn't exist, has ended or permissions fail on probe, silently clear localStorage
          localStorage.removeItem('af_joined_room_code');
        }
      );
    } catch {
      localStorage.removeItem('af_joined_room_code');
    }
    return () => {
      cancelled = true;
      probeUnsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  // Heartbeat Effect (Sends active timestamp every 15s)
  useEffect(() => {
    if (!auth.currentUser || !joinedRoom || !userProfile || !userProfile.id) return;
    const interval = setInterval(() => {
      if (!auth.currentUser) return;
      void sendHeartbeat(joinedRoom.code, userProfile.id);
    }, 15000);
    if (auth.currentUser) {
      void sendHeartbeat(joinedRoom.code, userProfile.id);
    }
    return () => clearInterval(interval);
  }, [joinedRoom?.code, userProfile?.id, firebaseUser?.uid]);

  // Ghost Eviction & Atomic Host Handoff Effect
  useEffect(() => {
    if (!auth.currentUser || !joinedRoom || !userProfile) return;

    // Only allow the current host to run the eviction.
    // However, if the host is dead (inactive > 45s), allow the NEXT active player to run the eviction
    // to prevent the room from locking up.
    const interval = setInterval(() => {
      if (!auth.currentUser) return;
      const now = Date.now();
      const hostPlayer = joinedRoom.players?.find(p => p.id === joinedRoom.hostId);
      const hostIsDead = hostPlayer?.lastActive && (now - hostPlayer.lastActive > 45000);
      
      let eligibleCleanerId = joinedRoom.hostId;
      if (hostIsDead) {
         const activePlayers = joinedRoom.players?.filter(p => !p.lastActive || (now - p.lastActive <= 45000));
         eligibleCleanerId = activePlayers?.[0]?.id || joinedRoom.hostId;
      }

      if (userProfile.id === eligibleCleanerId) {
        void evictInactivePlayersAndReassignHost(joinedRoom.code, 45000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [joinedRoom, userProfile?.id, firebaseUser?.uid]);



  // Clean up any live listeners if the app itself unmounts.
  useEffect(() => {
    return () => {
      detachRoomListener();
      detachChatListener();
    };
  }, []);

  // When the room's status flips to 'in_progress' (set by the host via
  // startGame(), synced through Firestore), every connected client —
  // host included — reacts here. If a player leaves causing remaining players < 2,
  // revert automatically back to 'waiting_room' lobby.
  useEffect(() => {
    if (joinedRoom) {
      if (joinedRoom.status === 'in_progress') {
        if (joinedRoom.players.length < 2) {
          setActiveView('waiting_room');
          const isHost = joinedRoom.hostId === (currentUid || userProfile?.id);
          if (isHost) {
            void fbUpdateRoomSettings({ roomCode: joinedRoom.code, hostUid: joinedRoom.hostId, status: 'waiting' as any }).catch(() => {});
          }
        } else {
          setActiveView((prev) => (prev === 'game' ? prev : 'game'));
        }
      } else if (joinedRoom.status === 'waiting') {
        setActiveView((prev) => (prev === 'game' ? 'waiting_room' : prev));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedRoom?.status, joinedRoom?.players?.length, joinedRoom?.id]);

  // Auto-Reconnect on network connection restoration or app focus / visibility change
  useEffect(() => {
    const handleReconnect = () => {
      const savedCode = localStorage.getItem('af_joined_room_code');
      if (!savedCode || !auth.currentUser) return;

      if (!roomListenerRef.current || !joinedRoom) {
        // eslint-disable-next-line no-console
        console.log('[RECONNECT] Connection restored or window focused, re-attaching room listener for:', savedCode);
        attachRoomListener(savedCode);
      }
    };

    window.addEventListener('online', handleReconnect);
    const onVisChange = () => {
      if (document.visibilityState === 'visible') {
        handleReconnect();
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      window.removeEventListener('online', handleReconnect);
      document.removeEventListener('visibilitychange', onVisChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinedRoom?.code]);

  const createRoom = async (
    gameId: string,
    playerLimit: number,
    isPrivate: boolean,
    mode: GameMode = 'friends',
    playType: PlayType = 'virtual',
    customMecanqueSettings?: MecanqueSettings,
    entryCost: number = 30,
    autoStart: boolean = false,
    customChessSettings?: ChessSettings
  ): Promise<Room> => {
    if (!checkAndConsumeGuestTrial()) {
      throw new Error('Guest trial completed. Please create an account to continue.');
    }
    const isActionVerite = gameId === 'mind-rally' || gameId === 'action-verite';
    const effectiveEntryCost = isActionVerite ? 0 : entryCost;
    const currentCoins = userProfile.coins ?? 300;
    if (effectiveEntryCost > 0 && currentCoins < effectiveEntryCost) {
      setIsCoinsModalOpen(true);
      throw new Error(`Insufficient coins balance. You need at least ${effectiveEntryCost} coins to create this room.`);
    }

    const selectedGame = INITIAL_GAMES.find((g) => g.id === gameId) || INITIAL_GAMES[0];

    const modeLabel = mode === '18+' ? '18+' : mode.toUpperCase();
    const typeLabel = playType === 'nearby' ? 'NEARBY' : 'VIRTUAL';
    const finalMaxPlayers = gameId === 'chess'
      ? 2
      : gameId === 'uno-game'
      ? Math.min(20, Math.max(2, playerLimit))
      : gameId === 'intrus'
      ? Math.min(30, Math.max(3, playerLimit))
      : gameId === 'mecanque'
      ? Math.min(20, Math.max(2, playerLimit))
      : playerLimit;
    const effectiveMecanqueSettings = customMecanqueSettings || mecanqueSettings;
    const effectiveChessSettings = customChessSettings || chessSettings;
    const title = gameId === 'uno-game'
      ? `${selectedGame.title} • [${typeLabel}]`
      : `${selectedGame.title} • [${modeLabel} / ${typeLabel}]`;

    const authUser = await ensureAuthUser(userProfile.name);
    const hostUid = authUser.uid;

    const newRoom = await fbCreateRoom({
      hostUid,
      hostName: userProfile.name,
      hostAvatar: userProfile.avatarUrl,
      hostUsername: userProfile.username,
      gameId: selectedGame.id,
      gameTitle: selectedGame.title,
      title,
      maxPlayers: finalMaxPlayers,
      isPrivate,
      mode,
      playType,
      entryCost: effectiveEntryCost,
      mecanqueSettings: selectedGame.id === 'mecanque' ? effectiveMecanqueSettings : undefined,
      chessSettings: selectedGame.id === 'chess' ? effectiveChessSettings : undefined,
    });

    setUserProfile((prev) => (prev.id === newRoom.hostId ? prev : { ...prev, id: newRoom.hostId }));
    joinTimeRef.current = Date.now();
    attachRoomListener(newRoom.code);
    setInvitedFriends([]);
    try {
      await showInterstitialIfReady();
    } catch {
      // Never block room entry if ad fails or is unavailable
    }

    const shouldAutoStart = autoStart;

    if (shouldAutoStart) {
      try {
        await fbStartGame(newRoom.code, newRoom.hostId);
      } catch (e) {
        console.warn('Auto start game failed:', e);
      }
      const startedRoom = { ...newRoom, status: 'in_progress' as const };
      setJoinedRoomState(startedRoom);
      setActiveView('game');
      return startedRoom;
    } else {
      setJoinedRoomState(newRoom);
      setActiveView('waiting_room');
      return newRoom;
    }
  };

  const updateRoomParameters = async (updates: Partial<Room>) => {
    if (!joinedRoom) return;
    const roomCode = joinedRoom.code || joinedRoom.id;
    if (!roomCode) return;

    const authUser = await ensureAuthUser(userProfile.name);
    const hostUid = authUser.uid;

    try {
      await fbUpdateRoomSettings({
        roomCode,
        hostUid,
        mode: updates.mode,
        isPrivate: updates.isPrivate,
        maxPlayers: updates.maxPlayers,
        mecanqueSettings: updates.mecanqueSettings,
        chessSettings: updates.chessSettings,
      });
      setJoinedRoomState((prev) => (prev ? ({ ...prev, ...updates } as Room) : null));
    } catch (err) {
      console.warn('[rakcha] fbUpdateRoomSettings failed, trying direct updateDoc:', err);
      const roomRef = doc(db, 'antifada_rooms', roomCode);
      const cleanUpdates: Record<string, any> = { updatedAt: serverTimestamp() };
      if (updates.isPrivate !== undefined) cleanUpdates.isPrivate = updates.isPrivate;
      if (updates.mecanqueSettings !== undefined) cleanUpdates.mecanqueSettings = updates.mecanqueSettings;
      if (updates.chessSettings !== undefined) cleanUpdates.chessSettings = updates.chessSettings;
      if (updates.mode !== undefined) cleanUpdates.mode = updates.mode;
      if (updates.maxPlayers !== undefined) cleanUpdates.maxPlayers = updates.maxPlayers;
      await updateDoc(roomRef, cleanUpdates);
      setJoinedRoomState((prev) => (prev ? ({ ...prev, ...updates } as Room) : null));
    }
  };

  const joinRoom = async (codeOrId: string): Promise<{ success: boolean; message?: string }> => {
    if (!checkAndConsumeGuestTrial()) {
      return { success: false, message: 'Guest trial completed. Please create an account to continue.' };
    }
    try {
      const room = await fbJoinRoomByCode(codeOrId, {
        uid: userProfile.id,
        name: userProfile.name,
        username: userProfile.username,
        avatarUrl: userProfile.avatarUrl,
      }, userProfile.coins ?? 300);
      const myPlayer = room.players.find((p) => p.username === userProfile.username || p.name === userProfile.name);
      if (myPlayer) {
        setUserProfile((prev) => (prev.id === myPlayer.id ? prev : { ...prev, id: myPlayer.id }));
      }
      joinTimeRef.current = Date.now();
      attachRoomListener(room.code);
      setJoinedRoomState(room);
      const targetView = room.status === 'waiting' ? 'waiting_room' : 'game';
      // eslint-disable-next-line no-console
      console.log('[ROOM_JOIN]', {
        roomCode: room.code,
        authUid: auth.currentUser?.uid || userProfile?.id,
        joinedRoomCode: room.code,
        hostId: room.hostId,
        playerIds: room.playerIds,
        activeView: targetView,
        listenerAttached: true,
      });
      try {
        await showInterstitialIfReady();
      } catch {
        // Never block room entry if ad fails or is unavailable
      }
      setActiveView(targetView);
      return { success: true };
    } catch (err: any) {
      const e = err instanceof RoomError ? err : toRoomError(err);
      if (e.code === 'INSUFFICIENT_COINS') {
        setIsCoinsModalOpen(true);
        return { success: false, message: e.message || (language === 'ar' ? 'رصيدك غير كافٍ للدخول' : 'Insufficient Coins to join room') };
      }
      if (e.code === 'ROOM_FULL') return { success: false, message: t('roomFull') };
      if (e.code === 'ROOM_ALREADY_STARTED') return { success: false, message: t('gameAlreadyStarted') };
      if (e.code === 'ROOM_NOT_FOUND') return { success: false, message: t('invalidCode') };
      
      // Unexpected or permission error
      reportError(err);
      if (e.code === 'PERMISSION_DENIED') return { success: false, message: `PERMISSION_DENIED: ${e.message}` };
      if (e.code === 'NOT_AUTHENTICATED' || e.code === 'UID_MISMATCH') {
        return { success: false, message: `${e.code}: ${e.message}` };
      }
      return { success: false, message: `${e.code}: ${e.message}` };
    }
  };

  const cancelLeaveRoom = () => {
    if (isLeavingRoom) return;
    setIsLeaveRoomConfirmOpen(false);
  };

  const leaveRoom = async () => {
    if (isLeavingRoom) return;
    setIsLeavingRoom(true);
    setIsLeaveRoomConfirmOpen(false);

    if (unoAiConfig.isAiMode) {
      setUnoAiConfig({ isAiMode: false, difficulty: 'medium' });
      setActiveTab('rooms');
      setActiveView('home');
      setIsLeavingRoom(false);
      return;
    }
    if (chessAiConfig.isAiMode) {
      setChessAiConfig({ isAiMode: false, difficulty: 'medium' });
      setActiveTab('rooms');
      setActiveView('home');
      setIsLeavingRoom(false);
      return;
    }

    const roomToLeave = joinedRoom;
    const code = roomToLeave?.code;
    const uid = currentUid || auth.currentUser?.uid || userProfile?.id;

    // Immediately detach listeners and clear local room state so the user is never stuck
    localStorage.removeItem('af_joined_room_code');
    detachRoomListener();
    detachChatListener();
    setJoinedRoomState(null);
    setActiveTab('rooms');
    setActiveView('main');

    if (code && uid) {
      try {
        await fbLeaveRoom(code, uid);
      } catch (err) {
        reportError(err);
      }
    }

    setIsLeavingRoom(false);
  };

  const requestLeaveRoom = () => {
    if (!joinedRoom && !unoAiConfig.isAiMode && !chessAiConfig.isAiMode) return;
    // For solo AI games (UNO / Chess) and multiplayer rooms alike, always
    // ask for confirmation first — the Android hardware back button routes
    // here too, and instantly quitting the match on a single back-press
    // was jarring (felt like getting kicked out with no warning).
    setIsLeaveRoomConfirmOpen(true);
  };

  const toggleReady = async () => {
    if (!joinedRoom) return;
    const uid = auth.currentUser?.uid || currentUid;
    if (!uid) {
      reportError(new RoomError('NOT_AUTHENTICATED', 'Sign in again before changing your ready state.'));
      return;
    }

    // Optimistic update — keyed on the Firebase uid (the same id stored in
    // players[].id), so the button flips instantly for guests too. The room
    // listener reconciles with Firestore's authoritative copy right after.
    setJoinedRoomState((prev) =>
      prev
        ? { ...prev, players: prev.players.map((p) => (p.id === uid ? { ...p, isReady: !p.isReady } : p)) }
        : prev
    );

    try {
      clearMultiplayerError();
      await fbToggleReady(joinedRoom.code, uid);
    } catch (err) {
      // Roll the optimistic flip back so the UI never lies about ready state.
      setJoinedRoomState((prev) =>
        prev
          ? { ...prev, players: prev.players.map((p) => (p.id === uid ? { ...p, isReady: !p.isReady } : p)) }
          : prev
      );
      reportError(err);
    }
  };

  const startGame = async () => {
    if (!joinedRoom) return;
    const selectedGame = INITIAL_GAMES.find((g) => g.id === joinedRoom.gameId);
    const isAiMode = joinedRoom.mode === 'family';
    const minPlayersRequired = isAiMode ? 1 : (selectedGame?.minPlayers ?? 2);

    // Already started (e.g. double click / late listener): just make sure this
    // client is on the game screen instead of dying silently in the lobby.
    if (joinedRoom.status === 'in_progress') {
      setActiveView('game');
      return;
    }
    if (joinedRoom.status !== 'waiting') {
      reportError(new RoomError('ROOM_ALREADY_STARTED', 'This room is no longer accepting a game start.'));
      return;
    }
    if (joinedRoom.players.length < minPlayersRequired) {
      reportError(
        new RoomError('START_GAME_FAILED', `At least ${minPlayersRequired} player${minPlayersRequired > 1 ? 's are' : ' is'} required to start.`)
      );
      return;
    }

    // Flips `status` on the room doc; the useEffect reacts to that
    // for every connected client (host included), so all players enter at once.
    const authUid = auth.currentUser?.uid || currentUid;
    const effectiveUid = authUid || userProfile.id;
    if (!effectiveUid) {
      reportError(new RoomError('NOT_AUTHENTICATED', 'Sign in again before starting the game.'));
      return;
    }

    const myPlayer = joinedRoom.players.find(
      (p) =>
        (effectiveUid && p.id === effectiveUid) ||
        (currentUid && p.id === currentUid) ||
        (userProfile.id && p.id === userProfile.id) ||
        (userProfile.username && p.username === userProfile.username) ||
        (userProfile.name && p.name.trim().toLowerCase() === userProfile.name.trim().toLowerCase())
    );

    const isUserHost =
      joinedRoom.players.length === 1 ||
      Boolean(myPlayer?.isHost) ||
      (Boolean(effectiveUid) && joinedRoom.hostId === effectiveUid) ||
      (Boolean(currentUid) && joinedRoom.hostId === currentUid) ||
      (Boolean(userProfile.id) && joinedRoom.hostId === userProfile.id) ||
      (Boolean(userProfile.name) && joinedRoom.hostName?.trim().toLowerCase() === userProfile.name.trim().toLowerCase()) ||
      (joinedRoom.players.length > 0 && (joinedRoom.players[0].id === effectiveUid || joinedRoom.players[0].id === userProfile.id));

    if (!isUserHost) {
      reportError(new RoomError('NOT_HOST', 'Only the room host can start the game.'));
      return;
    }

    try {
      clearMultiplayerError();
      const callUid = auth.currentUser?.uid || joinedRoom.hostId;
      await fbStartGame(joinedRoom.code, callUid);
      // The Firestore listener normally drives navigation for every client
      // (host included). Mirror the status locally as well so the host is
      // never stuck in the lobby if the snapshot round-trip is slow or the
      // write was already applied by a previous click.
      setJoinedRoomState((prev) => (prev && prev.status === 'waiting' ? { ...prev, status: 'in_progress' } : prev));
    } catch (err) {
      reportError(err, 'START_GAME_FAILED');
    }
  };

  // NOTE: There is no real Friends/Invitations backend in the Firebase
  // files this was integrated from — only Rooms, Chat, and Auth are real.
  // This intentionally no longer fabricates the friend "accepting" and
  // auto-joining (that was exactly the fake-multiplayer behavior this
  // integration was asked to remove). It records that an invite was sent;
  // the friend still has to actually enter the room code to join for real.
  const inviteFriendToRoom = async (friendId: string) => {
    const isFriend = friends.some((f) => f.id === friendId);
    if (!isFriend) {
      console.warn('[rakcha] Only existing friends can be invited to a room');
      return;
    }
    const now = Date.now();
    setLastInviteTimestamps((prev) => {
      const next = { ...prev, [friendId]: now };
      localStorage.setItem('af_last_invite_timestamps', JSON.stringify(next));
      return next;
    });
    if (!invitedFriends.includes(friendId)) {
      setInvitedFriends((prev) => [...prev, friendId]);
    }
    if (joinedRoom) {
      const myId = firebaseUser?.uid || auth.currentUser?.uid || userProfile.id;
      if (!myId) return;
      try {
        await addDoc(collection(db, 'roomInvitations'), {
          roomId: joinedRoom.id || 'room-1',
          roomCode: joinedRoom.code,
          gameId: joinedRoom.gameId,
          gameTitle: joinedRoom.gameTitle || 'Rakcha Game',
          inviterId: myId,
          inviterName: userProfile.name,
          inviterAvatar: userProfile.avatarUrl || '',
          recipientId: friendId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdAtMs: now,
          receivedAt: 'Just now',
        });
      } catch (err) {
        console.warn('[rakcha] Failed to invite friend to room:', err);
      }
    }
  };

  const sendChatMessage = async (text: string) => {
    if (!joinedRoom) return;
    try {
      const authUser = await ensureAuthUser(userProfile.name);
      const uid = authUser.uid;
      clearMultiplayerError();
      await fbSendMessage(joinedRoom.code, { uid, name: userProfile.name, avatarUrl: userProfile.avatarUrl }, text);
    } catch (err) {
      const e = reportError(err);
      if (e.code === 'PERMISSION_DENIED') {
        setMultiplayerError({ code: 'CHAT_PERMISSION_DENIED', message: e.message });
      }
    }
  };

  // Looks up a real user document by username and sends a real friend
  // request via Firestore (see sendFriendRequest below). Replaces the
  // previous behavior, which fabricated a local-only fake friend with
  // random stats and never touched Firestore at all.
  const addFriendByUsername = async (username: string): Promise<boolean> => {
    const cleanUser = username.trim().replace(/^@/, '');
    if (!cleanUser) return false;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Please wait for your account to finish loading and try again.');
      return false;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanUser));
      const snap = await getDocs(q);

      const targetDoc = snap.docs.find((d) => d.id !== currentUser.uid);
      if (!targetDoc) {
        alert('No player found with that username.');
        return false;
      }

      if (friends.some((f) => f.id === targetDoc.id)) {
        alert('This player is already your friend.');
        return false;
      }

      const targetData = targetDoc.data();
      await sendFriendRequest({
        id: targetDoc.id,
        name: targetData.name || targetData.username || 'Player',
        username: targetData.username || cleanUser,
        avatarUrl: targetData.avatarUrl || '',
      });
      return true;
    } catch (err) {
      console.warn('[rakcha] Failed to add friend by username:', err);
      alert('Failed to send friend request. Please check your connection or try again.');
      return false;
    }
  };

  // Removes a friend for both users by deleting both sides of the
  // symmetric users/{uid}/friends/{friendUid} relationship written by
  // acceptFriendRequest.
  const removeFriend = async (friendId: string) => {
    const myId = auth.currentUser?.uid;
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    if (!myId) return;
    try {
      await deleteDoc(doc(db, 'users', myId, 'friends', friendId));
      await deleteDoc(doc(db, 'users', friendId, 'friends', myId));
    } catch (err) {
      console.warn('[rakcha] Failed to remove friend:', err);
    }
  };

  const sendFriendRequest = async (target: { id: string; name: string; username: string; avatarUrl?: string }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Please wait for your account to finish loading and try again.');
      return;
    }
    const myId = currentUser.uid;
    if (!myId || target.id === myId) return;

    try {
      await addDoc(collection(db, 'friendRequests'), {
        senderId: myId,
        senderName: userProfile.name,
        senderUsername: userProfile.username || '',
        senderAvatarUrl: userProfile.avatarUrl || '',
        recipientId: target.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[rakcha] Failed to send friend request:', err?.code, err?.message, err);
      alert('Failed to send friend request. Please check your connection or try again.');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const reqRef = doc(db, 'friendRequests', requestId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) return;
      const data = reqSnap.data();

      await updateDoc(reqRef, { status: 'accepted' });

      const myId = auth.currentUser?.uid;
      if (!myId) return;

      const newFriendForMe: Friend = {
        id: data.senderId,
        name: data.senderName,
        username: data.senderUsername || '@' + data.senderName.toLowerCase().replace(/\s+/g, '_'),
        avatarUrl: data.senderAvatarUrl || DEFAULT_AVATAR,
        isOnline: true,
        gamesPlayed: 0,
        winRate: 0,
        currentStreak: 0,
        level: 1,
        joinedDate: 'Recently',
        statusText: 'New friend',
      };

      await setDoc(doc(db, 'users', myId, 'friends', data.senderId), newFriendForMe);

      const newFriendForSender: Friend = {
        id: myId,
        name: userProfile.name,
        username: userProfile.username || '@' + userProfile.name.toLowerCase().replace(/\s+/g, '_'),
        avatarUrl: userProfile.avatarUrl || DEFAULT_AVATAR,
        isOnline: true,
        gamesPlayed: userProfile.gamesPlayed || 1,
        winRate: userProfile.winRate || 50,
        currentStreak: userProfile.currentStreak || 1,
        level: userProfile.level || 1,
        joinedDate: 'Recently',
        statusText: 'New friend',
      };

      await setDoc(doc(db, 'users', data.senderId, 'friends', myId), newFriendForSender);
    } catch (err) {
      console.warn('[rakcha] Failed to accept friend request:', err);
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
    } catch (err) {
      console.warn('[rakcha] Failed to decline friend request:', err);
    }
  };

  // Buy emoji action (deducts coins, updates Firestore and local state permanently)
  const buyEmoji = useCallback(
    async (emojiId: string): Promise<{ success: boolean; error?: string }> => {
      const item = SHOP_EMOJIS.find((e) => e.id === emojiId);
      if (!item) {
        return { success: false, error: 'Invalid emoji item.' };
      }

      const currentUnlocked = userProfile.unlockedEmojis || [];
      if (currentUnlocked.includes(emojiId) || FREE_EMOJI_IDS.includes(emojiId)) {
        return { success: true };
      }

      const currentCoins = userProfile.coins ?? 300;
      if (currentCoins < item.price) {
        return { success: false, error: 'Insufficient coins balance.' };
      }

      const updatedUnlockedEmojis = Array.from(new Set([...currentUnlocked, emojiId]));

      setUserProfile((prev) => {
        const updated = {
          ...prev,
          coins: Math.max(0, (prev.coins ?? 300) - item.price),
          unlockedEmojis: updatedUnlockedEmojis,
        };
        localStorage.setItem('af_user_profile', JSON.stringify(updated));
        return updated;
      });

      const uid = auth.currentUser?.uid || userProfile.id;
      if (uid) {
        try {
          await setDoc(
            doc(db, 'users', uid),
            {
              unlockedEmojis: updatedUnlockedEmojis,
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('[rakcha] Direct Firestore update for emoji failed:', dbErr);
        }
      }

      if (uid) {
        try {
          await fetch('/api/buy-emoji', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid,
              emojiId,
              price: item.price,
            }),
          });
        } catch (err) {
          console.warn('[rakcha] Failed to sync buy-emoji with server:', err);
        }
      }

      return { success: true };
    },
    [userProfile.id, userProfile.coins, userProfile.unlockedEmojis]
  );

  // Buy avatar frame action (deducts coins, updates Firestore and equips frame)
  const buyAvatarFrame = useCallback(
    async (frameId: string): Promise<{ success: boolean; error?: string }> => {
      const frame = AVATAR_FRAMES.find((f) => f.id === frameId);
      if (!frame) {
        return { success: false, error: 'Invalid avatar frame.' };
      }

      const currentUnlocked = userProfile.unlockedFrames || ['default'];
      if (currentUnlocked.includes(frameId) || frame.isFree) {
        setUserProfile((prev) => {
          const updated = { ...prev, equippedFrame: frameId };
          localStorage.setItem('af_user_profile', JSON.stringify(updated));
          return updated;
        });
        const uid = auth.currentUser?.uid || userProfile.id;
        if (uid) {
          void setDoc(doc(db, 'users', uid), { equippedFrame: frameId }, { merge: true }).catch(() => {});
        }
        return { success: true };
      }

      const currentCoins = userProfile.coins ?? 300;
      if (currentCoins < frame.price) {
        return { success: false, error: 'Insufficient coins balance.' };
      }

      const updatedUnlocked = Array.from(new Set([...currentUnlocked, frameId]));

      setUserProfile((prev) => {
        const updated = {
          ...prev,
          coins: Math.max(0, (prev.coins ?? 300) - frame.price),
          unlockedFrames: updatedUnlocked,
          equippedFrame: frameId,
        };
        localStorage.setItem('af_user_profile', JSON.stringify(updated));
        return updated;
      });

      const uid = auth.currentUser?.uid || userProfile.id;
      if (uid) {
        try {
          await setDoc(
            doc(db, 'users', uid),
            {
              unlockedFrames: updatedUnlocked,
              equippedFrame: frameId,
            },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('[rakcha] Direct Firestore update for frame purchase failed:', dbErr);
        }
      }

      if (uid) {
        try {
          await fetch('/api/buy-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid,
              frameId,
              price: frame.price,
            }),
          });
        } catch (err) {
          console.warn('[rakcha] Failed to sync buy-frame with server:', err);
        }
      }

      return { success: true };
    },
    [userProfile.id, userProfile.coins, userProfile.unlockedFrames]
  );

  // Equip avatar frame action
  const equipAvatarFrame = useCallback(
    async (frameId: string): Promise<{ success: boolean; error?: string }> => {
      setUserProfile((prev) => {
        const updated = {
          ...prev,
          equippedFrame: frameId,
        };
        localStorage.setItem('af_user_profile', JSON.stringify(updated));
        return updated;
      });

      const uid = auth.currentUser?.uid || userProfile.id;
      if (uid && auth.currentUser) {
        try {
          await setDoc(doc(db, 'users', uid), { equippedFrame: frameId }, { merge: true });
        } catch (dbErr) {
          console.warn('[rakcha] Direct Firestore update for frame equip failed:', dbErr);
        }
      }

      if (uid) {
        try {
          await fetch('/api/equip-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid,
              frameId,
            }),
          });
        } catch (err) {
          console.warn('[rakcha] Failed to sync equip-frame with server:', err);
        }
      }

      return { success: true };
    },
    [userProfile.id]
  );

  // Send an emoji reaction into the current room (or offline AI mode)
  const sendEmojiReaction = useCallback(
    async (emojiIdOrSymbol: string) => {
      const emojiItem = getEmojiById(emojiIdOrSymbol) || getEmojiBySymbol(emojiIdOrSymbol);
      if (!emojiItem) return;

      const currentUnlocked = Array.from(
        new Set([...FREE_EMOJI_IDS, ...(userProfile.unlockedEmojis || [])])
      );
      if (!emojiItem.isFree && !currentUnlocked.includes(emojiItem.id)) {
        console.warn('[Reaction] Cannot send locked emoji:', emojiItem.id);
        return;
      }

      const myUid = auth.currentUser?.uid || userProfile.id;
      const myName = userProfile.name || 'Player';
      const myAvatar = userProfile.avatarUrl || DEFAULT_AVATAR;

      if (joinedRoom?.code && myUid) {
        try {
          await fbSendReaction(
            joinedRoom.code,
            { uid: myUid, name: myName, avatarUrl: myAvatar },
            emojiItem.emoji,
            emojiItem.soundId
          );
        } catch (err) {
          console.warn('[Reaction] Failed to broadcast reaction:', err);
        }
      } else {
        // Local fallback (AI games or waiting)
        const localReaction: EmojiReaction = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderId: myUid,
          senderName: myName,
          senderAvatar: myAvatar,
          emoji: emojiItem.emoji,
          soundId: emojiItem.soundId || null,
          createdAt: new Date().toISOString(),
          createdAtMs: Date.now(),
        };
        if (emojiItem.soundId) {
          emojiSoundService.playSound(emojiItem.soundId);
        }
        setActiveReactions((prev) => [...prev.slice(-8), localReaction]);
        setTimeout(() => {
          setActiveReactions((prev) => prev.filter((r) => r.id !== localReaction.id));
        }, 3500);
      }
    },
    [joinedRoom?.code, userProfile]
  );

  // Real-time Reaction listener for active room
  useEffect(() => {
    if (reactionListenerRef.current) {
      reactionListenerRef.current();
      reactionListenerRef.current = null;
    }
    processedReactionIdsRef.current.clear();
    setActiveReactions([]);

    if (joinedRoom?.code && currentUid) {
      // Record the exact time this player joined/started listening to the room
      const roomJoinTime = Date.now();

      reactionListenerRef.current = listenToReactions(
        joinedRoom.code,
        (reactions) => {
          const now = Date.now();
          const newOnes: EmojiReaction[] = [];

          reactions.forEach((r) => {
            if (!processedReactionIdsRef.current.has(r.id)) {
              processedReactionIdsRef.current.add(r.id);

              // Only trigger if reaction was created AFTER joining the room (with 1s leeway for clock drift)
              // This strictly prevents newly joined players from seeing or hearing old stale reactions
              const reactionTime = r.createdAtMs || now;
              const isAfterJoin = reactionTime >= roomJoinTime - 1200;
              const isRecent = now - reactionTime < 6500;

              if (isAfterJoin && isRecent) {
                newOnes.push(r);
                // Play sound for all connected players in the room if emoji has soundId
                if (r.soundId) {
                  emojiSoundService.playSound(r.soundId);
                }
              }
            }
          });

          if (newOnes.length > 0) {
            setActiveReactions((prev) => {
              // Merge newly received reactions without overwriting any active ones
              const existingIds = new Set(prev.map((item) => item.id));
              const additions = newOnes.filter((item) => !existingIds.has(item.id));
              return [...prev, ...additions].slice(-15);
            });

            // Schedule graceful dismissal for each new reaction individually
            const newIds = newOnes.map((n) => n.id);
            setTimeout(() => {
              setActiveReactions((prev) => prev.filter((item) => !newIds.includes(item.id)));
            }, 3500);
          }
        },
        (code, msg) => {
          console.warn('[rakcha] Reaction listener notice:', code, msg);
        }
      );
    }

    return () => {
      if (reactionListenerRef.current) {
        reactionListenerRef.current();
        reactionListenerRef.current = null;
      }
    };
  }, [joinedRoom?.code, currentUid]);

  // Sync sound settings to emoji sound engine
  useEffect(() => {
    emojiSoundService.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const exposedCardTurn = useMemo(() => {
    return {
      ...cardTurn,
      timerSeconds: cardTurn.isTimerRunning ? localTimerSeconds : cardTurn.timerSeconds,
    };
  }, [cardTurn, localTimerSeconds]);

  const contextValue = useMemo<AppContextType>(
    () => ({
        hasOpened,
        setHasOpened,
        openApp,
        authStatus,
        isGuestSession,
        guestTrialUsed,
        guestGamePlayed,
        isGuestTrialModalOpen,
        setIsGuestTrialModalOpen,
        guestVisitCount,
        authScreenState,
        setAuthScreenState,
        playAsGuest,
        loginUser,
        registerUser,
        logoutUser,
        language,
        setLanguage,
        isRTL,
        t,
        activeTab,
        setActiveTab,
        activeView,
        setActiveView,
        theme,
        setTheme,
        isDarkMode,
        userProfile,
        updateProfile,
        currentUid,
        isCoinsModalOpen,
        setIsCoinsModalOpen,
        matchResultNotification,
        setMatchResultNotification,
        addCoins,
        deductCoins,
        checkCoinEligibility,
        settleMatchCoins,
        rooms,
        joinedRoom,
        unoAiConfig,
        startAiUnoGame,
        exitAiUnoGame,
        chessAiConfig,
        startAiChessGame,
        exitAiChessGame,
        createRoom,
    updateRoomParameters,
        joinRoom,
        leaveRoom,
        isLeaveRoomConfirmOpen,
        setIsLeaveRoomConfirmOpen,
        requestLeaveRoom,
        cancelLeaveRoom,
        isLeavingRoom,
        toggleReady,
        startGame,
        inviteFriendToRoom,
        invitedFriends,
        lastInviteTimestamps,
        chatMessages,
        sendChatMessage,
        multiplayerError,
        clearMultiplayerError,
        blockedUsers,
        blockUserAction,
        unblockUserAction,
        reportUserAction,
        deleteAccountAction,
        friends,
        addFriendByUsername,
        removeFriend,
        friendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        selectedFriendForProfile,
        setSelectedFriendForProfile,
        gameCards,
        cardTurn: exposedCardTurn,
        getRandomCard,
        flipCard,
        useShield,
        selectSpecialChoice,
        advanceTurn,
        resetCardGame,
        removePlayerFromRoom,
        isAdminLoggedIn,
        authReady,
        adminLogin,
        adminLogout,
        createCard,
        updateCard,
        deleteCard,
        intrusTopics,
        createIntrusTopic,
        updateIntrusTopic,
        deleteIntrusTopic,
        roomsFilterGameId,
        setRoomsFilterGameId,
        mecanqueSettings,
        setMecanqueSettings,
        chessSettings,
        setChessSettings,
        soundEnabled,
        setSoundEnabled,
        voiceInteractionEnabled,
        setVoiceInteractionEnabled,
        hapticEnabled,
        setHapticEnabled,
        animationsEnabled,
        setAnimationsEnabled,
        confirmBeforeLeaving,
        setConfirmBeforeLeaving,
        reducedMotion,
        setReducedMotion,
        batterySaver,
        setBatterySaver,
        notificationSettings,
        setNotificationSettings,
        onlineStatus,
        setOnlineStatus,
        friendRequestsPermission,
        setFriendRequestsPermission,
        profileVisibility,
        setProfileVisibility,
        avatarVisibility,
        setAvatarVisibility,
        friendsListVisibility,
        setFriendsListVisibility,
        roomInvitesPermission,
        setRoomInvitesPermission,
        interactionPermission,
        setInteractionPermission,
        downloadUserData,
        connectionStatus,
        setConnectionStatus,
        connectionQuality,
        invitations,
        acceptInvitation,
        declineInvitation,
        unreadInvitationsCount,
        unreadRoomInvitationsCount,
        unreadFriendRequestsCount,
        isFriendsModalOpen,
        setIsFriendsModalOpen,
        isRoomsModalOpen,
        setIsRoomsModalOpen,
        activeNotificationModalOpen,
        setActiveNotificationModalOpen,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        activeNotificationTab,
        setActiveNotificationTab,
        openNotificationCenter,
        gameResultNotifications,
        readNotificationIds,
        unreadRoomNotificationsCount,
        unreadFriendNotificationsCount,
        unreadGameResultsCount,
        totalUnreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearGameResultNotification,
        viewedUserProfile,
        profileReturnView,
        viewUserProfile,
        closeViewedUserProfile,
        closeActiveModal,
        registerModalCloseHandler,
        rankUnlockModalData,
        setRankUnlockModalData,
        unlockedEmojis,
        buyEmoji,
        isEmojiShopOpen,
        setIsEmojiShopOpen,
        activeReactions,
        sendEmojiReaction,
        unlockedFrames,
        equippedFrame,
        isFrameShopOpen,
        setIsFrameShopOpen,
        buyAvatarFrame,
        equipAvatarFrame,
        selectedGameTheme: selectedGameThemeState,
        setSelectedGameTheme,
        isThemePickerOpen,
        setIsThemePickerOpen,
    }),
    [
      hasOpened,
      setHasOpened,
      openApp,
      authStatus,
      isGuestSession,
      guestTrialUsed,
      guestGamePlayed,
      isGuestTrialModalOpen,
      setIsGuestTrialModalOpen,
      guestVisitCount,
      authScreenState,
      setAuthScreenState,
      playAsGuest,
      loginUser,
      registerUser,
      logoutUser,
      language,
      setLanguage,
      isRTL,
      t,
      activeTab,
      setActiveTab,
      activeView,
      setActiveView,
      theme,
      setTheme,
      isDarkMode,
      userProfile,
      updateProfile,
      currentUid,
      isCoinsModalOpen,
      setIsCoinsModalOpen,
      matchResultNotification,
      setMatchResultNotification,
      addCoins,
      deductCoins,
      checkCoinEligibility,
      settleMatchCoins,
      rooms,
      joinedRoom,
      unoAiConfig,
      startAiUnoGame,
      exitAiUnoGame,
      chessAiConfig,
      startAiChessGame,
      exitAiChessGame,
      createRoom,
      updateRoomParameters,
      joinRoom,
      leaveRoom,
      isLeaveRoomConfirmOpen,
      setIsLeaveRoomConfirmOpen,
      requestLeaveRoom,
      cancelLeaveRoom,
      isLeavingRoom,
      toggleReady,
      startGame,
      inviteFriendToRoom,
      invitedFriends,
      lastInviteTimestamps,
      chatMessages,
      sendChatMessage,
      multiplayerError,
      clearMultiplayerError,
      blockedUsers,
      blockUserAction,
      unblockUserAction,
      reportUserAction,
      deleteAccountAction,
      friends,
      addFriendByUsername,
      removeFriend,
      friendRequests,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      selectedFriendForProfile,
      setSelectedFriendForProfile,
      gameCards,
      exposedCardTurn,
      getRandomCard,
      flipCard,
      useShield,
      selectSpecialChoice,
      advanceTurn,
      resetCardGame,
      removePlayerFromRoom,
      isAdminLoggedIn,
      authReady,
      adminType,
      adminLogin,
      adminLogout,
      createCard,
      updateCard,
      deleteCard,
      intrusTopics,
      createIntrusTopic,
      updateIntrusTopic,
      deleteIntrusTopic,
      roomsFilterGameId,
      setRoomsFilterGameId,
      mecanqueSettings,
      setMecanqueSettings,
      chessSettings,
      setChessSettings,
      soundEnabled,
      setSoundEnabled,
      voiceInteractionEnabled,
      setVoiceInteractionEnabled,
      hapticEnabled,
      setHapticEnabled,
      animationsEnabled,
      setAnimationsEnabled,
      confirmBeforeLeaving,
      setConfirmBeforeLeaving,
      reducedMotion,
      setReducedMotion,
      batterySaver,
      setBatterySaver,
      notificationSettings,
      setNotificationSettings,
      onlineStatus,
      setOnlineStatus,
      friendRequestsPermission,
      setFriendRequestsPermission,
      profileVisibility,
      setProfileVisibility,
      avatarVisibility,
      setAvatarVisibility,
      friendsListVisibility,
      setFriendsListVisibility,
      roomInvitesPermission,
      setRoomInvitesPermission,
      interactionPermission,
      setInteractionPermission,
      downloadUserData,
      connectionStatus,
      setConnectionStatus,
      connectionQuality,
      invitations,
      acceptInvitation,
      declineInvitation,
      unreadInvitationsCount,
      unreadRoomInvitationsCount,
      unreadFriendRequestsCount,
      isFriendsModalOpen,
      setIsFriendsModalOpen,
      isRoomsModalOpen,
      setIsRoomsModalOpen,
      activeNotificationModalOpen,
      setActiveNotificationModalOpen,
      isNotificationCenterOpen,
      setIsNotificationCenterOpen,
      activeNotificationTab,
      setActiveNotificationTab,
      openNotificationCenter,
      gameResultNotifications,
      readNotificationIds,
      unreadRoomNotificationsCount,
      unreadFriendNotificationsCount,
      unreadGameResultsCount,
      totalUnreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearGameResultNotification,
      viewedUserProfile,
      profileReturnView,
      viewUserProfile,
      closeViewedUserProfile,
      closeActiveModal,
      registerModalCloseHandler,
      rankUnlockModalData,
      setRankUnlockModalData,
      unlockedEmojis,
      buyEmoji,
      isEmojiShopOpen,
      setIsEmojiShopOpen,
      activeReactions,
      sendEmojiReaction,
      unlockedFrames,
      equippedFrame,
      isFrameShopOpen,
      setIsFrameShopOpen,
      buyAvatarFrame,
      equipAvatarFrame,
      selectedGameThemeState,
      setSelectedGameTheme,
      isThemePickerOpen,
      setIsThemePickerOpen,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
