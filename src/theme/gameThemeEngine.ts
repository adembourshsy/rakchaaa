import React from 'react';

export type GameThemeId = 'bronze' | 'emerald' | 'gold' | 'diamond' | 'cosmic';

export interface LeagueInfo {
  id: GameThemeId;
  name: string;
  leagueName: string;
  minLevel: number;
  badgeEmoji: string;
  badgeColor: string;
  accentHex: string;
  // Styles for the game table container
  tableContainer: string;
  tableInnerAccent: string;
  tableBorder: string;
  headerBadge: string;
  headerText: string;
  glowEffect: string;
  ambientParticles: 'sparkles' | 'grid' | 'stars' | 'gold_dust' | 'none';
  description: string;
}

export const GAME_THEMES: Record<GameThemeId, LeagueInfo> = {
  bronze: {
    id: 'bronze',
    name: 'Bronze Arena',
    leagueName: 'Bronze League',
    minLevel: 1,
    badgeEmoji: '🥉',
    badgeColor: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    accentHex: '#CD7F32',
    tableContainer: 'bg-gradient-to-br from-[#2a1b12] via-[#1c120c] to-[#0e0906]',
    tableInnerAccent: 'border-amber-900/30 bg-[radial-gradient(circle_at_center,rgba(205,127,50,0.08)_0%,transparent_70%)]',
    tableBorder: 'border-8 border-[#3A2312] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-amber-800/40',
    headerBadge: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
    headerText: 'text-amber-200',
    glowEffect: 'shadow-[0_0_30px_rgba(205,127,50,0.15)]',
    ambientParticles: 'none',
    description: 'Classic rustic leather and bronze wood aesthetic.',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Casino',
    leagueName: 'Emerald League',
    minLevel: 3,
    badgeEmoji: '❇️',
    badgeColor: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
    accentHex: '#10B981',
    tableContainer: 'bg-radial from-[#0F5338] via-[#0A3C28] to-[#041B12]',
    tableInnerAccent: 'border-dashed border-emerald-500/20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)]',
    tableBorder: 'border-8 border-[#2d1808] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-emerald-500/30',
    headerBadge: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    headerText: 'text-emerald-200',
    glowEffect: 'shadow-[0_0_35px_rgba(16,185,129,0.2)]',
    ambientParticles: 'sparkles',
    description: 'Traditional high-roller green felt table with gold stitching.',
  },
  gold: {
    id: 'gold',
    name: 'Royal Gold Velvet',
    leagueName: 'Gold League',
    minLevel: 5,
    badgeEmoji: '👑',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/60',
    accentHex: '#FFB800',
    tableContainer: 'bg-gradient-to-br from-[#3b2d07] via-[#231a03] to-[#120d01]',
    tableInnerAccent: 'border-amber-400/30 bg-[radial-gradient(circle_at_center,rgba(255,184,0,0.18)_0%,transparent_70%)]',
    tableBorder: 'border-8 border-[#5C450B] shadow-[0_20px_60px_rgba(255,184,0,0.25)] ring-2 ring-amber-400/60',
    headerBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    headerText: 'text-amber-300',
    glowEffect: 'shadow-[0_0_45px_rgba(255,184,0,0.3)]',
    ambientParticles: 'gold_dust',
    description: 'Opulent gold-trimmed velvet table fit for champions.',
  },
  diamond: {
    id: 'diamond',
    name: 'Neon Cyber Diamond',
    leagueName: 'Diamond League',
    minLevel: 10,
    badgeEmoji: '💎',
    badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-400/60',
    accentHex: '#06B6D4',
    tableContainer: 'bg-gradient-to-br from-[#0c2333] via-[#061520] to-[#020a10]',
    tableInnerAccent: 'border-cyan-400/40 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.22)_0%,transparent_70%)]',
    tableBorder: 'border-8 border-[#083344] shadow-[0_20px_60px_rgba(6,182,212,0.35)] ring-2 ring-cyan-400/70',
    headerBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60',
    headerText: 'text-cyan-200',
    glowEffect: 'shadow-[0_0_50px_rgba(6,182,212,0.35)]',
    ambientParticles: 'grid',
    description: 'High-tech cyan diamond neon matrix arena.',
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Galaxy Realm',
    leagueName: 'Cosmic League',
    minLevel: 15,
    badgeEmoji: '🌌',
    badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-400/60',
    accentHex: '#A855F7',
    tableContainer: 'bg-gradient-to-br from-[#1a0b2e] via-[#10051e] to-[#07010f]',
    tableInnerAccent: 'border-purple-400/40 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25)_0%,transparent_70%)]',
    tableBorder: 'border-8 border-[#3b0764] shadow-[0_20px_60px_rgba(168,85,247,0.4)] ring-2 ring-purple-400/70',
    headerBadge: 'bg-purple-500/20 text-purple-300 border-purple-400/60',
    headerText: 'text-purple-200',
    glowEffect: 'shadow-[0_0_55px_rgba(168,85,247,0.4)]',
    ambientParticles: 'stars',
    description: 'Mystical deep-space nebula table with animated starfield.',
  },
};

/**
 * Determine player league info based on their level or XP.
 */
export function getLeagueByLevel(level: number = 1): LeagueInfo {
  if (level >= 15) return GAME_THEMES.cosmic;
  if (level >= 10) return GAME_THEMES.diamond;
  if (level >= 5) return GAME_THEMES.gold;
  if (level >= 3) return GAME_THEMES.emerald;
  return GAME_THEMES.bronze;
}

export function getThemeById(themeId?: string, playerLevel: number = 1): LeagueInfo {
  if (themeId && themeId in GAME_THEMES) {
    return GAME_THEMES[themeId as GameThemeId];
  }
  return getLeagueByLevel(playerLevel);
}

export function getAllThemes(): LeagueInfo[] {
  return Object.values(GAME_THEMES);
}
