import React from 'react';
import { Bell, Pill, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

interface ReminderSummaryCardsProps {
  activeReminders: number;
  medicationsCovered: number;
  todaysDoses: number;
  onCardTap?: (type: 'active' | 'medications' | 'today') => void;
}

const ReminderSummaryCards: React.FC<ReminderSummaryCardsProps> = ({
  activeReminders,
  medicationsCovered,
  todaysDoses,
  onCardTap
}) => {
  const { t } = useTranslation();

  const summaryCards = [
    {
      id: 'active',
      title: t('reminders.summary.active'),
      value: activeReminders,
      icon: Bell,
      color: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      type: 'active' as const
    },
    {
      id: 'medications',
      title: t('reminders.summary.medications'),
      value: medicationsCovered,
      icon: Pill,
      color: 'bg-green-500/10',
      iconColor: 'text-green-600',
      type: 'medications' as const
    },
    {
      id: 'today',
      title: t('reminders.summary.todayDoses'),
      value: todaysDoses,
      icon: Calendar,
      color: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      type: 'today' as const
    }
  ];

  const statsWithColors = [
    {
      ...summaryCards[0],
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20'
    },
    {
      ...summaryCards[1],
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20'
    },
    {
      ...summaryCards[2],
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20'
    }
  ];

  return (
    <div className="px-4 mb-6">
      <div className="grid grid-cols-3 gap-2">
        {statsWithColors.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              className={`${card.borderColor} ${card.bgColor} rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] border min-h-0`}
              onClick={() => onCardTap?.(card.type)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center shadow-soft`}>
                  <IconComponent className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-foreground">{card.value}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {card.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReminderSummaryCards;