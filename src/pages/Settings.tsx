import React, { useState, useEffect } from 'react';
import { 
  User, 
  Globe, 
  Shield, 
  CreditCard, 
  Phone, 
  Bell, 
  MapPin, 
  Download, 
  Trash2, 
  LogOut,
  Settings as SettingsIcon,
  Shield as SecurityIcon,
  HelpCircle,
  Info
} from 'lucide-react';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { TranslatedText } from '@/components/TranslatedText';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SettingsProfile } from '@/components/settings/SettingsProfile';
import { SettingsPreferences } from '@/components/settings/SettingsPreferences';
import { SettingsSecurity } from '@/components/settings/SettingsSecurity';
import { SettingsAccount } from '@/components/settings/SettingsAccount';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSectionHeader } from '@/components/settings/SettingsSectionHeader';
import { LocationTimezoneSettings } from '@/components/settings/LocationTimezoneSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);

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
          title: t('toast.testCheckoutFailed'),
          description: JSON.stringify(error),
          variant: "destructive",
        });
        return;
      }
      
      if (data?.url) {
        console.log('[TEST-CHECKOUT] Success! URL:', data.url);
        toast({
          title: t('toast.testCheckoutSuccess'),
          description: t('toast.checkoutUrlCreated'),
        });
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('[TEST-CHECKOUT] Catch error:', error);
      toast({
        title: t('toast.testFailed'),
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
          <div className="animate-pulse space-y-4">
            <div className="bg-muted rounded-2xl h-16" />
            <div className="bg-muted rounded-2xl h-96" />
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
      <div className="pb-24">
        {/* Profile Header */}
        <div className="px-4 py-6 bg-background border-b border-border/50">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profileData.avatar_url} />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {profileData.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-foreground truncate">
                {profileData.display_name || "User"}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
              {profileData.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {profileData.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="mt-6">
          <SettingsSectionHeader title={t('settings.account.title')} />
          <div className="bg-background">
            <SettingsRow
              icon={<User className="w-5 h-5 text-primary" />}
              title={t('settings.profile.editProfile')}
              subtitle={t('settings.profile.editProfileDescription')}
              onClick={() => setShowEditProfile(true)}
            />
            <SettingsRow
              icon={<SettingsIcon className="w-5 h-5 text-primary" />}
              title={t('settings.security.changePassword')}
              subtitle={t('settings.security.changePasswordDescription')}
              onClick={() => {}} // Placeholder
            />
            <SettingsRow
              icon={<Phone className="w-5 h-5 text-primary" />}
              title={t('settings.profile.phone')}
              value={profileData.phone || "Not set"}
              onClick={() => setShowEditProfile(true)}
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mt-6">
          <SettingsSectionHeader title={t('settings.preferences.title')} />
          <div className="bg-background">
            <SettingsRow
              icon={<Globe className="w-5 h-5 text-primary" />}
              title={t('settings.language.language')}
              value={languages.find(l => l.code === language)?.name}
              onClick={() => setShowLanguageSelect(true)}
            />
            <SettingsRow
              icon={<Bell className="w-5 h-5 text-primary" />}
              title={t('settings.notifications.title')}
              subtitle={profileData.notification_preferences.enabled 
                ? t('settings.notifications.enabled')
                : t('settings.notifications.disabled')
              }
              rightElement={
                <Switch
                  checked={profileData.notification_preferences.enabled}
                  onCheckedChange={(enabled) => handleNotificationChange('enabled', enabled)}
                />
              }
              onClick={() => setShowNotificationSettings(true)}
            />
            <SettingsRow
              icon={<MapPin className="w-5 h-5 text-primary" />}
              title={t('settings.location.title')}
              subtitle={t('settings.location.description')}
              onClick={() => setShowLocationSettings(true)}
            />
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="mt-6">
          <SettingsSectionHeader title={t('settings.privacy.title')} />
          <div className="bg-background">
            <SettingsRow
              icon={<Download className="w-5 h-5 text-primary" />}
              title={t('settings.privacy.exportData')}
              subtitle={t('settings.privacy.exportDescription')}
              onClick={handleExportData}
              showArrow={!loading}
            />
            <SettingsRow
              icon={<Trash2 className="w-5 h-5 text-primary" />}
              title={t('settings.privacy.clearCache')}
              subtitle={t('settings.privacy.clearCacheDescription')}
              onClick={() => {}} // Placeholder
            />
            <SettingsRow
              icon={<SecurityIcon className="w-5 h-5 text-muted-foreground" />}
              title={t('settings.security.twoFactor')}
              subtitle={t('settings.security.twoFactorDescription')}
              rightElement={<Badge variant="outline">{t('settings.security.comingSoon')}</Badge>}
              showArrow={false}
            />
          </div>
        </div>

        {/* Subscription Section */}
        <div className="mt-6">
          <SettingsSectionHeader title={t('settings.billing.title')} />
          <div className="bg-background">
            <SettingsRow
              icon={<CreditCard className="w-5 h-5 text-primary" />}
              title={t('settings.billing.currentPlan')}
              subtitle={getSubscriptionLabel()}
              rightElement={
                <Badge className={cn(
                  "text-xs font-medium bg-gradient-to-r text-white",
                  getSubscriptionStatusColor()
                )}>
                  {isInTrial ? `${trialDaysRemaining}d left` : subscription.plan}
                </Badge>
              }
              onClick={handleManageSubscription}
            />
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="mt-6 mb-6">
          <div className="bg-background">
            <SettingsRow
              icon={<LogOut className="w-5 h-5 text-muted-foreground" />}
              title={t('settings.account.signOut')}
              onClick={signOut}
              showArrow={false}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div>
                  <SettingsRow
                    icon={<Trash2 className="w-5 h-5 text-destructive" />}
                    title={t('settings.account.deleteAccount')}
                    subtitle={t('settings.account.deleteDescription')}
                    destructive={true}
                    showArrow={false}
                  />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.account.deleteWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <Label htmlFor="delete-confirmation">
                    {t('settings.account.deleteConfirmation')}
                  </Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="mt-2"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                    {t('common.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETE' || loading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loading ? t('common.loading') : t('settings.account.deleteAccount')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet open={showEditProfile} onOpenChange={setShowEditProfile}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{t('settings.profile.editProfile')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="display_name">{t('settings.profile.displayName')}</Label>
              <Input
                id="display_name"
                value={profileData.display_name}
                onChange={(e) => handleProfileChange('display_name', e.target.value)}
                placeholder={t('settings.profile.enterName')}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                placeholder={t('settings.profile.enterPhone')}
              />
            </div>
            <div>
              <Label htmlFor="bio">{t('settings.profile.bio')}</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                placeholder={t('settings.profile.enterBio')}
                rows={3}
              />
            </div>
            <Button 
              onClick={() => {
                saveProfile();
                setShowEditProfile(false);
              }}
              disabled={!hasChanges || loading}
              className="w-full"
            >
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Language Selection Sheet */}
      <Sheet open={showLanguageSelect} onOpenChange={setShowLanguageSelect}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>{t('settings.language.selectLanguage')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => {
                  handleLanguageChange(lang.code);
                  setShowLanguageSelect(false);
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Notification Settings Sheet */}
      <Sheet open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{t('settings.notifications.title')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <NotificationSettings />
          </div>
        </SheetContent>
      </Sheet>

      {/* Location Settings Sheet */}
      <Sheet open={showLocationSettings} onOpenChange={setShowLocationSettings}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Location & Timezone</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <LocationTimezoneSettings />
          </div>
        </SheetContent>
      </Sheet>

      <PaywallSheet 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </ProfessionalMobileLayout>
  );
};

export default Settings;