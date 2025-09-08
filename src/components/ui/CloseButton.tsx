import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

export function CloseButton({ 
  onClick, 
  className, 
  size = 'md',
  variant = 'default'
}: CloseButtonProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  if (variant === 'minimal') {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClick}
        className={cn("p-1", sizeClasses[size], className)}
      >
        <X className={iconSizes[size]} />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all duration-200",
        sizeClasses[size],
        className
      )}
    >
      <X className={cn(iconSizes[size], "text-primary")} />
    </Button>
  );
}