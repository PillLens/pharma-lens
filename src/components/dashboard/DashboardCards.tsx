import React from 'react';
import { Clock, Pill, Users, FileText, Shield, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TranslatedText } from '@/components/TranslatedText';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FeatureGate } from '@/components/subscription/FeatureGate';

interface DashboardCardsProps {
  onNavigate: (path: string) => void;
}

export function DashboardCards({ onNavigate }: DashboardCardsProps) {
  const { subscription, isInTrial, trialDaysRemaining, checkFeatureAccess } = useSubscription();

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
                <Progress value={85} className="h-2 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">85%</span>
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
                <TranslatedText translationKey="dashboard.morning" fallback="Morning" /> • 2
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <TranslatedText translationKey="dashboard.afternoon" fallback="Afternoon" /> • 1
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <TranslatedText translationKey="dashboard.evening" fallback="Evening" /> • 3
              </Badge>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">4</p>
              <p className="text-xs text-muted-foreground">
                <TranslatedText translationKey="dashboard.active" fallback="Active" />
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">1</p>
              <p className="text-xs text-muted-foreground">
                <TranslatedText translationKey="dashboard.lowStock" fallback="Low Stock" />
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">0</p>
              <p className="text-xs text-muted-foreground">
                <TranslatedText translationKey="dashboard.refillsNext7Days" fallback="Refills (7d)" />
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
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Aspirin 81mg</span>
              <Badge variant="outline" className="text-xs">8:00 AM</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Vitamin D</span>
              <Badge variant="outline" className="text-xs">6:00 PM</Badge>
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
              <p className="text-sm text-muted-foreground">
                <TranslatedText translationKey="dashboard.noFamilyGroups" fallback="No family groups yet" />
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => onNavigate('/family')}>
                <TranslatedText translationKey="dashboard.createGroup" fallback="Create Group" />
              </Button>
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