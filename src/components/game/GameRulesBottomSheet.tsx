import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getActionVeriteRules, getMecanqueRules, getIntrusRules } from '../../data/localizedRules';

interface GameRulesBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRulesBottomSheet: React.FC<GameRulesBottomSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, joinedRoom, mecanqueSettings } = useApp();
  const [activeRuleIndex, setActiveRuleIndex] = useState(0);

  // Dynamic game-type rule selection
  const isMecanque = joinedRoom?.gameId === 'mecanque';
  const isIntrus = joinedRoom?.gameId === 'intrus';

  const effectiveMecanqueSettings = joinedRoom?.mecanqueSettings || mecanqueSettings;

  const rules = isIntrus
    ? getIntrusRules(language)
    : isMecanque
    ? getMecanqueRules(language, effectiveMecanqueSettings)
    : getActionVeriteRules(language);

  // Auto-advance/reset rule step when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveRuleIndex(0);
      return;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRule = rules[activeRuleIndex];
  const Icon = currentRule.icon;

  const handleNext = () => {
    if (activeRuleIndex < rules.length - 1) {
      setActiveRuleIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const isAr = language === 'ar';

  const labels = {
    en: {
      officialRules: '• OFFICIAL RULES',
      rulePrefix: 'RULE',
      nextCardType: isMecanque ? 'NEXT RULE STEP' : 'NEXT CARD TYPE',
      understood: 'UNDERSTOOD • BACK TO ROOM',
    },
    fr: {
      officialRules: '• RÈGLES OFFICIELLES',
      rulePrefix: 'RÈGLE',
      nextCardType: isMecanque ? 'ÉTAPE SUIVANTE' : 'TYPE DE CARTE SUIVANT',
      understood: 'COMPRIS • RETOUR AU SALON',
    },
    ar: {
      officialRules: '• القَوَاعِدُ الرَّسْمِيَّة',
      rulePrefix: 'القاعدة',
      nextCardType: isMecanque ? 'الخطوة التالية' : 'نوع البطاقة التالي',
      understood: 'مفهوم • العودة إلى الغرفة',
    },
  };

  const currentLabels = labels[language] || labels.en;
  const gameHeaderTitle = isMecanque ? 'MECANQUE' : 'RAKCHA GAME';

  return (
    <AnimatePresence>
      <div key="game-rules-bottom-sheet-backdrop" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#352208] border border-[#352208]/15 dark:border-[#E1BB80]/20 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] space-y-6 shadow-2xl max-h-[85dvh] overflow-y-auto text-[#352208] dark:text-[#FFF5E6]"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#352208]/10 dark:border-[#E1BB80]/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#352208] dark:text-[#E1BB80] uppercase">
                {gameHeaderTitle}
              </span>
              <span className="text-[10px] font-mono text-[#75552D] dark:text-[#D5B585]">
                {currentLabels.officialRules}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#75552D] dark:text-[#D5B585] hover:text-[#352208] dark:hover:text-[#FFF5E6] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress Step Indicator Dots */}
          <div className="flex items-center gap-2">
            {rules.map((_, idx) => (
              <button
                key={`rule-indicator-dot-${idx}`}
                onClick={() => setActiveRuleIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeRuleIndex
                    ? 'flex-1 bg-[#352208] dark:bg-[#E1BB80]'
                    : idx < activeRuleIndex
                    ? 'w-6 bg-[#352208]/40 dark:bg-[#E1BB80]/40'
                    : 'flex-1 bg-[#352208]/10 dark:bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Animated Rule Card View */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`rule-card-slide-${activeRuleIndex}`}
              initial={{ opacity: 0, x: isAr ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isAr ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className={`p-5 rounded-2xl bg-black/3 dark:bg-[#463013] border border-[#352208]/15 dark:border-[#E1BB80]/20 space-y-3 ${isAr ? 'text-right' : 'text-left'}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${currentRule.badgeBg} ${currentRule.badgeText} text-[10px] font-mono font-bold uppercase tracking-wider`}
                >
                  <Icon size={12} />
                  <span>{currentRule.category}</span>
                </span>

                <span className="text-[10px] font-mono text-[#75552D] dark:text-[#D5B585]">
                  {currentLabels.rulePrefix} {activeRuleIndex + 1}/{rules.length}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-mono font-bold text-[#352208] dark:text-[#FFF5E6]">
                  {currentRule.title}
                </h3>
                <p className="text-xs text-[#75552D] dark:text-[#D5B585] mt-1 leading-relaxed">
                  {currentRule.description}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#352208] border border-[#352208]/10 dark:border-[#E1BB80]/20">
                <p className="text-[10px] font-mono text-[#75552D] dark:text-[#D5B585] uppercase">
                  {currentRule.exampleLabel}
                </p>
                <p className="text-xs text-[#352208] dark:text-[#FFF5E6] italic mt-0.5">
                  "{currentRule.example}"
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-full bg-[#352208] dark:bg-[#E1BB80] text-[#E1BB80] dark:text-[#352208] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all shadow-md shadow-black/20 cursor-pointer"
          >
            <span>
              {activeRuleIndex === rules.length - 1
                ? currentLabels.understood
                : currentLabels.nextCardType}
            </span>
            {activeRuleIndex === rules.length - 1 ? (
              <Check size={14} />
            ) : (
              <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
