import React from 'react';
import { Clock, Pill, Users, FileText, Shield, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useDashboardData } from '@/hooks/useDashboardData';

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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                <TranslatedText translationKey="dashboard.medicationsOverview" fallback="Medications Overview" />
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('/medications')}>
              <TranslatedText translationKey="common.manage" fallback="Manage" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/5 border border-success/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-success" />
                </div>
                <div className="text-xl font-bold text-foreground">{dashboardStats.medications.active}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                <TranslatedText translationKey="dashboard.active" fallback="Active" />
              </p>
            </div>
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-warning" />
                </div>
                <div className="text-xl font-bold text-foreground">{dashboardStats.medications.lowStock}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                <TranslatedText translationKey="dashboard.lowStock" fallback="Low Stock" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                <TranslatedText translationKey="dashboard.reminders" fallback="Reminders" />
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('/reminders')}>
              <TranslatedText translationKey="common.viewAll" fallback="View All" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {dashboardStats.reminders.nextReminder ? (
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-sm">{dashboardStats.reminders.nextReminder.medication}</span>
                <Badge variant="outline" className="text-xs">{dashboardStats.reminders.nextReminder.time}</Badge>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No upcoming reminders</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground text-center">
              {dashboardStats.reminders.active} active reminders • {dashboardStats.reminders.todaysDoses} doses today
            </div>
          </div>
        </CardContent>
      </Card>

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