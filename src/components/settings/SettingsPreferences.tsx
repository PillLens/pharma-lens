import React from 'react';
import { Globe, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TranslatedText } from '@/components/TranslatedText';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { LocationTimezoneSettings } from '@/components/settings/LocationTimezoneSettings';
import { useTranslation } from '@/hooks/useTranslation';

interface SettingsPreferencesProps {
  language: string;
  onLanguageChange: (language: string) => void;
}

export const SettingsPreferences: React.FC<SettingsPreferencesProps> = ({
  language,
  onLanguageChange
}) => {
  const { t } = useTranslation();

  const languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'AZ', name: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'TR', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'RU', name: 'Русский', flag: '🇷🇺' }
  ];

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <TranslatedText translationKey="settings.language.title" fallback="Language" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.language.language')}</p>
              <p className="text-sm text-muted-foreground">
                {languages.find(l => l.code === language)?.name || 'English'}
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
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
                      onClick={() => onLanguageChange(lang.code)}
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

      {/* Location & Timezone */}
      <LocationTimezoneSettings />

      {/* Notifications */}
      <NotificationSettings className="border-0 shadow-sm" />
    </div>
  );
};