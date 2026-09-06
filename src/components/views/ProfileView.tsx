import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Award,
  Flame,
  Trophy,
  ChevronRight,
  ArrowLeft,
  Camera,
  Trash2,
  X,
  Upload,
  Pencil,
  UserPlus,
  Check,
  Swords,
  Play,
  Lock,
  ShieldAlert,
  Coins,
  ShoppingBag,
  Smile,
  Volume2,
  Crown,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_AVATAR, getAvatarUrl } from '../../data/mockData';
import { CreateRoomModal } from '../modals/CreateRoomModal';
import { PlayerAvatarBadge } from '../ui/PlayerAvatarBadge';
import { FREE_EMOJIS, SHOP_EMOJIS } from '../../data/emojis';
import { AVATAR_FRAMES, getAvatarFrameById } from '../../data/avatarFrames';
import { AvatarFrameRing } from '../ui/AvatarFrameRing';
import { emojiSoundService } from '../../services/emojiSoundService';
import { uploadToCloudinary, PRESET_AVATARS } from '../../services/cloudinaryService';

const InstagramIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    updateProfile,
    friends,
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    setActiveView,
    setActiveTab,
    isGuestSession,
    logoutUser,
    viewedUserProfile,
    closeViewedUserProfile,
    profileReturnView,
    joinedRoom,
    inviteFriendToRoom,
    setIsEmojiShopOpen,
    unlockedEmojis,
    setIsFrameShopOpen,
    unlockedFrames,
    equippedFrame,
    equipAvatarFrame,
    language,
    t,
  } = useApp();

  const isOwnProfile =
    !viewedUserProfile || viewedUserProfile.id === userProfile.id || viewedUserProfile.id === 'usr-me';
  const profile = isOwnProfile ? userProfile : viewedUserProfile;

  const viewedId = profile.id;
  const isAlreadyFriend = friends.some((f) => f.id === viewedId || f.username === profile.username);
  const sentRequest = friendRequests.some(
    (r) => r.senderId === userProfile.id && r.recipientId === viewedId && r.status === 'pending'
  );
  const receivedRequest = friendRequests.find(
    (r) => r.senderId === viewedId && r.recipientId === userProfile.id && r.status === 'pending'
  );

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  // Instagram editing states
  const [isEditingInstagram, setIsEditingInstagram] = useState(false);
  const [instagramInput, setInstagramInput] = useState(profile.instagramUrl || '');
  const [instagramError, setInstagramError] = useState('');
  const [actionSuccessText, setActionSuccessText] = useState('');
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatar = getAvatarUrl(profile.avatarUrl, profile.username || profile.name);
  const isUsingDefault = currentAvatar === DEFAULT_AVATAR;

  const validateInstagramUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return true;
    const regex = /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/;
    return regex.test(trimmed);
  };

  const handleSaveInstagram = () => {
    const trimmed = instagramInput.trim();
    if (!trimmed) {
      updateProfile({ instagramUrl: '' });
      setIsEditingInstagram(false);
      setInstagramError('');
      return;
    }
    if (!validateInstagramUrl(trimmed)) {
      setInstagramError('Please enter a valid Instagram profile URL (e.g., https://www.instagram.com/username/)');
      return;
    }
    let formatted = trimmed;
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    updateProfile({ instagramUrl: formatted });
    setIsEditingInstagram(false);
    setInstagramError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      try {
        const url = await uploadToCloudinary(file);
        updateProfile({ avatarUrl: url });
        setShowPhotoModal(false);
      } catch (err) {
        console.warn('Cloudinary upload error, using local fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            updateProfile({ avatarUrl: reader.result });
            setShowPhotoModal(false);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleSelectPresetAvatar = (url: string) => {
    updateProfile({ avatarUrl: url });
    setShowPhotoModal(false);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      updateProfile({ avatarUrl: urlInput.trim() });
      setUrlInput('');
      setShowPhotoModal(false);
    }
  };

  const handleRemovePhoto = () => {
    updateProfile({ avatarUrl: '' });
    setShowPhotoModal(false);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
      setIsEditingName(false);
    }
  };

  const handleCancelName = () => {
    setNameInput(profile.name);
    setIsEditingName(false);
  };

  // Achievements Definition with dynamic unlocked state
  const achievements = [
    {
      id: 'first_win',
      title: 'First Blood',
      desc: 'Win your first multiplayer match',
      unlocked: (profile.wins ?? 0) >= 1 || (profile.gamesPlayed ?? 0) >= 1,
      icon: Trophy,
    },
    {
      id: 'mastermind',
      title: 'Royal Mastermind',
      desc: 'Win 5+ card games or tournaments',
      unlocked: (profile.wins ?? 0) >= 5,
      icon: Award,
    },
    {
      id: 'high_roller',
      title: 'High Roller',
      desc: 'Accumulate over 500 gold coins',
      unlocked: (profile.coins ?? 0) >= 500,
      icon: Coins,
    },
    {
      id: 'streak_king',
      title: 'Streak King',
      desc: 'Achieve a 3+ game winning streak',
      unlocked: (profile.currentStreak ?? 0) >= 3,
      icon: Flame,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] pt-1 sm:pt-2 select-none"
    >
      {/* Top Header Back Navigation */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={closeViewedUserProfile}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer min-h-[44px] px-2"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          <span>
            {profileReturnView === 'waiting_room' || (joinedRoom && !isOwnProfile)
              ? 'Back to Room'
              : profileReturnView === 'friends'
              ? 'Back to Friends'
              : profileReturnView === 'game'
              ? 'Back to Game'
              : 'Back'}
          </span>
        </button>
        <span className="text-xs font-mono font-bold tracking-widest text-[#FF8F00] uppercase">
          {isOwnProfile ? t('profile') : `${profile.name}'s Profile`}
        </span>
      </div>

      {/* Main Identity Banner */}
      <div className="text-center space-y-3 p-6 rounded-[20px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] shadow-md relative overflow-hidden text-[#000000] dark:text-[#F8FAFC]">
        <div className="relative inline-block group my-1">
          <PlayerAvatarBadge
            avatarUrl={currentAvatar}
            name={profile.name}
            wins={profile.wins ?? 0}
            size="xl"
            equippedFrame={profile.equippedFrame || (isOwnProfile ? equippedFrame : 'default')}
            rankPosition={isOwnProfile ? 'left' : 'right'}
          />

          {/* Upload/Change Photo Button Badge (Only for own profile) */}
          {isOwnProfile && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#F0F6FF] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-[#47A5FF] hover:bg-[#47A5FF] hover:text-white transition-all cursor-pointer z-10 shadow-xs"
              title="Change Profile Photo"
            >
              <Camera size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <div>
          {isOwnProfile && isEditingName ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xs mx-auto mt-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter display name"
                className="w-full px-3 py-1.5 text-center text-sm font-semibold rounded-[11px] bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-[#000000] dark:text-[#F8FAFC] focus:outline-none focus:border-[#47A5FF]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelName();
                }}
              />
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
                <button
                  onClick={handleSaveName}
                  className="px-3.5 py-1.5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white font-mono text-[10px] font-bold uppercase transition-transform active:scale-95 cursor-pointer shadow-xs"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelName}
                  className="px-3.5 py-1.5 rounded-[11px] bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-[#4C5055] dark:text-[#94A3B8] font-mono text-[10px] font-medium uppercase transition-transform active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold font-display text-[#000000] dark:text-[#F8FAFC]">{profile.name}</h2>
              {isOwnProfile && (
                <button
                  onClick={() => {
                    setNameInput(profile.name);
                    setIsEditingName(true);
                  }}
                  className="p-1 rounded-[8px] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#47A5FF] transition-colors cursor-pointer"
                  title="Edit Name"
                >
                  <Pencil size={14} strokeWidth={1.75} />
                </button>
              )}
            </div>
          )}
          <p className="text-xs font-mono text-[#4C5055] dark:text-[#94A3B8] mt-0.5 font-normal">
            {profile.username} • {isOwnProfile && isGuestSession ? 'Guest Player' : `VIP Member since ${profile.joinedDate}`}
          </p>

          {isOwnProfile && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="mt-2 text-[11px] font-mono text-[#47A5FF] hover:text-[#3A92EE] font-bold hover:underline uppercase cursor-pointer"
            >
              {isUsingDefault ? '+ Upload Custom Avatar' : 'Change Profile Photo'}
            </button>
          )}
        </div>
      </div>

      {/* Instagram Section */}
      <div className="flex flex-col items-center justify-center space-y-2">
        {profile.instagramUrl ? (
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full py-3 px-5 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:border-[#47A5FF] text-[#000000] dark:text-[#F8FAFC] font-mono text-xs font-semibold transition-all shadow-xs group"
            >
              <div className="p-1.5 rounded-[8px] bg-[#F0F6FF] dark:bg-[#0F172A] text-[#47A5FF] shadow-xs group-hover:scale-105 transition-transform">
                <InstagramIcon size={16} />
              </div>
              <span>{t('instagramProfileLabel')}</span>
            </a>

            {isOwnProfile && (
              <button
                onClick={() => {
                  setInstagramInput(profile.instagramUrl || '');
                  setIsEditingInstagram(true);
                }}
                className="text-[11px] font-mono text-[#4C5055] dark:text-[#94A3B8] hover:text-[#47A5FF] transition-colors underline underline-offset-2 cursor-pointer"
              >
                Edit or Remove Instagram Link
              </button>
            )}
          </div>
        ) : (
          isOwnProfile && (
            <div>
              {!isEditingInstagram ? (
                <button
                  onClick={() => {
                    setInstagramInput('');
                    setIsEditingInstagram(true);
                    setInstagramError('');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:border-[#47A5FF] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] text-xs font-mono font-medium transition-all shadow-xs cursor-pointer"
                >
                  <InstagramIcon size={15} />
                  <span>{t('linkInstagramProfileLabel')}</span>
                </button>
              ) : (
                <div className="w-full max-w-md p-4 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] space-y-3 shadow-md text-[#000000] dark:text-[#F8FAFC]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#000000] dark:text-[#F8FAFC] uppercase tracking-wider">
                      Add Instagram URL
                    </span>
                    <button
                      onClick={() => setIsEditingInstagram(false)}
                      className="p-1 rounded-full text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] cursor-pointer"
                    >
                      <X size={16} strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={instagramInput}
                      onChange={(e) => {
                        setInstagramInput(e.target.value);
                        setInstagramError('');
                      }}
                      placeholder="https://www.instagram.com/username/"
                      className="w-full px-3.5 py-2.5 rounded-[11px] bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-xs font-mono text-[#000000] dark:text-[#F8FAFC] placeholder-[#4C5055] dark:placeholder-[#64748B] outline-none focus:border-[#47A5FF]"
                      autoFocus
                    />
                    <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">
                      Enter full profile URL (e.g. https://www.instagram.com/username/)
                    </p>
                  </div>

                  {instagramError && (
                    <p className="text-[11px] font-mono text-[#EF4444] font-semibold">
                      {instagramError}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setIsEditingInstagram(false)}
                      className="flex-1 py-2 rounded-[11px] bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-[#4C5055] dark:text-[#94A3B8] font-mono text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#F0F6FF] dark:hover:bg-[#334155]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveInstagram}
                      className="flex-1 py-2 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
                    >
                      Save Instagram
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccessText && (
        <div className="p-3 rounded-[11px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-mono text-center font-bold max-w-xs mx-auto">
          {actionSuccessText}
        </div>
      )}

      {/* Friend Request & Game Invite Action Buttons (Visible when viewing another player's profile) */}
      {!isOwnProfile && (
        <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto pt-1 space-y-2.5">
          <button
            onClick={() => {
              if (joinedRoom) {
                inviteFriendToRoom(profile.id);
                setActionSuccessText(`Invitation sent to ${profile.name}!`);
                setTimeout(() => setActionSuccessText(''), 3000);
              } else {
                setIsCreateRoomOpen(true);
              }
            }}
            className="w-full py-3 px-5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-md"
          >
            <Swords size={16} strokeWidth={2} />
            <span>{t('inviteToMatch')}</span>
          </button>

          {isAlreadyFriend ? (
            <button
              disabled
              className="w-full py-3 px-5 rounded-[11px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-default"
            >
              <Check size={16} strokeWidth={2} />
              <span>{t('friends')}</span>
            </button>
          ) : receivedRequest ? (
            <button
              onClick={() => acceptFriendRequest(receivedRequest.id)}
              className="w-full py-3 px-5 rounded-[11px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] text-[#000000] dark:text-[#F8FAFC] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <UserPlus size={16} strokeWidth={2} />
              <span>{t('acceptFriendRequestBtn')}</span>
            </button>
          ) : sentRequest ? (
            <button
              disabled
              className="w-full py-3 px-5 rounded-[11px] bg-[#F0F6FF] dark:bg-[#0F172A] text-[#4C5055] dark:text-[#94A3B8] border border-[#D5E5F7] dark:border-[#334155] text-xs font-mono font-medium uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-default"
            >
              <Check size={16} strokeWidth={2} />
              <span>{t('requestSentBtnLabel')}</span>
            </button>
          ) : (
            <button
              onClick={() => sendFriendRequest(profile)}
              className="w-full py-3 px-5 rounded-[11px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] text-[#000000] dark:text-[#F8FAFC] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <UserPlus size={16} strokeWidth={2} />
              <span>{t('addFriend')}</span>
            </button>
          )}
        </div>
      )}

      {/* Guest Account Callout Banner (Only for own guest profile) */}
      {isOwnProfile && isGuestSession && (
        <div className="p-4 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] space-y-2 text-left shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#FF8F00] uppercase tracking-wider flex items-center gap-1.5">
              Guest Player Mode
            </span>
            <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] font-bold uppercase">{t('temporaryAccountLabel')}</span>
          </div>
          <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] leading-relaxed">
            Create a permanent VIP account to preserve your stats, unlock exclusive trophies, and host lounges.
          </p>
          <button
            onClick={logoutUser}
            className="w-full py-2.5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-98 cursor-pointer shadow-md"
          >
            REGISTER VIP ACCOUNT
          </button>
        </div>
      )}

      {/* Clickable Friend Count Banner */}
      {isOwnProfile && (
        <button
          onClick={() => setActiveView('friends')}
          className="w-full p-4 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:bg-[#F4F8FC] dark:hover:bg-[#334155]/50 hover:border-[#47A5FF] transition-all shadow-xs flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#F0F6FF] dark:bg-[#0F172A] text-[#47A5FF]">
              <Users size={16} strokeWidth={2} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#000000] dark:text-[#F8FAFC]">
                {friends.length} {t('friends')}
              </p>
              <p className="text-[10px] text-[#4C5055] dark:text-[#94A3B8]">
                Tap to manage friends, view activity, or challenge to a match
              </p>
            </div>
          </div>

          <ChevronRight
            size={16}
            strokeWidth={2}
            className="text-[#4C5055] dark:text-[#94A3B8] group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      )}



      {/* Emoji Reaction Shop Entry Card */}
      {isOwnProfile && (
        <div className="p-4 rounded-[20px] bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/15 dark:via-orange-500/10 border border-amber-500/30 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#FFB800] text-black flex items-center justify-center font-bold shadow-xs shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold font-display flex items-center gap-1.5 text-[#0F172A] dark:text-[#F8FAFC]">
                  <span className="truncate">{t('emojiAndSoundShop')}</span>
                </h4>
                <p className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] truncate">
                  {language === 'ar'
                    ? `4 إيموجيات مجانية • ${SHOP_EMOJIS.filter((e) => unlockedEmojis.includes(e.id)).length}/${SHOP_EMOJIS.length} صوتية مفتوحة`
                    : `4 Free Default • ${SHOP_EMOJIS.filter((e) => unlockedEmojis.includes(e.id)).length}/${SHOP_EMOJIS.length} Sound Emojis Unlocked`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEmojiShopOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#FFB800] hover:bg-[#E6A600] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 min-h-[38px]"
            >
              <ShoppingBag size={13} />
              <span>{t('shop')}</span>
            </button>
          </div>

          {/* Interactive Emoji Sound Reel */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar touch-pan-x">
            {FREE_EMOJIS.map((e, idx) => (
              <div
                key={`free-preview-${e.id}-${idx}`}
                title={`${e.name} (Free)`}
                className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0 select-none relative shadow-xs"
              >
                <span>{e.emoji}</span>
              </div>
            ))}
            <div className="w-px h-7 bg-black/10 dark:bg-white/10 shrink-0 mx-1" />
            {SHOP_EMOJIS.map((e, idx) => {
              const isOwned = unlockedEmojis.includes(e.id);
              return (
                <button
                  key={`shop-preview-${e.id}-${idx}`}
                  onClick={() => {
                    if (isOwned && e.soundId) {
                      emojiSoundService.playSound(e.soundId);
                    } else {
                      setIsEmojiShopOpen(true);
                    }
                  }}
                  title={
                    isOwned
                      ? `${e.name} (Unlocked - Tap to play sound)`
                      : `${e.name} (🪙 ${e.price} - Tap to open shop)`
                  }
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-xl shrink-0 select-none relative cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                    isOwned
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 border-dashed border-black/20 dark:border-white/20 opacity-60'
                  }`}
                >
                  <span>{e.emoji}</span>
                  {isOwned && e.soundId && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-[#FFB800] text-black rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-xs">
                      ♪
                    </span>
                  )}
                  {!isOwned && (
                    <span className="absolute -bottom-1 -right-1 text-[8px] bg-black/80 text-[#FFD166] rounded-full px-1 font-mono font-bold shadow-xs border border-[#FFD166]/40">
                      🪙
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Statistics Grid */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono tracking-widest text-[#4C5055] dark:text-[#94A3B8] font-bold uppercase">
          Statistics & Performance
        </span>

        {/* Empty State Callout if gamesPlayed === 0 */}
        {profile.gamesPlayed === 0 ? (
          <div className="p-5 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#F0F6FF] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] flex items-center justify-center mx-auto text-[#47A5FF]">
              <Play size={18} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#000000] dark:text-[#F8FAFC]">{t('noMatchesPlayedYet')}</h4>
              <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] max-w-xs mx-auto">
                {t('noMatchesPlayedDesc')}
              </p>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('home')}
                className="px-5 py-2.5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md cursor-pointer"
              >
                Play Your First Game
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] space-y-1">
              <p className="text-base font-mono font-bold text-[#000000] dark:text-[#F8FAFC]">{profile.gamesPlayed}</p>
              <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] font-semibold uppercase">{t('gamesPlayed')}</p>
            </div>

            <div className="p-4 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] space-y-1">
              <p className="text-base font-mono font-bold text-[#FF8F00]">{profile.winRate}%</p>
              <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] font-semibold uppercase">{t('winRate')}</p>
            </div>

            <div className="p-4 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] space-y-1">
              <p className="text-base font-mono font-bold text-[#000000] dark:text-[#F8FAFC] flex items-center justify-center gap-1">
                <Flame size={14} strokeWidth={2} className="text-[#FF8F00]" />
                {profile.currentStreak}
              </p>
              <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] font-semibold uppercase">{t('currentStreak')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Achievements Badges (With distinct Unlocked / Locked Grayscale Styling) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-widest text-[#4C5055] dark:text-[#94A3B8] font-bold uppercase">
            {t('achievements')}
          </span>
          <span className="text-[10px] font-mono text-[#FF8F00] font-bold">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length} UNLOCKED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach, idx) => {
            const Icon = ach.icon;
            return (
              <div
                key={`ach-${ach.id}-${idx}`}
                className={`p-3.5 rounded-[16px] border transition-all flex items-center gap-3 ${
                  ach.unlocked
                    ? 'bg-white dark:bg-[#1E293B] border-[#47A5FF] shadow-sm'
                    : 'bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] opacity-50 grayscale'
                }`}
              >
                <div
                  className={`p-2.5 rounded-[10px] ${
                    ach.unlocked ? 'bg-[#F0F6FF] dark:bg-[#0F172A] text-[#47A5FF]' : 'bg-gray-100 dark:bg-gray-800 text-[#4C5055] dark:text-[#94A3B8]'
                  }`}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-bold truncate ${
                        ach.unlocked ? 'text-[#000000] dark:text-[#F8FAFC]' : 'text-[#4C5055] dark:text-[#94A3B8]'
                      }`}
                    >
                      {ach.title}
                    </p>
                    {!ach.unlocked && <Lock size={12} className="text-[#4C5055] dark:text-[#94A3B8] shrink-0" />}
                  </div>
                  <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] mt-0.5">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Photo Edit Modal */}
      {isOwnProfile && (
        <AnimatePresence>
          {showPhotoModal && (
            <div key="profile-photo-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-t-[20px] sm:rounded-[16px] border border-[#D5E5F7] dark:border-[#334155] p-6 space-y-5 shadow-2xl text-[#000000] dark:text-[#F8FAFC]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#D5E5F7] dark:border-[#334155]">
                  <h3 className="text-xs font-mono font-bold text-[#000000] dark:text-[#F8FAFC] uppercase tracking-wider">
                    PROFILE PHOTO
                  </h3>
                  <button
                    onClick={() => setShowPhotoModal(false)}
                    className="p-1.5 rounded-full hover:bg-[#F0F6FF] dark:hover:bg-[#334155] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] cursor-pointer"
                  >
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>

                {/* Current Avatar Preview */}
                <div className="text-center space-y-2">
                  <img loading="lazy" decoding="async" src={currentAvatar}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-[#47A5FF] mx-auto shadow-xs bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-[11px] font-mono text-[#4C5055] dark:text-[#94A3B8] uppercase font-bold">
                    {isUsingDefault ? 'Current: Default Silhouette Avatar' : 'Custom Profile Photo Active'}
                  </p>
                </div>

                {/* Upload Options */}
                <div className="space-y-3 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full py-3 px-4 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-md disabled:opacity-60"
                  >
                    {isUploadingPhoto ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading to Cloudinary...</span>
                      </span>
                    ) : (
                      <>
                        <Upload size={14} strokeWidth={2} />
                        <span>Upload Photo (Cloudinary)</span>
                      </>
                    )}
                  </button>

                  {/* Preset Avatars Grid */}
                  <div className="pt-2 border-t border-[#D5E5F7] dark:border-[#334155]">
                    <p className="text-[10px] font-mono uppercase font-bold text-[#4C5055] dark:text-[#94A3B8] mb-2">
                      Or Choose Preset Avatar:
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((preset, idx) => (
                        <button
                          key={`preset-${preset.id}-${idx}`}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(preset.url)}
                          title={preset.name}
                          className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#47A5FF] hover:scale-105 transition-all cursor-pointer shadow-xs focus:outline-none ring-1 ring-[#D5E5F7] dark:ring-[#334155]"
                        >
                          <img loading="lazy" decoding="async" src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleUrlSubmit} className="flex gap-2 pt-1">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="flex-1 px-3 py-2 rounded-[11px] bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-xs font-mono text-[#000000] dark:text-[#F8FAFC] placeholder-[#4C5055] dark:placeholder-[#64748B] outline-none focus:border-[#47A5FF]"
                    />
                    <button
                      type="submit"
                      disabled={!urlInput.trim()}
                      className="px-3.5 py-2 rounded-[11px] bg-[#FF8F00] hover:bg-[#E07D00] text-white text-xs font-mono font-bold uppercase disabled:opacity-40 cursor-pointer transition-all shadow-xs"
                    >
                      Save
                    </button>
                  </form>

                  {!isUsingDefault && (
                    <button
                      onClick={handleRemovePhoto}
                      className="w-full py-2.5 px-4 rounded-[11px] bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#EF4444]/20 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                      <span>Remove Photo & Use Default Avatar</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onSelectGame={() => {}}
      />
    </motion.div>
  );
};
