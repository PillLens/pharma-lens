import React, { useState } from 'react';
import { Plus, Pill, Clock, Activity, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { useMedicationHistory } from '@/hooks/useMedicationHistory';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfessionalMobileLayout from '@/components/mobile/ProfessionalMobileLayout';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import SwipeableCard from '@/components/mobile/SwipeableCard';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/medications/EmptyState';
import MedicationDetailsSheet from '@/components/medications/MedicationDetailsSheet';
import MedicationFormSheet from '@/components/medications/MedicationFormSheet';
import EnhancedMedicationCard from '@/components/mobile/EnhancedMedicationCard';
import { UserMedication } from '@/hooks/useMedicationHistory';

const MedicationManager: React.FC = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
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

  // Desktop content
  const desktopContent = (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-secondary-light/10">
      {/* Desktop Header */}
      <header className="px-4 py-6 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Pill className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Medications</h1>
              <p className="text-sm text-muted-foreground">Track and manage your medications</p>
            </div>
          </div>
          <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Medication
          </Button>
        </div>
      </header>

      {/* Desktop Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {!loading && medications.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <MobileCard variant="medical" className="text-center">
              <MobileCardHeader>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <MobileCardTitle className="text-2xl font-bold text-primary">
                  {totalMeds}
                </MobileCardTitle>
                <MobileCardDescription>Total Medications</MobileCardDescription>
              </MobileCardHeader>
            </MobileCard>
            
            <MobileCard variant="medical" className="text-center">
              <MobileCardHeader>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <MobileCardTitle className="text-2xl font-bold text-primary">
                  {activeMeds}
                </MobileCardTitle>
                <MobileCardDescription>Active</MobileCardDescription>
              </MobileCardHeader>
            </MobileCard>
            
            <MobileCard variant="medical" className="text-center">
              <MobileCardHeader>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <MobileCardTitle className="text-2xl font-bold text-primary">
                  {expiringSoon}
                </MobileCardTitle>
                <MobileCardDescription>Expiring Soon</MobileCardDescription>
              </MobileCardHeader>
            </MobileCard>
          </div>
        )}

        {/* Medications List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <MobileCard key={i} className="animate-pulse">
                <MobileCardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </MobileCardContent>
              </MobileCard>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <EmptyState onAddClick={() => setIsAddSheetOpen(true)} />
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => (
              <div
                key={medication.id}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => handleCardTap(medication)}
              >
                <EnhancedMedicationCard
                  medication={medication}
                  onEdit={() => handleEdit(medication)}
                  onDelete={() => handleDelete(medication)}
                  onToggleActive={() => handleToggleActive(medication)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  // Mobile content with proper layout
  const mobileContent = (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Mobile Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Medications</h1>
              <p className="text-base text-muted-foreground">Track and manage your daily medications</p>
            </div>
            <MobileButton
              size="sm"
              onClick={() => setIsAddSheetOpen(true)}
              className="w-12 h-12 rounded-full"
              haptic
            >
              <Plus className="w-5 h-5" />
            </MobileButton>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && medications.length > 0 && (
          <div className="px-4 pb-6">
            <div className="grid grid-cols-3 gap-3">
              <MobileCard variant="medical" className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-medical">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-bold text-primary">{totalMeds}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </MobileCard>
              
              <MobileCard variant="medical" className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-medical">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-bold text-primary">{activeMeds}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </MobileCard>
              
              <MobileCard variant="medical" className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-medical">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-bold text-primary">{expiringSoon}</p>
                <p className="text-xs text-muted-foreground">Expiring</p>
              </MobileCard>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <MobileCard key={i} variant="glass" className="animate-pulse">
                  <MobileCardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40 bg-muted/50" />
                        <Skeleton className="h-4 w-24 bg-muted/50" />
                      </div>
                      <Skeleton className="h-8 w-16 rounded-full bg-muted/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-20 bg-muted/50" />
                      <Skeleton className="h-4 w-24 bg-muted/50" />
                    </div>
                  </MobileCardContent>
                </MobileCard>
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
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      {!loading && (
        <FloatingActionButton onClick={() => setIsAddSheetOpen(true)} />
      )}
    </>
  );

  const content = isMobile ? (
    <ProfessionalMobileLayout title="Medications" showHeader={false}>
      {mobileContent}
      
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

      {/* Delete Confirmation Modal */}
      {medicationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMedicationToDelete(null)}></div>
          <MobileCard variant="glass" className="relative max-w-sm mx-auto p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-medical">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <MobileCardTitle className="mb-2">Delete Medication?</MobileCardTitle>
              <MobileCardDescription className="mb-6">
                This action cannot be undone. The medication will be permanently removed.
              </MobileCardDescription>
              <div className="flex gap-3">
                <MobileButton
                  variant="outline"
                  onClick={() => setMedicationToDelete(null)}
                  className="flex-1"
                >
                  Cancel
                </MobileButton>
                <MobileButton
                  variant="destructive"
                  onClick={handleDeleteMedication}
                  className="flex-1"
                >
                  Delete
                </MobileButton>
              </div>
            </div>
          </MobileCard>
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
    </ProfessionalMobileLayout>
  ) : desktopContent;

  return content;
};

export default MedicationManager;