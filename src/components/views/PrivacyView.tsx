import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Shield,
  Eye,
  Users,
  UserX,
  Lock,
  Download,
  Trash2,
  Check,
  Search,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReauthRequiredError } from '../../firebase/authService';
import { Section, SimpleModal } from '../ui';

export const PrivacyView: React.FC = () => {
  const {
    setActiveView,
    userProfile,
    t,
    blockedUsers,
    unblockUserAction,
    deleteAccountAction,
    onlineStatus,
    setOnlineStatus,
    friendRequestsPermission,
    setFriendRequestsPermission,
    profileVisibility,
    setProfileVisibility,
    avatarVisibility,
    setAvatarVisibility,
    friendsListVisibility,
    setFriendsListVisibility,
    roomInvitesPermission,
    setRoomInvitesPermission,
    interactionPermission,
    setInteractionPermission,
    downloadUserData,
  } = useApp();

  // Blocked Users management
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockSearchInput, setBlockSearchInput] = useState('');

  // Delete Account Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isAccountDeleted, setIsAccountDeleted] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data Download
  const [isDataDownloadSuccess, setIsDataDownloadSuccess] = useState(false);

  const handleUnblock = (id: string) => {
    unblockUserAction(id).catch((err) => console.warn('[rakcha] unblock failed:', err));
  };

  const handleDownloadData = () => {
    downloadUserData();
    setIsDataDownloadSuccess(true);
    setTimeout(() => setIsDataDownloadSuccess(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccountAction(deletePassword || undefined);
      setIsAccountDeleted(true);
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setActiveView('main');
      }, 1000);
    } catch (err: any) {
      if (err instanceof ReauthRequiredError) {
        setReauthRequired(true);
      } else {
        setDeleteError(err?.message || 'Deletion failed');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Option Selector Pill Render Helper
  const renderOptionPills = <T extends string>(
    options: { value: T; label: string }[],
    currentValue: T,
    onChange: (val: T) => void
  ) => (
    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 dark:border-[#B8B5A5]/10">
      {options.map((opt, idx) => {
        const isSelected = currentValue === opt.value;
        return (
          <button
            key={`priv-opt-${String(opt.value)}-${idx}`}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-medium transition-all ${
              isSelected
                ? 'bg-[#FF8600] text-white shadow-xs font-bold'
                : 'text-[#040403]/70 dark:text-[#F8F7E8]/70 hover:text-[#040403] dark:hover:text-[#F8F7E8]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-28 pt-2 text-left"
    >
      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#989277]/30 dark:border-[#B8B5A5]/20">
        <button
          onClick={() => setActiveView('settings')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#040403]/5 dark:bg-[#F8F7E8]/5 text-xs font-mono text-[#989277] dark:text-[#B8B5A5] hover:text-[#040403] dark:hover:text-[#F8F7E8] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{t('settings')}</span>
        </button>

        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[#FF8600]" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-[#040403] dark:text-[#F8F7E8] uppercase">
            {t('privacy')}
          </h2>
        </div>

        <div className="w-16" /> {/* Balance spacer */}
      </div>

      {/* 1. PROFILE VISIBILITY */}
      <Section icon={<Eye size={14} />} title={t('profileVisibility')} spacing="space-y-4">
        {/* Who can see my profile */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8]">
              {t('whoCanSeeProfile')}
            </span>
          </div>
          {renderOptionPills(
            [
              { value: 'everyone', label: t('allPlayers') },
              { value: 'friends', label: t('friendsOnly') },
              { value: 'nobody', label: t('nobody') },
            ],
            profileVisibility,
            setProfileVisibility
          )}
        </div>

        {/* Who can see profile photo */}
        <div className="space-y-1.5 pt-2 border-t border-[#989277]/15 dark:border-[#B8B5A5]/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8]">
              {t('whoCanSeeAvatar')}
            </span>
          </div>
          {renderOptionPills(
            [
              { value: 'everyone', label: t('allPlayers') },
              { value: 'friends', label: t('friendsOnly') },
              { value: 'nobody', label: t('nobody') },
            ],
            avatarVisibility,
            setAvatarVisibility
          )}
        </div>

        {/* Who can see friends list */}
        <div className="space-y-1.5 pt-2 border-t border-[#989277]/15 dark:border-[#B8B5A5]/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8]">
              {t('whoCanSeeFriends')}
            </span>
          </div>
          {renderOptionPills(
            [
              { value: 'everyone', label: t('allPlayers') },
              { value: 'friends', label: t('friendsOnly') },
              { value: 'nobody', label: t('nobody') },
            ],
            friendsListVisibility,
            setFriendsListVisibility
          )}
        </div>

        {/* Online Status Toggle Switch */}
        <div className="flex items-center justify-between pt-2 border-t border-[#989277]/15 dark:border-[#B8B5A5]/10">
          <div>
            <span className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8] block">
              {t('onlineStatus')}
            </span>
            <span className="text-[10px] text-[#989277] dark:text-[#B8B5A5] block">
              {t('onlineStatusDesc')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOnlineStatus(!onlineStatus)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              onlineStatus ? 'bg-[#FF8600]' : 'bg-[#040403]/20 dark:bg-[#F8F7E8]/20'
            }`}
          >
            <motion.div
              animate={{ x: onlineStatus ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-5 h-5 rounded-full bg-white shadow-xs"
            />
          </button>
        </div>
      </Section>

      {/* 2. FRIENDS & ROOMS */}
      <Section icon={<Users size={14} />} title={t('friendsRooms')} spacing="space-y-4">
        {/* Friend Requests */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8] block">
            {t('whoCanSendFriendRequests')}
          </span>
          {renderOptionPills(
            [
              { value: 'everyone', label: t('everyone') },
              { value: 'friends_of_friends', label: t('friendsOfFriends') },
              { value: 'nobody', label: t('nobody') },
            ],
            friendRequestsPermission,
            setFriendRequestsPermission
          )}
        </div>

        {/* Room Invites */}
        <div className="space-y-1.5 pt-2 border-t border-[#989277]/15 dark:border-[#B8B5A5]/10">
          <span className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8] block">
            {t('whoCanInviteRoom')}
          </span>
          {renderOptionPills(
            [
              { value: 'everyone', label: t('everyone') },
              { value: 'friends', label: t('friendsOnly') },
              { value: 'nobody', label: t('nobody') },
            ],
            roomInvitesPermission,
            setRoomInvitesPermission
          )}
        </div>

        {/* Interaction Permission */}
        <div className="space-y-1.5 pt-2 border-t border-[#989277]/15 dark:border-[#B8B5A5]/10">
          <span className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8] block">
            {t('directInteractions')}
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 dark:border-[#B8B5A5]/10">
            {[
              { value: 'everyone', label: t('allPlayers') },
              { value: 'friends', label: t('friendsOnly') },
            ].map((opt, idx) => (
              <button
                key={`interaction-opt-${opt.value}-${idx}`}
                type="button"
                onClick={() => setInteractionPermission(opt.value as any)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-medium transition-all ${
                  interactionPermission === opt.value
                    ? 'bg-[#FF8600] text-white font-bold shadow-xs'
                    : 'text-[#040403]/70 dark:text-[#F8F7E8]/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-[#989277] dark:text-[#B8B5A5] block pl-1">
            {t('interactionsDesc')}
          </span>
        </div>
      </Section>

      {/* 3. SAFETY & BLOCKED USERS */}
      <Section icon={<UserX size={14} />} title={t('safetyBlocked')}>
        <div className="p-3.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 dark:border-[#B8B5A5]/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
              {t('blockedUsersTitle')} ({blockedUsers.length})
            </p>
            <p className="text-[10px] text-[#989277] dark:text-[#B8B5A5]">
              {t('blockedUsersDesc')}
            </p>
          </div>

          <button
            onClick={() => setIsBlockedModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#040403] dark:bg-[#F8F7E8] text-white dark:text-[#11110F] text-[10px] font-mono font-bold uppercase hover:opacity-90 transition-opacity"
          >
            {t('manage')}
          </button>
        </div>
      </Section>

      {/* 4. DATA & ACCOUNT */}
      <Section icon={<Lock size={14} />} title={t('dataAccount')} spacing="space-y-4">
        {/* Download Data */}
        <div className="flex items-center justify-between pb-3 border-b border-[#989277]/15 dark:border-[#B8B5A5]/10">
          <div>
            <p className="text-xs font-medium text-[#040403] dark:text-[#F8F7E8]">
              {t('downloadData')}
            </p>
            <p className="text-[10px] text-[#989277] dark:text-[#B8B5A5]">
              {t('downloadDataDesc')}
            </p>
          </div>

          <button
            onClick={handleDownloadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#989277]/30 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] hover:border-[#FF8600] transition-colors"
          >
            <Download size={13} />
            <span>{t('export')}</span>
          </button>
        </div>

        {isDataDownloadSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2"
          >
            <Check size={14} />
            <span>{t('dataDownloadedSuccess')}</span>
          </motion.div>
        )}

        {/* Separated Delete Account Section */}
        <div className="pt-2">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-mono text-xs font-bold uppercase">
              <AlertTriangle size={15} />
              <span>{t('dangerZone')}</span>
            </div>

            <p className="text-xs text-[#040403]/80 dark:text-[#F8F7E8]/80 leading-relaxed">
              {t('deleteAccountLongDesc')}
            </p>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Trash2 size={14} />
              <span>{t('deleteMyAccount')}</span>
            </button>
          </div>
        </div>
      </Section>

      {/* ================= BLOCKED USERS MANAGEMENT MODAL ================= */}
      <SimpleModal isOpen={isBlockedModalOpen}>
        <div className="flex items-center justify-between pb-3 border-b border-[#989277]/20 dark:border-[#B8B5A5]/15">
          <div className="flex items-center gap-2">
            <UserX size={16} className="text-[#FF8600]" />
            <h3 className="text-sm font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
              {t('blockedUsersTitle')}
            </h3>
          </div>

          <button
            onClick={() => setIsBlockedModalOpen(false)}
            className="p-1 rounded-full text-[#989277] hover:text-[#040403] dark:hover:text-[#F8F7E8]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search to block user */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#989277]" />
          <input
            type="text"
            placeholder={t('searchBlockedUsers')}
            value={blockSearchInput}
            onChange={(e) => setBlockSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 dark:border-[#B8B5A5]/20 text-xs font-mono text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
          />
        </div>

        {/* Blocked Users List */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {blockedUsers.length === 0 ? (
            <p className="text-xs font-mono text-[#989277] text-center py-6">
              {t('noBlockedPlayers')}
            </p>
          ) : (
            blockedUsers.map((user, idx) => (
              <div
                key={`blocked-user-${user.uid}-${idx}`}
                className="p-3 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/20 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-mono font-bold text-[#040403] dark:text-[#F8F7E8]">
                    {user.username.replace('@', '')}
                  </p>
                  <p className="text-[10px] text-[#989277]">{user.username}</p>
                </div>

                <button
                  onClick={() => handleUnblock(user.uid)}
                  className="px-3 py-1 rounded-lg border border-[#989277]/30 hover:border-[#FF8600] text-[10px] font-mono font-bold uppercase text-[#040403] dark:text-[#F8F7E8] transition-colors"
                >
                  {t('unblock')}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => setIsBlockedModalOpen(false)}
          className="w-full py-2.5 rounded-full bg-[#FF8600] text-white text-xs font-mono font-bold uppercase tracking-wider"
        >
          {t('close')}
        </button>
      </SimpleModal>

      {/* ================= DELETE ACCOUNT CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div key="privacy-delete-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-[#040403]/60 backdrop-blur-sm p-4 text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#FFFFFF] dark:bg-[#1B1B18] border border-red-500/40 p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="inline-flex p-3 rounded-full bg-red-500/15 text-red-500 mx-auto">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-mono font-bold text-[#040403] dark:text-[#F8F7E8] uppercase">
                  {t('confirmDeletion')}
                </h3>
                <p className="text-xs text-[#989277] leading-relaxed">
                  {t('irreversibleAction').replace('{text}', t('deleteConfirmKeyword'))}
                </p>
              </div>

              {reauthRequired && !userProfile.isGuest && (
                <div className="space-y-2">
                  <p className="text-[10px] text-red-500 font-mono italic">
                    {t('enterPasswordConfirm')}
                  </p>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-[#989277]/30 font-mono text-xs text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-[#FF8600]"
                  />
                </div>
              )}

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t('typeDeleteToConfirm').replace('{text}', t('deleteConfirmKeyword')).replace(':', '')}
                className="w-full text-center px-4 py-2.5 rounded-xl bg-[#040403]/5 dark:bg-[#F8F7E8]/5 border border-red-500/30 font-mono text-xs text-[#040403] dark:text-[#F8F7E8] focus:outline-none focus:border-red-500 uppercase"
              />

              {deleteError && (
                <p className="text-[10px] text-red-500 font-mono italic">
                  {deleteError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={isDeleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmText('');
                    setDeletePassword('');
                    setReauthRequired(false);
                    setDeleteError(null);
                  }}
                  className="flex-1 py-2.5 rounded-full border border-[#989277]/30 text-xs font-mono uppercase text-[#040403] dark:text-[#F8F7E8] disabled:opacity-50"
                >
                  {t('cancel')}
                </button>

                <button
                  disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== t('deleteConfirmKeyword').toUpperCase()}
                  onClick={handleDeleteAccount}
                  className={`flex-1 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    deleteConfirmText.trim().toUpperCase() === t('deleteConfirmKeyword').toUpperCase()
                      ? 'bg-red-600 text-white shadow-md active:scale-95'
                      : 'bg-red-500/20 text-red-500/50 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {isDeleting ? t('deleting') : t('confirm')}
                </button>
              </div>

              {isAccountDeleted && (
                <div className="p-3 rounded-xl bg-red-500/20 text-red-500 text-xs font-mono font-bold">
                  {t('deleteAccountSuccess')}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
