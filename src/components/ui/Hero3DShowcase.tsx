import React from 'react';
import { Users, Trophy, Radio, ArrowRight } from 'lucide-react';
import heroCardsImage from '../../assets/images/rakcha_hero_banner_1787824547771.jpg';
import { useApp } from '../../context/AppContext';

interface Hero3DShowcaseProps {
  onQuickPlay?: () => void;
  onExploreRooms?: () => void;
}

export const Hero3DShowcase: React.FC<Hero3DShowcaseProps> = ({
  onExploreRooms,
}) => {
  const { language, t, rooms } = useApp();

  // Count active rooms
  const activeRoomsCount = rooms.filter(
    (r) => r.status === 'waiting' || r.status === 'in_progress'
  ).length;

  return (
    <div
      className="relative w-full rounded-[16px] overflow-hidden bg-white dark:bg-[#1E293B] border border-[#D5E5F7] dark:border-[#334155] shadow-xs select-none transition-all"
    >
      {/* 3D Artwork Image Background with Smooth App-Themed Blending */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={heroCardsImage}
          alt="RAKCHA Game Cards Artwork"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-right sm:object-center opacity-60 dark:opacity-45 transform-gpu scale-100 transition-transform duration-700"
        />

        {/* Directional Gradient Overlay matching Light & Dark themes for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/80 to-white/20 dark:from-[#1E293B] dark:via-[#1E293B]/95 sm:dark:via-[#1E293B]/80 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 dark:from-[#1E293B]/90 via-transparent to-transparent" />
      </div>

      {/* Banner Content */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between min-h-[170px] sm:min-h-[190px]">
        {/* Top Tag & Title */}
        <div className="space-y-2 max-w-md sm:max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#47A5FF]/10 dark:bg-[#47A5FF]/20 border border-[#47A5FF]/30 text-[10px] font-mono font-bold text-[#47A5FF] uppercase tracking-wider">
            <span>🇹🇳 {t('authenticCardGames')}</span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#000000] dark:text-[#F8FAFC] leading-snug">
            {language === 'ar' ? (
              <>
                العب <span className="text-[#47A5FF]">مع أصحابك</span> في الوقت الفعلي 🇹🇳
              </>
            ) : (
              <>
                Play <span className="text-[#47A5FF]">Together</span> in Real-Time 🇹🇳
              </>
            )}
          </h1>

          <p className="text-xs text-[#4C5055] dark:text-[#94A3B8] font-normal leading-relaxed">
            {language === 'ar'
              ? 'ميكانك، بيلوت، أونو وألعاب جماعية ممتعة — انضم للغرف المباشرة وتحدى أصحابك الآن.'
              : 'Mecanque, Belote, Uno & card games — join live multiplayer tables or create your private room.'}
          </p>
        </div>

        {/* Features & Quick Action Row */}
        <div className="pt-3.5 mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#D5E5F7] dark:border-[#334155]">
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#4C5055] dark:text-[#94A3B8]">
            <span className="flex items-center gap-1.5 font-semibold text-[#000000] dark:text-[#F8FAFC]">
              <Trophy size={13} className="text-[#FF8F00]" />
              <span>{t('liveStreaks')}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-semibold text-[#000000] dark:text-[#F8FAFC]">
              <Users size={13} className="text-[#47A5FF]" />
              <span>{t('multiplayer')}</span>
            </span>
            {activeRoomsCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#10B981] font-bold">
                  <Radio size={11} className="animate-pulse" />
                  <span>{activeRoomsCount} {t('roomsLive')}</span>
                </span>
              </>
            )}
          </div>

          {onExploreRooms && (
            <button
              type="button"
              onClick={onExploreRooms}
              className="px-3.5 py-1.5 rounded-[9px] bg-[#47A5FF] hover:bg-[#3A92EE] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ml-auto"
            >
              <span>{t('viewRooms')}</span>
              <ArrowRight size={13} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


