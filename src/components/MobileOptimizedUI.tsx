import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
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
    <Card className={`${isMobile ? 'rounded-lg border-0 shadow-sm' : ''} ${className}`}>
      {children}
    </Card>
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
  
  const mobileClass = isMobile ? 'min-h-[48px] text-base px-6' : '';
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${mobileClass} ${className}`}
    >
      {children}
    </Button>
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
    ? size === "sm" ? "space-y-3" : size === "lg" ? "space-y-8" : "space-y-6"
    : size === "sm" ? "space-y-4" : size === "lg" ? "space-y-12" : "space-y-8";
  
  return (
    <div className={spacingClass}>
      {children}
    </div>
  );
};