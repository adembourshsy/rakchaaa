export type Language = 'en' | 'fr' | 'ar';

export type NavTab = 'home' | 'rooms' | 'settings';

export type ActiveView = 'main' | 'friends' | 'profile' | 'waiting_room' | 'game' | 'admin' | 'admin_action_verite' | 'admin_intrus' | 'admin_mecanque' | 'admin_ai_dashboard' | 'settings_privacy' | 'settings_help' | 'settings_about';

export type GameCategory = 'quiz' | 'word' | 'reaction' | 'memory' | 'uno' | 'party' | 'car' | 'card';

export type GameMode = 'friends' | 'family' | '18+';

export type GameId = 'intrus' | 'action-verite' | 'uno-game' | 'mecanque' | 'chess';

export type PlayType = 'virtual' | 'nearby';

export interface GameInfo {
  id: string;
  title: string;
  subtitle: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  estimatedTimeMinutes: number;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  accentColor?: string;
  coverImage?: string;
  tags?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  instagramUrl?: string;
  isOnline: boolean;
  gamesPlayed: number;
  winRate: number; // e.g. 68 for 68%
  currentStreak: number;
  level: number;
  joinedDate?: string;
  coins?: number; // Starting balance 300 coins
  wins?: number; // Total win count
  unlockedEmojis?: string[]; // Array of unlocked emoji IDs
  unlockedFrames?: string[]; // Array of unlocked avatar frame IDs
  equippedFrame?: string; // Currently equipped avatar frame ID
  isGuest?: boolean;
}

export interface EmojiReaction {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  emoji: string;
  soundId?: string | null;
  createdAt: string;
  createdAtMs?: number;
}

export interface Friend extends UserProfile {
  isFavorite?: boolean;
  statusText?: string;
  lastActive?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarUrl: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface RoomPlayer {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  instagramUrl?: string;
  isHost: boolean;
  isReady: boolean;
  score?: number;
  lastActive?: number;
  wins?: number;
  equippedFrame?: string;
}

export interface MecanqueSettings {
  difficulty: 'beginner' | 'intermediate' | 'expert';
  carCount: number; // 5, 10, 15, 20
  thinkingTime: number; // 30, 45, 60
}


export interface IntrusTopic {
  id: string;
  title: string;
  category: string;
  icon: string;
  language?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type IntrusPhase = 'WORD_REVEAL' | 'QUESTIONING' | 'VOTING' | 'VOTE_RESULT' | 'GAME_OVER';

export interface IntrusGameState {
  phase: IntrusPhase;
  roundNumber: number;
  secretTopicId: string;
  intrusPlayerId: string;
  stageEndTime: number;
  activePlayerId: string;
  turnOrder: string[];
  votesMap: Record<string, string>;
  voteResult: { intrusPlayerId: string; eliminatedPlayerId: string | null } | null;
}

export type RoomStatus = 'waiting' | 'in_progress' | 'completed';

export interface Room {
  id: string;
  code: string; // e.g. "QSXP89"
  title: string;
  gameId: string;
  gameTitle: string;
  mode?: GameMode;
  playType?: PlayType;
  entryCost?: number; // Entry cost in coins (e.g., 30, 50, 100, 300)
  hostId?: string; // Firebase uid of the current host — used by Firestore security rules
  hostName: string;
  hostAvatar: string;
  currentPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
  status: RoomStatus;
  players: RoomPlayer[];
  playerIds?: string[];
  createdAt: string;
  lastActivityAt?: string | any;
  mecanqueSettings?: MecanqueSettings;
  chessSettings?: ChessSettings;
  chessGameState?: ChessGameState;
}

export type ChessTimeOptionId =
  | '1m'
  | '2m'
  | '3m2s'
  | '5m'
  | '10m'
  | '15m10s'
  | '30m'
  | '60m'
  | 'unlimited';

export interface ChessSettings {
  timeControlId: ChessTimeOptionId;
  initialSeconds: number; // 0 for unlimited
  incrementSeconds: number;
}

export interface ChessGameState {
  status: 'setup' | 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'timeout';
  fen?: string;
  turn: 'w' | 'b';
  history: any[];
  // Full board snapshot — REQUIRED so the opponent's client can rebuild the
  // exact position (without this, the receiving player's board engine has
  // no pieces to move and gets stuck on their turn).
  board?: (({ type: string; color: 'w' | 'b' } | null)[])[]; // legacy (unsupported by Firestore)
  // Firestore-safe encoding of the 8x8 board: 8 strings, uppercase = white,
  // lowercase = black, '.' = empty.
  boardRows?: string[];
  castlingRights?: {
    w: { k: boolean; q: boolean };
    b: { k: boolean; q: boolean };
  };
  enPassantSquare?: string | null;
  halfmoveClock?: number;
  fullmoveNumber?: number;
  capturedWhite?: string[];
  capturedBlack?: string[];
  whitePlayerId?: string;
  blackPlayerId?: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
  whitePlayerAvatar?: string;
  blackPlayerAvatar?: string;
  whiteRemainingMs: number;
  blackRemainingMs: number;
  lastMoveTimestamp?: number;
  timeControlId: ChessTimeOptionId;
  initialSeconds: number;
  incrementSeconds: number;
  winner?: 'w' | 'b' | 'draw' | null;
  winnerPlayerId?: string | null;
  drawReason?: string;
  timeoutColor?: 'w' | 'b';
}

export interface FriendActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  actionText: string;
  gameTitle: string;
  timestamp: string;
}

// LammaHub Game Card Types
export type CardCategory = 'action' | 'truth' | 'shield' | 'special';
export type CardMode = 'friends' | 'family' | '18+' | 'mode_fr' | 'mode_tn' | 'mode_fun' | 'all';
export type CardDifficulty = 'easy' | 'medium' | 'hard';

export interface SpecialCardOptions {
  optionA: string;
  optionB: string;
}

export interface GameCard {
  id: string;
  category: CardCategory;
  title: string;
  content: string; // Question or Action description
  mode?: CardMode | string;
  difficulty?: CardDifficulty;
  order?: number;
  description?: string;
  imageUrl?: string; // Optional image URL for shield and special cards
  specialOptions?: SpecialCardOptions;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CardTurnSession {
  specialCardOwnerId?: string;
  activePlayerIndex: number;
  currentPlayerId?: string;
  currentCard: GameCard | null;
  isFlipped: boolean;
  timerSeconds: number; // Max 60s
  isTimerRunning: boolean;
  shieldsMap: Record<string, number>; // playerId -> shield count
  selectedSpecialChoice?: 'optionA' | 'optionB' | null;
  selectedTargetPlayerId?: string | null;
  selectedTargetPlayerName?: string | null;
  specialActionStep?: 'choose_action' | 'choose_player' | 'confirm_remove' | 'show_question' | 'completed' | null;
  shieldUsedInTurn?: boolean;
  removedPlayerIds?: string[];
  turnOrder?: string[];
  roundCardCounts?: { shield: number; special: number }; // per-round quota for green/special cards
}

export interface RoomInvitation {
  id: string;
  roomId: string;
  roomCode: string;
  gameId: string;
  gameTitle: string;
  inviterId: string;
  inviterName: string;
  inviterAvatar: string;
  status: 'pending' | 'accepted' | 'joined' | 'declined' | 'expired';
  receivedAt: string;
  createdAt?: string;
  createdAtMs?: number;
}

// MECANQUE Automotive Game Types
export interface CarData {
  id: string;
  manufacturer: string;
  model: string;
  fullName: string;
  country: string;
  flag: string;
  engine: string;
  cylinders: string;
  fuelType: string;
  year: string;
  bodyType: string;
  performance: string; // e.g. "510 HP • 0-100 in 3.8s"
  difficulty: 'beginner' | 'intermediate' | 'expert';
  soundProfile: 'v6_turbo' | 'v8_naturally_aspirated' | 'v10_high_rev' | 'inline4_turbo' | 'boxer6' | 'v12_exotic' | string;
  customAudioUrl?: string;
  customImageUrl?: string;
  acceptedAnswers: string[]; // Variations like ["BMW M3", "M3", "BMW M 3"]
  clues: string[];
}

export interface MecanqueGuess {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export type MecanquePhase = 'setup' | 'answering' | 'reveal' | 'validation' | 'ended';

export interface MecanqueRevealedAnswer {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  text: string;
  submittedAt?: string;
  isCorrect?: boolean;
  noAnswer?: boolean;
}

export interface MecanqueGameState {
  engineVersion?: number;
  status: 'setup' | 'playing' | 'ended';
  phase?: MecanquePhase;
  phaseUpdatedAt?: number;
  matchResult?: 'winner' | 'draw';
  winnerIds?: string[];
  difficulty: 'beginner' | 'intermediate' | 'expert';
  carCount: number; // 5, 10, 15, 20
  thinkingTime: number; // 30, 45, 60
  currentCarIndex: number;
  timerEndTime?: number;
  cars: CarData[];
  submittedPlayerIds?: string[];
  revealedAnswers?: MecanqueRevealedAnswer[];
  validatedPlayerIds?: string[];
  scores: Record<string, number>;
  winner?: { playerId: string; playerName: string; score: number } | null;
  // Legacy / fallback fields
  currentClueStage?: number;
  timeRemaining?: number;
  stageEndTime?: number;
  isTimerActive?: boolean;
  guesses?: MecanqueGuess[];
  roundWinner?: { playerId: string; playerName: string; points: number; carName: string } | null;
}

