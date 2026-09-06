import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useBackDismissible } from '../../native/useBackDismissible';

export interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  gameTag?: React.ReactNode;
  subtitle?: string;
  progressBar?: {
    currentStep: number;
    totalSteps: number;
  };
  errorMessage?: string | null;
  children: React.ReactNode;
  /** Optional fixed action area rendered below the scrollable body (e.g. a primary CTA
   * that must always stay visible). When provided, the modal becomes a flex column with
   * a shrink-0 header, a flex-1 scrollable body (children), and this shrink-0 footer. */
  footer?: React.ReactNode;
  maxWidthClassName?: string;
  dir?: 'rtl' | 'ltr';
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  title,
  gameTag,
  subtitle,
  progressBar,
  errorMessage,
  children,
  footer,
  maxWidthClassName = 'max-w-lg',
  dir,
}) => {
  const { setIsCoinsModalOpen, language, t } = useApp();

  // Android back button closes the setup sheet instead of exiting the app
  useBackDismissible(isOpen, onClose);
  const isCoinError = errorMessage
    ? errorMessage.toLowerCase().includes('coin') ||
      errorMessage.includes('كوينز') ||
      errorMessage.toLowerCase().includes('solde')
    : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="setup-modal-backdrop"
          dir={dir}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs select-none"
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`w-full ${maxWidthClassName} bg-white dark:bg-[#131A29] rounded-t-[20px] sm:rounded-[16px] border border-[#D5E5F7] dark:border-[#1E273C] shadow-2xl max-h-[85dvh] text-[#000000] dark:text-[#F8FAFC] ${
              footer ? 'flex flex-col overflow-hidden' : 'p-5 sm:p-6 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pl-[max(1.25rem,calc(env(safe-area-inset-left)+1rem))] pr-[max(1.25rem,calc(env(safe-area-inset-right)+1rem))] space-y-5 overflow-y-auto'
            }`}
          >
            {/* Header */}
            <div className={`space-y-3 pb-3 border-b border-[#D5E5F7] dark:border-[#1E273C] ${
              footer ? 'shrink-0 p-5 sm:p-6 pb-3 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] pl-[max(1.25rem,calc(env(safe-area-inset-left)+1rem))] pr-[max(1.25rem,calc(env(safe-area-inset-right)+1rem))]' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  {gameTag && (
                    <div className="flex items-center gap-2 mb-1">
                      {gameTag}
                    </div>
                  )}
                  <h3 className="text-base sm:text-lg font-semibold text-[#000000] dark:text-[#F8FAFC] tracking-tight">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] mt-0.5 font-normal">
                      {subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] transition-colors cursor-pointer"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              {/* Optional Progress Bar */}
              {progressBar && (
                <div className="w-full h-1.5 rounded-full bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] overflow-hidden">
                  <motion.div
                    className="h-full bg-[#47A5FF]"
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${(progressBar.currentStep / progressBar.totalSteps) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>

            {/* Error Message Box (non-footer modals only — footer modals render this inside their scroll body) */}
            {errorMessage && !footer && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex items-center justify-between gap-2.5 font-mono"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
                {isCoinError && (
                  <button
                    type="button"
                    onClick={() => setIsCoinsModalOpen(true)}
                    className="shrink-0 px-2.5 py-1 rounded-[8px] bg-[#FF8F00] text-black font-bold text-[11px] uppercase hover:bg-[#FFA726] transition-colors cursor-pointer shadow-xs"
                  >
                    {t('getCoins') || 'Get Coins'}
                  </button>
                )}
              </motion.div>
            )}

            {/* Modal Body */}
            {footer ? (
              <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 pt-4 space-y-5">
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex items-center justify-between gap-2.5 font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AlertCircle size={16} className="shrink-0" />
                      <span className="leading-snug">{errorMessage}</span>
                    </div>
                    {isCoinError && (
                      <button
                        type="button"
                        onClick={() => setIsCoinsModalOpen(true)}
                        className="shrink-0 px-2.5 py-1 rounded-[8px] bg-[#FF8F00] text-black font-bold text-[11px] uppercase hover:bg-[#FFA726] transition-colors cursor-pointer shadow-xs"
                      >
                        {t('getCoins') || 'Get Coins'}
                      </button>
                    )}
                  </motion.div>
                )}
                {children}
              </div>
            ) : (
              children
            )}

            {/* Fixed Footer (e.g. primary CTA that must always remain visible) */}
            {footer && (
              <div className="shrink-0 border-t border-[#D5E5F7] dark:border-[#1E273C] bg-white dark:bg-[#131A29] shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.25)] p-5 sm:p-6 pt-3.5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] pl-[max(1.25rem,calc(env(safe-area-inset-left)+1rem))] pr-[max(1.25rem,calc(env(safe-area-inset-right)+1rem))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
