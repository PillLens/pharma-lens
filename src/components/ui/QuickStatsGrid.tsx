import React from 'react';
import { LucideIcon } from 'lucide-react';
import { MobileCard } from '@/components/ui/mobile/MobileCard';
import { TranslatedText } from '@/components/TranslatedText';

interface QuickStatItem {
  icon: LucideIcon;
  value: number | string;
  label: string;
  translationKey?: string;
  color: string;
  bgColor: string;
  borderColor: string;
  onClick?: () => void;
}

interface QuickStatsGridProps {
  stats: QuickStatItem[];
  className?: string;
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ stats, className = "" }) => {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {stats.map((stat, index) => (
        <MobileCard
          key={index}
          variant="glass"
          interactive={!!stat.onClick}
          onClick={stat.onClick}
          className={`${stat.borderColor} ${stat.bgColor} hover:scale-[1.02] transition-all duration-200 p-3 min-h-0`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center shadow-soft`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {stat.translationKey ? (
              <TranslatedText translationKey={stat.translationKey} fallback={stat.label} />
            ) : (
              stat.label
            )}
          </p>
        </MobileCard>
      ))}
    </div>
  );
};