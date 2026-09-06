import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Gamepad2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAvatarUrl } from '../../data/mockData';

export const RoomInvitationPopup: React.FC = () => {
  const { invitations, acceptInvitation, declineInvitation, joinedRoom, activeView, activeTab, t } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  const isInProtectedSession =
    joinedRoom != null &&
    (joinedRoom.status === 'waiting' || joinedRoom.status === 'in_progress');

  const isNavDockVisible =
    !isInProtectedSession &&
    activeView !== 'game' &&
    activeView !== 'waiting_room' &&
    activeView !== 'profile' &&
    (activeTab === 'home' || activeTab === 'rooms' || activeTab === 'settings');

  // Pick the newest pending invitation by timestamp
  const pendingInv = useMemo(() => {
    const pendings = invitations
      .filter((i) => i.status === 'pending' && (!joinedRoom || joinedRoom.code !== i.roomCode))
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return pendings[0] || null;
  }, [invitations, joinedRoom?.code]);

  if (!pendingInv) return null;

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await acceptInvitation(pendingInv.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await declineInvitation(pendingInv.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={`room-inv-popup-${pendingInv.id}`}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed ${
          isNavDockVisible
            ? 'bottom-[calc(max(1rem,env(safe-area-inset-bottom))+5rem)]'
            : 'bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))]'
        } left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] text-[#000000] dark:text-[#F8FAFC] rounded-[16px] p-4 shadow-2xl select-none`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img loading="lazy" decoding="async" src={getAvatarUrl(pendingInv.inviterAvatar)}
                alt={pendingInv.inviterName}
                className="w-12 h-12 rounded-full object-cover ring-1 ring-[#D5E5F7] dark:ring-[#222E46] bg-white dark:bg-[#131A29]"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F0F6FF] dark:bg-[#1E273C] border border-[#D5E5F7] dark:border-[#222E46] text-[#47A5FF] dark:text-[#38BDF8] rounded-full flex items-center justify-center">
                <Gamepad2 size={11} strokeWidth={1.75} />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] uppercase font-medium tracking-wider">
                  {t('gameInvitation')}
                </span>
                <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">• {pendingInv.receivedAt}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#000000] dark:text-[#F8FAFC] mt-0.5">
                {pendingInv.inviterName} invited you
              </h4>
              <p className="text-xs text-[#4C5055] dark:text-[#94A3B8]">
                To join their <span className="font-semibold text-[#000000] dark:text-[#F8FAFC]">{pendingInv.gameTitle}</span> room ({pendingInv.roomCode})
              </p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="p-1 rounded-full text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#D5E5F7] dark:border-[#1E273C]">
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-3 rounded-[11px] bg-transparent border border-[#D5E5F7] dark:border-[#222E46] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] font-mono text-xs font-medium uppercase tracking-wider transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {t('decline')}
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-3 rounded-[11px] bg-[#FF6B1A] hover:bg-[#E85D0F] text-white font-mono text-xs font-medium uppercase tracking-wider transition-transform active:scale-95 shadow-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{t('joining', 'Joining...')}</span>
              </>
            ) : (
              <span>{t('joinRoom')}</span>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
