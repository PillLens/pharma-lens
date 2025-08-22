import React, { useState, useEffect } from 'react';
import { Share2, Eye, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { familySharingService, FamilyGroup, SharedMedication } from '@/services/familySharingService';

interface MedicationSharingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  medicationId: string;
  medicationName: string;
  familyGroups: FamilyGroup[];
}

export const MedicationSharingSheet: React.FC<MedicationSharingSheetProps> = ({
  isOpen,
  onClose,
  medicationId,
  medicationName,
  familyGroups
}) => {
  const [sharedMedications, setSharedMedications] = useState<SharedMedication[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && medicationId) {
      loadSharedMedications();
    }
  }, [isOpen, medicationId]);

  const loadSharedMedications = async () => {
    setLoading(true);
    try {
      // Get all shared medications for this medication across all family groups
      const allShared = await Promise.all(
        familyGroups.map(group => 
          familySharingService.getSharedMedications(group.id)
        )
      );
      
      const currentMedicationShares = allShared
        .flat()
        .filter(shared => shared.medication_id === medicationId);
      
      setSharedMedications(currentMedicationShares);
    } catch (error) {
      console.error('Error loading shared medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareMedication = async (
    groupId: string,
    permissions: { view: boolean; edit: boolean; delete: boolean }
  ) => {
    try {
      const success = await familySharingService.shareMedication(
        medicationId,
        groupId,
        permissions
      );

      if (success) {
        await loadSharedMedications();
        toast({
          title: 'Medication Shared',
          description: `${medicationName} has been shared with the family group`,
        });
      }
    } catch (error) {
      console.error('Error sharing medication:', error);
      toast({
        title: 'Error',
        description: 'Failed to share medication',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePermissions = async (
    sharedMedicationId: string,
    permissions: { view: boolean; edit: boolean; delete: boolean }
  ) => {
    try {
      await familySharingService.updateSharingPermissions(sharedMedicationId, permissions);
      await loadSharedMedications();
      toast({
        title: 'Permissions Updated',
        description: 'Sharing permissions have been updated',
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    }
  };

  const handleStopSharing = async (sharedMedicationId: string) => {
    try {
      await familySharingService.stopSharingMedication(sharedMedicationId);
      await loadSharedMedications();
      toast({
        title: 'Sharing Stopped',
        description: 'Medication is no longer shared with this group',
      });
    } catch (error) {
      console.error('Error stopping sharing:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop sharing',
        variant: 'destructive',
      });
    }
  };

  const isGroupShared = (groupId: string) => {
    return sharedMedications.some(shared => shared.family_group_id === groupId);
  };

  const getSharedMedication = (groupId: string) => {
    return sharedMedications.find(shared => shared.family_group_id === groupId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share {medicationName}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="text-sm text-muted-foreground">
            Share this medication with your family groups to coordinate care and monitor adherence together.
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {familyGroups.map(group => {
                const shared = getSharedMedication(group.id);
                const isShared = isGroupShared(group.id);

                return (
                  <Card key={group.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <Badge variant={isShared ? "default" : "outline"}>
                          {isShared ? "Shared" : "Not Shared"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!isShared ? (
                        <ShareMedicationForm
                          onShare={(permissions) => handleShareMedication(group.id, permissions)}
                        />
                      ) : (
                        <SharedMedicationControls
                          sharedMedication={shared!}
                          onUpdatePermissions={handleUpdatePermissions}
                          onStopSharing={handleStopSharing}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {familyGroups.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Share2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  You need to create a family group first to share medications.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface ShareMedicationFormProps {
  onShare: (permissions: { view: boolean; edit: boolean; delete: boolean }) => void;
}

const ShareMedicationForm: React.FC<ShareMedicationFormProps> = ({ onShare }) => {
  const [permissions, setPermissions] = useState({
    view: true,
    edit: false,
    delete: false
  });

  const handleShare = () => {
    onShare(permissions);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Permissions</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="view-permission" className="text-sm">View medication details</Label>
            </div>
            <Switch
              id="view-permission"
              checked={permissions.view}
              onCheckedChange={(checked) => 
                setPermissions(prev => ({ ...prev, view: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="edit-permission" className="text-sm">Edit medication</Label>
            </div>
            <Switch
              id="edit-permission"
              checked={permissions.edit}
              onCheckedChange={(checked) => 
                setPermissions(prev => ({ ...prev, edit: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="delete-permission" className="text-sm">Delete medication</Label>
            </div>
            <Switch
              id="delete-permission"
              checked={permissions.delete}
              onCheckedChange={(checked) => 
                setPermissions(prev => ({ ...prev, delete: checked }))
              }
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={handleShare} 
        className="w-full" 
        disabled={!permissions.view}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Medication
      </Button>
    </div>
  );
};

interface SharedMedicationControlsProps {
  sharedMedication: SharedMedication;
  onUpdatePermissions: (id: string, permissions: { view: boolean; edit: boolean; delete: boolean }) => void;
  onStopSharing: (id: string) => void;
}

const SharedMedicationControls: React.FC<SharedMedicationControlsProps> = ({
  sharedMedication,
  onUpdatePermissions,
  onStopSharing
}) => {
  const [permissions, setPermissions] = useState(sharedMedication.sharing_permissions);

  const handleUpdatePermissions = () => {
    onUpdatePermissions(sharedMedication.id, permissions);
  };

  const hasChanges = () => {
    return JSON.stringify(permissions) !== JSON.stringify(sharedMedication.sharing_permissions);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Current Permissions</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="view-permission-edit" className="text-sm">View medication details</Label>
            </div>
            <Switch
              id="view-permission-edit"
              checked={permissions.view}
              onCheckedChange={(checked) => 
                setPermissions(prev => ({ ...prev, view: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="edit-permission-edit" className="text-sm">Edit medication</Label>
            </div>
            <Switch
              id="edit-permission-edit"
              checked={permissions.edit}
              onCheckedChange={(checked) => 
                setPermissions(prev => ({ ...prev, edit: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="delete-permission-edit" className="text-sm">Delete medication</Label>
            </div>
            <Switch
              id="delete-permission-edit"
              checked={permissions.delete}
              onCheckedChange={(checked) => 
                setPermissions(prev => ({ ...prev, delete: checked }))
              }
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {hasChanges() && (
          <Button 
            onClick={handleUpdatePermissions} 
            size="sm"
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Update
          </Button>
        )}
        
        <Button 
          onClick={() => onStopSharing(sharedMedication.id)} 
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Stop Sharing
        </Button>
      </div>
    </div>
  );
};

export default MedicationSharingSheet;