import React from 'react';
import { Crown, CreditCard, LogOut, Trash2, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TranslatedText } from '@/components/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';

interface Subscription {
  plan: string;
}

interface SettingsAccountProps {
  subscription: Subscription;
  isInTrial: boolean;
  trialDaysRemaining: number;
  loading: boolean;
  deleteConfirmation: string;
  onSetDeleteConfirmation: (value: string) => void;
  onManageSubscription: () => void;
  onTestCheckout: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export const SettingsAccount: React.FC<SettingsAccountProps> = ({
  subscription,
  isInTrial,
  trialDaysRemaining,
  loading,
  deleteConfirmation,
  onSetDeleteConfirmation,
  onManageSubscription,
  onTestCheckout,
  onSignOut,
  onDeleteAccount
}) => {
  const { t } = useTranslation();

  const getSubscriptionStatusColor = () => {
    if (isInTrial) return 'from-amber-500 to-orange-500';
    if (subscription.plan !== 'free') return 'from-primary to-primary-glow';
    return 'from-muted-foreground to-muted-foreground';
  };

  const getSubscriptionLabel = () => {
    if (isInTrial) return t('settings.billing.trialActive');
    if (subscription.plan === 'pro_individual') return t('settings.billing.proIndividual');
    return t('settings.billing.freePlan');
  };

  return (
    <div className="space-y-6">
      {/* Billing & Plan */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getSubscriptionStatusColor()} flex items-center justify-center`}>
              {subscription.plan !== 'free' || isInTrial ? (
                <Crown className="w-4 h-4 text-white" />
              ) : (
                <CreditCard className="w-4 h-4 text-white" />
              )}
            </div>
            <TranslatedText translationKey="settings.billing.title" fallback="Billing & Plan" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Plan Status */}
          <div className="bg-gradient-to-br from-background to-muted/30 rounded-xl p-4 border border-border/50 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${getSubscriptionStatusColor()} flex items-center justify-center`}>
                  {subscription.plan !== 'free' || isInTrial ? (
                    <Crown className="w-3 h-3 text-white" />
                  ) : (
                    <CreditCard className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('settings.billing.currentPlan')}</p>
                  <p className="font-semibold">{getSubscriptionLabel()}</p>
                </div>
              </div>
              {isInTrial && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    <TranslatedText translationKey="settings.billing.trialExpiresIn" fallback="Trial expires in" />
                  </p>
                  <p className="font-semibold text-amber-600 text-sm">
                    <TranslatedText 
                      translationKey="settings.billing.daysRemaining" 
                      fallback="{{days}} days"
                      values={{ days: trialDaysRemaining }}
                    />
                  </p>
                </div>
              )}
            </div>
            
            {/* Plan Features */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">
                  {subscription.plan === 'free' ? '1' : '∞'}
                </p>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="navigation.reminders" fallback="Reminders" />
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-primary">
                  {subscription.plan === 'pro_individual' ? '1' : '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  <TranslatedText translationKey="dashboard.familyMembers" fallback="Family Members" />
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={onManageSubscription}
                disabled={loading}
                className="w-full h-11"
                variant={subscription.plan === 'free' ? 'default' : 'outline'}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : subscription.plan === 'free' ? (
                  <Crown className="w-4 h-4 mr-2" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                {subscription.plan === 'free' ? t('settings.billing.upgrade') : t('settings.billing.manageBilling')}
              </Button>

              <Button 
                onClick={onTestCheckout}
                variant="outline"
                size="sm"
                className="w-full bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              >
                <TranslatedText translationKey="settings.billing.testCheckout" fallback="🧪 Test Direct Checkout (Debug)" />
              </Button>
            </div>
          </div>

          {/* Billing History */}
          {subscription.plan !== 'free' && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <TranslatedText translationKey="settings.billing.billingHistory" fallback="Billing History" />
              </h4>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  <TranslatedText 
                    translationKey="settings.billing.billingHistoryDescription" 
                    fallback="View your billing history and invoices in the customer portal" 
                  />
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-0 shadow-sm border-destructive/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg text-destructive">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <TranslatedText translationKey="settings.account.title" fallback="Account" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{t('settings.account.signOut')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.account.signOutDescription')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut} className="h-10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-destructive">{t('settings.account.deleteAccount')}</p>
                  <p className="text-sm text-muted-foreground">{t('settings.account.deleteDescription')}</p>
                </div>
                <Button variant="destructive" size="sm" className="h-10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t('settings.account.deleteAccount')}
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    <TranslatedText 
                      translationKey="settings.account.deleteWarning" 
                      fallback="This action cannot be undone. This will permanently delete your account and all your data." 
                    />
                  </p>
                  <div className="bg-destructive/10 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-2">
                      <TranslatedText 
                        translationKey="settings.account.whatWillBeDeleted" 
                        fallback="What will be deleted:" 
                      />
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>
                        <TranslatedText 
                          translationKey="settings.account.medicationsData" 
                          fallback="All your medications and dosage information" 
                        />
                      </li>
                      <li>
                        <TranslatedText 
                          translationKey="settings.account.remindersData" 
                          fallback="All medication reminders and schedules" 
                        />
                      </li>
                      <li>
                        <TranslatedText 
                          translationKey="settings.account.familyGroups" 
                          fallback="Family groups and caregiver connections" 
                        />
                      </li>
                      <li>
                        <TranslatedText 
                          translationKey="settings.account.scanHistory" 
                          fallback="Scan history and saved medications" 
                        />
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      <TranslatedText translationKey="settings.account.deleteConfirmation" fallback="Type DELETE to confirm" />
                    </Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => onSetDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="font-mono"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || loading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {t('settings.account.deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};