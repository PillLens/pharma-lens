import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCreateGroupSheet from './MobileCreateGroupSheet';
import { FamilyGroupTemplate } from './enhanced/EnhancedFamilyEmptyState';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { Users, Heart, Shield, Users2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CreateGroupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupName: string, template?: FamilyGroupTemplate) => void;
  isLoading?: boolean;
  template?: FamilyGroupTemplate;
}

const CreateGroupSheet: React.FC<CreateGroupSheetProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
  template,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // All hooks must be called before any conditional returns
  const [groupName, setGroupName] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [error, setError] = useState('');

  // This useEffect must also be called before conditional returns
  useEffect(() => {
    if (template && isOpen) {
      setGroupName(template.name);
      setSelectedSuggestion(template.name);
    }
  }, [template, isOpen]);

  // Use mobile version on mobile devices
  if (isMobile) {
    return (
      <MobileCreateGroupSheet
        isOpen={isOpen}
        onClose={onClose}
        onCreate={onCreate}
        isLoading={isLoading}
        template={template}
      />
    );
  }

  const suggestions = [
    { name: 'Family', icon: Heart, color: 'bg-medical-success/20 text-medical-success' },
    { name: 'Caregivers', icon: Shield, color: 'bg-medical-info/20 text-medical-info' },
    { name: 'Close Friends', icon: Users2, color: 'bg-medical-warning/20 text-medical-warning' },
    { name: 'Support Team', icon: Users, color: 'bg-primary/20 text-primary' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError(t('family.validation.groupNameRequired'));
      return;
    }

    onCreate(groupName.trim(), template);
    setGroupName('');
    setSelectedSuggestion(null);
    setError('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setGroupName(suggestion);
    setSelectedSuggestion(suggestion);
    setError('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-md p-0">
        {/* ... keep existing desktop code */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            <div>
              <SheetTitle>
                {template ? `${t('family.actions.create')} ${template.name} ${t('family.group.title')}` : t('family.actions.createGroup')}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {template 
                  ? template.description 
                  : t('family.group.createDescription')
                }
              </p>
            </div>
            </div>
          </SheetHeader>
          {/* ... rest of existing desktop implementation */}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateGroupSheet;