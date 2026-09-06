import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, UserPlus, Swords, Radio, X, Users, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Friend } from '../../types';
import { getAvatarUrl } from '../../data/mockData';
import { ThreeDEmptyState } from '../ui/ThreeDEmptyState';

export const FriendsView: React.FC = () => {
  const {
    friends,
    addFriendByUsername,
    removeFriend,
    setActiveView,
    createRoom,
    inviteFriendToRoom,
    joinedRoom,
    viewUserProfile,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [actionSuccessText, setActionSuccessText] = useState('');

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFriendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addFriendByUsername(newUsernameInput);
    if (success) {
      setNewUsernameInput('');
      setShowAddModal(false);
      setActionSuccessText('Friend request sent!');
      setTimeout(() => setActionSuccessText(''), 3000);
    }
  };

  const handleChallenge = async (friend: Friend) => {
    // Create room and invite
    await createRoom('mind-rally', 2, true);
    inviteFriendToRoom(friend.id);
    setSelectedFriend(null);
  };

  const handleInviteToCurrentRoom = (friend: Friend) => {
    if (joinedRoom) {
      inviteFriendToRoom(friend.id);
      setActionSuccessText(`${t('inviteSent') || 'Invitation sent'} to ${friend.name}`);
      setTimeout(() => setActionSuccessText(''), 2500);
    } else {
      handleChallenge(friend);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] pt-1 sm:pt-2 select-none"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => setActiveView('profile')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer min-h-[44px] px-2"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          <span>Profile</span>
        </button>

        <span className="text-xs font-mono font-bold tracking-widest text-[#FF8F00] uppercase">
          {t('friends') || 'FRIENDS'} ({friends.length})
        </span>

        <button
          onClick={() => setShowAddModal(true)}
          className="p-2.5 rounded-[11px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] text-[#47A5FF] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] transition-transform active:scale-95 shadow-xs cursor-pointer"
          title={t('addFriend') || 'Add Friend'}
        >
          <UserPlus size={16} strokeWidth={2} />
        </button>
      </div>

      {actionSuccessText && (
        <div className="p-3 rounded-[11px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-mono text-center font-bold">
          {actionSuccessText}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search
          size={16}
          strokeWidth={1.75}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4C5055] dark:text-[#94A3B8]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchFriends') || 'Search friends by name or handle...'}
          className="w-full pl-10 pr-4 py-2.5 rounded-[11px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] text-xs font-mono text-[#000000] dark:text-[#F8FAFC] placeholder-[#4C5055] dark:placeholder-[#64748B] outline-none shadow-xs focus:border-[#47A5FF]"
        />
      </div>

      {/* Friends List */}
      <div className="space-y-2.5">
        {filteredFriends.length === 0 ? (
          <ThreeDEmptyState
            title="NO FRIENDS FOUND"
            description="Build your RAKCHA VIP multiplayer lounge! Add friends by username to challenge them to live games."
            actionLabel={t('addFriend') || 'Add Friend'}
            onAction={() => setShowAddModal(true)}
            icon={<UserPlus size={16} strokeWidth={2} />}
          />
        ) : (
          filteredFriends.map((friend, idx) => (
            <div
              key={`friend-${friend.id}-${idx}`}
              onClick={() => setSelectedFriend(friend)}
              className="p-3.5 rounded-[16px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:bg-[#F4F8FC] dark:hover:bg-[#334155]/50 hover:border-[#47A5FF] transition-all shadow-xs flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img loading="lazy" decoding="async" src={getAvatarUrl(friend.avatarUrl)}
                    alt={friend.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-[#D5E5F7] dark:ring-[#334155] bg-gray-100 dark:bg-gray-800"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#1E293B] ${
                      friend.isOnline ? 'bg-[#10B981]' : 'bg-[#4C5055]'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[#000000] dark:text-[#F8FAFC] truncate">
                      {friend.name}
                    </p>
                    {friend.isFavorite && (
                      <span className="text-[10px] font-mono text-[#FF8F00]">
                        ★
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">
                    {friend.username} •{' '}
                    {friend.isOnline ? t('online') : friend.lastActive || t('offline')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-[8px] bg-[#F0F6FF] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-[#47A5FF] font-bold">
                  Lvl {friend.level}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Friend Detail Drawer / Modal */}
      <AnimatePresence>
        {selectedFriend && (
          <div key="friends-view-selected-friend-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-t-[20px] sm:rounded-[16px] border border-[#D5E5F7] dark:border-[#334155] p-6 space-y-5 shadow-2xl text-[#000000] dark:text-[#F8FAFC]"
            >
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="p-1.5 rounded-full hover:bg-[#F0F6FF] dark:hover:bg-[#334155] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              <div className="text-center space-y-2">
                <img loading="lazy" decoding="async" src={getAvatarUrl(selectedFriend.avatarUrl)}
                  alt={selectedFriend.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#47A5FF] mx-auto bg-gray-100 dark:bg-gray-800"
                />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#F8FAFC]">
                  {selectedFriend.name}
                </h3>
                <p className="text-xs font-mono text-[#4C5055] dark:text-[#94A3B8]">
                  {selectedFriend.username} • Level {selectedFriend.level}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-[#D5E5F7] dark:border-[#334155]">
                <div>
                  <p className="text-xs font-mono font-bold text-[#000000] dark:text-[#F8FAFC]">
                    {selectedFriend.gamesPlayed}
                  </p>
                  <p className="text-[9px] font-mono text-[#4C5055] dark:text-[#94A3B8] uppercase">
                    Games
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-[#FF8F00]">
                    {selectedFriend.winRate}%
                  </p>
                  <p className="text-[9px] font-mono text-[#4C5055] dark:text-[#94A3B8] uppercase">
                    Win %
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-[#000000] dark:text-[#F8FAFC]">
                    {selectedFriend.currentStreak}
                  </p>
                  <p className="text-[9px] font-mono text-[#4C5055] dark:text-[#94A3B8] uppercase">
                    Streak
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleChallenge(selectedFriend)}
                  className="w-full py-3 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Swords size={16} strokeWidth={2} />
                  <span>{t('challenge') || 'CHALLENGE TO DUEL'}</span>
                </button>

                <button
                  onClick={() => handleInviteToCurrentRoom(selectedFriend)}
                  className="w-full py-3 rounded-[11px] bg-[#FF8F00] hover:bg-[#E07D00] text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <Radio size={16} strokeWidth={2} />
                  <span>{t('inviteToRoom') || 'INVITE TO ROOM'}</span>
                </button>

                <button
                  onClick={() => {
                    const f = selectedFriend;
                    setSelectedFriend(null);
                    viewUserProfile(f);
                  }}
                  className="w-full py-3 rounded-[11px] bg-[#F0F6FF] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-[#000000] dark:text-[#F8FAFC] hover:bg-[#E5F0FF] dark:hover:bg-[#334155] text-xs font-mono font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Users size={16} strokeWidth={2} />
                  <span>View Public Profile</span>
                </button>

                <button
                  onClick={() => {
                    const name = selectedFriend.name;
                    removeFriend(selectedFriend.id);
                    setSelectedFriend(null);
                    setActionSuccessText(`Removed ${name}`);
                    setTimeout(() => setActionSuccessText(''), 2500);
                  }}
                  className="w-full py-2.5 rounded-[11px] text-xs font-mono uppercase text-[#4C5055] dark:text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                >
                  Remove Friend
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div key="friends-view-add-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-[#1E293B] rounded-[16px] border border-[#D5E5F7] dark:border-[#334155] p-5 space-y-4 shadow-2xl text-[#000000] dark:text-[#F8FAFC]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#D5E5F7] dark:border-[#334155]">
                <h3 className="text-xs font-mono font-bold text-[#000000] dark:text-[#F8FAFC] uppercase">
                  {t('addFriend') || 'ADD FRIEND'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer p-1 text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC]"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleAddFriendSubmit} className="space-y-3">
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  placeholder="@username or player name"
                  className="w-full px-3.5 py-2.5 rounded-[11px] bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] text-xs font-mono text-[#000000] dark:text-[#F8FAFC] placeholder-[#4C5055] dark:placeholder-[#64748B] outline-none focus:border-[#47A5FF]"
                />
                <button
                  type="submit"
                  disabled={!newUsernameInput.trim()}
                  className="w-full py-2.5 rounded-[11px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-xs font-mono font-bold uppercase transition-all cursor-pointer disabled:opacity-40 shadow-xs"
                >
                  {t('addFriend') || 'SEND INVITATION'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
