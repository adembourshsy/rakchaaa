import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAvatarUrl } from '../../data/mockData';

export const FriendsNotificationsModal: React.FC = () => {
  const {
    isFriendsModalOpen,
    setIsFriendsModalOpen,
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    userProfile,
    t,
  } = useApp();

  if (!isFriendsModalOpen) return null;

  const myId = userProfile.id || 'usr-me';
  const myFriendRequests = friendRequests.filter((r) => r.recipientId === myId);

  return (
    <AnimatePresence>
      <div key="friends-notif-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] rounded-[16px] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D5E5F7] dark:border-[#1E273C]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-[10px] bg-[#F0F6FF] dark:bg-[#1E273C] border border-[#D5E5F7] dark:border-[#222E46] text-[#47A5FF] dark:text-[#38BDF8]">
                <Users size={18} strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-[#000000] dark:text-[#F8FAFC] uppercase tracking-wider font-mono">
                {t('friends')}
              </h3>
            </div>
            <button
              onClick={() => setIsFriendsModalOpen(false)}
              className="p-2 rounded-[10px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Friend Requests List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {myFriendRequests.length === 0 ? (
              <div className="text-center py-12">
                <Users size={36} strokeWidth={1.75} className="mx-auto text-[#4C5055] dark:text-[#94A3B8] mb-3" />
                <p className="text-sm font-mono text-[#4C5055] dark:text-[#94A3B8]">{t('noFriendRequests', 'No friend requests yet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myFriendRequests.map((req, idx) => (
                  <div
                    key={`req-${req.id}-${idx}`}
                    className={`p-4 rounded-[16px] border transition-all ${
                      req.status === 'pending'
                        ? 'bg-[#F4F8FC] dark:bg-[#1A2234] border-[#D5E5F7] dark:border-[#222E46] shadow-xs'
                        : 'bg-[#F4F8FC]/50 dark:bg-[#1A2234]/50 border-[#D5E5F7] dark:border-[#222E46] opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img loading="lazy" decoding="async" src={getAvatarUrl(req.senderAvatarUrl)}
                          alt={req.senderName}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-[#D5E5F7] dark:ring-[#222E46] bg-white dark:bg-[#131A29]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#000000] dark:text-[#F8FAFC]">
                              {req.senderName}
                            </span>
                            <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">• {req.createdAt}</span>
                          </div>
                          <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] mt-0.5 font-normal">
                            {t('sentFriendRequest', 'Sent you a friend request')}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-[6px] uppercase font-medium border ${
                          req.status === 'pending'
                            ? 'bg-[#F0F6FF] dark:bg-[#1E273C] border-[#D5E5F7] dark:border-[#222E46] text-[#47A5FF] dark:text-[#38BDF8]'
                            : req.status === 'accepted'
                            ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                            : 'bg-[#F4F8FC] dark:bg-[#1A2234] border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8]'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#D5E5F7] dark:border-[#222E46]">
                        <button
                          onClick={() => declineFriendRequest(req.id)}
                          className="flex-1 py-2 px-3 rounded-[11px] bg-transparent border border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] font-mono text-[11px] font-medium uppercase transition-colors active:scale-95 cursor-pointer"
                        >
                          {t('decline')}
                        </button>
                        <button
                          onClick={() => acceptFriendRequest(req.id)}
                          className="flex-1 py-2 px-3 rounded-[11px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-[11px] font-medium uppercase transition-transform active:scale-95 shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus size={14} strokeWidth={1.75} />
                          <span>{t('accept', 'Accept')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
