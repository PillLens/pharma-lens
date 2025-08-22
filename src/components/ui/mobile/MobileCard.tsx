import * as React from "react";
import { cn } from "@/lib/utils";

const MobileCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'elevated' | 'medical' | 'glass' | 'outline';
    interactive?: boolean;
  }
>(({ className, variant = 'default', interactive = false, ...props }, ref) => {
  const variantClasses = {
    default: "bg-card border border-border shadow-soft",
    elevated: "medical-card shadow-card hover:shadow-floating",
    medical: "medical-surface shadow-medical",
    glass: "bg-gradient-glass backdrop-blur-sm border border-border/50 shadow-soft",
    outline: "bg-card border-2 border-primary/20 shadow-soft"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg p-4 transition-all duration-200",
        variantClasses[variant],
        interactive && "cursor-pointer hover:scale-[1.02] hover:-translate-y-1",
        className
      )}
      {...props}
    />
  );
});
MobileCard.displayName = "MobileCard";

const MobileCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 pb-4", className)}
    {...props}
  />
));
MobileCardHeader.displayName = "MobileCardHeader";

const MobileCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
MobileCardTitle.displayName = "MobileCardTitle";

const MobileCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
MobileCardDescription.displayName = "MobileCardDescription";

const MobileCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
MobileCardContent.displayName = "MobileCardContent";

const MobileCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
MobileCardFooter.displayName = "MobileCardFooter";

export { 
  MobileCard, 
  MobileCardHeader, 
  MobileCardFooter, 
  MobileCardTitle, 
  MobileCardDescription, 
  MobileCardContent 
};