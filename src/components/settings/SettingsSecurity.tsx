import React from 'react';
import { Shield, Key, Eye, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TranslatedText } from '@/components/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';

interface SettingsSecurityProps {
  loading: boolean;
  onExportData: () => void;
}

export const SettingsSecurity: React.FC<SettingsSecurityProps> = ({
  loading,
  onExportData
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Security Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <TranslatedText translationKey="settings.security.title" fallback="Security" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{t('settings.security.changePassword')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.security.changePasswordDescription')}</p>
            </div>
            <Button variant="outline" size="sm" className="h-10">
              <Key className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{t('settings.security.twoFactor')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.security.twoFactorDescription')}</p>
            </div>
            <Badge variant="outline">{t('settings.security.comingSoon')}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <TranslatedText translationKey="settings.privacy.title" fallback="Privacy & Data" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{t('settings.privacy.exportData')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.privacy.exportDescription')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onExportData} disabled={loading} className="h-10">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{t('settings.privacy.clearCache')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.privacy.clearCacheDescription')}</p>
            </div>
            <Button variant="outline" size="sm" className="h-10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};