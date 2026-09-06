import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Mail, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { resetPassword } from '../../firebase/authService';

export const ForgotPasswordScreen: React.FC = () => {
  const { setAuthScreenState, t } = useApp();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError(t('enterValidEmailPrompt'));
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/invalid-email') {
        setError(t('enterValidEmailPrompt'));
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError(t('noAccountFoundEmail'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('tooManyRequests'));
      } else if (err.code === 'auth/network-request-failed') {
        setError(t('networkError'));
      } else {
        setError(err.message || t('failedSendResetEmail'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm mx-auto flex flex-col justify-between h-full py-2 select-none"
    >
      {/* Top Header & Back Button */}
      <div>
        <button
          onClick={() => setAuthScreenState('login')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#D5E5F7] text-[11px] font-mono text-[#000000] hover:bg-[#F0F6FF] transition-colors cursor-pointer"
          disabled={isLoading}
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
          <span>{t('backToLogin')}</span>
        </button>

        <div className="space-y-2 mt-4 text-center sm:text-left">
          <h2 className="text-xl font-semibold tracking-[0.15em] text-[#000000] uppercase font-mono">
            {t('recoverAccess')}
          </h2>
          <p className="text-xs text-[#4C5055] leading-relaxed">
            {t('recoverAccessSubtitle')}
          </p>
        </div>
      </div>

      {/* Main Content / Form */}
      <div className="my-auto py-6">
        {isSubmitted ? (
          <div className="p-6 rounded-[16px] bg-white border border-[#D5E5F7] space-y-4 text-center shadow-lg relative overflow-hidden text-[#000000]">
            <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={24} strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-semibold text-[#000000] uppercase tracking-wider">
                {t('inboxCheck')}
              </h3>
              <p className="text-xs text-[#4C5055] leading-relaxed px-2">
                {t('recoveryLinkSent')}
                <br />
                <span className="font-mono text-[#000000] font-semibold break-all">{email}</span>
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setAuthScreenState('login')}
                className="w-full py-3 rounded-[11px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-widest uppercase shadow-md transition-all cursor-pointer"
              >
                {t('returnToLogin')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-mono text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono tracking-widest text-[#4C5055] font-semibold uppercase">
                {t('email')}
              </label>
              <div className="relative flex items-center">
                <Mail size={15} strokeWidth={1.75} className="absolute left-3.5 text-[#4C5055]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[11px] bg-white border border-[#D5E5F7] focus:border-[#47A5FF] text-xs font-mono text-[#000000] placeholder-[#4C5055] outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-widest uppercase shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={15} strokeWidth={1.75} className="animate-spin" />
              ) : (
                <KeyRound size={15} strokeWidth={1.75} />
              )}
              <span>{isLoading ? t('sendingResetLink') : t('sendResetLink')}</span>
            </button>
          </form>
        )}
      </div>

      {/* Secondary Link */}
      <div className="pt-4 text-center border-t border-[#D5E5F7]">
        <button
          onClick={() => setAuthScreenState('login')}
          disabled={isLoading}
          className="text-xs font-mono text-[#4C5055] hover:text-[#000000] uppercase underline underline-offset-4 disabled:opacity-50 font-semibold cursor-pointer"
        >
          {t('rememberPasswordLogin')}
        </button>
      </div>
    </motion.div>
  );
};
