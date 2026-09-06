import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Shield, Crown, X } from 'lucide-react';
import { PrimaryButton } from '../ui';
import { useApp } from '../../context/AppContext';

interface RankUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  wins: number;
  rankTitle: string;
  tier: 'starter' | 'advanced' | 'pro';
}

export const RankUnlockModal: React.FC<RankUnlockModalProps> = ({
  isOpen,
  onClose,
  wins,
  rankTitle,
  tier,
}) => {
  const { language, t } = useApp();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="rank-unlock-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm rounded-[16px] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] text-[#000000] dark:text-[#F8FAFC] p-6 text-center shadow-2xl space-y-5"
        >
          {/* Header Close */}
          <div className="flex justify-end -mt-2 -mr-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-[8px] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Celebratory Icon Animation */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#FF8F00]/10 animate-ping" />
            <div className="relative z-10 w-20 h-20 rounded-full bg-[#F0F6FF] dark:bg-[#1E273C] border border-[#FF8F00]/40 shadow-xl flex items-center justify-center text-[#FF8F00]">
              {tier === 'pro' && <Crown size={36} strokeWidth={1.75} className="text-[#FF8F00]" />}
              {tier === 'advanced' && <Shield size={36} strokeWidth={1.75} className="text-[#FF8F00]" />}
              {tier === 'starter' && <Trophy size={36} strokeWidth={1.75} className="text-[#FF8F00]" />}
            </div>
          </div>

          {/* Title & Wins Banner */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] text-[#FF8F00] text-xs font-mono font-bold tracking-wider uppercase">
              <span>{t('newRankUnlocked') || 'NEW RANK UNLOCKED'}</span>
            </div>

            <h3 className="text-2xl font-bold text-[#000000] dark:text-[#F8FAFC] tracking-tight">
              {rankTitle}
            </h3>
            
            <p className="text-sm font-mono text-[#4C5055] dark:text-[#94A3B8]">
              {language === 'ar'
                ? `تهانينا! لقد وصلت إلى ${wins} انتصارًا في ركشة.`
                : `Congratulations! You reached ${wins} lifetime wins in RAKCHA.`}
            </p>
          </div>

          {/* Rank Description */}
          <div className="p-3.5 rounded-[14px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] text-xs text-[#4C5055] dark:text-[#94A3B8] leading-relaxed font-normal">
            {tier === 'pro' && (
              language === 'ar'
                ? 'أنت الآن لاعب محترف (PRO) بحق! لقد حصلت على إطار ذهبي لامع.'
                : 'You are now an elite PRO PLAYER! Your profile now proudly displays the legendary gold ring.'
            )}
            {tier === 'advanced' && (
              language === 'ar'
                ? 'مستوى متقدم مذهل! إطار مميز يثبت جدارتك.'
                : 'Amazing milestone! You unlocked the striking Advanced Rank frame.'
            )}
            {tier === 'starter' && (
              language === 'ar'
                ? 'بداية رائعة! إطار مميز يثبت جدارتك.'
                : 'Great start! Your first milestone badge is now active on your profile.'
            )}
          </div>

          {/* Action Button */}
          <PrimaryButton onClick={onClose} size="lg">
            {t('awesomeLetsPlay') || 'Awesome, Let’s Play!'}
          </PrimaryButton>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
