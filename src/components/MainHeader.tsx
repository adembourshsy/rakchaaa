import React from 'react';
import { Bell, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAvatarUrl } from '../data/mockData';
import { LammaHubLogo } from './brand/LammaHubLogo';
import { PlayerAvatarBadge } from './ui/PlayerAvatarBadge';

export const MainHeader: React.FC = () => {
  const {
    userProfile,
    setActiveView,
    isRTL,
    isGuestSession,
    logoutUser,
    connectionStatus,
    setConnectionStatus,
    setIsNotificationCenterOpen,
    totalUnreadNotificationsCount,
    setIsCoinsModalOpen,
    t,
    joinedRoom,
  } = useApp();

  const isInProtectedSession =
    joinedRoom != null &&
    (joinedRoom.status === 'waiting' || joinedRoom.status === 'in_progress');

  React.useEffect(() => {
    if (connectionStatus === 'restored') {
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, setConnectionStatus]);

  return (
    <div className="w-full flex flex-col">
      {connectionStatus !== 'connected' && (
        <div className="w-full px-3.5 sm:px-6 pt-2 select-none">
          <div className={`w-full py-1.5 px-3 rounded-xl text-center text-[10px] font-mono uppercase tracking-widest font-black flex items-center justify-center gap-2 shadow-sm ${
            connectionStatus === 'connecting'
              ? 'bg-[#352208]/15 border border-[#352208]/30 text-[#352208] dark:bg-[#E1BB80]/15 dark:border-[#E1BB80]/30 dark:text-[#E1BB80]'
              : connectionStatus === 'reconnecting'
              ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 animate-pulse'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connectionStatus === 'connecting' ? 'bg-[#352208] dark:bg-[#E1BB80]' : connectionStatus === 'reconnecting' ? 'bg-red-500' : 'bg-emerald-500'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                connectionStatus === 'connecting' ? 'bg-[#352208] dark:bg-[#E1BB80]' : connectionStatus === 'reconnecting' ? 'bg-red-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span>
              {connectionStatus === 'connecting' && t('connectingToServer')}
              {connectionStatus === 'reconnecting' && t('connectionLost')}
              {connectionStatus === 'restored' && t('connectionRestored')}
            </span>
          </div>
        </div>
      )}

      <header className="w-full pt-3 sm:pt-4 pb-2 px-3 sm:px-6 flex items-center justify-between select-none bg-transparent">
      {/* Brand Title */}
      <button
        onClick={() => {
          if (isInProtectedSession) {
            setActiveView(joinedRoom.status === 'in_progress' ? 'game' : 'waiting_room');
          } else {
            setActiveView('main');
          }
        }}
        className="text-left group focus:outline-none flex items-center gap-2 min-h-[44px] px-1 touch-manipulation active:scale-98 transition-transform cursor-pointer"
      >
        <LammaHubLogo variant="full" size="sm" showTagline={false} textScale={0.7} />
        {isGuestSession && (
          <span className="px-2 py-0.5 rounded-full bg-[#352208]/15 dark:bg-[#E1BB80]/15 border border-[#352208]/30 dark:border-[#E1BB80]/30 text-[9px] font-mono text-[#352208] dark:text-[#E1BB80] font-bold uppercase tracking-wider">
            {t('guest')}
          </span>
        )}
      </button>

      {/* User Actions & Avatar Link */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Coins Pill (Elevated Importance) */}
        <button
          onClick={() => setIsCoinsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[11px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:border-[#47A5FF] text-[#FF8F00] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] transition-all min-h-[40px] touch-manipulation active:scale-95 shadow-sm cursor-pointer"
          title="Coins Balance"
          aria-label="Coins Balance"
        >
          <Coins size={17} strokeWidth={2} className="text-[#FF8F00]" />
          <span className="text-xs sm:text-[13px] font-mono font-bold tracking-tight text-[#000000] dark:text-[#F8FAFC]">
            {(userProfile.coins ?? 300).toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-[#FF8F00] font-bold bg-[#FF8F00]/15 px-1.5 py-0.5 rounded-[6px]">
            +
          </span>
        </button>

        {/* Single Unified Notification Bell Button */}
        <button
          onClick={() => setIsNotificationCenterOpen(true)}
          className="relative p-2 rounded-[11px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#47A5FF] dark:hover:text-[#38BDF8] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation active:scale-95 shadow-xs cursor-pointer"
          title={t('notifications') || 'Notifications'}
          aria-label={t('notifications') || 'Notifications'}
        >
          <Bell size={18} strokeWidth={1.75} />
          {totalUnreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#FF3B30] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0F172A]">
              {totalUnreadNotificationsCount}
            </span>
          )}
        </button>

        {isGuestSession && (
          <button
            onClick={logoutUser}
            className="text-[10px] font-mono text-[#000000] dark:text-[#F8FAFC] hover:text-[#47A5FF] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-[11px] bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] hover:bg-[#F0F6FF] dark:hover:bg-[#334155] transition-colors min-h-[36px] flex items-center touch-manipulation active:scale-95 shadow-xs cursor-pointer"
          >
            {t('signIn')}
          </button>
        )}

        <button
          onClick={() => setActiveView('profile')}
          className="relative group focus:outline-none transition-transform active:scale-95 p-1 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation cursor-pointer"
          title={userProfile.name}
        >
          <PlayerAvatarBadge
            avatarUrl={getAvatarUrl(userProfile.avatarUrl, userProfile.name || userProfile.username)}
            name={userProfile.name}
            wins={userProfile.wins ?? 0}
            size="sm"
            equippedFrame={userProfile.equippedFrame}
          />
        </button>
      </div>
    </header>
  </div>
  );
};

