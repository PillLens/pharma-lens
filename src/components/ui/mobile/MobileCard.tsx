import * as React from "react";
import { cn } from "@/lib/utils";

const MobileCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'elevated' | 'medical' | 'glass' | 'outline' | 'emergency' | 'warning' | 'success' | 'info' | 'critical';
    interactive?: boolean;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }
>(({ className, variant = 'default', interactive = false, severity, ...props }, ref) => {
  const variantClasses = {
    default: "bg-card border border-border shadow-soft hover:shadow-card transition-all duration-300",
    elevated: "medical-card shadow-card hover:shadow-floating transition-all duration-300",
    medical: "medical-surface shadow-medical hover:shadow-card transition-all duration-300",
    glass: "bg-gradient-glass backdrop-blur-sm border border-border/50 shadow-soft hover:shadow-card transition-all duration-300",
    outline: "bg-card border-2 border-primary/20 shadow-soft hover:border-primary/40 hover:shadow-card transition-all duration-300",
    emergency: "bg-gradient-to-br from-emergency/5 to-emergency/10 border-2 border-emergency/30 shadow-emergency hover:shadow-floating hover:border-emergency/50 transition-all duration-300",
    warning: "bg-gradient-to-br from-warning/5 to-warning/10 border-2 border-warning/30 shadow-warning hover:shadow-floating hover:border-warning/50 transition-all duration-300",
    success: "bg-gradient-to-br from-success/5 to-success/10 border-2 border-success/30 shadow-success hover:shadow-floating hover:border-success/50 transition-all duration-300",
    info: "bg-gradient-to-br from-info/5 to-info/10 border-2 border-info/30 shadow-soft hover:shadow-card hover:border-info/50 transition-all duration-300",
    critical: "bg-gradient-to-br from-emergency/10 to-destructive/10 border-2 border-emergency/40 shadow-emergency hover:shadow-floating animate-safety-pulse"
  };
  
  const severityClasses = severity ? {
    low: "border-success/20 bg-success/5",
    medium: "border-warning/30 bg-warning/5",
    high: "border-destructive/30 bg-destructive/5", 
    critical: "border-emergency/40 bg-emergency/10 animate-safety-pulse"
  }[severity] : "";

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg p-4 min-h-touch", // Ensure minimum touch target
        variantClasses[variant],
        severityClasses,
        interactive && "cursor-pointer hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-transform duration-200",
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