import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-2xl font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 touch-target",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-dark text-white shadow-medical hover:shadow-glow hover:scale-[1.02]",
        secondary: "bg-gradient-to-r from-secondary to-secondary-dark text-white shadow-medical hover:shadow-glow hover:scale-[1.02]",
        outline: "glass border-2 border-primary text-primary hover:bg-primary/10 hover:shadow-card hover:scale-[1.02]",
        ghost: "glass text-primary hover:bg-primary/10 hover:shadow-card hover:scale-[1.02]",
        glass: "glass-card text-foreground hover:shadow-elevated hover:scale-[1.02]",
        floating: "glass-card shadow-floating text-foreground hover:shadow-glow hover:scale-[1.05] hover:-translate-y-1",
        medical: "bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 text-primary hover:from-primary/20 hover:to-secondary/20 hover:shadow-medical hover:scale-[1.02]",
        destructive: "bg-gradient-to-r from-destructive to-destructive-dark text-white shadow-card hover:shadow-elevated hover:scale-[1.02]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-12 w-12",
        mobile: "h-14 px-8 text-base min-w-[120px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const isMobile = useIsMobile();
    const Comp = asChild ? Slot : "button";
    
    const actualSize = isMobile && size === "default" ? "mobile" : size;
    
    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size: actualSize, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </Comp>
    );
  }
);
EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, enhancedButtonVariants };