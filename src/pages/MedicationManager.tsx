import React, { useState } from 'react';
import { Plus, Clock, Pill } from 'lucide-react';
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
import EnhancedMedicationCard from '@/components/mobile/EnhancedMedicationCard';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile Header */}      
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="px-4 py-4 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('medications.title')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t('medications.subtitle')}
              </p>
            </div>
            
            {/* Add Button */}
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              size="sm"
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 min-w-[44px] h-[44px] border-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-safe-area-bottom">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4">
            {/* Stats Bar - Enhanced Cards */}
            {!loading && medications.length > 0 && (
              <div className="py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Pill className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {medications.length}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {medications.length === 1 ? t('medications.medication') : t('medications.medications')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {medications.filter(m => m.is_active).length}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {t('medications.active')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            {loading ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-2">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-32"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      </div>
                      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : medications.length === 0 ? (
              <div className="py-8">
                <EmptyState onAddClick={() => setIsAddSheetOpen(true)} />
              </div>
            ) : (
              <div className="space-y-4 py-4 pb-24">
                {medications.map((medication) => (
                  <div
                    key={medication.id}
                    className="transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    onClick={() => handleCardTap(medication)}
                  >
                    <SwipeableCard onDelete={() => handleDelete(medication)}>
                      <EnhancedMedicationCard
                        medication={medication}
                        onEdit={() => handleEdit(medication)}
                        onDelete={() => handleDelete(medication)}
                        onToggleActive={() => handleToggleActive(medication)}
                      />
                    </SwipeableCard>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>
      </main>

      {/* Floating Action Button */}
      {!loading && (
        <Button
          onClick={() => setIsAddSheetOpen(true)}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-200 active:scale-95 border-0"
        >
          <Plus className="w-6 h-6" />
        </Button>
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
      <div className={`fixed inset-0 z-50 ${medicationToDelete ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMedicationToDelete(null)}></div>
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 max-w-sm mx-auto">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {t('medications.confirmDelete')}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {t('medications.confirmDeleteText')}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setMedicationToDelete(null)}
              className="flex-1 rounded-xl border-slate-300 dark:border-slate-600"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDeleteMedication}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationManager;