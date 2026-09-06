import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, Shield, Palette } from 'lucide-react';
import {
  GAME_THEMES,
  GameThemeId,
  LeagueInfo,
  getAllThemes,
  getLeagueByLevel,
} from '../../theme/gameThemeEngine';

interface GameThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
  currentThemeId: GameThemeId;
  onSelectTheme: (themeId: GameThemeId) => void;
}

export const GameThemePickerModal: React.FC<GameThemePickerModalProps> = ({
  isOpen,
  onClose,
  playerLevel,
  currentThemeId,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const themes = getAllThemes();
  const currentLeague = getLeagueByLevel(playerLevel);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          className="relative w-full max-w-xl bg-[#0f0d15] text-white rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FF8600]/20 text-[#FF8600]">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Game Table Aesthetic Engine
                </h3>
                <p className="text-xs text-white/60">
                  Your Current Tier: <span className="text-[#FF8600] font-semibold">{currentLeague.leagueName}</span> (Lvl {playerLevel})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Theme List */}
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
            {themes.map((theme) => {
              const isUnlocked = playerLevel >= theme.minLevel;
              const isSelected = currentThemeId === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectTheme(theme.id);
                    }
                  }}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all select-none ${
                    isUnlocked
                      ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                      : 'opacity-60 cursor-not-allowed'
                  } ${
                    isSelected
                      ? 'border-[#FF8600] ring-2 ring-[#FF8600]/40 shadow-lg shadow-[#FF8600]/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Background Preview Banner */}
                  <div className={`absolute inset-0 rounded-2xl opacity-30 pointer-events-none ${theme.tableContainer}`} />

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Badge / Emoji */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border ${theme.badgeColor} shadow-sm shrink-0`}>
                        {theme.badgeEmoji}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{theme.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${theme.badgeColor}`}>
                            {theme.leagueName}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-0.5 leading-snug">
                          {theme.description}
                        </p>
                      </div>
                    </div>

                    {/* Action State */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF8600] text-white text-xs font-mono font-bold shadow-md">
                          <Check size={14} /> ACTIVE
                        </span>
                      ) : isUnlocked ? (
                        <button className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-semibold transition-colors">
                          EQUIP
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 text-white/50 text-xs font-mono">
                          <Lock size={12} /> Lvl {theme.minLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
            <span>Play games to gain XP and unlock League Table Themes!</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#FF8600] hover:bg-[#e07500] text-white font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
