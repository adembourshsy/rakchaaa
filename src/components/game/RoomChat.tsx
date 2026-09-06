import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageCircle, Smile, ShoppingBag, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAvatarUrl } from '../../data/mockData';
import { FREE_EMOJIS, SHOP_EMOJIS } from '../../data/emojis';

/**
 * Real-time chat scoped to the current room (rooms/{code}/messages in
 * Firestore). Includes synced live emoji reactions and custom sound emojis.
 */
export const RoomChat: React.FC = () => {
  const {
    joinedRoom,
    chatMessages,
    sendChatMessage,
    userProfile,
    currentUid,
    multiplayerError,
    sendEmojiReaction,
    unlockedEmojis,
    setIsEmojiShopOpen,
    t,
    language,
  } = useApp();

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'ar';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  if (!joinedRoom) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setDraft('');
    try {
      await sendChatMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReaction = async (emojiId: string) => {
    try {
      await sendEmojiReaction(emojiId);
      setIsEmojiPickerOpen(false);
    } catch (err) {
      console.warn('[RoomChat] Error sending reaction:', err);
    }
  };

  const myPurchasedEmojis = SHOP_EMOJIS.filter((e) => unlockedEmojis.includes(e.id));
  const title = isAr ? 'الدردشة والتفاعلات' : language === 'fr' ? 'Discussion & Émojis' : 'Room Chat & Reactions';
  const placeholder = isAr ? 'اكتب رسالة...' : language === 'fr' ? 'Écrire un message...' : 'Write a message...';
  const emptyLabel = isAr
    ? 'لا رسائل بعد — قل مرحبا أو أرسل إيموجي!'
    : language === 'fr'
    ? 'Aucun message pour le moment — dites bonjour !'
    : 'No messages yet — say hello or react!';

  return (
    <div
      className="rounded-3xl bg-white dark:bg-[#151A28] border border-black/10 dark:border-white/10 shadow-sm overflow-hidden flex flex-col"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header with Shop Link */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={14} className="text-[#FF5436] dark:text-[#FFB800]" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#0F172A] dark:text-[#F8FAFC] uppercase">
            {title}
          </span>
        </div>
        <button
          onClick={() => setIsEmojiShopOpen(true)}
          className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#FFB800] hover:underline cursor-pointer"
        >
          <ShoppingBag size={12} />
          <span>{isAr ? 'متجر الإيموجي' : 'Emoji Shop'}</span>
        </button>
      </div>

      {multiplayerError?.code === 'CHAT_PERMISSION_DENIED' && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 shrink-0">
          <p className="text-[10px] font-mono text-red-600 dark:text-red-400 break-words">
            CHAT PERMISSION DENIED — {multiplayerError.message}
          </p>
        </div>
      )}

      {/* Messages Feed */}
      <div ref={scrollRef} className="max-h-64 overflow-y-auto px-4 py-3 space-y-2.5 flex-1">
        {chatMessages.length === 0 ? (
          <p className="text-center text-[11px] text-[#64748B] dark:text-[#94A3B8] py-4">{emptyLabel}</p>
        ) : (
          chatMessages.map((msg, idx) => {
            const isMe = msg.senderId === (currentUid || userProfile.id);
            return (
              <motion.div
                key={`msg-${msg.id}-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <img loading="lazy" decoding="async" src={getAvatarUrl(msg.senderAvatar)}
                  alt={msg.senderName}
                  className="w-6 h-6 rounded-full object-cover bg-black/5 dark:bg-[#0B0E17] shrink-0"
                />
                <div className={`min-w-0 max-w-[75%] ${isMe ? 'items-end text-right' : 'items-start text-left'} flex flex-col`}>
                  <span className="text-[9px] font-mono text-[#64748B] dark:text-[#94A3B8] px-1">
                    {isMe ? t('you') || 'You' : msg.senderName}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-2xl text-xs break-words ${
                      isMe
                        ? 'bg-[#FF5436] text-white font-semibold rounded-br-xs shadow-xs'
                        : 'bg-black/5 dark:bg-white/10 text-[#0F172A] dark:text-[#F8FAFC] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Quick Free Emoji Bar */}
      <div className="px-3 py-1.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {FREE_EMOJIS.map((item, idx) => (
            <button
              key={`free-bar-${item.id}-${idx}`}
              onClick={() => void handleQuickReaction(item.id)}
              className="w-7 h-7 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-base flex items-center justify-center transition-transform hover:scale-125 active:scale-95 cursor-pointer"
              title={`Send ${item.name} reaction`}
            >
              {item.emoji}
            </button>
          ))}

          {myPurchasedEmojis.slice(0, 3).map((item, idx) => (
            <button
              key={`purchased-bar-${item.id}-${idx}`}
              onClick={() => void handleQuickReaction(item.id)}
              className="w-7 h-7 rounded-lg bg-[#FFB800]/10 hover:bg-[#FFB800]/25 border border-[#FFB800]/30 text-base flex items-center justify-center transition-transform hover:scale-125 active:scale-95 cursor-pointer relative"
              title={`Send ${item.name} with sound effect`}
            >
              {item.emoji}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
          className={`p-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            isEmojiPickerOpen
              ? 'bg-[#FF5436] text-white'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title="All Reactions"
        >
          <Smile size={14} />
        </button>
      </div>

      {/* Expanded Popup Selector inside Chat */}
      <AnimatePresence>
        {isEmojiPickerOpen && (
          <motion.div
            key="room-chat-emoji-picker-dropdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 border-t border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] space-y-2 shrink-0"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] font-bold uppercase">
              <span>{isAr ? 'اختر تفاعلاً للإرسال' : 'Choose Emoji Reaction'}</span>
              <button
                onClick={() => setIsEmojiShopOpen(true)}
                className="text-[#47A5FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isAr ? 'فتح المتجر' : 'Shop'}</span>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {FREE_EMOJIS.map((item, idx) => (
                <button
                  key={`free-pop-${item.id}-${idx}`}
                  onClick={() => void handleQuickReaction(item.id)}
                  className="h-9 rounded-xl bg-white dark:bg-[#1E293B] border border-black/10 dark:border-white/10 text-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-xs"
                >
                  {item.emoji}
                </button>
              ))}

              {myPurchasedEmojis.map((item, idx) => (
                <button
                  key={`purchased-pop-${item.id}-${idx}`}
                  onClick={() => void handleQuickReaction(item.id)}
                  className="h-9 rounded-xl bg-[#FFB800]/15 hover:bg-[#FFB800]/25 border border-[#FFB800]/40 text-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-xs relative"
                  title={`${item.name} (Sound)`}
                >
                  <span>{item.emoji}</span>
                  <span className="absolute bottom-0 right-1 text-[7px] text-[#FFB800]">♪</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-black/10 dark:border-white/10 shrink-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          maxLength={500}
          className="flex-1 px-3.5 py-2 rounded-xl bg-black/5 dark:bg-[#0B0E17] border border-transparent focus:border-[#FF5436] text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder-black/40 dark:placeholder-white/40 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending}
          className="p-2.5 rounded-xl bg-[#FF5436] hover:bg-[#E04428] text-white font-bold disabled:opacity-40 transition-transform active:scale-95 shadow-xs cursor-pointer"
          aria-label="Send"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

