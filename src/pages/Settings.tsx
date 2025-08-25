import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Globe, 
  Bell, 
  CreditCard, 
  Shield, 
  Trash2, 
  Save,
  Camera,
  Phone,
  MapPin,
  LogOut,
  Download,
  AlertTriangle,
  Key,
  Clock,
  Crown,
  ExternalLink,
  Eye,
  Check,
  Send,
  Pill,
  Users,
  Package,
  Moon
} from 'lucide-react';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TranslatedText } from '@/components/TranslatedText';
import { LanguageSelector } from '@/components/LanguageSelector';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface NotificationPreferences {
  enabled: boolean;
  reminders: boolean;
  missedDose: boolean;
  family: boolean;
  product: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface ProfileData {
  display_name: string;
  phone: string;
  bio: string;
  avatar_url: string;
  preferred_language: string;
  notification_preferences: NotificationPreferences;
}

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { subscription, isInTrial, trialDaysRemaining, refreshEntitlements } = useSubscription();
  const { t, changeLanguage, language } = useTranslation();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    phone: '',
    bio: '',
    avatar_url: '',
    preferred_language: 'EN',
    notification_preferences: {
      enabled: true,
      reminders: true,
      missedDose: true,
      family: true,
      product: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      }
    }
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'AZ', name: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'TR', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'RU', name: 'Русский', flag: '🇷🇺' }
  ];

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setProfileData({
          display_name: data.display_name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          preferred_language: data.preferred_language || 'EN',
          notification_preferences: (data.notification_preferences as any) || profileData.notification_preferences
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationChange = (field: keyof NotificationPreferences, value: any) => {
    setProfileData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    setProfileData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        quietHours: {
          ...prev.notification_preferences.quietHours,
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          phone: profileData.phone,
          bio: profileData.bio,
          preferred_language: profileData.preferred_language,
          notification_preferences: profileData.notification_preferences as any
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setHasChanges(false);
      toast({
        title: t('settings.profile.saved'),
        description: t('settings.profile.savedDescription'),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('common.error'),
        description: t('settings.profile.saveError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage);
    handleProfileChange('preferred_language', newLanguage);
  };

  const handleManageSubscription = async () => {
    if (subscription.plan === 'free' && !isInTrial) {
      setShowPaywall(true);
      return;
    }
    
    // For paid users and trial users, open customer portal or paywall
    if (subscription.plan === 'free' && isInTrial) {
      setShowPaywall(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: t('common.error'),
        description: t('settings.billing.manageError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('export-user-data');
      
      if (error) throw error;
      
      if (data?.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast({
          title: t('settings.privacy.exportStarted'),
          description: t('settings.privacy.exportDescription'),
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: t('common.error'),
        description: t('settings.privacy.exportError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: t('common.error'),
        description: t('settings.account.deleteConfirmationError'),
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('delete-account');
      
      if (error) throw error;
      
      toast({
        title: t('settings.account.deleted'),
        description: t('settings.account.deletedDescription'),
      });
      
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: t('common.error'),
        description: t('settings.account.deleteError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test checkout function for debugging
  const testCheckout = async () => {
    try {
      console.log('[TEST-CHECKOUT] Starting test checkout...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: 'pro_individual', billing_cycle: 'monthly' }
      });
      
      console.log('[TEST-CHECKOUT] Response:', { data, error });
      
      if (error) {
        console.error('[TEST-CHECKOUT] Error:', error);
        toast({
          title: "Test Checkout Failed",
          description: JSON.stringify(error),
          variant: "destructive",
        });
        return;
      }
      
      if (data?.url) {
        console.log('[TEST-CHECKOUT] Success! URL:', data.url);
        toast({
          title: "Test Checkout Success",
          description: "Checkout URL created successfully",
        });
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('[TEST-CHECKOUT] Catch error:', error);
      toast({
        title: "Test Failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const getSubscriptionStatusColor = () => {
    if (isInTrial) return 'from-amber-500 to-orange-500';
    if (subscription.plan !== 'free') return 'from-primary to-primary-glow';
    return 'from-muted-foreground to-muted-foreground';
  };

  const getSubscriptionLabel = () => {
    if (isInTrial) return t('settings.billing.trialActive');
    if (subscription.plan === 'pro_individual') return t('settings.billing.proIndividual');
    if (subscription.plan === 'pro_family') return t('settings.billing.proFamily');
    return t('settings.billing.freePlan');
  };

  if (profileLoading) {
    return (
      <ProfessionalMobileLayout title={t('navigation.settings')} showHeader={true}>
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted rounded-2xl h-32" />
            ))}
          </div>
        </div>
      </ProfessionalMobileLayout>
    );
  }

  return (
    <ProfessionalMobileLayout
      title={t('navigation.settings')}
      showHeader={true}
      className="bg-background"
    >
      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Profile Section */}
        <Card className="rounded-2xl shadow-md overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <TranslatedText translationKey="settings.profile.title" fallback="Profile" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profileData.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white text-lg font-semibold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{t('settings.profile.tapToChange')}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">
                <TranslatedText translationKey="settings.profile.displayName" fallback="Display Name" />
              </Label>
              <Input
                id="displayName"
                value={profileData.display_name}
                onChange={(e) => handleProfileChange('display_name', e.target.value)}
                placeholder={t('settings.profile.enterName')}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                <TranslatedText translationKey="settings.profile.phone" fallback="Phone" />
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                placeholder={t('settings.profile.enterPhone')}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                <TranslatedText translationKey="settings.profile.bio" fallback="Bio" />
              </Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                placeholder={t('settings.profile.enterBio')}
                rows={3}
              />
            </div>

            {/* Save Button */}
            <Button 
              onClick={saveProfile} 
              disabled={!hasChanges || loading}
              className="w-full"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              <TranslatedText translationKey="common.save" fallback="Save" />
            </Button>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <TranslatedText translationKey="settings.language.title" fallback="Language & Region" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.language.language')}</p>
                <p className="text-sm text-muted-foreground">
                  {languages.find(l => l.code === language)?.name || 'English'}
                </p>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    {languages.find(l => l.code === language)?.flag} {t('common.change')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[400px]">
                  <SheetHeader>
                    <SheetTitle>{t('settings.language.selectLanguage')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {languages.map((lang) => (
                      <Button
                        key={lang.code}
                        variant={language === lang.code ? "default" : "ghost"}
                        className="w-full justify-start h-16"
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        <span className="text-2xl mr-3">{lang.flag}</span>
                        <div className="text-left">
                          <div className="font-medium">{lang.name}</div>
                          <div className="text-sm text-muted-foreground">{lang.code}</div>
                        </div>
                        {language === lang.code && <Check className="w-5 h-5 ml-auto" />}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <NotificationSettings className="rounded-2xl shadow-md" />

        {/* Billing & Plan */}
        <Card className="rounded-2xl shadow-md overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSubscriptionStatusColor()} flex items-center justify-center`}>
                {subscription.plan !== 'free' || isInTrial ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <CreditCard className="w-5 h-5 text-white" />
                )}
              </div>
              <TranslatedText translationKey="settings.billing.title" fallback="Billing & Plan" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Plan Status Card */}
            <div className="bg-gradient-to-br from-background to-muted/30 rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getSubscriptionStatusColor()} flex items-center justify-center`}>
                    {subscription.plan !== 'free' || isInTrial ? (
                      <Crown className="w-4 h-4 text-white" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('settings.billing.currentPlan')}</p>
                    <p className="font-semibold text-lg">{getSubscriptionLabel()}</p>
                  </div>
                </div>
                {isInTrial && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Trial expires in</p>
                    <p className="font-semibold text-amber-600">{trialDaysRemaining} days</p>
                  </div>
                )}
              </div>
              
              {/* Plan Features Preview */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {subscription.plan === 'free' ? '1' : '∞'}
                  </p>
                  <p className="text-xs text-muted-foreground">Reminders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {subscription.plan === 'pro_family' ? '5' : subscription.plan === 'pro_individual' ? '1' : '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">Family Members</p>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full mb-2"
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

              {/* Temporary Test Button for Debugging */}
              <Button 
                onClick={testCheckout}
                variant="outline"
                size="sm"
                className="w-full bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
              >
                🧪 Test Direct Checkout (Debug)
              </Button>
            </div>

            {/* Billing History */}
            {subscription.plan !== 'free' && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Billing History
                </h4>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    View your billing history and invoices in the customer portal
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <TranslatedText translationKey="settings.privacy.title" fallback="Privacy & Data" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.privacy.exportData')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.privacy.exportDescription')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData} disabled={loading}>
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.privacy.clearCache')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.privacy.clearCacheDescription')}</p>
              </div>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <TranslatedText translationKey="settings.security.title" fallback="Security" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.security.changePassword')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.security.changePasswordDescription')}</p>
              </div>
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.security.twoFactor')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.security.twoFactorDescription')}</p>
              </div>
              <Badge variant="outline">{t('settings.security.comingSoon')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="rounded-2xl shadow-md border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <TranslatedText translationKey="settings.account.title" fallback="Account" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.account.signOut')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.account.signOutDescription')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            {/* Delete Account */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">{t('settings.account.deleteAccount')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.account.deleteDescription')}</p>
                  </div>
                  <Button variant="destructive" size="sm">
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
                    <p>{t('settings.account.deleteWarning')}</p>
                    <div className="bg-destructive/10 p-3 rounded-lg text-sm">
                      <p className="font-medium mb-2">{t('settings.account.whatWillBeDeleted')}</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>{t('settings.account.medicationsData')}</li>
                        <li>{t('settings.account.remindersData')}</li>
                        <li>{t('settings.account.familyGroups')}</li>
                        <li>{t('settings.account.scanHistory')}</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('settings.account.confirmDelete')}</Label>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                        className="font-mono"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
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

      <PaywallSheet 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </ProfessionalMobileLayout>
  );
};

export default Settings;