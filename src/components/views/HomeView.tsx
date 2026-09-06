import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  MessageSquarePlus,
} from 'lucide-react';
import { INITIAL_GAMES } from '../../data/mockData';
import { GameInfo } from '../../types';
import { GameModeModal } from '../modals/GameModeModal';
import { MecanqueSetupModal } from '../modals/MecanqueSetupModal';
import { UnoSetupModal } from '../modals/UnoSetupModal';
import { IntrusSetupModal } from '../modals/IntrusSetupModal';
import { ChessSetupModal } from '../modals/ChessSetupModal';
import { FeedbackModal } from '../modals/FeedbackModal';
import { useApp } from '../../context/AppContext';
import { Hero3DShowcase } from '../ui/Hero3DShowcase';

export const HomeView: React.FC = () => {
  const { t, setRoomsFilterGameId, setActiveTab } = useApp();
  const [selectedGameForMode, setSelectedGameForMode] = useState<GameInfo | null>(null);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isMecanqueSetupOpen, setIsMecanqueSetupOpen] = useState(false);
  const [isUnoSetupOpen, setIsUnoSetupOpen] = useState(false);
  const [isIntrusSetupOpen, setIsIntrusSetupOpen] = useState(false);
  const [isChessSetupOpen, setIsChessSetupOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Trending games (top picks)
  const trendingGames = useMemo(() => {
    return INITIAL_GAMES.filter(g => g.id !== 'coming-soon' && g.id !== 'belote').slice(0, 3);
  }, []);

  const handleGameSelect = async (game: GameInfo) => {
    if (game.id === 'coming-soon' || game.id === 'belote') {
      alert(t('comingSoonAlert'));
      return;
    }
    if (game.id === 'intrus') {
      setIsIntrusSetupOpen(true);
    } else if (game.id === 'mecanque') {
      setIsMecanqueSetupOpen(true);
    } else if (game.id === 'uno-game') {
      setIsUnoSetupOpen(true);
    } else if (game.id === 'chess') {
      setIsChessSetupOpen(true);
    } else {
      setSelectedGameForMode(game);
      setIsModeModalOpen(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] pt-1 sm:pt-2 select-none"
    >
      {/* 3D Hero Showcase Banner */}
      <Hero3DShowcase onExploreRooms={() => setActiveTab('rooms')} />

      {/* TRENDING / POPULAR HORIZONTAL CAROUSEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono font-bold text-[#FF8F00] uppercase tracking-widest flex items-center gap-2">
            <Flame size={14} strokeWidth={2} className="text-[#FF8F00]" />
            <span>{t('popularTrending')}</span>
          </h2>
          <span className="text-[10px] font-mono text-[#4C5055] uppercase font-bold">
            {t('topPickLobbies')}
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {trendingGames.map((game, idx) => {
            return (
              <motion.div
                key={`trending-${game.id}-${idx}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGameSelect(game)}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start relative rounded-[14px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:border-[#47A5FF] dark:hover:border-[#47A5FF] p-4 flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer group transition-all"
              >
                <div className="space-y-2.5">
                  <div className="w-full aspect-[16/9] min-h-[140px] rounded-[10px] overflow-hidden bg-[#F0F6FF] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] relative">
                    <img loading="lazy" decoding="async" src={game.coverImage}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/70 dark:from-[#1E293B]/80 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#000000] dark:text-[#F8FAFC] group-hover:text-[#47A5FF] transition-colors truncate">
                      {game.title}
                    </h3>
                    <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] line-clamp-1 leading-relaxed mt-0.5 font-normal">
                      {t('gameDesc_' + game.id.replace('-', '_')) || game.description}
                    </p>
                  </div>
                </div>
                <div className="pt-3 mt-2 flex items-center justify-between border-t border-[#D5E5F7] dark:border-[#334155]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomsFilterGameId(game.id);
                      setActiveTab('rooms');
                    }}
                    className="text-[11px] font-mono font-bold text-[#47A5FF] hover:underline uppercase tracking-wider"
                  >
                    {t('viewRooms')} →
                  </button>
                  <span className="px-3 py-1 rounded-[8px] bg-[#47A5FF] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-xs group-hover:bg-[#3A92EE] transition-colors">
                    {t('play')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Game Grid Header */}
      <div className="flex items-center justify-between pt-1 px-1">
        <h2 className="text-xs font-mono font-bold text-[#000000] dark:text-[#F8FAFC] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#47A5FF]" />
          <span>{t('allAvailableGames')}</span>
        </h2>
        <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] font-bold">
          {INITIAL_GAMES.length} {t('gamesCountLabel')}
        </span>
      </div>

      {/* Main Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {INITIAL_GAMES.map((game, idx) => {
          const isComingSoon = game.id === 'coming-soon' || game.id === 'belote';
          return (
            <motion.div
              key={`game-${game.id}-${idx}`}
              whileHover={{ y: isComingSoon ? 0 : -2 }}
              whileTap={{ scale: isComingSoon ? 1 : 0.98 }}
              onClick={() => handleGameSelect(game)}
              className={`group relative rounded-[14px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] p-4 sm:p-5 space-y-3.5 shadow-xs hover:border-[#47A5FF] dark:hover:border-[#47A5FF] hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${isComingSoon ? 'opacity-90 border-dashed border-amber-500/40 bg-amber-500/[0.02] dark:bg-amber-500/[0.03]' : ''} ${game.id === 'belote' ? 'extreme-card extreme-glow' : ''}`}
            >
              <div className="space-y-3">
                {/* Game Poster */}
                <div className="w-full aspect-[16/9] min-h-[160px] sm:min-h-[180px] rounded-[10px] overflow-hidden flex items-center justify-center bg-[#F0F6FF] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] relative group-hover:scale-[1.01] transition-transform duration-300">
                  <img loading="lazy" decoding="async" src={game.coverImage}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/70 dark:from-[#1E293B]/80 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity pointer-events-none" />

                  {isComingSoon && (
                    <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-amber-500 text-black font-mono font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                      <span>{t('comingSoonBadge')}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-0.5">
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#F8FAFC] group-hover:text-[#47A5FF] transition-colors">
                    {isComingSoon ? t('comingSoonTag') : game.title}
                  </h3>
                  <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] line-clamp-2 leading-relaxed font-normal">
                    {t('gameDesc_' + game.id.replace('-', '_')) || game.description}
                  </p>
                </div>
              </div>

              {/* Action Bar with explicit Button Hierarchy */}
              <div className="pt-3 pb-0.5 flex items-center justify-between border-t border-[#D5E5F7] dark:border-[#334155]">
                {isComingSoon ? (
                  <span className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                    {t('stayTuned')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomsFilterGameId(game.id);
                      setActiveTab('rooms');
                    }}
                    className="px-3 py-1.5 rounded-[8px] border border-[#D5E5F7] dark:border-[#334155] bg-[#F0F6FF]/60 dark:bg-[#0F172A]/50 text-[#47A5FF] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] text-xs font-mono font-bold uppercase tracking-wider transition-all"
                  >
                    {t('viewRooms')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGameSelect(game);
                  }}
                  className={`px-4 py-1.5 rounded-[8px] text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1 ${
                    isComingSoon
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 cursor-pointer'
                      : 'bg-[#47A5FF] hover:bg-[#3A92EE] text-white'
                  }`}
                >
                  <span>{isComingSoon ? t('soon') : t('play')}</span>
                  {!isComingSoon && <span>→</span>}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Give Feedback & Game Suggestions Section (Very bottom of Home page) */}
      <motion.div
        id="home-feedback-section"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 mb-8 p-5 rounded-[14px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] shadow-xs relative overflow-hidden"
      >
        {/* Subtle accent backdrop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#47A5FF]/10 via-[#FF8F00]/5 to-transparent rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-gradient-to-tr from-[#47A5FF] to-[#0067FF] flex items-center justify-center text-white shadow-md shadow-[#47A5FF]/20 shrink-0">
              <MessageSquarePlus size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#000000] dark:text-[#F8FAFC]">
                  Feedback & Suggestions
                </h3>
              </div>
              <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] mt-0.5">
                عندك رأي أو اقتراح لعبة جديدة تحب نزيدوها؟ شاركنا ملاحظتك لتصل مباشرة إلى صاحب التطبيق.
              </p>
            </div>
          </div>

          <button
            id="give-feedback-home-btn"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-[#47A5FF] to-[#0067FF] hover:from-[#3b93e8] hover:to-[#0058db] active:scale-95 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-md shadow-[#47A5FF]/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <MessageSquarePlus size={15} strokeWidth={2.2} />
            <span>💬 Give Feedback</span>
          </button>
        </div>
      </motion.div>

      {/* Game-specific Modals */}
      <GameModeModal
        game={selectedGameForMode}
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
      />

      <MecanqueSetupModal
        isOpen={isMecanqueSetupOpen}
        onClose={() => setIsMecanqueSetupOpen(false)}
      />

      <UnoSetupModal
        isOpen={isUnoSetupOpen}
        onClose={() => setIsUnoSetupOpen(false)}
      />

      <IntrusSetupModal
        isOpen={isIntrusSetupOpen}
        onClose={() => setIsIntrusSetupOpen(false)}
      />

      <ChessSetupModal
        isOpen={isChessSetupOpen}
        onClose={() => setIsChessSetupOpen(false)}
      />

      {/* Feedback & Suggestion Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </motion.div>
  );
};
