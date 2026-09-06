import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DoorOpen, Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAvatarUrl } from '../../data/mockData';

export const RoomsNotificationsModal: React.FC = () => {
  const {
    isRoomsModalOpen,
    setIsRoomsModalOpen,
    invitations,
    acceptInvitation,
    declineInvitation,
    t,
  } = useApp();

  if (!isRoomsModalOpen) return null;

  return (
    <AnimatePresence>
      <div key="rooms-notif-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] text-[#000000] dark:text-[#F8FAFC] rounded-[16px] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D5E5F7] dark:border-[#1E273C]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-[10px] bg-[#F0F6FF] dark:bg-[#1E273C] border border-[#D5E5F7] dark:border-[#222E46] text-[#47A5FF] dark:text-[#38BDF8]">
                <DoorOpen size={18} strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-[#000000] dark:text-[#F8FAFC] uppercase tracking-wider font-mono">
                {t('rooms')}
              </h3>
            </div>
            <button
              onClick={() => setIsRoomsModalOpen(false)}
              className="p-2 rounded-[10px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Room Invitations List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {invitations.length === 0 ? (
              <div className="text-center py-12">
                <DoorOpen size={36} strokeWidth={1.75} className="mx-auto text-[#4C5055] dark:text-[#94A3B8] mb-3" />
                <p className="text-sm font-mono text-[#4C5055] dark:text-[#94A3B8]">{t('noRoomInvitations', 'No room invitations yet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...invitations]
                  .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
                  .map((inv, idx) => (
                    <div
                      key={`inv-${inv.id}-${idx}`}
                      className={`p-4 rounded-[16px] border transition-all ${
                        inv.status === 'pending'
                          ? 'bg-[#F4F8FC] dark:bg-[#1A2234] border-[#D5E5F7] dark:border-[#222E46] shadow-xs'
                          : 'bg-[#F4F8FC]/50 dark:bg-[#1A2234]/50 border-[#D5E5F7] dark:border-[#222E46] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img loading="lazy" decoding="async" src={getAvatarUrl(inv.inviterAvatar)}
                            alt={inv.inviterName}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-[#D5E5F7] dark:ring-[#222E46] bg-white dark:bg-[#131A29]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#000000] dark:text-[#F8FAFC]">
                                {inv.inviterName}
                              </span>
                              <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">• {inv.receivedAt}</span>
                            </div>
                            <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] mt-0.5">
                              {t('invitedYouToJoin', 'Invited you to join')} <span className="font-semibold text-[#000000] dark:text-[#F8FAFC]">{inv.gameTitle || 'Game'}</span> (<span className="font-mono font-medium text-[#000000] dark:text-[#F8FAFC]">{inv.roomCode}</span>)
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-[6px] uppercase font-medium border ${
                            inv.status === 'pending'
                              ? 'bg-[#F0F6FF] dark:bg-[#1E273C] border-[#D5E5F7] dark:border-[#222E46] text-[#47A5FF] dark:text-[#38BDF8]'
                              : inv.status === 'joined' || inv.status === 'accepted'
                              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                              : 'bg-[#F4F8FC] dark:bg-[#1A2234] border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8]'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      {inv.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-[#D5E5F7] dark:border-[#222E46]">
                          <button
                            onClick={() => declineInvitation(inv.id)}
                            className="flex-1 py-2 px-3 rounded-[11px] bg-transparent border border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] font-mono text-[11px] font-medium uppercase transition-colors active:scale-95 cursor-pointer"
                          >
                            {t('decline')}
                          </button>
                          <button
                            onClick={() => acceptInvitation(inv.id)}
                            className="flex-1 py-2 px-3 rounded-[11px] bg-[#FF6B1A] hover:bg-[#E85D0F] text-white font-mono text-[11px] font-medium uppercase hover:opacity-95 transition-transform active:scale-95 shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play size={14} strokeWidth={1.75} />
                            <span>{t('joinRoom')}</span>
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
