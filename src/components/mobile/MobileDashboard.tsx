import React, { useState } from 'react';
import { Camera, Plus, Pill, Bell, Users, Activity, Scan, Heart, ShieldCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { MobileButton } from '@/components/ui/mobile/MobileButton';
import { TranslatedText } from '@/components/TranslatedText';
import { useAuth } from '@/hooks/useAuth';
import QuickStatsCards from './QuickStatsCards';
import RecentScansCarousel from './RecentScansCarousel';
import QuickActionCards from './QuickActionCards';
import TodaysOverview from './TodaysOverview';
import EnhancedFAB from './EnhancedFAB';

interface MobileDashboardProps {
  onScanPress: () => void;
  language: string;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ onScanPress, language }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFABMenu, setShowFABMenu] = useState(false);

  const handleEmergencyAccess = () => {
    // Quick access to critical medications
    navigate('/medications?filter=critical');
  };

  const handleVoiceSearch = () => {
    // Voice search functionality (Phase 3)
    console.log('Voice search activated');
  };

  return (
    <>
      {/* Welcome Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              <TranslatedText translationKey="dashboard.welcome" fallback="Good morning" />
            </h1>
            <p className="text-base text-muted-foreground">
              {user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-medical flex items-center justify-center shadow-medical">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Today's Overview */}
      <TodaysOverview />

      {/* Quick Stats */}
      <QuickStatsCards />

      {/* Central Scan Button */}
      <div className="px-4 py-6">
        <MobileButton
          size="xl"
          variant="scan"
          onClick={onScanPress}
          className="w-full h-20 text-lg font-semibold relative overflow-hidden group"
          haptic
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary opacity-90 group-active:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <span className="text-white">
              <TranslatedText translationKey="scanner.scanMedication" fallback="Scan Medication" />
            </span>
          </div>
          
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-lg opacity-60">
            <div className="absolute inset-0 rounded-lg animate-medical-glow bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </MobileButton>
      </div>

      {/* Quick Actions */}
      <QuickActionCards />

      {/* Recent Scans */}
      <RecentScansCarousel />

      {/* Enhanced FAB */}
      <EnhancedFAB 
        onScanPress={onScanPress}
        onVoicePress={handleVoiceSearch}
        onEmergencyPress={handleEmergencyAccess}
        isMenuOpen={showFABMenu}
        onMenuToggle={() => setShowFABMenu(!showFABMenu)}
      />
    </>
  );
};

export default MobileDashboard;