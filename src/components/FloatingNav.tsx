import React from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Radio, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';

export const FloatingNav: React.FC = () => {
  const { activeTab, setActiveTab, t, joinedRoom, activeView } = useApp();

  const isInProtectedSession =
    joinedRoom != null &&
    (joinedRoom.status === 'waiting' || joinedRoom.status === 'in_progress');

  if (isInProtectedSession || activeView === 'game' || activeView === 'waiting_room') {
    return null;
  }

  const navItems: { id: NavTab; labelKey: string; icon: React.ElementType }[] = [
    { id: 'home', labelKey: 'home', icon: LayoutGrid },
    { id: 'rooms', labelKey: 'rooms', icon: Radio },
    { id: 'settings', labelKey: 'settings', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Solid opaque backdrop layer BEHIND the floating rounded nav pill.
          This is the actual fix: previously nothing occupied the strip of
          screen between the page content and the Android system nav area
          except the nav wrapper itself, which is `pointer-events-none` and
          has no background — so scrolling content showed straight through
          the transparent gaps around/under the rounded pill. This layer is
          `fixed` (its own stacking context) so it always paints above the
          normal-flow scrolling content, is `pointer-events-none` so it never
          intercepts taps, sits at a lower z-index than the pill itself so
          the pill still renders on top of it, and reuses the exact same
          background used by the app shell (MobileContainer) so it blends
          seamlessly instead of introducing a visibly different flat color.
          Its height = the pill's own floating offset from the bottom
          (env(safe-area-inset-bottom) aware, identical formula to the pill
          below) + the pill's approximate height + a small buffer, so it
          reliably covers the pill's full footprint down through the safe
          area on every device without a hardcoded/guessed screen height. */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none h-[calc(max(0.75rem,calc(env(safe-area-inset-bottom)+0.25rem))+4.5rem)] bg-gradient-to-br from-[#F4F7FC] via-[#EBF2FC] to-[#F0F5FD] dark:from-[#0A0E17] dark:via-[#0F1626] dark:to-[#070A12]"
      />

      <div className="fixed bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.25rem))] left-0 right-0 z-40 flex justify-center items-center pointer-events-none px-3 select-none">
        <motion.nav
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#222E46] rounded-full shadow-md max-w-[calc(100vw-1.5rem)]"
        >
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = t(item.labelKey);

            return (
              <button
                key={`nav-item-${item.id}-${idx}`}
                onClick={() => setActiveTab(item.id)}
                className="relative flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 min-h-[44px] rounded-full text-xs font-medium tracking-wider uppercase transition-colors duration-200 focus:outline-none active:scale-95 touch-manipulation select-none shrink-0 cursor-pointer group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavDockPill"
                    className="absolute inset-0 bg-[#EBF4FF] dark:bg-[#38BDF8]/20 border border-[#47A5FF]/40 dark:border-[#38BDF8]/40 rounded-full shadow-xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center shrink-0">
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    className={`transition-colors duration-200 ${
                      isActive
                        ? 'text-[#47A5FF] dark:text-[#38BDF8]'
                        : 'text-[#4C5055] dark:text-[#94A3B8] group-hover:text-[#000000] dark:group-hover:text-[#F8FAFC]'
                    }`}
                  />
                </span>
                <span
                  className={`relative z-10 text-[10px] sm:text-[11px] font-mono transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'text-[#47A5FF] dark:text-[#38BDF8] font-bold'
                      : 'text-[#4C5055] dark:text-[#94A3B8] group-hover:text-[#000000] dark:group-hover:text-[#F8FAFC] font-normal'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </motion.nav>
      </div>
    </>
  );
};

