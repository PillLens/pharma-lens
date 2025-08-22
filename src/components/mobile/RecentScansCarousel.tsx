import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Pill, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { formatDistanceToNow } from 'date-fns';

const RecentScansCarousel: React.FC = () => {
  const navigate = useNavigate();

  // Mock recent scans data
  const recentScans = [
    {
      id: '1',
      medicationName: 'Paracetamol 500mg',
      status: 'identified',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'OTC',
      confidence: 95
    },
    {
      id: '2',
      medicationName: 'Unknown Medication',
      status: 'unknown',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'Unknown',
      confidence: 0
    },
    {
      id: '3',
      medicationName: 'Aspirin 100mg',
      status: 'identified',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'Rx',
      confidence: 89
    },
    {
      id: '4',
      medicationName: 'Ibuprofen 200mg',
      status: 'identified',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      type: 'OTC',
      confidence: 92
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'identified':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'unknown':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Pill className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'identified':
        return 'success';
      case 'unknown':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleViewAll = () => {
    navigate('/history');
  };

  const handleScanClick = (scanId: string) => {
    navigate(`/history?scan=${scanId}`);
  };

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          <TranslatedText translationKey="dashboard.recentScans" fallback="Recent Scans" />
        </h2>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-colors"
        >
          <TranslatedText translationKey="dashboard.viewAll" fallback="View All" />
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {recentScans.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recentScans.map((scan) => (
            <MobileCard
              key={scan.id}
              variant={getStatusVariant(scan.status) as any}
              interactive
              onClick={() => handleScanClick(scan.id)}
              className="min-w-[280px] flex-shrink-0"
            >
              <MobileCardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(scan.status)}
                    <Badge variant={scan.type === 'Rx' ? 'default' : 'secondary'} className="text-xs">
                      {scan.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(scan.timestamp, { addSuffix: true })}
                  </div>
                </div>
                <MobileCardTitle className="text-base line-clamp-1">
                  {scan.medicationName}
                </MobileCardTitle>
              </MobileCardHeader>
              <MobileCardContent>
                {scan.status === 'identified' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      <TranslatedText translationKey="scanner.confidence" fallback="Confidence" />
                    </span>
                    <span className="text-xs font-medium text-success">
                      {scan.confidence}%
                    </span>
                  </div>
                )}
                {scan.status === 'unknown' && (
                  <MobileCardDescription className="text-xs">
                    <TranslatedText 
                      translationKey="scanner.unknownMedication" 
                      fallback="Tap to try scanning again or add manually" 
                    />
                  </MobileCardDescription>
                )}
              </MobileCardContent>
            </MobileCard>
          ))}
        </div>
      ) : (
        <MobileCard variant="outline" className="text-center py-8">
          <MobileCardContent>
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <MobileCardTitle className="text-base mb-2">
              <TranslatedText translationKey="dashboard.noScans" fallback="No recent scans" />
            </MobileCardTitle>
            <MobileCardDescription>
              <TranslatedText 
                translationKey="dashboard.noScansDescription" 
                fallback="Start by scanning your first medication" 
              />
            </MobileCardDescription>
          </MobileCardContent>
        </MobileCard>
      )}
    </div>
  );
};

export default RecentScansCarousel;