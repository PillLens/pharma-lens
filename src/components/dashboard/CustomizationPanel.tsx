import React, { useState } from 'react';
import { Settings, Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TranslatedText } from '@/components/TranslatedText';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface DashboardCard {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

interface CustomizationPanelProps {
  cards: DashboardCard[];
  onSave: (cards: DashboardCard[]) => void;
  onReset: () => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  cards: initialCards,
  onSave,
  onReset,
}) => {
  const [cards, setCards] = useState(initialCards);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleVisibility = (id: string) => {
    setCards(prev =>
      prev.map(card =>
        card.id === id ? { ...card, visible: !card.visible } : card
      )
    );
  };

  const handleSave = () => {
    onSave(cards);
    toast.success('Dashboard customized', {
      description: 'Your preferences have been saved'
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    onReset();
    setCards(initialCards);
    toast.info('Dashboard reset', {
      description: 'Restored to default layout'
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Customize dashboard"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">
            <TranslatedText 
              translationKey="dashboard.customize.button" 
              fallback="Customize" 
            />
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            <TranslatedText 
              translationKey="dashboard.customize.title" 
              fallback="Customize Dashboard" 
            />
          </SheetTitle>
          <SheetDescription>
            <TranslatedText 
              translationKey="dashboard.customize.description" 
              fallback="Show or hide dashboard cards to personalize your view" 
            />
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Card visibility toggles */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              <TranslatedText 
                translationKey="dashboard.customize.visibility" 
                fallback="Card Visibility" 
              />
            </h3>
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <Label
                    htmlFor={`toggle-${card.id}`}
                    className="cursor-pointer font-medium"
                  >
                    {card.label}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  {card.visible ? (
                    <Eye className="w-4 h-4 text-success" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  )}
                  <Switch
                    id={`toggle-${card.id}`}
                    checked={card.visible}
                    onCheckedChange={() => handleToggleVisibility(card.id)}
                    aria-label={`Toggle ${card.label} visibility`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 gap-2"
              aria-label="Reset to default layout"
            >
              <RotateCcw className="w-4 h-4" />
              <TranslatedText 
                translationKey="dashboard.customize.reset" 
                fallback="Reset" 
              />
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <TranslatedText 
                translationKey="common.save" 
                fallback="Save" 
              />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
