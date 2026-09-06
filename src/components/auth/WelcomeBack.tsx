import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { LogIn, UserPlus, ArrowRight, Lock, ShieldAlert } from 'lucide-react';

export const WelcomeBack: React.FC = () => {
  const { setAuthScreenState, t } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm mx-auto flex flex-col justify-between h-full py-4 text-center select-none"
    >
      {/* Header */}
      <div className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-white border border-[#D5E5F7] text-[10px] font-mono tracking-widest text-[#4C5055] uppercase font-semibold">
          <ShieldAlert size={12} strokeWidth={1.75} />
          <span>{t('authRequired')}</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[0.15em] text-[#000000] uppercase font-mono">
          {t('welcome')}
        </h1>
        <p className="text-xs text-[#4C5055] leading-relaxed max-w-xs mx-auto">
          {t('guestTrialCompleted')}
        </p>
      </div>

      {/* Main Notice Banner */}
      <div className="my-auto py-4 space-y-4">
        <div className="p-4 rounded-[16px] bg-white border border-[#D5E5F7] space-y-2 text-left shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#000000]">
            <Lock size={14} strokeWidth={1.75} className="text-[#4C5055]" />
            <span>{t('whySignIn')}</span>
          </div>
          <ul className="text-[11px] text-[#4C5055] space-y-1.5 list-disc list-inside font-normal">
            <li>{t('whySignInBenefit1')}</li>
            <li>{t('whySignInBenefit2')}</li>
            <li>{t('whySignInBenefit3')}</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          {/* LOG IN */}
          <button
            onClick={() => setAuthScreenState('login')}
            className="group w-full py-3.5 px-5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-between shadow-md active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <LogIn size={15} strokeWidth={1.75} />
              <span>{t('login')}</span>
            </div>
            <ArrowRight size={14} strokeWidth={1.75} className="group-hover:translate-x-1 transition-transform" />
          </button>

          {/* CREATE ACCOUNT */}
          <button
            onClick={() => setAuthScreenState('register')}
            className="w-full py-3.5 px-5 rounded-[11px] bg-white border border-[#D5E5F7] hover:border-[#47A5FF] text-[#000000] font-mono text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-between active:scale-98 shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <UserPlus size={15} strokeWidth={1.75} className="text-[#4C5055] group-hover:text-[#47A5FF]" />
              <span>{t('createAccount')}</span>
            </div>
            <ArrowRight size={14} strokeWidth={1.75} className="text-[#4C5055] group-hover:text-[#47A5FF] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
