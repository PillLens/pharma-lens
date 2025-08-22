import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MedicationManagement from '@/components/MedicationManagement';
import MobileLayout from '@/components/MobileLayout';
import EnhancedMobileLayout from '@/components/EnhancedMobileLayout';
import { useIsMobile } from '@/hooks/use-mobile';

const MedicationManager: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const content = (
    <div className={`min-h-screen ${!isMobile ? 'bg-gradient-to-br from-blue-50 to-indigo-100 p-4' : ''}`}>
      <div className={!isMobile ? 'max-w-4xl mx-auto' : ''}>
        {/* Header - Only show on desktop */}
        {!isMobile && (
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
          </div>
        )}

        {/* Main Content */}
        <MedicationManagement />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <EnhancedMobileLayout title="Medications">
        {content}
      </EnhancedMobileLayout>
    );
  }

  return content;
};

export default MedicationManager;