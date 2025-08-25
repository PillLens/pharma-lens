import React from 'react';
import { MapPin, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TranslatedText } from '@/components/TranslatedText';
import { useTranslation } from '@/hooks/useTranslation';

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onAllow: () => Promise<void>;
  onDeny: () => void;
  loading: boolean;
}

export const LocationPermissionDialog: React.FC<LocationPermissionDialogProps> = ({
  isOpen,
  onAllow,
  onDeny,
  loading
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onDeny}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <TranslatedText translationKey="location.permissionTitle" fallback="Location Permission" />
          </DialogTitle>
          <DialogDescription>
            <TranslatedText 
              translationKey="location.permissionDescription" 
              fallback="We'd like to access your location to provide accurate medication reminders based on your timezone."
            />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  <TranslatedText translationKey="location.benefit1Title" fallback="Accurate Reminders" />
                </p>
                <p className="text-sm text-muted-foreground">
                  <TranslatedText 
                    translationKey="location.benefit1Description" 
                    fallback="Get medication reminders at the right time in your local timezone"
                  />
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  <TranslatedText translationKey="location.benefit2Title" fallback="Location Context" />
                </p>
                <p className="text-sm text-muted-foreground">
                  <TranslatedText 
                    translationKey="location.benefit2Description" 
                    fallback="Optional: Show your city for family members to know your location"
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <TranslatedText 
                  translationKey="location.privacyNote" 
                  fallback="Your location data is stored securely and only used for medication reminders. You can disable this anytime in Settings."
                />
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onDeny} 
              className="flex-1"
              disabled={loading}
            >
              <TranslatedText translationKey="location.denyButton" fallback="Not Now" />
            </Button>
            <Button 
              onClick={onAllow} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              <TranslatedText translationKey="location.allowButton" fallback="Allow Location" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};