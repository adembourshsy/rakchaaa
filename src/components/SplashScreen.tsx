import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LammaHubLogoIcon, RakchaGameTextSvg } from './brand/LammaHubLogo';
import { ThreeDToken, ThreeDDice } from './ui/ThreeDGameElements';
import { hideNativeSplash } from '../native/nativeShell';
import { useApp } from '../context/AppContext';
import { useDevicePerformance } from '../hooks/useDevicePerformance';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

// The "rich" experience gets the full duration; on a low-end device we skip
// straight past most of it — a long fake-loading animation is the last
// thing a slow phone needs while it's also trying to boot the WebView, warm
// up Firebase, etc.
const RICH_DURATION_MS = 2600;
const LITE_DURATION_MS = 1100;

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs,
}) => {
  const { t, reducedMotion, batterySaver } = useApp();

  // Respect the user's own Settings toggles (Reduced Motion / Battery Saver)
  // in addition to the automatic device heuristics — either one is enough
  // to switch to the lightweight splash.
  const { isLowEnd } = useDevicePerformance(reducedMotion || batterySaver);

  const effectiveDuration = durationMs ?? (isLowEnd ? LITE_DURATION_MS : RICH_DURATION_MS);

  const [progress, setProgress] = useState(0);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        void hideNativeSplash();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    const stepTime = effectiveDuration / 25;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, stepTime);

    const finishTimer = setTimeout(() => {
      onFinishRef.current?.();
    }, effectiveDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(finishTimer);
    };
  }, [effectiveDuration]);

  // Precompute a couple of tiny inline flags so the JSX below stays readable —
  // this is the ONLY branch point between the two visual variants; the
  // component structure is otherwise identical, which keeps the code
  // maintainable instead of forking into two near-duplicate components.
  const glowEnabled = !isLowEnd;
  const loopingAnimEnabled = !isLowEnd;

  return (
    <motion.div
      key="rakcha_splash_screen"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: isLowEnd ? 1 : 1.04,
        transition: { duration: isLowEnd ? 0.2 : 0.4, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={() => onFinishRef.current?.()}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#0B0E17] text-white px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8 select-none overflow-hidden touch-none cursor-pointer"
    >
      {/* Radiant Glowing Background Lights — GPU-expensive `blur()` filters,
          skipped entirely on low-end devices in favor of a plain gradient
          wash below, so the very first screen a slow phone renders isn't
          also its heaviest one. */}
      {glowEnabled ? (
        <>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-blue-600/20 rounded-full blur-[90px] pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-blue-600/10 pointer-events-none" />
      )}

      {/* Geometric Grid Pattern — plain background-image, no filter cost either way */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Brand Pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase font-bold tracking-widest shadow-[0_0_15px_rgba(251,191,36,0.2)]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>{t('welcomeToRakcha')}</span>
      </motion.div>

      {/* Center Prominent RAKCHA GAME Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: isLowEnd ? 0.3 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-xs sm:max-w-sm px-4"
      >
        {/* Glowing Logo Icon Card, flanked by the SAME 3D token/dice motifs
            used inside an active game table (see ThreeDGameElements), so the
            very first thing players see already speaks the game's visual
            language instead of being a generic app-branding screen. These
            are cheap: solid gradients + tiny borders, no blur/backdrop-filter. */}
        <div className="relative mb-6 flex items-center justify-center gap-3">
          {!isLowEnd && (
            <motion.div
              initial={{ opacity: 0, x: -8, rotate: -8 }}
              animate={{ opacity: 1, x: 0, rotate: -8 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="hidden sm:block"
            >
              <ThreeDDice size={34} />
            </motion.div>
          )}

          <motion.div
            animate={loopingAnimEnabled ? { scale: [1, 1.03, 1] } : undefined}
            transition={loopingAnimEnabled ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } : undefined}
            className="relative p-5 rounded-3xl bg-slate-900/90 border-2 border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.35)] flex items-center justify-center"
          >
            <LammaHubLogoIcon sizePx={72} />
          </motion.div>

          {!isLowEnd && (
            <motion.div
              initial={{ opacity: 0, x: 8, rotate: 8 }}
              animate={{ opacity: 1, x: 0, rotate: 8 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="hidden sm:block"
            >
              <ThreeDToken label="RAKCHA" size={34} />
            </motion.div>
          )}
        </div>

        {/* High-Contrast RAKCHA GAME Text Component */}
        <div className="w-full flex justify-center py-1">
          <RakchaGameTextSvg heightPx={56} />
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isLowEnd ? 0.1 : 0.3, duration: 0.4 }}
          className="mt-4 font-mono text-xs tracking-[0.2em] text-slate-300/90 uppercase font-bold"
        >
          {t('noMoreBoredomTagline')}
        </motion.p>
      </motion.div>

      {/* Bottom Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isLowEnd ? 0.1 : 0.35, duration: 0.4 }}
        className="relative z-10 w-full max-w-xs flex flex-col items-center gap-2.5 pb-2"
      >
        <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-1">
          <span>{t('loadingGameAssets')}</span>
          <span className="text-amber-400 font-black">{progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-800/90 border border-slate-700/80 rounded-full overflow-hidden p-0.5 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.8)]"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between w-full text-[9px] font-mono tracking-widest text-slate-500 uppercase px-1 mt-1">
          <span>{t('appTitle')}</span>
          <span className="text-amber-400/80 font-bold">{t('onlineAndOfflineLabel')}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
