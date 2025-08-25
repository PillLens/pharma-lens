import React from 'react';
import { User, Camera, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TranslatedText } from '@/components/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';

interface ProfileData {
  display_name: string;
  phone: string;
  bio: string;
  avatar_url: string;
  preferred_language: string;
  notification_preferences: any;
}

interface SettingsProfileProps {
  user: any;
  profileData: ProfileData;
  hasChanges: boolean;
  loading: boolean;
  onProfileChange: (field: keyof ProfileData, value: any) => void;
  onSaveProfile: () => void;
}

export const SettingsProfile: React.FC<SettingsProfileProps> = ({
  user,
  profileData,
  hasChanges,
  loading,
  onProfileChange,
  onSaveProfile
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profileData.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white text-xl font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button 
            size="sm" 
            variant="outline" 
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 shadow-md"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
        <div>
          <p className="font-medium">{profileData.display_name || t('settings.profile.noName')}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              <TranslatedText translationKey="settings.profile.displayName" fallback="Display Name" />
            </Label>
            <Input
              id="displayName"
              value={profileData.display_name}
              onChange={(e) => onProfileChange('display_name', e.target.value)}
              placeholder={t('settings.profile.enterName')}
              className="h-12"
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
              onChange={(e) => onProfileChange('phone', e.target.value)}
              placeholder={t('settings.profile.enterPhone')}
              className="h-12"
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
              onChange={(e) => onProfileChange('bio', e.target.value)}
              placeholder={t('settings.profile.enterBio')}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={onSaveProfile} 
            disabled={!hasChanges || loading}
            className="w-full h-12"
            size="lg"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            <TranslatedText translationKey="common.save" fallback="Save Changes" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};