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

  return (
    <div className="px-6 mb-6">
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {summaryCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-md shadow-sm border-0"
              onClick={() => onCardTap?.(card.type)}
            >
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-foreground mb-0.5">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground leading-tight font-medium">
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