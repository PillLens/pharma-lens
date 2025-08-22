import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, AlertCircle } from 'lucide-react';

interface TouchOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  medical?: boolean;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const TouchOptimizedInput = React.forwardRef<HTMLInputElement, TouchOptimizedInputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    error, 
    medical = false,
    showPasswordToggle = false,
    leftIcon,
    rightIcon,
    helperText,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password') 
      : type;

    const baseInputStyles = cn(
      "w-full h-touch px-4 py-3 text-base", // h-touch ensures 44px minimum
      "rounded-lg border-2 transition-all duration-300",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "placeholder:text-muted-foreground",
      leftIcon && "pl-12",
      (rightIcon || showPasswordToggle) && "pr-12"
    );

    const getInputVariant = () => {
      if (error) {
        return cn(
          baseInputStyles,
          "border-destructive bg-destructive/5 text-destructive-foreground",
          "focus:border-destructive focus:ring-destructive/20",
          "placeholder:text-destructive/60"
        );
      }

      if (medical) {
        return cn(
          baseInputStyles,
          "border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10",
          "text-foreground shadow-medical",
          "focus:border-primary focus:ring-primary/20 focus:shadow-glow",
          focused && "border-primary shadow-glow"
        );
      }

      return cn(
        baseInputStyles,
        "border-border bg-background text-foreground",
        "focus:border-primary focus:ring-primary/20",
        "hover:border-primary/50",
        focused && "border-primary"
      );
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className={cn(
            "block text-sm font-medium",
            error ? "text-destructive" : 
            medical ? "text-primary" : 
            "text-foreground"
          )}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          {/* Input Field */}
          <input
            ref={ref}
            type={inputType}
            className={getInputVariant()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          
          {/* Right Icon or Password Toggle */}
          {(rightIcon || showPasswordToggle) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPasswordToggle && type === 'password' ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 min-w-touch min-h-touch flex items-center justify-center"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              ) : rightIcon ? (
                <div className="text-muted-foreground">
                  {rightIcon}
                </div>
              ) : null}
            </div>
          )}
          
          {/* Error Icon */}
          {error && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>
        
        {/* Helper Text or Error Message */}
        {(helperText || error) && (
          <div className={cn(
            "text-sm leading-relaxed",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || helperText}
          </div>
        )}
        
        {/* Medical Trust Indicator */}
        {medical && !error && (
          <div className="flex items-center gap-2 text-xs text-primary/80">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>Medical-grade security enabled</span>
          </div>
        )}
      </div>
    );
  }
);

TouchOptimizedInput.displayName = "TouchOptimizedInput";

export default TouchOptimizedInput;