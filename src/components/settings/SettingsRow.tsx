import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
  destructive?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  title,
  subtitle,
  value,
  rightElement,
  onClick,
  className,
  showArrow = true,
  destructive = false
}) => {
  return (
    <div
      className={cn(
        "flex items-center py-3 px-4 cursor-pointer transition-colors duration-200",
        "hover:bg-muted/50 active:bg-muted/70",
        destructive && "text-destructive hover:bg-destructive/10",
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="mr-4 flex-shrink-0">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-base font-medium text-foreground",
          destructive && "text-destructive"
        )}>
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-muted-foreground mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      
      {(value || rightElement) && (
        <div className="flex items-center ml-3 flex-shrink-0">
          {value && (
            <span className="text-sm text-muted-foreground mr-2">
              {value}
            </span>
          )}
          {rightElement}
        </div>
      )}
      
      {showArrow && onClick && (
        <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
      )}
    </div>
  );
};