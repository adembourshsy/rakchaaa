import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Globe,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Bell,
  HelpCircle,
  Info,
  User,
  LogOut,
  Volume2,
  ChevronRight,
  Lock,
  MessageSquare,
  FileText,
  UserPlus,
  Trash2,
  Vibrate,
  Gamepad2,
  UserCircle,
  Key,
  Mail,
  Check,
  X,
  Zap,
  Trophy,
  ExternalLink,
  BookOpen,
  Car,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';
import { auth } from '../../firebase/config';
import { changeUserPassword, changeUserEmail, isDesignatedAdminEmail } from '../../firebase/authService';
import { getAvatarUrl } from '../../data/mockData';
import { PrimaryButton, SecondaryButton } from '../ui';

export const SettingsView: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    setActiveView,
    t,
    isRTL,
    userProfile,
    updateProfile,
    isGuestSession,
    isAdminLoggedIn,
    logoutUser,
    soundEnabled,
    setSoundEnabled,
    hapticEnabled,
    setHapticEnabled,
    animationsEnabled,
    setAnimationsEnabled,
    notificationSettings,
    setNotificationSettings,
    batterySaver,
    setBatterySaver,
    joinedRoom,
    profileReturnView,
    closeViewedUserProfile,
  } = useApp();

  const currentUserEmail = (auth.currentUser?.email || userProfile?.email || '').toLowerCase().trim();

  const isUserAdmin =
    isDesignatedAdminEmail(currentUserEmail) ||
    userProfile.role === 'admin_action_verite' ||
    userProfile.role === 'admin_intrus' ||
    userProfile.role === 'admin' ||
    (isAdminLoggedIn && (isDesignatedAdminEmail(currentUserEmail) || !currentUserEmail));

  const isInProtectedSession =
    joinedRoom != null &&
    (joinedRoom.status === 'waiting' || joinedRoom.status === 'in_progress');

  const handleBackFromSettings = () => {
    if (profileReturnView) {
      closeViewedUserProfile();
    } else if (isInProtectedSession) {
      setActiveView(joinedRoom.status === 'in_progress' ? 'game' : 'waiting_room');
    } else {
      setActiveView('main');
    }
  };

  // Modals visibility states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Edit Profile form state
  const [editName, setEditName] = useState(userProfile.name);
  const [editUsername, setEditUsername] = useState(userProfile.username);
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Email form state
  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || '');
  const [emailAuthPassword, setEmailAuthPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const languages: { id: Language; label: string; nativeName: string }[] = [
    { id: 'en', label: t('lang_en'), nativeName: 'English' },
    { id: 'fr', label: t('lang_fr'), nativeName: 'Français' },
    { id: 'ar', label: t('lang_ar'), nativeName: 'العربية' },
  ];

  // Section Title Helper
  const SectionTitle = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <div className="flex items-center gap-2 mb-3 px-1 mt-6 first:mt-0">
      <Icon size={16} strokeWidth={1.75} className="text-[#FF8F00]" />
      <h3
        className={`text-[11px] font-mono text-[#4C5055] dark:text-[#94A3B8] uppercase font-bold tracking-wider ${
          isRTL ? '' : 'tracking-widest'
        }`}
      >
        {title}
      </h3>
    </div>
  );

  // Standard Action Row Helper
  const ActionRow = ({
    icon: Icon,
    title,
    subtitle,
    onClick,
    isDestructive = false,
    value,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    isDestructive?: boolean;
    value?: string;
  }) => {
    const isInteractive = !!onClick;
    const Component = isInteractive ? 'button' : 'div';

    return (
      <Component
        type={isInteractive ? 'button' : undefined}
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] border-b last:border-b-0 border-[#D5E5F7] dark:border-[#334155] text-left transition-colors ${
          isInteractive
            ? isDestructive
              ? 'hover:bg-[#EF4444]/10 cursor-pointer'
              : 'hover:bg-[#F0F6FF] dark:hover:bg-[#334155]/50 cursor-pointer'
            : ''
        }`}
      >
        <div className="flex items-center gap-3.5 pr-2">
          <div
            className={`p-2 rounded-[10px] ${
              isDestructive ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#F0F6FF] dark:bg-[#0F172A] text-[#47A5FF]'
            }`}
          >
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p
              className={`text-sm font-semibold leading-snug ${
                isDestructive ? 'text-[#EF4444]' : 'text-[#000000] dark:text-[#F8FAFC]'
              }`}
            >
              {title}
            </p>
            {subtitle && (
              <p className="text-[11px] text-[#4C5055] dark:text-[#94A3B8] mt-0.5 leading-snug font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {value && <span className="text-xs font-mono text-[#4C5055] dark:text-[#94A3B8]">{value}</span>}
          {isInteractive && (
            <ChevronRight
              size={16}
              strokeWidth={1.75}
              className={`${
                isDestructive ? 'text-[#EF4444]' : 'text-[#4C5055] dark:text-[#94A3B8]'
              } ${isRTL ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </Component>
    );
  };

  // Toggle Row Helper
  const ToggleRow = ({
    icon: Icon,
    title,
    subtitle,
    checked,
    onChange,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] border-b last:border-b-0 border-[#D5E5F7] dark:border-[#334155] text-left">
      <div className="flex items-center gap-3.5 pr-2">
        <div className="p-2 rounded-[10px] bg-[#F0F6FF] dark:bg-[#0F172A] text-[#47A5FF]">
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#000000] dark:text-[#F8FAFC] leading-snug">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-[#4C5055] dark:text-[#94A3B8] mt-0.5 leading-snug font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 cursor-pointer ${
          checked ? 'bg-[#47A5FF]' : 'bg-[#D5E5F7] dark:bg-[#334155]'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white dark:bg-[#F8FAFC] shadow-md transition-transform transform ${
            checked ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  // Save Profile Changes Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim() || userProfile.name,
      username: editUsername.trim() || userProfile.username,
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl.trim(),
    });
    setProfileSaveSuccess(true);
    setTimeout(() => {
      setProfileSaveSuccess(false);
      setIsEditProfileOpen(false);
    }, 1000);
  };

  // Change Password Handler
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (newPassword.length < 6) {
      setPassError(t('errPasswordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError(t('errPasswordMatch'));
      return;
    }

    setIsSubmittingPass(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPassSuccess(false);
        setIsChangePasswordOpen(false);
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || t('errPasswordFailed'));
    } finally {
      setIsSubmittingPass(false);
    }
  };

  // Change Email Handler
  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);

    if (!newEmail.includes('@')) {
      setEmailError(t('errValidEmail'));
      return;
    }

    setIsSubmittingEmail(true);
    try {
      await changeUserEmail(emailAuthPassword, newEmail);
      setEmailSuccess(true);
      setEmailAuthPassword('');
      setTimeout(() => {
        setEmailSuccess(false);
        setIsEmailModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setEmailError(err.message || t('errEmailFailed'));
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] pt-1 sm:pt-2 select-none text-left max-w-2xl mx-auto"
    >
      {isInProtectedSession && (
        <div className="flex items-center justify-between pb-3 px-1">
          <button
            onClick={handleBackFromSettings}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4C5055] hover:text-[#000000] transition-colors cursor-pointer min-h-[44px] px-2 touch-manipulation active:scale-95"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            <span>
              {joinedRoom.status === 'in_progress' ? 'Back to Game' : 'Back to Room'}
            </span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1 mb-6 px-1">
        <h2 className="text-2xl font-bold font-display text-[#000000] dark:text-[#F8FAFC] tracking-tight">
          Club <span className="text-[#FF8F00] italic">Settings</span>
        </h2>
        <p className="text-xs font-mono text-[#4C5055] dark:text-[#94A3B8] font-normal">
          {t('settingsSubtitle') || 'Customize sound, appearance, notifications, and security.'}
        </p>
      </div>

      <div className="space-y-6">
        {/* ================= 1. PROFILE ================= */}
        <section>
          <SectionTitle title={t('profile')} icon={User} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs">
            <ActionRow
              icon={UserCircle}
              title={t('editProfile')}
              subtitle={t('editProfileDesc')}
              onClick={() => {
                setEditName(userProfile.name);
                setEditUsername(userProfile.username);
                setEditBio(userProfile.bio || '');
                setEditAvatarUrl(userProfile.avatarUrl || '');
                setIsEditProfileOpen(true);
              }}
            />
            <ActionRow
              icon={Info}
              title={t('accountInfo')}
              subtitle={`${userProfile.username} • ${
                auth.currentUser?.email ||
                (isGuestSession ? t('guestAccount') : t('noEmailConnected'))
              }`}
              value={`${t('joined')} ${userProfile.joinedDate}`}
            />
            <ActionRow
              icon={Key}
              title={t('changePassword')}
              subtitle={isGuestSession ? t('unavailableGuest') : t('changePasswordDesc')}
              onClick={() => {
                if (isGuestSession) return;
                setPassError('');
                setIsChangePasswordOpen(true);
              }}
            />
            <ActionRow
              icon={Mail}
              title={t('emailAddress')}
              subtitle={
                auth.currentUser?.email
                  ? `${t('emailAddress')}: ${auth.currentUser.email}`
                  : t('emailAddressDesc')
              }
              onClick={() => {
                setEmailError('');
                setIsEmailModalOpen(true);
              }}
            />
          </div>
        </section>

        {/* ================= 2. ADMIN PORTAL (Only visible for authorized admin accounts) ================= */}
        {isUserAdmin && (
          <section>
            <SectionTitle title={t('administration') || 'Administration'} icon={ShieldCheck} />
            <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] bg-white shadow-xs">
              <ActionRow
                icon={ShieldCheck}
                title="Portail Administration Central"
                subtitle="Authentification instantanée & tableau de bord principal"
                onClick={() => setActiveView('admin')}
              />
              <ActionRow
                icon={Car}
                title="Admin Omour Mecanque"
                subtitle="Gérer la banque de voitures, fiches techniques et indices"
                onClick={() => setActiveView('admin_mecanque')}
              />
              <ActionRow
                icon={Layers}
                title="Admin L'Intrus"
                subtitle="Gérer les thèmes, sujets et mots d'intrintrus"
                onClick={() => setActiveView('admin_intrus')}
              />
            </div>
          </section>
        )}

        {/* ================= 3. LANGUAGE ================= */}
        <section>
          <SectionTitle title={t('language')} icon={Globe} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs bg-white p-4">
            <div className="grid grid-cols-3 gap-2">
              {languages.map((item, idx) => {
                const isSelected = language === item.id;
                return (
                  <button
                    key={`lang-${item.id}-${idx}`}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                    className={`p-3 rounded-[11px] border text-center transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                      isSelected
                        ? 'border-[#47A5FF] bg-[#F0F6FF] text-[#000000] font-bold shadow-xs'
                        : 'border-[#D5E5F7] bg-[#F4F8FC] text-[#4C5055] hover:bg-[#F0F6FF] hover:text-[#000000]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 text-[#47A5FF]">
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                    )}
                    <p className="text-sm font-semibold">{item.nativeName}</p>
                    <p className="text-[10px] opacity-75 mt-0.5 font-mono">{item.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= 4. APPEARANCE (With Color Preview Swatches) ================= */}
        <section>
          <SectionTitle title={t('appearance')} icon={Sun} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] dark:border-[#334155] shadow-xs bg-white dark:bg-[#1E293B] p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'system',
                  label: t('themeSystem') || 'System',
                  desc: 'Auto Detect',
                  icon: Monitor,
                  swatchBg: 'linear-gradient(135deg, #47A5FF 50%, #FF8F00 50%)',
                },
                {
                  id: 'light',
                  label: 'Sky Blue',
                  desc: 'Light',
                  icon: Sun,
                  swatchBg: 'linear-gradient(135deg, #FFFFFF 50%, #47A5FF 50%)',
                },
                {
                  id: 'dark',
                  label: 'Sunset Blue',
                  desc: 'Blue & Orange',
                  icon: Moon,
                  swatchBg: 'linear-gradient(135deg, #47A5FF 60%, #FF8F00 40%)',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={`theme-${item.id}-${idx}`}
                    type="button"
                    onClick={() => setTheme(item.id as any)}
                    className={`p-3 rounded-[12px] border text-center transition-all flex flex-col items-center justify-center gap-2 relative cursor-pointer ${
                      isSelected
                        ? 'border-[#47A5FF] bg-[#F0F6FF] dark:bg-[#0F172A] text-[#000000] dark:text-[#F8FAFC] font-bold shadow-xs'
                        : 'border-[#D5E5F7] dark:border-[#334155] bg-[#F4F8FC] dark:bg-[#0F172A]/50 text-[#4C5055] dark:text-[#94A3B8] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 text-[#47A5FF]">
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                    )}

                    {/* Color Preview Swatch */}
                    <div
                      className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-xs"
                      style={{ background: item.swatchBg }}
                    />

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold block">{item.label}</span>
                      <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] block">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= 5. GAME SETTINGS ================= */}
        <section>
          <SectionTitle title={t('gameSettings')} icon={Gamepad2} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs flex flex-col divide-y divide-[#D5E5F7]">
            <ToggleRow
              icon={Volume2}
              title={t('soundEffects')}
              subtitle={t('soundEffectsDesc')}
              checked={soundEnabled}
              onChange={setSoundEnabled}
            />
            <ToggleRow
              icon={Vibrate}
              title={t('vibration')}
              subtitle={t('vibrationDesc')}
              checked={hapticEnabled}
              onChange={setHapticEnabled}
            />
            <ToggleRow
              icon={Zap}
              title={t('gameAnimations')}
              subtitle={t('gameAnimationsDesc')}
              checked={animationsEnabled}
              onChange={setAnimationsEnabled}
            />
            <ToggleRow
              icon={ShieldCheck}
              title={t('batterySaver')}
              subtitle={t('batterySaverDesc')}
              checked={batterySaver}
              onChange={setBatterySaver}
            />
          </div>
        </section>

        {/* ================= 6. NOTIFICATIONS ================= */}
        <section>
          <SectionTitle title={t('notifications')} icon={Bell} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs flex flex-col divide-y divide-[#D5E5F7]">
            <ToggleRow
              icon={UserPlus}
              title={t('friendRequests')}
              subtitle={t('friendRequestsDesc')}
              checked={notificationSettings.master && notificationSettings.friendRequests}
              onChange={(val) =>
                setNotificationSettings((prev) => ({ ...prev, friendRequests: val }))
              }
            />
            <ToggleRow
              icon={Gamepad2}
              title={t('roomInvitations')}
              subtitle={t('roomInvitationsDesc')}
              checked={notificationSettings.master && notificationSettings.roomInvitations}
              onChange={(val) =>
                setNotificationSettings((prev) => ({ ...prev, roomInvitations: val }))
              }
            />
            <ToggleRow
              icon={Trophy}
              title={t('gameNotificationsLabel')}
              subtitle={t('gameNotificationsDesc')}
              checked={notificationSettings.master && notificationSettings.gameNotifications}
              onChange={(val) =>
                setNotificationSettings((prev) => ({ ...prev, gameNotifications: val }))
              }
            />
          </div>
        </section>

        {/* ================= 7. PRIVACY & DATA ================= */}
        <section>
          <SectionTitle title={t('privacy')} icon={ShieldCheck} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs">
            <ActionRow
              icon={ShieldCheck}
              title={t('privacy')}
              subtitle={t('privacyPolicyDesc')}
              onClick={() => setActiveView('settings_privacy')}
            />
            <ActionRow
              icon={Trash2}
              title={t('dataAccount')}
              subtitle={t('privacyPolicyDesc')}
              onClick={() => setActiveView('settings_privacy')}
            />
          </div>
        </section>

        {/* ================= 8. LEGAL & ABOUT ================= */}
        <section>
          <SectionTitle title={t('legal')} icon={FileText} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs">
            <ActionRow
              icon={ShieldCheck}
              title={t('privacyPolicyStr')}
              subtitle={t('privacyPolicyDesc')}
              onClick={() => setActiveView('settings_about')}
            />
            <ActionRow
              icon={FileText}
              title={t('termsOfService')}
              subtitle={t('termsOfServiceDesc')}
              onClick={() => setActiveView('settings_about')}
            />
            <ActionRow
              icon={BookOpen}
              title={t('communityGuidelines')}
              subtitle={t('communityGuidelinesDesc')}
              onClick={() => setActiveView('settings_about')}
            />
          </div>
        </section>

        {/* ================= 9. HELP & SUPPORT ================= */}
        <section>
          <SectionTitle title={t('help')} icon={HelpCircle} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs">
            <ActionRow
              icon={HelpCircle}
              title={t('helpCenter')}
              subtitle={t('helpCenterDesc')}
              onClick={() => setActiveView('settings_help')}
            />
            <ActionRow
              icon={ShieldCheck}
              title={t('reportProblem')}
              subtitle={t('reportProblemDesc')}
              onClick={() => setActiveView('settings_help')}
            />
            <ActionRow
              icon={MessageSquare}
              title={t('contactSupport')}
              subtitle={t('contactSupportDesc')}
              onClick={() => setActiveView('settings_help')}
            />
          </div>
        </section>

        {/* ================= 10. ABOUT ================= */}
        <section>
          <SectionTitle title={t('about')} icon={Info} />
          <div className="rounded-[16px] overflow-hidden border border-[#D5E5F7] shadow-xs bg-white p-4 space-y-3 text-[#000000]">
            <div>
              <p className="text-base font-bold text-[#000000]">RAKCHA GAME</p>
              <p className="text-xs text-[#4C5055] mt-0.5 font-normal">
                {t('aboutAppDesc') || 'Tunisian multiplayer social games lounge.'}
              </p>
            </div>
            <div className="pt-2 border-t border-[#D5E5F7] flex items-center justify-between text-xs font-mono">
              <span className="text-[#4C5055]">{t('appVersion')}</span>
              <span className="font-semibold text-[#FF8F00]">v1.2.0 • Belote Edition</span>
            </div>
            <div className="pt-2 border-t border-[#D5E5F7] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView('settings_about')}
                className="text-xs font-mono text-[#47A5FF] hover:text-[#3A92EE] font-semibold uppercase flex items-center gap-1 cursor-pointer"
              >
                <span>{t('viewLicenses')}</span>
                <ExternalLink size={12} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </section>

        {/* ================= 11. LOGOUT (Soft Danger Outlined Style to prevent accidental taps) ================= */}
        <section className="pt-2">
          <div className="rounded-[16px] overflow-hidden border border-[#EF4444]/30 bg-transparent shadow-xs hover:bg-[#EF4444]/5 transition-colors">
            <ActionRow
              icon={LogOut}
              title={t('logout')}
              subtitle={t('logoutDesc') || 'Sign out of your session on this device'}
              isDestructive
              onClick={() => setIsLogoutConfirmOpen(true)}
            />
          </div>
        </section>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div key="settings-edit-profile-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[16px] bg-white border border-[#D5E5F7] p-6 space-y-4 shadow-2xl text-[#000000]"
            >
              <div className="flex items-center justify-between border-b border-[#D5E5F7] pb-3">
                <div className="flex items-center gap-2">
                  <UserCircle size={18} strokeWidth={1.75} className="text-[#47A5FF]" />
                  <h3 className="text-base font-semibold text-[#000000]">{t('editProfile')}</h3>
                </div>
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className="p-1 rounded-full text-[#4C5055] hover:text-[#000000] cursor-pointer"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="text-center space-y-2">
                  <img loading="lazy" decoding="async" src={getAvatarUrl(editAvatarUrl)}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-[#47A5FF] bg-gray-100"
                  />
                  <div>
                    <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                      {t('avatarUrl')}
                    </label>
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] font-mono text-xs text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                    {t('displayName')}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your Name"
                    required
                    className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] text-sm text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                    {t('username')}
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="@username"
                    required
                    className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] font-mono text-sm text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                    {t('bioStatus')}
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder={t('bioPlaceholder')}
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] text-xs text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                  />
                </div>

                {profileSaveSuccess && (
                  <p className="text-xs font-mono text-[#10B981] text-center font-semibold">
                    {t('profileUpdatedSuccess')}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <SecondaryButton
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsEditProfileOpen(false)}
                  >
                    {t('cancel')}
                  </SecondaryButton>
                  <PrimaryButton type="submit" size="sm" className="flex-1">
                    {t('saveChanges')}
                  </PrimaryButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <div key="settings-change-password-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[16px] bg-white border border-[#D5E5F7] p-6 space-y-4 shadow-2xl text-[#000000]"
            >
              <div className="flex items-center justify-between border-b border-[#D5E5F7] pb-3">
                <div className="flex items-center gap-2">
                  <Key size={18} strokeWidth={1.75} className="text-[#47A5FF]" />
                  <h3 className="text-base font-semibold text-[#000000]">{t('changePassword')}</h3>
                </div>
                <button
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="p-1 rounded-full text-[#4C5055] hover:text-[#000000] cursor-pointer"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                    {t('currentPassword')}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] text-sm text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                    {t('newPassword')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] text-sm text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                    {t('confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] text-sm text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                  />
                </div>

                {passError && <p className="text-xs font-mono text-[#EF4444]">{passError}</p>}
                {passSuccess && (
                  <p className="text-xs font-mono text-[#10B981] font-semibold">
                    {t('passwordUpdatedSuccess')}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <SecondaryButton
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsChangePasswordOpen(false)}
                  >
                    {t('cancel')}
                  </SecondaryButton>
                  <PrimaryButton
                    type="submit"
                    size="sm"
                    className="flex-1"
                    isLoading={isSubmittingPass}
                    loadingText={t('updating')}
                  >
                    {t('changePassword')}
                  </PrimaryButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= EMAIL MODAL ================= */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div key="settings-change-email-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[16px] bg-white border border-[#D5E5F7] p-6 space-y-4 shadow-2xl text-[#000000]"
            >
              <div className="flex items-center justify-between border-b border-[#D5E5F7] pb-3">
                <div className="flex items-center gap-2">
                  <Mail size={18} strokeWidth={1.75} className="text-[#47A5FF]" />
                  <h3 className="text-base font-semibold text-[#000000]">{t('emailAddress')}</h3>
                </div>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="p-1 rounded-full text-[#4C5055] hover:text-[#000000] cursor-pointer"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleChangeEmailSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] text-sm text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                  />
                </div>

                {auth.currentUser?.email && (
                  <div>
                    <label className="text-[11px] font-mono text-[#4C5055] block mb-1">
                      {t('currentPasswordConfirm')}
                    </label>
                    <input
                      type="password"
                      value={emailAuthPassword}
                      onChange={(e) => setEmailAuthPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-[11px] bg-[#F4F8FC] border border-[#D5E5F7] text-sm text-[#000000] focus:outline-none focus:border-[#47A5FF]"
                    />
                  </div>
                )}

                {emailError && <p className="text-xs font-mono text-[#EF4444]">{emailError}</p>}
                {emailSuccess && (
                  <p className="text-xs font-mono text-[#10B981] font-semibold">
                    {t('emailUpdatedSuccess')}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <SecondaryButton
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsEmailModalOpen(false)}
                  >
                    {t('cancel')}
                  </SecondaryButton>
                  <PrimaryButton
                    type="submit"
                    size="sm"
                    className="flex-1"
                    isLoading={isSubmittingEmail}
                    loadingText={t('saving')}
                  >
                    {t('saveEmail')}
                  </PrimaryButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= LOGOUT CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div key="settings-logout-confirm-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[16px] bg-white border border-[#D5E5F7] p-6 space-y-4 shadow-2xl text-center text-[#000000]"
            >
              <div className="inline-flex p-3 rounded-full bg-[#EF4444]/15 text-[#EF4444] mx-auto border border-[#EF4444]/30">
                <LogOut size={24} strokeWidth={1.75} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#000000]">{t('logout')}</h3>
                <p className="text-xs text-[#4C5055] font-normal">
                  {t('logoutConfirmMsg') ||
                    'Are you sure you want to log out? You can sign back in anytime.'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <SecondaryButton
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                >
                  {t('cancel')}
                </SecondaryButton>
                <PrimaryButton
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setIsLogoutConfirmOpen(false);
                    logoutUser();
                  }}
                >
                  {t('logout')}
                </PrimaryButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
