import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useMedicationHistory } from '@/hooks/useMedicationHistory';
import { toast } from 'sonner';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import SwipeableCard from '@/components/mobile/SwipeableCard';
import MobileMedicationCard from '@/components/mobile/MobileMedicationCard';
import { MobileCard } from '@/components/ui/mobile/MobileCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/medications/EmptyState';
import MedicationDetailsSheet from '@/components/medications/MedicationDetailsSheet';
import MedicationFormSheet from '@/components/medications/MedicationFormSheet';
import MedicationFloatingActionButton from '@/components/medications/MedicationFloatingActionButton';
import { UserMedication } from '@/hooks/useMedicationHistory';

const MedicationManager: React.FC = () => {
  const { t } = useTranslation();
  const { 
    medications, 
    loading, 
    addMedication, 
    updateMedication, 
    removeMedication,
    refetch
  } = useMedicationHistory();

  // Modal states
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<UserMedication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<UserMedication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh handler for pull-to-refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success(t('medications.refreshed'));
    } catch (error) {
      toast.error(t('medications.refreshError'));
    }
  };

  // Add medication handler
  const handleAddMedication = async (data: Partial<UserMedication>) => {
    setIsSubmitting(true);
    try {
      await addMedication(data as Omit<UserMedication, 'id' | 'created_at'>);
      toast.success(t('medications.medicationAdded'));
      setIsAddSheetOpen(false);
    } catch (error) {
      toast.error('Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update medication handler
  const handleUpdateMedication = async (data: Partial<UserMedication>) => {
    if (!selectedMedication) return;
    
    setIsSubmitting(true);
    try {
      await updateMedication(selectedMedication.id, data);
      toast.success(t('medications.medicationUpdated'));
      setIsEditSheetOpen(false);
      setSelectedMedication(null);
    } catch (error) {
      toast.error('Failed to update medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete medication handler
  const handleDeleteMedication = async () => {
    if (!medicationToDelete) return;
    
    try {
      await removeMedication(medicationToDelete.id);
      toast.success(t('medications.medicationDeleted'));
      setMedicationToDelete(null);
    } catch (error) {
      toast.error('Failed to delete medication');
    }
  };

  // Card interaction handlers
  const handleCardTap = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setIsDetailsSheetOpen(true);
  };

  const handleEditFromDetails = () => {
    setIsDetailsSheetOpen(false);
    setIsEditSheetOpen(true);
  };

  const handleEdit = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (medication: UserMedication) => {
    setMedicationToDelete(medication);
  };

  const handleToggleActive = async (medication: UserMedication) => {
    try {
      await updateMedication(medication.id, { is_active: !medication.is_active });
      toast.success(`Medication ${medication.is_active ? 'paused' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update medication status');
    }
  };

  // Skeleton loading component
  const SkeletonCard = () => (
    <MobileCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </MobileCard>
  );

  // Mobile-first layout
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                {t('medications.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('medications.subtitle')}
              </p>
            </div>
            
            {/* Add Button */}
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              size="sm"
              className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] min-w-[44px] h-[44px]"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 pb-safe-area-bottom">
          {/* Stats Bar */}
          {!loading && medications.length > 0 && (
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 rounded-xl bg-card shadow-sm border">
                    <span className="text-sm font-medium text-foreground">
                      {medications.length} {medications.length === 1 ? t('medications.medication') : t('medications.medications')}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium text-green-600">
                      {medications.filter(m => m.is_active).length} {t('medications.active')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {loading ? (
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : medications.length === 0 ? (
            <div className="pt-8">
              <EmptyState onAddClick={() => setIsAddSheetOpen(true)} />
            </div>
          ) : (
            <div className="space-y-3 pt-2 pb-6">
              {medications.map((medication) => (
                  <SwipeableCard
                  key={medication.id}
                  onDelete={() => handleDelete(medication)}
                  className="rounded-2xl shadow-md hover:shadow-lg border border-border/50 transition-all duration-200"
                >
                  <div 
                    onClick={() => handleCardTap(medication)}
                    className="min-h-[44px] active:scale-[0.98] transition-transform duration-200 cursor-pointer"
                  >
                    <MobileMedicationCard
                      medication={medication}
                      onEdit={() => handleEdit(medication)}
                      onDelete={() => handleDelete(medication)}
                      onToggleActive={() => handleToggleActive(medication)}
                    />
                  </div>
                </SwipeableCard>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      {!loading && (
        <MedicationFloatingActionButton
          onClick={() => setIsAddSheetOpen(true)}
        />
      )}

      {/* Bottom Sheets */}
      <MedicationFormSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSave={handleAddMedication}
        isLoading={isSubmitting}
      />

      <MedicationFormSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        medication={selectedMedication}
        onSave={handleUpdateMedication}
        isLoading={isSubmitting}
      />

      <MedicationDetailsSheet
        isOpen={isDetailsSheetOpen}
        onClose={() => setIsDetailsSheetOpen(false)}
        medication={selectedMedication}
        onEdit={handleEditFromDetails}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!medicationToDelete} onOpenChange={() => setMedicationToDelete(null)}>
        <AlertDialogContent className="mx-4 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('medications.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('medications.confirmDeleteText')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl flex-1">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMedication} 
              className="bg-destructive text-destructive-foreground rounded-xl flex-1"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MedicationManager;