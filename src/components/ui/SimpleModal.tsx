import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SimpleModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  /** Tailwind max-width class for the card (default: max-w-md). */
  maxWidthClassName?: string;
  /** Extra classes appended to the backdrop wrapper (e.g. 'overflow-y-auto'). */
  backdropClassName?: string;
  /** Extra classes appended to the card. */
  cardClassName?: string;
  initialScale?: number;
}

/**
 * The centered overlay + card wrapper repeated across AboutView,
 * HelpView, PrivacyView and AdminView for simple info/confirm modals.
 */
export const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  children,
  maxWidthClassName = 'max-w-md',
  backdropClassName = '',
  cardClassName = '',
  initialScale = 0.9,
}) => (
  <AnimatePresence>
    {isOpen && (
      <div
        key="simple-modal-backdrop"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left ${backdropClassName}`}
      >
        <motion.div
          initial={{ scale: initialScale, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: initialScale, opacity: 0 }}
          className={`w-full ${maxWidthClassName} rounded-[16px] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] p-6 space-y-4 shadow-2xl text-[#000000] dark:text-[#F8FAFC] ${cardClassName}`}
        >
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
