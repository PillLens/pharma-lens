import React from 'react';
import { Users, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

interface FamilyEmptyStateProps {
  onCreateGroup: () => void;
}

const FamilyEmptyState: React.FC<FamilyEmptyStateProps> = ({ onCreateGroup }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-8">
      <Card className="rounded-2xl shadow-md border-0 bg-card">
        <CardContent className="p-8 text-center">
          {/* Illustration */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-medical-success/20 flex items-center justify-center">
                  <Heart className="w-3 h-3 text-medical-success" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-medical-warning/20 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-medical-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              {t('family.empty.title')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('family.empty.subtitle')}
            </p>
            <p className="text-xs text-muted-foreground/80">
              {t('family.empty.description')}
            </p>
          </div>

          {/* CTA Button */}
          <div className="mt-8">
            <Button 
              onClick={onCreateGroup}
              size="lg"
              className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              <Users className="w-4 h-4 mr-2" />
              {t('family.empty.createButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyEmptyState;