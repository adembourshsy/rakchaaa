import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus, Check } from 'lucide-react';
import { PRESET_AVATARS } from '../../services/cloudinaryService';

export const RegisterScreen: React.FC = () => {
  const { registerUser, setAuthScreenState, authStatus, guestVisitCount, t } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(() => PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].url);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(t('chooseUsernamePrompt'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t('enterValidEmailPrompt'));
      return;
    }
    if (!password || password.length < 6) {
      setError(t('passwordMin6'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    const success = await registerUser({
      username: username.trim(),
      email: email.trim(),
      password,
      avatarUrl: selectedAvatar,
    });
    setIsSubmitting(false);
    if (!success) {
      setError(t('emailAlreadyInUse'));
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

        <div className="space-y-1 mt-3 text-center sm:text-left">
          <h2 className="text-xl font-semibold tracking-[0.15em] text-[#000000] uppercase font-mono">
            {t('createAccount')}
          </h2>
          <p className="text-xs text-[#4C5055]">
            {t('registerSubtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-3 my-auto py-2">
        {error && (
          <div className="p-2.5 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* Optional Profile Picture Picker */}
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] font-mono tracking-widest text-[#4C5055] font-semibold uppercase flex items-center justify-between">
            <span>{t('profilePictureOptional')}</span>
            <span className="text-[9px] text-[#4C5055] font-medium">{t('selectAvatar')}</span>
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
            {PRESET_AVATARS.map((preset, idx) => (
              <button
                key={`reg-avatar-${preset.id || idx}-${idx}`}
                type="button"
                onClick={() => setSelectedAvatar(preset.url)}
                className={`relative rounded-full transition-all shrink-0 cursor-pointer ${
                  selectedAvatar === preset.url
                    ? 'ring-2 ring-[#47A5FF] scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={preset.name}
              >
                <img loading="lazy" decoding="async" src={preset.url}
                  alt={preset.name || `Avatar ${idx + 1}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {selectedAvatar === preset.url && (
                  <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#47A5FF] text-white">
                    <Check size={10} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-mono tracking-widest text-[#4C5055] font-semibold uppercase">
            {t('username')}
          </label>
          <div className="relative flex items-center">
            <User size={15} strokeWidth={1.75} className="absolute left-3.5 text-[#4C5055]" />
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="e.g. alex_hub"
              className="w-full pl-10 pr-4 py-2.5 rounded-[11px] bg-white border border-[#D5E5F7] focus:border-[#47A5FF] text-xs font-mono text-[#000000] placeholder-[#4C5055] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1 text-left">
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
              placeholder="alex@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-[11px] bg-white border border-[#D5E5F7] focus:border-[#47A5FF] text-xs font-mono text-[#000000] placeholder-[#4C5055] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-mono tracking-widest text-[#4C5055] font-semibold uppercase">
            {t('password')}
          </label>
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

        {/* Confirm Password */}
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-mono tracking-widest text-[#4C5055] font-semibold uppercase">
            {t('confirmPassword')}
          </label>
          <div className="relative flex items-center">
            <Lock size={15} strokeWidth={1.75} className="absolute left-3.5 text-[#4C5055]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-[11px] bg-white border border-[#D5E5F7] focus:border-[#47A5FF] text-xs font-mono text-[#000000] placeholder-[#4C5055] outline-none transition-colors"
            />
          </div>
        </div>

        {/* CREATE ACCOUNT Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-widest uppercase shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 mt-2 disabled:opacity-60 cursor-pointer"
        >
          <UserPlus size={15} strokeWidth={1.75} />
          <span>{isSubmitting ? t('creatingAccount') : t('createAccount')}</span>
        </button>
      </form>

      {/* Secondary Action Link */}
      <div className="pt-3 text-center border-t border-[#D5E5F7]">
        <p className="text-xs text-[#4C5055]">
          {t('alreadyHaveAccountPrompt')}{' '}
          <button
            onClick={() => setAuthScreenState('login')}
            className="font-mono text-[#47A5FF] font-semibold hover:underline underline-offset-4 uppercase cursor-pointer"
          >
            {t('login')}
          </button>
        </p>
      </div>
    </motion.div>
  );
};
