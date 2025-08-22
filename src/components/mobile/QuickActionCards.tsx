import React from 'react';
import { Pill, Bell, Users, Plus, ArrowRight, Calendar, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { TranslatedText } from '@/components/TranslatedText';

const QuickActionCards: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: Pill,
      title: 'My Medications',
      description: 'View and manage your medications',
      route: '/medications',
      gradient: 'from-success/10 to-success/5',
      iconBg: 'bg-success/20',
      iconColor: 'text-success',
      count: 8
    },
    {
      icon: Bell,
      title: 'Reminders Today',
      description: 'Next reminder in 2 hours',
      route: '/reminders',
      gradient: 'from-warning/10 to-warning/5',
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning',
      count: 3
    },
    {
      icon: Users,
      title: 'Family Group',
      description: '4 members connected',
      route: '/family',
      gradient: 'from-info/10 to-info/5',
      iconBg: 'bg-info/20',
      iconColor: 'text-info',
      count: 4
    },
    {
      icon: Shield,
      title: 'Health Dashboard',
      description: 'View compliance & insights',
      route: '/security',
      gradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      badge: 'New'
    }
  ];

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          <TranslatedText translationKey="dashboard.quickActions" fallback="Quick Actions" />
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {quickActions.map((action, index) => (
          <MobileCard
            key={index}
            variant="glass"
            interactive
            onClick={() => navigate(action.route)}
            className={`bg-gradient-to-r ${action.gradient} border-border/50 hover:border-primary/30 transition-all duration-300 group`}
          >
            <MobileCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MobileCardTitle className="text-base group-hover:text-primary transition-colors">
                        <TranslatedText translationKey={`dashboard.${action.title.toLowerCase().replace(/\s+/g, '')}`} fallback={action.title} />
                      </MobileCardTitle>
                      {action.count && (
                        <span className="text-xs bg-foreground/10 text-foreground px-2 py-1 rounded-full font-medium">
                          {action.count}
                        </span>
                      )}
                      {action.badge && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <MobileCardDescription className="text-sm mt-1">
                      <TranslatedText 
                        translationKey={`dashboard.${action.title.toLowerCase().replace(/\s+/g, '')}Description`} 
                        fallback={action.description} 
                      />
                    </MobileCardDescription>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </MobileCardHeader>
          </MobileCard>
        ))}
      </div>

      {/* Add New Quick Action */}
      <MobileCard
        variant="outline"
        interactive
        onClick={() => navigate('/medications?action=add')}
        className="mt-3 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors group"
      >
        <MobileCardContent className="py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
              <TranslatedText translationKey="dashboard.addMedication" fallback="Add New Medication" />
            </span>
          </div>
        </MobileCardContent>
      </MobileCard>
    </div>
  );
};

export default QuickActionCards;