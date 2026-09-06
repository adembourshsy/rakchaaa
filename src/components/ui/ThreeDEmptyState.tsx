import React from 'react';
import { motion } from 'motion/react';
import emptyStateImage from '../../assets/images/rakcha_empty_state_1787235491943.jpg';

interface ThreeDEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const ThreeDEmptyState: React.FC<ThreeDEmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full p-6 sm:p-8 rounded-[16px] bg-white border border-[#D5E5F7] text-center space-y-4 shadow-xs select-none relative overflow-hidden"
    >
      {/* 3D Graphic Container */}
      <div className="relative w-28 sm:w-32 h-28 sm:h-32 mx-auto rounded-[14px] overflow-hidden border border-[#D5E5F7] group">
        <motion.img
          src={emptyStateImage}
          alt="3D Game Empty State"
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Floating overlay badge if icon provided */}
        {icon && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-[#F0F6FF] text-[#47A5FF] shadow-sm border border-[#D5E5F7]">
            {icon}
          </div>
        )}
      </div>

      {/* Text Info */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-base sm:text-lg font-semibold text-[#000000] tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[#4C5055] leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-5 py-2.5 rounded-[11px] bg-[#FF6B1A] hover:bg-[#E85D0F] text-white text-xs font-mono font-medium uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};
