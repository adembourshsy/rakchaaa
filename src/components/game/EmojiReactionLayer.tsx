import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Volume2, ShoppingBag, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FREE_EMOJIS, SHOP_EMOJIS, ALL_EMOJIS, getEmojiById } from '../../data/emojis';
import { getAvatarUrl } from '../../data/mockData';

export const EmojiReactionLayer: React.FC = () => {
  const {
    joinedRoom,
    activeView,
    activeReactions,
    sendEmojiReaction,
    unlockedEmojis,
    setIsEmojiShopOpen,
    currentUid,
    language,
    t,
    chessAiConfig,
    unoAiConfig,
  } = useApp();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const isInMultiplayer =
    joinedRoom != null ||
    activeView === 'game' ||
    activeView === 'waiting_room';

  // The Chess game screen renders its own dedicated quick-reaction button
  // (positioned in its local layout, right above the player card) so it
  // never overlaps the timer. Suppress this generic global floating
  // trigger there to avoid a duplicate/overlapping button — the reaction
  // broadcast animation layer above still renders normally for chess.
  const isChessScreen = joinedRoom?.gameId === 'chess' || Boolean(chessAiConfig?.isAiMode);

  // The UNO screen's bottom action row (avatar pod, turn pill, UNO/Counter-UNO
  // buttons) sits lower than other games', so the generic bottom-44 offset used
  // to sit right on top of the UNO button. Lift the trigger higher there only.
  const isUnoScreen = joinedRoom?.gameId === 'uno-game' || Boolean(unoAiConfig?.isAiMode);

  // Only render floating triggers and reactions when in game or waiting room
  const showTrigger = isInMultiplayer && (activeView === 'game' || activeView === 'waiting_room') && !isChessScreen;

  const handleSelectEmoji = async (emojiId: string) => {
    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 800);

    try {
      await sendEmojiReaction(emojiId);
    } catch (err) {
      console.warn('[Reaction] Error sending reaction:', err);
    }
  };

  const isAr = language === 'ar';
  const myPurchasedEmojis = SHOP_EMOJIS.filter((e) => unlockedEmojis.includes(e.id));

  return (
    <>
      {/* 1. Floating Reactions Broadcast Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {activeReactions.map((reaction, index) => {
            const emojiObj = ALL_EMOJIS.find((e) => e.emoji === reaction.emoji);
            const isPremium = emojiObj && !emojiObj.isFree;
            const isMe = reaction.senderId === currentUid;

            // Compute pseudo-random horizontal offset based on reaction ID & sender hash so simultaneous emojis spread nicely
            const charCodeSum = reaction.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const senderHash = (reaction.senderId || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const leftPercent = 15 + ((charCodeSum + senderHash + index * 23) % 70);

            return (
              <motion.div
                key={`reaction-anim-${reaction.id || 'rx'}-${index}`}
                initial={{
                  opacity: 0,
                  scale: 0.3,
                  y: 60,
                  x: `${leftPercent}vw`,
                }}
                animate={{
                  opacity: [0, 1, 1, 0.95, 0],
                  scale: [0.4, 1.25, 1.1, 1, 0.8],
                  y: [60, -40, -120, -200, -280],
                  rotate: [(charCodeSum % 16) - 8, (charCodeSum % 10) - 5, 0],
                }}
                transition={{
                  duration: 3.4,
                  times: [0, 0.12, 0.45, 0.85, 1],
                  ease: 'easeOut',
                }}
                className="absolute bottom-28 pointer-events-none flex flex-col items-center select-none z-50"
              >
                {/* Clear Sender Identification Tag */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border text-white shadow-xl mb-1.5 transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-[#FF5436] to-[#FF8A00] border-white/40 ring-2 ring-[#FF5436]/40'
                      : 'bg-black/85 dark:bg-black/90 border-white/20'
                  }`}
                >
                  {reaction.senderAvatar && (
                    <img loading="lazy" decoding="async" src={getAvatarUrl(reaction.senderAvatar)}
                      alt={reaction.senderName}
                      className="w-4 h-4 rounded-full object-cover border border-white/30"
                    />
                  )}
                  <span className="text-[11px] font-mono font-bold tracking-tight max-w-[110px] truncate">
                    {isMe ? `${reaction.senderName} (${isAr ? 'أنت' : language === 'fr' ? 'Toi' : 'You'})` : reaction.senderName}
                  </span>
                  {isPremium && (
                    <span title="Sound Reaction" className="text-[#FFB800] text-[10px] flex items-center shrink-0">
                      <Volume2 size={11} className="inline ml-0.5" />
                    </span>
                  )}
                </div>

                {/* Big Animated Emoji */}
                <div
                  className={`text-5xl md:text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] ${
                    isPremium ? 'filter drop-shadow-[0_0_14px_rgba(255,184,0,0.6)]' : ''
                  }`}
                >
                  {reaction.emoji}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 2. Compact Floating In-Game Emoji Button */}
      {/* Positioned high enough (bottom-44) to clear the in-game bottom action bars
          (Chat/Draw/Resign/Undo row in Chess, hand/UNO controls in UNO, etc.) — at
          bottom-24 it used to sit directly on top of those buttons since this layer
          is viewport-fixed and unaware of each game's own bottom chrome. */}
      {showTrigger && (
        <div className={`fixed ${isUnoScreen ? 'bottom-60' : 'bottom-44'} right-4 z-40`} dir={isAr ? 'rtl' : 'ltr'}>
          <motion.button
            id="btn-in-game-emoji-reaction"
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsPickerOpen((prev) => !prev)}
            aria-label="Send Emoji Reaction"
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer border ${
              isPickerOpen
                ? 'bg-violet-500 text-white border-white/30 rotate-45'
                : 'bg-white/95 dark:bg-[#1E293B]/95 text-[#0F172A] dark:text-[#F8FAFC] border-black/10 dark:border-white/20 hover:scale-105 backdrop-blur-md'
            }`}
          >
            {isPickerOpen ? (
              <X size={20} />
            ) : (
              <div className="relative">
                <Smile size={22} className="text-violet-500 dark:text-violet-300" />
                {myPurchasedEmojis.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#FFB800] text-black font-bold text-[8px] flex items-center justify-center shadow-xs">
                    ★
                  </span>
                )}
              </div>
            )}
          </motion.button>

          {/* Compact Popup Selector */}
          <AnimatePresence>
            {isPickerOpen && (
              <motion.div
                key="emoji-reaction-picker-popup"
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 12 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-14 right-0 w-72 max-w-[85vw] p-3 rounded-2xl bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border border-black/15 dark:border-white/20 shadow-2xl space-y-2.5 z-50 text-[#0F172A] dark:text-[#F8FAFC]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                      {isAr ? 'ردود الفعل' : 'Emoji Reactions'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsPickerOpen(false);
                      setIsEmojiShopOpen(true);
                    }}
                    className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#47A5FF] hover:underline cursor-pointer"
                  >
                    <ShoppingBag size={11} />
                    <span>{isAr ? 'المتجر' : 'Shop'}</span>
                  </button>
                </div>

                {/* Free default emojis section */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#64748B] dark:text-[#94A3B8] uppercase font-semibold">
                    {isAr ? 'مجانية (بدون صوت)' : 'Free (No Sound)'}
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FREE_EMOJIS.map((item, idx) => (
                      <motion.button
                        key={`free-${item.id}-${idx}`}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={cooldown}
                        onClick={() => {
                          void handleSelectEmoji(item.id);
                        }}
                        className="h-10 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-2xl transition-colors cursor-pointer disabled:opacity-50"
                        title={item.name}
                      >
                        {item.emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Purchased custom emojis */}
                {myPurchasedEmojis.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-[#FFB800] uppercase font-bold flex items-center gap-1">
                        <Volume2 size={10} />
                        {isAr ? 'تفاعلاتك الصوتية' : 'Your Sound Emojis'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                      {myPurchasedEmojis.map((item, idx) => (
                        <motion.button
                          key={`purchased-${item.id}-${idx}`}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={cooldown}
                          onClick={() => {
                            void handleSelectEmoji(item.id);
                          }}
                          className="h-10 rounded-xl bg-[#FFB800]/10 hover:bg-[#FFB800]/20 border border-[#FFB800]/30 flex flex-col items-center justify-center text-xl transition-colors cursor-pointer disabled:opacity-50 relative group"
                          title={`${item.name} (Plays unique sound)`}
                        >
                          <span>{item.emoji}</span>
                          <span className="absolute bottom-0.5 right-1 text-[7px] text-[#FFB800]">♪</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shop unlock teaser if player has 0 purchased emojis */}
                {myPurchasedEmojis.length === 0 && (
                  <div className="p-2 rounded-xl bg-[#47A5FF]/10 border border-[#47A5FF]/20 text-center space-y-1">
                    <p className="text-[10px] font-mono text-[#47A5FF] font-semibold">
                      {isAr
                        ? 'احصل على إيموجيات صوتية حصرية من المتجر!'
                        : 'Unlock custom sound emojis in the Shop!'}
                    </p>
                    <button
                      onClick={() => {
                        setIsPickerOpen(false);
                        setIsEmojiShopOpen(true);
                      }}
                      className="w-full py-1 rounded-lg bg-[#47A5FF] text-white text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {isAr ? 'فتح متجر الإيموجي' : 'Open Emoji Shop'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};
