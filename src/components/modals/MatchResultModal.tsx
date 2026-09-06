import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, XCircle, Coins, Check, Award, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MatchResultModal: React.FC = () => {
  const { matchResultNotification, setMatchResultNotification, userProfile, language } = useApp();

  if (!matchResultNotification) return null;

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const {
    gameTitle,
    isWinner,
    isDraw,
    coinsChange,
    entryCost,
  } = matchResultNotification;

  const currentCoins = userProfile.coins ?? 300;

  const handleDismiss = () => {
    setMatchResultNotification(null);
  };

  return (
    <AnimatePresence>
      <div key="match-result-modal-backdrop" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`w-full max-w-sm sm:max-w-md my-auto rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-5 border-2 text-white font-sans ${
            isWinner
              ? 'bg-gradient-to-b from-[#1C2812] via-[#121A0C] to-[#0A0F07] border-emerald-500/80 shadow-emerald-500/20'
              : isDraw
              ? 'bg-gradient-to-b from-[#1F242D] via-[#13171F] to-[#0B0D12] border-amber-500/80 shadow-amber-500/20'
              : 'bg-gradient-to-b from-[#281216] via-[#1A0C0E] to-[#0F0708] border-red-500/80 shadow-red-500/20'
          }`}
        >
          {/* Top Game Title */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono tracking-wider text-white/80 uppercase">
            <span>{gameTitle || 'RAKCHA MATCH'}</span>
          </div>

          {/* Main Visual Icon */}
          <div className="flex justify-center">
            {isWinner ? (
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce">
                  <Trophy size={42} />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-black">
                  <Check size={16} strokeWidth={3} />
                </div>
              </div>
            ) : isDraw ? (
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
                <Award size={42} />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400">
                <XCircle size={42} />
              </div>
            )}
          </div>

          {/* Result Text */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">
              {isWinner
                ? isAr ? '🏆 مبروك! لقد فزت!' : isFr ? '🏆 VICTOIRE !' : '🏆 YOU WON!'
                : isDraw
                ? isAr ? '🤝 مباراة متعادلة!' : isFr ? '🤝 MATCH NUL !' : '🤝 MATCH DRAW!'
                : isAr ? '❌ حظ أوفر! لقد خسرت' : isFr ? '❌ DÉFAITE !' : '❌ YOU LOST!'}
            </h2>
            <p className="text-xs text-white/70 font-mono">
              {entryCost === 0
                ? (isAr ? 'لعبة مجانية (0 كوينز)' : isFr ? 'Partie Gratuite (0 Coins)' : 'Free Match (0 Coins)')
                : (isAr ? `رسوم الدخول: ${entryCost} قطعة` : `Match Entry Fee: ${entryCost} Coins`)}
            </p>
          </div>

          {/* Coins Delta Highlight Box */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between font-mono ${
            isWinner
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : isDraw
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              <Coins size={22} className={isWinner ? 'text-emerald-400' : isDraw ? 'text-amber-400' : 'text-red-400'} />
              <span className="text-xs uppercase font-bold tracking-wider">
                {isAr ? 'النتيجة الماليّة' : 'Settlement'}
              </span>
            </div>
            <span className="text-xl font-black">
              {coinsChange > 0 ? `+${coinsChange}` : coinsChange} Coins
            </span>
          </div>

          {/* New Account Balance */}
          <div className="flex items-center justify-between text-xs font-mono text-white/80 px-1 border-t border-white/10 pt-3">
            <span>{isAr ? 'الرصيد الجديد:' : 'New Balance:'}</span>
            <span className="font-bold text-amber-400">💰 {currentCoins} Coins</span>
          </div>

          {/* Dismiss Action Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className={`w-full py-3.5 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
              isWinner
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                : isDraw
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <span>{isAr ? 'متابعة' : isFr ? 'Continuer' : 'CONTINUE'}</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
