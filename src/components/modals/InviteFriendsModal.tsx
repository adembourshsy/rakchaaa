import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Check, Search, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAvatarUrl } from '../../data/mockData';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { friends, inviteFriendToRoom, joinedRoom, lastInviteTimestamps, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div key="invite-friends-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-md bg-white dark:bg-[#131A29] rounded-t-[16px] sm:rounded-[16px] border border-[#D5E5F7] dark:border-[#1E273C] text-[#000000] dark:text-[#F8FAFC] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] space-y-5 shadow-2xl max-h-[85dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#D5E5F7] dark:border-[#1E273C]">
            <div>
              <h3 className="text-sm font-semibold text-[#000000] dark:text-[#F8FAFC] uppercase tracking-wider font-mono">
                {t('inviteFriends')}
              </h3>
              <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] font-normal">
                Select friends to send a room code invite
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-[8px] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search
              size={14}
              strokeWidth={1.75}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4C5055] dark:text-[#94A3B8]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchFriends')}
              className="w-full pl-9 pr-4 py-2.5 rounded-[11px] bg-[#F4F8FC] dark:bg-[#1A2234] text-xs text-[#000000] dark:text-[#F8FAFC] placeholder-[#4C5055] dark:placeholder-[#94A3B8] outline-none border border-[#D5E5F7] dark:border-[#222E46] focus:border-[#47A5FF] dark:focus:border-[#38BDF8]"
            />
          </div>

          {/* Friends list */}
          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
            {filteredFriends.map((friend, idx) => {
              // Check if player is already in the room
              const isAlreadyInRoom = Boolean(
                joinedRoom?.players?.some(
                  (p) => p.id === friend.id || (p.username && p.username === friend.username)
                ) || joinedRoom?.playerIds?.includes(friend.id)
              );

              // Calculate cooldown
              const lastInviteTime = lastInviteTimestamps[friend.id] || 0;
              const elapsed = now - lastInviteTime;
              const cooldownRemaining = Math.max(0, Math.ceil((30000 - elapsed) / 1000));
              const hasCooldown = cooldownRemaining > 0;

              return (
                <div
                  key={`invite-friend-${friend.id}-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img loading="lazy" decoding="async" src={getAvatarUrl(friend.avatarUrl)}
                        alt={friend.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-[#D5E5F7] dark:ring-[#222E46] bg-white dark:bg-[#131A29]"
                      />
                      {friend.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-white dark:ring-[#131A29]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#000000] dark:text-[#F8FAFC] truncate">
                        {friend.name}
                      </p>
                      <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">
                        {friend.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAlreadyInRoom && !hasCooldown) {
                        inviteFriendToRoom(friend.id);
                      }
                    }}
                    disabled={isAlreadyInRoom || hasCooldown}
                    className={`px-3 py-1.5 rounded-[8px] text-[10px] font-mono font-medium uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer ${
                      isAlreadyInRoom
                        ? 'bg-[#F4F8FC]/50 dark:bg-[#1A2234]/50 text-[#4C5055] dark:text-[#94A3B8] border border-[#D5E5F7] dark:border-[#222E46] cursor-not-allowed opacity-60'
                        : hasCooldown
                        ? 'bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8]'
                        : 'bg-[#FF8F00] hover:bg-[#FFA726] text-black font-bold hover:opacity-95 active:scale-95 shadow-xs'
                    }`}
                  >
                    {isAlreadyInRoom ? (
                      <>
                        <Users size={12} strokeWidth={1.75} />
                        <span>{t('alreadyInRoom', 'In Room')}</span>
                      </>
                    ) : hasCooldown ? (
                      <>
                        <Check size={12} strokeWidth={1.75} />
                        <span>Invite in {cooldownRemaining}s</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={12} strokeWidth={1.75} />
                        <span>Invite</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-[11px] bg-transparent border border-[#D5E5F7] dark:border-[#222E46] text-xs font-mono uppercase text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
