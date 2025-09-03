import React, { useState } from 'react';
import { UserPlus, Mail, Phone, Shield, Eye, Edit, Bell, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsMobile } from '@/hooks/use-mobile';
import { TouchOptimizedInput } from '@/components/ui/mobile/TouchOptimizedInput';
import BottomSheet from '@/components/ui/mobile/BottomSheet';
import { cn } from '@/lib/utils';

interface MobileInviteMemberSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (memberData: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    permissions: {
      canView: boolean;
      canEdit: boolean;
      receiveNotifications: boolean;
      emergencyAccess: boolean;
    };
  }) => void;
  isLoading?: boolean;
}

const MobileInviteMemberSheet: React.FC<MobileInviteMemberSheetProps> = ({
  isOpen,
  onClose,
  onInvite,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    permissions: {
      canView: true,
      canEdit: false,
      receiveNotifications: true,
      emergencyAccess: false,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRolePicker, setShowRolePicker] = useState(false);
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      permissions: {
        canView: true,
        canEdit: false,
        receiveNotifications: true,
        emergencyAccess: false,
      },
    });
    setErrors({});
  };

  // Reset form when sheet closes
  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const roles = [
    { value: 'patient', label: t('family.roles.patient'), icon: '🩺' },
    { value: 'caregiver', label: t('family.roles.caregiver'), icon: '👥' },
    { value: 'family', label: t('family.roles.family'), icon: '👨‍👩‍👧‍👦' },
    { value: 'emergency', label: t('family.roles.emergency'), icon: '🚨' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('family.validation.memberNameRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('family.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('family.validation.invalidEmail');
    }
    
    if (!formData.role) {
      newErrors.role = t('family.validation.roleRequired');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onInvite(formData);
      // Don't reset form here - let parent handle success/failure
    }
  };

  const handlePermissionChange = (permission: keyof typeof formData.permissions, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
      },
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
    setShowRolePicker(false);
    
    // Auto-adjust permissions based on role
    if (role === 'caregiver') {
      setFormData(prev => ({
        ...prev,
        permissions: {
          canView: true,
          canEdit: true,
          receiveNotifications: true,
          emergencyAccess: true,
        },
      }));
    } else if (role === 'family') {
      setFormData(prev => ({
        ...prev,
        permissions: {
          canView: true,
          canEdit: false,
          receiveNotifications: true,
          emergencyAccess: false,
        },
      }));
    } else if (role === 'emergency') {
      setFormData(prev => ({
        ...prev,
        permissions: {
          canView: true,
          canEdit: false,
          receiveNotifications: false,
          emergencyAccess: true,
        },
      }));
    }
  };

  const selectedRole = roles.find(role => role.value === formData.role);

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose}
      title={t('family.member.invite')}
      subtitle="Add a new member to your family group"
      height="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">Basic Information</h3>
          
          <TouchOptimizedInput
            label={t('family.member.name')}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter full name"
            error={errors.name}
            medical={true}
          />

          <TouchOptimizedInput
            label={t('family.member.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            leftIcon={<Mail />}
            error={errors.email}
            medical={true}
          />

          <TouchOptimizedInput
            label={t('family.member.phone')}
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
            leftIcon={<Phone />}
            helperText={t('common.optional')}
            medical={true}
          />
        </div>

        <Separator className="bg-border/50" />

        {/* Role Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">{t('family.member.role')}</h3>
          
          <div className="space-y-2">
            <Label htmlFor="role-picker" className="text-sm font-medium text-foreground">
              Select Role
            </Label>
            <button
              type="button"
              id="role-picker"
              onClick={() => setShowRolePicker(true)}
              className={cn(
                "w-full h-14 px-4 rounded-xl border border-border bg-background",
                "flex items-center justify-between",
                "text-left transition-colors",
                "hover:bg-accent/50 active:bg-accent",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.role && "border-destructive"
              )}
            >
              <div className="flex items-center gap-3">
                {selectedRole ? (
                  <>
                    <span className="text-xl">{selectedRole.icon}</span>
                    <span className="font-medium text-foreground">{selectedRole.label}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select a role</span>
                )}
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Permissions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">{t('family.member.permissions')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('family.permissions.view')}</p>
                  <p className="text-sm text-muted-foreground">View medication information</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.canView}
                onCheckedChange={(value) => handlePermissionChange('canView', value)}
                className="scale-110"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('family.permissions.edit')}</p>
                  <p className="text-sm text-muted-foreground">Edit and manage medications</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.canEdit}
                onCheckedChange={(value) => handlePermissionChange('canEdit', value)}
                className="scale-110"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('family.permissions.notifications')}</p>
                  <p className="text-sm text-muted-foreground">Get medication reminders</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.receiveNotifications}
                onCheckedChange={(value) => handlePermissionChange('receiveNotifications', value)}
                className="scale-110"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t('family.permissions.emergencyAccess')}</p>
                  <p className="text-sm text-muted-foreground">Access during emergencies</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.emergencyAccess}
                onCheckedChange={(value) => handlePermissionChange('emergencyAccess', value)}
                className="scale-110"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-1 flex flex-col justify-end space-y-3 pt-6">
          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl text-base font-semibold" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                Sending Invite...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-3" />
                {t('family.actions.sendInvite')}
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-14 rounded-xl text-base font-medium" 
            onClick={onClose}
            disabled={isLoading}
          >
            {t('family.actions.cancel')}
          </Button>
        </div>
      </form>

      {/* Role Picker Bottom Sheet */}
      <BottomSheet
        isOpen={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        title="Select Role"
        subtitle="Choose the appropriate role for this member"
        height="xl"
        className="z-[110]"
      >
        <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-6 space-y-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={cn(
                    "w-full h-20 px-4 rounded-xl border",
                    "flex items-center gap-4",
                    "text-left transition-all duration-200",
                    "hover:bg-accent/50 active:bg-accent active:scale-[0.98]",
                    "touch-manipulation",
                    formData.role === role.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  )}
                >
                  <span className="text-3xl flex-shrink-0">{role.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-lg">{role.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.value === 'patient' && 'Primary care recipient'}
                      {role.value === 'caregiver' && 'Full access to manage care'}
                      {role.value === 'family' && 'Family member with view access'}
                      {role.value === 'emergency' && 'Emergency contact only'}
                    </p>
                  </div>
                  {formData.role === role.value && (
                    <Check className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </BottomSheet>
  );
};

export default MobileInviteMemberSheet;