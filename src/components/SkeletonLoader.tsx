import React from 'react';
import { motion } from 'motion/react';
import { LammaHubLogoIcon, RakchaGameTextSvg } from './brand/LammaHubLogo';

interface SkeletonLoaderProps {
  type?: 'home' | 'rooms' | 'waiting_room' | 'game' | 'profile' | 'friends';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = () => {
  return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      <motion.div 
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ 
            y: [-4, 4, -4],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5, 
            ease: "easeInOut" 
          }}
          className="relative flex items-center justify-center p-5 rounded-[20px] bg-white border border-[#D5E5F7] shadow-xl"
        >
          <LammaHubLogoIcon sizePx={56} className="relative z-10" />
        </motion.div>

        {/* Branding & Loading Status */}
        <div className="flex flex-col items-center gap-3">
          <RakchaGameTextSvg heightPx={26} />
          
          <div className="flex flex-col items-center gap-2">
            {/* Animated Loading Dots */}
            <div className="flex gap-1.5 items-center justify-center h-4">
              <motion.span 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0 }}
                className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A]" 
              />
              <motion.span 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A]" 
              />
              <motion.span 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-[#FF6B1A]" 
              />
            </div>
            <span className="text-[10px] font-mono font-medium tracking-[0.25em] uppercase text-[#7A6F66]">
              LOADING...
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
