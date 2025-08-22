import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EnhancedButton } from "@/components/ui/enhanced/EnhancedButton";
import { EnhancedCard } from "@/components/ui/enhanced/EnhancedCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  trigger?: ReactNode;
}

export const ResponsiveDialog = ({ 
  children, 
  open, 
  onOpenChange, 
  title, 
  trigger 
}: ResponsiveDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className="max-h-[90vh] overflow-y-auto glass-card border-t border-border/30">
          <DrawerHeader className="text-left border-b border-border/20">
            <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-6 smooth-scroll">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

interface MobileOptimizedCardProps {
  children: ReactNode;
  className?: string;
}

export const MobileOptimizedCard = ({ children, className = "" }: MobileOptimizedCardProps) => {
  const isMobile = useIsMobile();
  
  return (
    <EnhancedCard 
      variant={isMobile ? "glass" : "default"}
      className={`${isMobile ? 'animate-fade-in-up' : ''} ${className}`}
    >
      {children}
    </EnhancedCard>
  );
};

interface MobileOptimizedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const MobileOptimizedButton = ({ 
  children, 
  onClick, 
  variant = "default", 
  size = "default", 
  className = "",
  disabled,
  type = "button"
}: MobileOptimizedButtonProps) => {
  const isMobile = useIsMobile();
  
  return (
    <EnhancedButton
      variant={variant as any}
      size={isMobile ? "mobile" : size}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
    >
      {children}
    </EnhancedButton>
  );
};

interface MobileGridProps {
  children: ReactNode;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  className?: string;
}

export const MobileGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  className = ""
}: MobileGridProps) => {
  const gridClass = `grid gap-4 grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
  
  return (
    <div className={`${gridClass} ${className}`}>
      {children}
    </div>
  );
};

interface MobileSpacingProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export const MobileSpacing = ({ children, size = "md" }: MobileSpacingProps) => {
  const isMobile = useIsMobile();
  
  const spacingClass = isMobile 
    ? size === "sm" ? "space-y-4" : size === "lg" ? "space-y-8" : "space-y-6"
    : size === "sm" ? "space-y-6" : size === "lg" ? "space-y-12" : "space-y-8";
  
  return (
    <div className={`${spacingClass} animate-fade-in-up`}>
      {children}
    </div>
  );
};