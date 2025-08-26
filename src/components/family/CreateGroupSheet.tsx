import React, { useState, useEffect } from 'react';
import { Users, Heart, Shield, Users2 } from 'lucide-react';
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
  const [groupName, setGroupName] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Auto-fill group name when template is provided
  useEffect(() => {
    if (template && isOpen) {
      setGroupName(template.name);
      setSelectedSuggestion(template.name);
    }
  }, [template, isOpen]);

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
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="relative p-0 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5">
            <div className="relative p-4 pb-6 sm:p-6 sm:pb-8">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-primary/5 rounded-full blur-3xl -translate-y-4 sm:-translate-y-8 translate-x-4 sm:translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-secondary/10 rounded-full blur-2xl translate-y-2 sm:translate-y-4 -translate-x-2 sm:-translate-x-4"></div>
              
              <div className="relative flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                  <SheetTitle className="text-lg sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2 line-clamp-2">
                    {template ? `Create ${template.name} Group` : t('family.actions.createGroup')}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {template 
                      ? template.description 
                      : "Create a group to share medications with trusted people"
                    }
                  </p>
                  {template && (
                    <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary flex-shrink-0"></div>
                      <span className="text-xs font-medium text-primary truncate">Template Selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
            {/* Group Name Input */}
            <div className="space-y-2">
              <Label htmlFor="groupName">{t('family.group.name')}</Label>
              <Input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setSelectedSuggestion(null);
                  setError('');
                }}
                placeholder="Enter group name"
                className={error ? 'border-destructive' : ''}
                maxLength={50}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Choose a name that describes your group</span>
                <span>{groupName.length}/50</span>
              </div>
            </div>

            {/* Template Info or Suggestions */}
            {template ? (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Template Members</h3>
                <div className="space-y-2">
                  {template.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{member.role}</span>
                      </div>
                      <div className="flex gap-1">
                        {member.permissions.view_medications && (
                          <Badge variant="secondary" className="text-xs">View</Badge>
                        )}
                        {member.permissions.edit_medications && (
                          <Badge variant="secondary" className="text-xs">Edit</Badge>
                        )}
                        {member.permissions.receive_alerts && (
                          <Badge variant="secondary" className="text-xs">Alerts</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Popular Group Names</h3>
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.map((suggestion) => {
                    const Icon = suggestion.icon;
                    const isSelected = selectedSuggestion === suggestion.name;
                    
                    return (
                      <button
                        key={suggestion.name}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion.name)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${suggestion.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{suggestion.name}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-medical-info/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-medical-info" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Privacy & Security</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Only invited members can see shared medications. You control who has access and what they can do.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">End-to-end encrypted</Badge>
                    <Badge variant="secondary" className="text-xs">HIPAA compliant</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 space-y-3">
            <Button 
              type="submit" 
              className="w-full rounded-xl" 
              size="lg"
              disabled={isLoading || !groupName.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating Group...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  {t('family.actions.createGroup')}
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full rounded-xl" 
              onClick={onClose}
              disabled={isLoading}
            >
              {t('family.actions.cancel')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateGroupSheet;