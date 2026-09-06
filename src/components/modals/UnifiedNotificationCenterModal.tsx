import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  DoorOpen,
  Users,
  Trophy,
  CheckCheck,
  Play,
  UserPlus,
  Coins,
  XCircle,
  Award,
  Trash2,
  Check
} from 'lucide-react';
import { useApp, NotificationCategory } from '../../context/AppContext';
import { getAvatarUrl } from '../../data/mockData';

export const UnifiedNotificationCenterModal: React.FC = () => {
  const {
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    activeNotificationTab,
    setActiveNotificationTab,
    invitations,
    acceptInvitation,
    declineInvitation,
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    gameResultNotifications,
    clearGameResultNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    readNotificationIds,
    unreadRoomNotificationsCount,
    unreadFriendNotificationsCount,
    unreadGameResultsCount,
    totalUnreadNotificationsCount,
    userProfile,
    language,
    t,
  } = useApp();

  if (!isNotificationCenterOpen) return null;

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const myUid = userProfile.id || 'usr-me';
  const myFriendRequests = friendRequests.filter((r) => r.recipientId === myUid);

  const handleClose = () => {
    setIsNotificationCenterOpen(false);
  };

  return (
    <AnimatePresence>
      <div key="unified-notif-center-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] rounded-[24px] p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#000000] dark:text-[#F8FAFC]"
        >
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D5E5F7] dark:border-[#334155]">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-[12px] bg-[#F0F6FF] dark:bg-[#334155] border border-[#D5E5F7] dark:border-[#475569] text-[#47A5FF] dark:text-[#38BDF8] relative">
                <Bell size={20} strokeWidth={2} />
                {totalUnreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#FF3B30] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B]">
                    {totalUnreadNotificationsCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider font-mono">
                  {t('notifications') || 'Notifications'}
                </h3>
                <p className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                  {isAr ? 'مركز الإشعارات الموحد' : isFr ? 'Centre de notifications' : 'Unified Notification Center'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalUnreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsAsRead(activeNotificationTab)}
                  className="px-2.5 py-1.5 rounded-[10px] bg-[#F0F6FF] dark:bg-[#334155] hover:bg-[#E0EEFF] dark:hover:bg-[#475569] text-[#47A5FF] dark:text-[#38BDF8] border border-[#D5E5F7] dark:border-[#475569] text-[10px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                  title={isAr ? 'تعيين الكل كـ مقروء' : 'Mark all as read'}
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">{isAr ? 'قراءة الكل' : 'Mark Read'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-[10px] bg-[#F4F8FC] dark:bg-[#334155] border border-[#D5E5F7] dark:border-[#475569] text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Unified Category Selector Bar */}
          <div className="grid grid-cols-3 gap-1.5 my-4 p-1 bg-[#F4F8FC] dark:bg-[#0F172A] border border-[#D5E5F7] dark:border-[#334155] rounded-[14px]">
            {/* Rooms Category Button */}
            <button
              type="button"
              onClick={() => {
                setActiveNotificationTab('rooms');
                markAllNotificationsAsRead('rooms');
              }}
              className={`relative py-2 px-2 sm:px-3 rounded-[10px] font-mono text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeNotificationTab === 'rooms'
                  ? 'bg-white dark:bg-[#1E293B] text-[#47A5FF] dark:text-[#38BDF8] shadow-sm border border-[#D5E5F7] dark:border-[#334155]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <DoorOpen size={16} />
              <span>{isAr ? 'الغرف' : 'Rooms'}</span>
              {unreadRoomNotificationsCount > 0 && (
                <span className="min-w-[16px] h-[16px] px-1 bg-[#FF8F00] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {unreadRoomNotificationsCount}
                </span>
              )}
            </button>

            {/* Friends Category Button */}
            <button
              type="button"
              onClick={() => {
                setActiveNotificationTab('friends');
                markAllNotificationsAsRead('friends');
              }}
              className={`relative py-2 px-2 sm:px-3 rounded-[10px] font-mono text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeNotificationTab === 'friends'
                  ? 'bg-white dark:bg-[#1E293B] text-[#47A5FF] dark:text-[#38BDF8] shadow-sm border border-[#D5E5F7] dark:border-[#334155]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Users size={16} />
              <span>{isAr ? 'الأصدقاء' : 'Friends'}</span>
              {unreadFriendNotificationsCount > 0 && (
                <span className="min-w-[16px] h-[16px] px-1 bg-[#47A5FF] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {unreadFriendNotificationsCount}
                </span>
              )}
            </button>

            {/* Game Results Category Button */}
            <button
              type="button"
              onClick={() => {
                setActiveNotificationTab('results');
                markAllNotificationsAsRead('results');
              }}
              className={`relative py-2 px-2 sm:px-3 rounded-[10px] font-mono text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeNotificationTab === 'results'
                  ? 'bg-white dark:bg-[#1E293B] text-[#47A5FF] dark:text-[#38BDF8] shadow-sm border border-[#D5E5F7] dark:border-[#334155]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Trophy size={16} />
              <span>{isAr ? 'النتائج' : 'Results'}</span>
              {unreadGameResultsCount > 0 && (
                <span className="min-w-[16px] h-[16px] px-1 bg-emerald-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {unreadGameResultsCount}
                </span>
              )}
            </button>
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {/* CATEGORY 1: ROOMS */}
            {activeNotificationTab === 'rooms' && (
              <div>
                {invitations.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <DoorOpen size={40} strokeWidth={1.5} className="mx-auto text-[#94A3B8] dark:text-[#64748B]" />
                    <p className="text-sm font-mono text-[#64748B] dark:text-[#94A3B8]">
                      {isAr ? 'لا توجد إشعارات غرف حالياً' : isFr ? 'Aucune notification de salon' : 'No room notifications yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[...invitations]
                      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
                      .map((inv, idx) => {
                        const isUnread = inv.status === 'pending' && !readNotificationIds.includes(inv.id);
                        return (
                          <div
                            key={`inv-${inv.id}-${idx}`}
                            onClick={() => markNotificationAsRead(inv.id)}
                            className={`p-3.5 rounded-[16px] border transition-all ${
                              inv.status === 'pending'
                                ? 'bg-[#F0F6FF]/60 dark:bg-[#1E293B] border-[#47A5FF]/40 dark:border-[#38BDF8]/40 shadow-xs'
                                : 'bg-[#F8FAFC] dark:bg-[#0F172A]/50 border-[#D5E5F7] dark:border-[#334155] opacity-80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2.5">
                              <div className="flex items-center gap-3">
                                <img loading="lazy" decoding="async" src={getAvatarUrl(inv.inviterAvatar)}
                                  alt={inv.inviterName}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D5E5F7] dark:ring-[#334155] bg-white dark:bg-[#0F172A]"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#000000] dark:text-[#F8FAFC]">
                                      {inv.inviterName}
                                    </span>
                                    {isUnread && (
                                      <span className="w-2 h-2 rounded-full bg-[#FF8F00] animate-pulse" />
                                    )}
                                    <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                                      • {inv.receivedAt}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-0.5">
                                    {isAr ? 'دعاك للانضمام إلى' : isFr ? 'Vous a invité à rejoindre' : 'Invited you to join'}{' '}
                                    <span className="font-bold text-[#000000] dark:text-[#F8FAFC]">
                                      {inv.gameTitle || 'Rakcha Game'}
                                    </span>{' '}
                                    (<span className="font-mono font-bold text-[#47A5FF]">{inv.roomCode}</span>)
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[9px] font-mono px-2 py-0.5 rounded-[6px] uppercase font-bold border ${
                                  inv.status === 'pending'
                                    ? 'bg-[#FF8F00]/10 border-[#FF8F00]/30 text-[#FF8F00]'
                                    : inv.status === 'joined' || inv.status === 'accepted'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                    : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>

                            {inv.status === 'pending' && (
                              <div className="flex items-center gap-2 pt-2 border-t border-[#D5E5F7] dark:border-[#334155]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    declineInvitation(inv.id);
                                  }}
                                  className="flex-1 py-2 px-3 rounded-[10px] bg-transparent border border-[#D5E5F7] dark:border-[#475569] text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] hover:bg-gray-100 dark:hover:bg-[#334155] font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer"
                                >
                                  {t('decline') || 'Decline'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    acceptInvitation(inv.id);
                                  }}
                                  className="flex-1 py-2 px-3 rounded-[10px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-[11px] font-bold uppercase transition-transform active:scale-95 shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Play size={14} strokeWidth={2} />
                                  <span>{t('joinRoom') || 'Join Room'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY 2: FRIENDS */}
            {activeNotificationTab === 'friends' && (
              <div>
                {myFriendRequests.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Users size={40} strokeWidth={1.5} className="mx-auto text-[#94A3B8] dark:text-[#64748B]" />
                    <p className="text-sm font-mono text-[#64748B] dark:text-[#94A3B8]">
                      {isAr ? 'لا توجد طلبات صداقة حالياً' : isFr ? 'Aucune demande d’ami' : 'No friend requests yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myFriendRequests.map((req, idx) => {
                      const isUnread = req.status === 'pending' && !readNotificationIds.includes(req.id);
                      return (
                        <div
                          key={`req-${req.id}-${idx}`}
                          onClick={() => markNotificationAsRead(req.id)}
                          className={`p-3.5 rounded-[16px] border transition-all ${
                            req.status === 'pending'
                              ? 'bg-[#F0F6FF]/60 dark:bg-[#1E293B] border-[#47A5FF]/40 dark:border-[#38BDF8]/40 shadow-xs'
                              : 'bg-[#F8FAFC] dark:bg-[#0F172A]/50 border-[#D5E5F7] dark:border-[#334155] opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-3">
                              <img loading="lazy" decoding="async" src={getAvatarUrl(req.senderAvatarUrl)}
                                alt={req.senderName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#D5E5F7] dark:ring-[#334155] bg-white dark:bg-[#0F172A]"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#000000] dark:text-[#F8FAFC]">
                                    {req.senderName}
                                  </span>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-[#47A5FF] animate-pulse" />
                                  )}
                                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                                    • {req.createdAt}
                                  </span>
                                </div>
                                <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-0.5">
                                  {isAr ? 'أرسل لك طلب صداقة' : isFr ? 'Vous a envoyé une demande d’ami' : 'Sent you a friend request'}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-[6px] uppercase font-bold border ${
                                req.status === 'pending'
                                  ? 'bg-[#47A5FF]/10 border-[#47A5FF]/30 text-[#47A5FF]'
                                  : req.status === 'accepted'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                  : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          {req.status === 'pending' && (
                            <div className="flex items-center gap-2 pt-2 border-t border-[#D5E5F7] dark:border-[#334155]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  declineFriendRequest(req.id);
                                }}
                                className="flex-1 py-2 px-3 rounded-[10px] bg-transparent border border-[#D5E5F7] dark:border-[#475569] text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] hover:bg-gray-100 dark:hover:bg-[#334155] font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                {t('decline') || 'Decline'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptFriendRequest(req.id);
                                }}
                                className="flex-1 py-2 px-3 rounded-[10px] bg-[#47A5FF] hover:bg-[#3282EA] text-white font-mono text-[11px] font-bold uppercase transition-transform active:scale-95 shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <UserPlus size={14} strokeWidth={2} />
                                <span>{t('accept') || 'Accept'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY 3: GAME RESULTS */}
            {activeNotificationTab === 'results' && (
              <div>
                {gameResultNotifications.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Trophy size={40} strokeWidth={1.5} className="mx-auto text-[#94A3B8] dark:text-[#64748B]" />
                    <p className="text-sm font-mono text-[#64748B] dark:text-[#94A3B8]">
                      {isAr ? 'لا توجد نتائج مباريات حالياً' : isFr ? 'Aucun résultat de jeu' : 'No game results yet'}
                    </p>
                    <p className="text-xs text-[#94A3B8] dark:text-[#64748B] max-w-xs mx-auto">
                      {isAr ? 'العب مباريات مدفوعة لكسب النقاط ورؤية تسويات الأرباح هنا' : 'Play matches to see your settlement results and coin earnings here!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {gameResultNotifications.map((res, idx) => {
                      const isWinner = res.isWinner;
                      const isDraw = res.isDraw;
                      const isUnread = !res.read && !readNotificationIds.includes(res.id);

                      return (
                        <div
                          key={`res-${res.id}-${idx}`}
                          onClick={() => markNotificationAsRead(res.id)}
                          className={`p-3.5 rounded-[16px] border transition-all relative ${
                            isWinner
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-100'
                              : isDraw
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-100'
                              : 'bg-red-500/10 border-red-500/40 text-red-900 dark:text-red-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-full border ${
                                isWinner
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-500'
                                  : isDraw
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-500'
                                  : 'bg-red-500/20 border-red-400 text-red-500'
                              }`}>
                                {isWinner ? (
                                  <Trophy size={20} />
                                ) : isDraw ? (
                                  <Award size={20} />
                                ) : (
                                  <XCircle size={20} />
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black tracking-tight">
                                    {isWinner
                                      ? isAr ? '🏆 مبروك! لقد فزت!' : isFr ? '🏆 VICTOIRE !' : '🏆 YOU WON!'
                                      : isDraw
                                      ? isAr ? '🤝 مباراة متعادلة!' : isFr ? '🤝 MATCH NUL !' : '🤝 MATCH DRAW!'
                                      : isAr ? '❌ حظ أوفر! لقد خسرت' : isFr ? '❌ DÉFAITE !' : '❌ YOU LOST!'}
                                  </span>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  )}
                                </div>

                                <p className="text-xs font-mono opacity-80 mt-0.5">
                                  {res.gameTitle} • Room <span className="font-bold">{res.roomCode}</span>
                                </p>
                                <p className="text-[10px] font-mono opacity-60 mt-0.5">
                                  {res.timestamp}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-base font-black font-mono px-2.5 py-1 rounded-xl border ${
                                isWinner
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                  : isDraw
                                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400'
                                  : 'bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400'
                              }`}>
                                {res.coinsChange > 0 ? `+${res.coinsChange}` : res.coinsChange} Coins
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearGameResultNotification(res.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Dismiss notification"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
