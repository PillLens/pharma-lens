import React, { useState } from 'react';
import { UserPlus, Mail, Phone, Shield, Eye, Edit, Bell } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';

interface InviteMemberSheetProps {
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

const InviteMemberSheet: React.FC<InviteMemberSheetProps> = ({
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-md p-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <SheetTitle>{t('family.member.invite')}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Add a new member to your family group
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">{t('family.member.name')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('family.member.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('family.member.phone')} <span className="text-muted-foreground text-xs">({t('common.optional')})</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">{t('family.member.role')}</h3>
              
              <div className="space-y-2">
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">{t('family.roles.patient')}</SelectItem>
                    <SelectItem value="caregiver">{t('family.roles.caregiver')}</SelectItem>
                    <SelectItem value="family">{t('family.roles.family')}</SelectItem>
                    <SelectItem value="emergency">{t('family.roles.emergency')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
              </div>
            </div>

            <Separator />

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">{t('family.member.permissions')}</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t('family.permissions.view')}</p>
                      <p className="text-xs text-muted-foreground">View medication information</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.permissions.canView}
                    onCheckedChange={(value) => handlePermissionChange('canView', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t('family.permissions.edit')}</p>
                      <p className="text-xs text-muted-foreground">Edit and manage medications</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.permissions.canEdit}
                    onCheckedChange={(value) => handlePermissionChange('canEdit', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t('family.permissions.notifications')}</p>
                      <p className="text-xs text-muted-foreground">Get medication reminders</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.permissions.receiveNotifications}
                    onCheckedChange={(value) => handlePermissionChange('receiveNotifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t('family.permissions.emergencyAccess')}</p>
                      <p className="text-xs text-muted-foreground">Access during emergencies</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.permissions.emergencyAccess}
                    onCheckedChange={(value) => handlePermissionChange('emergencyAccess', value)}
                  />
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending Invite...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('family.actions.sendInvite')}
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

export default InviteMemberSheet;