import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionHeaderProps {
  title: string;
  className?: string;
}

export const SettingsSectionHeader: React.FC<SettingsSectionHeaderProps> = ({
  title,
  className
}) => {
  return (
    <div className={cn(
      "px-4 py-3 text-sm font-medium text-muted-foreground uppercase tracking-wide",
      className
    )}>
      {title}
    </div>
  );
};