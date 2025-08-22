import React, { useState } from 'react';
import { Plus, Pill, Clock, Heart, Activity, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useMedicationHistory } from '@/hooks/useMedicationHistory';
import { toast } from 'sonner';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import SwipeableCard from '@/components/mobile/SwipeableCard';
import EnhancedMedicationCard from '@/components/mobile/EnhancedMedicationCard';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/medications/EmptyState';
import MedicationDetailsSheet from '@/components/medications/MedicationDetailsSheet';
import MedicationFormSheet from '@/components/medications/MedicationFormSheet';
import { UserMedication } from '@/hooks/useMedicationHistory';
import EnhancedMobileNavigation from '@/components/EnhancedMobileNavigation';

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

  // States
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<UserMedication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<UserMedication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats calculations
  const activeMeds = medications.filter(m => m.is_active).length;
  const totalMeds = medications.length;
  const expiringSoon = medications.filter(m => {
    if (!m.end_date) return false;
    const endDate = new Date(m.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }).length;

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Medications refreshed');
    } catch (error) {
      toast.error('Failed to refresh medications');
    }
  };

  const handleAddMedication = async (data: Partial<UserMedication>) => {
    setIsSubmitting(true);
    try {
      await addMedication(data as Omit<UserMedication, 'id' | 'created_at'>);
      toast.success('Medication added successfully');
      setIsAddSheetOpen(false);
    } catch (error) {
      toast.error('Failed to add medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMedication = async (data: Partial<UserMedication>) => {
    if (!selectedMedication) return;
    
    setIsSubmitting(true);
    try {
      await updateMedication(selectedMedication.id, data);
      toast.success('Medication updated successfully');
      setIsEditSheetOpen(false);
      setSelectedMedication(null);
    } catch (error) {
      toast.error('Failed to update medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedication = async () => {
    if (!medicationToDelete) return;
    
    try {
      await removeMedication(medicationToDelete.id);
      toast.success('Medication deleted');
      setMedicationToDelete(null);
    } catch (error) {
      toast.error('Failed to delete medication');
    }
  };

  const handleCardTap = (medication: UserMedication) => {
    setSelectedMedication(medication);
    setIsDetailsSheetOpen(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 shadow-lg">
        <div className="px-6 py-6 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  My Medications
                </h1>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track and manage your daily medications
              </p>
            </div>
            
            <Button
              onClick={() => setIsAddSheetOpen(true)}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 border-0"
            >
              <Plus className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        <PullToRefresh onRefresh={handleRefresh}>
          {/* Premium Stats Cards */}
          {!loading && medications.length > 0 && (
            <div className="py-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/30 dark:border-blue-500/20">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <Pill className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {totalMeds}
                    </p>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                      Total
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 backdrop-blur-sm rounded-2xl p-4 border border-green-200/30 dark:border-green-500/20">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {activeMeds}
                    </p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">
                      Active
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/20 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/30 dark:border-amber-500/20">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {expiringSoon}
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                      Expiring
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg animate-pulse border border-white/20 dark:border-slate-700/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-40 bg-slate-200/50 dark:bg-slate-700/50" />
                      <Skeleton className="h-4 w-24 bg-slate-200/50 dark:bg-slate-700/50" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-full bg-slate-200/50 dark:bg-slate-700/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-20 bg-slate-200/50 dark:bg-slate-700/50" />
                    <Skeleton className="h-4 w-24 bg-slate-200/50 dark:bg-slate-700/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : medications.length === 0 ? (
            <div className="py-16">
              <EmptyState onAddClick={() => setIsAddSheetOpen(true)} />
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {medications.map((medication, index) => (
                <div
                  key={medication.id}
                  className="transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
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
        </PullToRefresh>
      </main>

      {/* Premium Floating Action Button */}
      {!loading && (
        <Button
          onClick={() => setIsAddSheetOpen(true)}
          className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-300 active:scale-90 border-0"
        >
          <Plus className="w-7 h-7 text-white" />
        </Button>
      )}

      {/* Bottom Navigation */}
      <EnhancedMobileNavigation />

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
        onEdit={() => {
          setIsDetailsSheetOpen(false);
          setIsEditSheetOpen(true);
        }}
      />

      {/* Premium Delete Modal */}
      {medicationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMedicationToDelete(null)}></div>
          <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/30 p-8 max-w-sm mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <Pill className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Delete Medication?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
                This action cannot be undone. The medication will be permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setMedicationToDelete(null)}
                  className="flex-1 rounded-2xl border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteMedication}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MedicationManager;