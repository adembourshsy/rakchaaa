export interface EmojiItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  isFree: boolean;
  soundId?: string | null;
  category?: 'free' | 'fun' | 'royalty' | 'expression' | 'action';
  description?: string;
}

export const FREE_EMOJIS: EmojiItem[] = [
  {
    id: 'laugh_free',
    emoji: '😂',
    name: 'Laughing',
    price: 0,
    isFree: true,
    soundId: null,
    category: 'free',
    description: 'Free default reaction (no sound)',
  },
  {
    id: 'smirk_free',
    emoji: '😒',
    name: 'Unamused',
    price: 0,
    isFree: true,
    soundId: null,
    category: 'free',
    description: 'Free default reaction (no sound)',
  },
  {
    id: 'cry_free',
    emoji: '😢',
    name: 'Crying',
    price: 0,
    isFree: true,
    soundId: null,
    category: 'free',
    description: 'Free default reaction (no sound)',
  },
  {
    id: 'cool_free',
    emoji: '😎',
    name: 'Cool Sunglasses',
    price: 0,
    isFree: true,
    soundId: null,
    category: 'free',
    description: 'Free default reaction (no sound)',
  },
];

export const FREE_EMOJI_IDS = FREE_EMOJIS.map((e) => e.id);

export const SHOP_EMOJIS: EmojiItem[] = [
  {
    id: 'fire',
    emoji: '🔥',
    name: 'On Fire',
    price: 300,
    isFree: false,
    soundId: 'fire_ignite',
    category: 'action',
    description: 'Burst of blazing flame sound',
  },
  {
    id: 'heart_kiss',
    emoji: '😘',
    name: 'Blow Kiss',
    price: 325,
    isFree: false,
    soundId: 'kiss_pop',
    category: 'fun',
    description: 'Sweet resonant kiss pop',
  },
  {
    id: 'mind_blown',
    emoji: '🤯',
    name: 'Mind Blown',
    price: 350,
    isFree: false,
    soundId: 'cosmic_blast',
    category: 'expression',
    description: 'Cosmic explosion & space shimmer',
  },
  {
    id: 'clapping',
    emoji: '👏',
    name: 'Applause',
    price: 310,
    isFree: false,
    soundId: 'applause_clap',
    category: 'action',
    description: 'Crisp standing ovation applause',
  },
  {
    id: 'clown',
    emoji: '🤡',
    name: 'Clown Squeak',
    price: 330,
    isFree: false,
    soundId: 'clown_honk',
    category: 'fun',
    description: 'Playful comedy horn squeak',
  },
  {
    id: 'rage',
    emoji: '😡',
    name: 'Rage Grumble',
    price: 340,
    isFree: false,
    soundId: 'rage_growl',
    category: 'expression',
    description: 'Deep frustrated distortion growl',
  },
  {
    id: 'party_popper',
    emoji: '🎉',
    name: 'Party Fanfare',
    price: 370,
    isFree: false,
    soundId: 'party_fanfare',
    category: 'fun',
    description: 'Celebratory pop & victory arpeggio',
  },
  {
    id: 'ghost',
    emoji: '👻',
    name: 'Spooky Ghost',
    price: 350,
    isFree: false,
    soundId: 'ghost_wail',
    category: 'expression',
    description: 'Ethereal theremin spirit wail',
  },
  {
    id: 'crown_king',
    emoji: '👑',
    name: 'Royal Crown',
    price: 450,
    isFree: false,
    soundId: 'royal_fanfare',
    category: 'royalty',
    description: 'Majestic imperial trumpet fanfare',
  },
  {
    id: 'money_mouth',
    emoji: '🤑',
    name: 'Money Rich',
    price: 400,
    isFree: false,
    soundId: 'cash_register',
    category: 'royalty',
    description: 'Golden coins jingling & cash chime',
  },
  {
    id: 'rocket',
    emoji: '🚀',
    name: 'Hyper Rocket',
    price: 430,
    isFree: false,
    soundId: 'rocket_boost',
    category: 'action',
    description: 'Ascending rocket thrust blast',
  },
  {
    id: 'devil',
    emoji: '😈',
    name: 'Evil Devil',
    price: 360,
    isFree: false,
    soundId: 'devil_laugh',
    category: 'expression',
    description: 'Dissonant menacing staccato chime',
  },
  {
    id: 'salute',
    emoji: '🫡',
    name: 'Respect Salute',
    price: 335,
    isFree: false,
    soundId: 'salute_bugle',
    category: 'action',
    description: 'Honor bugle call & snare hit',
  },
  {
    id: 'facepalm',
    emoji: '🤦',
    name: 'Facepalm',
    price: 320,
    isFree: false,
    soundId: 'facepalm_slap',
    category: 'expression',
    description: 'Classic comedic slap & thud pop',
  },
];

export const ALL_EMOJIS: EmojiItem[] = [...FREE_EMOJIS, ...SHOP_EMOJIS];

export const EMOJI_MAP: Record<string, EmojiItem> = ALL_EMOJIS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<string, EmojiItem>);

export function getEmojiById(id: string): EmojiItem | undefined {
  return EMOJI_MAP[id];
}

export function getEmojiBySymbol(symbol: string): EmojiItem | undefined {
  return ALL_EMOJIS.find((e) => e.emoji === symbol);
}
