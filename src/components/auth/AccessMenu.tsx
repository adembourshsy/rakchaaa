import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { User, LogIn, UserPlus, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { LammaHubLogo } from '../brand/LammaHubLogo';

export const AccessMenu: React.FC = () => {
  const { playAsGuest, guestTrialUsed, setAuthScreenState, t } = useApp();
  const [isEnteringGuestName, setIsEnteringGuestName] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGuestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = guestName.trim();
    if (!cleanName) {
      setGuestError(t('pleaseEnterDisplayName'));
      return;
    }
    if (cleanName.length < 2) {
      setGuestError(t('displayNameMin2'));
      return;
    }
    if (cleanName.length > 20) {
      setGuestError(t('displayNameMax20'));
      return;
    }

    setIsSubmitting(true);
    setGuestError(null);
    try {
      const res = await playAsGuest(cleanName);
      if (!res.success) {
        setGuestError(res.error || t('failedStartGuest'));
      }
    } catch (err: any) {
      setGuestError(err?.message || t('failedStartGuest'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm mx-auto flex flex-col justify-between h-full py-4 text-center select-none"
    >
      {/* Top Header Branding */}
      <div className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-white border border-[#D5E5F7] text-[10px] font-mono tracking-widest text-[#4C5055] uppercase font-semibold">
          <span>{guestTrialUsed ? t('accountAccess') : t('authentication')}</span>
        </div>

        <div className="flex justify-center py-2">
          <LammaHubLogo size="lg" />
        </div>
        <p className="text-xs text-[#4C5055] leading-relaxed max-w-xs mx-auto">
          {guestTrialUsed
            ? t('welcomeTaglineGuestUsed')
            : t('welcomeTagline')}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isEnteringGuestName ? (
          /* Guest Name Entry Card */
          <motion.div
            key="guest-name-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="my-auto py-4 px-1"
          >
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="p-4 rounded-[16px] bg-white border border-[#D5E5F7] text-left space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-[#000000]">
                  <User size={18} strokeWidth={1.75} />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    {t('chooseDisplayName')}
                  </span>
                </div>
                <p className="text-[11px] text-[#4C5055] leading-normal">
                  {t('chooseDisplayNameDesc')}
                </p>

                <div className="space-y-1 pt-1">
                  <input
                    type="text"
                    id="guest-display-name-input"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (guestError) setGuestError(null);
                    }}
                    placeholder="e.g. FoxRunner or Sam"
                    maxLength={20}
                    autoFocus
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] focus:border-[#47A5FF] text-sm text-[#000000] font-mono outline-none transition-all placeholder-[#4C5055]"
                  />
                  <div className="flex justify-between items-center px-1 text-[10px] text-[#4C5055]">
                    <span>{t('min2Chars')}</span>
                    <span>{guestName.length}/20</span>
                  </div>
                </div>

                {guestError && (
                  <div className="p-2.5 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex items-center gap-2">
                    <AlertCircle size={14} strokeWidth={1.75} className="shrink-0" />
                    <span>{guestError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  id="confirm-guest-login-btn"
                  disabled={isSubmitting || !guestName.trim()}
                  className="w-full py-3.5 px-6 rounded-[11px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-widest uppercase shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
                      <span>{t('startingSession')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('continueAsGuest')}</span>
                      <ArrowRight size={16} strokeWidth={1.75} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="cancel-guest-login-btn"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsEnteringGuestName(false);
                    setGuestError(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-[11px] text-[11px] font-mono text-[#4C5055] hover:text-[#000000] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} strokeWidth={1.75} />
                  <span>{t('backToOptions')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Main Auth Selection Options */
          <motion.div
            key="auth-options"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 my-auto py-6"
          >
            {/* CREATE ACCOUNT */}
            <button
              id="auth-create-account-btn"
              onClick={() => setAuthScreenState('register')}
              className="w-full py-3.5 px-5 rounded-[14px] bg-white border border-[#D5E5F7] hover:border-[#47A5FF] text-[#000000] font-mono text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-between active:scale-98 shadow-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus size={16} strokeWidth={1.75} className="text-[#4C5055] group-hover:text-[#47A5FF]" />
                <span>{t('createAccount')}</span>
              </div>
              <ArrowRight size={14} strokeWidth={1.75} className="text-[#4C5055] group-hover:text-[#47A5FF] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* LOG IN */}
            <button
              id="auth-login-btn"
              onClick={() => setAuthScreenState('login')}
              className="w-full py-3.5 px-5 rounded-[14px] bg-white border border-[#D5E5F7] hover:border-[#47A5FF] text-[#000000] font-mono text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-between active:scale-98 shadow-xs cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <LogIn size={16} strokeWidth={1.75} className="text-[#4C5055] group-hover:text-[#47A5FF]" />
                <span>{t('login')}</span>
              </div>
              <ArrowRight size={14} strokeWidth={1.75} className="text-[#4C5055] group-hover:text-[#47A5FF] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* CONTINUE AS GUEST - ONLY SHOWN IF GUEST TRIAL IS NOT USED */}
            {!guestTrialUsed && (
              <>
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#D5E5F7]" />
                  </div>
                  <span className="relative px-3 bg-[#F0F6FF] text-[10px] font-mono text-[#4C5055] uppercase tracking-widest font-semibold">
                    {t('orInstantPlay')}
                  </span>
                </div>

                <button
                  id="auth-continue-as-guest-btn"
                  onClick={() => setIsEnteringGuestName(true)}
                  className="group w-full py-3.5 px-5 rounded-[14px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-widest uppercase shadow-md transition-all flex items-center justify-between active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-[8px] bg-white/20 text-inherit">
                      <User size={16} strokeWidth={1.75} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold tracking-wider">
                        {t('continueAsGuest')}
                      </div>
                      <div className="text-[10px] opacity-90 font-normal lowercase tracking-normal">
                        {t('guestTrialSubtext')}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} strokeWidth={1.75} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
