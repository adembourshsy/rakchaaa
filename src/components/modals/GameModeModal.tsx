import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Heart, ShieldAlert, ArrowRight, AlertCircle } from 'lucide-react';
import { GameInfo, GameMode } from '../../types';
import { useApp } from '../../context/AppContext';
import { useBackDismissible } from '../../native/useBackDismissible';
import { PrimaryButton, SecondaryButton } from '../ui';
import { EntryCostSelector } from '../ui/EntryCostSelector';

interface GameModeModalProps {
  game: GameInfo | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
}

type ModalStep = 'mode' | 'age-confirm';

export const GameModeModal: React.FC<GameModeModalProps> = ({
  game,
  isOpen,
  onClose,
  isEditMode = false,
}) => {
  const { t, createRoom, updateRoomParameters, joinedRoom, language, setIsCoinsModalOpen } = useApp();
  const [step, setStep] = useState<ModalStep>('mode');
  const [entryCost, setEntryCost] = useState<number>(joinedRoom?.entryCost ?? 30);

  // Duplicate protection & loading states
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Android back button: step back, then close — never exit the app
  useBackDismissible(isOpen, () => {
    if (step === 'age-confirm') {
      setStep('mode');
      return;
    }
    setStep('mode');
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setCreateError(null);
    onClose();
  });

  if (!isOpen) return null;
  const activeGame = game || (joinedRoom ? { id: joinedRoom.gameId, title: joinedRoom.gameTitle, subtitle: 'Action Vérité', minPlayers: 2, maxPlayers: 20, estimatedTimeMinutes: 15 } : null);
  if (!activeGame) return null;

  const isActionVerite = activeGame ? (activeGame.id === 'mind-rally' || activeGame.id === 'action-verite') : false;
  const effectiveCost = isActionVerite ? 0 : entryCost;

  const handleClose = () => {
    setStep('mode');
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setCreateError(null);
    onClose();
  };

  const executeModeSelection = async (mode: GameMode) => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setCreateError(null);

    try {
      if (isEditMode && joinedRoom) {
        await updateRoomParameters({
          mode,
          isPrivate: true,
        });
      } else {
        await createRoom(activeGame.id, 20, true, mode, 'virtual', undefined, effectiveCost);
      }
      handleClose();
    } catch (err: any) {
      console.error('Error selecting mode/creating room:', err);
      setCreateError(
        err?.message ||
          (language === 'ar'
            ? 'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.'
            : 'Failed to apply game mode. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSelectMode = (mode: GameMode) => {
    if (mode === '18+') {
      setStep('age-confirm');
    } else {
      executeModeSelection(mode);
    }
  };

  const handleConfirm18 = () => {
    executeModeSelection('18+');
  };

  return (
    <AnimatePresence>
      <div key="game-mode-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs pb-[env(safe-area-inset-bottom)] select-none">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg rounded-t-[16px] sm:rounded-[16px] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] p-5 sm:p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] shadow-2xl space-y-5 max-h-[85dvh] overflow-y-auto text-[#000000] dark:text-[#F8FAFC]"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#D5E5F7] dark:border-[#1E273C] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#4C5055] dark:text-[#94A3B8] uppercase">
                  {activeGame.subtitle || 'ACTION VÉRITÉ'}
                </span>
                <span className="text-[9px] font-mono text-[#47A5FF] bg-[#F0F6FF] dark:bg-[#1E273C] px-2 py-0.5 rounded-[6px] border border-[#D5E5F7] dark:border-[#1E273C] font-medium uppercase">
                  {isEditMode ? (t('editMode') || 'Edit Mode') : (t('modeSetup') || 'Mode Setup')}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#000000] dark:text-[#F8FAFC] tracking-tight">
                {activeGame.title}
              </h3>
              <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] whitespace-nowrap">
                {activeGame.estimatedTimeMinutes}m • {activeGame.minPlayers || 2}-{activeGame.maxPlayers || 20} {t('players')}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-[8px] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {createError && (
            <div className="p-3.5 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-mono flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle size={16} strokeWidth={1.75} className="shrink-0" />
                <span className="leading-snug">{createError}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(createError.toLowerCase().includes('coin') || createError.includes('كوينز') || createError.toLowerCase().includes('solde')) && (
                  <button
                    type="button"
                    onClick={() => setIsCoinsModalOpen(true)}
                    className="px-2.5 py-1 rounded-[8px] bg-[#FF8F00] text-black font-bold text-[11px] uppercase hover:bg-[#FFA726] transition-colors cursor-pointer shadow-xs"
                  >
                    {t('getCoins')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCreateError(null)}
                  className="text-xs uppercase underline font-medium cursor-pointer"
                >
                  {t('dismiss') || 'Dismiss'}
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'mode' && (
              <motion.div
                key="mode-selection"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center sm:text-left">
                  <span className="text-[11px] font-mono tracking-widest text-[#4C5055] dark:text-[#94A3B8] uppercase font-medium">
                    {t('selectMode')}
                  </span>
                </div>

                {!isEditMode && (
                  isActionVerite ? (
                    <div className="flex items-center justify-between p-3.5 rounded-[12px] bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-xs font-mono">
                      <span className="font-bold uppercase tracking-wider">{t('freeGameZeroCoins') || 'Free Game • 0 Coins'}</span>
                      <span className="opacity-80 text-[11px]">{t('noCoinEntryFee') || 'No coin entry fee'}</span>
                    </div>
                  ) : (
                    <EntryCostSelector
                      selectedCost={entryCost}
                      onSelectCost={setEntryCost}
                      disabled={isSubmitting}
                    />
                  )
                )}

                {/* FRIENDS & FAMILY Side-by-Side Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* FRIENDS Mode */}
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleSelectMode('friends')}
                    className="group relative flex flex-col justify-between p-4 rounded-[16px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] hover:border-[#47A5FF] transition-all text-start space-y-3 active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-[10px] bg-white dark:bg-[#131A29] text-[#47A5FF] border border-[#D5E5F7] dark:border-[#222E46]">
                        <Users size={18} strokeWidth={1.75} />
                      </div>
                      <ArrowRight size={14} strokeWidth={1.75} className="text-[#4C5055] dark:text-[#94A3B8] group-hover:text-[#47A5FF] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#000000] dark:text-[#F8FAFC] group-hover:text-[#47A5FF] transition-colors">
                        {t('modeFriends')}
                      </h4>
                      <p className="text-[11px] text-[#4C5055] dark:text-[#94A3B8] mt-0.5 leading-snug">
                        {t('modeFriendsDesc')}
                      </p>
                    </div>
                  </button>

                  {/* FAMILY Mode */}
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleSelectMode('family')}
                    className="group relative flex flex-col justify-between p-4 rounded-[16px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] hover:border-[#47A5FF] transition-all text-start space-y-3 active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-[10px] bg-white dark:bg-[#131A29] text-[#47A5FF] border border-[#D5E5F7] dark:border-[#222E46]">
                        <Heart size={18} strokeWidth={1.75} />
                      </div>
                      <ArrowRight size={14} strokeWidth={1.75} className="text-[#4C5055] dark:text-[#94A3B8] group-hover:text-[#47A5FF] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#000000] dark:text-[#F8FAFC] group-hover:text-[#47A5FF] transition-colors">
                        {t('modeFamily')}
                      </h4>
                      <p className="text-[11px] text-[#4C5055] dark:text-[#94A3B8] mt-0.5 leading-snug">
                        {t('modeFamilyDesc')}
                      </p>
                    </div>
                  </button>
                </div>

                {/* 18+ Mode Below */}
                <button
                  disabled={isSubmitting}
                  onClick={() => handleSelectMode('18+')}
                  className="w-full group flex items-center justify-between p-4 rounded-[16px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] hover:border-[#EF4444] transition-all text-start active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-[10px] bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] font-mono text-xs font-medium">
                      18+
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#000000] dark:text-[#F8FAFC] group-hover:text-[#EF4444] transition-colors">
                        {t('mode18Plus')}
                      </h4>
                      <p className="text-[11px] text-[#4C5055] dark:text-[#94A3B8] mt-0.5">
                        {t('mode18PlusDesc')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} strokeWidth={1.75} className="text-[#4C5055] dark:text-[#94A3B8] group-hover:text-[#EF4444] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            )}

            {step === 'age-confirm' && (
              <motion.div
                key="age-confirm"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-center sm:text-left"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto sm:mx-0 rounded-[12px] bg-[#EF476F]/15 text-[#EF476F] flex items-center justify-center border border-[#EF476F]/30">
                    <ShieldAlert size={24} strokeWidth={1.75} />
                  </div>
                  <h4 className="text-base font-medium text-[#F5EFE6]">
                    {t('ageVerification') || '18+ Age Verification'}
                  </h4>
                  <p className="text-xs text-[#B8ABA0] leading-relaxed">
                    {language === 'ar'
                      ? 'هذا الوضع يحتوي على أسئلة وتحديات جريئة ومخصصة للبالغين. هل تؤكد أن عمرك 18 سنة أو أكثر؟'
                      : 'This mode contains mature themes, bold questions, and adult dares. Do you confirm you are 18 or older?'}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <SecondaryButton
                    className="flex-1"
                    onClick={() => setStep('mode')}
                    disabled={isSubmitting}
                  >
                    {t('back') || 'Back'}
                  </SecondaryButton>
                  <PrimaryButton
                    className="flex-1"
                    onClick={handleConfirm18}
                    isLoading={isSubmitting}
                  >
                    {t('confirmAndStart') || 'Confirm & Start'}
                  </PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
