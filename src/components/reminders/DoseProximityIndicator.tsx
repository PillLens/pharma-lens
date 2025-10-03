import { AlertCircle, Clock, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DoseProximityIndicatorProps {
  time: string;
  isTaken: boolean;
  minutesUntil: number;
}

export const DoseProximityIndicator = ({ 
  time, 
  isTaken, 
  minutesUntil 
}: DoseProximityIndicatorProps) => {
  // Already taken
  if (isTaken) {
    return (
      <Badge 
        variant="outline" 
        className="bg-success/10 text-success border-success/30 gap-1.5 animate-fade-in"
      >
        <CheckCircle2 className="h-3 w-3" />
        <span className="text-xs font-medium">Taken</span>
      </Badge>
    );
  }

  // Overdue (past time)
  if (minutesUntil < 0) {
    const hoursOverdue = Math.abs(Math.floor(minutesUntil / 60));
    const minutesOverdue = Math.abs(minutesUntil % 60);
    
    return (
      <Badge 
        variant="outline" 
        className="bg-destructive/10 text-destructive border-destructive/30 gap-1.5 animate-pulse"
      >
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs font-medium">
          {hoursOverdue > 0 
            ? `${hoursOverdue}h ${minutesOverdue}m overdue` 
            : `${minutesOverdue}m overdue`}
        </span>
      </Badge>
    );
  }

  // Due soon (within 30 minutes)
  if (minutesUntil <= 30) {
    return (
      <Badge 
        variant="outline" 
        className="bg-warning/10 text-warning border-warning/30 gap-1.5 animate-bounce"
      >
        <Clock className="h-3 w-3" />
        <span className="text-xs font-medium">
          Due in {minutesUntil}m
        </span>
      </Badge>
    );
  }

  // Due within 1 hour
  if (minutesUntil <= 60) {
    return (
      <Badge 
        variant="outline" 
        className="bg-primary/10 text-primary border-primary/30 gap-1.5"
      >
        <Clock className="h-3 w-3" />
        <span className="text-xs font-medium">
          In {minutesUntil}m
        </span>
      </Badge>
    );
  }

  // Upcoming (more than 1 hour)
  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;
  
  return (
    <Badge 
      variant="outline" 
      className="bg-muted/50 text-muted-foreground border-border/50 gap-1.5"
    >
      <Circle className="h-3 w-3" />
      <span className="text-xs font-medium">
        {hours > 0 
          ? `In ${hours}h ${minutes}m` 
          : `In ${minutes}m`}
      </span>
    </Badge>
  );
};