import React from 'react';
import { Plus, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface EmptyStateProps {
  onAddClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Medical Illustration */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 shadow-lg">
          <Pill className="w-12 h-12 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shadow-md animate-pulse">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-foreground">
          {t('medications.empty.title')}
        </h2>
        <p className="text-muted-foreground max-w-sm leading-relaxed">
          {t('medications.empty.description')}
        </p>
      </div>

      {/* Primary CTA */}
      <Button
        onClick={onAddClick}
        size="lg"
        className="w-full max-w-xs rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
      >
        <Plus className="w-5 h-5 mr-2" />
        {t('medications.empty.cta')}
      </Button>

      {/* Additional Help Text */}
      <p className="text-xs text-muted-foreground mt-6 max-w-xs">
        You can also scan medication labels with the scanner to add them automatically.
      </p>
    </div>
  );
};

export default EmptyState;