import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { AccessMenu } from './auth/AccessMenu';
import { WelcomeBack } from './auth/WelcomeBack';
import { LoginScreen } from './auth/LoginScreen';
import { RegisterScreen } from './auth/RegisterScreen';
import { ForgotPasswordScreen } from './auth/ForgotPasswordScreen';

export const FirstOpen: React.FC = () => {
  const { authScreenState, language, setLanguage } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#F0F6FF] text-[#000000] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-[max(2rem,env(safe-area-inset-top))] sm:pb-[max(2rem,env(safe-area-inset-bottom))] select-none transition-colors duration-300 overflow-y-auto"
    >
      <div className="w-full max-w-sm flex-1 flex flex-col justify-between my-auto">
        <AnimatePresence mode="wait">
          {authScreenState === 'access_menu' ? (
            <AccessMenu key="access_menu" />
          ) : authScreenState === 'welcome_back' ? (
            <WelcomeBack key="welcome_back" />
          ) : authScreenState === 'login' ? (
            <LoginScreen key="login_screen" />
          ) : authScreenState === 'register' ? (
            <RegisterScreen key="register_screen" />
          ) : authScreenState === 'forgot_password' ? (
            <ForgotPasswordScreen key="forgot_password_screen" />
          ) : (
            <AccessMenu key="access_menu_default" />
          )}
        </AnimatePresence>
      </div>

      {/* Language Switcher */}
      <div className="w-full max-w-sm mt-6 flex justify-center pb-2 shrink-0">
        <div className="flex items-center gap-4 px-5 py-2 rounded-full bg-white border border-[#D5E5F7] text-[11px] font-mono tracking-wide shadow-xs">
          <button
            onClick={() => setLanguage('en')}
            className={`transition-all cursor-pointer ${language === 'en' ? 'font-semibold text-[#47A5FF]' : 'text-[#4C5055] hover:text-[#000000]'}`}
          >
            English
          </button>
          <span className="text-[#D5E5F7]">•</span>
          <button
            onClick={() => setLanguage('fr')}
            className={`transition-all cursor-pointer ${language === 'fr' ? 'font-semibold text-[#47A5FF]' : 'text-[#4C5055] hover:text-[#000000]'}`}
          >
            Français
          </button>
          <span className="text-[#D5E5F7]">•</span>
          <button
            onClick={() => setLanguage('ar')}
            className={`transition-all cursor-pointer ${language === 'ar' ? 'font-semibold text-[#47A5FF]' : 'text-[#4C5055] hover:text-[#000000]'}`}
          >
            العربية
          </button>
        </div>
      </div>
    </motion.div>
  );
};
