import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  size = 'md',
  fullWidth = true,
  className = '',
  disabled,
  onClick,
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  const sizeStyles = {
    sm: 'py-2 px-3 text-xs',
    md: 'py-2.5 px-4 text-xs font-mono font-medium',
    lg: 'py-3 px-5 text-sm font-mono font-medium tracking-wider',
  };

  return (
    <motion.button
      type={type}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${sizeStyles[size]}
        rounded-[11px] bg-white dark:bg-[#131A29] hover:bg-[#F0F6FF] dark:hover:bg-[#1E273C] text-[#47A5FF] dark:text-[#38BDF8]
        border-[1.5px] border-[#47A5FF] dark:border-[#38BDF8] hover:border-[#3A92EE] dark:hover:border-[#0284C7]
        transition-all flex items-center justify-center gap-2 uppercase select-none font-bold
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-98'}
        ${className}
      `}
      {...(rest as any)}
    >
      {isLoading ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <span>{children}</span>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </motion.button>
  );
};
