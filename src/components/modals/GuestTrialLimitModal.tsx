import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { UserPlus, LogIn, Lock, X } from 'lucide-react';

export const GuestTrialLimitModal: React.FC = () => {
  const {
    isGuestTrialModalOpen,
    setIsGuestTrialModalOpen,
    setHasOpened,
    setAuthScreenState,
    language,
  } = useApp();

  if (!isGuestTrialModalOpen) return null;

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const title = isAr
    ? 'انتهت التجربة المجانية'
    : isFr
    ? 'Essai Invité Terminé'
    : 'Guest Trial Completed';

  const description = isAr
    ? 'لقد استهلكت مباراتك المجانية كزائر. أنشئ حسابًا مجانيًا أو سجل الدخول للعب بلا حدود مع أصدقائك!'
    : isFr
    ? 'Vous avez utilisé votre partie d\'essai gratuite. Créez un compte ou connectez-vous pour jouer en illimité !'
    : "You've played your 1 free Guest trial game! Create an account or sign in to continue playing unlimited matches with friends.";

  const handleRegister = () => {
    setIsGuestTrialModalOpen(false);
    setHasOpened(false);
    setAuthScreenState('register');
  };

  const handleLogin = () => {
    setIsGuestTrialModalOpen(false);
    setHasOpened(false);
    setAuthScreenState('login');
  };

  return (
    <AnimatePresence>
      <div key="guest-trial-limit-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <div
          className="absolute inset-0"
          onClick={() => setIsGuestTrialModalOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm rounded-[20px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] p-6 shadow-2xl space-y-5 text-center overflow-hidden"
        >
          {/* Top Close Button */}
          <button
            onClick={() => setIsGuestTrialModalOpen(false)}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#4C5055] hover:text-[#000000] dark:text-[#94A3B8] dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} strokeWidth={1.75} />
          </button>

          {/* Icon Badge */}
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#47A5FF]/10 text-[#47A5FF] flex items-center justify-center border border-[#47A5FF]/20 shadow-sm">
            <Lock size={26} strokeWidth={1.75} />
          </div>

          {/* Content */}
          <div className="space-y-2 pt-1">
            <h3 className="text-base font-bold text-[#000000] dark:text-white font-mono tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] leading-relaxed px-1">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              id="guest-limit-register-btn"
              type="button"
              onClick={handleRegister}
              className="w-full py-3.5 px-5 rounded-[12px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-xs font-semibold tracking-wider uppercase transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus size={16} strokeWidth={1.75} />
              <span>{isAr ? 'إنشاء حساب جديد' : isFr ? 'CRÉER UN COMPTE' : 'CREATE ACCOUNT'}</span>
            </button>

            <button
              id="guest-limit-login-btn"
              type="button"
              onClick={handleLogin}
              className="w-full py-3 px-5 rounded-[12px] bg-transparent border border-[#D5E5F7] dark:border-[#334155] hover:border-[#47A5FF] text-[#000000] dark:text-white font-mono text-xs font-semibold tracking-wider uppercase transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={16} strokeWidth={1.75} />
              <span>{isAr ? 'تسجيل الدخول' : isFr ? 'SE CONNECTER' : 'LOG IN'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
