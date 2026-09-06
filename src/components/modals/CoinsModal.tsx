import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins, Play, ShieldAlert, Check, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrimaryButton } from '../ui';
import { showRewardedAdIfReady, preloadRewardedAd } from '../../services/adService';
import { Capacitor } from '@capacitor/core';
import { SimulatedAdPlayerModal } from './SimulatedAdPlayerModal';

interface CoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoinsModal: React.FC<CoinsModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, addCoins, language } = useApp();
  const isFr = language === 'fr';
  const isAr = language === 'ar';
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [showSimulatedAd, setShowSimulatedAd] = useState(false);
  const [adSuccess, setAdSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rewardClaims, setRewardClaims] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('af_reward_claims');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isOpen) {
      preloadRewardedAd().catch(() => {});
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const coins = userProfile.coins ?? 300;

  const processAdReward = (earned: boolean) => {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const recentClaims = rewardClaims.filter(timestamp => now - timestamp < ONE_DAY);

    if (earned) {
      addCoins(10, 'Reward Ad');
      const updatedClaims = [...recentClaims, Date.now()];
      setRewardClaims(updatedClaims);
      localStorage.setItem('af_reward_claims', JSON.stringify(updatedClaims));
      
      setAdSuccess(true);
      setTimeout(() => setAdSuccess(false), 3000);
    } else {
      setErrorMessage(
        isAr
          ? 'لم يتم إكمال مشاهدة الإعلان أو تم إلغاؤه.'
          : isFr
          ? 'Publicité annulée avant la fin.'
          : 'Ad was cancelled before completion.'
      );
    }
  };

  const handleWatchAd = async () => {
    if (isWatchingAd) return;

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Filter recent claims
    const recentClaims = rewardClaims.filter(timestamp => now - timestamp < ONE_DAY);
    if (recentClaims.length >= 10) {
      setErrorMessage(isAr ? 'الحد الأقصى (10 يوميًا). حاول غدًا.' : isFr ? 'Limite quotidienne atteinte (10/24h). Réessayez demain.' : 'Daily limit reached (10/24h). Try again later.');
      return;
    }

    setIsWatchingAd(true);
    setErrorMessage(null);
    setAdSuccess(false);

    try {
      if (Capacitor.isNativePlatform()) {
        const rewardEarned = await showRewardedAdIfReady();
        processAdReward(rewardEarned);
        setIsWatchingAd(false);
      } else {
        // Open interactive simulated ad player modal on Web
        setShowSimulatedAd(true);
      }
    } catch (error) {
      setErrorMessage(isAr ? 'حدث خطأ أثناء تحميل الإعلان.' : isFr ? 'Échec de l\'affichage de la publicité.' : 'Failed to show ad.');
      setIsWatchingAd(false);
    }
  };

  const handleSimulatedAdComplete = (earned: boolean) => {
    setShowSimulatedAd(false);
    setIsWatchingAd(false);
    processAdReward(earned);
  };

  return (
    <>
      <AnimatePresence>
        <div key="coins-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-t-[16px] sm:rounded-[16px] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E273C] p-5 sm:p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] shadow-2xl space-y-5 text-[#000000] dark:text-[#F8FAFC]"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D5E5F7] dark:border-[#1E273C] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-[10px] bg-[#F0F6FF] dark:bg-[#1E273C] text-[#FF8F00] border border-[#D5E5F7] dark:border-[#222E46]">
                <Coins size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#000000] dark:text-[#F8FAFC]">
                  {isAr ? 'رصيد الـCoins' : isFr ? 'Solde de Coins' : 'Coins Balance'}
                </h3>
                <p className="text-xs text-[#4C5055] dark:text-[#94A3B8]">
                  {isAr ? 'استخدم الـCoins لدخول المباريات' : isFr ? 'Utilisez les coins pour participer aux parties' : 'Use coins to enter game matches'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-[8px] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#4C5055] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Current Balance Display */}
          <div className="relative overflow-hidden rounded-[16px] bg-[#F4F8FC] dark:bg-[#1A2234] p-5 text-center shadow-xs border border-[#D5E5F7] dark:border-[#222E46]">
            <span className="text-[10px] font-mono tracking-widest text-[#4C5055] dark:text-[#94A3B8] uppercase font-medium">
              {isAr ? 'رصيدك الحالي' : isFr ? 'VOTRE SOLDE ACTUEL' : 'YOUR CURRENT BALANCE'}
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 my-2">
              <Coins size={28} strokeWidth={1.75} className="text-[#FF8F00]" />
              <span className="text-4xl font-bold tracking-tight font-mono text-[#000000] dark:text-[#F8FAFC]">
                {coins.toLocaleString()}
              </span>
              <span className="text-base font-bold text-[#FF8F00]">Coins</span>
            </div>
            <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] max-w-xs mx-auto font-normal leading-relaxed">
              {isAr
                ? 'تبدأ بـ 300 Coins. كل مباراة تتطلب Entry Cost وتكسب Reward عند الفوز!'
                : isFr
                ? 'Vous commencez avec 300 Coins. Chaque partie requiert des coins d\'entrée. Le gagnant remporte la mise !'
                : 'Start with 300 Coins. Each room requires an Entry Cost. Winners gain coins!'}
            </p>
          </div>

          {/* Earn Coins Section */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono tracking-widest text-[#4C5055] dark:text-[#94A3B8] uppercase font-medium">
              {isAr ? 'احصل على Coins إضافية' : isFr ? 'OBTENIR DES COINS' : 'EARN EXTRA COINS'}
            </span>

            {/* Watch Ad Button */}
            <button
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              className="w-full group flex items-center justify-between p-3.5 rounded-[16px] bg-[#F4F8FC] dark:bg-[#1A2234] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] border border-[#D5E5F7] dark:border-[#222E46] hover:border-[#FF8F00] transition-all text-left active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[10px] bg-white dark:bg-[#131A29] text-[#FF8F00] border border-[#D5E5F7] dark:border-[#222E46]">
                  <Play size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#000000] dark:text-[#F8FAFC]">
                      {isAr ? 'شاهد إعلانًا' : isFr ? 'Regarder une vidéo' : 'Watch Short Ad'}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-[#FF8F00]/15 text-[#FF8F00] border border-[#FF8F00]/30">
                      +10 Coins
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4C5055] dark:text-[#94A3B8] mt-0.5">
                    {isAr ? 'شاهد فيديو قصير للحصول على 10 مجانًا' : isFr ? 'Regardez une courte vidéo pour gagner 10 coins' : 'Watch a quick reward video'}
                  </p>
                </div>
              </div>

              {isWatchingAd ? (
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#4C5055] dark:text-[#94A3B8]">
                  <RotateCcw size={16} strokeWidth={1.75} className="animate-spin text-[#FF8F00]" />
                  <span>...</span>
                </div>
              ) : adSuccess ? (
                <div className="flex items-center gap-1 text-xs font-semibold text-[#10B981]">
                  <Check size={16} strokeWidth={1.75} />
                  <span>+10</span>
                </div>
              ) : (
                <span className="text-xs font-semibold font-mono text-[#4C5055] dark:text-[#94A3B8] group-hover:text-[#FF8F00] group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              )}
            </button>
            {errorMessage && (
              <p className="text-[11px] text-[#EF4444] mt-1 px-1 font-normal leading-tight">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Virtual Currency Disclaimer Notice */}
          <div className="p-3 rounded-[14px] bg-[#F4F8FC] dark:bg-[#1A2234] border border-[#D5E5F7] dark:border-[#222E46] flex items-start gap-2.5 text-[#4C5055] dark:text-[#94A3B8] text-[11px] leading-relaxed">
            <ShieldAlert size={16} strokeWidth={1.75} className="shrink-0 mt-0.5 text-[#FF8F00]" />
            <p>
              {isAr
                ? 'ملاحظة: الـCoins هي عملة افتراضية داخل اللعبة فقط وليست أموالاً حقيقية ولا يمكن سحبها أو تحويلها لمبالغ مالية.'
                : isFr
                ? 'Note : Les coins sont une monnaie virtuelle de jeu uniquement. Ils n\'ont aucune valeur monétaire réelle et ne peuvent pas être retirés.'
                : 'Note: Coins are virtual in-game points only. They carry no real-world monetary value and cannot be withdrawn as cash.'}
            </p>
          </div>

          {/* Action Button */}
          <PrimaryButton onClick={onClose} size="lg">
            {language === 'ar' ? 'تم' : 'Got It'}
          </PrimaryButton>
        </motion.div>
        </div>
      </AnimatePresence>

      {/* Interactive Web Video Ad Player Modal */}
      <SimulatedAdPlayerModal
        isOpen={showSimulatedAd}
        onComplete={handleSimulatedAdComplete}
        language={language}
      />
    </>
  );
};

