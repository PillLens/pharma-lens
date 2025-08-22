import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "medical-button shadow-medical hover:shadow-floating hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft hover:shadow-card",
        outline: "border-2 border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 shadow-soft",
        ghost: "hover:bg-muted/60 hover:shadow-soft",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:shadow-card",
        medical: "medical-surface text-foreground hover:bg-primary/5 shadow-medical",
        glass: "bg-gradient-glass backdrop-blur-sm border border-border/50 hover:bg-gradient-glass shadow-soft",
        emergency: "bg-gradient-to-r from-emergency to-emergency-light text-emergency-foreground shadow-emergency hover:shadow-floating hover:scale-105 animate-safety-pulse",
        warning: "bg-gradient-to-r from-warning to-warning-light text-warning-foreground shadow-warning hover:shadow-floating hover:scale-105",
        success: "bg-gradient-to-r from-success to-success-light text-success-foreground shadow-success hover:shadow-floating hover:scale-105 hover:animate-heartbeat",
        info: "bg-gradient-to-r from-info to-info-light text-info-foreground shadow-soft hover:shadow-card hover:scale-105",
        critical: "bg-gradient-to-r from-emergency via-destructive to-emergency-light text-emergency-foreground shadow-emergency hover:shadow-floating animate-safety-blink border-2 border-emergency-light",
        scan: "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-medical hover:shadow-glow hover:animate-medical-glow",
        medication: "bg-gradient-to-br from-success/10 to-primary/10 border-2 border-primary/30 text-primary hover:bg-gradient-to-br hover:from-success/20 hover:to-primary/20 hover:border-primary/50 shadow-soft hover:shadow-medical",
      },
      size: {
        default: "h-12 px-4 py-2", // 48px - meets accessibility standards
        sm: "h-11 px-3", // 44px - minimum touch target
        lg: "h-14 px-6", // 56px - comfortable for primary actions
        xl: "h-16 px-8 text-base", // 64px - prominent actions
        icon: "h-12 w-12", // 48px square - accessible icon buttons
        touch: "h-touch w-touch", // CSS custom property for consistent touch targets
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mobileButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  haptic?: boolean; // For future haptic feedback integration
  medical?: boolean; // Special medical context styling
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, haptic = false, medical = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(
          mobileButtonVariants({ variant, size, className }),
          medical && "border border-primary/20 shadow-medical",
          haptic && "data-[haptic=true]:transform data-[haptic=true]:transition-transform"
        )}
        ref={ref}
        disabled={disabled || loading}
        data-haptic={haptic}
        data-medical={medical}
        {...props}
      >
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs opacity-75">Processing...</span>
          </div>
        )}
        {!loading && children}
        
        {/* Medical glow effect for certain variants */}
        {(variant === 'emergency' || variant === 'critical') && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
        )}
      </Comp>
    );
  }
);
MobileButton.displayName = "MobileButton";

export { MobileButton, mobileButtonVariants };