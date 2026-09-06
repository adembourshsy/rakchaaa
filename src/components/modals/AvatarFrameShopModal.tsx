import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Award,
  Coins,
  Check,
  ShieldCheck,
  Flame,
  Crown,
  Zap,
  Globe,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AVATAR_FRAMES, AvatarFrame, FrameCategory, getAvatarFrameById } from '../../data/avatarFrames';
import { AvatarFrameRing } from '../ui/AvatarFrameRing';
import { getAvatarUrl } from '../../data/mockData';

export interface AvatarFrameShopModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AvatarFrameShopModal: React.FC<AvatarFrameShopModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    userProfile,
    language,
    buyAvatarFrame,
    equipAvatarFrame,
    setIsCoinsModalOpen,
    isFrameShopOpen,
    setIsFrameShopOpen,
  } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isFrameShopOpen;
  const onClose = propOnClose || (() => setIsFrameShopOpen(false));

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const userCoins = userProfile.coins ?? 300;
  const unlockedFrames = userProfile.unlockedFrames || ['default'];
  const activeEquippedId = userProfile.equippedFrame || 'default';

  const [selectedCategory, setSelectedCategory] = useState<FrameCategory>('all');
  const [previewFrameId, setPreviewFrameId] = useState<string>(activeEquippedId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const previewFrame = getAvatarFrameById(previewFrameId);
  const isPreviewOwned = previewFrame.isFree || unlockedFrames.includes(previewFrame.id);
  const isPreviewEquipped = activeEquippedId === previewFrame.id;

  const filteredFrames = AVATAR_FRAMES.filter((f) => {
    if (selectedCategory === 'all') return true;
    return f.category === selectedCategory;
  });

  const categories: { id: FrameCategory; labelAr: string; labelFr: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'all', labelAr: 'الكل', labelFr: 'Tous', labelEn: 'All Frames', icon: <Star size={13} /> },
    { id: 'elemental', labelAr: 'عناصر الطبيعة (نار/ثلج/ماء)', labelFr: 'Éléments', labelEn: 'Elemental', icon: <Flame size={13} /> },
    { id: 'royal', labelAr: 'ملكي وفاخر (ذهب/ألماس)', labelFr: 'Royal & Or', labelEn: 'Royal & Gold', icon: <Crown size={13} /> },
    { id: 'cosmic', labelAr: 'فضاء وسايبر', labelFr: 'Cosmique & Cyber', labelEn: 'Cosmic & Cyber', icon: <Zap size={13} /> },
    { id: 'special', labelAr: 'إطارات خاصة', labelFr: 'Spécial', labelEn: 'Special & Rare', icon: <Award size={13} /> },
  ];

  const getRarityBadge = (rarity: AvatarFrame['rarity']) => {
    switch (rarity) {
      case 'mythic':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400';
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-300';
      case 'epic':
        return 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-purple-300';
      case 'rare':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/40';
    }
  };

  const handleBuy = async (frame: AvatarFrame) => {
    if (userCoins < frame.price) {
      setErrorToast(
        isAr
          ? 'رصيد الـCoins غير كافٍ! شاهد إعلانات أو اربح مباريات لجمع المزيد.'
          : isFr
          ? 'Coins insuffisants ! Regardez des vidéos ou gagnez des parties.'
          : 'Insufficient coins! Win matches to earn more.'
      );
      setTimeout(() => setErrorToast(null), 3500);
      return;
    }

    try {
      setIsProcessing(true);
      const res = await buyAvatarFrame(frame.id);
      if (res.success) {
        setSuccessToast(
          isAr
            ? `تم شراء وتجهيز "${frame.nameAr}" بنجاح!`
            : isFr
            ? `Cadre "${frame.nameFr}" acheté et équipé !`
            : `Equipped "${frame.name}" badge successfully!`
        );
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        setErrorToast(res.error || 'Failed to purchase frame');
        setTimeout(() => setErrorToast(null), 3500);
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Error occurred');
      setTimeout(() => setErrorToast(null), 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquip = async (frame: AvatarFrame) => {
    try {
      setIsProcessing(true);
      await equipAvatarFrame(frame.id);
      setSuccessToast(
        isAr
          ? `تم تجهيز "${frame.nameAr}"!`
          : isFr
          ? `Cadre "${frame.nameFr}" équipé !`
          : `Equipped "${frame.name}"!`
      );
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorToast(err.message || 'Failed to equip frame');
      setTimeout(() => setErrorToast(null), 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="avatar-frame-shop-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-[#131A29] text-[#000000] dark:text-[#F8FAFC] rounded-t-[24px] sm:rounded-[24px] border border-[#D5E5F7] dark:border-[#1E273C] shadow-2xl overflow-hidden"
        >
          {/* Top Header */}
          <div className="p-4 sm:p-5 border-b border-[#D5E5F7] dark:border-[#1E273C] bg-[#F4F8FC] dark:bg-[#1A2234] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-[#FF8F00] to-[#FFA726] text-black flex items-center justify-center shadow-md font-bold">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-[#000000] dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <span>{isAr ? 'متجر إطارات وبادجات البروفايل' : isFr ? 'Boutique Cadres de Profil' : 'Avatar Frames & Badges Shop'}</span>
                </h3>
                <p className="text-xs text-[#4C5055] dark:text-[#94A3B8]">
                  {isAr
                    ? 'إطارات دائرية نارية وثري دي متحركة حول صورتك'
                    : isFr
                    ? 'Effets visuels et auras animées pour votre profil'
                    : 'Animated glowing circular aura frames for your profile'}
                </p>
              </div>
            </div>

            {/* Coins Balance Chip */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  setIsCoinsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#222E46] text-[#FF8F00] text-xs font-mono font-bold hover:scale-105 transition-transform cursor-pointer shadow-xs"
                title={isAr ? 'احصل على المزيد من العملات' : 'Get more coins'}
              >
                <Coins size={14} className="text-[#FF8F00]" />
                <span>{userCoins.toLocaleString()}</span>
                <span className="text-[10px] text-[#4C5055] dark:text-[#94A3B8] opacity-80">+</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Toast Notification Alert */}
          {successToast && (
            <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-2 text-center shrink-0">
              <CheckCircle2 size={15} />
              <span>{successToast}</span>
            </div>
          )}

          {errorToast && (
            <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold flex items-center justify-center gap-2 text-center shrink-0">
              <span>{errorToast}</span>
            </div>
          )}

          {/* Interactive Live Avatar Mirror / Preview Hero */}
          <div className="p-4 sm:p-5 bg-[#F4F8FC] dark:bg-[#1A2234] border-b border-[#D5E5F7] dark:border-[#1E273C] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
              {/* Dynamic Live Avatar with selected frame */}
              <div className="relative p-2">
                <AvatarFrameRing frameId={previewFrame.id} size="xl">
                  <img loading="lazy" decoding="async" src={getAvatarUrl(userProfile.avatarUrl)}
                    alt={userProfile.name}
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                </AvatarFrameRing>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-[#000000] dark:text-[#F8FAFC]">
                    {isAr ? previewFrame.nameAr : isFr ? previewFrame.nameFr : previewFrame.name}
                  </h4>
                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md border ${getRarityBadge(previewFrame.rarity)}`}>
                    {previewFrame.rarity}
                  </span>
                </div>
                <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] max-w-xs leading-relaxed">
                  {isAr ? previewFrame.descriptionAr : isFr ? previewFrame.descriptionFr : previewFrame.description}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] font-mono">
                  {isPreviewEquipped ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Check size={12} strokeWidth={2.5} />
                      {isAr ? 'الإطار المجهز حالياً' : 'Currently Equipped'}
                    </span>
                  ) : isPreviewOwned ? (
                    <span className="text-sky-500 font-medium">
                      {isAr ? 'مملوك في حقيبتك' : 'Unlocked in Inventory'}
                    </span>
                  ) : (
                    <span className="text-[#FF8F00] font-bold flex items-center gap-1">
                      <Coins size={12} />
                      {previewFrame.price} Coins
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button for Previewed Item */}
            <div className="w-full sm:w-auto shrink-0">
              {isPreviewEquipped ? (
                <button
                  disabled
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[12px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-default"
                >
                  <Check size={15} strokeWidth={2.5} />
                  <span>{isAr ? 'مجهز ومفعل' : 'Active Frame'}</span>
                </button>
              ) : isPreviewOwned ? (
                <button
                  onClick={() => handleEquip(previewFrame)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-[12px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={15} />
                  <span>{isAr ? 'تجهيز الإطار' : 'Equip Badge'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(previewFrame)}
                  disabled={isProcessing}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-[12px] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    userCoins >= previewFrame.price
                      ? 'bg-[#FF8F00] hover:bg-[#FFA726] text-black font-bold'
                      : 'bg-[#E2E8F0] dark:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] opacity-80 cursor-not-allowed'
                  }`}
                >
                  <Coins size={15} />
                  <span>
                    {isAr
                      ? `شراء بـ ${previewFrame.price} Coins`
                      : isFr
                      ? `Acheter (${previewFrame.price} Coins)`
                      : `Buy (${previewFrame.price} Coins)`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="p-3 bg-white dark:bg-[#131A29] border-b border-[#D5E5F7] dark:border-[#1E273C] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {categories.map((cat, idx) => (
              <button
                key={`cat-${cat.id}-${idx}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#FF8F00] text-black font-bold shadow-xs'
                    : 'bg-[#F4F8FC] dark:bg-[#1A2234] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] border border-[#D5E5F7] dark:border-[#222E46]'
                }`}
              >
                {cat.icon}
                <span>{isAr ? cat.labelAr : isFr ? cat.labelFr : cat.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Frames Catalog Grid (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredFrames.map((frame, idx) => {
                const isOwned = frame.isFree || unlockedFrames.includes(frame.id);
                const isEquipped = activeEquippedId === frame.id;
                const isSelected = previewFrameId === frame.id;
                const canAfford = userCoins >= frame.price;

                return (
                  <div
                    key={`frame-${frame.id}-${idx}`}
                    onClick={() => setPreviewFrameId(frame.id)}
                    className={`p-3.5 rounded-[18px] border transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0F6FF] dark:bg-[#1E273C] border-[#FF8F00] shadow-sm ring-1 ring-[#FF8F00]'
                        : isEquipped
                        ? 'bg-[#F4F8FC] dark:bg-[#1A2234] border-emerald-500/50 shadow-xs'
                        : 'bg-[#F4F8FC] dark:bg-[#1A2234] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] border-[#D5E5F7] dark:border-[#222E46]'
                    }`}
                  >
                    {/* Top Row: Mini Preview Ring + Title & Rarity */}
                    <div className="flex items-center gap-3">
                      <div className="p-1 shrink-0">
                        <AvatarFrameRing frameId={frame.id} size="md">
                          <img loading="lazy" decoding="async" src={getAvatarUrl(userProfile.avatarUrl)}
                            alt={frame.name}
                            className="w-full h-full object-cover select-none"
                            referrerPolicy="no-referrer"
                          />
                        </AvatarFrameRing>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h5 className="text-xs font-bold text-[#000000] dark:text-[#F8FAFC] truncate">
                            {isAr ? frame.nameAr : isFr ? frame.nameFr : frame.name}
                          </h5>
                          <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${getRarityBadge(frame.rarity)}`}>
                            {frame.rarity}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#4C5055] dark:text-[#94A3B8] line-clamp-1 mt-0.5">
                          {isAr ? frame.descriptionAr : isFr ? frame.descriptionFr : frame.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Price / Status + Action Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#D5E5F7] dark:border-[#222E46]">
                      <div>
                        {isEquipped ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-500 flex items-center gap-1">
                            <Check size={13} strokeWidth={2.5} />
                            {isAr ? 'مجهز' : 'Active'}
                          </span>
                        ) : isOwned ? (
                          <span className="text-[11px] font-mono text-sky-500 font-medium">
                            {isAr ? 'مفتوح' : 'Unlocked'}
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold text-[#FF8F00] flex items-center gap-1">
                            <Coins size={13} />
                            {frame.price} Coins
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isEquipped ? (
                          <span className="px-3 py-1 rounded-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] font-mono font-bold">
                            ✓ {isAr ? 'مفعل' : 'Equipped'}
                          </span>
                        ) : isOwned ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(frame);
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1 rounded-[10px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-[10px] font-mono font-bold uppercase transition-all active:scale-95 cursor-pointer shadow-xs"
                          >
                            {isAr ? 'تجهيز' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuy(frame);
                            }}
                            disabled={isProcessing || !canAfford}
                            className={`px-3 py-1 rounded-[10px] text-[10px] font-mono font-bold uppercase transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer ${
                              canAfford
                                ? 'bg-[#FF8F00] hover:bg-[#FFA726] text-black font-bold'
                                : 'bg-[#E2E8F0] dark:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] cursor-not-allowed opacity-70'
                            }`}
                          >
                            <span>{isAr ? 'شراء' : 'Buy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-3.5 bg-[#F4F8FC] dark:bg-[#1A2234] border-t border-[#D5E5F7] dark:border-[#1E273C] flex items-center justify-between text-xs text-[#4C5055] dark:text-[#94A3B8] shrink-0">
            <span className="text-[11px]">
              {isAr
                ? '⚡ الإطارات تظهر في البروفايل، غرف اللعب، واللوحات المتصدرة'
                : '⚡ Frames appear in profile, game tables & leaderboards'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-[10px] bg-white dark:bg-[#131A29] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#000000] dark:text-[#F8FAFC] border border-[#D5E5F7] dark:border-[#222E46] font-mono text-xs font-bold cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
