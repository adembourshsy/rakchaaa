import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Award, Play, AlertCircle } from 'lucide-react';

interface SimulatedAdPlayerModalProps {
  isOpen: boolean;
  onComplete: (rewardEarned: boolean) => void;
  language?: string;
}

const SPONSORS = [
  {
    brand: 'RAKCHA GAMING PASS',
    tagline: 'Le 1er Pass de Jeux en Tunisie ! Défiez vos amis en ligne',
    cta: 'Découvrir maintenant',
    bgGradient: 'from-[#FF8F00] via-[#D84315] to-[#2E241D]',
    accentColor: '#FFD166',
  },
  {
    brand: 'LAMMA HUB CARDS',
    tagline: 'Des tournois exclusifs de Rami, Belote & L\'Intrus 24/7',
    cta: 'Rejoindre la Lamma',
    bgGradient: 'from-[#00897B] via-[#004D40] to-[#1A237E]',
    accentColor: '#4DB6AC',
  },
  {
    brand: 'OMOUR MECANQUE VIP',
    tagline: 'Testez vos connaissances automobiles & gagnez des badges rares',
    cta: 'Jouer en Solo & Duo',
    bgGradient: 'from-[#C2185B] via-[#880E4F] to-[#311B92]',
    accentColor: '#FF4081',
  },
];

export const SimulatedAdPlayerModal: React.FC<SimulatedAdPlayerModalProps> = ({
  isOpen,
  onComplete,
  language = 'fr',
}) => {
  const isAr = language === 'ar';
  const isFr = language === 'fr';

  const [timeLeft, setTimeLeft] = useState(5);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sponsor] = useState(() => SPONSORS[Math.floor(Math.random() * SPONSORS.length)]);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(5);
      setIsCompleted(false);
      setShowExitConfirm(false);
      return;
    }

    setTimeLeft(5);
    setIsCompleted(false);
    setShowExitConfirm(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = ((5 - timeLeft) / 5) * 100;

  const handleCloseAttempt = () => {
    if (isCompleted) {
      onComplete(true);
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleConfirmAbandon = () => {
    setShowExitConfirm(false);
    onComplete(false);
  };

  return (
    <AnimatePresence>
      <div key="simulated-ad-player-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg overflow-hidden rounded-[24px] bg-[#1A1410] border border-[#3A2F27] shadow-2xl flex flex-col"
        >
          {/* Top Bar - Ad Controls */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#241D18] border-b border-[#3A2F27] text-[#B8ABA0] text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-[6px] bg-[#FFD166]/15 text-[#FFD166] border border-[#FFD166]/30 font-mono font-bold text-[10px] tracking-wider uppercase">
                {isAr ? 'إعلان ممرع' : 'Publicité Sponsorisée'}
              </span>
              <span className="text-[11px] text-[#B8ABA0]">1 / 1</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-full hover:bg-[#2E241D] text-[#B8ABA0] hover:text-[#F5EFE6] transition-colors cursor-pointer"
                title={isMuted ? 'Activer le son' : 'Désactiver le son'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <button
                onClick={handleCloseAttempt}
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-[#2EE6A6] text-[#0F291E] shadow-lg animate-pulse'
                    : 'bg-[#2E241D] text-[#B8ABA0] hover:text-white border border-[#3A2F27]'
                }`}
              >
                {isCompleted
                  ? isAr
                    ? 'إغلاق واستلام +10'
                    : 'Obtenir la récompense ✕'
                  : `${isAr ? 'تخطي بعد' : 'Ignorer dans'} ${timeLeft}s`}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#241D18] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD166] to-[#2EE6A6] transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Simulated Video Canvas Frame */}
          <div className={`relative h-64 sm:h-72 w-full bg-gradient-to-br ${sponsor.bgGradient} p-6 flex flex-col justify-between items-center text-center overflow-hidden`}>
            {/* Ambient Background Decorative Elements */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-black/30 rounded-full blur-2xl pointer-events-none" />

            {/* Video Watermark Header */}
            <div className="z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium tracking-wide">
              <Play size={12} className="fill-white text-white" />
              <span>{sponsor.brand}</span>
            </div>

            {/* Main Video Animation Body */}
            <div className="z-10 my-auto flex flex-col items-center space-y-3">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-20 h-20 rounded-2xl bg-black/30 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl text-[#FFD166]"
              >
                {isCompleted ? (
                  <Award size={44} className="text-[#2EE6A6] drop-shadow-md animate-bounce" />
                ) : (
                  <Play size={40} className="text-[#FFD166] drop-shadow-md" />
                )}
              </motion.div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
                  {sponsor.brand}
                </h3>
                <p className="text-xs text-white/80 max-w-xs mt-1 leading-snug drop-shadow-xs font-normal">
                  {sponsor.tagline}
                </p>
              </div>
            </div>

            {/* Bottom Status Badge */}
            <div className="z-10 w-full">
              {isCompleted ? (
                <div className="py-2 px-4 rounded-xl bg-[#2EE6A6] text-[#0F291E] font-bold text-sm flex items-center justify-center gap-2 shadow-xl animate-fade-in">
                  <Award size={18} />
                  <span>
                    {isAr ? 'تمت مشاهدة الإعلان! +10 Coins مضاف بنجاح 🎉' : 'Récompense Débloquée : +10 COINS ! 🎉'}
                  </span>
                </div>
              ) : (
                <div className="py-2 px-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs font-mono flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FFD166] animate-ping" />
                  <span>
                    {isAr
                      ? `جاري عرض الإعلان (${timeLeft} ثوانٍ متبقية)...`
                      : `Lecture de la vidéo (${timeLeft}s restantes)...`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Interactive Sponsor Banner */}
          <div className="p-4 bg-[#241D18] border-t border-[#3A2F27] flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-medium text-[#F5EFE6]">{sponsor.brand}</p>
              <p className="text-[11px] text-[#B8ABA0] line-clamp-1">{sponsor.cta}</p>
            </div>

            <button
              onClick={handleCloseAttempt}
              className={`px-4 py-2 rounded-[12px] font-medium text-xs transition-all shadow-md cursor-pointer shrink-0 ${
                isCompleted
                  ? 'bg-gradient-to-r from-[#FFD166] to-[#2EE6A6] text-[#1A1410] font-bold hover:brightness-110'
                  : 'bg-[#2E241D] text-[#F5EFE6] border border-[#3A2F27] hover:bg-[#3A2F27]'
              }`}
            >
              {isCompleted
                ? isAr
                  ? 'استلام الجائزة (+10)'
                  : 'Réclamer (+10 Coins)'
                : isAr
                ? 'زيارة الموقع'
                : 'En savoir plus'}
            </button>
          </div>

          {/* Abandon Confirmation Alert Drawer */}
          {showExitConfirm && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 z-20">
              <div className="w-full max-w-xs rounded-2xl bg-[#2E241D] border border-[#3A2F27] p-5 text-center space-y-4 shadow-2xl">
                <div className="mx-auto w-10 h-10 rounded-full bg-[#EF476F]/15 text-[#EF476F] border border-[#EF476F]/30 flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5EFE6]">
                    {isAr ? 'هل تريد المغادرة؟' : 'Quitter avant la fin ?'}
                  </h4>
                  <p className="text-xs text-[#B8ABA0] mt-1">
                    {isAr
                      ? 'إذا أغلقت الإعلان الآن فلن تحصل على الـ 10 Coins!'
                      : 'Si vous fermez la vidéo maintenant, vous ne recevrez pas les 10 Coins !'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="w-full py-2 rounded-xl bg-[#FFD166] text-[#1A1410] font-bold text-xs hover:brightness-105 cursor-pointer"
                  >
                    {isAr ? 'مواصلة المشاهدة' : 'Continuer la vidéo'}
                  </button>
                  <button
                    onClick={handleConfirmAbandon}
                    className="w-full py-2 rounded-xl bg-[#241D18] text-[#EF476F] font-medium text-xs hover:bg-[#1A1410] cursor-pointer"
                  >
                    {isAr ? 'إلغاء ومغادرة' : 'Abandonner la récompense'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
