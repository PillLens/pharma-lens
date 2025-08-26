import React, { useState, useEffect } from 'react';
import { Users, Heart, Shield, Users2, Check, ArrowLeft } from 'lucide-react';
import { FamilyGroupTemplate } from './enhanced/EnhancedFamilyEmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { TouchOptimizedInput } from '@/components/ui/mobile/TouchOptimizedInput';
import MobileNativeHeader from '@/components/mobile/MobileNativeHeader';
import { cn } from '@/lib/utils';

interface MobileCreateGroupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupName: string, template?: FamilyGroupTemplate) => void;
  isLoading?: boolean;
  template?: FamilyGroupTemplate;
}

const MobileCreateGroupSheet: React.FC<MobileCreateGroupSheetProps> = ({
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
    { name: 'Family', icon: Heart, color: 'bg-red-50 text-red-600 border-red-200' },
    { name: 'Caregivers', icon: Shield, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { name: 'Close Friends', icon: Users2, color: 'bg-green-50 text-green-600 border-green-200' },
    { name: 'Support Team', icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-200' },
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Native Mobile Header */}
      <MobileNativeHeader
        title={template ? `${t('family.actions.create')} ${template.name} ${t('family.group.title')}` : t('family.actions.createGroup')}
        subtitle={template ? template.description : t('family.group.createDescription')}
        onBack={onClose}
        variant="fullscreen"
      />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Group Name Input */}
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {t('family.group.nameYourGroup')}
                </h2>
                <p className="text-muted-foreground">
                  {t('family.group.nameDescription')}
                </p>
              </div>

              <TouchOptimizedInput
                label={t('family.group.name')}
                type="text"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setSelectedSuggestion(null);
                  setError('');
                }}
                placeholder={t('family.group.namePlaceholder')}
                error={error}
                maxLength={50}
                helperText={`${groupName.length}/50`}
                medical={true}
              />
            </div>

            {/* Template Info or Suggestions */}
            {template ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('family.template.membersIncluded')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('family.template.membersDescription')}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {template.members.map((member, index) => (
                    <div key={index} className="p-4 rounded-2xl bg-card border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{member.role}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.role === 'patient' && t('family.roles.patientDescription')}
                              {member.role === 'caregiver' && t('family.roles.caregiverDescription')}
                              {member.role === 'family' && t('family.roles.familyDescription')}
                              {member.role === 'emergency' && t('family.roles.emergencyDescription')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {member.permissions.view_medications && (
                            <Badge variant="secondary" className="text-xs">{t('family.permissions.view')}</Badge>
                          )}
                          {member.permissions.edit_medications && (
                            <Badge variant="secondary" className="text-xs">{t('family.permissions.edit')}</Badge>
                          )}
                          {member.permissions.receive_alerts && (
                            <Badge variant="secondary" className="text-xs">{t('family.permissions.alerts')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t('family.group.popularNames')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('family.group.popularNamesDescription')}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.map((suggestion) => {
                    const Icon = suggestion.icon;
                    const isSelected = selectedSuggestion === suggestion.name;
                    
                    return (
                      <button
                        key={suggestion.name}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion.name)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all duration-200 text-left relative",
                          "hover:scale-[1.02] active:scale-[0.98]",
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-lg' 
                            : 'border-border bg-card hover:border-muted-foreground/30'
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border",
                            suggestion.color
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{suggestion.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.name === 'Family' && t('family.suggestions.familyDescription')}
                              {suggestion.name === 'Caregivers' && t('family.suggestions.caregiversDescription')}
                              {suggestion.name === 'Close Friends' && t('family.suggestions.friendsDescription')}
                              {suggestion.name === 'Support Team' && t('family.suggestions.supportDescription')}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">{t('family.group.privacy')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('family.group.privacyDescription')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {t('family.group.encrypted')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {t('family.group.hipaaCompliant')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {t('family.group.controlledAccess')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="p-6 pt-0 space-y-3 bg-background border-t border-border/50">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-base font-semibold" 
              size="lg"
              disabled={isLoading || !groupName.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  {t('family.actions.creating')}
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-3" />
                  {t('family.actions.createGroup')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MobileCreateGroupSheet;