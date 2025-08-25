import React, { useState, useEffect } from 'react';
import { User, Globe, Shield, CreditCard } from 'lucide-react';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranslatedText } from '@/components/TranslatedText';
import { SettingsProfile } from '@/components/settings/SettingsProfile';
import { SettingsPreferences } from '@/components/settings/SettingsPreferences';
import { SettingsSecurity } from '@/components/settings/SettingsSecurity';
import { SettingsAccount } from '@/components/settings/SettingsAccount';
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
      <div className="px-4 pt-4 pb-24">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-12">
            <TabsTrigger value="profile" className="flex-col h-full py-2">
              <User className="w-4 h-4 mb-1" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex-col h-full py-2">
              <Globe className="w-4 h-4 mb-1" />
              <span className="text-xs">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-col h-full py-2">
              <Shield className="w-4 h-4 mb-1" />
              <span className="text-xs">Security</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex-col h-full py-2">
              <CreditCard className="w-4 h-4 mb-1" />
              <span className="text-xs">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <SettingsProfile
              user={user}
              profileData={profileData}
              hasChanges={hasChanges}
              loading={loading}
              onProfileChange={handleProfileChange}
              onSaveProfile={saveProfile}
            />
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <SettingsPreferences
              language={language}
              onLanguageChange={handleLanguageChange}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SettingsSecurity
              loading={loading}
              onExportData={handleExportData}
            />
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <SettingsAccount
              subscription={subscription}
              isInTrial={isInTrial}
              trialDaysRemaining={trialDaysRemaining}
              loading={loading}
              deleteConfirmation={deleteConfirmation}
              onSetDeleteConfirmation={setDeleteConfirmation}
              onManageSubscription={handleManageSubscription}
              onTestCheckout={testCheckout}
              onSignOut={signOut}
              onDeleteAccount={handleDeleteAccount}
            />
          </TabsContent>
        </Tabs>
      </div>

      <PaywallSheet 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </ProfessionalMobileLayout>
  );
};

export default Settings;