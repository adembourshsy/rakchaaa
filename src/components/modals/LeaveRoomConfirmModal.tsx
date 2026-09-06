import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function LeaveRoomConfirmModal() {
  const { isLeaveRoomConfirmOpen, cancelLeaveRoom, leaveRoom, isLeavingRoom, joinedRoom, activeView, unoAiConfig, chessAiConfig, exitAiUnoGame, exitAiChessGame, t } = useApp();

  if (!isLeaveRoomConfirmOpen || (!joinedRoom && !unoAiConfig?.isAiMode && !chessAiConfig?.isAiMode)) return null;

  const isInGame = activeView === 'game' || joinedRoom?.status === 'in_progress' || unoAiConfig?.isAiMode || chessAiConfig?.isAiMode;
  
  const titleText = isInGame 
    ? 'Are you sure you want to leave the current game?' 
    : t('leaveRoomConfirm', 'Are you sure you want to leave the room?');
    
  const leaveButtonText = isInGame 
    ? 'LEAVE' 
    : t('leaveRoom', 'LEAVE ROOM');
    
  const headerText = isInGame 
    ? 'Leave Game?' 
    : t('leaveRoom', 'LEAVE ROOM');

  const handleLeave = () => {
    if (unoAiConfig?.isAiMode) {
      exitAiUnoGame();
      cancelLeaveRoom();
    } else if (chessAiConfig?.isAiMode) {
      exitAiChessGame();
      cancelLeaveRoom();
    } else {
      void leaveRoom();
    }
  };

  return (
    <AnimatePresence>
      <div key="leave-room-confirm-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <div className="absolute inset-0" onClick={cancelLeaveRoom} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm rounded-[16px] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] text-[#000000] dark:text-[#F8FAFC] p-6 shadow-2xl space-y-5 text-center"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-[#EF476F]/10 text-[#EF476F] flex items-center justify-center border border-[#EF476F]/30">
            <AlertTriangle size={22} strokeWidth={1.75} />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-[#000000] dark:text-[#F8FAFC]">
              {headerText}
            </h3>
            <p className="text-sm text-[#4C5055] dark:text-[#94A3B8] leading-relaxed">
              {titleText}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={cancelLeaveRoom}
              disabled={isLeavingRoom}
              className="flex-1 py-3 px-4 rounded-[11px] bg-transparent border border-[#D5E5F7] dark:border-[#222E46] text-xs font-mono font-medium text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] transition-colors disabled:opacity-50 cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleLeave}
              disabled={isLeavingRoom}
              className="flex-1 py-3 px-4 rounded-[11px] bg-[#EF476F] hover:bg-[#EF476F]/90 text-xs font-mono font-medium text-white transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLeavingRoom ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <LogOut size={14} strokeWidth={1.75} />
                  <span>{leaveButtonText}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
