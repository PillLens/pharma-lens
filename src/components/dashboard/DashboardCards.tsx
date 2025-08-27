import React from 'react';
import { Clock, Pill, Users, FileText, Shield, CreditCard, TrendingUp, AlertCircle, Target, Award, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useDashboardData } from '@/hooks/useDashboardData';
import { QuickStatsGrid } from '@/components/ui/QuickStatsGrid';

interface DashboardCardsProps {
  onNavigate: (path: string) => void;
}

export function DashboardCards({ onNavigate }: DashboardCardsProps) {
  const { subscription, isInTrial, trialDaysRemaining, checkFeatureAccess } = useSubscription();
  const { dashboardStats, loading } = useDashboardData();

  return (
    <div className="space-y-4 px-4">
      {/* Today at a Glance */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              <TranslatedText translationKey="dashboard.todayAtGlance" fallback="Today at a Glance" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adherence Ring */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Progress value={dashboardStats.adherence.rate} className="h-2 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{dashboardStats.adherence.rate}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">
                  <TranslatedText translationKey="dashboard.adherenceRate" fallback="Adherence Rate" />
                </p>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="dashboard.thisWeek" fallback="This week" />
                </p>
              </div>
            </div>
          </div>

          {/* Due Doses */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              <TranslatedText translationKey="dashboard.dueToday" fallback="Due Today" />
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                <TranslatedText translationKey="dashboard.completed" fallback="Completed" /> • {dashboardStats.adherence.completedToday}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <TranslatedText translationKey="dashboard.pending" fallback="Pending" /> • {dashboardStats.adherence.totalToday - dashboardStats.adherence.completedToday}
              </Badge>
              {dashboardStats.adherence.missedToday > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <TranslatedText translationKey="dashboard.missed" fallback="Missed" /> • {dashboardStats.adherence.missedToday}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medications Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              <TranslatedText translationKey="dashboard.medicationsOverview" fallback="Medications Overview" />
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('/medications')}>
            <TranslatedText translationKey="common.manage" fallback="Manage" />
          </Button>
        </div>
        
        <QuickStatsGrid 
          stats={[
            {
              icon: Pill,
              value: dashboardStats.medications.active,
              label: "Active Medications",
              color: 'text-success',
              bgColor: 'bg-success/10',
              borderColor: 'border-success/20',
              onClick: () => onNavigate('/medications')
            },
            {
              icon: AlertCircle,
              value: dashboardStats.medications.lowStock,
              label: "Low Stock",
              color: 'text-warning',
              bgColor: 'bg-warning/10',
              borderColor: 'border-warning/20',
              onClick: () => onNavigate('/medications')
            },
            {
              icon: Target,
              value: `${dashboardStats.adherence.rate}%`,
              label: "Adherence Rate",
              color: 'text-primary',
              bgColor: 'bg-primary/10',
              borderColor: 'border-primary/20'
            },
            {
              icon: Award,
              value: dashboardStats.adherence.streak,
              label: "Day Streak",
              color: 'text-info',
              bgColor: 'bg-info/10',
              borderColor: 'border-info/20'
            }
          ]}
        />
      </div>

      {/* Reminders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              <TranslatedText translationKey="dashboard.reminders" fallback="Reminders" />
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('/reminders')}>
            <TranslatedText translationKey="common.viewAll" fallback="View All" />
          </Button>
        </div>
        
        <QuickStatsGrid 
          stats={[
            {
              icon: Bell,
              value: dashboardStats.reminders.active,
              label: "Active Reminders",
              color: 'text-warning',
              bgColor: 'bg-warning/10',
              borderColor: 'border-warning/20',
              onClick: () => onNavigate('/reminders')
            },
            {
              icon: Clock,
              value: `${dashboardStats.adherence.completedToday}/${dashboardStats.adherence.totalToday}`,
              label: "Today's Doses",
              color: 'text-success',
              bgColor: 'bg-success/10',
              borderColor: 'border-success/20',
              onClick: () => onNavigate('/reminders')
            }
          ]}
          className="grid-cols-2"
        />
        
        {/* Next Reminder */}
        {dashboardStats.reminders.nextReminder && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">{dashboardStats.reminders.nextReminder.medication}</p>
                <p className="text-xs text-muted-foreground">Next dose at {dashboardStats.reminders.nextReminder.time}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Family & Care */}
      <FeatureGate feature="can_create_family_group" showPaywall={false}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  <TranslatedText translationKey="dashboard.familyCare" fallback="Family & Care" />
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/family')}>
                <TranslatedText translationKey="dashboard.openFamily" fallback="Open Family" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              {dashboardStats.family.groups > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{dashboardStats.family.groups} groups • {dashboardStats.family.members} members</p>
                  <Button variant="outline" size="sm" onClick={() => onNavigate('/family')}>
                    <TranslatedText translationKey="dashboard.manageFamily" fallback="Manage Family" />
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText translationKey="dashboard.noFamilyGroups" fallback="No family groups yet" />
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => onNavigate('/family')}>
                    <TranslatedText translationKey="dashboard.createGroup" fallback="Create Group" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </FeatureGate>

      {/* Reports & Export */}
      <FeatureGate feature="can_export_reports">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                <TranslatedText translationKey="dashboard.reportsExport" fallback="Reports & Export" />
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <TranslatedText translationKey="dashboard.export7Days" fallback="Export 7-day report" />
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <TranslatedText translationKey="dashboard.export30Days" fallback="Export 30-day report" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </FeatureGate>

      {/* Security & Privacy */}
      <FeatureGate feature="hipaa_report_access">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                <TranslatedText translationKey="dashboard.securityPrivacy" fallback="Security & Privacy" />
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <TranslatedText translationKey="dashboard.encryptionStatus" fallback="Encryption" />
              </span>
              <Badge variant="default" className="bg-green-500">
                <TranslatedText translationKey="dashboard.active" fallback="Active" />
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <TranslatedText translationKey="dashboard.auditLogs" fallback="Audit Logs" />
              </span>
              <span className="text-sm text-muted-foreground">247 entries</span>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <TranslatedText translationKey="dashboard.hipaaReport" fallback="HIPAA Report" />
            </Button>
          </CardContent>
        </Card>
      </FeatureGate>

      {/* Plan & Billing */}
      <Card className={isInTrial ? "border-amber-200 bg-amber-50/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                <TranslatedText translationKey="dashboard.planBilling" fallback="Plan & Billing" />
              </CardTitle>
            </div>
            <Badge variant={isInTrial ? "secondary" : "outline"}>
              {isInTrial ? (
                <TranslatedText translationKey="dashboard.trial" fallback="Trial" />
              ) : (
                <TranslatedText 
                  translationKey={`dashboard.plan.${subscription.plan}`} 
                  fallback={subscription.plan.replace('_', ' ')} 
                />
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isInTrial && (
            <div className="p-3 bg-amber-100 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                <TranslatedText 
                  translationKey="dashboard.trialDaysRemaining" 
                  fallback={`${trialDaysRemaining} days left in trial`}
                />
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full">
              <TranslatedText translationKey="dashboard.manageBilling" fallback="Manage Billing" />
            </Button>
            {subscription.plan === 'free' && (
              <Button variant="default" size="sm" className="w-full">
                <TranslatedText translationKey="dashboard.upgradePlan" fallback="Upgrade Plan" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}