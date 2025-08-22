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
    <div className="grid grid-cols-3 gap-3 px-4 mb-6">
      {summaryCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card
            key={card.id}
            className="rounded-2xl shadow-sm border-0 bg-card cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-md"
            onClick={() => onCardTap?.(card.type)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {card.title}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ReminderSummaryCards;