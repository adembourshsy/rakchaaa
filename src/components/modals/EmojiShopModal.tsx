import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  Coins,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Info,
  Plus,
  Play,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FREE_EMOJIS, SHOP_EMOJIS, EmojiItem } from '../../data/emojis';
import { emojiSoundService } from '../../services/emojiSoundService';

export const EmojiShopModal: React.FC = () => {
  const {
    isEmojiShopOpen,
    setIsEmojiShopOpen,
    unlockedEmojis,
    buyEmoji,
    userProfile,
    setIsCoinsModalOpen,
    language,
    t,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'free' | 'shop'>('all');
  const [activePreviewingSound, setActivePreviewingSound] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; isError?: boolean } | null>(null);

  if (!isEmojiShopOpen) return null;

  const isAr = language === 'ar';
  const isFr = language === 'fr';
  const userCoins = userProfile.coins ?? 300;

  const showToast = (message: string, isError = false) => {
    setFeedbackToast({ message, isError });
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handlePreviewSound = (emojiItem: EmojiItem) => {
    if (!emojiItem.soundId) return;
    setActivePreviewingSound(emojiItem.soundId);
    emojiSoundService.playSound(emojiItem.soundId);
    setTimeout(() => {
      setActivePreviewingSound(null);
    }, 600);
  };

  const handlePurchase = async (emojiItem: EmojiItem) => {
    if (unlockedEmojis.includes(emojiItem.id)) return;
    if (userCoins < emojiItem.price) {
      showToast(
        isAr
          ? 'ليس لديك ما يكفي من العملات! احصل على المزيد من العملات.'
          : isFr
          ? 'Pas assez de pièces ! Obtenez plus de pièces.'
          : 'Not enough coins! Get more coins.',
        true
      );
      return;
    }

    setBuyingId(emojiItem.id);
    try {
      const res = await buyEmoji(emojiItem.id);
      if (res.success) {
        // Preview the sound as celebration
        if (emojiItem.soundId) {
          emojiSoundService.playSound(emojiItem.soundId);
        }
        showToast(
          isAr
            ? `تم فتح ${emojiItem.emoji} بنجاح! متاح الآن في جميع الألعاب.`
            : isFr
            ? `${emojiItem.emoji} débloqué avec succès ! Disponible dans tous les jeux.`
            : `Unlocked ${emojiItem.emoji} successfully! Usable across all games.`
        );
      } else {
        showToast(res.error || 'Purchase failed.', true);
      }
    } catch {
      showToast('An unexpected error occurred during purchase.', true);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-xl max-h-[92vh] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden text-[#000000] dark:text-[#F8FAFC]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D5E5F7] dark:border-[#1E273C] flex items-center justify-between shrink-0 bg-[#F4F8FC] dark:bg-[#1A2234]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-[#FFB800] text-black flex items-center justify-center font-bold shadow-md shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-[#000000] dark:text-[#F8FAFC] flex items-center gap-2">
                <span>{isAr ? 'متجر الإيموجي والتفاعلات' : isFr ? 'Boutique d’Émojis' : 'Emoji Reaction Shop'}</span>
              </h2>
              <p className="text-xs text-[#4C5055] dark:text-[#94A3B8]">
                {isAr
                  ? 'اشترِ إيموجيات صوتية حصرية واستخدمها في كل مبارياتك'
                  : isFr
                  ? 'Achetez des émojis sonores exclusifs pour vos parties'
                  : 'Unlock exclusive sound emojis for all multiplayer games'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Coins Balance Indicator with Quick Top-up */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#222E46] text-[#FF8F00] text-xs font-mono font-bold shadow-xs">
              <Coins size={14} className="text-[#FF8F00]" />
              <span>{userCoins.toLocaleString()}</span>
              <button
                type="button"
                onClick={() => {
                  setIsEmojiShopOpen(false);
                  setIsCoinsModalOpen(true);
                }}
                className="w-5 h-5 rounded-full bg-[#FF8F00] text-black flex items-center justify-center text-[11px] font-bold hover:scale-110 transition-transform cursor-pointer ml-0.5"
                title={isAr ? 'الحصول على عملات' : 'Get Coins'}
              >
                <Plus size={11} strokeWidth={3} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsEmojiShopOpen(false)}
              className="p-2 rounded-full hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="p-3 bg-white dark:bg-[#131A29] border-b border-[#D5E5F7] dark:border-[#1E273C] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
              selectedCategory === 'all'
                ? 'bg-[#FF8F00] text-black shadow-xs'
                : 'bg-[#F4F8FC] dark:bg-[#1A2234] text-[#4C5055] dark:text-[#94A3B8] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] border border-[#D5E5F7] dark:border-[#222E46]'
            }`}
          >
            {isAr ? 'الكل' : isFr ? 'Tous' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('free')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
              selectedCategory === 'free'
                ? 'bg-[#FF8F00] text-black shadow-xs'
                : 'bg-[#F4F8FC] dark:bg-[#1A2234] text-[#4C5055] dark:text-[#94A3B8] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] border border-[#D5E5F7] dark:border-[#222E46]'
            }`}
          >
            {isAr ? 'المجانية (4)' : isFr ? 'Gratuits (4)' : 'Free (4)'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('shop')}
            className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
              selectedCategory === 'shop'
                ? 'bg-[#FF8F00] text-black shadow-xs'
                : 'bg-[#F4F8FC] dark:bg-[#1A2234] text-[#4C5055] dark:text-[#94A3B8] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] border border-[#D5E5F7] dark:border-[#222E46]'
            }`}
          >
            <span>{isAr ? 'المتجر الصوتي' : isFr ? 'Boutique Sonore' : 'Sound Shop'}</span>
          </button>
        </div>

        {/* Toast Feedback */}
        <AnimatePresence>
          {feedbackToast && (
            <motion.div
              key="emoji-shop-feedback-toast"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-mono font-bold text-center border shadow-xs ${
                feedbackToast.isError
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {feedbackToast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
          {/* 1. FREE DEFAULT EMOJIS */}
          {(selectedCategory === 'all' || selectedCategory === 'free') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-[#4C5055] dark:text-[#94A3B8] uppercase">
                    {isAr ? 'الإيموجيات المجانية الافتراضية' : 'Default Free Reactions'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                    FREE
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">
                  <VolumeX size={12} />
                  <span>{isAr ? 'بدون صوت' : 'No Sound'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FREE_EMOJIS.map((item, idx) => (
                  <div
                    key={`free-emoji-${item.id}-${idx}`}
                    className="p-3.5 rounded-[18px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] flex flex-col items-center justify-center text-center space-y-2 relative"
                  >
                    <span className="text-4xl select-none">{item.emoji}</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#000000] dark:text-[#F8FAFC]">{item.name}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500">
                        <CheckCircle2 size={11} />
                        {isAr ? 'مفتوح دائماً' : 'Always Unlocked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. PURCHASABLE SHOP EMOJIS */}
          {(selectedCategory === 'all' || selectedCategory === 'shop') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold tracking-wider text-[#FF8F00] uppercase flex items-center gap-1">
                    {isAr ? 'إيموجيات المتجر الصوتية' : 'Sound Effects Shop'}
                  </span>
                  <span className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8]">
                    ({SHOP_EMOJIS.filter((e) => unlockedEmojis.includes(e.id)).length} / {SHOP_EMOJIS.length}{' '}
                    {isAr ? 'مفتوح' : 'Unlocked'})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#47A5FF] flex items-center gap-1">
                  <Volume2 size={12} />
                  {isAr ? 'صوت فريد لكل إيموجي' : 'Unique Audio Effect'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHOP_EMOJIS.map((item, idx) => {
                  const isUnlocked = unlockedEmojis.includes(item.id);
                  const isPreviewing = activePreviewingSound === item.soundId;
                  const canAfford = userCoins >= item.price;
                  const isBuying = buyingId === item.id;

                  return (
                    <div
                      key={`shop-emoji-${item.id}-${idx}`}
                      className={`p-3.5 rounded-[18px] border transition-all flex items-center justify-between gap-3 ${
                        isUnlocked
                          ? 'bg-[#F4F8FC] dark:bg-[#1A2234] border-emerald-500/40 shadow-xs'
                          : 'bg-[#F4F8FC] dark:bg-[#1A2234] border-[#D5E5F7] dark:border-[#222E46] hover:border-[#FF8F00]/50'
                      }`}
                    >
                      {/* Left: Emoji + Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl select-none shrink-0 shadow-inner relative ${
                            isUnlocked
                              ? 'bg-emerald-500/10 border border-emerald-500/20'
                              : 'bg-black/5 dark:bg-white/5 border border-[#D5E5F7] dark:border-[#222E46]'
                          }`}
                        >
                          {item.emoji}
                          {isPreviewing && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8F00] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF8F00]"></span>
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#000000] dark:text-[#F8FAFC] truncate">{item.name}</h4>
                            {isUnlocked && (
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-[#4C5055] dark:text-[#94A3B8] truncate">
                            {item.description}
                          </p>

                          {/* Test Sound Preview Button */}
                          <button
                            type="button"
                            onClick={() => handlePreviewSound(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase transition-all cursor-pointer min-h-[30px] ${
                              isPreviewing
                                ? 'bg-[#FF8F00] text-black scale-105 shadow-xs'
                                : 'bg-[#E2E8F0] dark:bg-[#222E46] text-[#000000] dark:text-[#F8FAFC] hover:bg-[#FF8F00]/20 hover:text-[#FF8F00]'
                            }`}
                            title="Preview sound effect"
                          >
                            <Volume2 size={12} className={isPreviewing ? 'animate-bounce' : ''} />
                            <span>{isPreviewing ? (isAr ? 'جاري العزف...' : 'Playing...') : isAr ? 'تجربة الصوت' : 'Play Sound'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Right: Buy / Unlocked Action */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {isUnlocked ? (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>{isAr ? 'مملوك' : 'Owned'}</span>
                          </div>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            disabled={isBuying}
                            onClick={() => handlePurchase(item)}
                            className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-xs min-h-[38px] ${
                              canAfford
                                ? 'bg-[#FF8F00] hover:bg-[#FFA726] text-black font-bold'
                                : 'bg-[#E2E8F0] dark:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8]'
                            }`}
                          >
                            <Coins size={13} className={canAfford ? 'text-black' : 'text-[#4C5055] dark:text-[#94A3B8]'} />
                            <span>{item.price}</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3.5 sm:p-4 border-t border-[#D5E5F7] dark:border-[#1E273C] bg-[#F4F8FC] dark:bg-[#1A2234] flex items-center justify-between text-xs text-[#4C5055] dark:text-[#94A3B8] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Info size={15} className="text-[#47A5FF] shrink-0" />
            <span className="truncate text-[11px]">
              {isAr
                ? 'الإيموجيات المشتراة تظل مفتوحة لحسابك دائماً وتعمل في كل الألعاب'
                : isFr
                ? 'Les émojis achetés restent débloqués à vie et fonctionnent dans tous les jeux'
                : 'Purchased emojis are permanently unlocked for all games'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEmojiShopOpen(false)}
            className="px-4 py-1.5 rounded-[10px] bg-white dark:bg-[#131A29] text-[#000000] dark:text-[#F8FAFC] border border-[#D5E5F7] dark:border-[#222E46] font-mono text-xs font-bold uppercase hover:bg-[#F0F6FF] transition-colors cursor-pointer shrink-0"
          >
            {isAr ? 'إغلاق' : isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
