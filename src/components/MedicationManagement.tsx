import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Calendar, User, Pill } from 'lucide-react';
import { useMedicationHistory, type UserMedication } from '@/hooks/useMedicationHistory';
import { toast } from 'sonner';

const MedicationManagement: React.FC = () => {
  const { medications, loading, addMedication, updateMedication, removeMedication } = useMedicationHistory();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<UserMedication | null>(null);
  const [formData, setFormData] = useState({
    medication_name: '',
    generic_name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    prescriber: '',
    notes: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      medication_name: '',
      generic_name: '',
      dosage: '',
      frequency: '',
      start_date: '',
      end_date: '',
      prescriber: '',
      notes: '',
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_name || !formData.dosage || !formData.frequency || !formData.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingMedication) {
      const result = await updateMedication(editingMedication.id, formData);
      if (result) {
        setEditingMedication(null);
        resetForm();
      }
    } else {
      const result = await addMedication(formData);
      if (result) {
        setIsAddDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (medication: UserMedication) => {
    setEditingMedication(medication);
    setFormData({
      medication_name: medication.medication_name,
      generic_name: medication.generic_name || '',
      dosage: medication.dosage,
      frequency: medication.frequency,
      start_date: medication.start_date,
      end_date: medication.end_date || '',
      prescriber: medication.prescriber || '',
      notes: medication.notes || '',
      is_active: medication.is_active
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this medication?')) {
      await removeMedication(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const MedicationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medication_name">Brand Name *</Label>
          <Input
            id="medication_name"
            value={formData.medication_name}
            onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
            placeholder="e.g., Panadol"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="generic_name">Generic Name</Label>
          <Input
            id="generic_name"
            value={formData.generic_name}
            onChange={(e) => setFormData(prev => ({ ...prev, generic_name: e.target.value }))}
            placeholder="e.g., Paracetamol"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosage">Dosage *</Label>
          <Input
            id="dosage"
            value={formData.dosage}
            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
            placeholder="e.g., 500mg"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency *</Label>
          <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Once daily">Once daily</SelectItem>
              <SelectItem value="Twice daily">Twice daily</SelectItem>
              <SelectItem value="Three times daily">Three times daily</SelectItem>
              <SelectItem value="Four times daily">Four times daily</SelectItem>
              <SelectItem value="As needed">As needed</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prescriber">Prescriber</Label>
        <Input
          id="prescriber"
          value={formData.prescriber}
          onChange={(e) => setFormData(prev => ({ ...prev, prescriber: e.target.value }))}
          placeholder="Doctor's name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this medication"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Currently taking this medication</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {editingMedication ? 'Update Medication' : 'Add Medication'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditingMedication(null);
            setIsAddDialogOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Medications</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Pill className="h-6 w-6 text-blue-600" />
          My Medications
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
            </DialogHeader>
            <MedicationForm />
          </DialogContent>
        </Dialog>
      </div>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medications added</h3>
            <p className="text-gray-600 mb-4">Start by adding your current medications to track interactions and safety.</p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Medication
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {medications.map((medication) => (
            <Card key={medication.id} className={medication.is_active ? '' : 'opacity-75 bg-gray-50'}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{medication.medication_name}</h3>
                      {medication.generic_name && (
                        <p className="text-sm text-gray-600">({medication.generic_name})</p>
                      )}
                    </div>
                    <Badge variant={medication.is_active ? 'default' : 'secondary'}>
                      {medication.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(medication)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(medication.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Dosage:</span>
                    <p>{medication.dosage}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Frequency:</span>
                    <p>{medication.frequency}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Started:</span>
                    <p>{formatDate(medication.start_date)}</p>
                  </div>
                  {medication.end_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-600">Ended:</span>
                      <p>{formatDate(medication.end_date)}</p>
                    </div>
                  )}
                </div>
                
                {medication.prescriber && (
                  <div className="mt-3 flex items-center gap-1 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-600">Prescriber:</span>
                    <span>{medication.prescriber}</span>
                  </div>
                )}
                
                {medication.notes && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600 text-sm">Notes:</span>
                    <p className="text-sm text-gray-700 mt-1">{medication.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingMedication !== null} onOpenChange={() => setEditingMedication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          <MedicationForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationManagement;