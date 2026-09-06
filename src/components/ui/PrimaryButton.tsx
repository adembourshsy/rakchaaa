import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'orange' | 'emerald' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  icon,
  iconPosition = 'right',
  variant = 'orange',
  size = 'md',
  fullWidth = true,
  className = '',
  disabled,
  onClick,
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  const variantStyles = {
    orange: 'bg-[#47A5FF] hover:bg-[#3A92EE] text-white shadow-sm font-bold',
    emerald: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-sm font-bold',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm font-bold',
  };

  const sizeStyles = {
    sm: 'py-2 px-4 text-xs',
    md: 'py-3 px-5 text-xs sm:text-sm',
    lg: 'py-3.5 px-6 text-sm tracking-wider',
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
        ${variantStyles[variant]}
        rounded-[11px] font-mono uppercase tracking-wider
        transition-all flex items-center justify-center gap-2 select-none
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-98'}
        ${className}
      `}
      {...(rest as any)}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
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
