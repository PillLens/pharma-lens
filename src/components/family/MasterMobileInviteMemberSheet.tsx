import React, { useState } from 'react';
import { UserPlus, Mail, Phone, Shield, Eye, Edit, Bell, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import { TouchOptimizedInput } from '@/components/ui/mobile/TouchOptimizedInput';
import MobileNativeHeader from '@/components/mobile/MobileNativeHeader';
import { cn } from '@/lib/utils';

interface MasterMobileInviteMemberSheetProps {
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

const MasterMobileInviteMemberSheet: React.FC<MasterMobileInviteMemberSheetProps> = ({
  isOpen,
  onClose,
  onInvite,
  isLoading = false,
}) => {
  const { t } = useTranslation();
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

  const roles = [
    { 
      value: 'patient', 
      label: t('family.roles.patient'), 
      description: t('family.roles.patientDescription'),
      icon: '🩺',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    { 
      value: 'caregiver', 
      label: t('family.roles.caregiver'), 
      description: t('family.roles.caregiverDescription'),
      icon: '👥',
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    { 
      value: 'family', 
      label: t('family.roles.family'), 
      description: t('family.roles.familyDescription'),
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    { 
      value: 'emergency', 
      label: t('family.roles.emergency'), 
      description: t('family.roles.emergencyDescription'),
      icon: '🚨',
      color: 'bg-red-50 text-red-600 border-red-200'
    },
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
      // Reset form
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

  if (!isOpen) return null;

  // Role Picker Full Screen
  if (showRolePicker) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <MobileNativeHeader
          title={t('family.member.selectRole')}
          subtitle="Choose the appropriate role for this member"
          onBack={() => setShowRolePicker(false)}
          variant="fullscreen"
        />
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => handleRoleChange(role.value)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-200",
                "text-left hover:scale-[1.01] active:scale-[0.99]",
                "relative",
                formData.role === role.value
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              {formData.role === role.value && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl border",
                  role.color
                )}>
                  {role.icon}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {role.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Main Invite Form
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <MobileNativeHeader
        title={t('family.member.invite')}
        subtitle="Add a new member to your family group"
        onBack={onClose}
        variant="fullscreen"
      />

      <div className="flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  {t('family.member.invite')}
                </h2>
                <p className="text-muted-foreground">
                  {t('family.group.createDescription')}
                </p>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('family.member.basicInfo')}
                </h3>
              </div>
              
              <TouchOptimizedInput
                label={t('family.member.name')}
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                error={errors.name}
                medical={true}
              />

              <div className="space-y-3">
                <TouchOptimizedInput
                  label={t('family.member.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  error={errors.email}
                  medical={true}
                />
                <div className="flex items-center gap-3 px-1">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send a secure invitation to this email address
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <TouchOptimizedInput
                  label={t('family.member.phone')}
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  helperText={t('common.optional')}
                  medical={true}
                />
                <div className="flex items-center gap-3 px-1">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional for emergency contact and notifications
                  </p>
                </div>
              </div>
            </div>

            {/* Role Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('family.member.role')}
                </h3>
              </div>
              
              <button
                type="button"
                onClick={() => setShowRolePicker(true)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 transition-all duration-200",
                  "text-left hover:scale-[1.01] active:scale-[0.99]",
                  "relative",
                  errors.role ? "border-destructive" : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                {selectedRole ? (
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl border",
                      selectedRole.color
                    )}>
                      {selectedRole.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{selectedRole.label}</h4>
                      <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-muted-foreground">{t('family.member.selectRole')}</p>
                  </div>
                )}
              </button>
              {errors.role && (
                <p className="text-sm text-destructive px-1">{errors.role}</p>
              )}
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('family.member.permissions')}
                </h3>
              </div>
              
              <div className="space-y-1">
                {/* View Permission */}
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{t('family.permissions.view')}</p>
                        <p className="text-sm text-muted-foreground">{t('family.permissions.viewDescription')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.permissions.canView}
                      onCheckedChange={(value) => handlePermissionChange('canView', value)}
                      className="scale-110"
                    />
                  </div>
                </div>

                {/* Edit Permission */}
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <Edit className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{t('family.permissions.edit')}</p>
                        <p className="text-sm text-muted-foreground">{t('family.permissions.editDescription')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.permissions.canEdit}
                      onCheckedChange={(value) => handlePermissionChange('canEdit', value)}
                      className="scale-110"
                    />
                  </div>
                </div>

                {/* Notifications Permission */}
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{t('family.permissions.notifications')}</p>
                        <p className="text-sm text-muted-foreground">{t('family.permissions.notificationsDescription')}</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.permissions.receiveNotifications}
                      onCheckedChange={(value) => handlePermissionChange('receiveNotifications', value)}
                      className="scale-110"
                    />
                  </div>
                </div>

                {/* Emergency Access Permission */}
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{t('family.permissions.emergencyAccess')}</p>
                        <p className="text-sm text-muted-foreground">{t('family.permissions.emergencyAccessDescription')}</p>
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
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="p-6 pt-0 space-y-3 bg-background border-t border-border/50">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl text-base font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  {t('family.actions.inviting')}
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-3" />
                  {t('family.actions.sendInvite')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterMobileInviteMemberSheet;