import React from 'react';

interface SectionProps {
  icon?: React.ReactNode;
  title: string;
  /** Overrides the default bold orange uppercase label style. */
  titleClassName?: string;
  /** Optional element rendered on the right side of the header row. */
  trailing?: React.ReactNode;
  /** Vertical spacing between the header and content (default: space-y-3). */
  spacing?: 'space-y-3' | 'space-y-4';
  children: React.ReactNode;
}

const DEFAULT_TITLE_CLASS =
  'flex items-center gap-2 text-xs font-mono font-medium tracking-widest text-[#4C5055] dark:text-[#94A3B8] uppercase';

/**
 * The rounded card + uppercase icon/label header used throughout
 * AboutView, HelpView, PrivacyView and RoomsView.
 */
export const Section: React.FC<SectionProps> = ({
  icon,
  title,
  titleClassName = DEFAULT_TITLE_CLASS,
  trailing,
  spacing = 'space-y-3',
  children,
}) => (
  <section
    className={`rounded-[16px] bg-white dark:bg-[#131A29] border border-[#D5E5F7] dark:border-[#1E293B] p-5 ${spacing} shadow-xs text-[#000000] dark:text-[#F8FAFC]`}
  >
    {trailing ? (
      <div className="flex items-center justify-between">
        <div className={titleClassName}>
          {icon}
          <span>{title}</span>
        </div>
        {trailing}
      </div>
    ) : (
      <div className={titleClassName}>
        {icon}
        <span>{title}</span>
      </div>
    )}
    {children}
  </section>
);
