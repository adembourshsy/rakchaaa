import { GameInfo } from '../types';
import { MECANQUE_SVG_COVER, INTRUS_SVG_COVER, UNO_SVG_COVER, ACTION_VERITE_SVG_COVER, CHESS_SVG_COVER, BELOTE_SVG_COVER } from './gameCovers';
import { getOptimizedImageUrl } from '../services/cloudinaryService';
import comingSoonCoverImg from '../assets/images/optimized/coming_soon_game_cover_1787844910344.webp';

// Standardized Original RAKCHA GAME Default Profile Avatar SVG Data URI
export const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23EEF0F4'/><circle cx='50' cy='38' r='15' fill='%23868C98'/><path d='M50 58c-16 0-27 9.5-27 21 0 1.5 1.2 2.7 2.7 2.7h48.6c1.5 0 2.7-1.2 2.7-2.7 0-11.5-11-21-27-21z' fill='%23868C98'/></svg>`;

export const getAvatarUrl = (avatarUrl?: string | null, seed?: string): string => {
  if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '' || avatarUrl.includes('placeholder')) {
    if (seed && seed.trim()) {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed.trim())}`;
    }
    return DEFAULT_AVATAR;
  }
  return getOptimizedImageUrl(avatarUrl, 150);
};


export const INITIAL_GAMES: GameInfo[] = [
  {
    id: 'mecanque',
    title: 'Omour Mecanque',
    subtitle: 'Automotive Clue & Speed Showdown',
    category: 'car',
    minPlayers: 2,
    maxPlayers: 20,
    estimatedTimeMinutes: 10,
    description: 'Identify the car from progressive clues (origin, specs, engine sound, model). Secret answers, host validation, and multi-player speed rounds!',
    difficulty: 'Medium',
    accentColor: '#E87038',
    coverImage: MECANQUE_SVG_COVER,
  },
  {
    id: 'uno-game',
    title: 'Rakcha Uno',
    subtitle: 'Tactical Card Showdown',
    category: 'uno',
    minPlayers: 2,
    maxPlayers: 20,
    estimatedTimeMinutes: 10,
    description: 'Classic UNO with deep tactical rules, rapid action, dynamic voice declaration, and swift counter-attacks on a premium interactive board.',
    difficulty: 'Medium',
    accentColor: '#FF5436',
    coverImage: UNO_SVG_COVER,
  },
  {
    id: 'intrus',
    title: "L'Intrus",
    subtitle: 'Find the Impostor',
    category: 'quiz',
    minPlayers: 3,
    maxPlayers: 20,
    estimatedTimeMinutes: 10,
    description: 'Find the impostor among your friends! Everyone gets a secret word except one person. Ask questions, vote, and uncover the Intrus.',
    difficulty: 'Easy',
    accentColor: '#9C27B0',
    coverImage: INTRUS_SVG_COVER,
  },
  {
    id: 'mind-rally',
    title: 'Action Vérité Tounsiya',
    subtitle: 'Social Truth or Dare',
    category: 'quiz',
    minPlayers: 2,
    maxPlayers: 20,
    estimatedTimeMinutes: 5,
    description: 'The ultimate Tunisian truth or dare social game with engaging questions, playful dares, and spontaneous fun for friends.',
    difficulty: 'Easy',
    accentColor: '#FFB800',
    coverImage: ACTION_VERITE_SVG_COVER,
  },
  {
    id: 'chess',
    title: 'Grandmaster Chess',
    subtitle: 'Full FIDE Rules Chess Engine',
    category: 'party',
    minPlayers: 1,
    maxPlayers: 2,
    estimatedTimeMinutes: 20,
    description: 'Complete and fully legal FIDE Chess rules engine featuring castling, en passant, pawn promotion, checkmate detection, move history, and smart AI.',
    difficulty: 'Hard',
    accentColor: '#3B82F6',
    coverImage: CHESS_SVG_COVER,
  },
  {
    id: 'belote',
    title: 'Belote',
    subtitle: 'Belote',
    category: 'card',
    minPlayers: 4,
    maxPlayers: 4,
    estimatedTimeMinutes: 15,
    description: 'Traditional 32-card Belote & Baloot card game with Tunisian rules, bidding (Talba), and trumps. Coming soon on Rakcha!',
    difficulty: 'Hard',
    accentColor: '#10B981',
    coverImage: BELOTE_SVG_COVER,
  },
  {
    id: 'coming-soon',
    title: 'Coming Soon',
    subtitle: 'قيد التحضير • En cours de préparation',
    category: 'party',
    minPlayers: 2,
    maxPlayers: 10,
    estimatedTimeMinutes: 10,
    description: 'Une nouvelle lamma / game en cours de préparation et développement. Restez branchés !',
    difficulty: 'Easy',
    accentColor: '#94A3B8',
    coverImage: comingSoonCoverImg,
  },
];

