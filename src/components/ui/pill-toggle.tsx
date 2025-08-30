import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  icon?: React.ReactNode;
  checkedIcon?: React.ReactNode;
  className?: string;
}

const PillToggle = React.forwardRef<HTMLButtonElement, PillToggleProps>(
  ({ 
    checked = false, 
    onCheckedChange, 
    disabled = false, 
    size = "default",
    icon,
    checkedIcon,
    className,
    ...props 
  }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    const sizeClasses = {
      sm: "h-5 w-10",
      default: "h-6 w-12", 
      lg: "h-7 w-14"
    };

    const thumbSizeClasses = {
      sm: "w-4 h-4",
      default: "w-5 h-5",
      lg: "w-6 h-6"
    };

    const translateClasses = {
      sm: checked ? "translate-x-5" : "translate-x-0",
      default: checked ? "translate-x-6" : "translate-x-0", 
      lg: checked ? "translate-x-7" : "translate-x-0"
    };

    const iconSizeClasses = {
      sm: "w-2 h-2",
      default: "w-2.5 h-2.5",
      lg: "w-3 h-3"
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        ref={ref}
        className={cn(
          "relative inline-flex items-center rounded-2xl px-0.5 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          checked 
            ? "bg-primary hover:bg-primary/90" 
            : "bg-muted hover:bg-muted/80",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out transform bg-white shadow-sm",
            thumbSizeClasses[size],
            translateClasses[size],
            checked 
              ? "text-primary" 
              : "text-muted-foreground"
          )}
        >
          {checked && checkedIcon ? (
            <span className={iconSizeClasses[size]}>{checkedIcon}</span>
          ) : icon ? (
            <span className={iconSizeClasses[size]}>{icon}</span>
          ) : null}
        </div>
      </button>
    );
  }
);

PillToggle.displayName = "PillToggle";

export { PillToggle };