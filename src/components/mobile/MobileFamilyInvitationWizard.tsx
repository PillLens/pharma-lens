import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Mail, QrCode, Shield, Eye, Edit, Bell, CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import BottomSheet from '@/components/ui/mobile/BottomSheet';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { familySharingService, FamilyGroup } from '@/services/familySharingService';

interface MobileFamilyInvitationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  familyGroup: FamilyGroup;
  onInviteSent?: () => void;
}

const STEPS = [
  { id: 'contact', title: 'Contact Info', description: 'Who would you like to invite?' },
  { id: 'role', title: 'Role & Access', description: 'What role will they have?' },
  { id: 'permissions', title: 'Permissions', description: 'What can they do?' },
  { id: 'share', title: 'Send Invite', description: 'Share invitation link' }
];

export const MobileFamilyInvitationWizard: React.FC<MobileFamilyInvitationWizardProps> = ({
  isOpen,
  onClose,
  familyGroup,
  onInviteSent
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'caregiver' | 'patient' | 'emergency_contact'>('patient');
  const [permissions, setPermissions] = useState({
    view_medications: true,
    edit_medications: false,
    receive_alerts: true
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (currentStep === 3) {
      generateInviteLink();
    }
  }, [currentStep, email, role, permissions, familyGroup.id]);

  const generateInviteLink = async () => {
    // Generate invitation link (this would be a real backend endpoint in production)
    const inviteData = {
      groupId: familyGroup.id,
      groupName: familyGroup.name,
      email,
      role,
      permissions
    };
    
    const link = `${window.location.origin}/family/invite?data=${btoa(JSON.stringify(inviteData))}`;
    setInviteLink(link);
    
    try {
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return email.includes('@');
      case 1: return role;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSendInvite = async () => {
    setLoading(true);
    try {
      const success = await familySharingService.inviteFamilyMember(
        familyGroup.id,
        email,
        role,
        permissions
      );

      if (success) {
        toast.success('Invitation sent successfully!');
        onInviteSent?.();
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const shareViaEmail = () => {
    const subject = `Join ${familyGroup.name} on PharmaLens`;
    const body = `You've been invited to join ${familyGroup.name} on PharmaLens.\n\nClick here to accept: ${inviteLink}`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const resetForm = () => {
    setCurrentStep(0);
    setEmail('');
    setRole('patient');
    setPermissions({
      view_medications: true,
      edit_medications: false,
      receive_alerts: true
    });
    setQrCodeUrl('');
    setInviteLink('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <p className="text-muted-foreground text-sm">
                Enter the email address of the person you'd like to invite to {familyGroup.name}.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="family.member@example.com"
                className="h-12"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Role & Access Level</h3>
              <p className="text-muted-foreground text-sm">
                Choose the appropriate role for this family member.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Patient</div>
                        <div className="text-xs text-muted-foreground">Person taking medications</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="caregiver">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Caregiver</div>
                        <div className="text-xs text-muted-foreground">Can manage medications</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="emergency_contact">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Emergency Contact</div>
                        <div className="text-xs text-muted-foreground">Receives alerts only</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Edit className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Permissions</h3>
              <p className="text-muted-foreground text-sm">
                Customize what this family member can access and do.
              </p>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">View Medications</div>
                        <div className="text-xs text-muted-foreground">See medication list and history</div>
                      </div>
                    </div>
                    <Switch
                      checked={permissions.view_medications}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, view_medications: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Edit className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Edit Medications</div>
                        <div className="text-xs text-muted-foreground">Add, modify, and delete medications</div>
                      </div>
                    </div>
                    <Switch
                      checked={permissions.edit_medications}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, edit_medications: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Bell className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium">Receive Safety Alerts</div>
                        <div className="text-xs text-muted-foreground">Get notified about interactions</div>
                      </div>
                    </div>
                    <Switch
                      checked={permissions.receive_alerts}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, receive_alerts: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Send Invitation</h3>
              <p className="text-muted-foreground text-sm">
                Share this QR code or link to invite {email} to {familyGroup.name}.
              </p>
            </div>
            
            {qrCodeUrl && (
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white rounded-xl border">
                  <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Scan with any QR code reader
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={shareViaEmail}
                className="w-full h-12"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </Button>

              <Button
                onClick={copyInviteLink}
                className="w-full h-12"
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Invite Link
              </Button>
            </div>

            <Separator />

            <Button
              onClick={handleSendInvite}
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Invite Family Member</h2>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? handleClose : handleBack}
            className="h-12 px-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="h-12 px-6"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
};