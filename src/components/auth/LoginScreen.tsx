import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, LogIn } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginUser, setAuthScreenState, authStatus, guestVisitCount, t } = useApp();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser.trim()) {
      setError(t('enterEmailPrompt'));
      return;
    }
    if (!password) {
      setError(t('enterPasswordPrompt'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    const result = await loginUser(emailOrUser, password);
    setIsSubmitting(false);
    if (!result.success) {
      if (result.errorCode === 'auth/invalid-credential' || result.errorCode === 'auth/user-not-found' || result.errorCode === 'auth/wrong-password') {
        setError(t('invalidEmailOrPassword'));
      } else if (result.errorCode === 'auth/network-request-failed') {
        setError(t('networkError') || 'Erreur de connexion réseau. Veuillez vérifier votre connexion internet.');
      } else if (result.errorCode) {
        setError(`[${result.errorCode}] ${result.error || t('invalidEmailOrPassword')}`);
      } else {
        setError(result.error || t('invalidEmailOrPassword'));
      }
    }
  };

  const handleBack = () => {
    if (authStatus === 'guest' && guestVisitCount >= 2) {
      setAuthScreenState('welcome_back');
    } else {
      setAuthScreenState('access_menu');
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
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#D5E5F7] text-[11px] font-mono text-[#000000] hover:bg-[#F0F6FF] transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} strokeWidth={1.75} />
          <span>{t('back')}</span>
        </button>

        <div className="space-y-1.5 mt-4 text-center sm:text-left">
          <h2 className="text-xl font-semibold tracking-[0.15em] text-[#000000] uppercase font-mono">
            {t('login')}
          </h2>
          <p className="text-xs text-[#4C5055]">
            {t('loginSubtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4 my-auto py-4">
        {error && (
          <div className="p-3 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* Email or Username */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-mono tracking-widest text-[#4C5055] font-semibold uppercase">
            {t('email')}
          </label>
          <div className="relative flex items-center">
            <Mail size={15} strokeWidth={1.75} className="absolute left-3.5 text-[#4C5055]" />
            <input
              type="text"
              value={emailOrUser}
              onChange={(e) => {
                setEmailOrUser(e.target.value);
                setError('');
              }}
              placeholder="alex@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-[11px] bg-white border border-[#D5E5F7] focus:border-[#47A5FF] text-xs font-mono text-[#000000] placeholder-[#4C5055] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono tracking-widest text-[#4C5055] font-semibold uppercase">
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => setAuthScreenState('forgot_password')}
              className="text-[10px] font-mono text-[#4C5055] font-medium hover:text-[#000000] hover:underline underline-offset-2 cursor-pointer"
            >
              {t('forgotPasswordQuestion')}
            </button>
          </div>
          <div className="relative flex items-center">
            <Lock size={15} strokeWidth={1.75} className="absolute left-3.5 text-[#4C5055]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-[11px] bg-white border border-[#D5E5F7] focus:border-[#47A5FF] text-xs font-mono text-[#000000] placeholder-[#4C5055] outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-[#4C5055] hover:text-[#000000] cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* LOG IN Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-widest uppercase shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 mt-2 disabled:opacity-60 cursor-pointer"
        >
          <LogIn size={15} strokeWidth={1.75} />
          <span>{isSubmitting ? t('loggingIn') : t('login')}</span>
        </button>
      </form>

      {/* Secondary Action Link */}
      <div className="pt-4 text-center border-t border-[#D5E5F7]">
        <p className="text-xs text-[#4C5055]">
          {t('dontHaveAccount')}{' '}
          <button
            onClick={() => setAuthScreenState('register')}
            className="font-mono text-[#47A5FF] font-semibold hover:underline underline-offset-4 uppercase cursor-pointer"
          >
            {t('createAccount')}
          </button>
        </p>
      </div>
    </motion.div>
  );
};
