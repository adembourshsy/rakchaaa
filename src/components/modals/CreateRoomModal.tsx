import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Layers, Car, Brain, HelpCircle, Club, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_GAMES } from '../../data/mockData';
import { GameInfo } from '../../types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: GameInfo) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onSelectGame }) => {
  const { t, language } = useApp();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const handleSelectGame = (game: GameInfo) => {
    onSelectGame(game);
  };

  const getGameIcon = (gameId: string) => {
    switch (gameId) {
      case 'uno-game':
        return <Layers className="text-[#EF4444]" size={20} strokeWidth={1.75} />;
      case 'mecanque':
        return <Car className="text-[#FF8F00]" size={20} strokeWidth={1.75} />;
      case 'belote':
        return <Club className="text-[#47A5FF]" size={20} strokeWidth={1.75} />;
      case 'intrus':
        return <HelpCircle className="text-[#FF8F00]" size={20} strokeWidth={1.75} />;
      default:
        return <Brain className="text-[#47A5FF]" size={20} strokeWidth={1.75} />;
    }
  };

  return (
    <>
      <AnimatePresence>
        <div
          key="create-room-modal-backdrop"
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs select-none"
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-lg bg-white dark:bg-[#131A29] rounded-t-[16px] sm:rounded-[16px] border border-[#D5E5F7] dark:border-[#1E273C] p-5 sm:p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] space-y-5 shadow-2xl max-h-[85dvh] overflow-y-auto text-[#000000] dark:text-[#F8FAFC]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#D5E5F7] dark:border-[#1E273C]">
              <div>
                <h3 className="text-base font-semibold text-[#000000] dark:text-[#F8FAFC] uppercase tracking-wider font-mono">
                  {t('createRoom')}
                </h3>
                <p className="text-xs text-[#4C5055] dark:text-[#94A3B8]">
                  {isAr ? 'اختر اللعبة للبدء في الإعداد المخصص' : 'Select a game to configure and open a lounge'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-[8px] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer shrink-0"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            {/* Game Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {INITIAL_GAMES.filter(g => g.id !== 'coming-soon' && g.id !== 'belote').map((game, idx) => {
                const isPopular = game.id === 'mecanque' || game.id === 'uno-game';

                return (
                  <button
                    key={`create-game-${game.id}-${idx}`}
                    type="button"
                    onClick={() => handleSelectGame(game)}
                    className="p-3.5 sm:p-4 rounded-[16px] border border-[#D5E5F7] dark:border-[#222E46] hover:border-[#47A5FF] bg-[#F4F8FC] dark:bg-[#1A2234] hover:bg-[#F0F6FF] dark:hover:bg-[#202B42] text-start transition-all flex items-center justify-between group active:scale-98 cursor-pointer relative gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2.5 rounded-[10px] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#222E46] shrink-0 shadow-2xs">
                        {getGameIcon(game.id)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <h4 className="text-[15px] font-semibold text-[#000000] dark:text-[#F8FAFC] group-hover:text-[#47A5FF] transition-colors truncate">
                            {game.title}
                          </h4>
                          {isPopular && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FF8F00]/15 border border-[#FF8F00]/40 text-[#FF8F00] text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                              <Flame size={10} strokeWidth={2} />
                              POPULAR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#4C5055] dark:text-[#94A3B8] mt-0.5">
                          <span className="truncate">{t('gameSub_' + game.id.replace('-', '_')) || game.subtitle}</span>
                          <span className="text-[#4C5055] dark:text-[#64748B] shrink-0">•</span>
                          <span className="whitespace-nowrap shrink-0 text-[#4C5055] dark:text-[#94A3B8]">
                            {game.minPlayers}-{game.maxPlayers} {t('players')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[#47A5FF] shrink-0 ms-auto px-3 py-1.5 rounded-[9px] border border-[#47A5FF]/40 group-hover:bg-[#47A5FF] group-hover:text-white transition-all min-w-[84px] sm:min-w-[92px]">
                      <span>{isAr ? 'إعداد' : 'SETUP'}</span>
                      {isAr ? (
                        <ArrowLeft size={13} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
                      ) : (
                        <ArrowRight size={13} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
};

