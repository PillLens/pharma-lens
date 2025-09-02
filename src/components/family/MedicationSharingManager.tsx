import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Pill, Users, Share2, Eye, Edit, Trash2, Shield } from 'lucide-react';
import { familySharingService } from '@/services/familySharingService';
import { supabase } from '@/integrations/supabase/client';

interface MedicationSharingManagerProps {
  familyGroups: any[];
  currentUserId: string;
}

interface SharedMedication {
  id: string;
  medication_id: string;
  family_group_id: string;
  shared_by: string;
  sharing_permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
  created_at: string;
  medication_name?: string;
  group_name?: string;
  shared_by_name?: string;
}

interface UserMedication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  is_active: boolean;
}

export const MedicationSharingManager: React.FC<MedicationSharingManagerProps> = ({
  familyGroups,
  currentUserId
}) => {
  const [sharedMedications, setSharedMedications] = useState<SharedMedication[]>([]);
  const [userMedications, setUserMedications] = useState<UserMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<UserMedication | null>(null);
  const [sharePermissions, setSharePermissions] = useState({
    view: true,
    edit: false,
    delete: false
  });
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [familyGroups, currentUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSharedMedications(),
        loadUserMedications()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load medication data');
    } finally {
      setLoading(false);
    }
  };

  const loadSharedMedications = async () => {
    if (!familyGroups.length) return;

    const groupIds = familyGroups.map(group => group.id);
    
    const { data, error } = await supabase
      .from('shared_medications')
      .select(`
        *,
        user_medications:medication_id (medication_name),
        family_groups:family_group_id (name),
        profiles:shared_by (display_name, email)
      `)
      .in('family_group_id', groupIds);

    if (error) {
      console.error('Error loading shared medications:', error);
      return;
    }

      const formattedData = data?.map(item => ({
        ...item,
        sharing_permissions: typeof item.sharing_permissions === 'string' 
          ? JSON.parse(item.sharing_permissions as string)
          : item.sharing_permissions || { view: true, edit: false, delete: false },
        medication_name: (item.user_medications as any)?.medication_name || 'Unknown Medication',
        group_name: (item.family_groups as any)?.name || 'Unknown Group',
        shared_by_name: (item.profiles as any)?.display_name || 
                       (item.profiles as any)?.email?.split('@')[0] || 'Unknown User'
      })) || [];

    setSharedMedications(formattedData);
  };

  const loadUserMedications = async () => {
    const { data, error } = await supabase
      .from('user_medications')
      .select('id, medication_name, dosage, frequency, is_active')
      .eq('user_id', currentUserId)
      .eq('is_active', true);

    if (error) {
      console.error('Error loading user medications:', error);
      return;
    }

    setUserMedications(data || []);
  };

  const handleShareMedication = async () => {
    if (!selectedMedication || selectedGroups.length === 0) {
      toast.error('Please select a medication and at least one family group');
      return;
    }

    try {
      let successCount = 0;
      
      for (const groupId of selectedGroups) {
        const { data, error } = await supabase
          .from('shared_medications')
          .insert({
            medication_id: selectedMedication.id,
            family_group_id: groupId,
            shared_by: currentUserId,
            sharing_permissions: sharePermissions
          });
        
        if (!error) successCount++;
      }
      
      if (successCount > 0) {
        toast.success(`Medication shared with ${successCount} group(s)`);
        setShareDialogOpen(false);
        setSelectedMedication(null);
        setSelectedGroups([]);
        loadSharedMedications();
      } else {
        toast.error('Failed to share medication');
      }
    } catch (error) {
      console.error('Error sharing medication:', error);
      toast.error('Failed to share medication');
    }
  };

  const handleUpdatePermissions = async (sharedMedId: string, permissions: any) => {
    try {
      const { error } = await supabase
        .from('shared_medications')
        .update({ sharing_permissions: permissions })
        .eq('id', sharedMedId);
      
      if (!error) {
        toast.success('Permissions updated');
        loadSharedMedications();
      } else {
        toast.error('Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  const handleStopSharing = async (sharedMedId: string) => {
    try {
      const { error } = await supabase
        .from('shared_medications')
        .delete()
        .eq('id', sharedMedId)
        .eq('shared_by', currentUserId);
      
      if (!error) {
        toast.success('Stopped sharing medication');
        loadSharedMedications();
      } else {
        toast.error('Failed to stop sharing');
      }
    } catch (error) {
      console.error('Error stopping sharing:', error);
      toast.error('Failed to stop sharing');
    }
  };

  const openShareDialog = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setSharePermissions({ view: true, edit: false, delete: false });
    setSelectedGroups([]);
    setShareDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading medication sharing data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Your Medications - Available to Share */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Your Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userMedications.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Medications Found</h3>
              <p className="text-muted-foreground">
                Add medications to your profile to share them with family members.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userMedications.map((medication) => (
                <div key={medication.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{medication.medication_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {medication.dosage} • {medication.frequency}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openShareDialog(medication)}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currently Shared Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sharedMedications.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Shared Medications</h3>
              <p className="text-muted-foreground">
                Start sharing medications with your family to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedMedications.map((shared) => (
                <div key={shared.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{shared.medication_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Shared by {shared.shared_by_name} in {shared.group_name}
                      </p>
                    </div>
                    {shared.shared_by === currentUserId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStopSharing(shared.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Stop Sharing
                      </Button>
                    ) : null}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">View</span>
                      <Badge variant={shared.sharing_permissions.view ? "default" : "secondary"}>
                        {shared.sharing_permissions.view ? "Allowed" : "Denied"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Edit</span>
                      <Badge variant={shared.sharing_permissions.edit ? "default" : "secondary"}>
                        {shared.sharing_permissions.edit ? "Allowed" : "Denied"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Delete</span>
                      <Badge variant={shared.sharing_permissions.delete ? "default" : "secondary"}>
                        {shared.sharing_permissions.delete ? "Allowed" : "Denied"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Medication Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Medication</DialogTitle>
          </DialogHeader>
          
          {selectedMedication && (
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedMedication.medication_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMedication.dosage} • {selectedMedication.frequency}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Select Family Groups</h4>
                <div className="space-y-2">
                  {familyGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={group.id}
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedGroups([...selectedGroups, group.id]);
                          } else {
                            setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                          }
                        }}
                      />
                      <label htmlFor={group.id} className="text-sm font-medium">
                        {group.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Sharing Permissions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">View medication details</span>
                    </div>
                    <Switch
                      checked={sharePermissions.view}
                      onCheckedChange={(checked) => 
                        setSharePermissions(prev => ({ ...prev, view: checked }))
                      }
                      disabled // View is always required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <span className="text-sm">Edit medication schedule</span>
                    </div>
                    <Switch
                      checked={sharePermissions.edit}
                      onCheckedChange={(checked) => 
                        setSharePermissions(prev => ({ ...prev, edit: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm">Delete medication entries</span>
                    </div>
                    <Switch
                      checked={sharePermissions.delete}
                      onCheckedChange={(checked) => 
                        setSharePermissions(prev => ({ ...prev, delete: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShareMedication}>
                  Share Medication
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};